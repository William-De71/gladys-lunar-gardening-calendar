// -----------------------------------------------------------------------------
// The lunar gardening calendar: every handler, registered on a Gladys client.
//
// A calendar integration (manifest `type: "calendar"`): a "Lunar gardening
// calendar" for every user who enabled it in "My calendars"
// (src/calendar.js), three scene triggers and a scene action
// (src/events.js, src/scheduler.js), two dashboard widgets (src/widgets.js).
// Everything comes from the almanac computed locally (src/almanac.js): no
// network, no key, no account.
//
// The clock ticks every 30 s: a new local day pushes the calendars (the window
// slides) and refreshes the widgets; the event hour fires the daily scene
// event. The timed triggers have their own timer, set to the next change.
//
// index.js only creates the SDK client; the tests drive this module with the
// fake Gladys of the SDK (test/app.test.js).
// -----------------------------------------------------------------------------

import { logger as sdkLogger } from '@gladysassistant/integration-sdk';
import { createAlmanac, segmentAt, trajectoryAt } from './almanac.js';
import { normalizeConfig, guessLanguage, AUTO_LANGUAGE } from './config.js';
import { createStore, DEFAULT_PATH } from './store.js';
import { createCalendarSync } from './calendar.js';
import { createScheduler } from './scheduler.js';
import { TRIGGERS, SCENE_ACTIONS, changeData, dailyData, gardenDayOutputs } from './events.js';
import { WIDGETS, ttlUntil, buildTodayWidget, buildWeekWidget } from './widgets.js';
import { addDays } from './dates.js';
import { all, isLanguage, t } from './i18n.js';
import { resolveTimezone, localDay, localMidnight, wallClock } from './time.js';

const TICK_MS = 30000;
const DAY_MS = 24 * 3600 * 1000;

/**
 * @description Register every handler of the integration on a Gladys client.
 * @param {object} gladys - A GladysIntegration (or the fake Gladys of the SDK).
 * @param {object} [options] - Options.
 * @param {Function} [options.now] - `() => Date` (tests).
 * @param {string} [options.timezone] - IANA timezone (default: TZ).
 * @param {string|null} [options.statePath] - File of the state (null: memory).
 * @param {Function} [options.sleep] - `(ms) => Promise` (tests).
 * @param {number} [options.tickMs] - Clock period, 0 for none (tests).
 * @param {object} [options.timers] - `{ setTimer, clearTimer }` of the scheduler (tests).
 * @param {object} [options.logger] - Logger.
 * @returns {{ tick: Function, stop: Function, scheduler: object }} Handles for the tests.
 * @example
 * createApp(new GladysIntegration());
 */
function createApp(
  gladys,
  {
    now = () => new Date(),
    timezone = resolveTimezone(),
    statePath = DEFAULT_PATH,
    sleep,
    tickMs = TICK_MS,
    timers = {},
    logger = sdkLogger,
  } = {},
) {
  const store = createStore({ path: statePath, logger });
  const cache = createAlmanac({ timezone });
  const almanac = (from, to) => cache.get(from, to);
  let config = normalizeConfig();
  let lastDay = null;
  let timer = null;
  let running = Promise.resolve();
  let lastStatus = null;

  const today = () => localDay(now(), timezone);
  const textLanguage = () =>
    config.language === AUTO_LANGUAGE
      ? (store.language() ?? guessLanguage(timezone))
      : config.language;
  // The almanac of today and the next ten days (widgets, scenes).
  const nearAlmanac = () => {
    const start = localMidnight(today(), timezone);
    return almanac(start, start + 12 * DAY_MS);
  };

  const calendarSync = createCalendarSync(gladys, {
    today,
    almanac,
    timezone,
    options: () => ({ trajectory: config.calendarTrajectory, avoid: config.calendarAvoid }),
    ...(sleep ? { sleep } : {}),
    logger,
  });

  /** @description Ask Gladys to fetch the widgets again. */
  function refreshWidgets() {
    if (!gladys.connected) return;
    for (const key of Object.values(WIDGETS)) {
      try {
        gladys.requestWidgetRefresh(key);
      } catch (err) {
        logger.warn(`Unable to refresh the widget ${key}: ${err.message}`);
      }
    }
  }

  /** @description Show what the almanac says now in the Configuration screen. */
  async function reportStatus() {
    const at = now().getTime();
    const near = nearAlmanac();
    const segment = segmentAt(near, at);
    const period = trajectoryAt(near, at);
    const message = all('statusRunning', (language) => ({
      timezone,
      type: segment ? t(`type_${segment.type}`, language) : '',
      trajectory: period ? t(`trajectory_${period.trajectory}`, language).toLowerCase() : '',
    }));
    const signature = JSON.stringify(message);
    if (!gladys.connected || signature === lastStatus) return;
    lastStatus = signature;
    try {
      await gladys.setConnectionStatus(true, message);
    } catch (err) {
      lastStatus = null;
      logger.error('Unable to report the status', err);
    }
  }

  const scheduler = createScheduler({
    almanac,
    store,
    logger,
    now,
    ...(timers.setTimer ? { setTimer: timers.setTimer, clearTimer: timers.clearTimer } : {}),
    publish: async (change) => {
      if (!gladys.connected) return false;
      try {
        await gladys.publishSceneEvent(
          change.trigger,
          changeData(
            almanac(change.at - DAY_MS, change.at + 30 * DAY_MS),
            change,
            textLanguage(),
            timezone,
          ),
        );
        refreshWidgets();
        await reportStatus();
        return true;
      } catch (err) {
        logger.warn(`Scene event ${change.trigger} refused: ${err.message}`);
        return false;
      }
    },
  });

  /**
   * @description Fire the daily scene event, once the event hour is reached;
   * a refused event is fired again at the next tick.
   * @param {string} day - YYYY-MM-DD.
   */
  async function fireDaily(day) {
    if (!gladys.connected || store.fired() === day) return;
    if (wallClock(now(), timezone).hour < config.eventHour) return;
    try {
      await gladys.publishSceneEvent(
        TRIGGERS.DAILY_SUMMARY,
        dailyData(nearAlmanac(), day, textLanguage(), timezone),
      );
      store.setFired(day);
    } catch (err) {
      logger.warn(`Scene event of ${day} refused: ${err.message}`);
    }
  }

  /**
   * @description One look at the clock: a new day pushes the calendars and
   * refreshes the widgets, the event hour fires the daily scene event.
   * Never two at once.
   * @returns {Promise<void>}
   */
  function tick() {
    running = running.then(async () => {
      const day = today();
      if (day !== lastDay) {
        lastDay = day;
        await calendarSync.syncAll();
        refreshWidgets();
        await reportStatus();
      }
      await fireDaily(day);
    });
    running = running.catch((err) => logger.error('Clock round failed', err));
    return running;
  }

  /**
   * @description Apply a configuration: the calendars follow what they show.
   * @param {object} raw - The raw configuration.
   */
  async function applyConfig(raw) {
    config = normalizeConfig(raw ?? {});
    lastDay = null;
    refreshWidgets();
    await tick();
  }

  /**
   * @description Remember the language of a widget request.
   * @param {string} next - The language.
   */
  function rememberLanguage(next) {
    if (isLanguage(next) && next !== store.language()) {
      store.setLanguage(next);
    }
  }

  // --- Scene action ---------------------------------------------------------
  gladys.onSceneAction(SCENE_ACTIONS.GET_GARDEN_DAY, async (fields = {}) =>
    gardenDayOutputs(nearAlmanac(), today(), fields, textLanguage(), timezone),
  );

  // --- Widgets --------------------------------------------------------------
  gladys.onWidgetGet(WIDGETS.TODAY, async ({ language: lang } = {}) => {
    rememberLanguage(lang);
    const at = now().getTime();
    const near = nearAlmanac();
    const midnight = localMidnight(addDays(today(), 1), timezone);
    const segment = segmentAt(near, at);
    const change = Math.min(midnight, segment?.end ?? midnight);
    return buildTodayWidget({
      almanac: near,
      now: at,
      today: today(),
      language: isLanguage(lang) ? lang : textLanguage(),
      timezone,
      ttl: ttlUntil((change - at) / 1000),
    });
  });

  gladys.onWidgetGet(WIDGETS.WEEK, async ({ settings = {}, language: lang } = {}) => {
    rememberLanguage(lang);
    const at = now().getTime();
    return buildWeekWidget({
      almanac: nearAlmanac(),
      today: today(),
      language: isLanguage(lang) ? lang : textLanguage(),
      timezone,
      settings,
      ttl: ttlUntil((localMidnight(addDays(today(), 1), timezone) - at) / 1000),
    });
  });

  // --- Calendars and configuration ------------------------------------------
  gladys.onCalendarAccountUpdated(async (userSelector) => {
    await calendarSync.syncUser(userSelector);
  });

  gladys.onConfigUpdated(async (raw) => {
    await applyConfig(raw);
  });

  gladys.on('connected', async () => {
    // Calendars may have changed while disconnected: push everything again.
    calendarSync.forget();
    lastStatus = null;
    await applyConfig(gladys.config ?? {});
    await scheduler.start();
    logger.info(`connected, timezone ${timezone}`);
    if (tickMs > 0 && timer === null) {
      timer = setInterval(() => tick(), tickMs);
      timer.unref?.();
    }
  });

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    scheduler.stop();
  };

  gladys.handleShutdown(async (signal) => {
    logger.info(`Received ${signal} -> graceful shutdown`);
    stop();
    await running;
  });

  return { tick, stop, scheduler };
}

export { TICK_MS, createApp };

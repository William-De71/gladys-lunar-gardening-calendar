// -----------------------------------------------------------------------------
// The lunar gardening calendar in the Gladys calendar (manifest
// `type: "calendar"`).
//
// Every user who enabled the integration in "My calendars" gets one calendar,
// "Lunar gardening calendar", in the user's language, from 7 days back to 366
// days ahead:
//   - one timed event per day type ("Root day · Capricorn", 09:34 -> 18:20
//     two days later), with the advice in its description;
//   - one timed event per ascending or descending period (about 13.6 days),
//     unless turned off in the configuration;
//   - one all-day event per day to avoid ("Day to avoid: Perigee 14:32"),
//     unless turned off.
// Pushed at connection, when an account or the configuration changes, and at
// midnight (the window slides). The window of the push starts 30 days back:
// the core prunes only inside the window, so the old events are deleted as
// they leave, instead of piling up. The calendar is private when created: the
// user shares it with the household (and the scenes) from "My calendars".
//
// Limits of the core: 500 events per request (a year holds about 250), 30
// calendar writes per minute per integration (writes are spaced by 2.1 s).
//
// External ids: ext:<selector>:<user>:lunar-gardening                        (calendar)
//               ext:<selector>:<user>:type-<YYYY-MM-DD>-<constellation>      (day type)
//               ext:<selector>:<user>:trajectory-<YYYY-MM-DD>-<trajectory>   (period)
//               ext:<selector>:<user>:avoid-<YYYY-MM-DD>                     (day to avoid)
// The day is the local day the event starts: a new computation that moves an
// instant by a minute updates the event, it never duplicates it.
// -----------------------------------------------------------------------------

import { addDays } from './dates.js';
import { describeDay } from './almanac.js';
import { avoidReasons } from './garden.js';
import { clip, t } from './i18n.js';
import { localDay, localMidnight } from './time.js';

const HISTORY_DAYS = 7;
const PRUNE_DAYS = 30;
const AHEAD_DAYS = 366;
const WRITE_SPACING_MS = 2100;
const COLOR = '#2f9e44';

/**
 * @description The external id of the calendar of a user.
 * @param {object} gladys - SDK client.
 * @param {string} user - User selector.
 * @returns {string} The external id.
 */
const calendarId = (gladys, user) => gladys.externalId(`${user}:lunar-gardening`);

/**
 * @description The events of the window, in a language.
 * @param {object} gladys - SDK client.
 * @param {string} user - User selector.
 * @param {object} options - Options.
 * @param {object} options.almanac - An almanac covering the window.
 * @param {object} options.window - `{ from, to }`, YYYY-MM-DD, `to` excluded.
 * @param {string} options.language - The user's language.
 * @param {string} options.timezone - IANA timezone of the house.
 * @param {boolean} [options.trajectory] - With the ascending / descending periods.
 * @param {boolean} [options.avoid] - With the days to avoid.
 * @returns {object[]} The events.
 */
function buildEvents(
  gladys,
  user,
  { almanac, window, language, timezone, trajectory = true, avoid = true },
) {
  const from = localMidnight(window.from, timezone);
  const to = localMidnight(window.to, timezone);
  const inside = (entry) => entry.end > from && entry.start < to;
  const events = [];
  almanac.segments.filter(inside).forEach((segment) => {
    events.push({
      external_id: gladys.externalId(
        `${user}:type-${localDay(new Date(segment.start), timezone)}-${segment.constellation}`,
      ),
      name: clip(
        t('eventType', language, {
          type: t(`type_${segment.type}`, language),
          constellation: t(segment.constellation, language),
        }),
        200,
      ),
      description: clip(t(`advice_${segment.type}`, language), 1000),
      start: new Date(segment.start).toISOString(),
      end: new Date(segment.end).toISOString(),
      full_day: false,
    });
  });
  if (trajectory) {
    almanac.trajectories.filter(inside).forEach((period) => {
      events.push({
        external_id: gladys.externalId(
          `${user}:trajectory-${localDay(new Date(period.start), timezone)}-${period.trajectory}`,
        ),
        name: clip(t(`trajectory_${period.trajectory}`, language), 200),
        description: clip(t(`advice_${period.trajectory}`, language), 1000),
        start: new Date(period.start).toISOString(),
        end: new Date(period.end).toISOString(),
        full_day: false,
      });
    });
  }
  if (avoid) {
    const days = [
      ...new Set(
        almanac.unfavourable
          .filter((event) => event.at >= from && event.at < to)
          .map((event) => localDay(new Date(event.at), timezone)),
      ),
    ];
    days.forEach((day) => {
      const reasons = avoidReasons(describeDay(almanac, day, timezone), language, timezone);
      events.push({
        external_id: gladys.externalId(`${user}:avoid-${day}`),
        name: clip(t('eventAvoid', language, { reasons }), 200),
        description: clip(t('advice_avoid', language, { reasons }), 1000),
        start: day,
        end: addDays(day, 1),
        full_day: true,
      });
    });
  }
  return events;
}

/**
 * @description Create the calendar synchronizer.
 * @param {object} gladys - SDK client.
 * @param {object} options - Dependencies.
 * @param {Function} options.today - `() => 'YYYY-MM-DD'`.
 * @param {Function} options.almanac - `(from, to) => almanac` covering the span (ms).
 * @param {string} options.timezone - IANA timezone of the house.
 * @param {Function} options.options - `() => { trajectory, avoid }`: what the calendar shows.
 * @param {Function} [options.sleep] - Delay between two writes.
 * @param {object} [options.logger] - SDK logger.
 * @returns {{ syncAll: Function, syncUser: Function, forget: Function }} The synchronizer.
 */
function createCalendarSync(
  gladys,
  { today, almanac, timezone, options, sleep = defaultSleep, logger },
) {
  // Last content pushed per calendar: an unchanged calendar is not pushed again.
  const pushed = new Map();
  let lastWrite = 0;
  let queue = Promise.resolve();

  const write = async (call) => {
    const wait = lastWrite + WRITE_SPACING_MS - Date.now();
    if (wait > 0) {
      await sleep(wait);
    }
    lastWrite = Date.now();
    return call();
  };

  const syncAccount = async (account, { force = false } = {}) => {
    const user = account.user.selector;
    const language = account.user.language;
    const id = calendarId(gladys, user);
    const calendar = {
      external_id: id,
      name: t('calendarName', language),
      description: t('calendarDescription', language),
      color: COLOR,
    };
    const calendarKey = JSON.stringify(calendar);
    if (force || pushed.get(`calendar:${user}`) !== calendarKey) {
      await write(() => gladys.publishCalendars(user, [calendar]));
      pushed.set(`calendar:${user}`, calendarKey);
    }
    const mine = (await gladys.getCalendars(user)).find((c) => c.external_id === id);
    if (mine && mine.sync === false) {
      return;
    }
    const to = addDays(today(), AHEAD_DAYS);
    const window = { from: addDays(today(), -PRUNE_DAYS), to };
    const span = { from: addDays(today(), -HISTORY_DAYS), to };
    const events = buildEvents(gladys, user, {
      almanac: almanac(localMidnight(span.from, timezone), localMidnight(span.to, timezone)),
      window: span,
      language,
      timezone,
      ...options(),
    });
    const content = JSON.stringify([window, events]);
    if (!force && pushed.get(id) === content) {
      return;
    }
    try {
      await write(() => gladys.publishCalendarEvents(id, events, window));
      pushed.set(id, content);
    } catch (error) {
      // The user turned the sync of this calendar off meanwhile.
      if (error?.status === 403) {
        logger?.info(`calendar of ${user} not synchronized: ${error.message}`);
        return;
      }
      throw error;
    }
  };

  const enqueue = (job) => {
    const result = queue.then(job);
    queue = result.catch((error) => logger?.warn(`calendar sync failed: ${error.message}`));
    return result;
  };

  return {
    /**
     * @param {object} [options] - `{ force }`: push even what did not change.
     * @returns {Promise<void>} Every enabled user synchronized.
     */
    syncAll: (options) =>
      enqueue(async () => {
        for (const account of await gladys.getCalendarAccounts()) {
          await syncAccount(account, options);
        }
      }),
    /**
     * @param {string} userSelector - The user whose account changed.
     * @returns {Promise<void>} That user synchronized (nothing if disabled).
     */
    syncUser: (userSelector) =>
      enqueue(async () => {
        const account = (await gladys.getCalendarAccounts()).find(
          (candidate) => candidate.user.selector === userSelector,
        );
        if (account) {
          await syncAccount(account, { force: true });
        } else {
          // Disabled: the core already deleted the calendar.
          pushed.delete(`calendar:${userSelector}`);
          pushed.delete(calendarId(gladys, userSelector));
        }
      }),
    /** Forget what was pushed (reconnection: the core may have changed meanwhile). */
    forget: () => pushed.clear(),
  };
}

/**
 * @param {number} ms - Delay.
 * @returns {Promise<void>} Resolved after the delay.
 */
function defaultSleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms).unref?.();
  });
}

export {
  HISTORY_DAYS,
  PRUNE_DAYS,
  AHEAD_DAYS,
  WRITE_SPACING_MS,
  calendarId,
  buildEvents,
  createCalendarSync,
};

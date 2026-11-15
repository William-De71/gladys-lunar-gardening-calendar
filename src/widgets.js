// -----------------------------------------------------------------------------
// Dashboard widgets of the lunar gardening calendar (pure functions, reused
// by docs/illustrations/gen.mjs).
//
//   - `today`  the day type in force, until when, the next one, the
//              trajectory, the phase, the day to avoid, and the advice;
//   - `week`   one row a day (setting `days`, 3 to 10): day types and their
//              change, ascending or descending, day to avoid.
//
// Colors follow the day types (semantic colors only): fruit warning, root
// neutral, flower info, leaf success, day to avoid danger. Icons are the
// four elements of the method: fire (sun), earth (layers), air (wind), water
// (droplet). Content budget of a card: 2 texts (1 body), 1 status list.
// -----------------------------------------------------------------------------

import { addDays } from './dates.js';
import { describeDay, segmentAt, trajectoryAt } from './almanac.js';
import { adviceText, avoidReasons, untilText } from './garden.js';
import { clip, formatDay, t } from './i18n.js';
import { localTime } from './time.js';

const WIDGETS = { TODAY: 'today', WEEK: 'week' };
const WEEK_DAYS = { min: 3, max: 10, default: 7 };
const TTL = { min: 60, max: 3600 };
const COLORS = { fruit: 'warning', root: 'neutral', flower: 'info', leaf: 'success' };
const ICONS = { fruit: 'sun', root: 'layers', flower: 'wind', leaf: 'droplet' };
const ARROWS = { ascending: '↑', descending: '↓' };

/**
 * @description The cache duration of a content: until the next change or
 * midnight (a few seconds after), between 1 minute and 1 hour.
 * @param {number} secondsToChange - Seconds until the content changes.
 * @returns {number} The ttl in seconds.
 */
const ttlUntil = (secondsToChange) =>
  Math.min(TTL.max, Math.max(TTL.min, Math.round(secondsToChange) + 5));

/**
 * @description How many days the week widget lists.
 * @param {unknown} raw - The setting.
 * @returns {number} 3 to 10.
 */
function weekDays(raw) {
  const value = Number(raw);
  if (raw === '' || raw === null || raw === undefined || !Number.isFinite(value)) {
    return WEEK_DAYS.default;
  }
  return Math.min(WEEK_DAYS.max, Math.max(WEEK_DAYS.min, Math.round(value)));
}

/**
 * @description The "today" widget.
 * @param {object} options - Options.
 * @param {object} options.almanac - An almanac covering today and the next days.
 * @param {number} options.now - The current instant (ms).
 * @param {string} options.today - YYYY-MM-DD.
 * @param {string} options.language - The language.
 * @param {string} options.timezone - IANA timezone of the house.
 * @param {number} options.ttl - Cache duration.
 * @returns {object} The content.
 */
function buildTodayWidget({ almanac, now, today, language, timezone, ttl }) {
  const info = describeDay(almanac, today, timezone);
  const segment = segmentAt(almanac, now);
  const next = segment ? segmentAt(almanac, segment.end) : null;
  const period = trajectoryAt(almanac, now);
  const items = [];
  if (segment) {
    items.push({
      icon: ICONS[segment.type],
      label: clip(t(segment.constellation, language), 40),
      value: clip(untilText(segment.end, today, language, timezone), 40),
      color: COLORS[segment.type],
    });
  }
  if (next) {
    items.push({
      icon: ICONS[next.type],
      label: clip(t('widgetNext', language), 40),
      value: clip(`${t(`short_${next.type}`, language)} · ${t(next.constellation, language)}`, 40),
      color: COLORS[next.type],
    });
  }
  if (period) {
    items.push({
      icon: period.trajectory === 'ascending' ? 'arrow-up-right' : 'arrow-down-right',
      label: clip(t(`trajectory_${period.trajectory}`, language), 40),
      value: clip(untilText(period.end, today, language, timezone), 40),
    });
  }
  items.push({
    icon: 'moon',
    label: clip(
      info.quarter
        ? t(`quarter_${info.quarter.quarter}`, language)
        : t(info.phase.waxing ? 'phase_waxing' : 'phase_waning', language),
      40,
    ),
    value: info.quarter ? localTime(info.quarter.at, timezone) : `${info.phase.illumination} %`,
  });
  if (info.unfavourable.length > 0) {
    items.push({
      icon: 'alert-triangle',
      label: clip(t('widgetAvoid', language), 40),
      value: clip(avoidReasons(info, language, timezone), 40),
      color: 'danger',
    });
  }
  const heading = segment ? t(`type_${segment.type}`, language) : t('widgetMoon', language);
  return {
    ttl_seconds: ttl,
    components: [
      { type: 'text', variant: 'heading', text: clip(heading, 40) },
      { type: 'status', items },
      {
        type: 'text',
        variant: 'body',
        text: clip(
          adviceText({ ...info, type: segment?.type ?? info.type }, language, timezone),
          300,
        ),
      },
    ],
  };
}

/**
 * @description The value of a day row: "Root → Flower 18:20 ↑"; on a day to
 * avoid, the warning and the main type only ("To avoid · Root ↑"), short
 * enough for a narrow card.
 * @param {object} info - A day of describeDay.
 * @param {string} language - The language.
 * @param {string} timezone - IANA timezone.
 * @returns {string} The value.
 */
function dayRowValue(info, language, timezone) {
  const arrow = info.trajectory ? ` ${ARROWS[info.trajectory]}` : '';
  if (info.unfavourable.length > 0) {
    return `${t('widgetAvoid', language)} · ${t(`short_${info.type}`, language)}${arrow}`;
  }
  let types = info.segments.map((segment) => t(`short_${segment.type}`, language)).join(' → ');
  if (info.segments.length === 2) {
    types += ` ${localTime(info.segments[0].until, timezone)}`;
  }
  return `${types}${arrow}`;
}

/**
 * @description The "week" widget.
 * @param {object} options - Options.
 * @param {object} options.almanac - An almanac covering the days.
 * @param {string} options.today - YYYY-MM-DD.
 * @param {string} options.language - The language.
 * @param {string} options.timezone - IANA timezone of the house.
 * @param {object} [options.settings] - `{ days }`.
 * @param {number} options.ttl - Cache duration.
 * @returns {object} The content.
 */
function buildWeekWidget({ almanac, today, language, timezone, settings = {}, ttl }) {
  const items = [];
  for (let offset = 0; offset < weekDays(settings.days); offset += 1) {
    const day = addDays(today, offset);
    const info = describeDay(almanac, day, timezone);
    const avoid = info.unfavourable.length > 0;
    items.push({
      icon: avoid ? 'alert-triangle' : ICONS[info.type],
      label: clip(offset === 0 ? t('todayWord', language) : formatDay(day, language, 'short'), 40),
      value: clip(dayRowValue(info, language, timezone), 40),
      color: avoid ? 'danger' : COLORS[info.type],
    });
  }
  return {
    ttl_seconds: ttl,
    components: [
      { type: 'status', items },
      { type: 'text', variant: 'caption', text: clip(t('widgetLegend', language), 80) },
    ],
  };
}

export {
  WIDGETS,
  WEEK_DAYS,
  TTL,
  COLORS,
  ICONS,
  ttlUntil,
  weekDays,
  dayRowValue,
  buildTodayWidget,
  buildWeekWidget,
};

// -----------------------------------------------------------------------------
// Scene triggers and scene action of the lunar gardening calendar.
//
// Triggers (keys are forever):
//   - `day_type_changed`    when the moon enters the constellation of a new
//                           day type (filter: the day types);
//   - `trajectory_changed`  when the moon turns ascending or descending
//                           (filter: the trajectory);
//   - `daily_summary`       every day at the hour of the configuration, with
//                           the whole day (filters: main day type,
//                           trajectory, day to avoid).
// The first two fire at the minute of the change (src/scheduler.js), never
// twice; the third once a day, remembered in /data.
//
// Action `get_garden_day`: the day of today or tomorrow, as values and as a
// sentence to send in a message.
// -----------------------------------------------------------------------------

import { addDays } from './dates.js';
import { describeDay, segmentAt, trajectoryAt } from './almanac.js';
import { dayValues, untilText, adviceText } from './garden.js';
import { t } from './i18n.js';
import { localDay, localTime } from './time.js';

const TRIGGERS = {
  DAY_TYPE_CHANGED: 'day_type_changed',
  TRAJECTORY_CHANGED: 'trajectory_changed',
  DAILY_SUMMARY: 'daily_summary',
};
const SCENE_ACTIONS = { GET_GARDEN_DAY: 'get_garden_day' };
const WHEN = ['today', 'tomorrow'];

/**
 * @description "YYYY-MM-DD HH:MM" in the timezone of the house.
 * @param {number} ms - The instant.
 * @param {string} timezone - IANA timezone.
 * @returns {string} The local date and time.
 */
const localStamp = (ms, timezone) =>
  `${localDay(new Date(ms), timezone)} ${localTime(ms, timezone)}`;

/**
 * @description The changes the timed triggers announce, in a span: the start
 * of each day type segment and of each trajectory period.
 * @param {object} almanac - An almanac covering the span.
 * @param {number} from - Start (ms, included).
 * @param {number} to - End (ms, excluded).
 * @returns {Array<{ trigger: string, at: number, id: string }>} The changes, by date.
 */
function changesBetween(almanac, from, to) {
  const changes = [];
  almanac.segments.forEach((segment) => {
    if (segment.start >= from && segment.start < to && segment.start > almanac.from) {
      changes.push({
        trigger: TRIGGERS.DAY_TYPE_CHANGED,
        at: segment.start,
        id: `type:${segment.constellation}`,
      });
    }
  });
  almanac.trajectories.forEach((period) => {
    if (period.start >= from && period.start < to && period.start > almanac.from) {
      changes.push({
        trigger: TRIGGERS.TRAJECTORY_CHANGED,
        at: period.start,
        id: `trajectory:${period.trajectory}`,
      });
    }
  });
  return changes.sort((a, b) => a.at - b.at);
}

/**
 * @description The data of a timed scene event (flat, scalars only).
 * @param {object} almanac - An almanac covering the change.
 * @param {{ trigger: string, at: number }} change - The change.
 * @param {string} language - The language of the texts.
 * @param {string} timezone - IANA timezone.
 * @returns {object} The data.
 */
function changeData(almanac, change, language, timezone) {
  const day = localDay(new Date(change.at), timezone);
  const info = describeDay(almanac, day, timezone);
  if (change.trigger === TRIGGERS.DAY_TYPE_CHANGED) {
    const segment = segmentAt(almanac, change.at);
    const until = untilText(segment.end, day, language, timezone);
    const label = t(`type_${segment.type}`, language);
    const constellation = t(segment.constellation, language);
    return {
      day_type: segment.type,
      day_type_label: label,
      constellation,
      ends_at: localStamp(segment.end, timezone),
      summary: t('summaryTypeChange', language, { type: label, constellation, until }),
      advice: adviceText({ ...info, type: segment.type }, language, timezone),
    };
  }
  const period = trajectoryAt(almanac, change.at);
  const label = t(`trajectory_${period.trajectory}`, language);
  return {
    trajectory: period.trajectory,
    trajectory_label: label,
    ends_at: localStamp(period.end, timezone),
    summary: t('summaryTrajectoryChange', language, {
      trajectory: label,
      until: untilText(period.end, day, language, timezone),
    }),
    advice: t(`advice_${period.trajectory}`, language),
  };
}

/**
 * @description The data of the daily scene event.
 * @param {object} almanac - An almanac covering the day.
 * @param {string} today - YYYY-MM-DD.
 * @param {string} language - The language of the texts.
 * @param {string} timezone - IANA timezone.
 * @returns {object} The data.
 */
function dailyData(almanac, today, language, timezone) {
  return dayValues(describeDay(almanac, today, timezone), 'today', language, timezone);
}

/**
 * @description The outputs of the get_garden_day scene action.
 * @param {object} almanac - An almanac covering today and tomorrow.
 * @param {string} today - YYYY-MM-DD.
 * @param {object} fields - `{ day: 'today'|'tomorrow' }`.
 * @param {string} language - The language of the texts.
 * @param {string} timezone - IANA timezone.
 * @returns {object} The outputs.
 */
function gardenDayOutputs(almanac, today, fields, language, timezone) {
  const when = WHEN.includes(fields?.day) ? fields.day : 'today';
  const day = when === 'tomorrow' ? addDays(today, 1) : today;
  return dayValues(describeDay(almanac, day, timezone), when, language, timezone);
}

export {
  TRIGGERS,
  SCENE_ACTIONS,
  WHEN,
  localStamp,
  changesBetween,
  changeData,
  dailyData,
  gardenDayOutputs,
};

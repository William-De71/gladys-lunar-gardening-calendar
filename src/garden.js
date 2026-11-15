// -----------------------------------------------------------------------------
// The almanac in words: the texts of a day, of a day type, of a trajectory,
// in one language. Shared by the calendar, the scenes and the widgets.
// -----------------------------------------------------------------------------

import { addDays } from './dates.js';
import { t, formatDate } from './i18n.js';
import { localDay, localTime } from './time.js';

/**
 * @description "until 18:20" on the same day, "until Nov 24, 18:20" later.
 * @param {number} ms - The end.
 * @param {string} day - The local day it is compared with.
 * @param {string} language - The language.
 * @param {string} timezone - IANA timezone.
 * @returns {string} The text.
 */
function untilText(ms, day, language, timezone) {
  const endDay = localDay(new Date(ms), timezone);
  const time = localTime(ms, timezone);
  if (endDay === day) return t('until', language, { time });
  // An end at midnight is the end of the day before.
  if (time === '00:00')
    return t('untilDay', language, { day: formatDate(addDays(endDay, -1), language) });
  return t('untilDay', language, { day: `${formatDate(endDay, language)} ${time}` });
}

/**
 * @description The reasons a day is to avoid: "Perigee 14:32, Ascending node 03:10".
 * @param {object} info - A day of describeDay.
 * @param {string} language - The language.
 * @param {string} timezone - IANA timezone.
 * @returns {string} The reasons, empty on an ordinary day.
 */
function avoidReasons(info, language, timezone) {
  return info.unfavourable
    .map((event) => `${t(`avoid_${event.kind}`, language)} ${localTime(event.at, timezone)}`)
    .join(', ');
}

/**
 * @description The day types of a day with their changes: "Fruit until
 * 09:34, then Root"; a single type: "Root day (Capricorn)".
 * @param {object} info - A day of describeDay.
 * @param {string} language - The language.
 * @param {string} timezone - IANA timezone.
 * @returns {string} The text.
 */
function typesText(info, language, timezone) {
  const segments = info.segments;
  if (segments.length === 0) return '';
  if (segments.length === 1) {
    return `${t(`type_${segments[0].type}`, language)} (${t(segments[0].constellation, language)})`;
  }
  return segments
    .map((segment, index) => {
      const name = t(`short_${segment.type}`, language);
      const part =
        index < segments.length - 1
          ? `${name} ${t('until', language, { time: localTime(segment.until, timezone) })}`
          : name;
      return index === 0 ? part : t('then', language, { what: part });
    })
    .join(', ');
}

/**
 * @description The gardening advice of a day: what to sow or plant, or why
 * to wait.
 * @param {object} info - A day of describeDay.
 * @param {string} language - The language.
 * @param {string} timezone - IANA timezone.
 * @returns {string} The advice.
 */
function adviceText(info, language, timezone) {
  if (info.unfavourable.length > 0) {
    return t('advice_avoid', language, { reasons: avoidReasons(info, language, timezone) });
  }
  return [
    info.type && t(`advice_${info.type}`, language),
    info.trajectory && t(`advice_${info.trajectory}`, language),
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * @description Everything a scene gets about a day (flat, scalars only): the
 * variables of `daily_summary` and the outputs of `get_garden_day`.
 * @param {object} info - A day of describeDay.
 * @param {'today'|'tomorrow'} when - Which day it is.
 * @param {string} language - The language of the texts.
 * @param {string} timezone - IANA timezone.
 * @returns {object} The values.
 */
function dayValues(info, when, language, timezone) {
  const trajectoryLabel = info.trajectory ? t(`trajectory_${info.trajectory}`, language) : '';
  const phaseLabel = t(info.phase.waxing ? 'phase_waxing' : 'phase_waning', language);
  const reasons = avoidReasons(info, language, timezone);
  const types = typesText(info, language, timezone);
  let summary = t(`summary_${when}`, language, {
    types,
    trajectory: trajectoryLabel,
    phase: phaseLabel.toLowerCase(),
  });
  if (reasons) {
    summary += ` ${t('summaryAvoid', language, { day: t(when === 'tomorrow' ? 'tomorrowWord' : 'todayWord', language), reasons })}`;
  }
  return {
    date: info.day,
    day_type: info.type ?? '',
    day_type_label: info.type ? t(`type_${info.type}`, language) : '',
    day_types: types,
    constellation: info.constellation ? t(info.constellation, language) : '',
    trajectory: info.trajectory ?? '',
    trajectory_label: trajectoryLabel,
    avoid: reasons ? 'yes' : 'no',
    avoid_reasons: reasons,
    phase: info.phase.waxing ? 'waxing' : 'waning',
    phase_label: phaseLabel,
    illumination: info.phase.illumination,
    summary,
    advice: adviceText(info, language, timezone),
  };
}

export { untilText, avoidReasons, typesText, adviceText, dayValues };

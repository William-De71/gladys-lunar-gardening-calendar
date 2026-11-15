// The widgets through validateWidgetContent (the checks of the core, which
// only run in debug mode in production) and the content budget of a card.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWidgetContent } from '@gladysassistant/integration-sdk';
import {
  buildTodayWidget,
  buildWeekWidget,
  ttlUntil,
  weekDays,
  WEEK_DAYS,
  COLORS,
  ICONS,
} from '../src/widgets.js';
import { DAY_TYPES } from '../src/almanac.js';
import { LANGUAGES } from '../src/i18n.js';
import { addDays } from '../src/dates.js';
import { localMidnight } from '../src/time.js';
import { almanacOf } from './helpers.js';

const TZ = 'Europe/Paris';
const almanac = almanacOf('2026-01-01', '2027-01-15');
const today = (day, language, hour = 10) =>
  buildTodayWidget({
    almanac,
    now: localMidnight(day, TZ) + hour * 3600000,
    today: day,
    language,
    timezone: TZ,
    ttl: 600,
  });
const week = (day, language, settings = {}) =>
  buildWeekWidget({ almanac, today: day, language, timezone: TZ, settings, ttl: 600 });
const types = (content) => content.components.map((c) => c.type);

test('valid every day of the year, in every language', () => {
  for (const language of LANGUAGES) {
    for (let day = '2026-01-01'; day < '2027-01-01'; day = addDays(day, 1)) {
      assert.deepEqual(validateWidgetContent(today(day, language)), [], `today ${language} ${day}`);
      assert.deepEqual(validateWidgetContent(week(day, language)), [], `week ${language} ${day}`);
    }
  }
});

test('today: the day type, until when, next, trajectory, phase, advice', () => {
  const content = today('2026-11-15', 'fr', 8);
  assert.deepEqual(types(content), ['text', 'status', 'text']);
  const [heading, status, body] = content.components;
  assert.equal(heading.text, 'Jour fruits');
  assert.deepEqual(
    status.items.map((item) => [item.label, item.value]),
    [
      ['Sagittaire', 'jusqu’à 09:34'],
      ['Ensuite', 'Racines · Capricorne'],
      ['Lune montante', 'jusqu’au 26 nov. 03:25'],
      ['Lune croissante', '31 %'],
    ],
  );
  assert.equal(body.variant, 'body');
  assert.match(body.text, /^Légumes-fruits/);
});

test('today, a day to avoid: a danger row and the advice to wait', () => {
  const content = today('2026-11-17', 'en');
  const avoid = content.components[1].items.at(-1);
  assert.deepEqual(
    [avoid.label, avoid.value, avoid.color],
    ['To avoid', 'Ascending node 12:47', 'danger'],
  );
  assert.match(content.components[2].text, /^Day to avoid \(Ascending node 12:47\)/);
});

test('week: one row a day, changes, arrows, days to avoid', () => {
  const content = week('2026-11-15', 'fr');
  assert.deepEqual(types(content), ['status', 'text']);
  const rows = content.components[0].items;
  assert.equal(rows.length, WEEK_DAYS.default);
  assert.deepEqual(
    rows.slice(0, 3).map((row) => [row.label, row.value, row.color]),
    [
      ['Aujourd’hui', 'Fruits → Racines 09:34 ↑', 'neutral'],
      ['lun. 16 nov.', 'Racines ↑', 'neutral'],
      ['mar. 17 nov.', 'À éviter · Racines ↑', 'danger'],
    ],
  );
  assert.equal(week('2026-11-15', 'en', { days: 10 }).components[0].items.length, 10);
});

test('settings and cache duration are bounded', () => {
  assert.deepEqual(
    [weekDays(undefined), weekDays(''), weekDays('2'), weekDays(4), weekDays(99)],
    [7, 7, 3, 4, 10],
  );
  assert.deepEqual([ttlUntil(1), ttlUntil(600), ttlUntil(86400)], [60, 605, 3600]);
  for (const type of DAY_TYPES) {
    assert.ok(COLORS[type] && ICONS[type], type);
  }
});

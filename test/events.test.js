// The scene payloads within the limits of the core (flat, scalars, 30 keys,
// strings of 1 000 characters at most), and exactly what the manifest
// declares: the variables of each trigger, the outputs of the action, the
// values of the filters.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TRIGGERS,
  changesBetween,
  changeData,
  dailyData,
  gardenDayOutputs,
} from '../src/events.js';
import { LANGUAGES } from '../src/i18n.js';
import { addDays } from '../src/dates.js';
import { localMidnight } from '../src/time.js';
import { almanacOf } from './helpers.js';

const TZ = 'Europe/Paris';
const manifest = JSON.parse(
  readFileSync(new URL('../gladys-assistant-integration.json', import.meta.url), 'utf8'),
);
const trigger = (key) => manifest.scene_triggers.find((entry) => entry.key === key);
const almanac = almanacOf('2026-10-01', '2027-03-01');

/**
 * @description Check a payload against the limits and the declared keys.
 * @param {object} data - The payload.
 * @param {Array<{ key: string, type: string }>} declared - Variables or outputs.
 * @param {string} where - For the messages.
 */
function checkPayload(data, declared, where) {
  const keys = Object.keys(data);
  assert.ok(keys.length <= 30, where);
  for (const { key, type } of declared) {
    assert.ok(key in data, `${where}: ${key} missing`);
    assert.equal(typeof data[key], type, `${where}: ${key}`);
  }
  for (const [key, value] of Object.entries(data)) {
    assert.ok(['string', 'number', 'boolean'].includes(typeof value), `${where}: ${key}`);
    if (typeof value === 'string') assert.ok(value.length <= 1000, `${where}: ${key}`);
    if (typeof value === 'number') assert.ok(Number.isFinite(value), `${where}: ${key}`);
  }
}

/**
 * @description The values a filter of a trigger accepts.
 * @param {string} triggerKey - The trigger.
 * @param {string} fieldKey - The filter.
 * @returns {string[]} The values.
 */
const filterValues = (triggerKey, fieldKey) =>
  trigger(triggerKey)
    .fields.find((field) => field.key === fieldKey)
    .options.map((option) => option.value);

test('the timed triggers: every change of four months, in every language', () => {
  const changes = changesBetween(
    almanac,
    localMidnight('2026-10-05', TZ),
    localMidnight('2027-02-20', TZ),
  );
  assert.ok(changes.filter((c) => c.trigger === TRIGGERS.DAY_TYPE_CHANGED).length > 50);
  assert.ok(changes.filter((c) => c.trigger === TRIGGERS.TRAJECTORY_CHANGED).length >= 9);
  for (const language of LANGUAGES) {
    for (const change of changes) {
      const data = changeData(almanac, change, language, TZ);
      checkPayload(data, trigger(change.trigger).variables, `${change.trigger} ${change.at}`);
      if (change.trigger === TRIGGERS.DAY_TYPE_CHANGED) {
        assert.ok(filterValues(change.trigger, 'day_type').includes(data.day_type));
      } else {
        assert.ok(filterValues(change.trigger, 'trajectory').includes(data.trajectory));
      }
    }
  }
});

test('the daily summary and the scene action: every day, in every language', () => {
  const outputs = manifest.scene_actions[0].outputs;
  const variables = trigger(TRIGGERS.DAILY_SUMMARY).variables;
  assert.deepEqual(
    outputs.map((o) => o.key),
    variables.map((v) => v.key),
    'the same values',
  );
  for (const language of LANGUAGES) {
    for (let day = '2026-10-05'; day < '2027-02-20'; day = addDays(day, 1)) {
      const data = dailyData(almanac, day, language, TZ);
      checkPayload(data, variables, `daily ${language} ${day}`);
      assert.ok(filterValues(TRIGGERS.DAILY_SUMMARY, 'day_type').includes(data.day_type));
      assert.ok(filterValues(TRIGGERS.DAILY_SUMMARY, 'trajectory').includes(data.trajectory));
      assert.ok(filterValues(TRIGGERS.DAILY_SUMMARY, 'avoid').includes(data.avoid));
      const out = gardenDayOutputs(almanac, day, { day: 'tomorrow' }, language, TZ);
      assert.deepEqual(
        Object.keys(out),
        outputs.map((o) => o.key),
        'only the declared outputs',
      );
      assert.equal(out.date, addDays(day, 1));
    }
  }
});

test('an unknown day field means today', () => {
  const out = gardenDayOutputs(almanac, '2026-11-15', { day: 'yesterday' }, 'en', TZ);
  assert.equal(out.date, '2026-11-15');
  assert.equal(out.summary, 'Today: Fruit until 09:34, then Root. Ascending moon, waxing moon.');
});

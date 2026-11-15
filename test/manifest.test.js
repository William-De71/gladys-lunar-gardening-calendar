// The manifest, tied to the code: type, versions, store limits, the keys of
// the triggers, the action, the widgets and the configuration (keys are
// forever: this test lists them on purpose).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { TRIGGERS, SCENE_ACTIONS, WHEN } from '../src/events.js';
import { WIDGETS, WEEK_DAYS } from '../src/widgets.js';
import { EVENT_HOUR, AUTO_LANGUAGE } from '../src/config.js';
import { DAY_TYPES, TRAJECTORIES } from '../src/almanac.js';
import { LANGUAGES } from '../src/i18n.js';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const manifest = read('../gladys-assistant-integration.json');
const pkg = read('../package.json');
const byKey = (list) => new Map(list.map((entry) => [entry.key, entry]));
const values = (field) => field.options.map((option) => option.value);
const DAY_VALUES = [
  'date',
  'day_type',
  'day_type_label',
  'day_types',
  'constellation',
  'trajectory',
  'trajectory_label',
  'avoid',
  'avoid_reasons',
  'phase',
  'phase_label',
  'illumination',
  'summary',
  'advice',
];

test('a calendar integration, in lockstep with package.json, at 0.x until 1.0.0 is decided', () => {
  assert.equal(manifest.type, 'calendar');
  assert.equal(manifest.name, 'Lunar gardening calendar');
  assert.equal(manifest.version, pkg.version);
  assert.equal(
    manifest.docker_image,
    `ghcr.io/william-de71/gladys-lunar-gardening-calendar:${pkg.version}`,
  );
  assert.equal(manifest.gladys_version, '>=5.3.0');
  assert.deepEqual(manifest.transports, ['local']);
  assert.equal(pkg.license, 'Apache-2.0');
  for (const key of ['location', 'network_wake', 'containers', 'network_discovery', 'webhooks']) {
    assert.equal(manifest[key], undefined, key);
  }
  assert.equal(manifest.account_schema, undefined, 'nothing to type per user');
  assert.equal(manifest.countries, undefined, 'the moon is the same everywhere');
});

test('local only: no network call in the code', () => {
  for (const file of [
    'app',
    'almanac',
    'calendar',
    'events',
    'garden',
    'scheduler',
    'widgets',
    'store',
    'config',
  ]) {
    assert.doesNotMatch(
      source(`../src/${file}.js`),
      /fetch\(|node:https?|node:net|node:dgram/,
      file,
    );
  }
});

test('declares exactly the triggers, the action and the widgets the code handles', () => {
  const app = source('../src/app.js');
  assert.deepEqual(
    manifest.scene_triggers.map((t) => t.key),
    ['day_type_changed', 'trajectory_changed', 'daily_summary'],
  );
  assert.deepEqual(
    Object.values(TRIGGERS),
    manifest.scene_triggers.map((t) => t.key),
  );
  assert.deepEqual(
    manifest.scene_actions.map((a) => a.key),
    Object.values(SCENE_ACTIONS),
  );
  assert.deepEqual(
    manifest.widgets.map((w) => w.key),
    Object.values(WIDGETS),
  );
  assert.match(app, /onWidgetGet\(WIDGETS\.TODAY/);
  assert.match(app, /onWidgetGet\(WIDGETS\.WEEK/);
  assert.match(app, /onSceneAction\(SCENE_ACTIONS\.GET_GARDEN_DAY/);

  const triggers = byKey(manifest.scene_triggers);
  const fields = (key) => byKey(triggers.get(key).fields);
  const variables = (key) => triggers.get(key).variables.map((v) => v.key);
  assert.deepEqual(values(fields('day_type_changed').get('day_type')), DAY_TYPES);
  assert.deepEqual(variables('day_type_changed'), [
    'day_type',
    'day_type_label',
    'constellation',
    'ends_at',
    'summary',
    'advice',
  ]);
  assert.deepEqual(values(fields('trajectory_changed').get('trajectory')), TRAJECTORIES);
  assert.deepEqual(variables('trajectory_changed'), [
    'trajectory',
    'trajectory_label',
    'ends_at',
    'summary',
    'advice',
  ]);
  const daily = fields('daily_summary');
  assert.deepEqual(values(daily.get('day_type')), DAY_TYPES);
  assert.deepEqual(values(daily.get('trajectory')), TRAJECTORIES);
  assert.deepEqual(values(daily.get('avoid')), ['yes', 'no']);
  assert.deepEqual(variables('daily_summary'), DAY_VALUES);

  const action = manifest.scene_actions[0];
  assert.deepEqual(values(byKey(action.fields).get('day')), WHEN);
  assert.deepEqual(
    action.outputs.map((o) => o.key),
    DAY_VALUES,
  );
  assert.ok(action.timeout_seconds >= 5 && action.timeout_seconds <= 120);
});

test('mirrors the bounds of the code', () => {
  const config = byKey(manifest.config_schema);
  assert.deepEqual(
    [...config.keys()],
    ['intro', 'calendar_trajectory', 'calendar_avoid', 'event_hour', 'language'],
  );
  for (const bound of ['min', 'max', 'default']) {
    assert.equal(config.get('event_hour')[bound], EVENT_HOUR[bound]);
  }
  assert.deepEqual(values(config.get('language')), [AUTO_LANGUAGE, ...LANGUAGES]);
  assert.equal(config.get('calendar_trajectory').default, true);
  assert.equal(config.get('calendar_avoid').default, true);
  const days = byKey(byKey(manifest.widgets).get('week').settings).get('days');
  assert.deepEqual(
    [days.min, days.max, days.default],
    [WEEK_DAYS.min, WEEK_DAYS.max, WEEK_DAYS.default],
  );
});

test('limits of the store: sizes, catalog description, links over https', () => {
  const size = statSync(new URL('../gladys-assistant-integration.json', import.meta.url)).size;
  assert.ok(size < 100 * 1024, `${size} bytes`);
  for (const language of LANGUAGES) {
    const { length } = manifest.description[language];
    assert.ok(length >= 10 && length <= 100, `description.${language}: ${length}`);
    for (const widget of manifest.widgets) {
      const label = widget.label[language].length;
      assert.ok(label >= 3 && label <= 30, widget.key);
      assert.ok(widget.description[language].length <= 100, widget.key);
    }
  }
  for (const field of manifest.config_schema) {
    for (const link of field.links ?? []) {
      assert.match(link.url, /^https:\/\//);
    }
  }
  const cover = readFileSync(new URL('../cover.jpg', import.meta.url));
  assert.ok(cover.length < 150 * 1024, `cover.jpg: ${cover.length} bytes`);
  assert.equal(cover.readUInt16BE(0), 0xffd8, 'cover.jpg is a JPEG');
});

test('catalog fields of Gladys 5.3: search keywords, worldwide', () => {
  assert.ok(manifest.keywords.length >= 1 && manifest.keywords.length <= 10, '1 to 10 keywords');
  for (const keyword of manifest.keywords) {
    assert.ok(keyword.trim().length >= 2 && keyword.trim().length <= 30, `"${keyword}"`);
  }
  const normalized = manifest.keywords.map((keyword) => keyword.trim().toLowerCase());
  assert.equal(new Set(normalized).size, normalized.length, 'keywords are unique');
  assert.ok(!normalized.includes(manifest.name.toLowerCase()), 'the name is already searched');
  assert.ok(manifest.categories.length >= 1 && manifest.categories.length <= 3);
});

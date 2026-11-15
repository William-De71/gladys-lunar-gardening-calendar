// The integration end to end, against the fake Gladys of the SDK: the
// calendar of the enabled users and what it shows, the daily scene event, the
// timed scene events (once, never late), the widgets and the scene action.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFakeGladys } from '@gladysassistant/integration-sdk/testing';
import { validateWidgetContent } from '@gladysassistant/integration-sdk';
import { createApp } from '../src/app.js';
import { TRIGGERS } from '../src/events.js';
import { GRACE_MS } from '../src/scheduler.js';
import { silent, noTimers } from './helpers.js';

const statePath = () => join(mkdtempSync(join(tmpdir(), 'lunar-')), 'state.json');
const john = { user: { selector: 'john', first_name: 'John', language: 'fr' }, config: {} };
const jane = { user: { selector: 'jane', first_name: 'Jane', language: 'en' }, config: {} };

/**
 * @description A started integration on a controllable clock.
 * @param {object} [options] - Options.
 * @returns {Promise<object>} `{ gladys, app, clock, path }`.
 */
async function start({
  at = '2026-11-15T04:00:00Z', // 05:00 in Paris
  config = {},
  accounts = [john],
  path = statePath(),
} = {}) {
  const clock = { now: new Date(at) };
  const gladys = createFakeGladys({
    config: { language: 'auto', ...config },
    calendarAccounts: accounts,
  });
  const app = createApp(gladys, {
    now: () => clock.now,
    timezone: 'Europe/Paris',
    statePath: path,
    sleep: async () => {},
    tickMs: 0,
    timers: noTimers,
    logger: silent,
  });
  await gladys.connect();
  await app.tick();
  return { gladys, app, clock, path };
}

const ok = (ack) => {
  assert.equal(ack.success, true, ack.error);
  return ack.data.content ?? ack.data.outputs ?? ack.data.message;
};
const eventsOf = (gladys, user) =>
  gladys.fake.calendarEvents.filter((e) => e.external_id.includes(`:${user}:`));

test('a calendar for each enabled user, in their language, a year ahead', async () => {
  const { gladys } = await start({ accounts: [john, jane] });
  assert.deepEqual(
    gladys.fake.calendars.map((c) => [c.user, c.name]),
    [
      ['john', 'Calendrier lunaire du jardinier'],
      ['jane', 'Lunar gardening calendar'],
    ],
  );
  const events = eventsOf(gladys, 'john');
  assert.ok(events.length > 200 && events.length < 500, `${events.length} events`);
  assert.equal(new Set(events.map((e) => e.external_id)).size, events.length, 'unique ids');
  const capricorn = events.find((e) => e.external_id.endsWith(':type-2026-11-15-capricorn'));
  assert.deepEqual(
    [capricorn.name, capricorn.start, Boolean(capricorn.full_day)],
    ['Jour racines · Capricorne', '2026-11-15T08:34:00.000Z', false],
  );
  assert.match(capricorn.description, /carottes/);
  const avoid = events.find((e) => e.external_id.endsWith(':avoid-2026-11-17'));
  assert.deepEqual(
    [avoid.name, avoid.start, avoid.end, avoid.full_day],
    ['Jour à éviter : Nœud ascendant 12:47', '2026-11-17', '2026-11-18', true],
  );
  assert.ok(events.some((e) => e.name === 'Lune montante'));
  assert.ok(eventsOf(gladys, 'jane').some((e) => e.name === 'Root day · Capricorn'));
  assert.match(
    gladys.fake.connectionStatus.message.fr,
    /Europe\/Paris : Jour fruits en ce moment, lune montante/,
  );
});

test('the configuration chooses what the calendar shows', async () => {
  const { gladys } = await start({ config: { calendar_trajectory: false, calendar_avoid: false } });
  const events = eventsOf(gladys, 'john');
  assert.ok(events.every((e) => e.external_id.includes(':type-')));
  await gladys.fake.configUpdated({ ...gladys.fake.config, calendar_avoid: true });
  assert.ok(eventsOf(gladys, 'john').some((e) => e.external_id.includes(':avoid-')));
});

test('the daily summary: at the event hour, once a day, even after a restart', async () => {
  const path = statePath();
  const first = await start({ path });
  assert.deepEqual(first.gladys.fake.sceneEvents, [], '05:00, before 07:00');
  first.clock.now = new Date('2026-11-15T06:00:05Z'); // 07:00:05 in Paris
  await first.app.tick();
  const [event] = first.gladys.fake.sceneEvents;
  assert.equal(event.key, TRIGGERS.DAILY_SUMMARY);
  assert.deepEqual(
    [event.data.day_type, event.data.trajectory, event.data.avoid, event.data.day_types],
    ['root', 'ascending', 'no', 'Fruits jusqu’à 09:34, puis Racines'],
  );
  await first.app.tick();
  assert.equal(first.gladys.fake.sceneEvents.length, 1, 'never twice');
  const again = await start({ at: '2026-11-15T10:00:00Z', path });
  assert.ok(!again.gladys.fake.sceneEvents.some((e) => e.key === TRIGGERS.DAILY_SUMMARY));
  const avoidDay = await start({ at: '2026-11-17T10:00:00Z', path });
  const summary = avoidDay.gladys.fake.sceneEvents.find((e) => e.key === TRIGGERS.DAILY_SUMMARY);
  assert.deepEqual(
    [summary.data.avoid, summary.data.avoid_reasons],
    ['yes', 'Nœud ascendant 12:47'],
  );
  assert.match(summary.data.advice, /^Jour à éviter/);
});

test('timed triggers: at the minute of the change, once, never late', async () => {
  const path = statePath();
  const { gladys, app, clock } = await start({ path });
  assert.equal(gladys.fake.sceneEvents.length, 0);
  clock.now = new Date('2026-11-15T08:34:20Z');
  await app.scheduler.tick();
  const changed = gladys.fake.sceneEvents.filter((e) => e.key === TRIGGERS.DAY_TYPE_CHANGED);
  assert.equal(changed.length, 1);
  assert.deepEqual(
    [changed[0].data.day_type, changed[0].data.constellation, changed[0].data.ends_at],
    ['root', 'Capricorne', '2026-11-17 18:19'],
  );
  assert.equal(
    changed[0].data.summary,
    'Jour racines : lune en Capricorne (jusqu’au 17 nov. 18:19).',
  );
  await app.scheduler.tick();
  assert.equal(gladys.fake.sceneEvents.length, 1, 'once');
  // A restart a few minutes later does not fire it again.
  const restarted = await start({ at: '2026-11-15T08:38:00Z', path });
  assert.ok(!restarted.gladys.fake.sceneEvents.some((e) => e.key === TRIGGERS.DAY_TYPE_CHANGED));
  // Stopped for too long: the change is dropped.
  const late = await start({
    at: new Date(Date.parse('2026-11-15T08:34:00Z') + GRACE_MS + 60000).toISOString(),
  });
  assert.ok(!late.gladys.fake.sceneEvents.some((e) => e.key === TRIGGERS.DAY_TYPE_CHANGED));
});

test('the trajectory trigger', async () => {
  // The moon turns descending on 2026-11-26 at 03:25 (Paris).
  const { gladys, app, clock } = await start({ at: '2026-11-26T02:20:00Z' });
  clock.now = new Date('2026-11-26T02:25:30Z');
  await app.scheduler.tick();
  const event = gladys.fake.sceneEvents.find((e) => e.key === TRIGGERS.TRAJECTORY_CHANGED);
  assert.equal(event.data.trajectory, 'descending');
  assert.match(event.data.summary, /^Lune descendante jusqu’au/);
  assert.match(event.data.advice, /planter, repiquer/);
});

test('the scene action and the language of the texts', async () => {
  const { gladys } = await start();
  const tomorrow = ok(await gladys.fake.sceneAction('get_garden_day', { day: 'tomorrow' }));
  assert.equal(tomorrow.date, '2026-11-16');
  assert.equal(
    tomorrow.summary,
    'Demain : Jour racines (Capricorne). Lune montante, lune croissante.',
  );
  assert.equal(typeof tomorrow.illumination, 'number');
  // The dashboard is in German: the scene texts follow.
  await gladys.fake.widgetGet('today', { language: 'de' });
  const today = ok(await gladys.fake.sceneAction('get_garden_day', {}));
  assert.equal(today.day_types, 'Frucht bis 09:34, dann Wurzel');
});

test('the widgets, valid, cached until the next change', async () => {
  const { gladys } = await start();
  const today = ok(await gladys.fake.widgetGet('today', { language: 'fr' }));
  assert.deepEqual(validateWidgetContent(today), []);
  assert.equal(today.components[0].text, 'Jour fruits');
  // 05:00 -> 09:34: the content changes with the day type.
  assert.ok(today.ttl_seconds >= 3600 - 1);
  const week = ok(await gladys.fake.widgetGet('week', { language: 'fr', settings: { days: 4 } }));
  assert.deepEqual(validateWidgetContent(week), []);
  assert.equal(week.components[0].items.length, 4);
});

test('a user who enables the integration gets the calendar at once', async () => {
  const { gladys } = await start({ accounts: [] });
  assert.equal(gladys.fake.calendars.length, 0);
  gladys.fake.calendarAccounts.push(jane);
  await gladys.fake.calendarAccountUpdated('jane');
  assert.equal(gladys.fake.calendars.length, 1);
  assert.ok(gladys.fake.calendarEvents.length > 200);
});

test('midnight slides the window', async () => {
  const { gladys, app, clock } = await start();
  const before = eventsOf(gladys, 'john').map((e) => e.external_id);
  assert.ok(before.some((id) => id.includes(':type-2026-11-08-')));
  clock.now = new Date('2026-11-15T23:00:30Z'); // 00:00:30 on the 16th in Paris
  await app.tick();
  const after = eventsOf(gladys, 'john');
  assert.ok(
    after.every((e) => (e.end ?? e.start) >= '2026-11-09'),
    'older events pruned',
  );
  assert.ok(after.some((e) => e.start.startsWith('2027-11-1')));
});

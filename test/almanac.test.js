// The almanac against a published calendar: the 365 days of 2026 of
// icalendrier.fr (test/fixtures/icalendrier-2026.json: day types, ascending
// or descending, day to avoid, read from its yearly page on 2026-11-15), the
// minutes it prints, the crossings outside the zodiac, and the stability of
// the instants from one computation to the next.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  computeAlmanac,
  constellationAt,
  describeDay,
  DAY_TYPE_OF,
  CONSTELLATIONS,
  DAY_TYPES,
  UNFAVOURABLE_KINDS,
} from '../src/almanac.js';
import { localMidnight, localTime } from '../src/time.js';
import { addDays } from '../src/dates.js';
import { almanacOf } from './helpers.js';

const TZ = 'Europe/Paris';
const reference = JSON.parse(
  readFileSync(new URL('./fixtures/icalendrier-2026.json', import.meta.url), 'utf8'),
);
const year = () => almanacOf('2026-01-01', '2027-01-01');

test('the 365 days of 2026 match the published calendar', () => {
  const almanac = year();
  const wrong = [];
  for (const [day, expected] of Object.entries(reference)) {
    const info = describeDay(almanac, day, TZ);
    const got = {
      types: [...info.types].sort(),
      trajectory: info.trajectory,
      avoid: info.unfavourable.length > 0,
    };
    const want = { ...expected, types: [...expected.types].sort() };
    if (JSON.stringify(got) !== JSON.stringify(want)) wrong.push(`${day} ${JSON.stringify(got)}`);
  }
  assert.deepEqual(wrong, []);
  assert.equal(Object.keys(reference).length, 365);
});

test('the changes to the minute the calendar prints (2026-11-15, 09:34)', () => {
  const info = describeDay(year(), '2026-11-15', TZ);
  assert.deepEqual(
    info.segments.map((s) => [s.constellation, s.type, localTime(s.from, TZ)]),
    [
      ['sagittarius', 'fruit', '00:00'],
      ['capricorn', 'root', '09:34'],
    ],
  );
  assert.equal(info.type, 'root', 'the longest type of the day');
  assert.equal(info.trajectory, 'ascending');
});

test('Ophiuchus keeps Scorpio until midnight, then takes Sagittarius', () => {
  // The moon enters Ophiuchus on 2026-11-11 at 16:11 and leaves it on the
  // 12th at 14:59; the calendar prints a leaf day, then a fruit day.
  assert.equal(constellationAt(Date.parse('2026-11-11T18:00:00Z')), 'Oph');
  const almanac = year();
  assert.deepEqual(describeDay(almanac, '2026-11-11', TZ).types, ['leaf']);
  const twelfth = describeDay(almanac, '2026-11-12', TZ);
  assert.deepEqual(twelfth.types, ['fruit']);
  assert.equal(twelfth.segments[0].start, localMidnight('2026-11-12', TZ));
  assert.equal(twelfth.constellation, 'sagittarius');
});

test('days to avoid: perigee, apogee, nodes and eclipses, by local day', () => {
  const almanac = year();
  const kinds = (day) => describeDay(almanac, day, TZ).unfavourable.map((e) => e.kind);
  assert.deepEqual(kinds('2026-11-17'), ['ascending_node']);
  assert.deepEqual(kinds('2026-11-13'), ['apogee']);
  assert.deepEqual(kinds('2026-03-03'), ['descending_node', 'lunar_eclipse']);
  assert.deepEqual(kinds('2026-08-12'), ['solar_eclipse']);
  assert.deepEqual(kinds('2026-11-15'), []);
  for (const event of almanac.unfavourable) assert.ok(UNFAVOURABLE_KINDS.includes(event.kind));
});

test('segments: contiguous, one zodiac constellation each, the right element', () => {
  const { segments } = year();
  for (let i = 1; i < segments.length; i += 1) {
    assert.equal(segments[i].start, segments[i - 1].end, `gap at ${i}`);
    assert.notEqual(segments[i].constellation, segments[i - 1].constellation);
  }
  for (const segment of segments) {
    assert.ok(CONSTELLATIONS.includes(segment.constellation));
    assert.equal(segment.type, DAY_TYPE_OF[segment.constellation]);
    assert.ok(DAY_TYPES.includes(segment.type));
    assert.equal(segment.start % 60000, 0, 'whole minutes');
  }
});

test('the same instants whatever the start of the computation', () => {
  const a = computeAlmanac(localMidnight('2026-11-01', TZ), localMidnight('2026-12-15', TZ), TZ);
  const b = computeAlmanac(Date.parse('2026-10-27T13:37:11Z'), localMidnight('2026-12-20', TZ), TZ);
  const inside = (list) =>
    list
      .filter(
        (x) =>
          x.start > localMidnight('2026-11-03', TZ) && x.start < localMidnight('2026-12-10', TZ),
      )
      .map((x) => `${x.start}:${x.constellation ?? x.trajectory}`);
  assert.deepEqual(inside(a.segments), inside(b.segments));
  assert.deepEqual(inside(a.trajectories), inside(b.trajectories));
});

test('days are the days of the house: another timezone, another midnight', () => {
  const tz = 'America/New_York';
  const almanac = computeAlmanac(
    localMidnight('2026-10-28', tz),
    localMidnight('2026-11-20', tz),
    tz,
  );
  const info = describeDay(almanac, '2026-11-15', tz);
  assert.deepEqual(info.types, ['fruit', 'root'], 'the change is at 03:34 in New York');
  assert.equal(localTime(info.segments[1].from, tz), '03:34');
  // Every local day is covered without a hole, the 25-hour day of the end of
  // DST (2026-11-01 in New York) included.
  for (let day = '2026-10-28'; day < '2026-11-20'; day = addDays(day, 1)) {
    const covered = describeDay(almanac, day, tz).segments.reduce(
      (sum, s) => sum + s.until - s.from,
      0,
    );
    assert.equal(covered, localMidnight(addDays(day, 1), tz) - localMidnight(day, tz), day);
  }
});

test('the phase: waxing before the full moon, the quarters by day', () => {
  const almanac = year();
  const info = describeDay(almanac, '2026-11-15', TZ);
  assert.equal(info.phase.waxing, true);
  assert.ok(info.phase.illumination > 20 && info.phase.illumination < 45);
  const quarters = almanac.quarters.filter((q) => q.quarter === 2);
  assert.ok(quarters.length >= 12 && quarters.length <= 13, 'twelve or thirteen full moons');
});

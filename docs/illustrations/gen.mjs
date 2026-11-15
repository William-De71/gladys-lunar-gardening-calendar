// Builds the widget contents of the illustrations with the integration's own
// code: node gen.mjs <repo> <out.json> (run by render.sh)
//
// Both widgets on a fixed instant (Sunday 15 November 2026, 08:00 in Paris,
// an hour and a half before the moon leaves Sagittarius), from the almanac
// computed by src/almanac.js: nothing is made up.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const [repo, out] = process.argv.slice(2);
const load = (path) => import(pathToFileURL(`${repo}/${path}`).href);
const { buildTodayWidget, buildWeekWidget } = await load('src/widgets.js');
const { computeAlmanac } = await load('src/almanac.js');
const { localMidnight } = await load('src/time.js');
const { LANGUAGES } = await load('src/i18n.js');
const manifest = JSON.parse(readFileSync(`${repo}/gladys-assistant-integration.json`, 'utf8'));

const TZ = 'Europe/Paris';
const TODAY = '2026-11-15';
const NOW = Date.parse('2026-11-15T07:00:00Z');
const almanac = computeAlmanac(localMidnight(TODAY, TZ), localMidnight('2026-11-30', TZ), TZ);
const contents = {};
for (const language of LANGUAGES) {
  contents[language] = {
    today: buildTodayWidget({ almanac, now: NOW, today: TODAY, language, timezone: TZ, ttl: 3600 }),
    week: buildWeekWidget({
      almanac,
      today: TODAY,
      language,
      timezone: TZ,
      settings: { days: 7 },
      ttl: 3600,
    }),
  };
}
const widgets = Object.fromEntries(
  manifest.widgets.map((w) => [w.key, { icon: w.icon, label: w.label }]),
);
writeFileSync(out, JSON.stringify({ now: NOW, widgets, contents }));

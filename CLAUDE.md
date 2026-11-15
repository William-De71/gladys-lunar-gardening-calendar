# CLAUDE.md

Project rules for coding assistants (Claude Code reads this file) and for human
contributors.

## What this is

A Gladys Assistant **external integration** for the lunar gardening calendar
(the method of Maria Thun's biodynamic sowing calendars): a Node.js service
(Node 22+, ESM, no build step) that runs in its own sandboxed Docker container
and talks to Gladys through
[`@gladysassistant/integration-sdk`](https://github.com/GladysAssistant/integration-sdk-js),
with [`astronomy-engine`](https://github.com/cosinekitty/astronomy) (MIT) for
the position of the moon and the IAU constellation boundaries.

A **calendar integration** (`type: "calendar"`, Gladys 5.3.0+): one "Lunar
gardening calendar" for every user who enabled it in "My calendars", three
scene triggers, one scene action and two dashboard widgets. No devices: Gladys
does not let one manifest be both. Everything is computed locally: no
network, no key, no account. Transport: `["local"]`.

## Commands

```bash
npm install
npm test                                  # node --test, never touches the network
node --test test/almanac.test.js          # one file
DEBUG=gladys-integration-sdk npm test     # with the SDK debug logs
npm run lint                              # ESLint
npm run format:check                      # Prettier, as the CI runs it
npm run format                            # Prettier, fix in place
npx github:GladysAssistant/integration-store . --skip-image-check   # store checks
scripts/build-cover.sh                    # cover.jpg from docs/assets/cover.svg
docs/illustrations/render.sh              # docs/assets/widgets.<lang>.png
node .github/scripts/release.mjs next     # the version the next release would get
```

## Architecture

```
index.js                SDK wiring only (new GladysIntegration + createApp)
src/app.js              every handler, registered before connect(); the clock (tick)
src/almanac.js          the computation: day type segments, trajectory periods,
                        days to avoid, phase (astronomy-engine), cached in memory
src/garden.js           the almanac in words: day texts, advice, scene values
src/calendar.js         one calendar per user, its events (types, periods, days to avoid)
src/events.js           scene trigger payloads and scene action outputs
src/scheduler.js        fires the timed triggers at the minute of each change
src/widgets.js          the `today` and `week` widgets (pure, reused by docs/illustrations/gen.mjs)
src/store.js            /data/state.json: daily event fired, timed events fired, language
src/config.js           configuration (calendar contents, event hour, language)
src/i18n.js             runtime texts, en / fr / de / es
src/dates.js            YYYY-MM-DD arithmetic, pure
src/time.js             timezone helpers (TZ given by the supervisor), local midnights
gladys-assistant-integration.json   manifest
docs/{en,fr,de,es}.md   user documentation, re-hosted by the store
docs/illustrations/     generated widget images (render.sh, gen.mjs, render.js)
test/fixtures/icalendrier-2026.json the 365 days of a published calendar
.github/scripts/release.mjs         version, changelog, bump (tested in test/)
```

## Rules

- **Keys are forever**: the calendar id `ext:<selector>:<user>:lunar-gardening`,
  the event ids `…:type-<YYYY-MM-DD>-<constellation>`,
  `…:trajectory-<YYYY-MM-DD>-<trajectory>` and `…:avoid-<YYYY-MM-DD>` (the
  local day the event starts: a computation that moves an instant by a minute
  updates the event, never duplicates it), the values `fruit` / `root` /
  `flower` / `leaf`, `ascending` / `descending`, `yes` / `no`, `waxing` /
  `waning`, the keys of `config_schema`, of the widgets and their setting, of
  the scene triggers (fields, variables) and of the scene action (field,
  options, outputs). `test/manifest.test.js` lists them on purpose.
- **The method.** Day type = IAU constellation of the moon (real, unequal
  boundaries); a crossing outside the zodiac keeps the previous constellation
  until the next local midnight, then takes the next one; trajectory = the
  declination at local noon; days to avoid = the local days of a perigee, an
  apogee, a lunar node, a lunar (penumbral included) or a solar eclipse.
  Changes are truncated to the minute, sampled on a fixed grid (the same
  minutes whatever the start of the computation). Any change to the method
  must keep `test/almanac.test.js` at 365/365 against the published 2026
  calendar, or explain why in the pull request.
- **Days are calendar days in the timezone of Gladys** (`TZ`): never compute a
  day from UTC.
- **Calendar.** Events from 7 days back to 366 ahead, in the language of each
  user (`account.user.language`); pushed at connection, when an account or the
  configuration changes, and at midnight. The push window starts 30 days back:
  the core prunes only inside the window. At most 30 writes a minute (spaced
  by 2.1 s); a calendar with `sync: false` is skipped. About 250 events a year
  (limit 500 per request). It starts private: the user shares it.
- **Scene events.** The daily summary once a day at the event hour, remembered
  in /data. The timed triggers at the minute of the change, remembered 40 days
  in /data (same constellation or trajectory within 6 hours = same change),
  dropped when missed by more than 10 minutes. A scene action or a widget never
  fires a scene event.
- **The container rootfs is read-only.** Write only under `/data`.
- **Four languages.** Every user-facing text (manifest, `src/i18n.js`,
  `docs/*.md`, README) exists in English, French, German and Spanish
  (`test/i18n.test.js`). Use the words of the Gladys UI (Mes calendriers / My
  calendars / Meine Kalender / Mis calendarios, Activer pour moi…).
- **Widget images.** After any change to the content of a widget, run
  `docs/illustrations/render.sh` again and look at the four PNG files.
- **Versions belong to the Release workflow**: never edit `version` in
  `package.json`, the lockfile or the manifest, nor the `docker_image` tag.
  The version stays below 1.0.0 until the maintainer runs the Release workflow
  with `release-as: 1.0.0`.
- **Changelog.** Never edit CHANGELOG.md by hand, it is generated at the
  release. Write the PR title as the line the user will read.
- **Commits and PR titles** follow Conventional Commits, in English: `feat` ->
  minor, `fix` / `perf` -> patch, `!` or `BREAKING CHANGE:` -> major (minor
  below 1.0.0); `docs`, `chore`, `ci`, `test`, `style`, `refactor`, `build`
  release nothing.
- **Manifest.** Texts are objects `{ "en", "fr", "de", "es" }`; the catalog
  `description` holds 10 to 100 characters per language. No permission, no
  `countries` (the moon is the same everywhere).
- **Forum drafts** (`.github/forum-*.md`) are never committed.
- **Style.** Prettier formats, ESLint catches mistakes. Comments explain why,
  in English. Tests never touch the network.

## Pitfalls

- Truncating a change to the minute can land a few seconds before the real
  crossing: the constellation after a change is read at the exact instant,
  never at the truncated minute (a one-minute ghost segment otherwise).
- A widget card holds 2 texts at most (1 body), and the front shows the body
  above the status list whatever the order sent.
- Status values hold 40 characters, but a narrow card cuts them earlier: the
  week row of a day to avoid shows the main type only.
- The trigger filters compare with `===`: `day_type` of the daily summary is
  the longest type of the day.
- Computing a year takes about a second: the almanac is cached (40 days back,
  400 ahead) and computed again only when a span leaves it.

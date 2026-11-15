// -----------------------------------------------------------------------------
// What the integration keeps in /data/state.json (the only writable place of
// the container):
//   - `fired`     the last day the daily scene event was fired (never twice a
//                 day, even across a restart);
//   - `changes`   the timed scene events fired (`<id>@<ms>` -> ms), 40 days;
//   - `language`  the language of the last widget request.
// Written atomically (temporary file, then rename). A missing or broken file
// starts empty: everything else is computed again.
// -----------------------------------------------------------------------------

import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { isLanguage } from './i18n.js';

const DEFAULT_PATH = '/data/state.json';

/**
 * @description The state of the integration.
 * @param {object} [options] - Options.
 * @param {string|null} [options.path] - The file (null: memory only, tests).
 * @param {object} [options.logger] - Logger.
 * @returns {object} The store.
 */
function createStore({ path = DEFAULT_PATH, logger } = {}) {
  let state = { fired: null, changes: {}, language: null };

  if (path !== null) {
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8'));
      state = {
        fired: typeof raw?.fired === 'string' ? raw.fired : null,
        changes: Object.fromEntries(
          Object.entries(raw?.changes ?? {}).filter(([, time]) => Number.isFinite(time)),
        ),
        language: isLanguage(raw?.language) ? raw.language : null,
      };
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger?.warn(`state file ignored: ${error.message}`);
      }
    }
  }

  const save = () => {
    if (path === null) return;
    try {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(`${path}.tmp`, JSON.stringify(state));
      renameSync(`${path}.tmp`, path);
    } catch (error) {
      logger?.warn(`unable to save the state: ${error.message}`);
    }
  };

  return {
    /** @returns {string|null} The last day the daily scene event was fired. */
    fired: () => state.fired,
    /** @param {string} day - YYYY-MM-DD. */
    setFired(day) {
      state.fired = day;
      save();
    },
    /** @returns {object} The timed scene events fired, `<id>@<ms>` -> ms. */
    firedChanges: () => state.changes,
    /**
     * @param {string} key - `<id>@<ms>`.
     * @param {number} at - The instant of the change.
     * @param {number} keepAfter - Changes older than this are forgotten.
     */
    addFiredChange(key, at, keepAfter) {
      state.changes = Object.fromEntries(
        Object.entries(state.changes).filter(([, time]) => time >= keepAfter),
      );
      state.changes[key] = at;
      save();
    },
    /** @returns {string|null} The language of the last widget request. */
    language: () => state.language,
    /** @param {string} language - en, fr, de or es. */
    setLanguage(language) {
      state.language = language;
      save();
    },
  };
}

export { DEFAULT_PATH, createStore };

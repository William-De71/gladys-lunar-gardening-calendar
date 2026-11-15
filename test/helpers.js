// Shared helpers of the tests: a silent logger, timers that never ring (the
// tests call tick() themselves) and an almanac cached per span. Tests never
// touch the network (the integration never does).

import { computeAlmanac } from '../src/almanac.js';
import { localMidnight } from '../src/time.js';

const silent = { info() {}, warn() {}, error() {}, debug() {} };
const noTimers = { setTimer: () => null, clearTimer: () => {} };

const cache = new Map();

/**
 * @description The almanac of a span of local days, computed once per test file.
 * @param {string} from - First day, YYYY-MM-DD.
 * @param {string} to - Last day excluded, YYYY-MM-DD.
 * @param {string} [timezone] - IANA timezone.
 * @returns {object} The almanac.
 */
function almanacOf(from, to, timezone = 'Europe/Paris') {
  const key = `${from}/${to}/${timezone}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      computeAlmanac(localMidnight(from, timezone), localMidnight(to, timezone), timezone),
    );
  }
  return cache.get(key);
}

export { silent, noTimers, almanacOf };

// -----------------------------------------------------------------------------
// Fires the timed scene triggers (`day_type_changed`, `trajectory_changed`)
// at the minute of the change.
//
// One timer, set to the next change (at most 6 hours ahead, then the changes
// are looked at again). When it rings, every change reached and not fired yet
// is published. The changes fired are kept in /data for 40 days: a restart
// never fires one twice. A change of the same kind (same constellation, same
// trajectory) already fired within 6 hours is the same one, even if a new
// computation moved it by a minute. A change missed by more than 10 minutes
// (the container was stopped) is dropped: a "leaf day" scene an hour late
// would surprise more than it helps. While Gladys cannot be reached, the
// publication is retried every minute within those 10 minutes.
// -----------------------------------------------------------------------------

import { changesBetween } from './events.js';

const GRACE_MS = 10 * 60 * 1000;
const MAX_WAIT_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = 60 * 1000;
const MIN_WAIT_MS = 1000;
const KEEP_MS = 40 * 24 * 60 * 60 * 1000;
const SAME_CHANGE_MS = 6 * 60 * 60 * 1000;

/**
 * @description Create the scheduler of the timed triggers.
 * @param {object} options - Options.
 * @param {Function} options.almanac - `(from, to) => almanac` covering the span.
 * @param {object} options.store - The store (fired changes).
 * @param {Function} options.publish - `(change) => Promise<boolean>`: true once published.
 * @param {object} [options.logger] - The logger.
 * @param {Function} [options.now] - The clock.
 * @param {Function} [options.setTimer] - setTimeout.
 * @param {Function} [options.clearTimer] - clearTimeout.
 * @returns {{ start: Function, stop: Function, tick: Function }} The scheduler.
 */
function createScheduler({
  almanac,
  store,
  publish,
  logger = null,
  now = () => new Date(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  let timer = null;
  let running = false;
  // One tick at a time: the timer and the reconnection may ring together,
  // and a change must not be published twice.
  let queue = Promise.resolve();

  const alreadyFired = (change) =>
    Object.entries(store.firedChanges()).some(
      ([key, time]) =>
        key.startsWith(`${change.id}@`) && Math.abs(time - change.at) < SAME_CHANGE_MS,
    );

  const schedule = (delay) => {
    clearTimer(timer);
    if (!running) return;
    timer = setTimer(
      () => {
        tick().catch((err) => logger?.warn(`Timed triggers: ${err.message}`));
      },
      Math.max(MIN_WAIT_MS, delay),
    );
    timer?.unref?.();
  };

  /**
   * @description One tick: publish the changes reached, then wait for the next one.
   * @returns {Promise<Array<object>>} The changes published.
   */
  async function publishReached() {
    const at = now().getTime();
    const from = at - GRACE_MS;
    const to = at + MAX_WAIT_MS;
    const changes = changesBetween(almanac(from, to), from, to);
    const published = [];
    let pending = false;
    for (const change of changes.filter((entry) => entry.at <= at)) {
      if (alreadyFired(change)) continue;
      if (await publish(change)) {
        store.addFiredChange(`${change.id}@${change.at}`, change.at, at - KEEP_MS);
        published.push(change);
      } else {
        pending = true;
      }
    }
    const upcoming = changes.find((entry) => entry.at > at);
    const untilNext = upcoming ? upcoming.at - at : MAX_WAIT_MS;
    schedule(pending ? RETRY_MS : Math.min(untilNext, MAX_WAIT_MS));
    return published;
  }

  /**
   * @description Publish the changes reached, never two ticks at once.
   * @returns {Promise<Array<object>>} The changes published.
   */
  function tick() {
    const run = queue.then(publishReached);
    queue = run.catch(() => {});
    return run;
  }

  return {
    start() {
      running = true;
      return tick();
    },
    stop() {
      running = false;
      clearTimer(timer);
    },
    tick,
  };
}

export { createScheduler, GRACE_MS, MAX_WAIT_MS, RETRY_MS, KEEP_MS };

// -----------------------------------------------------------------------------
// Entry point of the Lunar gardening calendar external integration.
//
// Brings the lunar gardening calendar (Maria Thun method) into Gladys,
// computed locally:
//   - calendar: fruit, root, flower and leaf days, ascending and descending
//     moon, days to avoid, for every user who enabled the integration in
//     "My calendars" (src/calendar.js);
//   - scene triggers: a new day type, a new trajectory, a daily summary;
//   - scene action: the gardening day of today or tomorrow;
//   - dashboard widgets: today, and the next days.
//
// This file only wires the SDK client: the handlers are in src/app.js.
//
// Environment variables provided by the Gladys supervisor:
//   GLADYS_HOST_API_URL / GLADYS_INTEGRATION_TOKEN / GLADYS_INTEGRATION_SELECTOR
//   TZ (the timezone of Gladys: a day starts at its midnight)
// The SDK reads the first three: `new GladysIntegration()` is enough.
// -----------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { GladysIntegration, logger } from '@gladysassistant/integration-sdk';
import { createApp } from './src/app.js';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const gladys = new GladysIntegration();
createApp(gladys);

// --- Startup -----------------------------------------------------------------------
logger.info(`Starting the Lunar gardening calendar integration ${version}...`);
gladys.connect().catch((err) => {
  logger.error('Initial connection failed', err);
  process.exit(1);
});

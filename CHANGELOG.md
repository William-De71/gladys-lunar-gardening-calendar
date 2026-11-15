# Changelog

All notable changes to this integration are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions
follow [Semantic Versioning](https://semver.org/). This file is generated at
each release from the Conventional Commits: do not edit it by hand.

## [0.1.0] - 2026-11-15

### Added

- The lunar gardening calendar computed locally (Maria Thun method): fruit, root, flower and leaf days from the real constellations of the moon, ascending and descending moon, days to avoid (perigee, apogee, lunar nodes, eclipses). Checked day by day against a published calendar for 2026 and 2027.
- A "Lunar gardening calendar" Gladys calendar for every user who enables the integration in "My calendars": one event per day type ("Root day · Capricorn", to the minute), the ascending and descending periods and the days to avoid (both can be turned off), a year ahead, in the language of each user.
- Scene triggers "New day type" and "New moon trajectory", fired at the minute of the change, and "Daily summary" at a chosen hour, with filters on the day type, the trajectory and the days to avoid.
- Scene action "Get the gardening day" (today or tomorrow), with the advice and a ready-made sentence.
- Dashboard widgets "Gardening moon" (the day type now, until when, the next one, the trajectory, the phase, the advice) and "Garden week" (one line a day).
- English, French, German and Spanish everywhere: settings, calendar, widgets, scenes and documentation.

[0.1.0]: https://github.com/William-De71/gladys-lunar-gardening-calendar/releases/tag/v0.1.0

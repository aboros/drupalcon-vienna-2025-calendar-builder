# DrupalCon Rotterdam 2026 - Custom Schedule Builder

A simple _"web application"_ for building personalized schedules for DrupalCon Rotterdam 2026.

[See the app in action on GitHub Pages.](https://aboros.github.io/drupalcon-vienna-2025-calendar-builder/)

## Features

- **Browse Sessions**: View all DrupalCon Rotterdam 2026 sessions and events
- **Filter & Search**: Filter by date, track, or search by keywords
- **Select Sessions**: Click to select sessions you want to attend
- **Save Progress**: Your set of selected events is saved automatically to the browser's local storage to continue later
- **Download your schedule as an ICS file**

## How to Use

1. **Browse**: Use the filters to find sessions by date, track, or keywords
2. **Select**: Click on sessions to add them to your personal schedule
3. **Export**: Use "Download as ICS" to get your schedule as an `.ics` file that can be imported to a calendar application

## Data Source

Session data is sourced from the [official DrupalCon Rotterdam 2026 schedule](https://events.drupal.org/rotterdam2026/schedule) and stored in `data/events.json`. The file is refreshed automatically from the live schedule page (see [`crawl/`](crawl/) and [`docs/`](docs/)).

## Privacy

This application is built with privacy in mind:

- No user tracking
- No cookies
- No data collection
- All data stays in your browser
- Uses privacy-first analytics (Simple Analytics)

## Credits

Built with ❤️ by [aboros](https://www.drupal.org/u/aboros) for the Drupal community.

**Notes**:

- This is an unofficial tool and is not affiliated with [DrupalCon Rotterdam 2026](https://events.drupal.org/rotterdam2026)
- This app was built as a vibe-coding exercise [with Cursor](https://cursor.com/home)

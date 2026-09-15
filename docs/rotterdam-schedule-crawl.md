# Rotterdam schedule crawl — changes summary

**Date:** September 2026  
**Goal:** Stop maintaining a static `data/events.json` by hand; refresh it from the official events.drupal.org schedule HTML and publish via the existing GitHub Pages repo.

Hosting for the schedule builder app is unchanged: GitHub Pages still serves `index.html` and `data/events.json`. Only the data update path is new.

## Problem

- The app reads [`data/events.json`](../data/events.json) (Vienna-shaped event objects).
- Drupal Association publishes a richer schedule at [events.drupal.org/rotterdam2026/schedule](https://events.drupal.org/rotterdam2026/schedule) than the separate JSON export at `/export/rotterdam2026/drupalcon-schedule.json` (which lacks room, track, and session URLs).
- The previous workflow used a gitignored [`source/`](../source/) folder and a manual Python conversion from saved HTML.

## Solution

A small **crawl → convert → publish** pipeline:

1. `curl` the schedule HTML from events.drupal.org.
2. Parse session nodes with BeautifulSoup into the same JSON schema the app already uses.
3. Compare the new JSON to the committed file; **commit and push only when events change**.

The pipeline lives in [`crawl/`](../crawl/) (tracked in git). The gitignored [`source/convert/convert_schedule.py`](../source/convert/convert_schedule.py) was updated with the same date-parsing logic for local/offline use.

## New and modified files

### Added: `crawl/`

| File | Purpose |
|------|---------|
| [`crawl-and-publish.sh`](../crawl/crawl-and-publish.sh) | Orchestrates fetch, convert, git commit/push |
| [`convert_schedule.py`](../crawl/convert_schedule.py) | HTML → `{ "events": [ … ] }` |
| [`config.example.sh`](../crawl/config.example.sh) | Template for machine-local settings |
| [`requirements.txt`](../crawl/requirements.txt) | `beautifulsoup4` (root `.gitignore` ignores `requirements.txt` elsewhere; this path is force-added) |
| [`README.md`](../crawl/README.md) | Quick reference for developers |
| [`.gitignore`](../crawl/.gitignore) | Ignores `config.local.sh`, `venv/`, logs |

`config.local.sh` is created on the Pi only (not in git).

### Updated: `data/events.json`

Replaced Vienna 2025 session data with **131 Rotterdam 2026** sessions from the first automated crawl (commit `1f996bb` on `main`, pushed from the Pi).

Event object shape is unchanged:

```json
{
  "startTime": "2026-09-29T13:30:00",
  "endTime": "2026-09-29T14:15:00",
  "duration": "PT45M",
  "summary": "…",
  "location": "…",
  "description": "Speaker names",
  "link": "https://events.drupal.org/rotterdam2026/session/…",
  "track": "…"
}
```

### Updated: `source/convert/convert_schedule.py` (gitignored)

Same converter logic as `crawl/convert_schedule.py`, with default paths still pointing at `source/*.html` for manual runs.

### Updated: app copy and ICS metadata

- [`index.html`](../index.html), [`manifest.json`](../manifest.json), and [`README.md`](../README.md) — Rotterdam 2026 branding, links, and ICS timezone (`Europe/Amsterdam`).

### Unchanged

- GitHub repository: [aboros/drupalcon-schedule-builder](https://github.com/aboros/drupalcon-schedule-builder) — GitHub Pages at [aboros.github.io/drupalcon-schedule-builder](https://aboros.github.io/drupalcon-schedule-builder/).

## Converter behaviour

The parser targets Drupal session markup: `div.node--type-session` and fields such as `field--name-field-when`, `field--name-field-location`, `field--name-field-track`, `field--name-field-speakers`, and title links.

**When** text is parsed in two formats:

- Vienna-style: `Tuesday, October 14, 2025 - 09:30 to Tuesday, October 14, 2025 - 18:00`
- Rotterdam-style (same day): `Monday, September 28, 2026 - 08:45 to 17:00`

Times are stored as local ISO strings (no timezone offset in JSON), consistent with the app and ICS generation using `Europe/Amsterdam` (CEST on the official schedule).

## Safety checks in `crawl-and-publish.sh`

- Exits with an error if **0 events** are parsed (does not overwrite `data/events.json`).
- Skips git operations if the generated JSON is **byte-identical** to the current file.
- Uses a identifiable `User-Agent` when fetching the schedule page.

## Git history (reference)

| Commit | Description |
|--------|-------------|
| `1f996bb` | Update `data/events.json` from Rotterdam schedule (Pi crawl) |
| `41b386a` | Add `crawl/` scripts and documentation in-repo |

## Related docs

- [Pi deployment](./pi-crawl-setup.md) — SSH host alias, deploy key, paths, cron
- [`crawl/README.md`](../crawl/README.md) — run locally, configure a new machine

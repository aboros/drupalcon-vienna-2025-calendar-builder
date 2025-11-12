# Schedule Builder Module

A Drupal module that attaches JavaScript functionality to extract events from page HTML, allow users to select events via checkboxes, and download selected events as ICS calendar files.

## Requirements

- Drupal 10.x or 11.x
- No external dependencies (uses vanilla JavaScript)

## Installation

1. Copy the `schedule_builder` folder to your Drupal installation's `modules/custom/` directory (or use Composer if managing custom modules that way).

2. Enable the module:
   - Via Drush: `drush en schedule_builder`
   - Via Admin UI: Extend → Schedule Builder → Install

## Usage

### Basic Setup

1. **Place the Block**: 
   - Go to Structure → Block layout (or your theme's block management)
   - Add the "Schedule Builder" block to a region on a page containing event listings

2. **Configure the Block**:
   - Click "Configure" on the Schedule Builder block
   - Set the **Event Container Selector** to match your HTML structure (e.g., `.session-item`, `.event-card`)
   - Configure selectors for event properties:
     - **Event Title Selector** (required): e.g., `h2`, `.session-title`
     - **Event Start Time Selector** (required): e.g., `[data-start-time]`, `.start-time`
     - **Event End Time Selector** (required): e.g., `[data-end-time]`, `.end-time`
     - **Event Location Selector** (optional): e.g., `.location`, `[data-location]`
     - **Event Description Selector** (optional): e.g., `.description`
     - **Event Link Selector** (optional): e.g., `a.session-link`
     - **Event Track Selector** (optional): e.g., `.track`, `[data-track]`
   - Set **Timezone** for ICS file generation
   - Configure **LocalStorage Key** (unique per block instance)
   - Set **ICS Filename** for downloaded files
   - Choose **Checkbox Position** (where checkboxes appear relative to event items)

3. **Save Configuration**: The module will automatically attach checkboxes to event items and enable download functionality.

### Selector Examples

**Example HTML Structure:**
```html
<div class="session-item">
  <h2 class="session-title">Session Title</h2>
  <div class="session-time" data-start-time="2025-10-14T09:30:00" data-end-time="2025-10-14T11:00:00"></div>
  <div class="session-location">Room A</div>
  <div class="session-description">Speaker Name</div>
  <a href="/session/123" class="session-link">View Details</a>
  <span class="session-track">Track Name</span>
</div>
```

**Block Configuration:**
- Event Container Selector: `.session-item`
- Event Title Selector: `.session-title` or `h2`
- Event Start Time Selector: `[data-start-time]`
- Event End Time Selector: `[data-end-time]`
- Event Location Selector: `.session-location`
- Event Description Selector: `.session-description`
- Event Link Selector: `.session-link`
- Event Track Selector: `.session-track`

### Date/Time Formats

The module supports multiple date/time formats:

1. **ISO 8601** (preferred): `2025-10-14T09:30:00`
2. **Data attributes**: `data-start-time="2025-10-14T09:30:00"`
3. **Text content**: Various formats parsed by JavaScript `Date` object

For best results, use ISO 8601 format in data attributes.

### LocalStorage

Selected events are automatically saved to the browser's localStorage using the configured key. Each block instance uses its own key, allowing multiple instances on different pages.

### ICS File Generation

The module generates RFC 5545 compliant ICS files with:
- Proper timezone handling (VTIMEZONE definitions)
- Line folding (max 75 characters)
- Character escaping (special characters in titles, descriptions, etc.)
- All required iCalendar properties

Downloaded files can be imported into:
- Google Calendar
- Apple Calendar
- Microsoft Outlook
- Other calendar applications

## Configuration Reference

### Required Settings

- **Event Container Selector**: CSS selector for each event item
- **Event Title Selector**: Selector for event title (relative to container)
- **Event Start Time Selector**: Selector for start time
- **Event End Time Selector**: Selector for end time
- **Timezone**: Timezone for ICS generation
- **LocalStorage Key**: Unique key for storing selections
- **ICS Filename**: Filename for downloaded files

### Optional Settings

- **Event Date Selector**: If date is separate from time
- **Event Location Selector**: For location/venue
- **Event Description Selector**: For description/speaker info
- **Event Link Selector**: For event URL
- **Event Track Selector**: For track/category
- **Checkbox Position**: Where to place checkboxes

## Multiple Instances

You can place multiple Schedule Builder blocks on different pages. Each instance:
- Uses its own configuration
- Has its own localStorage key
- Works independently

Only one instance should be placed per page path.

## Troubleshooting

### No Events Found

- Check that the Event Container Selector matches your HTML structure
- Verify selectors are relative to the container
- Check browser console for warnings

### Checkboxes Not Appearing

- Ensure JavaScript is enabled
- Check that selectors are correct
- Verify events are being extracted (check console)

### ICS File Not Downloading

- Ensure at least one event is selected
- Check browser console for errors
- Verify timezone configuration

### Date/Time Parsing Issues

- Use ISO 8601 format when possible: `2025-10-14T09:30:00`
- Prefer data attributes over text content
- Check browser console for parsing warnings

## Development

### File Structure

```
schedule_builder/
├── schedule_builder.info.yml
├── schedule_builder.module
├── src/
│   └── Plugin/
│       └── Block/
│           └── ScheduleBuilderBlock.php
├── js/
│   └── schedule-builder.js
├── css/
│   └── schedule-builder.css
└── config/
    └── schema/
        └── schedule_builder.schema.yml
```

### JavaScript API

The module exposes a global `window.scheduleBuilderInstances` object containing initialized instances:

```javascript
// Access an instance
const instance = window.scheduleBuilderInstances['block_id'];
const events = instance.events;
const selectedEvents = instance.selectedEvents;
const config = instance.config;
```

## License

This module is provided as-is for use in Drupal projects.

## Credits

Developed as Phase 2 of the DrupalCon Vienna 2025 Schedule Builder project.


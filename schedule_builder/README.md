# Schedule Builder Module

A Drupal module that attaches JavaScript functionality to extract events from page HTML, allow users to select events via checkboxes, and download selected events as ICS calendar files.

The module focuses on standard iCal (RFC 5545) compliant fields: event title (SUMMARY), start and end dates/times (DTSTART/DTEND), description (DESCRIPTION), location (LOCATION), and link (URL).

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
   - **Search Context Selector** (optional): Limit search to a specific container (e.g., `.view-content`, `#main-content`). Leave empty to search the entire document.
   - Set the **Event Container Selector** to match your HTML structure (e.g., `.session-item`, `.event-card`)
   - Configure selectors for event properties:
     - **Event Title Selector** (required): e.g., `h2`, `.session-title`
     - **Event Start Time Selector** (required): e.g., `[data-start-time]`, `.start-time`, `<time datetime="...">`
     - **Event End Time Selector** (required): e.g., `[data-end-time]`, `.end-time`, `<time datetime="...">`
     - **Event Date Selector** (optional): If date is separate from time
     - **Event Location Selector** (optional): e.g., `.location`, `[data-location]`
     - **Event Description Selector** (optional): e.g., `.description`
     - **Event Link Selector** (optional): e.g., `a.session-link`
   - Set **Default Timezone** for interpreting date/time values that lack timezone information (defaults to site timezone). Dates with explicit timezone information in the source HTML will be converted to UTC automatically.
   - Configure **LocalStorage Key** (unique per block instance, auto-generated if empty)
   - Set **ICS Filename** for downloaded files (without .ics extension)
   - Choose **Checkbox Position** (beginning or end of event container)
   - **Extra Classes for Checkbox** (optional): Additional CSS classes for checkboxes
   - **Download Button Label**: Customize the download button text
   - **Extra Classes for Download Button** (optional): Additional CSS classes for the download button
   - **Enable Selection Filter**: Show dropdown to filter by all/selected/unselected events
   - **Enable Select All / Deselect All Buttons**: Show buttons to quickly select/deselect all displayed events
   - **Extra Classes for Selected Items** (optional): Additional CSS classes added to selected event containers

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

### Date/Time Formats

The module supports multiple date/time formats and extraction methods (checked in order):

1. **`datetime` attribute** (standard HTML for `<time>` elements): `<time datetime="2025-10-14T09:30:00">`
2. **Data attributes**: `data-start-time="2025-10-14T09:30:00"` or `data-end-time="2025-10-14T11:00:00"`
3. **Text content**: Various formats parsed by JavaScript `Date` object

The module also supports:
- **ISO 8601 with timezone**: `2025-10-14T09:30:00+02:00` or `2025-10-14T09:30:00Z`
- **Separate date selector**: If dates and times are in separate elements, use the optional Event Date Selector

For best results, use ISO 8601 format in `datetime` attributes or data attributes. 
- **Dates with timezone information**: Automatically converted to UTC for consistent storage
- **Dates without timezone information**: Interpreted using the configured Default Timezone setting, then converted to UTC

### LocalStorage

Selected events are automatically saved to the browser's localStorage using the configured key. Each block instance uses its own key, allowing multiple instances on different pages. Selections persist across page reloads.

Events are identified by unique IDs generated from their date, time, title, and position. This ensures consistent selection even if the page content changes slightly.

### ICS File Generation

The module generates RFC 5545 compliant ICS files with:
- Proper timezone handling (VTIMEZONE definitions with DST rules for common timezones)
- UTC format support for events with timezone information
- Line folding (max 75 characters per line)
- Character escaping (special characters in titles, descriptions, etc.)
- All required iCalendar properties (UID, DTSTAMP, DTSTART, DTEND, SUMMARY)
- Optional fields (LOCATION, DESCRIPTION with URL, URL property)

The download button is automatically disabled when no events are selected.

Downloaded files can be imported into:
- Google Calendar
- Apple Calendar
- Microsoft Outlook
- Other calendar applications supporting RFC 5545

## Configuration Reference

### Required Settings

- **Event Container Selector**: CSS selector for each event item (e.g., `.session-item`)
- **Event Title Selector**: Selector for event title/summary (maps to iCal SUMMARY)
- **Event Start Time Selector**: Selector for start time (maps to iCal DTSTART)
- **Event End Time Selector**: Selector for end time (maps to iCal DTEND)
- **Default Timezone**: Default timezone used when parsing date/time values that lack timezone information in the source HTML (defaults to site timezone). Dates with explicit timezone information (ISO 8601 format with offset or Z) will be converted to UTC automatically.
- **LocalStorage Key**: Unique key for storing selections (auto-generated if empty)
- **ICS Filename**: Filename for downloaded files (without .ics extension)
- **Download Button Label**: Text displayed on the download button

### Optional Settings

#### Event Extraction
- **Search Context Selector**: Limit search to a specific container (e.g., `.view-content`). Leave empty to search entire document.
- **Event Date Selector**: If date is separate from time elements
- **Event Location Selector**: For location/venue (maps to iCal LOCATION)
- **Event Description Selector**: For description/speaker info (maps to iCal DESCRIPTION)
- **Event Link Selector**: For event URL (maps to iCal URL)

#### UI Customization
- **Checkbox Position**: Where to place checkboxes (`beginning` or `end` of container)
- **Extra Classes for Checkbox**: Additional CSS classes for checkbox elements
- **Extra Classes for Download Button**: Additional CSS classes for the download button
- **Extra Classes for Selected Items**: Additional CSS classes added to selected event containers (in addition to `schedule-builder-selected`)

#### Filtering and Actions
- **Enable Selection Filter**: Show dropdown to filter events (all/selected/unselected)
- **Enable Select All / Deselect All Buttons**: Show buttons to quickly select/deselect all currently displayed events
- **Extra Classes for Filter Dropdown**: Additional CSS classes for the filter dropdown
- **Extra Classes for Select All Button**: Additional CSS classes for the "Select all" button
- **Extra Classes for Deselect All Button**: Additional CSS classes for the "Deselect all" button

### iCal Standard Fields

The module supports the following standard iCal (RFC 5545) fields:
- **SUMMARY** (required): Event title/summary
- **DTSTART** (required): Event start date/time
- **DTEND** (required): Event end date/time
- **DESCRIPTION** (optional): Event description (includes URL if event link is provided)
- **LOCATION** (optional): Event location/venue
- **URL** (optional): Event link/URL (also included in DESCRIPTION)

### Event Identification

Events are identified by unique IDs generated from:
- Event date (from start time)
- Event time (from start time)
- Event title (normalized)
- Container index

This ensures consistent selection matching even if page content changes slightly.

## Features

### Selection Filtering

When "Enable Selection Filter" is enabled, users can filter events by:
- **Show all**: Display all events (default)
- **Show selected only**: Display only events that are currently selected
- **Show unselected only**: Display only events that are not selected

The filter works in real-time as selections change.

### Bulk Selection Actions

When "Enable Select All / Deselect All Buttons" is enabled, users can:
- **Select all**: Select all currently displayed events (respects current filter)
- **Deselect all**: Deselect all currently displayed events (respects current filter)

These actions only affect events that are currently visible (not filtered out).

### Selected Item Styling

Selected event containers automatically receive:
- Base class: `schedule-builder-selected`
- Optional extra classes: As configured in "Extra Classes for Selected Items"

This allows for custom styling of selected events (e.g., highlighting, borders, etc.).

### HTML Structure and CSS Classes

The module adds the following HTML structure and CSS classes:

**Block Container:**
- Container: `<div class="schedule-builder-container" data-block-id="...">`
- Controls container: `<div class="schedule-builder-controls">` (if filter or actions enabled)
- Filter dropdown: `<select class="schedule-builder-selection-filter ...">`
- Action buttons: `<button class="schedule-builder-select-all ...">` and `<button class="schedule-builder-deselect-all ...">`
- Download container: `<div class="schedule-builder-download-container">`
- Download button: `<button class="schedule-builder-download-button ..." disabled>`

**Event Containers:**
- Checkbox: `<input type="checkbox" class="schedule-builder-checkbox ..." data-event-id="...">`
- Selected state: Event containers get `schedule-builder-selected` class when selected

All elements support additional CSS classes via block configuration for easy theming integration.

## Multiple Instances

You can place multiple Schedule Builder blocks on different pages. Each instance:
- Uses its own configuration
- Has its own localStorage key
- Works independently
- Has its own unique block ID

Only one instance should be placed per page path to avoid conflicts.

## Troubleshooting

### No Events Found

- Check that the Event Container Selector matches your HTML structure
- Verify selectors are relative to the container
- Ensure all required fields are present: title, start time, and end time
- Check browser console for warnings (the module logs how many containers were found vs. how many valid events were extracted)
- Events missing required fields (SUMMARY, DTSTART, or DTEND) are automatically excluded

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
- Prefer `datetime` attribute on `<time>` elements or data attributes over text content
- Include timezone information when available: `2025-10-14T09:30:00+02:00` or `2025-10-14T09:30:00Z`
- If dates lack timezone information, ensure the **Default Timezone** is configured correctly to match your source data's timezone
- Check browser console for parsing warnings
- If using separate date and time elements, configure the Event Date Selector

### Filter or Actions Not Working

- Ensure "Enable Selection Filter" or "Enable Select All / Deselect All Buttons" is checked in block configuration
- Check browser console for JavaScript errors
- Verify the block template is rendering correctly

## Development

### File Structure

```
schedule_builder/
├── schedule_builder.info.yml
├── schedule_builder.module
├── schedule_builder.libraries.yml
├── src/
│   └── Plugin/
│       └── Block/
│           └── ScheduleBuilderBlock.php
├── js/
│   └── schedule-builder.js
├── css/
│   └── schedule-builder.css
├── templates/
│   └── schedule-builder-block.html.twig
└── config/
    └── schema/
        └── schedule_builder.schema.yml
```

### JavaScript API

The module exposes a global `window.scheduleBuilderInstances` object containing initialized instances:

```javascript
// Access an instance
const instance = window.scheduleBuilderInstances['block_id'];
const events = instance.events;              // Array of extracted events
const selectedEvents = instance.selectedEvents;  // Set of selected event IDs
const config = instance.config;              // Block configuration
```

The module also exposes functions under `Drupal.scheduleBuilder` namespace for advanced usage:
- `Drupal.scheduleBuilder.extractEvents(config, context)`: Extract events from DOM
- `Drupal.scheduleBuilder.toggleEventSelection(eventId, config)`: Toggle event selection
- `Drupal.scheduleBuilder.downloadICS(blockId, config, events, selectedEvents)`: Download ICS file
- `Drupal.scheduleBuilder.applySelectionFilter(blockId, config)`: Apply selection filter
- `Drupal.scheduleBuilder.selectAllDisplayed(blockId, config)`: Select all displayed events
- `Drupal.scheduleBuilder.deselectAllDisplayed(blockId, config)`: Deselect all displayed events

## License

This module is provided as-is for use in Drupal projects.

## Credits

Developed as Phase 2 of the DrupalCon Vienna 2025 Schedule Builder project.


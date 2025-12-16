# Schedule Builder Module - Changelog

## Changes - December 15, 2025

### Fixed Checkbox Insertion and Instance Initialization

**Problem:** Checkboxes failed to insert into event containers, throwing `NotFoundError` when trying to insert relative to nested title elements. Additionally, checkbox click handlers and download button initialization failed because they tried to access instance data before it was stored.

**Solution:** Simplified checkbox insertion to always insert as a direct child of the event container, and reordered initialization to store instance data before creating UI elements.

#### Changes Made:

1. **Simplified Checkbox Insertion**:
   - Removed complex logic for inserting checkboxes relative to nested title elements
   - Checkboxes are now always inserted as direct children of the event container
   - Simplified position options to just `'beginning'` (first child) and `'end'` (last child)
   - Removed `'before-title'` and `'after-title'` position options
   - Updated default checkbox position from `'before-title'` to `'beginning'`

2. **Fixed Instance Initialization Order**:
   - Moved instance storage (`window.scheduleBuilderInstances[blockId]`) to happen BEFORE creating UI elements
   - Ensures instance data is available when `createDownloadButton()` calls `updateDownloadButton()`
   - Ensures instance data is available when checkbox click handlers call `toggleEventSelection()`
   - Prevents "Cannot read properties of undefined" errors when interacting with checkboxes

3. **Removed Backwards Compatibility Code**:
   - Removed mapping logic for legacy position options since this is initial development
   - Simplified codebase to focus on solid foundation for first version

#### Benefits:

- ✅ Reliable checkbox insertion - no more DOM manipulation errors
- ✅ Functional checkbox interactions - events can be selected/deselected without errors
- ✅ Download button works correctly - enables/disables based on selections
- ✅ Cleaner, simpler code - easier to maintain and understand
- ✅ More predictable behavior - checkboxes always appear at beginning or end of container

### Improved Event Detection and Timezone Handling

**Problem:** The module was reporting "No events found" errors even when event containers were successfully located. Additionally, the module was not properly handling Drupal's standard `<time>` elements with `datetime` attributes, and timezone information from Drupal dates was being lost.

**Solution:** Refactored event extraction to distinguish between container detection and event validation, added support for `datetime` attributes, and improved timezone preservation for ICS generation.

#### Changes Made:

1. **Improved Event Detection Logic**:
   - Separated container detection from event validation in `extractEvents()` function
   - Returns both `events` array and `containersFound` count
   - Updated `initializeScheduleBuilder()` to check for containers first, then validate events
   - More accurate error messages:
     - "No event containers found" when selector doesn't match any elements
     - "Found X container(s) but could not extract valid events" when containers exist but events are invalid

2. **Added Support for `datetime` Attribute**:
   - Updated time extraction to check `datetime` attribute first (standard HTML for `<time>` elements)
   - Priority order: `datetime` → `data-start-time`/`data-end-time` → text content
   - Works with Drupal's standard `<time datetime="2025-12-15T11:00:00Z">` format
   - Applied to both `extractEvents()` and `extractEventFromContainer()` functions

3. **Enhanced Timezone Handling**:
   - `parseDateTime()` function now preserves timezone information from ISO 8601 dates
   - Detects UTC ("Z") and offset-based timezones (e.g., "+01:00")
   - Converts all dates to UTC for consistent storage while preserving timezone metadata
   - Updated event objects to store `startTimeTimezone` and `endTimeTimezone` fields

4. **Improved ICS Generation**:
   - Uses event-specific timezone information instead of always using configured timezone
   - For UTC dates, generates `DTSTART:20251215T110000Z` format (UTC specification)
   - For dates with timezone offsets, converts to UTC and uses UTC format in ICS
   - For dates without timezone info, falls back to configured timezone with `DTSTART;TZID=` format
   - `formatDateForICS()` function now returns formatted date and UTC flag for proper format selection

#### Usage:

When configuring selectors for Drupal Views using `<time>` elements:

- **Event Start Time Selector**: `time` or `.views-field-field-date time`
- **Event End Time Selector**: `.views-field-field-end-date time`

The module will automatically read the `datetime` attribute value (e.g., `datetime="2025-12-15T11:00:00Z"`), which contains machine-readable ISO 8601 format with timezone information.

#### Benefits:

- ✅ More accurate error reporting - distinguishes between selector issues and validation problems
- ✅ Better integration with Drupal's standard date rendering using `<time>` elements
- ✅ Preserves timezone information from Drupal's datetime output
- ✅ Generates correct ICS files that respect the original timezone indicators
- ✅ Calendar applications display times correctly in user's local timezone
- ✅ More reliable date parsing - uses ISO 8601 format from `datetime` attribute instead of parsing human-readable text

#### Technical Details:

- Dates with UTC indicator (`Z`) are stored and output in ICS as UTC format
- Dates with timezone offsets (e.g., `+01:00`) are converted to UTC internally but preserve the moment in time
- The ICS format uses UTC specification (`DTSTART:...Z`) when timezone-aware dates are detected, ensuring accurate representation across different calendar applications

## Changes - Generic iCal-Compliant Refactoring

### Removed Non-Standard Fields

**Problem:** The module was too closely following the structure of the PoC JSON data, including specific fields like "track" that are not part of the iCal standard, making it less suitable for a generic contributed module.

**Solution:** Refactored the module to focus exclusively on standard iCal (RFC 5545) compliant fields.

#### Changes Made:

1. **Removed "track" field**:
   - Removed `event_track_selector` from block configuration
   - Removed track extraction logic from JavaScript
   - Removed track references from schema and documentation

2. **Standardized on iCal fields only**:
   - **SUMMARY** (required): Event title/summary
   - **DTSTART** (required): Event start date/time
   - **DTEND** (required): Event end date/time
   - **DESCRIPTION** (optional): Event description
   - **LOCATION** (optional): Event location/venue
   - **URL** (optional): Event link/URL

3. **Updated documentation**:
   - README now explicitly states iCal compliance
   - Examples updated to remove track references
   - Configuration reference updated to map fields to iCal properties

#### Benefits:

- ✅ Generic and reusable - not tied to specific use cases
- ✅ Standards-compliant - follows RFC 5545 iCal specification
- ✅ Suitable for contributed module - works with any event data structure
- ✅ Cleaner API - fewer, more focused configuration options
- ✅ Better compatibility - works with all calendar applications that support iCal

## Changes - December 15, 2025

### Added Configurable Search Context

**Problem:** The JavaScript was searching for events within the Schedule Builder block's empty container div instead of searching the entire page or a specific region where events actually exist.

**Solution:** Added a new "Search Context Selector" configuration option that allows site builders to specify where to search for events.

#### Changes Made:

1. **PHP Block Configuration (`ScheduleBuilderBlock.php`)**:
   - Added `search_context_selector` to default configuration
   - Added form field for "Search Context Selector" with description
   - Added validation and saving of the new field
   - Added `searchContext` to the JavaScript settings

2. **JavaScript (`schedule-builder.js`)**:
   - Updated `extractEvents()` function to use configurable search context
   - Updated `attachCheckboxes()` function to use configurable search context
   - Falls back to searching entire document if context selector is empty
   - Provides console warning if specified context selector doesn't find a match

#### Usage:

When configuring the Schedule Builder block:

- **Search Context Selector** (optional): CSS selector for the container to search within
  - Example: `.view-content` - searches within a View's content area
  - Example: `#main-content` - searches within the main content region
  - Leave empty to search the entire document

- **Event Container Selector** (required): CSS selector for each individual event
  - Example: `.event-item.views-row` - targets event items in a View

#### Benefits:

- ✅ More performant - searches within specific region instead of entire document
- ✅ Avoids conflicts when multiple event listings exist on the same page
- ✅ More intuitive configuration - "search in this area for items that look like this"
- ✅ Backward compatible - empty context selector searches entire document
- ✅ Better error handling with console warnings

#### Example Configuration:

For a Drupal View displaying events:
- **Search Context Selector**: `.view-event-list .view-content`
- **Event Container Selector**: `.views-row`
- **Event Title Selector**: `.views-field-title`
- **Event Start Time Selector**: `.views-field-field-event-date .start-time`
- **Event End Time Selector**: `.views-field-field-event-date .end-time`


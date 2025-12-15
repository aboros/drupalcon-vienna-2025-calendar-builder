# Schedule Builder Module - Changelog

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


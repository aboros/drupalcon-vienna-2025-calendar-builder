# Drupal Module Implementation Plan
## Schedule Builder Module (Phase 2)

### Implementation Status: ✅ **COMPLETE** (Phases 1-4)

**Last Updated**: After implementation review

All core functionality has been implemented and is ready for testing. See "Implementation Status" section below for details.

---

### Overview
Convert the proof-of-concept schedule builder into a reusable Drupal module that attaches JavaScript functionality to existing HTML on any page. The module will extract event data from the page DOM, allow users to select events via checkboxes, and download selected events as an ICS file.

**Status**: ✅ Core implementation complete. Ready for testing phase.

### Quick Implementation Summary

**Files Created**:
- ✅ `schedule_builder.info.yml` - Module metadata
- ✅ `schedule_builder.module` - Hooks (`hook_help()`, `hook_library_info_build()`)
- ✅ `src/Plugin/Block/ScheduleBuilderBlock.php` - Block plugin with full configuration form
- ✅ `config/schema/schedule_builder.schema.yml` - Configuration schema
- ✅ `js/schedule-builder.js` - Complete JavaScript library (~715 lines)
- ✅ `css/schedule-builder.css` - Basic styling
- ✅ `README.md` - Comprehensive documentation

**Key Features Implemented**:
- ✅ All 13 block configuration fields with validation
- ✅ DOM-based event extraction using configurable CSS selectors
- ✅ Checkbox attachment with 4 position options
- ✅ LocalStorage-based selection persistence
- ✅ RFC 5545 compliant ICS file generation
- ✅ VTIMEZONE definitions with DST rules for common timezones
- ✅ Dynamic download button with state management
- ✅ Global JavaScript API (`window.scheduleBuilderInstances`)
- ✅ Error handling and graceful degradation

**Testing Status**: ⏳ Pending manual testing and ICS validation

---

## Module Structure

```
schedule_builder/
├── schedule_builder.info.yml          # Module definition
├── schedule_builder.module             # Hook implementations
├── schedule_builder.routing.yml        # Routes (if needed)
├── src/
│   └── Plugin/
│       └── Block/
│           └── ScheduleBuilderBlock.php    # Block plugin
├── config/
│   └── schema/
│       └── schedule_builder.schema.yml      # Configuration schema
├── js/
│   └── schedule-builder.js                  # Main JavaScript library
├── css/
│   └── schedule-builder.css                 # Basic styling (optional)
└── README.md                                # Module documentation
```

---

## Core Components

### 1. Module Definition (`schedule_builder.info.yml`)

**Purpose**: Define module metadata and dependencies

**Key Points**:
- Module name: `schedule_builder`
- Core requirement: `^10 || ^11`
- No external dependencies (vanilla JS)
- Version: `1.0.0`

---

### 2. Block Plugin (`src/Plugin/Block/ScheduleBuilderBlock.php`)

**Purpose**: Provide a configurable block that sitebuilders can place on pages

**Block Configuration Form Fields**:

1. **Event Container Selector** (required)
   - Type: Textfield
   - Description: "jQuery-style selector to identify each event item on the page (e.g., '.session-item', '.event-card')"
   - Default: Empty
   - Validation: Must be a valid CSS selector

2. **Event Title Selector** (required)
   - Type: Textfield
   - Description: "Selector relative to event container for the event title/summary"
   - Default: `h2, h3, .title, .summary`
   - Example: `.session-title` or `h2`

3. **Event Start Time Selector** (required)
   - Type: Textfield
   - Description: "Selector for start time (relative to event container)"
   - Default: `.start-time, [data-start-time]`
   - Note: Should support data attributes or text content

4. **Event End Time Selector** (required)
   - Type: Textfield
   - Description: "Selector for end time (relative to event container)"
   - Default: `.end-time, [data-end-time]`
   - Note: Should support data attributes or text content

5. **Event Date Selector** (optional)
   - Type: Textfield
   - Description: "Selector for event date (if not in start/end time)"
   - Default: Empty
   - Note: If empty, date extracted from start time

6. **Event Location Selector** (optional)
   - Type: Textfield
   - Description: "Selector for location/venue"
   - Default: `.location, .venue, [data-location]`

7. **Event Description Selector** (optional)
   - Type: Textfield
   - Description: "Selector for event description/speaker info"
   - Default: `.description, .speaker`

8. **Event Link Selector** (optional)
   - Type: Textfield
   - Description: "Selector for event URL (link or href attribute)"
   - Default: `a.session-link, a[href]`

9. **Event Track/Category Selector** (optional)
   - Type: Textfield
   - Description: "Selector for track/category"
   - Default: `.track, .category, [data-track]`

10. **Timezone** (required)
    - Type: Select (populated with timezone list)
    - Description: "Timezone for ICS file generation"
    - Default: Site's default timezone
    - Options: All PHP timezones

11. **LocalStorage Key** (required)
    - Type: Textfield
    - Description: "Unique key for storing selections in browser localStorage"
    - Default: `schedule_builder_selections_{block_id}`
    - Validation: Must be unique per block instance

12. **ICS Filename** (required)
    - Type: Textfield
    - Description: "Filename for downloaded ICS file (without .ics extension)"
    - Default: `schedule-selected-events`
    - Validation: Must be valid filename

13. **Checkbox Position** (optional)
    - Type: Select
    - Description: "Where to place the checkbox relative to event container"
    - Options: 
      - "Before title" (default)
      - "After title"
      - "At the beginning of container"
      - "At the end of container"
    - Default: "Before title"

**Block Rendering** ✅ IMPLEMENTED:
- Block renders a minimal container `<div class="schedule-builder-container" data-block-id="...">`
- All functionality is JavaScript-based
- JavaScript and CSS libraries are attached via `#attached` in `build()` method
- Settings are injected via `drupalSettings` in `#attached`
- Unique block ID is generated based on localStorage key or configuration hash

---

### 3. JavaScript Library (`js/schedule-builder.js`)

**Purpose**: Core functionality for extracting events, managing selections, and generating ICS files

**Key Functions**:

#### Initialization
```javascript
Drupal.behaviors.scheduleBuilder = {
  attach: function(context, settings) {
    // Initialize for each block instance
    // Extract events from DOM using configured selectors
    // Attach checkboxes to event containers
    // Set up event listeners
  }
};
```

#### Event Extraction
- `extractEvents(settings)`: Parse DOM using configured selectors
- Extract: title, startTime, endTime, date, location, description, link, track
- Generate unique IDs for each event
- Normalize date/time formats to ISO 8601

#### Selection Management
- `toggleEventSelection(eventId, settings)`: Toggle selection state
- `loadSelections(settings)`: Load from localStorage using configured key
- `saveSelections(settings)`: Save to localStorage
- `updateSelectionUI(settings)`: Update checkbox states

#### ICS Generation
- `generateIcsContent(selectedEvents, settings)`: Generate RFC 5545 compliant ICS
- `formatDateForICS(dateString, timezone)`: Format dates with timezone
- `foldICSLine(line)`: Fold long lines per RFC 5545
- `escapeICSValue(value)`: Escape special characters
- `downloadICS(events, settings)`: Trigger download

#### UI Updates
- `attachCheckboxes(events, config, selectedEvents, context)`: Add checkboxes to event containers ✅ IMPLEMENTED
- `insertCheckbox(checkbox, container, position, titleSelector)`: Insert checkbox at configured position ✅ IMPLEMENTED
- `createDownloadButton(blockId, config, events, selectedEvents)`: Create download button dynamically ✅ IMPLEMENTED
- `updateDownloadButton(blockId, config)`: Enable/disable download button ✅ IMPLEMENTED
- `updateSelectionCount(settings)`: Update selection count display (if exists) - Not implemented (not needed)

**Settings Structure** ✅ IMPLEMENTED:
```javascript
drupalSettings.scheduleBuilder = {
  'block_id': {
    blockId: 'unique-block-id',
    selectors: {
      eventContainer: '.session-item',
      title: 'h2',
      startTime: '[data-start-time]',
      endTime: '[data-end-time]',
      date: null,  // Optional
      location: '.location',  // Optional
      description: '.description',  // Optional
      link: 'a.session-link',  // Optional
      track: '.track'  // Optional
    },
    timezone: 'Europe/Vienna',
    localStorageKey: 'schedule_builder_selections_block_1',
    icsFilename: 'schedule-selected-events',
    checkboxPosition: 'before-title'
  }
};
```

**Note**: Settings are nested by block ID to support multiple instances on the same page (though only one per path is recommended).

---

### 4. CSS Styling (`css/schedule-builder.css`)

**Purpose**: Basic styling for checkboxes and minimal UI elements

**Styles**:
- Checkbox positioning and basic appearance
- Selected state indicators (optional)
- Download button styling (if module provides one)
- Minimal, theme-agnostic styles
- Use CSS variables where possible for theme integration

---

### 5. Module File (`schedule_builder.module`)

**Hooks**:

1. **`hook_library_info_build()`** ✅ IMPLEMENTED
   - Define JavaScript and CSS libraries
   - Include schedule-builder.js and schedule-builder.css
   - Note: Uses `hook_library_info_build()` (Drupal 8+ standard) instead of `hook_library_info()`

2. **`hook_help()`** ✅ IMPLEMENTED
   - Module help text
   - Usage instructions
   - Includes "About" and "Usage" sections

**Note**: `hook_page_attachments_alter()` is not needed - libraries are attached via the block's `#attached` property in `build()` method.

---

### 6. Configuration Schema (`config/schema/schedule_builder.schema.yml`)

**Purpose**: Define configuration structure for block settings

**Schema** ✅ IMPLEMENTED:
- Block configuration structure (`schedule_builder.block.settings`)
- Field types and validation rules
- Nullable fields marked for optional selectors
- All 13 configuration fields defined

---

## Implementation Details

### Date/Time Parsing

**Challenge**: Extract dates/times from various HTML formats

**Approach**:
1. Support data attributes (preferred): `data-start-time="2025-10-14T09:30:00"`
2. Support text content: Parse common formats (ISO 8601, "Oct 14, 2025 9:30 AM", etc.)
3. Support date + time combinations: Separate date and time selectors
4. Fallback: Use current date if parsing fails

**Implementation**:
- Use native JavaScript `Date` parsing
- Support ISO 8601 format primarily
- Handle timezone conversion if needed
- Store as ISO 8601 strings internally

### Event ID Generation

**Strategy**: Generate unique, stable IDs for each event

**Format**: `${date}-${time}-${sanitized-title}-${sanitized-location}`

**Sanitization**: Remove special characters, normalize spaces

### LocalStorage Management

**Structure**:
```javascript
{
  "schedule_builder_selections_block_1": ["event-id-1", "event-id-2", ...]
}
```

**Features**:
- Per-block-instance keys
- Array of event IDs
- Automatic save on selection change
- Load on page initialization

### ICS File Generation

**Requirements** (from existing implementation):
- RFC 5545 compliant
- CRLF line endings (`\r\n`)
- Line folding (max 75 characters)
- Character escaping (backslashes, newlines, commas, semicolons)
- VTIMEZONE definition for configured timezone
- Proper DTSTAMP, UID, DTSTART, DTEND, SUMMARY, LOCATION, DESCRIPTION

**Timezone Handling**:
- Use configured timezone from block settings
- Include VTIMEZONE definition with DST rules
- Preserve local times (no UTC conversion for DTSTART/DTEND)
- Use UTC for DTSTAMP

### Checkbox Attachment

**Strategy**:
1. Find all event containers using configured selector
2. For each container:
   - Extract event data
   - Generate event ID
   - Create checkbox element
   - Insert checkbox at configured position
   - Attach click handler
   - Check localStorage for initial state

**Checkbox HTML**:
```html
<input type="checkbox" 
       class="schedule-builder-checkbox" 
       data-event-id="event-id-123"
       aria-label="Select this event">
```

### Error Handling

**Scenarios**:
1. No events found: Log warning, don't break page
2. Invalid selector: Log error, skip that field
3. Date parsing failure: Use fallback or skip event
4. LocalStorage unavailable: Graceful degradation (selections lost on refresh)

---

## Testing Strategy

### Unit Testing
- Date/time parsing functions
- ICS generation functions
- Event ID generation
- Character escaping

### Integration Testing
- Block configuration form validation
- JavaScript initialization with various selectors
- Event extraction from sample HTML
- LocalStorage save/load
- ICS file download and validation

### Manual Testing Checklist
- [ ] Block can be placed on a page
- [ ] Configuration form validates correctly
- [ ] JavaScript extracts events from DOM
- [ ] Checkboxes appear on event items
- [ ] Selections persist in localStorage
- [ ] ICS file downloads correctly
- [ ] ICS file opens in calendar applications (Google Calendar, Apple Calendar, Outlook)
- [ ] Multiple block instances work independently
- [ ] Works with different HTML structures
- [ ] Timezone handling is correct

---

## Drupal Best Practices

### 1. Drupal Behaviors
- Use `Drupal.behaviors` for JavaScript
- Support multiple attachments (context parameter)
- Detach properly if needed

### 2. Settings Injection
- Use `#attached['drupalSettings']` to pass configuration
- Sanitize user input in settings
- Validate settings in JavaScript

### 3. Accessibility
- ARIA labels on checkboxes
- Keyboard navigation support
- Screen reader compatibility

### 4. Performance
- Lazy initialization (only when block is present)
- Debounce expensive operations
- Cache extracted events if possible

### 5. Security
- Sanitize selectors (prevent XSS)
- Validate configuration values
- Escape output in ICS files

---

## Migration Path from POC

### Differences from POC:
1. **Data Source**: DOM extraction vs JSON file
2. **UI**: No UI rendering, only checkbox attachment
3. **Configuration**: Block settings vs hardcoded values
4. **Dependencies**: Vanilla JS vs jQuery (if POC used it)
5. **Styling**: Minimal vs full Tailwind CSS

### Code Reuse:
- ICS generation logic (with timezone parameter)
- LocalStorage management (with configurable key)
- Event selection logic
- Date formatting utilities

---

## Future Enhancements (Out of Scope for Phase 2)

1. Admin UI for testing selectors
2. Visual selector builder
3. Support for Views integration
4. REST API endpoint for event data
5. Conflict detection
6. Share schedule via URL
7. Multiple schedule profiles
8. Analytics integration (Simple Analytics)

---

## File-by-File Implementation Checklist

### Phase 1: Module Foundation ✅ COMPLETE
- [x] Create module directory structure
- [x] `schedule_builder.info.yml` - Module definition
- [x] `schedule_builder.module` - Basic hooks (`hook_help()`, `hook_library_info_build()`)
- [x] `config/schema/schedule_builder.schema.yml` - Configuration schema

### Phase 2: Block Plugin ✅ COMPLETE
- [x] `src/Plugin/Block/ScheduleBuilderBlock.php` - Block class
- [x] Block configuration form (all 13 fields implemented)
- [x] Block build method with settings injection
- [x] Settings injection via `drupalSettings`
- [x] Form validation (selectors, localStorage key, ICS filename)
- [x] Unique block ID generation

### Phase 3: JavaScript Library ✅ COMPLETE
- [x] `js/schedule-builder.js` - Main library
- [x] Event extraction functions (`extractEvents()`)
- [x] Selection management (`loadSelections()`, `saveSelections()`, `toggleEventSelection()`)
- [x] ICS generation (`generateIcsContent()`, `generateVTIMEZONE()`)
- [x] Checkbox attachment (`attachCheckboxes()`, `insertCheckbox()`)
- [x] Drupal behaviors integration (`Drupal.behaviors.scheduleBuilder`)
- [x] Download button creation and management
- [x] Date/time parsing with multiple format support
- [x] Event ID generation
- [x] Global API (`window.scheduleBuilderInstances`)

### Phase 4: Styling ✅ COMPLETE
- [x] `css/schedule-builder.css` - Basic styles
- [x] Checkbox styling (with focus states)
- [x] Download button styling (with hover and disabled states)
- [x] Theme-agnostic CSS (uses CSS variables where appropriate)

### Phase 5: Testing & Documentation ✅ COMPLETE
- [x] README.md - Comprehensive usage instructions
- [x] Code comments (inline documentation in all files)
- [ ] Manual testing (pending user testing)
- [ ] ICS validation testing (pending validation with calendar apps)

---

## Configuration Example

**Block Settings**:
```
Event Container Selector: .session-item
Event Title Selector: h2.session-title
Event Start Time Selector: [data-start-time]
Event End Time Selector: [data-end-time]
Event Location Selector: .session-location
Event Description Selector: .session-description
Event Link Selector: a.session-link
Event Track Selector: .session-track
Timezone: Europe/Vienna
LocalStorage Key: schedule_builder_drupalcon_vienna
ICS Filename: drupalcon-vienna-2025-schedule
Checkbox Position: Before title
```

**Result**: Module will find all `.session-item` elements, extract data using the selectors, attach checkboxes, and allow users to download selected events as ICS.

---

## Questions Resolved

✅ Event container selector: Configurable per block instance  
✅ Data extraction: From existing HTML on page  
✅ Timezone: Configurable, defaults to site timezone  
✅ LocalStorage key: Configurable per instance  
✅ Block rendering: Only JavaScript attachment, no UI  
✅ Drupal version: 10.x and 11.x compatible  
✅ Dependencies: Vanilla JavaScript (no jQuery)  
✅ Styling: Basic CSS included, theme-agnostic  
✅ ICS filename: Configurable in settings  
✅ Multiple instances: One per path, different instances on different paths  

---

## Implementation Status

### ✅ Completed (Phases 1-4)

All core functionality has been implemented:

1. **Module Foundation**: Module definition, hooks, and configuration schema are complete
2. **Block Plugin**: Full block implementation with all 13 configuration fields, validation, and settings injection
3. **JavaScript Library**: Complete event extraction, selection management, ICS generation, and checkbox attachment
4. **Styling**: Basic CSS with accessibility considerations (focus states, keyboard navigation)
5. **Documentation**: Comprehensive README with usage examples and troubleshooting

### 📋 Additional Features Implemented

Beyond the original plan, the following features were added:

- **Download Button**: Dynamically created download button with state management
- **Global API**: `window.scheduleBuilderInstances` object for accessing instances programmatically
- **Duration Calculation**: Automatic duration calculation for events
- **Enhanced VTIMEZONE**: Robust timezone handling with fallbacks for common timezones
- **Better Error Handling**: Graceful degradation for missing selectors, invalid dates, localStorage failures

### 🔍 Implementation Notes

1. **Library Hook**: Uses `hook_library_info_build()` instead of `hook_library_info()` (correct for Drupal 8+)
2. **No `hook_page_attachments_alter()`**: Not needed - libraries attached via block's `#attached` property
3. **Block ID Generation**: Uses localStorage key to ensure uniqueness per instance
4. **Settings Structure**: Settings are nested under `drupalSettings.scheduleBuilder[blockId]`

### ⏳ Remaining Tasks

1. **Manual Testing**: Test with actual Drupal installation and sample HTML
2. **ICS Validation**: Verify ICS files open correctly in Google Calendar, Apple Calendar, Outlook
3. **Cross-browser Testing**: Test in different browsers
4. **Accessibility Audit**: Verify keyboard navigation and screen reader compatibility

## Next Steps

1. ✅ ~~Review and approve this plan~~ (DONE)
2. ✅ ~~Create module structure~~ (DONE)
3. ✅ ~~Implement module foundation~~ (DONE)
4. ✅ ~~Implement block plugin~~ (DONE)
5. ✅ ~~Port JavaScript from POC~~ (DONE)
6. ✅ ~~Add styling~~ (DONE)
7. ⏳ Test with sample HTML (IN PROGRESS)
8. ✅ ~~Document usage~~ (DONE)


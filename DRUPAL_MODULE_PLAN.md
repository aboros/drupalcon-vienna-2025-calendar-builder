# Drupal Module Implementation Plan
## Schedule Builder Module (Phase 2)

### Overview
Convert the proof-of-concept schedule builder into a reusable Drupal module that attaches JavaScript functionality to existing HTML on any page. The module will extract event data from the page DOM, allow users to select events via checkboxes, and download selected events as an ICS file.

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

**Block Rendering**:
- Block may render nothing (empty) or a minimal container
- All functionality is JavaScript-based
- JavaScript is attached via `#attached` in `build()` method

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
- `attachCheckboxes(events, settings)`: Add checkboxes to event containers
- `updateDownloadButton(settings)`: Enable/disable download button (if exists)
- `updateSelectionCount(settings)`: Update selection count display (if exists)

**Settings Structure**:
```javascript
settings.scheduleBuilder = {
  blockId: 'unique-block-id',
  selectors: {
    eventContainer: '.session-item',
    title: 'h2',
    startTime: '[data-start-time]',
    endTime: '[data-end-time]',
    location: '.location',
    description: '.description',
    link: 'a.session-link',
    track: '.track'
  },
  timezone: 'Europe/Vienna',
  localStorageKey: 'schedule_builder_selections_block_1',
  icsFilename: 'schedule-selected-events',
  checkboxPosition: 'before-title'
};
```

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

1. **`hook_library_info()`**
   - Define JavaScript and CSS libraries
   - Include schedule-builder.js and schedule-builder.css

2. **`hook_help()`**
   - Module help text
   - Usage instructions

3. **`hook_page_attachments_alter()`** (if needed)
   - Ensure libraries are attached when block is present

---

### 6. Configuration Schema (`config/schema/schedule_builder.schema.yml`)

**Purpose**: Define configuration structure for block settings

**Schema**:
- Block configuration structure
- Field types and validation rules
- Default values

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

### Phase 1: Module Foundation
- [ ] Create module directory structure
- [ ] `schedule_builder.info.yml` - Module definition
- [ ] `schedule_builder.module` - Basic hooks
- [ ] `config/schema/schedule_builder.schema.yml` - Configuration schema

### Phase 2: Block Plugin
- [ ] `src/Plugin/Block/ScheduleBuilderBlock.php` - Block class
- [ ] Block configuration form
- [ ] Block build method
- [ ] Settings injection

### Phase 3: JavaScript Library
- [ ] `js/schedule-builder.js` - Main library
- [ ] Event extraction functions
- [ ] Selection management
- [ ] ICS generation (ported from POC)
- [ ] Checkbox attachment
- [ ] Drupal behaviors integration

### Phase 4: Styling
- [ ] `css/schedule-builder.css` - Basic styles
- [ ] Checkbox styling
- [ ] Theme integration

### Phase 5: Testing & Documentation
- [ ] README.md - Usage instructions
- [ ] Code comments
- [ ] Manual testing
- [ ] ICS validation testing

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

## Next Steps

1. Review and approve this plan
2. Create module structure
3. Implement module foundation
4. Implement block plugin
5. Port JavaScript from POC
6. Add styling
7. Test with sample HTML
8. Document usage


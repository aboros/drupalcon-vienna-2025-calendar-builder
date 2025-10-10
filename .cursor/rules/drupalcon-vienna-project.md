# DrupalCon Vienna 2025 - Custom Schedule Builder

## Project Overview

This is a privacy-first, single-page web application that allows DrupalCon Vienna 2025 attendees to build personalized conference schedules. The app runs entirely client-side with no backend, tracking, cookies, or data collection.

**Built by**: aboros (Drupal community member)  
**Not affiliated with**: DrupalCon Vienna 2025 (unofficial tool)

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), no frameworks
- **Styling**: Tailwind CSS (CDN)
- **Icons**: Font Awesome 6.0.0
- **Analytics**: Simple Analytics (privacy-first, optional)
- **Storage**: Browser localStorage only

## File Structure

```
/
├── index.html              # Main SPA with embedded JavaScript
├── data/
│   └── events.json        # Event data (manually updated)
└── README.md              # Project documentation
```

## Core Features

### 1. Event Filtering

- **By Date**: Filter events by conference day (Oct 14-17, 2025)
- **By Track**: Filter by session track (drupal cms, coding & site building, etc.)
- **By Keywords**: Real-time search across title, description, track, location
- **By Selection Status**: Show all, selected only, or unselected only

### 2. Event Selection

- Click anywhere on event card to toggle selection
- Checkbox also toggles selection
- Selected events highlighted with Drupal blue theme
- Selection state automatically saved to localStorage immediately
- Select all / Deselect all buttons for currently filtered events

### 3. Calendar Export

- **Download ICS**: Creates `.ics` file for selected events
- **Timezone**: Europe/Vienna (CET/CEST) with proper VTIMEZONE definitions
- **Event Details**: Includes title, location, description, and session URL
- **Format**: Standard iCalendar format compatible with all major calendar apps

### 4. Selection Overview Panel

- Fixed bottom panel that slides up when events are selected
- Shows total events and duration
- Expandable details with statistics by track and by day
- Only visible when user has selections

### 5. Privacy & Storage

- No server-side storage
- No cookies
- No user tracking (except optional Simple Analytics)
- All data stored in browser's localStorage under key: `drupalconSelectedEvents`

## Data Management

### Data Files

The application uses a single data file:
- **Location**: `data/events.json`
- **Format**: JSON with an `events` array
- **Update Method**: Manual editing or external conversion
- **Source**: DrupalCon Vienna 2025 official schedule

### Data Update Workflow

1. Event data is maintained in `data/events.json`
2. File must be valid JSON following the event schema
3. Application fetches this file on load via `fetch('data/events.json')`
4. No server-side processing required

## Data Structure

### Event Object (from events.json)

```javascript
{
  "startTime": "2025-10-14T09:30:00",     // ISO 8601 local time (Vienna)
  "endTime": "2025-10-14T18:00:00",       // ISO 8601 local time (Vienna)
  "duration": "PT8H30M",                   // ISO 8601 duration format
  "summary": "Session Title",              // Event name
  "location": "Room Name",                 // Venue/room
  "description": "Speaker Name(s)",        // Speaker info
  "link": "https://...",                   // Session URL
  "track": "drupal cms"                    // Category/track
}
```

### Generated Properties

- `id`: Generated as `${startTime}-${location}-${summary}` with sanitization
- `clean_title`: Sanitized version of summary for internal use

### Track Categories

- `drupal cms`
- `coding & site building`
- `agency & business`
- `infosec & devops`
- `community health`
- `open web`
- `clients & industry experiences`
- `contribution topic`
- `sponsor talks`
- `keynote`
- `coffee & lunch break time`
- `bof` (Birds of a Feather)
- `other`

## HTML Structure

### Main Components in index.html

1. **Header Section**
   - Title and branding
   - Navigation area (if applicable)

2. **Usage Instructions Section**
   - Brief instructions for users
   - Displayed at the top of the page

3. **Filters and Controls Panel** (`bg-white rounded-lg shadow-md`)
   - Keywords filter (full-width)
   - Date, Track, and Selection filters (3-column grid)
   - Action buttons: Reset filters, Select all, Deselect all

4. **Selection Overview Panel** (Fixed bottom panel, `#selectionOverview`)
   - Collapsible panel showing selected events summary
   - Expandable details with track/day breakdowns
   - Download ICS button

5. **Events Container** (`#eventsContainer`)
   - Dynamically populated with event cards
   - Events grouped by date and time slot
   - Responsive grid layout

6. **Credits Section** (`#creditsContainer`)
   - Attribution and privacy notice

### Embedded Script Structure

The `index.html` contains all JavaScript inline within a `<script>` tag at the bottom of the body:
- Event handlers are initialized in DOMContentLoaded
- All functions are defined in global scope
- Simple Analytics script loaded separately

## Key JavaScript Architecture

### Global State

```javascript
window.selectedEvents      // Set of selected event IDs
window.allEvents           // Array of all events (reference)
window.displayedEvents     // Currently filtered/displayed events
```

**Note**: Selections are automatically saved to localStorage immediately upon change, not batched.

### Core Functions

| Function | Purpose |
|----------|---------|
| `init()` | Initializes the application on DOMContentLoaded |
| `fetchEvents()` | Loads and processes events.json |
| `displayEvents(events)` | Renders event list (delegates to displayListView) |
| `displayListView(events, container)` | Renders events in list/card view |
| `filterEvents(events, filterName, skipAnalytics)` | Applies all active filters |
| `toggleEventSelection(eventId)` | Handles selection toggle and localStorage save |
| `selectAllDisplayed(events)` | Selects all currently filtered events |
| `deselectAllDisplayed(events)` | Deselects all currently filtered events |
| `generateIcsContent(events)` | Creates ICS calendar format |
| `downloadSelectedEvents(events)` | Triggers ICS file download |
| `updateSelectionOverview(events)` | Updates bottom panel stats |
| `updateStageStats(stageStats)` | Updates track and day statistics in overview |
| `updateDownloadButton()` | Enables/disables download button |

### Utility Functions

| Function | Purpose |
|----------|---------|
| `formatDate(dateString)` | Human-readable date/time |
| `formatDuration(duration)` | Converts PT1H30M to "1 hour 30 minutes" |
| `formatDateForICS(dateString)` | Formats date for ICS file format (removes separators) |
| `foldICSLine(line)` | Folds lines >75 chars per RFC 5545 with CRLF |
| `getCurrentTimestampICS()` | Generates current UTC timestamp for DTSTAMP |
| `highlightKeywords(text, keywords)` | Adds highlighting spans |
| `debounce(func, wait)` | Debounces rapid function calls |
| `groupEventsByDate(events)` | Groups events by date |
| `groupEventsByStartTime(events)` | Groups events by start time |
| `toggleClearButton()` | Shows/hides keywords clear button |
| `clearKeywordsFilter(events)` | Clears keywords and re-filters |
| `resetFilters(events)` | Resets all filters to default |
| `toggleDayExpansion(dayId)` | Toggles day details in overview |
| `toggleTrackExpansion(trackId)` | Toggles track details in overview |

## Styling Conventions

### Drupal Brand Colors

- **Primary Blue**: `rgb(0, 106, 169)`
- **Hover Blue**: `rgb(0, 85, 135)`
- **Light Blue BG**: `rgb(240, 248, 255)`

### Custom CSS Classes

| Class | Purpose |
|-------|---------|
| `.drupal-blue` | Background color |
| `.drupal-blue-hover` | Hover state |
| `.drupal-blue-text` | Text color |
| `.drupal-blue-border` | Border color |
| `.drupal-blue-focus` | Focus state |
| `.drupal-blue-bg-light` | Light background |
| `.keyword-highlight` | Yellow highlight for search matches |

## Important Implementation Details

### ICS File Generation

The application generates RFC 5545 compliant iCalendar files:

#### Timezone Handling
- Uses **Europe/Vienna** timezone (TZID)
- Includes VTIMEZONE definition with DST rules
- Preserves local times (no UTC conversion)
- DTSTAMP property uses UTC timestamp

#### RFC 5545 Compliance

**Line Endings**
- All lines must use CRLF (`\r\n`) - not just LF (`\n`)
- Template literals must be avoided in ICS generation
- Build ICS content using arrays joined with `\r\n`

**Line Folding**
- Lines must not exceed 75 characters (octets)
- Continuation lines must start with a single space
- Folding happens AFTER escaping special characters
- Function: `foldICSLine()` handles proper line folding with CRLF

**Character Escaping** (in this order)
1. Backslashes: `\` → `\\`
2. Newlines: `\n` → `\\n`
3. Commas: `,` → `\\,`
4. Semicolons: `;` → `\\;`

Applied to ALL text fields: SUMMARY, LOCATION, DESCRIPTION

**Required Fields per VEVENT**
- `UID`: Unique identifier
- `DTSTAMP`: Creation timestamp (UTC format: `YYYYMMDDTHHmmssZ`)
- `DTSTART`: Event start time
- `DTEND`: Event end time
- `SUMMARY`: Event title

#### Implementation Details
- Session URL prepended to DESCRIPTION field
- Each VEVENT uses same DTSTAMP (file creation time)
- Event UID format: `{event.id}@drupalcon-vienna-2025`

### Keyword Search

- Searches across: `summary`, `description`, `track`, `location`
- Case-insensitive matching
- Highlights matches in real-time
- Debounced for analytics (2 second delay)
- Immediate filtering for UX responsiveness

### LocalStorage Schema

```javascript
// Key: 'drupalconSelectedEvents'
// Value: JSON array of event IDs
["eventId1", "eventId2", ...]
```

## Analytics Events (Simple Analytics)

| Event Name | Trigger |
|------------|---------|
| `addSession` | When event selected (with session metadata) |
| `removeSession` | When event deselected (with session metadata) |
| `addToTrack` | Track added to selection (with track metadata) |
| `removeFromTrack` | Track removed from selection (with track metadata) |
| `dateFilter` | Date filter changed (with filter_value) |
| `trackFilter` | Track filter changed (with filter_value) |
| `keywordsFilter` | Keywords entered (debounced 2s, with filter_value) |
| `selectionFilter` | Selection filter changed (with filter_value) |
| `reset_filters` | Reset filters button clicked |
| `select_all_displayed` | Select all displayed events (with count) |
| `deselect_all_displayed` | Deselect all displayed events (with count) |
| `download_ics` | ICS file downloaded (with total_events and total_duration) |
| `selection_details_opened` | Details panel expanded |
| `selection_details_closed` | Details panel collapsed |

## Code Quality Guidelines

### When Modifying This Project

1. ✅ **No dependencies**: Keep vanilla JS, no npm/build process
2. 🔒 **Privacy first**: No tracking, no external API calls (except CDNs)
3. ♿ **Accessibility**: Maintain ARIA labels, keyboard navigation
4. ⚡ **Performance**: Debounce expensive operations, use event delegation
5. 📱 **Mobile-first**: Ensure responsive design works on all devices
6. 🎨 **Drupal branding**: Use official Drupal blue colors
7. 📊 **Analytics**: Use Simple Analytics event naming convention

### Testing Checklist

- [ ] Filter combinations work correctly
- [ ] LocalStorage saves/loads properly (automatic on selection change)
- [ ] ICS files download with correct timezone (Europe/Vienna)
- [ ] ICS files pass RFC 5545 validation (use online validator)
- [ ] ICS files handle special characters correctly (newlines, commas, semicolons in titles/descriptions)
- [ ] ICS lines are properly folded (max 75 chars) and use CRLF line endings
- [ ] Selection overview shows accurate statistics (by track and by day)
- [ ] Keyword highlighting works across all fields (title, speaker, track, location)
- [ ] Responsive design works on mobile (cards stack properly)
- [ ] Clear button appears/disappears correctly (keywords filter)
- [ ] Select all / Deselect all work with filtered results
- [ ] Selection overview panel slides up/down correctly
- [ ] Track and day expansion toggles work in overview panel

## Common Issues & Troubleshooting

### ICS Validation Errors

**Problem**: "Lines not delimited by CRLF sequence"
- **Cause**: Using `\n` instead of `\r\n` or mixing template literal newlines
- **Solution**: Build ICS using arrays joined with `\r\n`, avoid template literals with embedded newlines

**Problem**: "Missing colon ':' in line"
- **Cause**: Unescaped newlines in text fields breaking line structure
- **Solution**: Escape all newlines (`\n` → `\\n`) in SUMMARY, LOCATION, DESCRIPTION before folding

**Problem**: "Line length should not be longer than 75 characters"
- **Cause**: Long text fields not being folded
- **Solution**: Use `foldICSLine()` on all property lines

**Problem**: "Missing DTSTAMP property"
- **Cause**: DTSTAMP field not included in VEVENT
- **Solution**: Add DTSTAMP with UTC timestamp to every VEVENT

### ICS Validation Best Practices

1. **Test with multiple calendar apps**: Apple Calendar, Google Calendar, Outlook
2. **Use online validators**: icalendar.org/validator.html or similar
3. **Test edge cases**: Events with long titles, special characters, URLs in descriptions
4. **Verify timezones**: Ensure times display correctly in recipient's calendar

## Known Limitations

- Client-side only (requires browser with JavaScript enabled)
- No offline support (requires internet for CDN resources)
- No user accounts or cloud sync
- Manual data updates required
- No conflict detection for overlapping sessions

## Future Enhancement Ideas (Not Implemented)

- Conflict detection for overlapping time slots
- Share schedule via URL
- Multiple schedule profiles
- Print-friendly view
- Offline PWA support
- Dark mode toggle


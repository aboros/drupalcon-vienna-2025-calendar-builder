/**
 * @file
 * Schedule Builder JavaScript library.
 */

(function (Drupal, drupalSettings) {
  'use strict';

  /**
   * Schedule Builder behavior.
   */
  Drupal.behaviors.scheduleBuilder = {
    attach: function (context, settings) {
      if (!settings.scheduleBuilder) {
        return;
      }

      // Initialize each block instance.
      Object.keys(settings.scheduleBuilder).forEach(function (blockId) {
        const config = settings.scheduleBuilder[blockId];
        const container = context.querySelector('[data-block-id="' + blockId + '"]');
        
        if (!container) {
          return;
        }

        // Check if already initialized.
        if (container.dataset.initialized === 'true') {
          return;
        }

        // Mark as initialized.
        container.dataset.initialized = 'true';

        // Initialize the schedule builder for this block.
        initializeScheduleBuilder(blockId, config, context);
      });
    }
  };

  /**
   * Initialize schedule builder for a block instance.
   */
  function initializeScheduleBuilder(blockId, config, context) {
    // Extract events from DOM.
    const events = extractEvents(config, context);
    
    if (events.length === 0) {
      console.warn('Schedule Builder: No events found with selector: ' + config.selectors.eventContainer);
      return;
    }

    // Load saved selections from localStorage.
    const selectedEvents = loadSelections(config.localStorageKey);

    // Attach checkboxes to event containers.
    attachCheckboxes(events, config, selectedEvents, context);

    // Create download button if it doesn't exist.
    createDownloadButton(blockId, config, events, selectedEvents);

    // Store events and config for later use.
    if (!window.scheduleBuilderInstances) {
      window.scheduleBuilderInstances = {};
    }
    window.scheduleBuilderInstances[blockId] = {
      events: events,
      config: config,
      selectedEvents: selectedEvents
    };
  }

  /**
   * Extract events from DOM using configured selectors.
   */
  function extractEvents(config, context) {
    const containerSelector = config.selectors.eventContainer;
    
    // Determine search context: use configured context selector, fall back to document.
    let searchContext = document;
    if (config.selectors.searchContext) {
      const customContext = document.querySelector(config.selectors.searchContext);
      if (customContext) {
        searchContext = customContext;
      } else {
        console.warn('Schedule Builder: Search context not found with selector: ' + config.selectors.searchContext + ', falling back to document');
      }
    }
    
    const eventContainers = searchContext.querySelectorAll(containerSelector);
    const events = [];

    eventContainers.forEach(function (container, index) {
      try {
        const event = {
          id: null,
          summary: null,
          startTime: null,
          endTime: null,
          location: null,
          description: null,
          link: null,
          duration: null
        };

        // Extract title.
        if (config.selectors.title) {
          const titleEl = container.querySelector(config.selectors.title);
          if (titleEl) {
            event.summary = titleEl.textContent.trim();
          }
        }

        // Extract start time.
        if (config.selectors.startTime) {
          const startEl = container.querySelector(config.selectors.startTime);
          if (startEl) {
            const startValue = startEl.dataset.startTime || startEl.getAttribute('data-start-time') || startEl.textContent.trim();
            event.startTime = parseDateTime(startValue, config.selectors.date ? container.querySelector(config.selectors.date) : null);
          }
        }

        // Extract end time.
        if (config.selectors.endTime) {
          const endEl = container.querySelector(config.selectors.endTime);
          if (endEl) {
            const endValue = endEl.dataset.endTime || endEl.getAttribute('data-end-time') || endEl.textContent.trim();
            event.endTime = parseDateTime(endValue, config.selectors.date ? container.querySelector(config.selectors.date) : null);
          }
        }

        // Extract location.
        if (config.selectors.location) {
          const locationEl = container.querySelector(config.selectors.location);
          if (locationEl) {
            event.location = locationEl.dataset.location || locationEl.getAttribute('data-location') || locationEl.textContent.trim();
          }
        }

        // Extract description.
        if (config.selectors.description) {
          const descEl = container.querySelector(config.selectors.description);
          if (descEl) {
            event.description = descEl.textContent.trim();
          }
        }

        // Extract link.
        if (config.selectors.link) {
          const linkEl = container.querySelector(config.selectors.link);
          if (linkEl) {
            event.link = linkEl.href || linkEl.getAttribute('href') || null;
          }
        }

        // Generate unique ID and add event only if all required iCal fields are present.
        // Required fields: SUMMARY (title), DTSTART (startTime), DTEND (endTime)
        if (event.summary && event.startTime && event.endTime) {
          event.id = generateEventId(event, index);
          
          // Calculate duration from start and end times.
          const start = new Date(event.startTime);
          const end = new Date(event.endTime);
          const durationMs = end - start;
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
          event.duration = 'PT' + (hours > 0 ? hours + 'H' : '') + (minutes > 0 ? minutes + 'M' : '');

          events.push(event);
        }
      } catch (e) {
        console.warn('Schedule Builder: Error extracting event from container:', e);
      }
    });

    return events;
  }

  /**
   * Parse date/time string into ISO 8601 format.
   */
  function parseDateTime(timeValue, dateElement) {
    if (!timeValue) {
      return null;
    }

    // If it's already in ISO 8601 format, use it directly.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timeValue)) {
      return timeValue;
    }

    // Try to parse as Date object.
    let dateObj = new Date(timeValue);
    
    // If date element provided, try to combine date + time.
    if (dateElement && isNaN(dateObj.getTime())) {
      const dateValue = dateElement.textContent.trim() || dateElement.dataset.date || dateElement.getAttribute('data-date');
      if (dateValue) {
        dateObj = new Date(dateValue + ' ' + timeValue);
      }
    }

    // If still invalid, try common formats.
    if (isNaN(dateObj.getTime())) {
      // Try format: "Oct 14, 2025 9:30 AM"
      dateObj = new Date(timeValue);
    }

    if (isNaN(dateObj.getTime())) {
      console.warn('Schedule Builder: Could not parse date/time:', timeValue);
      return null;
    }

    // Convert to ISO 8601 format (local time, no timezone).
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds;
  }

  /**
   * Generate unique event ID.
   */
  function generateEventId(event, index) {
    const parts = [
      event.startTime ? event.startTime.split('T')[0] : '',
      event.startTime ? event.startTime.split('T')[1] : '',
      event.summary ? event.summary.toLowerCase().replace(/[^a-z0-9]/g, '-') : '',
      index
    ];
    return parts.filter(p => p).join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  /**
   * Extract event data from a single container.
   * Used to generate event ID for matching containers to events.
   */
  function extractEventFromContainer(container, config, containerIndex) {
    const event = {
      id: null,
      summary: null,
      startTime: null,
      endTime: null,
      location: null,
      description: null,
      link: null
    };

    // Extract title.
    if (config.selectors.title) {
      const titleEl = container.querySelector(config.selectors.title);
      if (titleEl) {
        event.summary = titleEl.textContent.trim();
      }
    }

    // Extract start time.
    if (config.selectors.startTime) {
      const startEl = container.querySelector(config.selectors.startTime);
      if (startEl) {
        const startValue = startEl.dataset.startTime || startEl.getAttribute('data-start-time') || startEl.textContent.trim();
        event.startTime = parseDateTime(startValue, config.selectors.date ? container.querySelector(config.selectors.date) : null);
      }
    }

    // Extract end time.
    if (config.selectors.endTime) {
      const endEl = container.querySelector(config.selectors.endTime);
      if (endEl) {
        const endValue = endEl.dataset.endTime || endEl.getAttribute('data-end-time') || endEl.textContent.trim();
        event.endTime = parseDateTime(endValue, config.selectors.date ? container.querySelector(config.selectors.date) : null);
      }
    }

    // Extract location.
    if (config.selectors.location) {
      const locationEl = container.querySelector(config.selectors.location);
      if (locationEl) {
        event.location = locationEl.dataset.location || locationEl.getAttribute('data-location') || locationEl.textContent.trim();
      }
    }

    // Extract description.
    if (config.selectors.description) {
      const descEl = container.querySelector(config.selectors.description);
      if (descEl) {
        event.description = descEl.textContent.trim();
      }
    }

    // Extract link.
    if (config.selectors.link) {
      const linkEl = container.querySelector(config.selectors.link);
      if (linkEl) {
        event.link = linkEl.href || linkEl.getAttribute('href') || null;
      }
    }

    // Generate unique ID if we have all required iCal fields.
    // Required fields: SUMMARY (title), DTSTART (startTime), DTEND (endTime)
    if (event.summary && event.startTime && event.endTime) {
      event.id = generateEventId(event, containerIndex);
    }

    return event;
  }

  /**
   * Attach checkboxes to event containers.
   */
  function attachCheckboxes(events, config, selectedEvents, context) {
    const containerSelector = config.selectors.eventContainer;
    
    // Determine search context: use configured context selector, fall back to document.
    let searchContext = document;
    if (config.selectors.searchContext) {
      const customContext = document.querySelector(config.selectors.searchContext);
      if (customContext) {
        searchContext = customContext;
      }
    }
    
    const eventContainers = searchContext.querySelectorAll(containerSelector);

    // Create a map of event ID to event for efficient lookup.
    const eventsById = {};
    events.forEach(function (event) {
      if (event.id) {
        eventsById[event.id] = event;
      }
    });

    eventContainers.forEach(function (container, containerIndex) {
      // Skip if checkbox already exists.
      if (container.querySelector('.schedule-builder-checkbox')) {
        return;
      }

      // Extract event data from container to generate its ID.
      const containerEvent = extractEventFromContainer(container, config, containerIndex);
      
      // Only attach checkbox if container has required fields and matches an extracted event.
      if (!containerEvent.id) {
        return;
      }

      // Look up the event by ID instead of array index.
      const event = eventsById[containerEvent.id];
      if (!event) {
        return;
      }

      // Create checkbox.
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'schedule-builder-checkbox';
      checkbox.setAttribute('data-event-id', event.id);
      checkbox.setAttribute('aria-label', 'Select event: ' + (event.summary || 'Untitled'));
      
      if (selectedEvents.has(event.id)) {
        checkbox.checked = true;
      }

      // Attach click handler.
      checkbox.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleEventSelection(event.id, config);
      });

      // Insert checkbox at configured position.
      insertCheckbox(checkbox, container, config.checkboxPosition, config.selectors.title);
    });
  }

  /**
   * Insert checkbox at specified position.
   */
  function insertCheckbox(checkbox, container, position, titleSelector) {
    switch (position) {
      case 'before-title':
        const titleEl = container.querySelector(titleSelector);
        if (titleEl) {
          container.insertBefore(checkbox, titleEl);
        } else {
          container.insertBefore(checkbox, container.firstChild);
        }
        break;

      case 'after-title':
        const titleEl2 = container.querySelector(titleSelector);
        if (titleEl2 && titleEl2.nextSibling) {
          container.insertBefore(checkbox, titleEl2.nextSibling);
        } else if (titleEl2) {
          container.appendChild(checkbox);
        } else {
          container.insertBefore(checkbox, container.firstChild);
        }
        break;

      case 'beginning':
        container.insertBefore(checkbox, container.firstChild);
        break;

      case 'end':
        container.appendChild(checkbox);
        break;

      default:
        container.insertBefore(checkbox, container.firstChild);
    }
  }

  /**
   * Toggle event selection.
   */
  function toggleEventSelection(eventId, config) {
    const instance = window.scheduleBuilderInstances[config.blockId];
    if (!instance) {
      return;
    }

    const selectedEvents = instance.selectedEvents;

    if (selectedEvents.has(eventId)) {
      selectedEvents.delete(eventId);
    } else {
      selectedEvents.add(eventId);
    }

    // Save to localStorage.
    saveSelections(config.localStorageKey, selectedEvents);

    // Update download button.
    updateDownloadButton(config.blockId, config);
  }

  /**
   * Load selections from localStorage.
   */
  function loadSelections(localStorageKey) {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Schedule Builder: Could not load selections from localStorage:', e);
    }
    return new Set();
  }

  /**
   * Save selections to localStorage.
   */
  function saveSelections(localStorageKey, selectedEvents) {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify([...selectedEvents]));
    } catch (e) {
      console.warn('Schedule Builder: Could not save selections to localStorage:', e);
    }
  }

  /**
   * Create download button.
   */
  function createDownloadButton(blockId, config, events, selectedEvents) {
    // Check if button already exists.
    const existingButton = document.querySelector('[data-schedule-builder-download="' + blockId + '"]');
    if (existingButton) {
      return;
    }

    // Create button container.
    const container = document.querySelector('[data-block-id="' + blockId + '"]');
    if (!container) {
      return;
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'schedule-builder-download-container';
    
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'schedule-builder-download-button';
    button.setAttribute('data-schedule-builder-download', blockId);
    button.textContent = 'Download Selected Events as ICS';
    button.disabled = selectedEvents.size === 0;

    button.addEventListener('click', function () {
      downloadICS(blockId, config, events, selectedEvents);
    });

    buttonContainer.appendChild(button);
    container.appendChild(buttonContainer);

    // Update button state.
    updateDownloadButton(blockId, config);
  }

  /**
   * Update download button state.
   */
  function updateDownloadButton(blockId, config) {
    const instance = window.scheduleBuilderInstances[blockId];
    if (!instance) {
      return;
    }

    const button = document.querySelector('[data-schedule-builder-download="' + blockId + '"]');
    if (button) {
      button.disabled = instance.selectedEvents.size === 0;
    }
  }

  /**
   * Download ICS file.
   */
  function downloadICS(blockId, config, events, selectedEvents) {
    const instance = window.scheduleBuilderInstances[blockId];
    if (!instance) {
      return;
    }

    const selectedEventIds = Array.from(selectedEvents);
    const selectedEventsList = events.filter(function (event) {
      return selectedEventIds.includes(event.id);
    });

    if (selectedEventsList.length === 0) {
      return;
    }

    const icsContent = generateIcsContent(selectedEventsList, config);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = config.icsFilename + '.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate ICS content for selected events.
   */
  function generateIcsContent(events, config) {
    const dtstamp = getCurrentTimestampICS();
    const timezone = config.timezone || 'UTC';

    // Filter out events missing required iCal fields (SUMMARY, DTSTART, DTEND).
    // This is a safety check even though events should already be validated during extraction.
    const validEvents = events.filter(function (event) {
      return event.summary && event.startTime && event.endTime;
    });

    if (validEvents.length === 0) {
      console.warn('Schedule Builder: No valid events with required fields (title, startTime, endTime) to generate ICS.');
      return '';
    }

    const icsEvents = validEvents.map(function (event) {
      const start = formatDateForICS(event.startTime);
      const end = formatDateForICS(event.endTime);
      
      // Additional safety check: ensure formatted dates are not empty.
      // This should never happen if events are properly validated, but provides extra protection.
      if (!start || !end) {
        console.warn('Schedule Builder: Skipping event with invalid date format:', event.id, event.summary);
        return null;
      }
      
      const uid = event.id + '@schedule-builder';

      // Escape special characters.
      const escapedSummary = escapeICSValue(event.summary || '');
      const escapedLocation = escapeICSValue(event.location || '');
      const urlPart = event.link ? event.link + '\\n\\n' : '';
      const escapedDescription = urlPart + escapeICSValue(event.description || '');

      const eventLines = [
        'BEGIN:VEVENT',
        foldICSLine('UID:' + uid),
        foldICSLine('DTSTAMP:' + dtstamp),
        foldICSLine('DTSTART;TZID=' + timezone + ':' + start),
        foldICSLine('DTEND;TZID=' + timezone + ':' + end),
        foldICSLine('SUMMARY:' + escapedSummary),
        foldICSLine('LOCATION:' + escapedLocation),
        foldICSLine('DESCRIPTION:' + escapedDescription),
        'END:VEVENT'
      ];

      return eventLines.join('\r\n');
    }).filter(function (icsEvent) {
      return icsEvent !== null;
    }).join('\r\n');

    // Generate VTIMEZONE definition.
    const vtimezone = generateVTIMEZONE(timezone);

    const calendarLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Schedule Builder//EN',
      'X-WR-CALNAME:Selected Events',
      'X-WR-TIMEZONE:' + timezone,
      vtimezone,
      icsEvents,
      'END:VCALENDAR'
    ];

    return calendarLines.join('\r\n');
  }

  /**
   * Format date for ICS (remove separators).
   */
  function formatDateForICS(dateString) {
    if (!dateString) {
      return '';
    }
    return dateString.replace(/[-:]/g, '').replace(/\.\d+/, '');
  }

  /**
   * Fold long lines according to RFC 5545.
   */
  function foldICSLine(line) {
    if (line.length <= 75) {
      return line;
    }

    const result = [];
    let currentPos = 0;

    result.push(line.substring(0, 75));
    currentPos = 75;

    while (currentPos < line.length) {
      result.push(' ' + line.substring(currentPos, currentPos + 74));
      currentPos += 74;
    }

    return result.join('\r\n');
  }

  /**
   * Escape special characters for ICS format.
   */
  function escapeICSValue(value) {
    if (!value) {
      return '';
    }
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  /**
   * Generate current timestamp in ICS format (UTC).
   */
  function getCurrentTimestampICS() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return year + month + day + 'T' + hours + minutes + seconds + 'Z';
  }

  /**
   * Generate VTIMEZONE definition for a timezone.
   * Handles common timezones with proper DST rules.
   */
  function generateVTIMEZONE(timezone) {
    const tzid = timezone;
    
    // Common timezone definitions with DST rules.
    const timezoneDefinitions = {
      'Europe/Vienna': {
        standard: {
          dtstart: '19701025T030000',
          offsetFrom: '+0200',
          offsetTo: '+0100',
          rrule: 'FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU'
        },
        daylight: {
          dtstart: '19700329T020000',
          offsetFrom: '+0100',
          offsetTo: '+0200',
          rrule: 'FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU'
        }
      },
      'America/New_York': {
        standard: {
          dtstart: '20071104T020000',
          offsetFrom: '-0400',
          offsetTo: '-0500',
          rrule: 'FREQ=YEARLY;BYMONTH=11;BYDAY=1SU'
        },
        daylight: {
          dtstart: '20070311T020000',
          offsetFrom: '-0500',
          offsetTo: '-0400',
          rrule: 'FREQ=YEARLY;BYMONTH=3;BYDAY=2SU'
        }
      },
      'America/Los_Angeles': {
        standard: {
          dtstart: '20071104T020000',
          offsetFrom: '-0700',
          offsetTo: '-0800',
          rrule: 'FREQ=YEARLY;BYMONTH=11;BYDAY=1SU'
        },
        daylight: {
          dtstart: '20070311T020000',
          offsetFrom: '-0800',
          offsetTo: '-0700',
          rrule: 'FREQ=YEARLY;BYMONTH=3;BYDAY=2SU'
        }
      },
      'Europe/London': {
        standard: {
          dtstart: '19961027T020000',
          offsetFrom: '+0100',
          offsetTo: '+0000',
          rrule: 'FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU'
        },
        daylight: {
          dtstart: '19960331T010000',
          offsetFrom: '+0000',
          offsetTo: '+0100',
          rrule: 'FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU'
        }
      },
      'UTC': {
        standard: {
          dtstart: '19700101T000000',
          offsetFrom: '+0000',
          offsetTo: '+0000',
          rrule: ''
        }
      }
    };

    // If we have a definition, use it.
    if (timezoneDefinitions[timezone]) {
      const def = timezoneDefinitions[timezone];
      const lines = [
        'BEGIN:VTIMEZONE',
        'TZID:' + tzid
      ];

      if (def.daylight) {
        lines.push(
          'BEGIN:DAYLIGHT',
          'DTSTART:' + def.daylight.dtstart,
          'RRULE:' + def.daylight.rrule,
          'TZOFFSETFROM:' + def.daylight.offsetFrom,
          'TZOFFSETTO:' + def.daylight.offsetTo,
          'END:DAYLIGHT'
        );
      }

      if (def.standard) {
        lines.push(
          'BEGIN:STANDARD',
          'DTSTART:' + def.standard.dtstart
        );
        if (def.standard.rrule) {
          lines.push('RRULE:' + def.standard.rrule);
        }
        lines.push(
          'TZOFFSETFROM:' + def.standard.offsetFrom,
          'TZOFFSETTO:' + def.standard.offsetTo,
          'END:STANDARD'
        );
      }

      lines.push('END:VTIMEZONE');
      return lines.join('\r\n');
    }

    // Fallback: Generate a basic VTIMEZONE without DST rules.
    // This works for timezones without DST or as a fallback.
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(now);
      const tzName = parts.find(p => p.type === 'timeZoneName');
      
      // Get offset.
      const offset = -now.getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(offset) / 60);
      const offsetMinutes = Math.abs(offset) % 60;
      const offsetStr = (offset >= 0 ? '+' : '-') + 
        String(offsetHours).padStart(2, '0') + 
        String(offsetMinutes).padStart(2, '0');

      return [
        'BEGIN:VTIMEZONE',
        'TZID:' + tzid,
        'BEGIN:STANDARD',
        'DTSTART:19700101T000000',
        'TZOFFSETFROM:' + offsetStr,
        'TZOFFSETTO:' + offsetStr,
        'END:STANDARD',
        'END:VTIMEZONE'
      ].join('\r\n');
    } catch (e) {
      // Ultimate fallback.
      return [
        'BEGIN:VTIMEZONE',
        'TZID:' + tzid,
        'BEGIN:STANDARD',
        'DTSTART:19700101T000000',
        'TZOFFSETFROM:+0000',
        'TZOFFSETTO:+0000',
        'END:STANDARD',
        'END:VTIMEZONE'
      ].join('\r\n');
    }
  }

})(Drupal, drupalSettings);


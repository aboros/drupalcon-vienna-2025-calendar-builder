/**
 * @file
 * Schedule Builder JavaScript library.
 */

(function (Drupal, drupalSettings) {
  'use strict';

  /**
   * Schedule Builder namespace.
   */
  Drupal.scheduleBuilder = Drupal.scheduleBuilder || {};

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
        Drupal.scheduleBuilder.initialize(blockId, config, context);
      });
    }
  };

  /**
   * Initialize schedule builder for a block instance.
   */
  Drupal.scheduleBuilder.initialize = function (blockId, config, context) {
    // Extract events from DOM.
    const extractionResult = Drupal.scheduleBuilder.extractEvents(config, context);
    const events = extractionResult.events;
    
    if (extractionResult.containersFound === 0) {
      console.warn('Schedule Builder: No event containers found with selector: ' + config.selectors.eventContainer);
      return;
    }
    
    if (events.length === 0) {
      console.warn('Schedule Builder: Found ' + extractionResult.containersFound + ' event container(s) with selector "' + config.selectors.eventContainer + '", but could not extract valid events (missing required fields: summary, startTime, or endTime)');
      return;
    }

    // Load saved selections from localStorage.
    const selectedEvents = Drupal.scheduleBuilder.loadSelections(config.localStorageKey);

    // Store events and config for later use BEFORE creating UI elements.
    if (!window.scheduleBuilderInstances) {
      window.scheduleBuilderInstances = {};
    }
    window.scheduleBuilderInstances[blockId] = {
      events: events,
      config: config,
      selectedEvents: selectedEvents
    };

    // Attach checkboxes to event containers.
    Drupal.scheduleBuilder.attachCheckboxes(events, config, selectedEvents, context);

    // Create download button if it doesn't exist.
    Drupal.scheduleBuilder.createDownloadButton(blockId, config, events, selectedEvents);
  };

  /**
   * Extract events from DOM using configured selectors.
   * Returns an object with events array and containersFound count.
   */
  Drupal.scheduleBuilder.extractEvents = function (config, context) {
    
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
    
    const eventContainers = searchContext.querySelectorAll(config.selectors.eventContainer);
    const containersFound = eventContainers.length;
    const events = [];

    eventContainers.forEach(function (container, index) {
      try {
        const event = {
          id: null,
          summary: null,
          startTime: null,
          endTime: null,
          startTimeTimezone: null,
          endTimeTimezone: null,
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
            // Check datetime attribute first (standard HTML for <time> elements), then data attributes, then text content.
            const startValue = startEl.getAttribute('datetime') || startEl.dataset.startTime || startEl.getAttribute('data-start-time') || startEl.textContent.trim();
            const startParsed = Drupal.scheduleBuilder.parseDateTime(startValue, config.selectors.date ? container.querySelector(config.selectors.date) : null);
            event.startTime = startParsed.dateTime;
            event.startTimeTimezone = startParsed.timezone;
          }
        }

        // Extract end time.
        if (config.selectors.endTime) {
          const endEl = container.querySelector(config.selectors.endTime);
          if (endEl) {
            // Check datetime attribute first (standard HTML for <time> elements), then data attributes, then text content.
            const endValue = endEl.getAttribute('datetime') || endEl.dataset.endTime || endEl.getAttribute('data-end-time') || endEl.textContent.trim();
            const endParsed = Drupal.scheduleBuilder.parseDateTime(endValue, config.selectors.date ? container.querySelector(config.selectors.date) : null);
            event.endTime = endParsed.dateTime;
            event.endTimeTimezone = endParsed.timezone;
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
          event.id = Drupal.scheduleBuilder.generateEventId(event, index);
          
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

    return {
      events: events,
      containersFound: containersFound
    };
  };

  /**
   * Parse date/time string into ISO 8601 format, preserving timezone information.
   * Returns an object with dateTime (ISO string in UTC) and timezone info.
   */
  Drupal.scheduleBuilder.parseDateTime = function (timeValue, dateElement) {
    if (!timeValue) {
      return { dateTime: null, timezone: null };
    }

    // Try to parse as Date object (handles ISO 8601 with timezone automatically).
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
      dateObj = new Date(timeValue);
    }

    if (isNaN(dateObj.getTime())) {
      console.warn('Schedule Builder: Could not parse date/time:', timeValue);
      return { dateTime: null, timezone: null };
    }

    // Check if input was in ISO 8601 format with timezone indicator.
    // Extract timezone info from original string for proper ICS generation.
    let timezone = null;
    let hadTimezone = false;
    const isoWithTimezoneMatch = timeValue.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})([Z+\-]\d{2}:?\d{2})?$/);
    if (isoWithTimezoneMatch) {
      const timezonePart = isoWithTimezoneMatch[2];
      if (timezonePart) {
        hadTimezone = true;
        if (timezonePart === 'Z') {
          timezone = 'UTC';
        } else {
          // For offset-based timezones (e.g., "+01:00"), the Date object converts them
          // to UTC correctly. We mark as UTC so ICS uses UTC format (DTSTART:...Z),
          // which preserves the correct moment in time regardless of the original offset.
          timezone = 'UTC';
        }
      }
    }

    // Convert to ISO 8601 format in UTC (for consistent storage).
    // The Date object has already converted to UTC if timezone was present.
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    const hours = String(dateObj.getUTCHours()).padStart(2, '0');
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');

    // Return UTC time with 'Z' indicator if the original had a timezone.
    // This ensures we use UTC format in ICS, preserving the moment in time.
    const dateTime = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + (hadTimezone ? 'Z' : '');

    return {
      dateTime: dateTime,
      timezone: timezone
    };
  };

  /**
   * Generate unique event ID.
   */
  Drupal.scheduleBuilder.generateEventId = function (event, index) {
    const parts = [
      event.startTime ? event.startTime.split('T')[0] : '',
      event.startTime ? event.startTime.split('T')[1] : '',
      event.summary ? event.summary.toLowerCase().replace(/[^a-z0-9]/g, '-') : '',
      index
    ];
    return parts.filter(p => p).join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  /**
   * Extract event data from a single container.
   * Used to generate event ID for matching containers to events.
   */
  Drupal.scheduleBuilder.extractEventFromContainer = function (container, config, containerIndex) {
    const event = {
      id: null,
      summary: null,
      startTime: null,
      endTime: null,
      startTimeTimezone: null,
      endTimeTimezone: null,
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
        // Check datetime attribute first (standard HTML for <time> elements), then data attributes, then text content.
        const startValue = startEl.getAttribute('datetime') || startEl.dataset.startTime || startEl.getAttribute('data-start-time') || startEl.textContent.trim();
        const startParsed = Drupal.scheduleBuilder.parseDateTime(startValue, config.selectors.date ? container.querySelector(config.selectors.date) : null);
        event.startTime = startParsed.dateTime;
        event.startTimeTimezone = startParsed.timezone;
      }
    }

    // Extract end time.
    if (config.selectors.endTime) {
      const endEl = container.querySelector(config.selectors.endTime);
      if (endEl) {
        // Check datetime attribute first (standard HTML for <time> elements), then data attributes, then text content.
        const endValue = endEl.getAttribute('datetime') || endEl.dataset.endTime || endEl.getAttribute('data-end-time') || endEl.textContent.trim();
        const endParsed = Drupal.scheduleBuilder.parseDateTime(endValue, config.selectors.date ? container.querySelector(config.selectors.date) : null);
        event.endTime = endParsed.dateTime;
        event.endTimeTimezone = endParsed.timezone;
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
        event.id = Drupal.scheduleBuilder.generateEventId(event, containerIndex);
    }

    return event;
  };

  /**
   * Attach checkboxes to event containers.
   */
  Drupal.scheduleBuilder.attachCheckboxes = function (events, config, selectedEvents, context) {
    // Determine search context: use configured context selector, fall back to document.
    let searchContext = document;
    if (config.selectors.searchContext) {
      const customContext = document.querySelector(config.selectors.searchContext);
      if (customContext) {
        searchContext = customContext;
      }
    }
    
    const eventContainers = searchContext.querySelectorAll(config.selectors.eventContainer);

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
      const containerEvent = Drupal.scheduleBuilder.extractEventFromContainer(container, config, containerIndex);
      
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
        Drupal.scheduleBuilder.toggleEventSelection(event.id, config);
      });

      // Insert checkbox at configured position.
      Drupal.scheduleBuilder.insertCheckbox(checkbox, container, config.checkboxPosition);
    });
  };

  /**
   * Insert checkbox as a direct child of the event container.
   * Position options: 'beginning' (first child) or 'end' (last child).
   */
  Drupal.scheduleBuilder.insertCheckbox = function (checkbox, container, position) {
    if (position === 'end') {
      container.appendChild(checkbox);
    } else {
      // Default to beginning.
      if (container.firstChild) {
        container.insertBefore(checkbox, container.firstChild);
      } else {
        container.appendChild(checkbox);
      }
    }
  };

  /**
   * Toggle event selection.
   */
  Drupal.scheduleBuilder.toggleEventSelection = function (eventId, config) {
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
    Drupal.scheduleBuilder.saveSelections(config.localStorageKey, selectedEvents);

    // Update download button.
    Drupal.scheduleBuilder.updateDownloadButton(config.blockId, config);
  };

  /**
   * Load selections from localStorage.
   */
  Drupal.scheduleBuilder.loadSelections = function (localStorageKey) {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Schedule Builder: Could not load selections from localStorage:', e);
    }
    return new Set();
  };

  /**
   * Save selections to localStorage.
   */
  Drupal.scheduleBuilder.saveSelections = function (localStorageKey, selectedEvents) {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify([...selectedEvents]));
    } catch (e) {
      console.warn('Schedule Builder: Could not save selections to localStorage:', e);
    }
  };

  /**
   * Create download button.
   */
  Drupal.scheduleBuilder.createDownloadButton = function (blockId, config, events, selectedEvents) {
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
      Drupal.scheduleBuilder.downloadICS(blockId, config, events, selectedEvents);
    });

    buttonContainer.appendChild(button);
    container.appendChild(buttonContainer);

    // Update button state.
    Drupal.scheduleBuilder.updateDownloadButton(blockId, config);
  };

  /**
   * Update download button state.
   */
  Drupal.scheduleBuilder.updateDownloadButton = function (blockId, config) {
    const instance = window.scheduleBuilderInstances[blockId];
    if (!instance) {
      return;
    }

    const button = document.querySelector('[data-schedule-builder-download="' + blockId + '"]');
    if (button) {
      button.disabled = instance.selectedEvents.size === 0;
    }
  };

  /**
   * Download ICS file.
   */
  Drupal.scheduleBuilder.downloadICS = function (blockId, config, events, selectedEvents) {
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

    const icsContent = Drupal.scheduleBuilder.generateIcsContent(selectedEventsList, config);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = config.icsFilename + '.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Generate ICS content for selected events.
   */
  Drupal.scheduleBuilder.generateIcsContent = function (events, config) {
    const dtstamp = Drupal.scheduleBuilder.getCurrentTimestampICS();
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
      // Use event's timezone if available, otherwise fall back to configured timezone.
      const eventTimezone = event.startTimeTimezone || timezone;
      const eventEndTimezone = event.endTimeTimezone || timezone;
      
      // Format dates for ICS, preserving UTC format if applicable.
      const startFormatted = Drupal.scheduleBuilder.formatDateForICS(event.startTime, eventTimezone);
      const endFormatted = Drupal.scheduleBuilder.formatDateForICS(event.endTime, eventEndTimezone);
      
      // Additional safety check: ensure formatted dates are not empty.
      // This should never happen if events are properly validated, but provides extra protection.
      if (!startFormatted.formatted || !endFormatted.formatted) {
        console.warn('Schedule Builder: Skipping event with invalid date format:', event.id, event.summary);
        return null;
      }
      
      const uid = event.id + '@schedule-builder';

      // Escape special characters.
      const escapedSummary = Drupal.scheduleBuilder.escapeICSValue(event.summary || '');
      const escapedLocation = Drupal.scheduleBuilder.escapeICSValue(event.location || '');
      const urlPart = event.link ? event.link + '\\n\\n' : '';
      const escapedDescription = urlPart + Drupal.scheduleBuilder.escapeICSValue(event.description || '');

      // Build DTSTART and DTEND with appropriate format (UTC or TZID).
      const dtstart = startFormatted.isUTC ? 'DTSTART:' + startFormatted.formatted : 'DTSTART;TZID=' + eventTimezone + ':' + startFormatted.formatted;
      const dtend = endFormatted.isUTC ? 'DTEND:' + endFormatted.formatted : 'DTEND;TZID=' + eventEndTimezone + ':' + endFormatted.formatted;

      const eventLines = [
        'BEGIN:VEVENT',
        Drupal.scheduleBuilder.foldICSLine('UID:' + uid),
        Drupal.scheduleBuilder.foldICSLine('DTSTAMP:' + dtstamp),
        Drupal.scheduleBuilder.foldICSLine(dtstart),
        Drupal.scheduleBuilder.foldICSLine(dtend),
        Drupal.scheduleBuilder.foldICSLine('SUMMARY:' + escapedSummary),
        Drupal.scheduleBuilder.foldICSLine('LOCATION:' + escapedLocation),
        Drupal.scheduleBuilder.foldICSLine('DESCRIPTION:' + escapedDescription),
        'END:VEVENT'
      ];

      return eventLines.join('\r\n');
    }).filter(function (icsEvent) {
      return icsEvent !== null;
    }).join('\r\n');

    // Generate VTIMEZONE definition.
    const vtimezone = Drupal.scheduleBuilder.generateVTIMEZONE(timezone);

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
  };

  /**
   * Format date for ICS (remove separators).
   * Returns an object with formatted date string and isUTC flag.
   */
  Drupal.scheduleBuilder.formatDateForICS = function (dateString, timezone) {
    if (!dateString) {
      return { formatted: '', isUTC: false };
    }
    
    // If the date string ends with 'Z', it's UTC.
    const isUTC = timezone === 'UTC' || dateString.endsWith('Z');
    
    // Remove separators and timezone indicator, keep just the date/time part.
    // For UTC dates, we'll add 'Z' back in the ICS format.
    let formatted = dateString.replace(/[-:]/g, '').replace(/\.\d+/, '').replace(/[Z+\-]\d{2}:?\d{2}$/, '');
    
    // For UTC dates, append 'Z' for ICS format.
    if (isUTC) {
      formatted = formatted + 'Z';
    }
    
    return {
      formatted: formatted,
      isUTC: isUTC
    };
  };

  /**
   * Fold long lines according to RFC 5545.
   */
  Drupal.scheduleBuilder.foldICSLine = function (line) {
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
  };

  /**
   * Escape special characters for ICS format.
   */
  Drupal.scheduleBuilder.escapeICSValue = function (value) {
    if (!value) {
      return '';
    }
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  };

  /**
   * Generate current timestamp in ICS format (UTC).
   */
  Drupal.scheduleBuilder.getCurrentTimestampICS = function () {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return year + month + day + 'T' + hours + minutes + seconds + 'Z';
  };

  /**
   * Generate VTIMEZONE definition for a timezone.
   * Handles common timezones with proper DST rules.
   */
  Drupal.scheduleBuilder.generateVTIMEZONE = function (timezone) {
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
      formatter.formatToParts(now);
      
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
  };

})(Drupal, drupalSettings);


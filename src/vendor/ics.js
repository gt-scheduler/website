/* global saveAs, BlobBuilder */
/* exported ics */

import { v4 as uuidv4 } from 'uuid';

const ics = (uidDomain, prodId) => {
  if (
    navigator.userAgent.indexOf('MSIE') > -1 &&
    navigator.userAgent.indexOf('MSIE 10') === -1
  ) {
    // eslint-disable-next-line no-console
    console.log('Unsupported Browser');
    return;
  }

  if (typeof uidDomain === 'undefined') {
    uidDomain = 'default';
  }
  if (typeof prodId === 'undefined') {
    prodId = 'Calendar';
  }

  const SEPARATOR = navigator.appVersion.indexOf('Win') !== -1 ? '\r\n' : '\n';

  // Specifies EDT/EST timezone logic
  const TZ_DEF = [
    'BEGIN:VTIMEZONE',
    'TZID:America/New_York',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0400',
    'TZNAME:EDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0400',
    'TZOFFSETTO:-0500',
    'TZNAME:EST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ].join(SEPARATOR);

  const calendarStart = [
    'BEGIN:VCALENDAR',
    `PRODID:${prodId}`,
    'VERSION:2.0',
    TZ_DEF,
  ].join(SEPARATOR);

  const calendarEvents = [];
  const calendarEnd = `${SEPARATOR}END:VCALENDAR`;
  const BYDAY_VALUES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  return {
    /**
     * Returns events array
     * @return {array} Events
     */
    events() {
      return calendarEvents;
    },

    /**
     * Returns calendar
     * @return {string} Calendar in iCalendar format
     */
    calendar() {
      return (
        calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd
      );
    },

    /**
     * Add event to the calendar
     * @param  {string} subject     Subject/Title of event
     * @param  {string} description Description of event
     * @param  {string} location    Location of event
     * @param  {string} begin       Beginning date of event
     * @param  {string} stop        Ending date of event
     */
    addEvent(subject, description, location, begin, stop, rrule) {
      // I'm not in the mood to make these optional... So they are all required
      if (
        typeof subject === 'undefined' ||
        typeof description === 'undefined' ||
        typeof location === 'undefined' ||
        typeof begin === 'undefined' ||
        typeof stop === 'undefined'
      ) {
        return false;
      }

      // validate rrule
      if (rrule) {
        if (!rrule.rrule) {
          if (
            rrule.freq !== 'YEARLY' &&
            rrule.freq !== 'MONTHLY' &&
            rrule.freq !== 'WEEKLY' &&
            rrule.freq !== 'DAILY'
          ) {
            throw new Error(
              "Recurrence rrule frequency must be provided and be one of the following: 'YEARLY', 'MONTHLY', 'WEEKLY', or 'DAILY'"
            );
          }

          if (rrule.until) {
            if (Number.isNaN(Date.parse(rrule.until))) {
              throw new Error(
                "Recurrence rrule 'until' must be a valid date string"
              );
            }
          }

          if (rrule.interval) {
            if (Number.isNaN(parseInt(rrule.interval, 10))) {
              throw new Error("Recurrence rrule 'interval' must be an integer");
            }
          }

          if (rrule.count) {
            if (Number.isNaN(parseInt(rrule.count, 10))) {
              throw new Error("Recurrence rrule 'count' must be an integer");
            }
          }

          if (typeof rrule.byday !== 'undefined') {
            if (
              Object.prototype.toString.call(rrule.byday) !== '[object Array]'
            ) {
              throw new Error("Recurrence rrule 'byday' must be an array");
            }

            if (rrule.byday.length > 7) {
              throw new Error(
                "Recurrence rrule 'byday' array must not be longer than the 7 days in a week"
              );
            }

            // Filter any possible repeats
            rrule.byday = rrule.byday.filter((elem, pos) => {
              return rrule.byday.indexOf(elem) === pos;
            });

            for (const d in rrule.byday) {
              if (BYDAY_VALUES.indexOf(rrule.byday[d]) < 0) {
                throw new Error(
                  "Recurrence rrule 'byday' values must include only the following: 'SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'"
                );
              }
            }
          }
        }
      }

      const start_date = new Date(begin);
      const end_date = new Date(stop);
      const now_date = new Date();

      const start_year = `0000${start_date.getFullYear().toString()}`.slice(-4);
      const start_month = `00${(start_date.getMonth() + 1).toString()}`.slice(
        -2
      );
      const start_day = `00${start_date.getDate().toString()}`.slice(-2);
      const start_hours = `00${start_date.getHours().toString()}`.slice(-2);
      const start_minutes = `00${start_date.getMinutes().toString()}`.slice(-2);
      const start_seconds = `00${start_date.getSeconds().toString()}`.slice(-2);

      const end_year = `0000${end_date.getFullYear().toString()}`.slice(-4);
      const end_month = `00${(end_date.getMonth() + 1).toString()}`.slice(-2);
      const end_day = `00${end_date.getDate().toString()}`.slice(-2);
      const end_hours = `00${end_date.getHours().toString()}`.slice(-2);
      const end_minutes = `00${end_date.getMinutes().toString()}`.slice(-2);
      const end_seconds = `00${end_date.getSeconds().toString()}`.slice(-2);

      // Uses getUTC since DTSTAMP not affected by TZID
      const now_year = `0000${now_date.getUTCFullYear().toString()}`.slice(-4);
      const now_month = `00${(now_date.getUTCMonth() + 1).toString()}`.slice(
        -2
      );
      const now_day = `00${now_date.getUTCDate().toString()}`.slice(-2);
      const now_hours = `00${now_date.getUTCHours().toString()}`.slice(-2);
      const now_minutes = `00${now_date.getUTCMinutes().toString()}`.slice(-2);
      const now_seconds = `00${now_date.getUTCSeconds().toString()}`.slice(-2);
      const now = `${now_year}${now_month}${now_day}T${now_hours}${now_minutes}${now_seconds}Z`;

      const start = `${start_year}${start_month}${start_day}T${start_hours}${start_minutes}${start_seconds}`;
      const end = `${end_year}${end_month}${end_day}T${end_hours}${end_minutes}${end_seconds}`;

      // recurrence rrule vars
      let rruleString;
      if (rrule) {
        if (rrule.rrule) {
          rruleString = rrule.rrule;
        } else {
          rruleString = `RRULE:FREQ=${rrule.freq}`;

          if (rrule.until) {
            const uDate = new Date(Date.parse(rrule.until)).toISOString();
            rruleString += `;UNTIL=${uDate
              .substring(0, uDate.length - 13)
              .replace(/[-]/g, '')}000000Z`;
          }

          if (rrule.interval) {
            rruleString += `;INTERVAL=${rrule.interval}`;
          }

          if (rrule.count) {
            rruleString += `;COUNT=${rrule.count}`;
          }

          if (rrule.byday && rrule.byday.length > 0) {
            rruleString += `;BYDAY=${rrule.byday.join(',')}`;
          }
        }
      }

      // var stamp = new Date().toISOString();
      let uid = uuidv4().toUpperCase();

      let calendarEvent = [
        'BEGIN:VEVENT',
        `UID:${uid}@${uidDomain}`,
        'CLASS:PUBLIC',
        `DESCRIPTION:${description}`,
        `DTSTAMP:${now}`,
        `DTSTART;TZID=America/New_York:${start}`,
        `DTEND;TZID=America/New_York:${end}`,
        `LOCATION:${location}`,
        `SUMMARY;LANGUAGE=en-us:${subject}`,
        'TRANSP:TRANSPARENT',
        'END:VEVENT',
      ];

      if (rruleString) {
        calendarEvent.splice(4, 0, rruleString);
      }

      calendarEvent = calendarEvent.join(SEPARATOR);

      calendarEvents.push(calendarEvent);
      return calendarEvent;
    },

    /**
     * Download calendar using the saveAs function from filesave.js
     * @param  {string} filename Filename
     * @param  {string} ext      Extention
     */
    download(filename, ext) {
      if (calendarEvents.length < 1) {
        return false;
      }

      ext = typeof ext !== 'undefined' ? ext : '.ics';
      filename = typeof filename !== 'undefined' ? filename : 'calendar';
      const calendar =
        calendarStart +
        SEPARATOR +
        calendarEvents.join(SEPARATOR) +
        calendarEnd;

      let blob;
      if (navigator.userAgent.indexOf('MSIE 10') === -1) {
        // chrome or firefox
        blob = new Blob([calendar]);
      } else {
        // ie
        const bb = new BlobBuilder();
        bb.append(calendar);
        blob = bb.getBlob(`text/x-vCalendar;charset=${document.characterSet}`);
      }
      saveAs(blob, filename + ext);
      return calendar;
    },

    /**
     * Build and return the ical contents
     */
    build() {
      if (calendarEvents.length < 1) {
        return false;
      }

      const calendar =
        calendarStart +
        SEPARATOR +
        calendarEvents.join(SEPARATOR) +
        calendarEnd;

      return calendar;
    },
  };
};

export default ics;

import { parseISO, addMinutes, addDays, format } from 'date-fns';
import type { Event } from '@/types';
import { getAppUrl } from '@/lib/utils';

// Pure calendar helpers shared by client components and server routes.
// Keep this file free of DB / API calls.

export interface EventRange {
  start: Date;
  end: Date;
  allDay: boolean;
}

/** Start/end for a run of slots (first..last). Pass a single slot for a finalized event. */
export function getSlotRange(event: Event, firstSlot: string, lastSlot: string = firstSlot): EventRange {
  if (event.mode === 'days') {
    // trip_duration covers how many days the trip spans; 1 (default) = single day
    return {
      start: parseISO(firstSlot),
      end: addDays(parseISO(lastSlot), event.trip_duration ?? 1),
      allDay: true,
    };
  }
  // times mode: slot is "YYYY-MM-DDTHH:MM" — parseISO needs seconds
  return {
    start: parseISO(firstSlot + ':00'),
    end: addMinutes(parseISO(lastSlot + ':00'), event.slot_duration ?? 30),
    allDay: false,
  };
}

export function googleMapsUrl(location: string): string {
  if (location.startsWith('http')) return location;
  return `https://maps.google.com/?q=${encodeURIComponent(location)}`;
}

export function appleMapsUrl(location: string): string {
  if (location.startsWith('http')) return location;
  return `https://maps.apple.com/?q=${encodeURIComponent(location)}`;
}

function toGoogleDate(date: Date, allDay: boolean): string {
  return format(date, allDay ? 'yyyyMMdd' : "yyyyMMdd'T'HHmmss");
}

/** Full Google Calendar "add event" URL. `guestEmails` pre-fills guests (host-side only). */
export function buildGoogleCalendarUrl(event: Event, range: EventRange, guestEmails: string[] = []): string {
  const eventUrl = `${getAppUrl()}/event/${event.id}`;
  const details = [
    event.description,
    event.location ? `📍 ${googleMapsUrl(event.location)}` : null,
    `Organized by ${event.creator_name}.`,
    `Coordinated with Seeya: ${eventUrl}`,
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${toGoogleDate(range.start, range.allDay)}/${toGoogleDate(range.end, range.allDay)}`,
    details,
    ...(event.location ? { location: event.location } : {}),
    ...(guestEmails.length > 0 ? { add: guestEmails.join(',') } : {}),
  });
  return `https://calendar.google.com/calendar/event?${params.toString()}`;
}

/** Short, human-readable links that redirect to the calendar exports (see src/app/e/[id]). */
export function shortCalendarLinks(eventId: string): { google: string; apple: string } {
  const base = `${getAppUrl()}/e/${eventId}`;
  return { google: `${base}/google`, apple: `${base}/apple` };
}

// ---------------------------------------------------------------------------
// iCalendar (RFC 5545)
// ---------------------------------------------------------------------------

export function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// RFC 5545 §3.1 — fold lines exceeding 75 octets: CRLF followed by a single space
export function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [line.slice(0, 75)];
  let i = 75;
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join('\r\n');
}

function toIcsDate(date: Date, allDay: boolean): string {
  return format(date, allDay ? 'yyyyMMdd' : "yyyyMMdd'T'HHmmss");
}

export interface IcsAttendee {
  name: string;
  email: string;
}

/** Builds a single-event .ics file. Attendees are only included when explicitly passed. */
export function buildIcs(
  event: Event,
  range: EventRange,
  { uid, attendees = [] }: { uid: string; attendees?: IcsAttendee[] }
): string {
  const { start, end, allDay } = range;
  const eventUrl = `${getAppUrl()}/event/${event.id}`;

  const dtStart = allDay ? `DTSTART;VALUE=DATE:${toIcsDate(start, true)}` : `DTSTART:${toIcsDate(start, false)}`;
  const dtEnd = allDay ? `DTEND;VALUE=DATE:${toIcsDate(end, true)}` : `DTEND:${toIcsDate(end, false)}`;

  const descriptionParts = [
    event.description,
    event.location ? `📍 ${event.location}\n${appleMapsUrl(event.location)}` : null,
    `Organized by ${event.creator_name}`,
    `Coordinated with Seeya: ${eventUrl}`,
  ].filter(Boolean) as string[];

  const attendeeLines = attendees.map(a =>
    // Parameter values can't be backslash-escaped (RFC 5545 §3.2) — quote them and drop any quotes
    foldLine(`ATTENDEE;CN="${a.name.replace(/["\r\n]/g, '')}";ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${a.email}`)
  );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//seeya//seeya//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
    dtStart,
    dtEnd,
    foldLine(`SUMMARY:${escapeIcs(event.name)}`),
    // Join with a real newline so escapeIcs turns it into the ICS "\n" sequence
    // (pre-joining with '\\n' would double-escape the backslash)
    foldLine(`DESCRIPTION:${escapeIcs(descriptionParts.join('\n'))}`),
    event.location ? foldLine(`LOCATION:${escapeIcs(event.location)}`) : '',
    foldLine(`URL:${eventUrl}`),
    ...attendeeLines,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export function icsFilename(event: Event): string {
  // Header-safe: only [a-z0-9-] so a quote in the event name can't break Content-Disposition
  const slug = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${slug || 'event'}.ics`;
}

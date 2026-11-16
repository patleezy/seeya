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

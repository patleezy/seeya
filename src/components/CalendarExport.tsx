'use client';

import { Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event, Response } from '@/types';
import { getAppUrl } from '@/lib/utils';
import { parseISO, addMinutes, addDays, format } from 'date-fns';

interface Props {
  event: Event;
  bestSlots: string[];
  responses?: Response[];
}

function getStartEnd(event: Event, bestSlots: string[]): { start: Date; end: Date; allDay: boolean } | null {
  const slots = event.finalized_slot ? [event.finalized_slot] : bestSlots;
  if (!slots.length) return null;

  if (event.mode === 'days') {
    const start = parseISO(slots[0]);
    const lastSlot = parseISO(slots[slots.length - 1]);
    // trip_duration covers how many days the trip spans; 1 (default) = single day
    const end = addDays(lastSlot, event.trip_duration ?? 1);
    return { start, end, allDay: true };
  }

  // times mode: slot is "YYYY-MM-DDTHH:MM" — parseISO requires a full ISO string
  const start = parseISO(slots[0].replace('T', 'T') + ':00');
  const lastSlot = parseISO(slots[slots.length - 1].replace('T', 'T') + ':00');
  const end = addMinutes(lastSlot, event.slot_duration ?? 30);
  return { start, end, allDay: false };
}

function toIcsDate(date: Date, allDay: boolean): string {
  if (allDay) return format(date, 'yyyyMMdd');
  return format(date, "yyyyMMdd'T'HHmmss");
}

function toGoogleDate(date: Date, allDay: boolean): string {
  if (allDay) return format(date, 'yyyyMMdd');
  return format(date, "yyyyMMdd'T'HHmmss");
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// RFC 5545 §3.1 — fold lines exceeding 75 octets
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [line.slice(0, 75)];
  let i = 75;
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join('\r\n');
}

function downloadIcs(event: Event, bestSlots: string[], responses: Response[]) {
  const range = getStartEnd(event, bestSlots);
  if (!range) return;

  const { start, end, allDay } = range;
  const uid = `${event.id}-${Date.now()}@seeya`;
  const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");

  const dtStart = allDay
    ? `DTSTART;VALUE=DATE:${toIcsDate(start, true)}`
    : `DTSTART:${toIcsDate(start, false)}`;
  const dtEnd = allDay
    ? `DTEND;VALUE=DATE:${toIcsDate(end, true)}`
    : `DTEND:${toIcsDate(end, false)}`;

  const appUrl = getAppUrl();
  const eventUrl = `${appUrl}/event/${event.id}`;

  const descriptionParts = [
    event.description,
    event.location ? `📍 ${event.location}` : null,
    `Organized by ${event.creator_name}`,
    `Coordinated with Seeya: ${eventUrl}`,
  ].filter(Boolean) as string[];

  // Join with actual newline so escapeIcs can correctly escape it to \n (the ICS sequence)
  // (joining with '\\n' would cause double-escaping in escapeIcs)

  const attendeeLines = responses
    .filter(r => r.email)
    .map(r =>
      foldLine(`ATTENDEE;CN=${escapeIcs(r.respondent_name)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${r.email}`)
    );

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//seeya//seeya//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    dtStart,
    dtEnd,
    foldLine(`SUMMARY:${escapeIcs(event.name)}`),
    descriptionParts.length ? foldLine(`DESCRIPTION:${escapeIcs(descriptionParts.join('\n'))}`) : '',
    event.location ? foldLine(`LOCATION:${escapeIcs(event.location)}`) : '',
    foldLine(`URL:${eventUrl}`),
    ...attendeeLines,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.name.toLowerCase().replace(/\s+/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function googleCalendarUrl(event: Event, bestSlots: string[], responses: Response[]): string {
  const range = getStartEnd(event, bestSlots);
  if (!range) return '#';

  const { start, end, allDay } = range;
  const dates = `${toGoogleDate(start, allDay)}/${toGoogleDate(end, allDay)}`;
  const appUrl = getAppUrl();
  const eventUrl = `${appUrl}/event/${event.id}`;

  const detailParts = [
    event.description,
    `Organized by ${event.creator_name}.`,
    `Coordinated with Seeya: ${eventUrl}`,
  ].filter(Boolean);

  const guestEmails = responses.filter(r => r.email).map(r => r.email as string);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates,
    details: detailParts.join('\n'),
    ...(event.location ? { location: event.location } : {}),
    ...(guestEmails.length > 0 ? { add: guestEmails.join(',') } : {}),
  });

  return `https://calendar.google.com/calendar/event?${params.toString()}`;
}

export function CalendarExport({ event, bestSlots, responses = [] }: Props) {
  const slots = event.finalized_slot ? [event.finalized_slot] : bestSlots;
  if (!slots.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
        Add to calendar
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-xl"
          onClick={() => downloadIcs(event, slots, responses)}
        >
          <Calendar className="h-3.5 w-3.5" />
          Apple Calendar
        </Button>
        <a
          href={googleCalendarUrl(event, slots, responses)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
            <ExternalLink className="h-3.5 w-3.5" />
            Google Calendar
          </Button>
        </a>
      </div>
    </div>
  );
}

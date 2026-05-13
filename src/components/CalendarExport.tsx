'use client';

import { Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event } from '@/types';
import { parseISO, addMinutes, addDays, format } from 'date-fns';

interface Props {
  event: Event;
  bestSlots: string[];
}

function getStartEnd(event: Event, bestSlots: string[]): { start: Date; end: Date; allDay: boolean } | null {
  const slots = event.finalized_slot ? [event.finalized_slot] : bestSlots;
  if (!slots.length) return null;

  if (event.mode === 'days') {
    const start = parseISO(slots[0]);
    const lastSlot = parseISO(slots[slots.length - 1]);
    const end = addDays(lastSlot, 1);
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

function downloadIcs(event: Event, bestSlots: string[]) {
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

  const descriptionParts = [
    event.description,
    `Organized by ${event.creator_name}`,
    'Coordinated with seeya',
  ].filter(Boolean);

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
    `SUMMARY:${escapeIcs(event.name)}`,
    descriptionParts.length ? `DESCRIPTION:${escapeIcs(descriptionParts.join('\\n'))}` : '',
    event.location ? `LOCATION:${escapeIcs(event.location)}` : '',
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

function googleCalendarUrl(event: Event, bestSlots: string[]): string {
  const range = getStartEnd(event, bestSlots);
  if (!range) return '#';

  const { start, end, allDay } = range;
  const dates = `${toGoogleDate(start, allDay)}/${toGoogleDate(end, allDay)}`;

  const detailParts = [
    event.description,
    `Organized by ${event.creator_name}. Coordinated with seeya.`,
  ].filter(Boolean);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates,
    details: detailParts.join('\n'),
    ...(event.location ? { location: event.location } : {}),
  });

  return `https://calendar.google.com/calendar/event?${params.toString()}`;
}

export function CalendarExport({ event, bestSlots }: Props) {
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
          onClick={() => downloadIcs(event, slots)}
        >
          <Calendar className="h-3.5 w-3.5" />
          Apple Calendar
        </Button>
        <a
          href={googleCalendarUrl(event, slots)}
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

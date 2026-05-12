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
  if (!bestSlots.length) return null;

  if (event.mode === 'days') {
    const start = parseISO(bestSlots[0]);
    // End = day after the last best slot for an all-day event
    const lastSlot = parseISO(bestSlots[bestSlots.length - 1]);
    const end = addDays(lastSlot, 1);
    return { start, end, allDay: true };
  }

  // times mode: start = first slot, end = last slot + slot_duration
  const start = parseISO(bestSlots[0]);
  const lastSlot = parseISO(bestSlots[bestSlots.length - 1]);
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

  const description = [
    event.description,
    `Organized by ${event.creator_name}`,
    `Coordinated with seeya`,
  ]
    .filter(Boolean)
    .join('\\n');

  const ics = [
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
    `SUMMARY:${event.name}`,
    description ? `DESCRIPTION:${description}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
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

  const details = [event.description, `Organized by ${event.creator_name}. Coordinated with seeya.`]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates,
    details,
  });

  return `https://calendar.google.com/calendar/event?${params.toString()}`;
}

export function CalendarExport({ event, bestSlots }: Props) {
  if (!bestSlots.length) return null;

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
          onClick={() => downloadIcs(event, bestSlots)}
        >
          <Calendar className="h-3.5 w-3.5" />
          Apple Calendar
        </Button>
        <a
          href={googleCalendarUrl(event, bestSlots)}
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

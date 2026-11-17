'use client';

import { Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event, Response } from '@/types';
import { getSlotRange, buildGoogleCalendarUrl, buildIcs, icsFilename, EventRange } from '@/lib/calendar';

interface Props {
  event: Event;
  bestSlots: string[];
  responses?: Response[];
}

function getStartEnd(event: Event, bestSlots: string[]): EventRange | null {
  const slots = event.finalized_slot ? [event.finalized_slot] : bestSlots;
  if (!slots.length) return null;
  return getSlotRange(event, slots[0], slots[slots.length - 1]);
}

function downloadIcs(event: Event, bestSlots: string[], responses: Response[]) {
  const range = getStartEnd(event, bestSlots);
  if (!range) return;

  // Responses here are already sanitized for this viewer (see src/lib/sanitize.ts)
  const attendees = responses
    .filter(r => r.email)
    .map(r => ({ name: r.respondent_name, email: r.email as string }));
  const ics = buildIcs(event, range, { uid: `${event.id}-${Date.now()}@seeya`, attendees });

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = icsFilename(event);
  a.click();
  URL.revokeObjectURL(url);
}

function googleCalendarUrl(event: Event, bestSlots: string[], responses: Response[]): string {
  const range = getStartEnd(event, bestSlots);
  if (!range) return '#';
  const guestEmails = responses.filter(r => r.email).map(r => r.email as string);
  return buildGoogleCalendarUrl(event, range, guestEmails);
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

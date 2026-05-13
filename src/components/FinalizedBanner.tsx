'use client';

import { useState } from 'react';
import { Event, Response } from '@/types';
import { CalendarExport } from '@/components/CalendarExport';
import { FinalizeButton } from '@/components/FinalizeButton';
import { CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

function formatFinalizedSlot(slot: string, event: Event): string {
  if (event.mode === 'days') {
    return format(parseISO(slot), 'EEEE, MMMM d, yyyy');
  }
  // times mode: slot is "YYYY-MM-DDTHH:MM"
  const date = format(parseISO(slot.replace('T', ' ')), 'EEEE, MMMM d');
  const time = slot.slice(11); // "HH:MM"
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${date} at ${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

interface Props {
  event: Event;
  bestSlots: string[];
  responses?: Response[];
}

export function FinalizedBanner({ event, bestSlots, responses = [] }: Props) {
  const [finalizedSlot, setFinalizedSlot] = useState<string | null>(event.finalized_slot);

  const slotsForExport = finalizedSlot ? [finalizedSlot] : bestSlots;

  if (finalizedSlot) {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              It&apos;s happening! 🎉
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
              {event.name} is set for <span className="font-medium">{formatFinalizedSlot(finalizedSlot, event)}</span>
              {event.timezone ? ` (${event.timezone})` : ''}.
            </p>
          </div>
        </div>
        <CalendarExport event={{ ...event, finalized_slot: finalizedSlot }} bestSlots={slotsForExport} responses={responses} />
      </div>
    );
  }

  if (bestSlots.length === 0) return null;

  return (
    <FinalizeButton
      eventId={event.id}
      bestSlot={bestSlots[0]}
      onFinalized={setFinalizedSlot}
    />
  );
}

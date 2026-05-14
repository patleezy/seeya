'use client';

import { useState, useEffect, useMemo } from 'react';
import { Event, Response, SlotDensityMap } from '@/types';
import { CalendarExport } from '@/components/CalendarExport';
import { FinalizeButton } from '@/components/FinalizeButton';
import { CheckCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAppUrl } from '@/lib/utils';
import { format, parseISO, addMinutes, addDays } from 'date-fns';

function fmtTz(tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZoneName: 'short', timeZone: tz })
      .formatToParts(new Date())
      .find(p => p.type === 'timeZoneName')?.value ?? tz;
  } catch { return tz; }
}

function formatFinalizedSlot(slot: string, event: Event): string {
  if (event.mode === 'days') {
    return format(parseISO(slot), 'EEEE, MMMM d, yyyy');
  }
  const date = format(parseISO(slot.replace('T', ' ')), 'EEEE, MMMM d');
  const time = slot.slice(11);
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${date} at ${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

function buildGcalUrl(slot: string, event: Event): string {
  let startStr: string;
  let endStr: string;

  if (event.mode === 'days') {
    const start = parseISO(slot);
    const end = addDays(start, event.trip_duration ?? 1);
    startStr = format(start, 'yyyyMMdd');
    endStr = format(end, 'yyyyMMdd');
  } else {
    const start = parseISO(slot + ':00');
    const end = addMinutes(start, event.slot_duration ?? 30);
    startStr = format(start, "yyyyMMdd'T'HHmmss");
    endStr = format(end, "yyyyMMdd'T'HHmmss");
  }

  const appUrl = getAppUrl();
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${startStr}/${endStr}`,
    details: `Organized by ${event.creator_name}. Coordinated with Seeya: ${appUrl}/event/${event.id}`,
    ...(event.location ? { location: event.location } : {}),
  });
  return `https://calendar.google.com/calendar/event?${params.toString()}`;
}

interface Props {
  event: Event;
  bestSlots: string[];
  allSlotKeys: string[];
  densityMap: SlotDensityMap;
  totalResponders: number;
  responses?: Response[];
}

export function FinalizedBanner({ event, bestSlots, allSlotKeys, densityMap, totalResponders, responses = [] }: Props) {
  const [finalizedSlot, setFinalizedSlot] = useState<string | null>(event.finalized_slot);
  const [isHost, setIsHost] = useState(false);
  const [unfinalizingPending, setUnfinalizingPending] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem(`host_token_${event.id}`);
    if (token) setIsHost(true);
  }, [event.id]);

  async function handleUnfinalize() {
    const token = sessionStorage.getItem(`host_token_${event.id}`);
    if (!token) return;
    setUnfinalizingPending(true);
    try {
      const res = await fetch(`/api/events/${event.id}/finalize`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_token: token }),
      });
      if (res.ok) setFinalizedSlot(null);
    } finally {
      setUnfinalizingPending(false);
    }
  }

  const mailtoUrl = useMemo(() => {
    if (!finalizedSlot) return null;
    const emailList = responses.filter(r => r.email && !r.declined).map(r => r.email as string);
    if (emailList.length === 0) return null;

    const appUrl = getAppUrl();
    const eventUrl = `${appUrl}/event/${event.id}`;
    const formattedDate = formatFinalizedSlot(finalizedSlot, event);
    const tzSuffix = event.timezone ? ` (${fmtTz(event.timezone)})` : '';
    const subject = `You're invited: ${event.name} — ${formattedDate}${tzSuffix}`;

    const gcalUrl = buildGcalUrl(finalizedSlot, event);

    const bodyLines = [
      `Hi there,`,
      ``,
      `${event.name} is set for ${formattedDate}${tzSuffix}.`,
      event.location ? `📍 ${event.location}` : null,
      event.description ? `\n${event.description}` : null,
      ``,
      `Add to your calendar:`,
      `• Google Calendar: ${gcalUrl}`,
      `• Apple Calendar (.ics): ${appUrl}/api/events/${event.id}/ics`,
      ``,
      `— ${event.creator_name} · ${getAppUrl()}`,
    ].filter(s => s !== null).join('\n');

    return `mailto:?bcc=${encodeURIComponent(emailList.join(','))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines)}`;
  }, [finalizedSlot, responses, event]);

  const emailCount = useMemo(
    () => responses.filter(r => r.email && !r.declined).length,
    [responses]
  );

  const slotsForExport = finalizedSlot ? [finalizedSlot] : bestSlots;

  if (finalizedSlot) {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              It&apos;s happening! 🎉
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
              {event.name} is set for <span className="font-medium">{formatFinalizedSlot(finalizedSlot, event)}</span>
              {event.timezone ? ` (${fmtTz(event.timezone)})` : ''}.
            </p>
          </div>
          {isHost && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 flex-shrink-0"
              onClick={handleUnfinalize}
              disabled={unfinalizingPending}
            >
              Change
            </Button>
          )}
        </div>
        <CalendarExport event={{ ...event, finalized_slot: finalizedSlot }} bestSlots={slotsForExport} responses={responses} />
        {isHost && mailtoUrl && (
          <a href={mailtoUrl}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
            >
              <Mail className="h-3.5 w-3.5" />
              Email invites ({emailCount})
            </Button>
          </a>
        )}
      </div>
    );
  }

  if (!isHost) return null;

  return (
    <FinalizeButton
      event={event}
      bestSlot={bestSlots[0] ?? null}
      allSlotKeys={allSlotKeys}
      densityMap={densityMap}
      totalResponders={totalResponders}
      onFinalized={setFinalizedSlot}
    />
  );
}

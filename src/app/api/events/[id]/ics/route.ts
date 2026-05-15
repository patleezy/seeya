import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Event } from '@/types';
import { getAppUrl } from '@/lib/utils';
import { parseISO, addMinutes, addDays, format } from 'date-fns';

// ---------------------------------------------------------------------------
// Helpers (inlined from CalendarExport.tsx — do not import that client component)
// ---------------------------------------------------------------------------

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

function toIcsDate(date: Date, allDay: boolean): string {
  if (allDay) return format(date, 'yyyyMMdd');
  return format(date, "yyyyMMdd'T'HHmmss");
}

function getStartEnd(event: Event, slot: string): { start: Date; end: Date; allDay: boolean } | null {
  if (event.mode === 'days') {
    const start = parseISO(slot);
    // trip_duration covers how many days the trip spans; 1 (default) = single day
    const end = addDays(start, event.trip_duration ?? 1);
    return { start, end, allDay: true };
  }

  // times mode: slot is "YYYY-MM-DDTHH:MM"
  const start = parseISO(slot + ':00');
  const end = addMinutes(start, event.slot_duration ?? 30);
  return { start, end, allDay: false };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createSupabaseAdminClient();

  // Fetch event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if (!event.finalized_slot) {
    return NextResponse.json({ error: 'Event has not been finalized' }, { status: 404 });
  }

  // Fetch responses that have emails for ATTENDEE lines
  const { data: responses } = await supabase
    .from('responses')
    .select('respondent_name, email')
    .eq('event_id', id)
    .not('email', 'is', null);

  const range = getStartEnd(event as Event, event.finalized_slot);
  if (!range) {
    return NextResponse.json({ error: 'Could not determine event time range' }, { status: 500 });
  }

  const { start, end, allDay } = range;
  const uid = `${event.id}@seeya`;
  const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");

  const dtStart = allDay
    ? `DTSTART;VALUE=DATE:${toIcsDate(start, true)}`
    : `DTSTART:${toIcsDate(start, false)}`;
  const dtEnd = allDay
    ? `DTEND;VALUE=DATE:${toIcsDate(end, true)}`
    : `DTEND:${toIcsDate(end, false)}`;

  const eventUrl = `${getAppUrl()}/event/${event.id}`;

  const descriptionParts = [
    event.description,
    event.location ? `📍 ${event.location}` : null,
    `Organized by ${event.creator_name}`,
    `Coordinated with Seeya: ${eventUrl}`,
  ].filter(Boolean) as string[];

  // Join with actual newline so escapeIcs can correctly escape it to \n (the ICS sequence)
  const attendeeLines = (responses ?? [])
    .filter((r: { respondent_name: string; email: string | null }) => r.email)
    .map((r: { respondent_name: string; email: string | null }) =>
      foldLine(
        `ATTENDEE;CN=${escapeIcs(r.respondent_name)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${r.email}`
      )
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

  const slug = event.name.toLowerCase().replace(/\s+/g, '-');

  return new NextResponse(lines, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar;charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
    },
  });
}

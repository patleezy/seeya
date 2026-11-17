import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Event } from '@/types';
import { isValidUUID } from '@/lib/validation';
import { buildIcs, getSlotRange, icsFilename } from '@/lib/calendar';

// Public .ics for a finalized event — linked from email invites, so it can be
// forwarded anywhere. It deliberately contains NO attendee names or emails;
// the host's in-app "Apple Calendar" download still includes them.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, description, location, creator_name, mode, slot_duration, trip_duration, finalized_slot')
    .eq('id', id)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  if (!event.finalized_slot) {
    return NextResponse.json({ error: 'Event has not been finalized' }, { status: 404 });
  }

  const ics = buildIcs(event as Event, getSlotRange(event as Event, event.finalized_slot), {
    uid: `${event.id}@seeya`,
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar;charset=utf-8',
      'Content-Disposition': `attachment; filename="${icsFilename(event as Event)}"`,
      'Cache-Control': 'no-store',
    },
  });
}

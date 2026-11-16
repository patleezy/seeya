import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { isValidUUID } from '@/lib/validation';
import { buildGoogleCalendarUrl, getSlotRange } from '@/lib/calendar';
import { Event } from '@/types';

// Short link used in email invites: /e/[id]/google → Google Calendar "add event" page.
// The redirect target is built only from the stored event (never from request input),
// so this can't be used as an open redirect. No guest emails are included — the URL is public.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: event } = await supabase
    .from('events')
    .select('id, name, description, location, creator_name, mode, slot_duration, trip_duration, finalized_slot')
    .eq('id', id)
    .single();

  if (!event || !event.finalized_slot) {
    return NextResponse.json({ error: 'Event not found or not finalized' }, { status: 404 });
  }

  const range = getSlotRange(event as Event, event.finalized_slot);
  const res = NextResponse.redirect(buildGoogleCalendarUrl(event as Event, range), 302);
  // The host can change the finalized time — don't let browsers/CDNs cache the redirect
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

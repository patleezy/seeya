import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { isValidUUID, isValidSlotKey } from '@/lib/validation';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const body: { host_token?: string; slot?: string } = await req.json();

    if (!body.host_token || !isValidUUID(body.host_token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }
    if (!body.slot || !isValidSlotKey(body.slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: event } = await supabase
      .from('events')
      .select('host_token')
      .eq('id', id)
      .single();

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (event.host_token !== body.host_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('events')
      .update({ finalized_slot: body.slot, finalized_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ finalized_slot: body.slot });
  } catch (err) {
    console.error('POST /api/events/[id]/finalize:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

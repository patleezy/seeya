import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// Host-only: returns responses with real names and emails.
// POST (not GET) so the token travels in the body, never in URLs or logs.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { host_token } = await req.json();
    if (typeof host_token !== 'string' || !host_token) {
      return NextResponse.json({ error: 'Missing host_token' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: event } = await supabase
      .from('events')
      .select('host_token')
      .eq('id', id)
      .single();

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (event.host_token !== host_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: responses } = await supabase
      .from('responses')
      .select('*')
      .eq('event_id', id)
      .order('created_at');

    return NextResponse.json(
      { responses: responses ?? [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('POST /api/events/[id]/host-view:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

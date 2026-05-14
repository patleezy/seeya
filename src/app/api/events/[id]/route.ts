import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { host_token } = await req.json();

    if (!host_token) {
      return NextResponse.json({ error: 'Missing host_token' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: event } = await supabase
      .from('events')
      .select('host_token')
      .eq('id', id)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.host_token !== host_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await supabase.from('events').delete().eq('id', id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/events/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const [eventResult, responsesResult, recommendationResult] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('responses').select('*').eq('event_id', id).order('created_at'),
      supabase.from('ai_recommendations').select('*').eq('event_id', id).maybeSingle(),
    ]);

    if (eventResult.error || !eventResult.data) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      event: eventResult.data,
      responses: responsesResult.data ?? [],
      recommendation: recommendationResult.data ?? null,
    });
  } catch (err) {
    console.error('GET /api/events/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { host_token, name, description, location, dates, time_start, time_end } = await req.json();

    if (!host_token) {
      return NextResponse.json({ error: 'Missing host_token' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: event } = await supabase
      .from('events')
      .select('host_token, dates')
      .eq('id', id)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.host_token !== host_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (time_start !== undefined) updates.time_start = time_start;
    if (time_end !== undefined) updates.time_end = time_end;

    if (dates !== undefined) {
      const oldSet = new Set<string>(event.dates);
      const newDates: string[] = (dates as string[]).filter((d: string) => !oldSet.has(d));
      updates.dates = dates;
      updates.new_dates = newDates;
      updates.dates_last_modified = new Date().toISOString();

      // Invalidate AI recommendation when dates change
      await supabase.from('ai_recommendations').delete().eq('event_id', id);
    }

    const { data: updated, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: updated });
  } catch (err) {
    console.error('PATCH /api/events/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

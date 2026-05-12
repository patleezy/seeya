import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { CreateResponseRequest } from '@/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: CreateResponseRequest = await req.json();

    if (!body.respondent_name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!Array.isArray(body.availability)) {
      return NextResponse.json({ error: 'Availability must be an array' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Verify event exists
    const { data: event } = await supabase.from('events').select('id').eq('id', id).single();
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const { data, error } = await supabase
      .from('responses')
      .insert({
        event_id: id,
        respondent_name: body.respondent_name.trim(),
        availability: body.availability,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Invalidate cached recommendation so it regenerates with new data
    await supabase.from('ai_recommendations').delete().eq('event_id', id);

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/events/[id]/responses:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

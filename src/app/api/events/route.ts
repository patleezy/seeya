import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { CreateEventRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: CreateEventRequest = await req.json();

    if (!body.name?.trim()) return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    if (!body.creator_name?.trim()) return NextResponse.json({ error: 'Creator name is required' }, { status: 400 });
    if (!body.dates?.length) return NextResponse.json({ error: 'At least one date is required' }, { status: 400 });
    if (!['times', 'days'].includes(body.mode)) return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('events')
      .insert({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        type: 'other',
        mode: body.mode,
        creator_name: body.creator_name.trim(),
        dates: body.dates,
        time_start: body.mode === 'times' ? (body.time_start ?? '09:00') : null,
        time_end: body.mode === 'times' ? (body.time_end ?? '17:00') : null,
        slot_duration: body.mode === 'times' ? (body.slot_duration ?? 30) : null,
        timezone: body.mode === 'times' ? (body.timezone ?? null) : null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/events:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

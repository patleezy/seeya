import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { CreateEventRequest } from '@/types';
import { checkRateLimit } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!checkRateLimit(ip, 'create_event', 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body: CreateEventRequest = await req.json();

    if (!body.name?.trim()) return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    if (body.name.trim().length > 200) return NextResponse.json({ error: 'Event name too long' }, { status: 400 });
    if (!body.creator_name?.trim()) return NextResponse.json({ error: 'Creator name is required' }, { status: 400 });
    if (body.creator_name.trim().length > 100) return NextResponse.json({ error: 'Creator name too long' }, { status: 400 });
    if (!body.dates?.length) return NextResponse.json({ error: 'At least one date is required' }, { status: 400 });
    if (body.dates.length > 60) return NextResponse.json({ error: 'Too many dates selected' }, { status: 400 });
    if (!['times', 'days'].includes(body.mode)) return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    if (body.description && body.description.length > 1000) return NextResponse.json({ error: 'Description too long' }, { status: 400 });
    if (body.location && body.location.length > 500) return NextResponse.json({ error: 'Location too long' }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('events')
      .insert({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        location: body.location?.trim() || null,
        type: 'other',
        mode: body.mode,
        creator_name: body.creator_name.trim(),
        dates: body.dates,
        time_start: body.mode === 'times' ? (body.time_start ?? '09:00') : null,
        time_end: body.mode === 'times' ? (body.time_end ?? '17:00') : null,
        slot_duration: body.mode === 'times' ? (body.slot_duration ?? 30) : null,
        timezone: body.mode === 'times' ? (body.timezone ?? null) : null,
        anonymous: body.anonymous ?? false,
        max_responses: body.max_responses ?? null,
        response_deadline: body.response_deadline
          ? new Date(body.response_deadline).toISOString()
          : null,
      })
      .select('id, host_token')
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id, host_token: data.host_token }, { status: 201 });
  } catch (err) {
    console.error('POST /api/events:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

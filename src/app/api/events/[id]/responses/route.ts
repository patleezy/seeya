import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { CreateResponseRequest } from '@/types';
import { isValidSlotKey, isValidUUID, checkRateLimit } from '@/lib/validation';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!checkRateLimit(ip, 'submit_response', 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body: CreateResponseRequest = await req.json();

    if (!body.respondent_name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (body.respondent_name.trim().length > 100) {
      return NextResponse.json({ error: 'Name too long' }, { status: 400 });
    }
    if (!Array.isArray(body.availability)) {
      return NextResponse.json({ error: 'Availability must be an array' }, { status: 400 });
    }
    if (body.availability.length > 500) {
      return NextResponse.json({ error: 'Too many availability slots' }, { status: 400 });
    }
    const invalidSlot = body.availability.find(s => !isValidSlotKey(s));
    if (invalidSlot) {
      return NextResponse.json({ error: 'Invalid availability slot format' }, { status: 400 });
    }
    if (body.email && body.email.length > 200) {
      return NextResponse.json({ error: 'Email too long' }, { status: 400 });
    }
    if (body.comment && body.comment.length > 500) {
      return NextResponse.json({ error: 'Comment too long' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: event } = await supabase
      .from('events')
      .select('id, response_deadline, max_responses, anonymous')
      .eq('id', id)
      .single();

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    if (event.response_deadline && new Date(event.response_deadline) < new Date()) {
      return NextResponse.json({ error: 'Responses are closed' }, { status: 410 });
    }

    if (event.max_responses) {
      const { count } = await supabase
        .from('responses')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', id);
      if ((count ?? 0) >= event.max_responses) {
        return NextResponse.json({ error: 'This event is full' }, { status: 409 });
      }
    }

    const { data, error } = await supabase
      .from('responses')
      .insert({
        event_id: id,
        respondent_name: body.respondent_name.trim(),
        email: body.email?.trim() || null,
        availability: body.availability,
        comment: body.comment?.trim() || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    await supabase.from('ai_recommendations').delete().eq('event_id', id);

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/events/[id]/responses:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

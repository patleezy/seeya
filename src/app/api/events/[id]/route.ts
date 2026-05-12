import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

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

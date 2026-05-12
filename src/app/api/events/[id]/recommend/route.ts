import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { buildSlotKeys, buildDensityMap, findBestSlots } from '@/lib/availability';
import { getAiRecommendation } from '@/lib/gemini';
import { Event, Response } from '@/types';

// In-memory rate limit: don't call Gemini twice within 10s for the same event
const recentCalls = new Map<string, number>();

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    // Check cache first
    const { data: cached } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('event_id', id)
      .maybeSingle();

    if (cached) {
      return NextResponse.json(cached);
    }

    // Rate limit
    const lastCall = recentCalls.get(id);
    if (lastCall && Date.now() - lastCall < 10000) {
      return NextResponse.json({ error: 'Please wait a moment before trying again' }, { status: 429 });
    }
    recentCalls.set(id, Date.now());

    // Fetch event + responses
    const [eventResult, responsesResult] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('responses').select('*').eq('event_id', id),
    ]);

    if (!eventResult.data) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const event = eventResult.data as Event;
    const responses = (responsesResult.data ?? []) as Response[];

    if (responses.length === 0) {
      return NextResponse.json({
        recommendation: "No responses yet — share the link with your people and check back once everyone's filled it in!",
        best_slots: [],
        source: 'algorithm',
      });
    }

    const allSlotKeys = buildSlotKeys(event);
    const densityMap = buildDensityMap(responses);
    const { bestSlots, isUnambiguous, topBlocks } = findBestSlots(allSlotKeys, densityMap, responses.length);

    let recommendation: string;
    let best_slots: string[];
    let source: 'algorithm' | 'ai';

    if (isUnambiguous && bestSlots.length > 0) {
      // Clear winner — use algorithm + friendly template
      const topSlot = bestSlots[0];
      const count = densityMap[topSlot] ?? 0;
      const isEveryone = count === responses.length;
      if (isEveryone) {
        recommendation = `Great news — everyone is free! ${topSlot} works perfectly for all ${responses.length} ${responses.length === 1 ? 'person' : 'people'}. Lock it in! 🎉`;
      } else {
        recommendation = `Looks like ${topSlot} is your best bet, with ${count} out of ${responses.length} people available. A solid choice!`;
      }
      best_slots = bestSlots;
      source = 'algorithm';
    } else {
      // Ambiguous — call Gemini
      try {
        const topSlotsForPrompt = allSlotKeys
          .filter(s => (densityMap[s] ?? 0) > 0)
          .sort((a, b) => (densityMap[b] ?? 0) - (densityMap[a] ?? 0));

        const result = await getAiRecommendation(event, responses, densityMap, topSlotsForPrompt);
        recommendation = result.recommendation;
        best_slots = result.best_slots;
        source = 'ai';
      } catch (geminiErr) {
        console.error('Gemini error:', geminiErr);
        // Fall back to algorithm result
        recommendation = bestSlots.length > 0
          ? `Based on the responses, ${bestSlots[0]} seems to work best for most people.`
          : "Tough one — there's no time that works for everyone. Consider following up directly!";
        best_slots = bestSlots;
        source = 'algorithm';
      }
    }

    // Upsert recommendation
    const { data: saved } = await supabase
      .from('ai_recommendations')
      .upsert({ event_id: id, recommendation, best_slots, source }, { onConflict: 'event_id' })
      .select()
      .single();

    return NextResponse.json(saved ?? { recommendation, best_slots, source });
  } catch (err) {
    console.error('POST /api/events/[id]/recommend:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

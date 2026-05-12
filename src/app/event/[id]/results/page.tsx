import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { AiRecommendationCard } from '@/components/AiRecommendationCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buildSlotKeys, buildDensityMap } from '@/lib/availability';
import { Event, Response, AiRecommendation } from '@/types';

const TYPE_EMOJI: Record<string, string> = {
  meeting: '💼',
  party: '🎉',
  trip: '✈️',
  other: '📅',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [eventResult, responsesResult, recommendationResult] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).single(),
    supabase.from('responses').select('*').eq('event_id', id).order('created_at'),
    supabase.from('ai_recommendations').select('*').eq('event_id', id).maybeSingle(),
  ]);

  if (eventResult.error || !eventResult.data) notFound();

  const event = eventResult.data as Event;
  const responses = (responsesResult.data ?? []) as Response[];
  const recommendation = (recommendationResult.data ?? null) as AiRecommendation | null;

  const allSlotKeys = buildSlotKeys(event);
  const densityMap = buildDensityMap(responses);
  const bestSlots = recommendation?.best_slots ?? [];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-900">
        <Link href="/" className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          seeya
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-lg px-6 py-8 space-y-6">
        {/* Event header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">
              {TYPE_EMOJI[event.type]} {event.type}
            </Badge>
            <span className="text-xs text-stone-400 dark:text-stone-500">by {event.creator_name}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {event.name}
          </h1>
        </div>

        {/* Responder count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {responses.length === 0
              ? 'No responses yet'
              : `${responses.length} ${responses.length === 1 ? 'person has' : 'people have'} responded`}
          </p>
          {responses.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {responses.map(r => (
                <span
                  key={r.id}
                  className="inline-flex items-center rounded-full bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 text-xs text-stone-600 dark:text-stone-400"
                >
                  {r.respondent_name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommendation */}
        <AiRecommendationCard
          eventId={id}
          totalResponders={responses.length}
          initialRecommendation={recommendation}
        />

        {/* Heatmap */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-5 space-y-3">
          <h2 className="text-base font-medium text-stone-900 dark:text-stone-50">Group availability</h2>
          <HeatmapGrid
            event={event}
            densityMap={densityMap}
            totalResponders={responses.length}
            bestSlots={bestSlots}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href={`/event/${id}`} className="flex-1">
            <Button variant="outline" className="w-full rounded-2xl">
              ← Add your availability
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

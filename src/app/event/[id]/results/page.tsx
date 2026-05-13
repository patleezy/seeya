import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { AiRecommendationCard } from '@/components/AiRecommendationCard';
import { FinalizedBanner } from '@/components/FinalizedBanner';
import { HostTokenStore } from '@/components/HostTokenStore';
import { ResultsAutoRefresh } from '@/components/ResultsAutoRefresh';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buildSlotKeys, buildDensityMap } from '@/lib/availability';
import { Event, Response, AiRecommendation } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function ResultsPage({ params, searchParams }: Props) {
  const { id } = await params;
  await searchParams; // consume to avoid Next.js warning; token handling is client-side
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

  const declinedCount = responses.filter(r => r.declined).length;
  const activeCount = responses.length - declinedCount;

  const showNames = !event.anonymous;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Store host token from URL into sessionStorage (client-only) */}
      <Suspense fallback={null}>
        <HostTokenStore eventId={id} />
      </Suspense>
      {/* Auto-refresh every 30s so creator sees new responses */}
      <ResultsAutoRefresh />

      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-900">
        <Link href="/" className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          seeya
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-lg px-6 py-8 space-y-6">
        {/* Event header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">by {event.creator_name}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {event.name}
          </h1>
          {event.location && (
            <p className="text-sm text-stone-500 dark:text-stone-400">📍 {event.location}</p>
          )}
          {event.description && (
            <p className="text-sm text-stone-500 dark:text-stone-400">{event.description}</p>
          )}
        </div>

        {/* Responder count */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {responses.length === 0
              ? 'No responses yet'
              : declinedCount > 0
              ? `${activeCount} responded · ${declinedCount} can't make it`
              : `${responses.length} ${responses.length === 1 ? 'person has' : 'people have'} responded`}
          </p>
          {showNames && responses.length > 0 && (
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

        {/* Comments from respondents */}
        {responses.some(r => r.comment) && (
          <div className="space-y-2">
            {responses.filter(r => r.comment).map(r => (
              <div key={r.id} className="text-sm text-stone-500 dark:text-stone-400">
                <span className="font-medium text-stone-700 dark:text-stone-300">{r.respondent_name}:</span>{' '}
                {r.comment}
              </div>
            ))}
          </div>
        )}

        {/* Finalized banner OR finalize button (client component handles both) */}
        <FinalizedBanner event={event} bestSlots={bestSlots} allSlotKeys={allSlotKeys} densityMap={densityMap} totalResponders={responses.length} responses={responses} />

        {/* AI Recommendation — host only (component handles the check internally) */}
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
            responses={responses}
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

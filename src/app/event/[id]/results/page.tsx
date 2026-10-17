import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { toPublicEvent, toPublicResponses, toPublicComments } from '@/lib/sanitize';
import { HostResponsesProvider } from '@/components/HostResponsesProvider';
import { ResponseComments } from '@/components/ResponseComments';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { AiRecommendationCard } from '@/components/AiRecommendationCard';
import { FinalizedBanner } from '@/components/FinalizedBanner';
import { HostTokenStore } from '@/components/HostTokenStore';
import { ResultsAutoRefresh } from '@/components/ResultsAutoRefresh';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ResponseCTA } from '@/components/ResponseCTA';
import { RespondentManager } from '@/components/RespondentManager';
import { EditEventModal } from '@/components/EditEventModal';
import { Badge } from '@/components/ui/badge';
import { buildSlotKeys, buildDensityMap } from '@/lib/availability';
import { Event, Response, AiRecommendation } from '@/types';
import { LocationDisplay } from '@/components/LocationDisplay';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function ResultsPage({ params, searchParams }: Props) {
  const { id } = await params;
  await searchParams; // consume to avoid Next.js warning; token handling is client-side
  // Server-only read; everything below is sanitized before reaching client components
  const supabase = createSupabaseAdminClient();

  const [eventResult, responsesResult, recommendationResult] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).single(),
    supabase.from('responses').select('*').eq('event_id', id).order('created_at'),
    supabase.from('ai_recommendations').select('*').eq('event_id', id).maybeSingle(),
  ]);

  if (eventResult.error || !eventResult.data) notFound();

  const event = toPublicEvent(eventResult.data as Event);
  const rawResponses = (responsesResult.data ?? []) as Response[];
  const responses = toPublicResponses(rawResponses, event.anonymous);
  const comments = toPublicComments(rawResponses);
  const recommendation = (recommendationResult.data ?? null) as AiRecommendation | null;

  const allSlotKeys = buildSlotKeys(event);
  const densityMap = buildDensityMap(responses);
  const bestSlots = recommendation?.best_slots ?? [];

  const declinedCount = responses.filter(r => r.declined).length;
  const activeCount = responses.length - declinedCount;

  const showNames = !event.anonymous;

  return (
    <div className="min-h-screen bg-[var(--bg-outer)]">
      {/* Store host token from URL into sessionStorage (client-only) */}
      <Suspense fallback={null}>
        <HostTokenStore eventId={id} />
      </Suspense>
      {/* Auto-refresh every 30s so creator sees new responses */}
      <ResultsAutoRefresh />

      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-900">
        <Link href="/">
          <img src="/logo-full-light.svg" alt="seeya" className="h-8 dark:hidden" />
          <img src="/logo-full-dark.svg" alt="seeya" className="h-8 hidden dark:block" />
        </Link>
        <ThemeToggle />
      </header>

      <HostResponsesProvider eventId={id} publicResponses={responses}>
      <main className="mx-auto max-w-lg px-6 py-8 space-y-6">
        {/* Event header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">by {event.creator_name}</Badge>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
              {event.name}
            </h1>
            <EditEventModal event={event} />
          </div>
          {event.location && <LocationDisplay location={event.location} />}
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
          {responses.length > 0 && (
            <RespondentManager eventId={id} showNames={showNames} />
          )}
        </div>

        {/* Comments from respondents */}
        <ResponseComments comments={comments} />

        {/* Finalized banner OR finalize button (client component handles both) */}
        <FinalizedBanner event={event} bestSlots={bestSlots} allSlotKeys={allSlotKeys} densityMap={densityMap} totalResponders={responses.length} />

        {/* AI Recommendation — host only (component handles the check internally) */}
        <AiRecommendationCard
          eventId={id}
          totalResponders={responses.length}
          initialRecommendation={recommendation}
        />

        {/* Heatmap */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-[var(--bg-card)] p-5 space-y-3">
          <h2 className="text-base font-medium text-stone-900 dark:text-stone-50">Group availability</h2>
          <HeatmapGrid
            event={event}
            densityMap={densityMap}
            totalResponders={responses.length}
            bestSlots={bestSlots}
            newDates={event.new_dates}
          />
        </div>

        {/* Actions */}
        <ResponseCTA eventId={id} />
      </main>
      </HostResponsesProvider>
    </div>
  );
}

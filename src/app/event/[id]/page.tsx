import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ResponseForm } from '@/components/ResponseForm';
import { ShareLinkBox } from '@/components/ShareLinkBox';
import { HostTokenStore } from '@/components/HostTokenStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';
import { Event } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; t?: string }>;
}

export default async function EventPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { created } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !event) notFound();

  const e = event as Event;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const shareUrl = `${appUrl}/event/${id}`;

  const now = new Date();
  const deadlinePassed = e.response_deadline ? new Date(e.response_deadline) < now : false;

  const { count: responseCount } = await supabase
    .from('responses')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id);

  const isFull = e.max_responses !== null && (responseCount ?? 0) >= (e.max_responses ?? 0);
  const responsesClosed = deadlinePassed || isFull;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Suspense fallback={null}>
        <HostTokenStore eventId={id} />
      </Suspense>

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
            <Badge variant="outline">by {e.creator_name}</Badge>
            {e.anonymous && (
              <Badge variant="outline" className="text-stone-400 dark:text-stone-500">
                Anonymous
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {e.name}
          </h1>
          {e.location && (
            <p className="text-sm text-stone-500 dark:text-stone-400">📍 {e.location}</p>
          )}
          {e.description && (
            <p className="text-sm text-stone-500 dark:text-stone-400">{e.description}</p>
          )}
          {e.response_deadline && !deadlinePassed && (
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Responses close{' '}
              {new Date(e.response_deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Creator share banner */}
        {created === 'true' && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 p-4 space-y-2">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              🎉 Event created! Share this link with your people:
            </p>
            <ShareLinkBox url={shareUrl} />
          </div>
        )}

        {/* Closed banners */}
        {deadlinePassed && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              ⏰ Responses are closed for this event.
            </p>
          </div>
        )}
        {!deadlinePassed && isFull && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              This event has reached its maximum number of responses.
            </p>
          </div>
        )}

        {/* Response form */}
        {!responsesClosed && (
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-6 space-y-4">
            <h2 className="text-base font-medium text-stone-900 dark:text-stone-50">Add your availability</h2>
            <ResponseForm event={e} />
          </div>
        )}

        {/* Link to results */}
        <div className="text-center">
          <Link href={`/event/${id}/results`}>
            <Button variant="ghost" size="sm" className="text-stone-400 dark:text-stone-500 text-xs">
              View current results →
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

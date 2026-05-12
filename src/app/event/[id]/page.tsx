import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ResponseForm } from '@/components/ResponseForm';
import { ShareLinkBox } from '@/components/ShareLinkBox';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Event } from '@/types';

const TYPE_EMOJI: Record<string, string> = {
  coffee:     '☕',
  party:      '🎉',
  meetup:     '🗓️',
  happy_hour: '🍻',
  sports:     '⚽',
  vacation:   '✈️',
  dinner:     '🍽️',
  other:      '📅',
};

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
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
              {TYPE_EMOJI[e.type]} {e.type}
            </Badge>
            <span className="text-xs text-stone-400 dark:text-stone-500">by {e.creator_name}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {e.name}
          </h1>
          {e.description && (
            <p className="text-sm text-stone-500 dark:text-stone-400">{e.description}</p>
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

        {/* Response form */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-6 space-y-4">
          <h2 className="text-base font-medium text-stone-900 dark:text-stone-50">Add your availability</h2>
          <ResponseForm event={e} />
        </div>

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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AiRecommendation } from '@/types';

interface Props {
  eventId: string;
  totalResponders: number;
  initialRecommendation?: AiRecommendation | null;
}

export function AiRecommendationCard({ eventId, totalResponders, initialRecommendation }: Props) {
  const router = useRouter();
  const [isHost, setIsHost] = useState(false);
  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(
    initialRecommendation ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geminiFailed, setGeminiFailed] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(`host_token_${eventId}`)) setIsHost(true);
  }, [eventId]);

  // Only visible to the event creator
  if (!isHost) return null;

  async function fetchRecommendation() {
    if (totalResponders === 0) return;
    setLoading(true);
    setError(null);
    setGeminiFailed(false);
    setGeminiError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/recommend`, { method: 'POST' });
      if (!res.ok) {
        if (res.status === 429) throw new Error('rate_limit');
        throw new Error('server_error');
      }
      const data = await res.json();
      if (data.gemini_failed) {
        setGeminiFailed(true);
        setGeminiError(data.gemini_error ?? 'unavailable');
      }
      setRecommendation(data);
      // Refresh server data so FinalizedBanner picks up bestSlots immediately
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'rate_limit') {
        setError('Gemini is experiencing high demand right now. You can still finalize a time manually using the heatmap below.');
      } else {
        setError('AI analysis failed. You can still pick the best time manually.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (totalResponders === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">AI Recommendation</span>
        </div>
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-500">
          No responses yet — share the link to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">AI Recommendation</span>
      </div>

      {recommendation ? (
        <div className="mt-3 space-y-1">
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            {recommendation.recommendation.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={i}>{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
          {geminiFailed && (
            <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-1">
              ⚠ AI was unavailable ({geminiError === 'rate_limit' ? 'high demand' : 'service error'}) — showing algorithm result.{' '}
              <button className="underline hover:no-underline" onClick={fetchRecommendation}>Retry</button>
            </p>
          )}
          {!geminiFailed && (
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
              Powered by Gemini · {recommendation.source === 'ai' ? 'AI analysis' : 'Smart algorithm'}
            </p>
          )}
        </div>
      ) : loading ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
          <Spinner className="border-amber-400 border-t-amber-700 h-4 w-4" />
          <span>Finding the best time...</span>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {error ? (
            <>
              <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchRecommendation}
                className="text-xs h-7 rounded-xl"
              >
                Try again
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={fetchRecommendation}
              className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Get recommendation
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

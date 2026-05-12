'use client';

import { useState } from 'react';
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
  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(
    initialRecommendation ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRecommendation() {
    if (totalResponders === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/recommend`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to get recommendation');
      const data = await res.json();
      setRecommendation(data);
    } catch {
      setError('Something went wrong. Try again in a moment.');
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
            {recommendation.recommendation}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
            Powered by Gemini · {recommendation.source === 'ai' ? 'AI analysis' : 'Smart algorithm'}
          </p>
        </div>
      ) : loading ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
          <Spinner className="border-amber-400 border-t-amber-700 h-4 w-4" />
          <span>Finding the best time...</span>
        </div>
      ) : (
        <div className="mt-3">
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <Button
            size="sm"
            onClick={fetchRecommendation}
            className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Get recommendation
          </Button>
        </div>
      )}
    </div>
  );
}

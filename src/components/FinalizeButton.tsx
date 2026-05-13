'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface Props {
  eventId: string;
  bestSlot: string | null;
  onFinalized: (slot: string) => void;
}

export function FinalizeButton({ eventId, bestSlot, onFinalized }: Props) {
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(`host_token_${eventId}`);
    setHostToken(token);
  }, [eventId]);

  if (!hostToken || !bestSlot) return null;

  async function handleFinalize() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_token: hostToken, slot: bestSlot }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to finalize');
      }
      const { finalized_slot } = await res.json();
      onFinalized(finalized_slot);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button
        onClick={handleFinalize}
        disabled={loading}
        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        size="lg"
      >
        <CheckCircle className="h-4 w-4" />
        {loading ? 'Finalizing...' : 'Finalize this time →'}
      </Button>
      <p className="text-xs text-center text-stone-400 dark:text-stone-500">
        This locks in the recommended time and makes it visible to everyone.
      </p>
    </div>
  );
}

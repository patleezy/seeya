'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Event, SlotDensityMap } from '@/types';
import { format, parseISO } from 'date-fns';

interface Props {
  event: Event;
  bestSlot: string | null;
  allSlotKeys: string[];
  densityMap: SlotDensityMap;
  totalResponders: number;
  onFinalized: (slot: string) => void;
}

function formatSlotOption(slot: string, event: Event): string {
  if (event.mode === 'days') {
    return format(parseISO(slot), 'EEE, MMM d, yyyy');
  }
  const date = format(parseISO(slot), 'EEE, MMM d');
  const [h, m] = slot.slice(11).split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${date} at ${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

export function FinalizeButton({ event, bestSlot, allSlotKeys, densityMap, totalResponders, onFinalized }: Props) {
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem(`host_token_${event.id}`);
    setHostToken(token);
  }, [event.id]);

  if (!hostToken) return null;

  async function handleFinalize(slot: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_token: hostToken, slot }),
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

  // Slots sorted by density descending for the picker
  const slotsByDensity = [...allSlotKeys].sort((a, b) => (densityMap[b] ?? 0) - (densityMap[a] ?? 0));

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {bestSlot ? (
        <Button
          onClick={() => handleFinalize(bestSlot)}
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          size="lg"
        >
          <CheckCircle className="h-4 w-4" />
          {loading ? 'Finalizing...' : 'Finalize this time →'}
        </Button>
      ) : (
        <p className="text-sm text-stone-400 dark:text-stone-500 text-center">
          Get the AI recommendation above to see the best time, or pick one below.
        </p>
      )}

      <div className="flex items-center justify-center">
        <button
          type="button"
          className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 flex items-center gap-1 transition-colors"
          onClick={() => setShowPicker(v => !v)}
        >
          {showPicker ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showPicker ? 'Hide options' : 'Choose a different time'}
        </button>
      </div>

      {showPicker && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="max-h-56 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
            {slotsByDensity.map(slot => {
              const count = densityMap[slot] ?? 0;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={loading}
                  onClick={() => handleFinalize(slot)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors disabled:opacity-50"
                >
                  <span className="text-stone-700 dark:text-stone-300">{formatSlotOption(slot, event)}</span>
                  <span className="text-xs text-stone-400 dark:text-stone-500 ml-3 shrink-0">
                    {count}/{totalResponders} free
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {bestSlot && (
        <p className="text-xs text-center text-stone-400 dark:text-stone-500">
          This locks in the time and makes it visible to everyone.
        </p>
      )}
    </div>
  );
}

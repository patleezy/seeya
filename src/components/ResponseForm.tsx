'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvailabilityGrid } from '@/components/AvailabilityGrid';
import { Event } from '@/types';

interface Props {
  event: Event;
}

export function ResponseForm({ event }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_name: name.trim(),
          availability: Array.from(selectedSlots),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }
      router.push(`/event/${event.id}/results`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="respondent_name">Your name</Label>
        <Input
          id="respondent_name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Add your name"
          required
          className="rounded-2xl"
        />
      </div>

      <div className="space-y-2">
        <Label>When are you free?</Label>
        <AvailabilityGrid
          event={event}
          selectedSlots={selectedSlots}
          onSlotsChange={setSelectedSlots}
        />
      </div>

      <div>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <Button
          type="submit"
          size="lg"
          disabled={submitting || !name.trim()}
          className="w-full rounded-2xl"
        >
          {submitting ? 'Submitting...' : `Submit${selectedSlots.size > 0 ? ` (${selectedSlots.size} slot${selectedSlots.size === 1 ? '' : 's'})` : ''}`}
        </Button>
        <p className="text-xs text-stone-400 text-center mt-2">
          No slots selected = you can&apos;t make it
        </p>
      </div>
    </form>
  );
}

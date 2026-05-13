'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { AvailabilityGrid } from '@/components/AvailabilityGrid';
import { Event } from '@/types';

interface Props {
  event: Event;
}

export function ResponseForm({ event }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [decliningMode, setDecliningMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitResponse(opts: { declined: boolean; slots: Set<string> }) {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_name: name.trim(),
          email: email.trim() || undefined,
          availability: Array.from(opts.slots),
          comment: comment.trim() || undefined,
          declined: opts.declined,
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
      setDecliningMode(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitResponse({ declined: false, slots: selectedSlots });
  }

  async function handleDecline() {
    setDecliningMode(true);
    await submitResponse({ declined: true, slots: new Set() });
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
          autoComplete="name"
          className="rounded-2xl"
        />
        <Input
          id="respondent_email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email (optional — for calendar invites)"
          autoComplete="email"
          className="rounded-2xl"
        />
        <p className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1">
          <Info className="h-3 w-3 flex-shrink-0" />
          Only used to send you event details. Never shared or sold.
        </p>
      </div>

      <div className="space-y-2">
        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Anything to add? (optional)"
          rows={2}
          className="rounded-2xl resize-none"
          maxLength={500}
        />
        <p className="text-xs text-stone-400 dark:text-stone-500">
          Comments are visible to everyone who views results.
        </p>
      </div>

      <div className="space-y-2">
        <Label>When are you free?</Label>
        <AvailabilityGrid
          event={event}
          selectedSlots={selectedSlots}
          onSlotsChange={setSelectedSlots}
        />
      </div>

      <div className="space-y-3">
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button
          type="submit"
          size="lg"
          disabled={submitting || !name.trim()}
          className="w-full rounded-2xl"
        >
          {submitting && !decliningMode
            ? 'Submitting...'
            : `Submit${selectedSlots.size > 0 ? ` (${selectedSlots.size} slot${selectedSlots.size === 1 ? '' : 's'})` : ''}`}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={submitting || !name.trim()}
          className="w-full rounded-2xl"
          onClick={handleDecline}
        >
          {submitting && decliningMode ? 'Declining...' : "None of these work for me"}
        </Button>
      </div>
    </form>
  );
}

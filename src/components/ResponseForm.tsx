'use client';

import { useState, useEffect } from 'react';
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
  newDates?: string[];
}

interface StoredResponse {
  responseId: string;
  respondentName: string;
}

function storageKey(eventId: string) {
  return `seeya_responded_${eventId}`;
}

export function ResponseForm({ event, newDates }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [decliningMode, setDecliningMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingResponse, setExistingResponse] = useState<StoredResponse | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey(event.id));
      if (stored) {
        const parsed = JSON.parse(stored) as StoredResponse;
        setExistingResponse(parsed);
        setName(parsed.respondentName);
      }
    } catch {}
  }, [event.id]);

  async function submitResponse(opts: { declined: boolean; slots: Set<string> }) {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      // Delete previous response before submitting updated one
      if (existingResponse) {
        await fetch(`/api/events/${event.id}/responses/${existingResponse.responseId}`, {
          method: 'DELETE',
        });
      }

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
      const data = await res.json();
      try {
        localStorage.setItem(storageKey(event.id), JSON.stringify({
          responseId: data.id,
          respondentName: name.trim(),
        }));
      } catch {}
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
      {existingResponse && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Updating {existingResponse.respondentName}&apos;s response — your previous submission will be replaced.
        </div>
      )}

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
          readOnly={!!existingResponse}
        />
        <Input
          id="respondent_email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email (optional)"
          autoComplete="email"
          className="rounded-2xl"
        />
        <p className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1">
          <Info className="h-3 w-3 flex-shrink-0" />
          Receive a calendar invite when the event is finalized. Your email is only used for event planning and never sold to third parties.
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
          newDates={newDates}
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
            : existingResponse
              ? `Update${selectedSlots.size > 0 ? ` (${selectedSlots.size} slot${selectedSlots.size === 1 ? '' : 's'})` : ''}`
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

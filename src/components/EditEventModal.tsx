'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DayPicker } from 'react-day-picker';
import { parseISO, format } from 'date-fns';
import { X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Event } from '@/types';
import 'react-day-picker/dist/style.css';

interface Props {
  event: Event;
}

export function EditEventModal({ event }: Props) {
  const router = useRouter();
  const [isHost, setIsHost] = useState(false);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(event.name);
  const [description, setDescription] = useState(event.description ?? '');
  const [location, setLocation] = useState(event.location ?? '');
  const [selectedDays, setSelectedDays] = useState<Date[]>(
    event.dates.map(d => parseISO(d))
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(`host_token_${event.id}`);
    if (token) {
      setIsHost(true);
      setHostToken(token);
    }
  }, [event.id]);

  if (!isHost) return null;

  function openModal() {
    setName(event.name);
    setDescription(event.description ?? '');
    setLocation(event.location ?? '');
    setSelectedDays(event.dates.map(d => parseISO(d)));
    setError(null);
    setOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Event name is required.');
      return;
    }
    if (selectedDays.length === 0) {
      setError('At least one date is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const dates = selectedDays.map(d => format(d, 'yyyy-MM-dd')).sort();
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_token: hostToken,
          name: name.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          dates,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        title="Edit event"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full sm:max-w-lg bg-[var(--bg-card)] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100 dark:border-stone-800">
              <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">Edit event</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Event name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. hest bridal/bach"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Address or link (optional)"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-description">Notes</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Any details for respondents (optional)"
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Dates
                  <span className="ml-2 text-xs font-normal text-stone-400 dark:text-stone-500">
                    tap to add or remove options
                  </span>
                </Label>
                <div className="flex justify-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-[var(--bg-input)] py-2">
                  <DayPicker
                    mode="multiple"
                    selected={selectedDays}
                    onSelect={days => setSelectedDays(days ?? [])}
                    captionLayout="dropdown"
                    classNames={{
                      caption_label: 'hidden',
                      chevron: '!fill-stone-500 dark:!fill-stone-300',
                    }}
                  />
                </div>
                {selectedDays.length > 0 && (
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    {selectedDays.length} date{selectedDays.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2 pt-1 pb-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-stone-900 hover:bg-stone-700 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

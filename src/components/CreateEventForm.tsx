'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { EventType, EventMode, CreateEventRequest } from '@/types';
import 'react-day-picker/style.css';

const EVENT_TYPE_OPTIONS: { value: EventType; label: string; emoji: string }[] = [
  { value: 'coffee',      label: 'Coffee Catchup',  emoji: '☕' },
  { value: 'party',       label: 'Birthday Party',  emoji: '🎉' },
  { value: 'meetup',      label: 'Weekly Meetup',   emoji: '🗓️' },
  { value: 'happy_hour',  label: 'Happy Hour',      emoji: '🍻' },
  { value: 'sports',      label: 'Soccer Practice', emoji: '⚽' },
  { value: 'vacation',    label: 'Family Vacay',    emoji: '✈️' },
  { value: 'dinner',      label: 'Dinner Plans',    emoji: '🍽️' },
  { value: 'other',       label: 'Other',           emoji: '📅' },
];

const DURATION_STEPS = [15, 30, 45, 60, 90, 120, 180, 240];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = minutes / 60;
  return hrs === Math.floor(hrs) ? `${hrs} hr${hrs > 1 ? 's' : ''}` : `${hrs} hrs`;
}

interface FormValues {
  name: string;
  description: string;
  type: EventType;
  creator_name: string;
  mode: EventMode;
  dates: Date[];
  time_start: string;
  time_end: string;
  slot_duration: number;
}

export function CreateEventForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      type: 'coffee',
      mode: 'times',
      dates: [],
      time_start: '09:00',
      time_end: '17:00',
      slot_duration: 30,
    },
  });

  const watchName = watch('name');
  const watchCreatorName = watch('creator_name');
  const watchType = watch('type');
  const watchMode = watch('mode');
  const watchDates = watch('dates');

  const showCreatorField = !!watchName?.trim();
  const showModeField = showCreatorField && !!watchCreatorName?.trim();
  const showDatePicker = showModeField;
  const showTimeFields = showDatePicker && watchMode === 'times';
  const showSubmit = watchDates?.length > 0;

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const body: CreateEventRequest = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        type: values.type,
        mode: values.mode,
        creator_name: values.creator_name.trim(),
        dates: values.dates.map(d => format(d, 'yyyy-MM-dd')).sort(),
        ...(values.mode === 'times' && {
          time_start: values.time_start,
          time_end: values.time_end,
          slot_duration: values.slot_duration,
        }),
      };
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create event');
      }
      const { id } = await res.json();
      router.push(`/event/${id}?created=true`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, '0');
    return { value: `${h}:00`, label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM` };
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Event name — always visible */}
      <div className="space-y-2">
        <Input
          {...register('name', { required: true })}
          placeholder="Team lunch, birthday bash, weekend trip..."
          className="h-14 text-lg rounded-2xl border-stone-200 dark:border-stone-700 focus-visible:ring-amber-400"
          autoFocus
        />
        {/* Description — shown after name */}
        {showCreatorField && (
          <Textarea
            {...register('description')}
            placeholder="Add a note (optional)"
            className="rounded-2xl border-stone-200 dark:border-stone-700 focus-visible:ring-amber-400 text-sm"
            rows={2}
          />
        )}
      </div>

      {/* Event type chips */}
      {showCreatorField && (
        <div className="animate-[slideUp_0.3s_ease-out] space-y-2">
          <Label className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wide">What kind of event?</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-all',
                      field.value === opt.value
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-50 dark:text-stone-900 dark:border-stone-50'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-500'
                    )}
                  >
                    <span>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      )}

      {/* Creator name */}
      {showCreatorField && (
        <div className="animate-[slideUp_0.3s_ease-out] space-y-2">
          <Label htmlFor="creator_name" className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wide">
            Who&apos;s organizing this?
          </Label>
          <Input
            id="creator_name"
            {...register('creator_name', { required: true })}
            placeholder="Your name"
            className="rounded-2xl border-stone-200 dark:border-stone-700 focus-visible:ring-amber-400"
          />
        </div>
      )}

      {/* Time mode toggle */}
      {showModeField && (
        <div className="animate-[slideUp_0.3s_ease-out] space-y-2">
          <Label className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wide">How should people respond?</Label>
          <Controller
            control={control}
            name="mode"
            render={({ field }) => (
              <div className="flex rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                {(['times', 'days'] as EventMode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => field.onChange(m)}
                    className={cn(
                      'flex-1 py-2.5 text-sm font-medium transition-colors',
                      field.value === m
                        ? 'bg-stone-900 text-white dark:bg-stone-50 dark:text-stone-900'
                        : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                    )}
                  >
                    {m === 'times' ? '🕐 Specific times' : '📆 Full days'}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      )}

      {/* Date picker */}
      {showDatePicker && (
        <div className="animate-[slideUp_0.3s_ease-out] space-y-2">
          <Label className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wide">
            Which dates? <span className="normal-case font-normal">({watchDates?.length ?? 0} selected)</span>
          </Label>
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden bg-white dark:bg-stone-900 p-2">
            <Controller
              control={control}
              name="dates"
              render={({ field }) => (
                <DayPicker
                  mode="multiple"
                  selected={field.value}
                  onSelect={days => field.onChange(days ?? [])}
                  disabled={{ before: new Date() }}
                  className="!font-sans"
                  classNames={{
                    root: 'w-full',
                    months: 'w-full',
                    month: 'w-full',
                    month_grid: 'w-full',
                    day_button: 'w-full h-9 rounded-xl text-sm font-medium',
                    selected: 'bg-stone-900 text-white dark:bg-stone-50 dark:text-stone-900 rounded-xl',
                    today: 'text-amber-500 font-semibold',
                    disabled: 'opacity-30 cursor-not-allowed',
                  }}
                />
              )}
            />
          </div>
        </div>
      )}

      {/* Time window — only for 'times' mode */}
      {showTimeFields && (
        <div className="animate-[slideUp_0.3s_ease-out] space-y-3">
          <Label className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wide">Time window</Label>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="time_start" className="text-xs text-stone-400">From</Label>
              <select
                id="time_start"
                {...register('time_start')}
                className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {timeOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="time_end" className="text-xs text-stone-400">To</Label>
              <select
                id="time_end"
                {...register('time_end')}
                className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {timeOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Controller
            control={control}
            name="slot_duration"
            render={({ field }) => {
              const stepIndex = DURATION_STEPS.indexOf(field.value) === -1
                ? 1
                : DURATION_STEPS.indexOf(field.value);
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wide">
                      Slot size
                    </Label>
                    <span className="text-sm font-semibold text-stone-900 dark:text-stone-50 tabular-nums">
                      {formatDuration(field.value)}
                    </span>
                  </div>
                  <div className="relative pt-1">
                    <input
                      type="range"
                      min={0}
                      max={DURATION_STEPS.length - 1}
                      step={1}
                      value={stepIndex}
                      onChange={e => field.onChange(DURATION_STEPS[Number(e.target.value)])}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer bg-stone-200 dark:bg-stone-700 accent-stone-900 dark:accent-stone-100"
                    />
                    <div className="flex justify-between mt-1.5">
                      {DURATION_STEPS.map(d => (
                        <span
                          key={d}
                          className={cn(
                            'text-[10px] transition-colors',
                            field.value === d
                              ? 'text-stone-900 dark:text-stone-100 font-medium'
                              : 'text-stone-300 dark:text-stone-600'
                          )}
                        >
                          {formatDuration(d)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Submit */}
      {showSubmit && (
        <div className="animate-[slideUp_0.3s_ease-out] pt-2">
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full rounded-2xl bg-stone-900 dark:bg-stone-50"
          >
            {submitting ? 'Creating...' : 'Create event →'}
          </Button>
        </div>
      )}
    </form>
  );
}

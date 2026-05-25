'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { EventMode, CreateEventRequest } from '@/types';
import 'react-day-picker/style.css';

const DURATION_PRESETS: { value: number; label: string }[] = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hr' },
  { value: 120, label: '2 hrs' },
  { value: 180, label: '3 hrs' },
  { value: 240, label: '4 hrs' },
  { value: 300, label: '5 hrs' },
  { value: 360, label: '6 hrs' },
  { value: 420, label: '7 hrs' },
  { value: 480, label: '8 hrs' },
];

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

interface FormValues {
  name: string;
  description: string;
  location: string;
  creator_name: string;
  mode: EventMode;
  dates: Date[];
  time_start: string;
  time_end: string;
  slot_duration: number;
  timezone: string;
  response_deadline: string;
  anonymous: boolean;
  max_responses: string;
  trip_duration: string;
}

function getBrowserTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
}

export function CreateEventForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customDuration, setCustomDuration] = useState(false);
  const [durationInput, setDurationInput] = useState('30');
  const [customUnit, setCustomUnit] = useState<'min' | 'hr'>('min');

  const { register, handleSubmit, control, watch, formState: {} } = useForm<FormValues>({
    defaultValues: {
      mode: 'times',
      dates: [],
      time_start: '09:00',
      time_end: '17:00',
      slot_duration: 30,
      timezone: getBrowserTimezone(),
      anonymous: false,
      max_responses: '',
      response_deadline: '',
      trip_duration: '1',
    },
  });

  const watchName = watch('name');
  const watchCreatorName = watch('creator_name');
  const watchMode = watch('mode');
  const watchDates = watch('dates');

  const showCreatorField = !!watchName?.trim();
  const showModeField = showCreatorField && !!watchCreatorName?.trim();
  const showDatePicker = showModeField;
  const showTimeFields = showDatePicker && watchMode === 'times';
  const showAdvancedToggle = (watchDates?.length ?? 0) > 0;
  const showSubmit = (watchDates?.length ?? 0) > 0;

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const maxResp = parseInt(values.max_responses, 10);
      const body: CreateEventRequest = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        location: values.location?.trim() || undefined,
        type: 'other',
        mode: values.mode,
        creator_name: values.creator_name.trim(),
        dates: values.dates.map(d => format(d, 'yyyy-MM-dd')).sort(),
        anonymous: values.anonymous,
        max_responses: !isNaN(maxResp) && maxResp > 0 ? maxResp : undefined,
        response_deadline: values.response_deadline || undefined,
        ...(values.mode === 'times' && {
          time_start: values.time_start,
          time_end: values.time_end,
          slot_duration: values.slot_duration,
          timezone: values.timezone || undefined,
        }),
        ...(values.mode === 'days' && {
          trip_duration: parseInt(values.trip_duration, 10) > 1 ? parseInt(values.trip_duration, 10) : undefined,
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
      const { id, host_token } = await res.json();
      try {
        const saved = JSON.parse(localStorage.getItem('seeya_my_events') ?? '[]');
        saved.unshift({ id, name: values.name, host_token, created_at: new Date().toISOString() });
        localStorage.setItem('seeya_my_events', JSON.stringify(saved.slice(0, 20)));
      } catch {}
      router.push(`/event/${id}?created=true&t=${host_token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, '0');
    return { value: `${h}:00`, label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM` };
  });

  const selectClass = 'w-full rounded-xl border-2 border-transparent bg-[var(--bg-input)] px-4 py-3.5 text-base text-stone-900 dark:text-stone-50 focus:outline-none focus:border-amber-400 focus:bg-[var(--bg-card)] transition-all duration-200';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Event name */}
      <div className="space-y-2">
        <Input
          {...register('name', { required: true })}
          placeholder="coffee catchup, birthday party, family vacay..."
          className="h-14 text-lg rounded-2xl border-stone-200 dark:border-stone-700 focus-visible:ring-amber-400"
          autoFocus
          autoComplete="off"
        />
        {showCreatorField && (
          <>
            <Textarea
              {...register('description')}
              placeholder="Add details people should know"
              className="rounded-2xl border-stone-200 dark:border-stone-700 focus-visible:ring-amber-400"
              rows={2}
            />
            <Input
              {...register('location')}
              placeholder="Location (optional)"
              className="rounded-2xl border-stone-200 dark:border-stone-700 focus-visible:ring-amber-400"
              autoComplete="off"
            />
          </>
        )}
      </div>

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
            autoComplete="name"
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
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-[var(--bg-card)] p-2">
            <Controller
              control={control}
              name="dates"
              render={({ field }) => (
                <DayPicker
                  mode="multiple"
                  selected={field.value}
                  onSelect={days => field.onChange(days ?? [])}
                  disabled={{ before: new Date() }}
                  captionLayout="dropdown"
                  startMonth={new Date()}
                  endMonth={new Date(new Date().getFullYear() + 4, 11)}
                  className="!font-sans"
                  classNames={{
                    root: 'rdp-root w-full',
                    months: 'w-full',
                    month: 'w-full',
                    month_caption: 'flex justify-center items-center w-full py-1',
                    month_grid: 'w-full',
                    day_button: 'w-full h-9 rounded-xl text-sm font-medium',
                    selected: 'bg-stone-900 text-white dark:bg-stone-50 dark:text-stone-900 rounded-xl',
                    today: 'text-amber-500 font-semibold',
                    disabled: 'opacity-30 cursor-not-allowed',
                    chevron: 'rdp-chevron !fill-stone-500 dark:!fill-stone-300',
                    button_previous: 'rdp-button_previous rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800',
                    button_next: 'rdp-button_next rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800',
                    caption_label: 'hidden',
                    dropdowns: 'flex gap-2 items-center justify-center',
                    dropdown: 'bg-transparent text-sm font-semibold text-stone-900 dark:text-stone-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg px-1',
                    months_dropdown: '',
                    years_dropdown: '',
                  }}
                />
              )}
            />
          </div>
        </div>
      )}

      {/* Trip duration — only for days mode */}
      {showDatePicker && watchMode === 'days' && (
        <div className="animate-[slideUp_0.3s_ease-out] space-y-1.5">
          <Label className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wide">Trip duration</Label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={30}
              {...register('trip_duration')}
              className="w-16 rounded-xl border-2 border-transparent bg-[var(--bg-input)] px-3 py-2 text-base text-center text-stone-900 dark:text-stone-50 focus:outline-none focus:border-amber-400 focus:bg-[var(--bg-card)] transition-all duration-200"
            />
            <span className="text-sm text-stone-500 dark:text-stone-400">day(s)</span>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Set to 2+ for multi-day trips — respondents pick a start date block (e.g. a 3-day weekend)
          </p>
        </div>
      )}

      {/* Time window */}
      {showTimeFields && (
        <div className="animate-[slideUp_0.3s_ease-out] space-y-4">
          <div>
            <Label className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wide mb-2 block">Time window</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor="time_start" className="text-xs text-stone-400">From</Label>
                <select id="time_start" {...register('time_start')} className={selectClass}>
                  {timeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="time_end" className="text-xs text-stone-400">To</Label>
                <select id="time_end" {...register('time_end')} className={selectClass}>
                  {timeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Duration chips */}
          <Controller
            control={control}
            name="slot_duration"
            render={({ field }) => (
              <div className="space-y-2">
                <Label className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wide">
                  Duration
                </Label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        field.onChange(value);
                        setDurationInput(String(value));
                        setCustomDuration(false);
                        setCustomUnit('min');
                      }}
                      className={cn(
                        'px-4 py-2 rounded-xl border-2 text-sm font-medium',
                        !customDuration && field.value === value
                          ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-800 dark:text-stone-50 dark:border-stone-700 scale-105'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400 hover:-translate-y-0.5'
                      )}
                      style={{ transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCustomDuration(true)}
                    className={cn(
                      'px-4 py-2 rounded-xl border-2 text-sm font-medium',
                      customDuration
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-800 dark:text-stone-50 dark:border-stone-700 scale-105'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400 hover:-translate-y-0.5'
                    )}
                    style={{ transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  >
                    Custom
                  </button>
                </div>
                {customDuration && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={customUnit === 'min' ? 5 : 0.25}
                      max={customUnit === 'min' ? 480 : 8}
                      step={customUnit === 'hr' ? 0.25 : 5}
                      value={durationInput}
                      onChange={e => {
                        setDurationInput(e.target.value);
                        const num = parseFloat(e.target.value);
                        const minutes = customUnit === 'hr' ? Math.round(num * 60) : Math.round(num);
                        if (!isNaN(minutes) && minutes >= 5 && minutes <= 480) field.onChange(minutes);
                      }}
                      onBlur={() => {
                        const num = parseFloat(durationInput);
                        const minutes = customUnit === 'hr' ? Math.round(num * 60) : Math.round(num);
                        if (isNaN(minutes) || minutes < 5) {
                          field.onChange(30);
                          setDurationInput(customUnit === 'hr' ? '0.5' : '30');
                        } else if (minutes > 480) {
                          field.onChange(480);
                          setDurationInput(customUnit === 'hr' ? '8' : '480');
                        }
                      }}
                      className="w-20 rounded-xl border-2 border-transparent bg-[var(--bg-input)] px-3 py-2 text-base text-center text-stone-900 dark:text-stone-50 focus:outline-none focus:border-amber-400 focus:bg-[var(--bg-card)] transition-all duration-200"
                    />
                    <select
                      value={customUnit}
                      onChange={e => {
                        const newUnit = e.target.value as 'min' | 'hr';
                        if (newUnit === 'hr') {
                          const hrs = parseFloat((field.value / 60).toFixed(2));
                          setDurationInput(String(hrs));
                        } else {
                          setDurationInput(String(field.value));
                        }
                        setCustomUnit(newUnit);
                      }}
                      className={cn(selectClass, 'w-24')}
                    >
                      <option value="min">min</option>
                      <option value="hr">hr</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          />
        </div>
      )}

      {/* Advanced options — visible whenever dates are selected */}
      {showAdvancedToggle && (
        <div className="animate-[slideUp_0.3s_ease-out]">
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Advanced options
          </button>

          {showAdvanced && (
            <div className="mt-3 animate-[slideUp_0.2s_ease-out] space-y-4 pl-4 border-l border-stone-100 dark:border-stone-800">

              {/* Timezone — times mode only */}
              {watchMode === 'times' && (
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wide">
                    Timezone
                  </Label>
                  <select id="timezone" {...register('timezone')} className={selectClass}>
                    {COMMON_TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    Shown to participants so everyone knows what timezone the times refer to.
                  </p>
                </div>
              )}

              {/* Response deadline */}
              <div className="space-y-2">
                <Label htmlFor="response_deadline" className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wide">
                  Close responses on
                </Label>
                <input
                  id="response_deadline"
                  type="date"
                  {...register('response_deadline')}
                  className={selectClass}
                />
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  After this date, no new availability can be submitted.
                </p>
              </div>

              {/* Anonymous mode */}
              <div className="flex items-start gap-3">
                <input
                  id="anonymous"
                  type="checkbox"
                  {...register('anonymous')}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 dark:border-stone-600 accent-stone-900 dark:accent-stone-100"
                />
                <div>
                  <Label htmlFor="anonymous" className="text-stone-700 dark:text-stone-300 text-sm font-medium cursor-pointer">
                    Hide participant names from each other
                  </Label>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                    Only you (the organizer) can see who said what.
                  </p>
                </div>
              </div>

              {/* RSVP cap */}
              <div className="space-y-2">
                <Label htmlFor="max_responses" className="text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wide">
                  Max responses
                </Label>
                <input
                  id="max_responses"
                  type="number"
                  min={1}
                  {...register('max_responses')}
                  placeholder="Unlimited"
                  className={cn(selectClass, 'w-32')}
                />
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Once this limit is reached, no new responses will be accepted.
                </p>
              </div>
            </div>
          )}
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

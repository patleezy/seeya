'use client';

import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';
import { Event, Response, SlotDensityMap } from '@/types';
import { buildSlotKeys, formatSlotLabel, formatDateHeaderLines } from '@/lib/availability';
import { cn } from '@/lib/utils';
import { RsvpListModal } from '@/components/RsvpListModal';

interface Props {
  event: Event;
  densityMap: SlotDensityMap;
  totalResponders: number;
  bestSlots?: string[];
  responses?: Response[];
  newDates?: string[];
}

function respondentColor(index: number, total: number): string {
  const hue = Math.round((index * 360) / Math.max(total, 1)) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

const DOTS_THRESHOLD = 8;   // show individual dots up to this count
const COUNT_THRESHOLD = 24; // show count badge up to this count; ≥25 → nothing
const LEGEND_MAX = 12;      // max legend chips before truncation
const LEGEND_HIDE = 21;     // hide legend entirely at this count
const TOOLTIP_MAX = 5;      // max names shown in the per-slot hover tooltip before truncation

interface HoveredTooltip {
  slot: string;
  anchorRect: DOMRect;
}

const TOOLTIP_MARGIN = 6;          // gap between the tooltip and its anchor cell, px
const TOOLTIP_SCREEN_PADDING = 8;  // min distance the tooltip keeps from the screen edge, px

function formatModalTitle(slot: string, event: Event): string {
  if (event.mode === 'days') {
    const [line1, line2] = formatDateHeaderLines(slot, event.trip_duration);
    return line2.startsWith('–') ? `${line1}${line2}` : format(parseISO(slot), 'EEEE, MMMM d');
  }
  const dateLabel = format(parseISO(slot.slice(0, 10)), 'EEEE, MMMM d');
  const timeLabel = formatSlotLabel(slot, 'times');
  return `${dateLabel} · ${timeLabel}`;
}

// Renders via a portal with `position: fixed`, so it can't be clipped by any scrollable/overflow
// ancestor (e.g. the grid's own `overflow-x-auto` wrapper) — only the real viewport matters here.
// Position is computed from the tooltip's own measured size in a `useLayoutEffect`, so it's exact
// (no more guessing a fixed height) and resolves before paint, avoiding a visible jump.
function HeatmapTooltip({ anchorRect, children }: { anchorRect: DOMRect; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; pointerLeft: number | null; openBelow: boolean } | null>(null);

  useLayoutEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const openBelow = anchorRect.top - rect.height - TOOLTIP_MARGIN < 0;
    const top = openBelow ? anchorRect.bottom + TOOLTIP_MARGIN : anchorRect.top - rect.height - TOOLTIP_MARGIN;

    const idealLeft = anchorRect.left + anchorRect.width / 2 - rect.width / 2;
    const maxLeft = window.innerWidth - rect.width - TOOLTIP_SCREEN_PADDING;
    const left = Math.min(Math.max(idealLeft, TOOLTIP_SCREEN_PADDING), Math.max(maxLeft, TOOLTIP_SCREEN_PADDING));

    const anchorCenterX = anchorRect.left + anchorRect.width / 2;
    const pointerLeft = anchorCenterX - left;
    const pointerVisible = pointerLeft > 8 && pointerLeft < rect.width - 8;

    setPos({ top, left, pointerLeft: pointerVisible ? pointerLeft : null, openBelow });
  }, [anchorRect]);

  const box = (
    <div className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs rounded-xl px-2.5 py-1.5 whitespace-nowrap shadow-lg">
      {children}
    </div>
  );
  const pointer = pos?.pointerLeft != null && (
    <div
      className="absolute w-2 h-2 bg-stone-900 dark:bg-stone-100 rotate-45"
      style={{ left: pos.pointerLeft, top: pos.openBelow ? -4 : undefined, bottom: pos.openBelow ? undefined : -4, transform: 'translateX(-50%) rotate(45deg)' }}
    />
  );

  return createPortal(
    <div
      ref={ref}
      className="fixed z-50 pointer-events-none"
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, opacity: pos ? 1 : 0 }}
    >
      {box}
      {pointer}
    </div>,
    document.body
  );
}

export function HeatmapGrid({ event, densityMap, totalResponders, bestSlots = [], responses = [], newDates = [] }: Props) {
  const [hovered, setHovered] = useState<HoveredTooltip | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  function handleEnter(e: MouseEvent<HTMLDivElement>, slot: string) {
    setHovered({ slot, anchorRect: e.currentTarget.getBoundingClientRect() });
  }

  function handleSelect(slot: string) {
    setHovered(null);
    setSelectedSlot(slot);
  }

  const allSlots = buildSlotKeys(event);
  const dates = [...event.dates].sort();
  const isDayMode = event.mode === 'days';
  const bestSet = new Set(bestSlots);
  const isAnonymous = event.anonymous;
  const n = responses.length;

  // Build slot → respondent name list
  const slotToResponders = new Map<string, string[]>();
  responses.forEach(r => {
    r.availability.forEach(slot => {
      const existing = slotToResponders.get(slot) ?? [];
      existing.push(r.respondent_name);
      slotToResponders.set(slot, existing);
    });
  });

  // Color per respondent (by index in responses array)
  const respondentColors = responses.map((_, i) => respondentColor(i, n));
  const respondentColorMap = new Map(responses.map((r, i) => [r.respondent_name, respondentColors[i]]));

  let timeLabels: string[] = [];
  let grid: string[][] = [];

  if (isDayMode) {
    timeLabels = [''];
    grid = [dates];
  } else {
    const slotsForFirstDate = allSlots.filter(s => s.startsWith(dates[0]));
    timeLabels = slotsForFirstDate.map(s => formatSlotLabel(s, 'times'));
    grid = slotsForFirstDate.map((_, rowIdx) => {
      return dates.map(date => {
        const timepart = slotsForFirstDate[rowIdx].slice(10);
        return date + timepart;
      });
    });
  }

  const maxBestDensity = bestSlots.length > 0
    ? Math.max(...bestSlots.map(s => densityMap[s] ?? 0))
    : 0;

  const newDateSet = new Set(newDates);

  const colCount = dates.length;
  const colMinWidth = isDayMode && event.trip_duration && event.trip_duration > 1 ? 80 : 56;

  if (totalResponders === 0) {
    return (
      <div className="rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 text-center text-sm text-stone-400">
        Availability will appear here as people respond.
      </div>
    );
  }

  function renderCellOverlay(slotResponders: string[], dotSize: number) {
    if (slotResponders.length === 0) return null;
    if (n <= DOTS_THRESHOLD) {
      return (
        <div className="absolute inset-0 flex items-center justify-center flex-wrap gap-0.5 p-0.5">
          {slotResponders.map((name, di) => (
            <span
              key={di}
              className="rounded-full flex-shrink-0"
              style={{ width: dotSize, height: dotSize, backgroundColor: respondentColorMap.get(name) ?? '#888' }}
            />
          ))}
        </div>
      );
    }
    if (n <= COUNT_THRESHOLD) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 leading-none drop-shadow-sm">
            {slotResponders.length}
          </span>
        </div>
      );
    }
    return null;
  }

  function renderTooltip(slot: string, slotResponders: string[], density: number) {
    if (hovered?.slot !== slot || slotResponders.length === 0) return null;
    return (
      <HeatmapTooltip anchorRect={hovered.anchorRect}>
        {slotResponders.slice(0, TOOLTIP_MAX).map((name, ni) => (
          <div key={ni} className="flex items-center gap-1.5">
            <span className="rounded-full inline-block w-2 h-2 flex-shrink-0" style={{ backgroundColor: respondentColorMap.get(name) ?? '#888' }} />
            {isAnonymous ? `Guest ${responses.findIndex(r => r.respondent_name === name) + 1}` : name}
          </div>
        ))}
        {slotResponders.length > TOOLTIP_MAX && (
          <div className="opacity-70">+{slotResponders.length - TOOLTIP_MAX} more</div>
        )}
        <div className="text-[10px] opacity-60 mt-0.5 border-t border-white/20 dark:border-stone-900/20 pt-0.5">
          {density}/{totalResponders} free
        </div>
      </HeatmapTooltip>
    );
  }

  function cellBg(density: number): string {
    if (density === 0) return 'var(--color-stone-100)';
    if (density === 1) return 'linear-gradient(135deg, var(--color-amber-100), var(--color-stone-100))';
    if (density === 2) return 'linear-gradient(135deg, var(--color-amber-200), var(--color-amber-100))';
    return 'linear-gradient(135deg, var(--color-amber-400), var(--color-amber-200))';
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* Respondent legend */}
      {n > 0 && n < LEGEND_HIDE && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {responses.slice(0, LEGEND_MAX).map((r, i) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white font-medium"
              style={{ backgroundColor: respondentColors[i] }}
            >
              {isAnonymous ? `Guest ${i + 1}` : r.respondent_name}
            </span>
          ))}
          {n > LEGEND_MAX && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
              +{n - LEGEND_MAX} more
            </span>
          )}
        </div>
      )}

      {/* Days mode: responsive wrap */}
      {isDayMode ? (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${event.trip_duration && event.trip_duration > 1 ? 88 : 68}px, 1fr))` }}
        >
          {dates.map(date => {
            const [line1, line2] = formatDateHeaderLines(date, event.trip_duration);
            const density = densityMap[date] ?? 0;
            const isBest = bestSet.has(date) && density >= maxBestDensity && maxBestDensity > 0;
            const slotResponders = slotToResponders.get(date) ?? [];
            const isNew = newDateSet.has(date);
            return (
              <div key={date} className="flex flex-col gap-1">
                {isNew && (
                  <div className="flex justify-center">
                    <span className="text-[9px] font-semibold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full px-1.5 py-0.5 leading-none">
                      new
                    </span>
                  </div>
                )}
                <div className="text-center text-xs font-medium text-stone-500 dark:text-stone-400 leading-tight">
                  <div>{line1}</div>
                  <div>{line2}</div>
                </div>
                <div
                  className={cn('relative h-12 rounded-sm transition-colors cursor-pointer', isBest && 'animate-[bestSlotPulse_2s_ease-in-out_infinite]')}
                  style={{ background: cellBg(density) }}
                  onMouseEnter={e => handleEnter(e, date)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleSelect(date)}
                >
                  {renderCellOverlay(slotResponders, 10)}
                  {renderTooltip(date, slotResponders, density)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Times mode: scrollable grid */
        <>
          {/* Header */}
          <div
            className="grid gap-0.5 mb-0.5"
            style={{ gridTemplateColumns: `72px repeat(${colCount}, minmax(${colMinWidth}px, 1fr))` }}
          >
            <div />
            {dates.map(date => {
              const [line1, line2] = formatDateHeaderLines(date, null);
              const isNew = newDateSet.has(date);
              return (
                <div key={date} className="text-center text-xs font-medium text-stone-500 dark:text-stone-400 pb-1 leading-tight">
                  {isNew && (
                    <span className="inline-block text-[9px] font-semibold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full px-1.5 py-0.5 leading-none mb-0.5">
                      new
                    </span>
                  )}
                  <div>{line1}</div>
                  <div>{line2}</div>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {grid.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="grid gap-0.5 mb-0.5"
              style={{ gridTemplateColumns: `72px repeat(${colCount}, minmax(${colMinWidth}px, 1fr))` }}
            >
              <div className="flex items-center justify-end pr-2 text-xs text-stone-600 dark:text-stone-400 leading-none">
                {timeLabels[rowIdx]}
              </div>
              {row.map((slot, colIdx) => {
                const density = densityMap[slot] ?? 0;
                const isBest = bestSet.has(slot) && (densityMap[slot] ?? 0) >= maxBestDensity && maxBestDensity > 0;
                const slotResponders = slotToResponders.get(slot) ?? [];
                return (
                  <div
                    key={colIdx}
                    className={cn('relative rounded-sm h-7 transition-colors cursor-pointer', isBest && 'animate-[bestSlotPulse_2s_ease-in-out_infinite]')}
                    style={{ background: cellBg(density) }}
                    onMouseEnter={e => handleEnter(e, slot)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleSelect(slot)}
                  >
                    {renderCellOverlay(slotResponders, 7)}
                    {renderTooltip(slot, slotResponders, density)}
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}

      {selectedSlot && (() => {
        const available = slotToResponders.get(selectedSlot) ?? [];
        const availableSet = new Set(available);
        const notAvailable = responses
          .filter(r => !r.declined && !availableSet.has(r.respondent_name))
          .map(r => r.respondent_name);
        const declinedNames = responses.filter(r => r.declined).map(r => r.respondent_name);
        return (
          <RsvpListModal
            open
            onClose={() => setSelectedSlot(null)}
            title={formatModalTitle(selectedSlot, event)}
            available={available}
            notAvailable={notAvailable}
            declined={declinedNames}
            isAnonymous={isAnonymous}
            colorFor={name => respondentColorMap.get(name) ?? null}
            guestNumberFor={name => responses.findIndex(r => r.respondent_name === name) + 1}
          />
        );
      })()}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Event, Response, SlotDensityMap } from '@/types';
import { buildSlotKeys, formatSlotLabel, formatDateHeader } from '@/lib/availability';
import { cn } from '@/lib/utils';

interface Props {
  event: Event;
  densityMap: SlotDensityMap;
  totalResponders: number;
  bestSlots?: string[];
  responses?: Response[];
}

function respondentColor(index: number, total: number): string {
  const hue = Math.round((index * 360) / Math.max(total, 1)) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

export function HeatmapGrid({ event, densityMap, totalResponders, bestSlots = [], responses = [] }: Props) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const allSlots = buildSlotKeys(event);
  const dates = [...event.dates].sort();
  const isDayMode = event.mode === 'days';
  const bestSet = new Set(bestSlots);
  const isAnonymous = event.anonymous;

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
  const respondentColors = responses.map((_, i) => respondentColor(i, responses.length));
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

  const colCount = dates.length;

  if (totalResponders === 0) {
    return (
      <div className="rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 text-center text-sm text-stone-400">
        Availability will appear here as people respond.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* Respondent legend */}
      {responses.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {responses.map((r, i) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white font-medium"
              style={{ backgroundColor: respondentColors[i] }}
            >
              {isAnonymous ? `Guest ${i + 1}` : r.respondent_name}
            </span>
          ))}
        </div>
      )}

      {/* Header */}
      <div
        className="grid gap-0.5 mb-0.5"
        style={{ gridTemplateColumns: `72px repeat(${colCount}, minmax(52px, 1fr))` }}
      >
        <div />
        {dates.map(date => (
          <div
            key={date}
            className="text-center text-xs font-medium text-stone-500 dark:text-stone-400 pb-1 truncate"
          >
            {formatDateHeader(date)}
          </div>
        ))}
      </div>

      {/* Rows */}
      {grid.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="grid gap-0.5 mb-0.5"
          style={{ gridTemplateColumns: `72px repeat(${colCount}, minmax(52px, 1fr))` }}
        >
          <div className="flex items-center justify-end pr-2 text-xs text-stone-400 dark:text-stone-500 leading-none">
            {isDayMode ? null : timeLabels[rowIdx]}
          </div>
          {row.map((slot, colIdx) => {
            const density = densityMap[slot] ?? 0;
            const isBest = bestSet.has(slot);
            const slotResponders = slotToResponders.get(slot) ?? [];
            const isHovered = hoveredSlot === slot;

            return (
              <div
                key={colIdx}
                className={cn(
                  'relative rounded-sm transition-colors',
                  isDayMode ? 'h-12' : 'h-7',
                  density > 0 ? 'bg-stone-50 dark:bg-stone-800' : 'bg-stone-100 dark:bg-stone-800/50',
                  isBest && 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-emerald-400'
                )}
                onMouseEnter={() => setHoveredSlot(slot)}
                onMouseLeave={() => setHoveredSlot(null)}
              >
                {/* Color dots */}
                {slotResponders.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center flex-wrap gap-0.5 p-0.5">
                    {slotResponders.map((name, di) => (
                      <span
                        key={di}
                        className="rounded-full flex-shrink-0"
                        style={{
                          width: isDayMode ? 10 : 7,
                          height: isDayMode ? 10 : 7,
                          backgroundColor: respondentColorMap.get(name) ?? '#888',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Hover tooltip */}
                {isHovered && slotResponders.length > 0 && (
                  <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1.5 pointer-events-none">
                    <div className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                      {slotResponders.map((name, ni) => (
                        <div key={ni} className="flex items-center gap-1.5">
                          <span
                            className="rounded-full inline-block w-2 h-2 flex-shrink-0"
                            style={{ backgroundColor: respondentColorMap.get(name) ?? '#888' }}
                          />
                          {isAnonymous
                            ? `Guest ${responses.findIndex(r => r.respondent_name === name) + 1}`
                            : name}
                        </div>
                      ))}
                      <div className="text-[10px] opacity-60 mt-0.5 border-t border-white/20 dark:border-stone-900/20 pt-0.5">
                        {density}/{totalResponders} free
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="w-2 h-2 bg-stone-900 dark:bg-stone-100 rotate-45 mx-auto -mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

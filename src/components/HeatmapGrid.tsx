import { Event, SlotDensityMap } from '@/types';
import { buildSlotKeys, formatSlotLabel, formatDateHeader } from '@/lib/availability';
import { cn } from '@/lib/utils';

interface Props {
  event: Event;
  densityMap: SlotDensityMap;
  totalResponders: number;
  bestSlots?: string[];
}

function densityColor(density: number, total: number): string {
  if (total === 0 || density === 0) return '';
  const ratio = density / total;
  if (ratio >= 0.8) return 'bg-amber-500 dark:bg-amber-500';
  if (ratio >= 0.6) return 'bg-amber-400 dark:bg-amber-400';
  if (ratio >= 0.4) return 'bg-amber-300 dark:bg-amber-300';
  if (ratio >= 0.2) return 'bg-amber-200 dark:bg-amber-200';
  return 'bg-amber-100 dark:bg-amber-900';
}

export function HeatmapGrid({ event, densityMap, totalResponders, bestSlots = [] }: Props) {
  const allSlots = buildSlotKeys(event);
  const dates = [...event.dates].sort();
  const isDayMode = event.mode === 'days';
  const bestSet = new Set(bestSlots);

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
      {/* Legend */}
      <div className="flex items-center gap-3 mb-3 text-xs text-stone-400 dark:text-stone-500">
        <span>Availability:</span>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-stone-100 dark:bg-stone-800" />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-amber-200" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-amber-400" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-amber-500" />
          <span>All {totalResponders}</span>
        </div>
      </div>

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
            return (
              <div
                key={colIdx}
                title={density > 0 ? `${density}/${totalResponders} free` : 'No one free'}
                className={cn(
                  'rounded-sm transition-colors',
                  isDayMode ? 'h-12' : 'h-7',
                  density > 0 ? densityColor(density, totalResponders) : 'bg-stone-100 dark:bg-stone-800',
                  isBest && 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-emerald-400'
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Event } from '@/types';
import { buildSlotKeys, formatSlotLabel, formatDateHeaderLines } from '@/lib/availability';
import { cn } from '@/lib/utils';

interface Props {
  event: Event;
  selectedSlots: Set<string>;
  onSlotsChange: (slots: Set<string>) => void;
  disabled?: boolean;
}

export function AvailabilityGrid({ event, selectedSlots, onSlotsChange, disabled }: Props) {
  const allSlots = buildSlotKeys(event);
  const dates = [...event.dates].sort();

  // For 'times' mode: rows=timeSlots per day, cols=dates
  // For 'days' mode: single row, cols=dates
  const isDayMode = event.mode === 'days';

  // Build a 2D structure: timeRows x dateCols
  // Each cell is a slot key
  let timeLabels: string[] = [];
  let grid: string[][] = []; // grid[rowIndex][colIndex] = slotKey

  if (isDayMode) {
    timeLabels = ['Available'];
    grid = [dates];
  } else {
    // Extract unique time labels from slot keys (format: YYYY-MM-DDTHH:MM)
    const slotsForFirstDate = allSlots.filter(s => s.startsWith(dates[0]));
    timeLabels = slotsForFirstDate.map(s => formatSlotLabel(s, 'times'));
    grid = slotsForFirstDate.map((_, rowIdx) =>
      dates.map(date => {
        const slot = allSlots.find(s => s.startsWith(date) && s === `${date}T${slotsForFirstDate[rowIdx].split('T')[1] ?? ''}`)
          || allSlots[dates.indexOf(date) * slotsForFirstDate.length + rowIdx];
        return slot ?? '';
      })
    );
    // Rebuild properly
    grid = [];
    for (let row = 0; row < slotsForFirstDate.length; row++) {
      const gridRow: string[] = [];
      for (const date of dates) {
        // Find the matching slot for this date and time
        const timepart = slotsForFirstDate[row].slice(10); // "THH:MM"
        gridRow.push(date + timepart);
      }
      grid.push(gridRow);
    }
  }

  const isDragging = useRef(false);
  const dragAction = useRef<'add' | 'remove'>('add');
  const containerRef = useRef<HTMLDivElement>(null);

  const getSlotFromElement = (el: Element | null): string | null => {
    if (!el) return null;
    const cell = el.closest('[data-slot]');
    return cell?.getAttribute('data-slot') ?? null;
  };

  const selectedSlotsRef = useRef(selectedSlots);
  selectedSlotsRef.current = selectedSlots;

  const applySlot = useCallback(
    (slot: string) => {
      if (!slot || disabled) return;
      const next = new Set(selectedSlotsRef.current);
      if (dragAction.current === 'add') next.add(slot);
      else next.delete(slot);
      onSlotsChange(next);
    },
    [disabled, onSlotsChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      const slot = getSlotFromElement(e.target as Element);
      if (!slot) return;
      e.preventDefault();
      isDragging.current = true;
      dragAction.current = selectedSlots.has(slot) ? 'remove' : 'add';
      applySlot(slot);
    },
    [applySlot, disabled, selectedSlots]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current || disabled) return;
      const slot = getSlotFromElement(e.target as Element);
      if (slot) applySlot(slot);
    },
    [applySlot, disabled]
  );

  useEffect(() => {
    const onMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  // Touch support
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = getSlotFromElement(el);
      if (!slot) return;
      isDragging.current = true;
      dragAction.current = selectedSlots.has(slot) ? 'remove' : 'add';
      applySlot(slot);
    },
    [applySlot, disabled, selectedSlots]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current || disabled) return;
      e.preventDefault();
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = getSlotFromElement(el);
      if (slot) applySlot(slot);
    },
    [applySlot, disabled]
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const colCount = dates.length;

  return (
    <div className="w-full overflow-x-auto">
      {!disabled && (
        <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">
          Click or drag to mark when you&apos;re free
        </p>
      )}
      <div
        ref={containerRef}
        className="select-none"
        style={{ touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseEnter}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header row: date labels */}
        <div
          className="grid gap-0.5 mb-0.5"
          style={{ gridTemplateColumns: `72px repeat(${colCount}, minmax(56px, 1fr))` }}
        >
          <div /> {/* time label spacer */}
          {dates.map(date => {
            const [line1, line2] = formatDateHeaderLines(date);
            return (
              <div
                key={date}
                className="text-center text-xs font-medium text-stone-500 dark:text-stone-400 pb-1 leading-tight"
              >
                <div>{line1}</div>
                <div>{line2}</div>
              </div>
            );
          })}
        </div>

        {/* Grid rows */}
        {grid.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="grid gap-0.5 mb-0.5"
            style={{ gridTemplateColumns: `72px repeat(${colCount}, minmax(56px, 1fr))` }}
          >
            {/* Time label */}
            <div className="flex items-center justify-end pr-2 text-xs text-stone-400 dark:text-stone-500 leading-none">
              {isDayMode ? null : timeLabels[rowIdx]}
            </div>
            {/* Cells */}
            {row.map((slot, colIdx) => {
              const isSelected = selectedSlots.has(slot);
              return (
                <div
                  key={colIdx}
                  data-slot={slot}
                  className={cn(
                    'rounded-sm transition-colors duration-75 cursor-pointer',
                    isDayMode ? 'h-12' : 'h-7',
                    isSelected
                      ? 'bg-emerald-400 dark:bg-emerald-500'
                      : disabled
                      ? 'bg-stone-100 dark:bg-stone-800'
                      : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700'
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>

      {!isDayMode && (
        <div className="mt-3 flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-emerald-400" />
            <span>I&apos;m free</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-stone-200 dark:bg-stone-700" />
            <span>Busy</span>
          </div>
        </div>
      )}
    </div>
  );
}

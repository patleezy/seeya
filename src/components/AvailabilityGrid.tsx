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
  const isDayMode = event.mode === 'days';
  const tripDuration = event.trip_duration ?? null;

  let timeLabels: string[] = [];
  let grid: string[][] = [];

  if (isDayMode) {
    timeLabels = ['Available'];
    grid = [dates];
  } else {
    const slotsForFirstDate = allSlots.filter(s => s.startsWith(dates[0]));
    timeLabels = slotsForFirstDate.map(s => formatSlotLabel(s, 'times'));
    grid = [];
    for (let row = 0; row < slotsForFirstDate.length; row++) {
      const gridRow: string[] = [];
      for (const date of dates) {
        const timepart = slotsForFirstDate[row].slice(10);
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

  // Keep latest values in refs for use inside stable native event handlers
  const selectedSlotsRef = useRef(selectedSlots);
  selectedSlotsRef.current = selectedSlots;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

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
  const applySlotRef = useRef(applySlot);
  applySlotRef.current = applySlot;

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

  // Native (non-passive) touch listeners so e.preventDefault() stops synthetic mouse events
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (disabledRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = getSlotFromElement(target);
      if (!slot) return;
      isDragging.current = true;
      dragAction.current = selectedSlotsRef.current.has(slot) ? 'remove' : 'add';
      applySlotRef.current(slot);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || disabledRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = getSlotFromElement(target);
      if (slot) applySlotRef.current(slot);
    };

    const onTouchEnd = () => { isDragging.current = false; };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []); // stable — all mutable state accessed via refs

  const colCount = dates.length;
  const colMinWidth = tripDuration && tripDuration > 1 ? 80 : 56;

  return (
    <div className="w-full">
      {!disabled && (
        <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">
          Click or drag to mark when you&apos;re free
        </p>
      )}

      {/* Days mode: responsive wrap — no horizontal scroll */}
      {isDayMode ? (
        <div
          ref={containerRef}
          className="select-none grid gap-2"
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${tripDuration && tripDuration > 1 ? 88 : 68}px, 1fr))` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseEnter}
        >
          {dates.map(date => {
            const [line1, line2] = formatDateHeaderLines(date, tripDuration);
            const isSelected = selectedSlots.has(date);
            return (
              <div
                key={date}
                className="flex flex-col gap-1"
              >
                <div className="text-center text-xs font-medium text-stone-500 dark:text-stone-400 leading-tight">
                  <div>{line1}</div>
                  <div>{line2}</div>
                </div>
                <div
                  data-slot={date}
                  className={cn(
                    'h-12 rounded-sm transition-colors duration-75',
                    isSelected
                      ? 'bg-emerald-400 dark:bg-emerald-500'
                      : disabled
                      ? 'bg-stone-100 dark:bg-stone-800'
                      : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 cursor-pointer'
                  )}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* Times mode: scrollable grid */
        <div className="overflow-x-auto">
          <div
            ref={containerRef}
            className="select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseEnter}
          >
            {/* Header row */}
            <div
              className="grid gap-0.5 mb-0.5"
              style={{ gridTemplateColumns: `72px repeat(${colCount}, minmax(${colMinWidth}px, 1fr))` }}
            >
              <div />
              {dates.map(date => {
                const [line1, line2] = formatDateHeaderLines(date, null);
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
                style={{ gridTemplateColumns: `72px repeat(${colCount}, minmax(${colMinWidth}px, 1fr))` }}
              >
                <div className="flex items-center justify-end pr-2 text-xs text-stone-400 dark:text-stone-500 leading-none">
                  {timeLabels[rowIdx]}
                </div>
                {row.map((slot, colIdx) => {
                  const isSelected = selectedSlots.has(slot);
                  return (
                    <div
                      key={colIdx}
                      data-slot={slot}
                      className={cn(
                        'rounded-sm transition-colors duration-75 cursor-pointer h-7',
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
        </div>
      )}

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

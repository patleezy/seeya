import { Event, Response, SlotDensityMap, EventMode } from '@/types';
import { format, addMinutes, parseISO } from 'date-fns';

export function buildSlotKeys(event: Event): string[] {
  if (event.mode === 'days') {
    return [...event.dates].sort();
  }
  const slots: string[] = [];
  const duration = event.slot_duration ?? 30;
  for (const date of [...event.dates].sort()) {
    const [startH, startM] = (event.time_start ?? '09:00').split(':').map(Number);
    const [endH, endM] = (event.time_end ?? '17:00').split(':').map(Number);
    let current = new Date(date + 'T00:00:00');
    current.setHours(startH, startM, 0, 0);
    const end = new Date(date + 'T00:00:00');
    end.setHours(endH, endM, 0, 0);
    while (current < end) {
      slots.push(format(current, "yyyy-MM-dd'T'HH:mm"));
      current = addMinutes(current, duration);
    }
  }
  return slots;
}

export function buildDensityMap(responses: Response[]): SlotDensityMap {
  const map: SlotDensityMap = {};
  for (const r of responses) {
    for (const slot of r.availability) {
      map[slot] = (map[slot] ?? 0) + 1;
    }
  }
  return map;
}

interface SlotBlock {
  slots: string[];
  avgDensity: number;
  minDensity: number;
}

export function findBestSlots(
  allSlotKeys: string[],
  densityMap: SlotDensityMap,
  totalResponders: number
): { bestSlots: string[]; isUnambiguous: boolean; topBlocks: SlotBlock[] } {
  if (totalResponders === 0 || allSlotKeys.length === 0) {
    return { bestSlots: [], isUnambiguous: false, topBlocks: [] };
  }

  // Group into contiguous blocks (slots that are adjacent)
  const blocks: SlotBlock[] = [];
  let current: string[] = [];

  for (let i = 0; i < allSlotKeys.length; i++) {
    const slot = allSlotKeys[i];
    const density = densityMap[slot] ?? 0;
    if (density > 0) {
      current.push(slot);
    } else {
      if (current.length > 0) {
        blocks.push(makeBlock(current, densityMap));
        current = [];
      }
    }
  }
  if (current.length > 0) blocks.push(makeBlock(current, densityMap));

  if (blocks.length === 0) return { bestSlots: [], isUnambiguous: false, topBlocks: [] };

  // Score: prefer high min density (everyone free) + longer blocks
  blocks.sort((a, b) => {
    const scoreA = a.minDensity * 10 + a.avgDensity + a.slots.length * 0.5;
    const scoreB = b.minDensity * 10 + b.avgDensity + b.slots.length * 0.5;
    return scoreB - scoreA;
  });

  const top = blocks[0];
  const second = blocks[1];

  const topAttendance = top.minDensity / totalResponders;
  const scoreDiff = second
    ? (top.minDensity - second.minDensity) / totalResponders
    : 1;

  const isUnambiguous = topAttendance >= 0.8 && scoreDiff >= 0.2;

  // Return up to 4 slots from the best block
  const bestSlots = top.slots.slice(0, 4);

  return { bestSlots, isUnambiguous, topBlocks: blocks.slice(0, 3) };
}

function makeBlock(slots: string[], densityMap: SlotDensityMap): SlotBlock {
  const densities = slots.map(s => densityMap[s] ?? 0);
  const avg = densities.reduce((a, b) => a + b, 0) / densities.length;
  return { slots, avgDensity: avg, minDensity: Math.min(...densities) };
}

export function formatSlotLabel(slot: string, mode: EventMode): string {
  if (mode === 'days') {
    return format(parseISO(slot), 'EEE, MMM d');
  }
  return format(parseISO(slot), 'h:mm a');
}

export function formatDateHeader(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE MMM d');
}

export function formatDateHeaderLines(dateStr: string): [string, string] {
  const date = parseISO(dateStr);
  return [format(date, 'EEE'), format(date, 'M/d')];
}

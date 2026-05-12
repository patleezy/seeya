import { GoogleGenerativeAI } from '@google/generative-ai';
import { Event, Response, SlotDensityMap } from '@/types';
import { format, parseISO } from 'date-fns';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getAiRecommendation(
  event: Event,
  responses: Response[],
  densityMap: SlotDensityMap,
  topSlots: string[]
): Promise<{ recommendation: string; best_slots: string[] }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const formatSlot = (slot: string) => {
    if (event.mode === 'days') return format(parseISO(slot), 'EEE, MMM d');
    return format(parseISO(slot), "EEE, MMM d 'at' h:mm a");
  };

  const topSlotsWithCount = topSlots
    .slice(0, 10)
    .map(s => `  ${formatSlot(s)} — ${densityMap[s] ?? 0} of ${responses.length} people free`)
    .join('\n');

  const prompt = `You're helping a group find the best time for a ${event.type} called "${event.name}".
${event.description ? `Description: ${event.description}` : ''}
Organized by: ${event.creator_name}
${responses.length} ${responses.length === 1 ? 'person has' : 'people have'} responded.

Here are the best time slots ranked by how many people are free:
${topSlotsWithCount}

Write 2–3 friendly, warm, casual sentences recommending the best time for this ${event.type}.
Be specific about the day and time. If everyone is free, celebrate it! If there's a trade-off, acknowledge it gently.
Keep it conversational — not corporate.

Then on its own line write exactly:
BEST_SLOTS: ${JSON.stringify(topSlots.slice(0, 4))}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Parse out the BEST_SLOTS line
  const lines = text.split('\n');
  const bestSlotsLine = lines.find(l => l.trim().startsWith('BEST_SLOTS:'));
  let best_slots: string[] = topSlots.slice(0, 4);
  if (bestSlotsLine) {
    try {
      const json = bestSlotsLine.replace('BEST_SLOTS:', '').trim();
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) best_slots = parsed;
    } catch {}
  }

  const recommendation = lines
    .filter(l => !l.trim().startsWith('BEST_SLOTS:'))
    .join('\n')
    .trim();

  return { recommendation, best_slots };
}

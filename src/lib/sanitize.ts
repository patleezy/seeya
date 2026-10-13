import { Event, Response } from '@/types';

// Strip host-only and private fields before data leaves the server.
// Anything rendered by a client component or returned from a public API route
// must pass through these — props are serialized into the page payload.

export type PublicEvent = Omit<Event, 'host_token'> & { host_token: '' };

export function toPublicEvent(event: Event): PublicEvent {
  return { ...event, host_token: '' };
}

/**
 * Removes emails from every response. When the event is anonymous, also replaces
 * names with "Guest N" (by submission order) so real names never reach guests.
 */
export function toPublicResponses(responses: Response[], anonymous: boolean): Response[] {
  return responses.map((r, i) => ({
    ...r,
    email: null,
    respondent_name: anonymous ? `Guest ${i + 1}` : r.respondent_name,
  }));
}

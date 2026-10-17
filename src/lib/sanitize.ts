import { Event, Response } from '@/types';

// Strip host-only and private fields before data leaves the server.
// Anything rendered by a client component or returned from a public API route
// must pass through these — props are serialized into the page payload.

export type PublicEvent = Omit<Event, 'host_token'> & { host_token: '' };

export function toPublicEvent(event: Event): PublicEvent {
  return { ...event, host_token: '' };
}

/**
 * Non-anonymous events: names and emails are visible to everyone with the link
 * (respondents are told this on the form). Anonymous events: emails are removed
 * and names become "Guest N" (by submission order).
 */
export function toPublicResponses(responses: Response[], anonymous: boolean): Response[] {
  if (!anonymous) return responses;
  return responses.map((r, i) => ({
    ...r,
    email: null,
    respondent_name: `Guest ${i + 1}`,
    comment: null,
  }));
}

export interface PublicComment {
  name: string;
  comment: string;
}

/**
 * Comments always show the commenter's real name (they chose to post it).
 * Shuffled and stripped of ids so, on anonymous events, a comment can't be
 * matched to a "Guest N" by position.
 */
export function toPublicComments(responses: Response[]): PublicComment[] {
  const comments = responses
    .filter(r => r.comment)
    .map(r => ({ name: r.respondent_name, comment: r.comment as string }));
  for (let i = comments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [comments[i], comments[j]] = [comments[j], comments[i]];
  }
  return comments;
}

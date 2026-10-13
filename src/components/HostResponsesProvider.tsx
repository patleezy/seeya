'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Response } from '@/types';

interface Value {
  responses: Response[];
  isHost: boolean;
}

const HostResponsesContext = createContext<Value | null>(null);

/**
 * Holds the response list for the results page. Everyone starts with the
 * server-sanitized list (no emails; "Guest N" names when anonymous). If this
 * browser holds the host token, the full list is fetched from the host-only API.
 */
export function HostResponsesProvider({
  eventId,
  publicResponses,
  children,
}: {
  eventId: string;
  publicResponses: Response[];
  children: ReactNode;
}) {
  const [hostResponses, setHostResponses] = useState<Response[] | null>(null);
  const [isHost, setIsHost] = useState(false);

  // Re-runs whenever router.refresh() hands down a new public list
  useEffect(() => {
    const token = sessionStorage.getItem(`host_token_${eventId}`);
    if (!token) return;
    let cancelled = false;
    fetch(`/api/events/${eventId}/host-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host_token: token }),
      cache: 'no-store',
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        // Only treat this browser as host once the server accepts the token
        if (!cancelled && data?.responses) {
          setHostResponses(data.responses);
          setIsHost(true);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [eventId, publicResponses]);

  const responses = hostResponses ?? publicResponses;
  return (
    <HostResponsesContext.Provider value={{ responses, isHost }}>
      {children}
    </HostResponsesContext.Provider>
  );
}

export function useEventResponses(): Value {
  const ctx = useContext(HostResponsesContext);
  if (!ctx) throw new Error('useEventResponses must be used inside HostResponsesProvider');
  return ctx;
}

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Props {
  eventId: string;
}

export function HostTokenStore({ eventId }: Props) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('t');
    if (token) {
      sessionStorage.setItem(`host_token_${eventId}`, token);
    }
  }, [eventId, searchParams]);

  return null;
}

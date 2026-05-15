'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  eventId: string;
}

export function ResponseCTA({ eventId }: Props) {
  const [respondentName, setRespondentName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`seeya_responded_${eventId}`);
      if (stored) {
        const { respondentName: name } = JSON.parse(stored);
        setRespondentName(name ?? null);
      }
    } catch {}
  }, [eventId]);

  return (
    <div className="flex gap-3">
      <Link href={`/event/${eventId}`} className="flex-1">
        <Button variant="outline" className="w-full rounded-2xl">
          {respondentName
            ? `Update your response (${respondentName}) →`
            : 'Add your availability →'}
        </Button>
      </Link>
    </div>
  );
}

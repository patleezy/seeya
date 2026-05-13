'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  intervalMs?: number;
}

export function ResultsAutoRefresh({ intervalMs = 30000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}

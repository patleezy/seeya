'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Response } from '@/types';

interface Props {
  eventId: string;
  initialResponses: Response[];
  showNames: boolean;
}

export function RespondentManager({ eventId, initialResponses, showNames }: Props) {
  const router = useRouter();
  const [isHost, setIsHost] = useState(false);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [responses, setResponses] = useState(initialResponses);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(`host_token_${eventId}`);
    if (token) {
      setIsHost(true);
      setHostToken(token);
    }
  }, [eventId]);

  if (!showNames && !isHost) return null;
  if (responses.length === 0) return null;

  async function handleDelete(responseId: string) {
    setDeleting(responseId);
    try {
      const res = await fetch(`/api/events/${eventId}/responses/${responseId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_token: hostToken }),
      });
      if (res.ok) {
        setResponses(prev => prev.filter(r => r.id !== responseId));
        setConfirming(null);
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {responses.map(r => (
        <div key={r.id} className="flex items-center gap-0.5 group">
          <span className="inline-flex items-center rounded-full bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 text-xs text-stone-600 dark:text-stone-400">
            {r.respondent_name}
            {r.declined && (
              <span className="ml-1 text-stone-400 dark:text-stone-500 text-[10px]">can't make it</span>
            )}
          </span>
          {isHost && (
            confirming === r.id ? (
              <span className="flex items-center gap-0.5 text-xs">
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deleting === r.id}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-1 transition-colors disabled:opacity-50"
                >
                  {deleting === r.id ? '…' : 'remove'}
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 px-1 transition-colors"
                >
                  cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirming(r.id)}
                className="text-stone-300 dark:text-stone-600 hover:text-red-400 dark:hover:text-red-400 transition-colors p-0.5 opacity-0 group-hover:opacity-100"
                title={`Remove ${r.respondent_name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )
          )}
        </div>
      ))}
    </div>
  );
}

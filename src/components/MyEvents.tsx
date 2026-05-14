'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, ExternalLink } from 'lucide-react';

interface SavedEvent {
  id: string;
  name: string;
  host_token: string;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function MyEvents() {
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('seeya_my_events') ?? '[]') as SavedEvent[];
      setEvents(saved);
    } catch {}
  }, []);

  if (events.length === 0) return null;

  async function handleDelete(ev: SavedEvent) {
    setDeleting(ev.id);
    try {
      const res = await fetch(`/api/events/${ev.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_token: ev.host_token }),
      });
      if (res.ok || res.status === 404) {
        const updated = events.filter(e => e.id !== ev.id);
        setEvents(updated);
        try {
          localStorage.setItem('seeya_my_events', JSON.stringify(updated));
        } catch {}
      }
    } catch {}
    setDeleting(null);
    setConfirmDelete(null);
  }

  return (
    <div className="mt-6 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
        Your events
      </p>
      <ul className="space-y-2">
        {events.map(ev => (
          <li
            key={ev.id}
            className="flex items-center gap-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-950/60 px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate">
                {ev.name}
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                {timeAgo(ev.created_at)}
              </p>
            </div>

            <Link
              href={`/event/${ev.id}`}
              className="shrink-0 flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
            >
              View <ExternalLink className="h-3 w-3" />
            </Link>

            {confirmDelete === ev.id ? (
              <span className="shrink-0 flex items-center gap-1.5">
                <button
                  onClick={() => handleDelete(ev)}
                  disabled={deleting === ev.id}
                  className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting === ev.id ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(ev.id)}
                className="shrink-0 text-stone-300 hover:text-red-400 dark:text-stone-600 dark:hover:text-red-500 transition-colors"
                aria-label="Delete event"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

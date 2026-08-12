'use client';

import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  available: string[];
  notAvailable: string[];
  declined: string[];
  isAnonymous: boolean;
  colorFor: (name: string) => string | null;
  guestNumberFor: (name: string) => number;
}

function NameRow({ name, dotColor, isAnonymous, guestNumber }: { name: string; dotColor: string | null; isAnonymous: boolean; guestNumber: number }) {
  return (
    <div className="flex items-center gap-2 py-1 text-sm text-stone-700 dark:text-stone-300">
      <span
        className="rounded-full inline-block w-2 h-2 flex-shrink-0"
        style={{ backgroundColor: dotColor ?? 'var(--color-stone-300)' }}
      />
      {isAnonymous ? `Guest ${guestNumber}` : name}
    </div>
  );
}

export function RsvpListModal({ open, onClose, title, available, notAvailable, declined, isAnonymous, colorFor, guestNumberFor }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-md bg-[var(--bg-card)] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">{title}</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Available ({available.length})
            </p>
            {available.length > 0 ? (
              available.map(name => (
                <NameRow key={name} name={name} dotColor={colorFor(name)} isAnonymous={isAnonymous} guestNumber={guestNumberFor(name)} />
              ))
            ) : (
              <p className="text-sm text-stone-400 dark:text-stone-500 py-1">Nobody yet</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Not available ({notAvailable.length})
            </p>
            {notAvailable.length > 0 ? (
              notAvailable.map(name => (
                <NameRow key={name} name={name} dotColor={null} isAnonymous={isAnonymous} guestNumber={guestNumberFor(name)} />
              ))
            ) : (
              <p className="text-sm text-stone-400 dark:text-stone-500 py-1">Nobody</p>
            )}
          </div>

          {declined.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Declined ({declined.length})
              </p>
              {declined.map(name => (
                <NameRow key={name} name={name} dotColor={null} isAnonymous={isAnonymous} guestNumber={guestNumberFor(name)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

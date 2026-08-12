'use client';

import { useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  recipients: string[];
  subject: string;
  body: string;
  mailtoUrl: string;
}

export function EmailInvitesModal({ open, onClose, recipients, subject, body, mailtoUrl }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = `To: ${recipients.join(', ')}\nSubject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-lg bg-[var(--bg-card)] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">Email invites</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-stone-400 dark:text-stone-500">
            If clicking &quot;Open in email app&quot; doesn&apos;t do anything, your browser may not have a default mail
            client set up — copy the details below and paste them into whatever you use instead.
          </p>

          <div className="space-y-1">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              To ({recipients.length})
            </p>
            <p className="text-sm text-stone-700 dark:text-stone-300 rounded-xl bg-[var(--bg-input)] px-3 py-2 break-words">
              {recipients.join(', ')}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Subject</p>
            <p className="text-sm text-stone-700 dark:text-stone-300 rounded-xl bg-[var(--bg-input)] px-3 py-2 break-words">
              {subject}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Message</p>
            <pre className="text-sm text-stone-700 dark:text-stone-300 rounded-xl bg-[var(--bg-input)] px-3 py-2 whitespace-pre-wrap break-words font-sans max-h-48 overflow-y-auto">
              {body}
            </pre>
          </div>

          <div className="flex gap-2 pt-1 pb-1">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy details'}
            </Button>
            <a href={mailtoUrl} className="flex-1">
              <Button className="w-full gap-1.5 bg-stone-900 hover:bg-stone-700 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900">
                <ExternalLink className="h-4 w-4" />
                Open in email app
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

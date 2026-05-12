'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ShareLinkBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-700 dark:bg-stone-900">
      <input
        readOnly
        value={url}
        className="flex-1 bg-transparent text-sm text-stone-600 dark:text-stone-400 outline-none truncate px-2"
        onClick={e => (e.target as HTMLInputElement).select()}
      />
      <Button
        size="sm"
        onClick={handleCopy}
        className={cn(
          'shrink-0 gap-1.5',
          copied && 'bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-600'
        )}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </Button>
    </div>
  );
}

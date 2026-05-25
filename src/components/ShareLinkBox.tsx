'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function copyToClipboard(text: string): boolean {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    return true;
  }
  return fallbackCopy(text);
}

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function ShareLinkBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'w-full text-left flex items-center gap-3 rounded-xl border-2 p-3',
        copied
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 scale-[1.02] shadow-[0_0_0_4px_rgba(16,185,129,0.1)]'
          : 'border-stone-200 bg-stone-50 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-600'
      )}
      style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      <span className="flex-1 text-sm text-stone-600 dark:text-stone-400 break-all font-mono leading-relaxed">
        {url}
      </span>
      <span
        className={cn(
          'shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
          copied
            ? 'bg-emerald-500 text-white'
            : 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
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
      </span>
    </button>
  );
}

import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:placeholder:text-stone-500 transition-all',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

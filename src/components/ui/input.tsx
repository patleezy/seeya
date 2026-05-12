import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:placeholder:text-stone-500 dark:focus-visible:ring-stone-600 transition-all',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

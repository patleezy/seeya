import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-xl border-2 border-transparent bg-[var(--bg-input)] px-4 py-3.5 text-base text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:border-amber-400 focus-visible:bg-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-50 dark:text-stone-50 dark:placeholder:text-stone-500 transition-all duration-200',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

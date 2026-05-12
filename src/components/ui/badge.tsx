import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'success' | 'amber';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900': variant === 'default',
          'border border-stone-300 text-stone-700 dark:border-stone-700 dark:text-stone-300': variant === 'outline',
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200': variant === 'success',
          'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200': variant === 'amber',
        },
        className
      )}
      {...props}
    />
  );
}

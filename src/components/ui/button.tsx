import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          {
            'bg-stone-900 text-stone-50 hover:bg-stone-700 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200 focus-visible:ring-stone-900':
              variant === 'default',
            'border border-stone-300 bg-transparent text-stone-900 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-50 dark:hover:bg-stone-800':
              variant === 'outline',
            'bg-transparent text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800':
              variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600':
              variant === 'destructive',
          },
          {
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

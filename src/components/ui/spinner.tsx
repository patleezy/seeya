import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-stone-300 border-t-stone-700 dark:border-stone-700 dark:border-t-stone-300 h-5 w-5',
        className
      )}
    />
  );
}

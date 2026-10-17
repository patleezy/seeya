import type { PublicComment } from '@/lib/sanitize';

export function ResponseComments({ comments }: { comments: PublicComment[] }) {
  if (comments.length === 0) return null;

  return (
    <div className="space-y-2">
      {comments.map((c, i) => (
        <div key={i} className="text-sm text-stone-500 dark:text-stone-400">
          <span className="font-medium text-stone-700 dark:text-stone-300">{c.name}:</span>{' '}
          {c.comment}
        </div>
      ))}
    </div>
  );
}

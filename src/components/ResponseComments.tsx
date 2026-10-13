'use client';

import { useEventResponses } from '@/components/HostResponsesProvider';

export function ResponseComments() {
  const { responses } = useEventResponses();
  const withComments = responses.filter(r => r.comment);
  if (withComments.length === 0) return null;

  return (
    <div className="space-y-2">
      {withComments.map(r => (
        <div key={r.id} className="text-sm text-stone-500 dark:text-stone-400">
          <span className="font-medium text-stone-700 dark:text-stone-300">{r.respondent_name}:</span>{' '}
          {r.comment}
        </div>
      ))}
    </div>
  );
}

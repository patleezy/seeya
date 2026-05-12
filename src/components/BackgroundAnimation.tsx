'use client';

export function BackgroundAnimation() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      {/* Blob 1 - amber/warm */}
      <div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-200 opacity-40 blur-3xl dark:bg-indigo-900 dark:opacity-30"
        style={{ animation: 'blob 20s ease-in-out infinite alternate' }}
      />
      {/* Blob 2 - emerald */}
      <div
        className="absolute top-1/3 -right-40 h-80 w-80 rounded-full bg-emerald-200 opacity-35 blur-3xl dark:bg-emerald-950 dark:opacity-40"
        style={{ animation: 'blob 25s ease-in-out infinite alternate-reverse' }}
      />
      {/* Blob 3 - rose */}
      <div
        className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-rose-100 opacity-40 blur-3xl dark:bg-violet-950 dark:opacity-30"
        style={{ animation: 'blob 28s ease-in-out infinite alternate' }}
      />
      {/* Blob 4 - extra depth */}
      <div
        className="absolute top-1/2 left-1/4 h-64 w-64 rounded-full bg-amber-100 opacity-25 blur-3xl dark:bg-blue-950 dark:opacity-20"
        style={{ animation: 'blob 22s ease-in-out 4s infinite alternate-reverse' }}
      />
    </div>
  );
}

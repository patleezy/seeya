'use client';

export function BackgroundAnimation() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute h-[200%] w-[200%] opacity-[0.06] dark:opacity-[0.04]"
        style={{
          background: 'radial-gradient(ellipse 800px 600px at 20% 30%, var(--color-amber-400) 0%, transparent 50%)',
          animation: 'wave1 25s ease-in-out infinite',
        }}
      />
      <div
        className="absolute h-[200%] w-[200%] opacity-[0.06] dark:opacity-[0.04]"
        style={{
          background: 'radial-gradient(ellipse 700px 700px at 80% 70%, var(--color-emerald-400) 0%, transparent 50%)',
          animation: 'wave2 30s ease-in-out infinite',
        }}
      />
      <div
        className="absolute h-[200%] w-[200%] opacity-[0.06] dark:opacity-[0.04]"
        style={{
          background: 'radial-gradient(ellipse 600px 500px at 50% 50%, var(--color-amber-500) 0%, transparent 50%)',
          animation: 'wave3 35s ease-in-out infinite',
        }}
      />
    </div>
  );
}

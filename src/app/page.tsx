import { AnimatedEventType } from '@/components/AnimatedEventType';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { CreateEventForm } from '@/components/CreateEventForm';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[var(--background)]">
      <BackgroundAnimation />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          seeya
        </span>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-lg px-6 pb-24 pt-10">
        <div className="mb-10 space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
            find a time for your{' '}
            <AnimatedEventType />
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-base leading-relaxed">
            Share a link. Everyone picks their times.{' '}
            <span className="text-stone-700 dark:text-stone-300 font-medium">AI finds the sweet spot.</span>
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-950/80 backdrop-blur-sm p-6 shadow-sm">
          <CreateEventForm />
        </div>
      </main>
    </div>
  );
}

import { AnimatedEventType } from '@/components/AnimatedEventType';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { CreateEventForm } from '@/components/CreateEventForm';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] flex flex-col">
      <BackgroundAnimation />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          seeya
        </span>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto w-full max-w-lg px-6 pb-12 pt-10 flex-1">
        <div className="mb-10 space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
            find a time for your
            <span className="block">
              <AnimatedEventType />
            </span>
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-base leading-relaxed">
            The easiest way to schedule anything. Create an event, share a link to collect availability, and let{' '}
            <span className="text-stone-800 dark:text-stone-200 font-medium">Seeya</span>{' '}
            pick the winner.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-950/80 backdrop-blur-sm p-6 shadow-sm">
          <CreateEventForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-xs text-stone-400 dark:text-stone-600">
          © seeya ·{' '}
          <a href="/privacy" className="underline underline-offset-2 hover:text-stone-600 dark:hover:text-stone-400 transition-colors">
            Privacy Policy
          </a>
        </p>
      </footer>
    </div>
  );
}

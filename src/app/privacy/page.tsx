import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-900">
        <Link href="/">
          <img src="/logo-full-light.svg" alt="seeya" className="h-8 dark:hidden" />
          <img src="/logo-full-dark.svg" alt="seeya" className="h-8 hidden dark:block" />
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">Privacy Policy</h1>
          <p className="mt-2 text-sm text-stone-400 dark:text-stone-500">Effective May 2026</p>
        </div>

        <div className="space-y-6 text-stone-600 dark:text-stone-400 text-base leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">What we collect</h2>
            <p>
              When you create an event, we store the event name, an optional description, and your name as the organizer.
              When someone responds to an event, we store their name and the time slots they selected.
              Respondents may optionally provide an email address — this is used solely to pre-populate calendar invites
              (Apple Calendar / Google Calendar) and is never used for marketing or shared with third parties.
              No passwords or accounts are required.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">What we don&apos;t collect</h2>
            <p>
              We do not use tracking cookies, advertising pixels, or analytics SDKs. We do not sell or share your data with third parties.
              We do not require an account, password, or any contact information to use Seeya.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">Where data is stored</h2>
            <p>
              Event and response data is stored in Supabase, a hosted database provider. Data may be stored in the United States.
              AI recommendations are generated using the Google Gemini API — the availability data sent to Gemini is not retained by Google beyond the request.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">Shareable links</h2>
            <p>
              Events are identified by a random UUID in the URL. Anyone with that link can view the event and submit a response.
              There is no access control — treat the link as semi-public and don&apos;t include sensitive information in event descriptions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">Data retention</h2>
            <p>
              Event data (event details and participant responses) is retained for 90 days after the last response.
              After that, events and all associated data are automatically deleted.
              If you&apos;d like an event or response deleted sooner, email us and we&apos;ll take care of it promptly.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100">Contact</h2>
            <p>
              Questions about this policy? Reach out at{' '}
              <a href="mailto:hello@seeyasoon.digital" className="text-stone-900 dark:text-stone-100 underline underline-offset-2">
                hello@seeyasoon.digital
              </a>
            </p>
          </section>
        </div>

        <div className="pt-4 border-t border-stone-100 dark:border-stone-900">
          <Link href="/" className="text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            ← Back to seeya
          </Link>
        </div>
      </main>
    </div>
  );
}

@AGENTS.md

# seeya — Codebase Guide

## What this project is

A scheduling coordination app. Users create events, share a link, participants drag to mark availability, and an algorithm (+ Gemini 2.5 Flash for ambiguous cases) recommends the best time.

## Stack

- **Next.js 16** App Router — uses the newer `params: Promise<{...}>` pattern for page/route params (must `await params`)
- **Tailwind CSS v4** — CSS-first config in `src/app/globals.css` using `@theme {}`. No `tailwind.config.ts`. Custom keyframes and dark mode variant defined in CSS.
- **Dark mode** — class-based via `next-themes`. The `@variant dark` rule in globals.css makes `dark:` Tailwind classes work.
- **Supabase** — Postgres backend. `createSupabaseAdminClient()` for API routes (service role, bypasses RLS). `createSupabaseServerClient()` for RSC reads (anon key, respects RLS).
- **Gemini 2.5 Flash** — used only when the algorithm can't find a clear winner. See `src/lib/gemini.ts`.

## Key conventions

- Slot keys are plain strings: `"YYYY-MM-DD"` for days mode, `"YYYY-MM-DDTHH:MM"` for times mode. No timezone conversion — all times are local/display relative.
- All slot math lives in `src/lib/availability.ts` — `buildSlotKeys`, `buildDensityMap`, `findBestSlots`. Keep this file pure (no DB, no API calls).
- AI recommendations are cached in the `ai_recommendations` table and invalidated automatically when a new response is submitted.
- No auth — events are public by UUID slug. Service role key must never be used client-side.

## Environment variables required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # server-only
GEMINI_API_KEY              # server-only
NEXT_PUBLIC_APP_URL
```

## Running locally

```bash
npm install
cp .env.example .env.local  # fill in real values
# run schema.sql in Supabase dashboard SQL editor
npm run dev
```

## Database

Schema is at `supabase/schema.sql`. Run it once in the Supabase SQL editor. Three tables: `events`, `responses`, `ai_recommendations`.

## Common tasks

**Add a new event type** — update the `check` constraint in `supabase/schema.sql`, the `EventType` union in `src/types/index.ts`, and the `EVENT_TYPE_OPTIONS` array in `src/components/CreateEventForm.tsx`.

**Change the AI prompt** — edit `src/lib/gemini.ts`. The prompt ends with a `BEST_SLOTS: [...]` line that is parsed out of the response — keep that format.

**Adjust the "clear winner" threshold** — in `src/lib/availability.ts`, `findBestSlots` returns `isUnambiguous: true` when the top block has ≥80% attendance and is ≥20% ahead of the second best. Adjust those constants to control how often Gemini is called.

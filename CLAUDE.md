@AGENTS.md

# seeya — Codebase Guide

## What this project is

A scheduling coordination app. Users create events, share a link, participants drag to mark availability, and an algorithm (+ Gemini 2.5 Flash for ambiguous cases) recommends the best time. The creator can then finalize a time, which triggers a confirmation banner with calendar export for all viewers.

## Stack

- **Next.js 16** App Router — uses the newer `params: Promise<{...}>` pattern for page/route params (must `await params`)
- **Tailwind CSS v4** — CSS-first config in `src/app/globals.css` using `@theme {}`. No `tailwind.config.ts`. Custom keyframes and dark mode variant defined in CSS.
- **Dark mode** — class-based via `next-themes`. The `@variant dark` rule in globals.css makes `dark:` Tailwind classes work.
- **Supabase** — Postgres backend. `createSupabaseAdminClient()` for API routes (service role, bypasses RLS). `createSupabaseServerClient()` for RSC reads (anon key, respects RLS).
- **Gemini 2.5 Flash** — used only when the algorithm can't find a clear winner. See `src/lib/gemini.ts`.

## Key conventions

- Slot keys are plain strings: `"YYYY-MM-DD"` for days mode, `"YYYY-MM-DDTHH:MM"` for times mode. No timezone conversion — all times are local/display relative.
- All slot math lives in `src/lib/availability.ts` — `buildSlotKeys`, `buildDensityMap`, `findBestSlots`, `formatDateHeaderLines`. Keep this file pure (no DB, no API calls).
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

Key `events` columns beyond the basics: `host_token uuid`, `finalized_slot text`, `finalized_at timestamptz`, `location text`, `timezone text`, `anonymous boolean`, `max_responses int`, `response_deadline timestamptz`, `trip_duration int`.

Key `responses` columns beyond the basics: `email text` (optional, used for email invites), `comment text` (optional, shown on results page), `declined boolean` (true when respondent submitted "none of these work for me").

## Common tasks

**Add a new event type** — update the `check` constraint in `supabase/schema.sql`, the `EventType` union in `src/types/index.ts`, and the `EVENT_TYPE_OPTIONS` array in `src/components/CreateEventForm.tsx`.

**Change the AI prompt** — edit `src/lib/gemini.ts`. The prompt ends with a `BEST_SLOTS: [...]` line that is parsed out of the response — keep that format.

**Adjust the "clear winner" threshold** — in `src/lib/availability.ts`, `findBestSlots` returns `isUnambiguous: true` when the top block has ≥80% attendance and is ≥20% ahead of the second best. Adjust those constants to control how often Gemini is called.

## Key patterns

### Host token / no-auth host identity

The creator's identity is tracked via a `host_token uuid` column on events. Flow:

1. `POST /api/events` returns `{ id, host_token }`
2. Client redirects to `/event/[id]?created=true&t=[host_token]`
3. `HostTokenStore.tsx` (client component using `useSearchParams`) reads `?t=` and writes `sessionStorage.setItem('host_token_[id]', token)`
4. `AiRecommendationCard`, `FinalizeButton`, and `FinalizedBanner` check sessionStorage in `useEffect` to decide whether to render host-only UI
5. Finalize API routes validate the token server-side against the DB — 403 if mismatch

### Native touch events (non-passive)

React's synthetic `onTouchStart` registers the listener as passive, so `e.preventDefault()` is silently ignored — this means the grid scrolls instead of painting on mobile.

Fix in `AvailabilityGrid.tsx`: use `useEffect` + native `el.addEventListener('touchstart', handler, { passive: false })`. All mutable state accessed inside these stable handlers via refs (`applySlotRef`, `selectedSlotsRef`, `disabledRef`) — never close over state directly.

### Trip duration (multi-day blocks)

- `event.dates` contains **start dates** of multi-day blocks, not individual days
- `event.trip_duration` is the block length in days
- `formatDateHeaderLines(date, tripDuration)` in `src/lib/availability.ts` returns a two-line `["Sat 5/22", "–Sun 5/23"]` header for trip mode
- Calendar export end date = `addDays(startDate, trip_duration)` from date-fns

### iCal RFC 5545 formatting

- Lines longer than 75 octets must fold: CRLF followed by a single space. See `foldLine()` in `CalendarExport.tsx`.
- Description newlines: join parts with `'\n'` (actual newline char, 0x0A), then let `escapeIcs()` convert to `\n` ICS escape. Do **not** pre-join with `'\\n'` — `escapeIcs` will double-escape the backslash.

### CSS grid for equal cell sizing

Use `repeat(auto-fill, minmax(68px, 1fr))` for both `AvailabilityGrid` and `HeatmapGrid` in days mode. `flex-wrap` causes items in the last row to stretch to fill remaining width, making cells unequal.

### Respondent color coding

`HeatmapGrid` accepts a `responses: Response[]` prop and builds a `slotToResponders` map internally. Colors are generated as `hsl((i * 360 / n) % 360, 65%, 55%)` for N respondents — evenly spaced hues. Anonymous mode replaces names with "Guest 1", "Guest 2", etc. in tooltips and the legend.

### Decline flow

Respondents can submit with `declined: true` and an empty `availability: []` ("None of these work for me"). The results page counts these separately: `declinedCount = responses.filter(r => r.declined).length`. Declined respondents still count toward `totalResponders` in the heatmap denominator (they're real respondents with zero availability — slots should show `X/5` not `X/3`).

### Email invites (mailto: pattern)

`FinalizedBanner.tsx` builds a `mailto:?bcc=...` URL client-side using `useMemo`. Uses `bcc=` so invitees don't see each other's addresses. The body includes Google Calendar URL (built inline) and a direct `.ics` link at `/api/events/[id]/ics`. No email infrastructure or API keys required — opens the host's default mail client. Button is only shown to the host (`isHost`) when at least one non-declined response has an email.

### Direct ICS endpoint

`GET /api/events/[id]/ics` — serves a `.ics` file for the finalized event. Returns 404 if the event has no `finalized_slot`. Sets `Content-Type: text/calendar;charset=utf-8` and `Content-Disposition: attachment`. Used in email invite bodies as the Apple Calendar link.

### Duration preset chips

The slot duration UI in `CreateEventForm.tsx` uses pill chips (`DURATION_PRESETS` array) instead of a slider. A "Custom" chip reveals a number input + `min`/`hr` unit select. When switching units, the displayed value converts automatically (`field.value` always stores minutes). Reset `customUnit` to `'min'` when a preset chip is selected.

### DayPicker dropdown navigation

`react-day-picker` v9 with `captionLayout="dropdown"` renders both a static `caption_label` span and interactive month/year selects. Hide the static label with `caption_label: 'hidden'` in the `classNames` prop. The chevron arrows use a CSS variable that overrides Tailwind fill classes — use `!fill-stone-500 dark:!fill-stone-300` (Tailwind `!important`) on the `chevron` classname to ensure correct colors in both modes.

### Smart location display

`LocationDisplay.tsx` is a shared component used on both event pages. It detects whether the location string is a URL (starts with `http`) and renders accordingly:
- **URL** → a single "View on maps ↗" link
- **Plain text** → the address text + "Google Maps ↗" + "Apple Maps ↗" deep links

`CreateEventForm.tsx` watches the location field (`watch('location')`) and renders `<LocationDisplay>` as a live preview below the input once 3+ characters are typed. Calendar exports use platform-specific links: Apple Maps URL in iCal DESCRIPTION, Google Maps URL in Google Calendar details.

## Visual design system

These are intentional, load-bearing design choices — do not remove or simplify them.

### Three-tier color system
CSS variables defined in `src/app/globals.css` under `@theme {}`:
- `--bg-outer` — page background (lightest tier)
- `--bg-card` — card/panel background
- `--bg-input` — input field background

Dark mode overrides in `.dark {}`. Use `bg-[var(--bg-outer)]` and `bg-[var(--bg-card)]` on layout containers — never hardcode `bg-white` or `bg-stone-*` for page/card backgrounds.

### Custom keyframes (globals.css)
- `wave1` / `wave2` / `wave3` — 25/30/35s GPU-only transform animation used by `BackgroundAnimation.tsx` (3 radial-gradient layers with `fixed` positioning)
- `confettiFall` — DOM particle burst injected into `bannerRef` on event finalization (`FinalizedBanner.tsx`)
- `bestSlotPulse` — animated box-shadow ring on top heatmap slots (`HeatmapGrid.tsx`)
- `aiReveal` — slide-up + fade-in entrance for the AI recommendation card (`AiRecommendationCard.tsx`)
- `sparkle` — subtle scale/opacity loop on the Sparkles icon (`AiRecommendationCard.tsx`)

### Spring physics easing
Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for interactive elements — availability grid cells, share link box copy animation, form duration chips. This produces a spring overshoot that makes taps feel physical. Pass it as an inline `style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}` rather than a Tailwind `duration-*` class.

### Heatmap amber warmth
`HeatmapGrid` cells use inline `background` style with amber gradients keyed to density:
- density 0 → `var(--color-stone-100)`
- density 1 → `linear-gradient(135deg, var(--color-amber-100), var(--color-stone-100))`
- density 2 → `linear-gradient(135deg, var(--color-amber-200), var(--color-amber-100))`
- density 3+ → `linear-gradient(135deg, var(--color-amber-400), var(--color-amber-200))`

Do not replace with flat Tailwind background classes — the gradient warmth is intentional.

# seeya

Find a time everyone loves. Share a link, have people highlight when they're free, and let the AI surface the best option.

Built with Next.js, Supabase, and Gemini 2.5 Flash.

## Features

- **Drag-to-paint availability grid** — click or drag to mark free slots; touch-friendly on mobile
- **Two scheduling modes** — specific time slots (custom-duration blocks) or full-day picker for trips/multi-day events
- **Trip duration** — days-mode events support multi-day blocks; participants pick which start dates work
- **Color-coded heatmap** — each respondent gets a distinct color; hover any cell to see exactly who's free; scales gracefully for large groups (dots for ≤8, count badge for 9–24, gradient-only for 25+)
- **Smart AI recommendation** — algorithm handles clear-cut cases instantly; Gemini 2.5 Flash writes nuanced prose for ambiguous overlaps
- **Finalization flow** — event creator can lock in a time; a confirmation banner appears for all viewers with calendar export
- **Calendar export** — download `.ics` (includes Apple Maps link) or add to Google Calendar (includes Google Maps link); direct `.ics` endpoint at `/api/events/[id]/ics`
- **Email invites** — after finalization, the host can open a pre-filled email (via `mailto:`) with BCC list and calendar links; shows partial count (e.g. "2 of 3") when not all respondents provided an email
- **Smart location display** — plain-text addresses show Google Maps + Apple Maps deep links on event pages; share URLs open directly; live preview appears below the input as you type during event creation
- **Decline option** — participants can mark "none of these work for me" without selecting slots
- **Comment field** — respondents can add a note; comments are visible to everyone on the results page
- **Anonymous mode** — hide participant names from each other (organizer still sees all)
- **Response deadline** — automatically close responses at a set date
- **RSVP cap** — limit the number of responses
- **Shareable links** — no login required; anyone with the link can respond
- **Dark mode** — system-aware, toggleable

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (Postgres) |
| AI | Gemini 2.5 Flash via `@google/generative-ai` |
| Forms | react-hook-form |
| Date picker | react-day-picker |
| Dark mode | next-themes |

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd seeya
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL editor and run the contents of `supabase/schema.sql`
3. Copy your project URL, anon key, and service role key

### 3. Get a Gemini API key

Get a free key at [aistudio.google.com](https://aistudio.google.com/apikey)

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Home — create event
│   ├── privacy/page.tsx                # Privacy policy
│   ├── event/[id]/page.tsx             # Respond to event
│   ├── event/[id]/results/page.tsx     # Heatmap + AI recommendation + finalization
│   └── api/events/
│       ├── route.ts                    # POST /api/events
│       └── [id]/
│           ├── route.ts                # GET /api/events/[id]
│           ├── responses/route.ts      # POST responses
│           ├── recommend/route.ts      # POST AI recommendation
│           ├── finalize/route.ts       # POST/DELETE finalization
│           └── ics/route.ts            # GET .ics calendar file
├── components/
│   ├── AvailabilityGrid.tsx            # Drag-to-paint grid (client)
│   ├── HeatmapGrid.tsx                 # Color-coded density grid
│   ├── CreateEventForm.tsx             # Progressive-disclosure form
│   ├── ResponseForm.tsx                # Wraps grid + name/comment inputs
│   ├── AiRecommendationCard.tsx        # AI result display (host-only)
│   ├── FinalizeButton.tsx              # Pick and lock in a time (host-only)
│   ├── FinalizedBanner.tsx             # Confirmation banner + calendar export
│   ├── CalendarExport.tsx              # .ics download + Google Calendar link
│   ├── HostTokenStore.tsx              # Reads ?t= param → sessionStorage
│   ├── ResultsAutoRefresh.tsx          # Polls router.refresh() every 30s
│   ├── ShareLinkBox.tsx                # Copy-to-clipboard link
│   ├── AnimatedEventType.tsx           # Cycling headline text
│   ├── BackgroundAnimation.tsx         # Ambient blob animation
│   └── ThemeToggle.tsx                 # Light/dark toggle
├── lib/
│   ├── availability.ts                 # Slot generation, density math, date headers
│   ├── gemini.ts                       # Gemini API wrapper + prompt
│   ├── validation.ts                   # Input validators + in-memory rate limiter
│   └── supabase/
│       ├── server.ts                   # Server client (RSC + API routes)
│       └── client.ts                   # Browser client
└── types/index.ts                      # Shared TypeScript types
```

## How the AI Recommendation Works

1. When someone requests a recommendation, the algorithm scores all time slots by density and groups them into contiguous blocks
2. **If there's a clear winner** (≥80% attendance, meaningfully ahead of alternatives) — a friendly template message is returned immediately with no Gemini call
3. **If it's ambiguous** (close tie, partial attendance, zero overlap) — Gemini 2.5 Flash writes a nuanced explanation
4. The result is cached in Supabase and returned instantly on repeat requests; the cache is invalidated when a new response is submitted

## Finalization Flow

The event creator gets a `host_token` when they create an event (returned in the API response, stored in `sessionStorage`). On the results page, only the creator sees:

1. The AI recommendation card (with "Get recommendation" button)
2. A **Finalize** button to lock in the best time (or choose any other slot)

Once finalized, a green confirmation banner appears for all viewers with calendar export options. The host also sees an "Email invites" button that opens a pre-filled `mailto:` draft with all respondents BCC'd — no email infrastructure required.

## Deployment

The easiest path is Vercel:

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Set `NEXT_PUBLIC_APP_URL` to your production domain
5. Deploy

## Database Schema

See `supabase/schema.sql` for the full DDL. Three tables:

- **`events`** — event config including dates, time window, mode, creator info, and advanced settings (`host_token`, `finalized_slot`, `location`, `timezone`, `anonymous`, `max_responses`, `response_deadline`, `trip_duration`)
- **`responses`** — per-respondent availability as an array of slot key strings, plus optional `email`, `comment`, and a `declined` boolean for "can't make it" RSVPs
- **`ai_recommendations`** — cached AI output per event (invalidated on new responses)

Row-level security is enabled with public read policies. All writes go through the service role key in API routes.

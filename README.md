# seeya

Find a time everyone loves. Share a link, have people highlight when they're free, and let the AI surface the best option.

Built with Next.js, Supabase, and Gemini 2.5 Flash.

## Features

- **Drag-to-paint availability grid** — click or drag to mark free slots; touch-friendly on mobile
- **Two modes** — specific time slots (30 min or 1 hr blocks) or full-day picker for trips
- **Heatmap results** — amber density overlay shows where group availability overlaps
- **Smart recommendations** — algorithm handles the clear-cut cases instantly; Gemini 2.5 Flash steps in for ambiguous overlaps with a friendly natural-language explanation
- **Shareable links** — no login required; anyone with the link can respond
- **Dark mode** — system-aware, toggleable
- **Animated homepage** — slow ambient background + cycling event type headline

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
│   ├── event/[id]/page.tsx             # Respond to event
│   ├── event/[id]/results/page.tsx     # Heatmap + AI recommendation
│   └── api/events/                     # API routes
│       ├── route.ts                    # POST /api/events
│       └── [id]/
│           ├── route.ts                # GET /api/events/[id]
│           ├── responses/route.ts      # POST responses
│           └── recommend/route.ts      # POST AI recommendation
├── components/
│   ├── AvailabilityGrid.tsx            # Drag-to-paint grid (client)
│   ├── HeatmapGrid.tsx                 # Read-only density grid
│   ├── CreateEventForm.tsx             # Progressive-disclosure form
│   ├── ResponseForm.tsx                # Wraps grid + name input
│   ├── AiRecommendationCard.tsx        # AI result display
│   ├── AnimatedEventType.tsx           # Cycling headline text
│   ├── BackgroundAnimation.tsx         # Ambient blob animation
│   ├── ShareLinkBox.tsx                # Copy-to-clipboard link
│   └── ThemeToggle.tsx                 # Light/dark toggle
├── lib/
│   ├── availability.ts                 # Slot generation + density math
│   ├── gemini.ts                       # Gemini API wrapper + prompt
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

## Deployment

The easiest path is Vercel:

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Set `NEXT_PUBLIC_APP_URL` to your production domain
5. Deploy

## Database Schema

See `supabase/schema.sql` for the full DDL. Three tables:

- `events` — event config including dates, time window, mode, and creator info
- `responses` — per-respondent availability as an array of slot key strings
- `ai_recommendations` — cached AI output per event (invalidated on new responses)

Row-level security is enabled with public read policies. All writes go through the service role key in API routes.

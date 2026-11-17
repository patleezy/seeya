create extension if not exists "pgcrypto";

create table events (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  description       text,
  location          text,
  type              text not null check (type in ('coffee','party','meetup','happy_hour','sports','vacation','dinner','other')),
  creator_name      text not null,
  mode              text not null check (mode in ('times','days')),
  dates             text[] not null,
  time_start        text,
  time_end          text,
  slot_duration     int,
  timezone          text,
  host_token        uuid not null default gen_random_uuid(),
  finalized_slot    text,
  finalized_at      timestamptz,
  response_deadline timestamptz,
  anonymous         boolean not null default false,
  max_responses     int,
  trip_duration          int,
  dates_last_modified    timestamptz,
  new_dates              text[] not null default '{}',
  created_at             timestamptz default now()
);

create table responses (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid references events(id) on delete cascade,
  respondent_name  text not null,
  email            text,
  availability     text[] not null,
  comment          text,
  created_at       timestamptz default now()
);

create table ai_recommendations (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid references events(id) on delete cascade unique,
  recommendation   text not null,
  best_slots       text[] not null,
  source           text not null default 'algorithm',
  generated_at     timestamptz default now()
);

-- Shared rate-limit counters (src/lib/rateLimit.ts). `key` is an HMAC of
-- "action:ip" — raw IP addresses are never stored.
create table if not exists rate_limits (
  key       text primary key,
  count     int not null,
  reset_at  timestamptz not null
);

-- Atomically counts one request and returns true if it's within the limit.
create or replace function check_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into rate_limits (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update set
    count    = case when rate_limits.reset_at <= now() then 1 else rate_limits.count + 1 end,
    reset_at = case when rate_limits.reset_at <= now()
                    then now() + make_interval(secs => p_window_seconds)
                    else rate_limits.reset_at end
  returning count into v_count;

  -- Occasionally sweep expired rows so the table stays small
  if random() < 0.01 then
    delete from rate_limits where reset_at < now() - interval '1 day';
  end if;

  return v_count <= p_limit;
end;
$$;

-- Only server code (service role) may call it — otherwise the public anon key
-- could hit this RPC directly and fill the table.
revoke execute on function check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function check_rate_limit(text, int, int) to service_role;

alter table events enable row level security;
alter table responses enable row level security;
alter table ai_recommendations enable row level security;
alter table rate_limits enable row level security;

-- No policies on purpose: with RLS on and no policies, the public anon key can't
-- read or write anything. All access goes through server code using the service
-- role key, which strips host_token and emails (src/lib/sanitize.ts).

-- Lockdown migration (run once on existing databases, AFTER deploying the app
-- version that reads through the service role):
-- drop policy if exists "public read events" on events;
-- drop policy if exists "public read responses" on responses;
-- drop policy if exists "public read recommendations" on ai_recommendations;

-- Migration (run these if upgrading from an earlier schema):
-- alter table events add column if not exists location text;
-- alter table events add column if not exists host_token uuid not null default gen_random_uuid();
-- alter table events add column if not exists finalized_slot text;
-- alter table events add column if not exists finalized_at timestamptz;
-- alter table events add column if not exists response_deadline timestamptz;
-- alter table events add column if not exists anonymous boolean not null default false;
-- alter table events add column if not exists max_responses int;
-- alter table responses add column if not exists email text;
-- alter table responses add column if not exists comment text;
-- alter table events add column if not exists trip_duration int;
-- alter table responses add column if not exists declined boolean not null default false;
-- alter table events add column if not exists dates_last_modified timestamptz;
-- alter table events add column if not exists new_dates text[] not null default '{}';
-- Rate limiting: run the `create table if not exists rate_limits`, `create or replace
-- function check_rate_limit`, revoke/grant, and `alter table rate_limits enable row
-- level security` statements above. Until then the app falls back to per-instance
-- in-memory limits.

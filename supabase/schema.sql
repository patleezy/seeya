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
  created_at        timestamptz default now()
);

create table responses (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid references events(id) on delete cascade,
  respondent_name  text not null,
  email            text,
  availability     text[] not null,
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

alter table events enable row level security;
alter table responses enable row level security;
alter table ai_recommendations enable row level security;

create policy "public read events" on events for select using (true);
create policy "public read responses" on responses for select using (true);
create policy "public read recommendations" on ai_recommendations for select using (true);

-- Migration (run these if upgrading from an earlier schema):
-- alter table events add column if not exists location text;
-- alter table events add column if not exists host_token uuid not null default gen_random_uuid();
-- alter table events add column if not exists finalized_slot text;
-- alter table events add column if not exists finalized_at timestamptz;
-- alter table events add column if not exists response_deadline timestamptz;
-- alter table events add column if not exists anonymous boolean not null default false;
-- alter table events add column if not exists max_responses int;
-- alter table responses add column if not exists email text;

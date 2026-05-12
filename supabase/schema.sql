create extension if not exists "pgcrypto";

create table events (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  type          text not null check (type in ('coffee','party','meetup','happy_hour','sports','vacation','dinner','other')),
  creator_name  text not null,
  mode          text not null check (mode in ('times','days')),
  dates         text[] not null,
  time_start    text,
  time_end      text,
  slot_duration int,
  timezone      text,
  created_at    timestamptz default now()
);

create table responses (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid references events(id) on delete cascade,
  respondent_name  text not null,
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

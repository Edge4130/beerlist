-- BeerList schema. Run once in the SQL Editor of the same Supabase project WingList uses.
-- Creates a new beer_pours table. It does not touch WingList's ratings table.
create table if not exists public.beer_pours (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  beer_name text not null,
  brewery text,
  style_number text,          -- BJCP 2021 number, e.g. 21C
  style_name text,
  style_variant text,         -- e.g. Black IPA under 21B
  serving text,               -- Draft, Can, Bottle, Glass, Cask, Crowler / growler
  place_name text,            -- where you drank it
  lat double precision,
  lng double precision,
  photo text,                 -- compressed JPEG data URL (same approach as WingList)
  sections jsonb not null default '{}'::jsonb,  -- per section: score, characteristic marks, off-style flags
  flaws jsonb not null default '{}'::jsonb,     -- { diacetyl: "M", ... }
  comments text,
  total integer
);

create index if not exists beer_pours_created_idx on public.beer_pours (created_at desc);

alter table public.beer_pours enable row level security;

-- Open policies, matching the WingList setup. Edit and delete are passcode-gated in the app only.
-- Tighten these (Supabase Auth, owner column) before other people log beers.
create policy "beer_pours read"   on public.beer_pours for select using (true);
create policy "beer_pours insert" on public.beer_pours for insert with check (true);
create policy "beer_pours update" on public.beer_pours for update using (true) with check (true);
create policy "beer_pours delete" on public.beer_pours for delete using (true);

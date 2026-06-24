-- Migration: create profile_interests table
-- Stores normalized interest strings per profile for matchmaking and compatibility scoring.

create table if not exists public.profile_interests (
  id          uuid primary key default gen_random_uuid(),
  profile_id  varchar not null references public.profiles(id) on delete cascade,
  interest    varchar not null,  -- always lowercase + trimmed (normalized form)
  created_at  timestamptz not null default now(),

  -- prevent the same interest appearing twice on one profile
  unique (profile_id, interest)
);

-- Index for fast lookup by profile
create index if not exists idx_profile_interests_profile_id
  on public.profile_interests(profile_id);

-- Index to find all profiles sharing an interest (for match scoring)
create index if not exists idx_profile_interests_interest
  on public.profile_interests(interest);

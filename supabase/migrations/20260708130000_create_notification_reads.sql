-- Migration: create notification_reads table
-- Tracks which announcements have been read by which users.

create table if not exists public.notification_reads (
  id              uuid primary key default gen_random_uuid(),
  user_id         varchar not null references public.profiles(id) on delete cascade,
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  read_at         timestamptz not null default now(),

  -- prevent duplicate read receipts
  unique (user_id, announcement_id)
);

-- Index for fast lookup by user
create index if not exists idx_notification_reads_user_id
  on public.notification_reads(user_id);

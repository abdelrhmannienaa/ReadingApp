-- One row per "Log Reading" press. The dashboard adds these up per day to fill
-- in the goal ring, the habit grid and the streak.
--
-- book_id assumes books.id is a uuid. If it is a bigint, change the type below.
create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  minutes integer not null check (minutes between 1 and 1440),
  page_reached integer check (page_reached >= 0),
  -- The reader's local calendar day, sent by the app. A session logged at 11pm
  -- in California is already "tomorrow" in UTC, so created_at can't be used to
  -- work out which grid square it belongs to.
  read_on date not null,
  created_at timestamptz not null default now()
);

create index if not exists reading_sessions_user_day_idx
  on public.reading_sessions (user_id, read_on desc);

alter table public.reading_sessions enable row level security;

grant select, insert on public.reading_sessions to authenticated;

create policy "Users can read their own reading sessions"
  on public.reading_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can log their own reading sessions"
  on public.reading_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

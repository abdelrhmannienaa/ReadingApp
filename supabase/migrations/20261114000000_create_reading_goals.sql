-- One row per day a user changed their goal. Changing it twice in one day
-- updates that day's row instead of adding another.
create table if not exists public.reading_goals (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  starts_on date not null,
  minutes integer not null check (minutes between 1 and 1440),
  primary key (user_id, starts_on)
);

alter table public.reading_goals enable row level security;

grant select, insert, update on public.reading_goals to authenticated;

create policy "Users can read their own goals"
  on public.reading_goals for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own goals"
  on public.reading_goals for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can change their own goals"
  on public.reading_goals for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
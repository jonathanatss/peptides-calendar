create table if not exists public.calendar_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.calendar_state enable row level security;

drop policy if exists "Users can read own calendar state" on public.calendar_state;
create policy "Users can read own calendar state"
on public.calendar_state
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own calendar state" on public.calendar_state;
create policy "Users can insert own calendar state"
on public.calendar_state
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own calendar state" on public.calendar_state;
create policy "Users can update own calendar state"
on public.calendar_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

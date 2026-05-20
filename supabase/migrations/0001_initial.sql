-- The Verdant Oracle — initial schema
-- Apply via Supabase SQL editor or `supabase db push`.
-- Supabase Auth is NOT used; Clerk is the source of truth for identity.
-- RLS policies authenticate via the `request.jwt.claims->>sub` claim,
-- which is the Clerk user id passed in the JWT template called "supabase".

-- ─── helpers ──────────────────────────────────────────────────────────────

create or replace function public.clerk_user_id() returns text
language sql stable as
$$
  select coalesce(
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
    ''
  );
$$;

-- ─── tables ───────────────────────────────────────────────────────────────

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text,
  birth_date date,
  birth_time time,
  birth_city text,
  birth_lat numeric,
  birth_lng numeric,
  oracle_voice text default 'root' check (oracle_voice in ('root', 'blade', 'tide')),
  subscription_status text default 'free' check (subscription_status in ('free', 'active', 'cancelled')),
  stripe_customer_id text,
  created_at timestamptz default now()
);

create index if not exists users_clerk_id_idx on public.users(clerk_id);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  entry_date date not null,
  moon_phase text,
  sun_sign text,
  what_landed text,
  moving_toward text,
  free_text text,
  created_at timestamptz default now()
);

create index if not exists journal_entries_user_date_idx
  on public.journal_entries(user_id, entry_date desc);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  reading_date date not null,
  reading_json jsonb,
  created_at timestamptz default now()
);

create index if not exists readings_user_date_idx
  on public.readings(user_id, reading_date desc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  report_type text not null,
  report_json jsonb,
  stripe_payment_intent text,
  created_at timestamptz default now()
);

create index if not exists reports_user_idx on public.reports(user_id);

-- ─── row level security ───────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.journal_entries enable row level security;
alter table public.readings enable row level security;
alter table public.reports enable row level security;

-- Users: a user can read and update their own row. Inserts/deletes happen
-- via the service role (Clerk webhook), never from the client.
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (clerk_id = public.clerk_user_id());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (clerk_id = public.clerk_user_id())
  with check (clerk_id = public.clerk_user_id());

-- Journal entries: full CRUD on own rows
drop policy if exists "journal_select_own" on public.journal_entries;
create policy "journal_select_own" on public.journal_entries
  for select using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "journal_insert_own" on public.journal_entries;
create policy "journal_insert_own" on public.journal_entries
  for insert with check (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "journal_update_own" on public.journal_entries;
create policy "journal_update_own" on public.journal_entries
  for update using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "journal_delete_own" on public.journal_entries;
create policy "journal_delete_own" on public.journal_entries
  for delete using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

-- Readings: select + insert own (no edit/delete from client)
drop policy if exists "readings_select_own" on public.readings;
create policy "readings_select_own" on public.readings
  for select using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "readings_insert_own" on public.readings;
create policy "readings_insert_own" on public.readings
  for insert with check (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

-- Reports: select own only. Inserts happen via service role after Stripe webhook.
drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

-- Witch Life — 0002: practice-tool schema
--
-- Adds hemisphere + practice_frequency to users; introduces
-- user_intentions and a practices log. Idempotent — safe to re-run.

-- ─── extend public.users ────────────────────────────────────────────────
alter table public.users
  add column if not exists hemisphere text default 'N' check (hemisphere in ('N', 'S')),
  add column if not exists practice_frequency text default 'daily';

-- ─── user_intentions ────────────────────────────────────────────────────
create table if not exists public.user_intentions (
  user_id uuid references public.users(id) on delete cascade not null,
  intention text not null,
  created_at timestamptz default now(),
  primary key (user_id, intention)
);

create index if not exists user_intentions_user_idx on public.user_intentions(user_id);

-- ─── practices ──────────────────────────────────────────────────────────
create table if not exists public.practices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  practice_date date not null,
  practice_type text not null check (practice_type in ('daily', 'card', 'spread', 'sabbat', 'library')),
  source_card_name text,
  notes text,
  created_at timestamptz default now()
);

create index if not exists practices_user_date_idx on public.practices(user_id, practice_date desc);

-- ─── row level security ─────────────────────────────────────────────────
alter table public.user_intentions enable row level security;
alter table public.practices enable row level security;

drop policy if exists "ui_select_own" on public.user_intentions;
create policy "ui_select_own" on public.user_intentions
  for select using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "ui_insert_own" on public.user_intentions;
create policy "ui_insert_own" on public.user_intentions
  for insert with check (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "ui_delete_own" on public.user_intentions;
create policy "ui_delete_own" on public.user_intentions
  for delete using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "practices_select_own" on public.practices;
create policy "practices_select_own" on public.practices
  for select using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "practices_insert_own" on public.practices;
create policy "practices_insert_own" on public.practices
  for insert with check (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "practices_update_own" on public.practices;
create policy "practices_update_own" on public.practices
  for update using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "practices_delete_own" on public.practices;
create policy "practices_delete_own" on public.practices
  for delete using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

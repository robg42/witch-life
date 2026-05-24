-- Witch Life — 0003: admin, feature flags, telemetry, caching
--
-- Adds:
--   - users.is_admin (initially set for mail@robgregg.com by the
--     Clerk webhook; manually flippable from /admin)
--   - feature_flags: registry of optional capabilities
--   - user_feature_overrides: per-user enable/disable of a flag
--   - api_calls: every Anthropic call logged with tokens + cost
--   - cached_readings: today's reading cached per (user, date, voice)
--   - admin_actions: audit log of every admin mutation
--   - shared_spreads: public-by-token spread readings (paid feature)
--
-- Idempotent — safe to re-run.

-- ─── extend public.users ───────────────────────────────────────────────
alter table public.users
  add column if not exists is_admin boolean default false;

create index if not exists users_email_idx on public.users(email);
create index if not exists users_is_admin_idx on public.users(is_admin) where is_admin = true;

-- ─── feature_flags ─────────────────────────────────────────────────────
-- Registry of optional capabilities. The set is also defined in
-- lib/features.ts; this table holds runtime-toggleable state.
create table if not exists public.feature_flags (
  key text primary key,
  name text not null,
  description text,
  tier text not null default 'free' check (tier in ('free', 'paid', 'admin')),
  default_enabled boolean not null default false,
  globally_enabled boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── user_feature_overrides ────────────────────────────────────────────
-- Per-user explicit override. Absence = use globally_enabled (or default).
create table if not exists public.user_feature_overrides (
  user_id uuid references public.users(id) on delete cascade not null,
  flag_key text references public.feature_flags(key) on delete cascade not null,
  enabled boolean not null,
  created_at timestamptz default now(),
  primary key (user_id, flag_key)
);

create index if not exists ufo_user_idx on public.user_feature_overrides(user_id);

-- ─── api_calls (telemetry) ─────────────────────────────────────────────
-- Every Anthropic call logged. Drives cost dashboards + per-user audit.
create table if not exists public.api_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  endpoint text not null,
  model text not null,
  input_tokens integer default 0,
  output_tokens integer default 0,
  cache_creation_tokens integer default 0,
  cache_read_tokens integer default 0,
  cost_usd numeric(10, 6) default 0,
  duration_ms integer,
  status text not null check (status in ('ok', 'error', 'rate_limited')),
  error_message text,
  created_at timestamptz default now()
);

create index if not exists api_calls_user_created_idx
  on public.api_calls(user_id, created_at desc);
create index if not exists api_calls_created_idx
  on public.api_calls(created_at desc);
create index if not exists api_calls_endpoint_idx
  on public.api_calls(endpoint);

-- ─── cached_readings ───────────────────────────────────────────────────
-- One reading per (user, day, voice). Saves cost + latency on re-views.
create table if not exists public.cached_readings (
  user_id uuid references public.users(id) on delete cascade not null,
  reading_date date not null,
  voice text not null,
  cache_key text not null,
  payload jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, reading_date, voice)
);

-- Defensive: previous deploys may have created the table without
-- updated_at. Add it if missing so the metrics query and the touch
-- trigger always have a column to write to.
alter table public.cached_readings
  add column if not exists updated_at timestamptz default now();

create index if not exists cached_readings_user_date_idx
  on public.cached_readings(user_id, reading_date desc);

-- ─── admin_actions (audit log) ─────────────────────────────────────────
create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.users(id) on delete set null,
  admin_email text not null,
  action text not null,
  target_user_id uuid references public.users(id) on delete set null,
  details jsonb,
  created_at timestamptz default now()
);

create index if not exists admin_actions_created_idx
  on public.admin_actions(created_at desc);
create index if not exists admin_actions_admin_idx
  on public.admin_actions(admin_user_id);

-- ─── shared_spreads ────────────────────────────────────────────────────
-- A spread reading anyone can view via a public token. Paid feature.
create table if not exists public.shared_spreads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  share_token text unique not null,
  cards jsonb not null,
  layout text not null,
  question text,
  payload jsonb not null,
  view_count integer default 0,
  created_at timestamptz default now(),
  expires_at timestamptz
);

create index if not exists shared_spreads_user_idx
  on public.shared_spreads(user_id);
create index if not exists shared_spreads_token_idx
  on public.shared_spreads(share_token);

-- ─── seed feature flags ────────────────────────────────────────────────
-- These insert-on-create. lib/features.ts is the source of truth for
-- which flags should exist; this just ensures rows are present.
insert into public.feature_flags (key, name, description, tier, default_enabled, globally_enabled) values
  ('streaks',         'Practice streaks',     'Track consecutive days of practice on /practice', 'free', true,  true),
  ('journal-export',  'Journal export',       'Download the journal as markdown',                  'free', true,  true),
  ('sky-alerts',      'Sky alerts',           'Banner on the leaf when significant sky events approach', 'free', true, true),
  ('shared-spreads',  'Shared spreads',       'Generate a public URL for a three-card spread',     'paid', false, true),
  ('voice-listen',    'Hear the oracle',      'Listen to today''s practice spoken aloud',         'paid', false, false),
  ('daily-email',     'Daily morning email',  'Receive today''s practice by email each morning',  'paid', false, false)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  tier = excluded.tier,
  updated_at = now();

-- ─── row level security ────────────────────────────────────────────────

alter table public.feature_flags enable row level security;
alter table public.user_feature_overrides enable row level security;
alter table public.api_calls enable row level security;
alter table public.cached_readings enable row level security;
alter table public.admin_actions enable row level security;
alter table public.shared_spreads enable row level security;

-- feature_flags: world-readable (clients need to know what's enabled),
-- only service role writes.
drop policy if exists "flags_select_all" on public.feature_flags;
create policy "flags_select_all" on public.feature_flags
  for select using (true);

-- user_feature_overrides: user reads own.
drop policy if exists "ufo_select_own" on public.user_feature_overrides;
create policy "ufo_select_own" on public.user_feature_overrides
  for select using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

-- api_calls: user reads own.
drop policy if exists "api_calls_select_own" on public.api_calls;
create policy "api_calls_select_own" on public.api_calls
  for select using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

-- cached_readings: user reads own.
drop policy if exists "cached_readings_select_own" on public.cached_readings;
create policy "cached_readings_select_own" on public.cached_readings
  for select using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

-- admin_actions: no client access at all (admins query via service role).
-- No policies = nothing readable from the anon/authenticated client.

-- shared_spreads: anyone can read by token. Inserts are admin/service.
drop policy if exists "shared_spreads_select_all" on public.shared_spreads;
create policy "shared_spreads_select_all" on public.shared_spreads
  for select using (true);

-- ─── timestamps ──────────────────────────────────────────────────────
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists feature_flags_touch on public.feature_flags;
create trigger feature_flags_touch
  before update on public.feature_flags
  for each row execute function public.touch_updated_at();

drop trigger if exists cached_readings_touch on public.cached_readings;
create trigger cached_readings_touch
  before update on public.cached_readings
  for each row execute function public.touch_updated_at();

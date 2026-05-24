-- Witch Life — 0004: the Foreshore correspondence layer
--
-- The Foreshore reframe adds a second timescale to the product:
-- once a week (when the operator has captures to draw from), a
-- LETTER arrives from "the Foreshore" — a fictional place that
-- knows the operator by callsign and refers to specific captures
-- from the recent tape. The operator can reply; replies are
-- referenced (never quoted) in subsequent letters.
--
-- Two small tables, both RLS user-owns-only. The letters table
-- holds one row per delivered letter. letter_replies is append-
-- only — every operator reply is stored, ordered by created_at,
-- and surfaced to the AI when composing the next letter.
--
-- Idempotent — safe to re-run.

-- ─── letters ───────────────────────────────────────────────────────────
create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  -- The "delivered" date for the letter. Letters are delivered on
  -- Sunday evenings, operator local; we store the day they
  -- nominally landed for the operator (used as the date in the
  -- letter header).
  sent_on date not null,
  -- ISO week identifier — used as a uniqueness key so we never
  -- accidentally deliver two letters for the same operator in the
  -- same week.
  iso_week text not null,
  -- The address line ("From the Foreshore", "From the Pith Room", etc.)
  sender_label text not null default 'From the Foreshore',
  -- The letter body. Italic, addressed, signed in the UI; here it's
  -- just the prose between salutation and sign-off (the salutation
  -- and sign-off are added by the renderer).
  body text not null,
  -- The captures the letter was woven from. JSONB array of
  -- { date, snippet } records — used both for citation and for
  -- feeding back into the next letter's prompt context.
  refs jsonb default '[]',
  -- Pulse state. Once the operator has opened the letter we move
  -- to read=true. The mail-slot LED only pulses when read=false.
  read boolean default false,
  created_at timestamptz default now()
);

create unique index if not exists letters_user_week_idx
  on public.letters(user_id, iso_week);

create index if not exists letters_user_sent_idx
  on public.letters(user_id, sent_on desc);

-- ─── letter_replies ────────────────────────────────────────────────────
create table if not exists public.letter_replies (
  id uuid primary key default gen_random_uuid(),
  letter_id uuid references public.letters(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists letter_replies_letter_idx
  on public.letter_replies(letter_id, created_at);

create index if not exists letter_replies_user_idx
  on public.letter_replies(user_id, created_at desc);

-- ─── row level security ────────────────────────────────────────────────

alter table public.letters enable row level security;
alter table public.letter_replies enable row level security;

drop policy if exists "letters_select_own" on public.letters;
create policy "letters_select_own" on public.letters
  for select using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

-- Inserts come from the server (service role) only — the Anthropic
-- response is generated on the server and persisted before the
-- letter is exposed to the client. No client-side insert path.
-- Updates (marking read) are user-owns-only.
drop policy if exists "letters_update_own" on public.letters;
create policy "letters_update_own" on public.letters
  for update using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "letter_replies_select_own" on public.letter_replies;
create policy "letter_replies_select_own" on public.letter_replies
  for select using (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

drop policy if exists "letter_replies_insert_own" on public.letter_replies;
create policy "letter_replies_insert_own" on public.letter_replies
  for insert with check (
    user_id in (select id from public.users where clerk_id = public.clerk_user_id())
  );

-- ─── feature flag (foreshore) ──────────────────────────────────────────
-- Inserts into feature_flags are idempotent (see 0003). We register
-- the 'foreshore' flag here so admins can enable/disable the
-- correspondence layer globally without code changes.

insert into public.feature_flags (
  key, name, description, tier, default_enabled, globally_enabled
) values (
  'foreshore',
  'Foreshore correspondence',
  'Weekly letters from the Foreshore, addressed to the operator by callsign and woven from recent captures.',
  'free',
  true,
  true
)
on conflict (key) do update set
  description = excluded.description,
  updated_at = now();

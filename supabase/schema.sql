-- AI詰将棋トレーニングWebアプリ — Supabase schema (sections 8 & 9 of the requirements doc)
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  level integer not null default 1,
  experience integer not null default 0,
  skill_score integer not null default 0,
  current_streak integer not null default 0,
  max_streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- puzzles
-- ---------------------------------------------------------------------------
create table if not exists public.puzzles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  board_state jsonb not null,
  hand_pieces jsonb not null default '{"sente": {}, "gote": {}}'::jsonb,
  solution jsonb not null,
  move_count integer not null check (move_count > 0 and move_count % 2 = 1),
  difficulty integer not null default 1,
  status text not null default 'unchecked'
    check (status in ('unchecked', 'valid', 'invalid_no_mate', 'invalid_dual_solution', 'invalid_rule', 'invalid_other')),
  generation_type text not null default 'manual' check (generation_type in ('ai', 'manual', 'algorithmic')),
  explanation text,
  created_at timestamptz not null default now()
);

create index if not exists puzzles_status_difficulty_idx on public.puzzles (status, difficulty);

-- Widen generation_type for projects provisioned before 'algorithmic' existed
-- (safe to rerun on a fresh install: the constraint already matches).
alter table public.puzzles drop constraint if exists puzzles_generation_type_check;
alter table public.puzzles add constraint puzzles_generation_type_check
  check (generation_type in ('ai', 'manual', 'algorithmic'));

-- ---------------------------------------------------------------------------
-- puzzle_attempts
-- ---------------------------------------------------------------------------
create table if not exists public.puzzle_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  puzzle_id uuid not null references public.puzzles (id) on delete cascade,
  is_correct boolean not null,
  used_hints integer not null default 0,
  answer_moves jsonb not null default '[]'::jsonb,
  answer_time numeric not null default 0,
  score integer not null default 0,
  attempted_at timestamptz not null default now()
);

create index if not exists puzzle_attempts_user_idx on public.puzzle_attempts (user_id, attempted_at desc);
-- Enforces "first attempt only counts for ranking" (section 6.11 anti-cheat).
create unique index if not exists puzzle_attempts_first_correct_idx
  on public.puzzle_attempts (user_id, puzzle_id)
  where is_correct;

-- ---------------------------------------------------------------------------
-- daily_challenges
-- ---------------------------------------------------------------------------
create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  puzzle_id uuid not null references public.puzzles (id) on delete cascade,
  challenge_date date not null unique,
  difficulty integer not null default 1,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- contact_messages
-- (ranking data is aggregated live from puzzle_attempts by /api/ranking;
-- there is no separate rankings table.)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- badges / user_badges
-- ---------------------------------------------------------------------------
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  condition_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  acquired_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security (section 9)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.puzzles enable row level security;
alter table public.puzzle_attempts enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.contact_messages enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

-- profiles: public read (needed for ranking display), owner-only write.
drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- puzzles: only `valid` puzzles are visible to regular users.
-- Admin-only access to unchecked/invalid puzzles should go through the
-- service-role key (server-side only), not through a client-facing policy.
drop policy if exists "valid puzzles are publicly readable" on public.puzzles;
create policy "valid puzzles are publicly readable"
  on public.puzzles for select
  using (status = 'valid');

-- puzzle_attempts: users can only see and create their own attempts.
drop policy if exists "users can view their own attempts" on public.puzzle_attempts;
create policy "users can view their own attempts"
  on public.puzzle_attempts for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert their own attempts" on public.puzzle_attempts;
create policy "users can insert their own attempts"
  on public.puzzle_attempts for insert
  with check (auth.uid() = user_id);

-- daily_challenges: publicly readable.
drop policy if exists "daily challenges are publicly readable" on public.daily_challenges;
create policy "daily challenges are publicly readable"
  on public.daily_challenges for select
  using (true);

-- contact_messages: no client-facing policy — only the service-role key
-- (server-side only) may read or write, same pattern as unchecked puzzles.

-- badges: publicly readable catalog.
drop policy if exists "badges are publicly readable" on public.badges;
create policy "badges are publicly readable"
  on public.badges for select
  using (true);

-- user_badges: users can see their own earned badges (and everyone's, for profile pages).
drop policy if exists "user badges are publicly readable" on public.user_badges;
create policy "user badges are publicly readable"
  on public.user_badges for select
  using (true);

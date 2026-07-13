-- Pathfinding Visualizer — community mazes + leaderboard schema.
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per signed-up user, keyed to Supabase's own auth.users table.
-- auth.users already holds email/password — this just adds a public-facing
-- username, since email shouldn't be shown on a public leaderboard.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row the moment someone signs up. The username is
-- read from the signup call's `options.data.username` (see AuthDialog's
-- signUp call) and falls back to part of the email if it's ever missing.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── shared_mazes ────────────────────────────────────────────────────────────
-- A maze a user created and published for others to attempt. `grid_data` is
-- this app's own Grid.serialize() output (cellType/weight/terrainId arrays,
-- start/end ids, checkpoint order) — stored as-is and passed straight to
-- Grid.deserialize() on load, no server-side interpretation needed.
create table if not exists public.shared_mazes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  width int not null,
  height int not null,
  grid_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists shared_mazes_created_at_idx on public.shared_mazes (created_at desc);

alter table public.shared_mazes enable row level security;

drop policy if exists "shared mazes are publicly readable" on public.shared_mazes;
create policy "shared mazes are publicly readable"
  on public.shared_mazes for select
  using (true);

drop policy if exists "authenticated users can publish a maze" on public.shared_mazes;
create policy "authenticated users can publish a maze"
  on public.shared_mazes for insert
  with check (auth.uid() = creator_id);

drop policy if exists "creators can delete their own maze" on public.shared_mazes;
create policy "creators can delete their own maze"
  on public.shared_mazes for delete
  using (auth.uid() = creator_id);

-- ── maze_attempts ───────────────────────────────────────────────────────────
-- One row per "I ran algorithm X on maze Y and got this result" submission —
-- the raw material for both leaderboard views (fastest run on a given
-- maze+algorithm, and which mazes are hardest for a given algorithm overall).
create table if not exists public.maze_attempts (
  id uuid primary key default gen_random_uuid(),
  maze_id uuid not null references public.shared_mazes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  algorithm_id text not null,
  runtime_ms real not null,
  path_length int not null,
  path_cost real not null,
  nodes_visited int not null,
  created_at timestamptz not null default now()
);

create index if not exists maze_attempts_maze_algo_idx on public.maze_attempts (maze_id, algorithm_id);
create index if not exists maze_attempts_algo_idx on public.maze_attempts (algorithm_id);

alter table public.maze_attempts enable row level security;

drop policy if exists "attempts are publicly readable" on public.maze_attempts;
create policy "attempts are publicly readable"
  on public.maze_attempts for select
  using (true);

drop policy if exists "authenticated users can submit an attempt" on public.maze_attempts;
create policy "authenticated users can submit an attempt"
  on public.maze_attempts for insert
  with check (auth.uid() = user_id);

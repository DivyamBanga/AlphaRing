-- ============================================================
-- AlphaRing Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── Profiles table ──────────────────────────────────────
-- Auto-created when a user signs up via trigger
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  updated_at timestamptz default now()
);

-- ── Strategies table ────────────────────────────────────
create table if not exists public.strategies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  english_prompt text not null,
  json_config jsonb not null,
  return_pct double precision not null,
  sharpe_ratio double precision not null,
  max_drawdown_pct double precision not null,
  win_rate_pct double precision not null,
  total_trades integer not null,
  avg_trade_duration double precision not null default 0,
  grade text not null,
  composite_score double precision not null,
  equity_curve jsonb not null default '[]'::jsonb,
  trade_log jsonb not null default '[]'::jsonb,
  strategy_type text not null default 'momentum',
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- ── Leaderboard view ────────────────────────────────────
-- Active strategies ranked by composite_score
create or replace view public.leaderboard as
select
  s.id,
  s.user_id,
  s.name,
  s.english_prompt,
  s.json_config,
  s.return_pct,
  s.sharpe_ratio,
  s.max_drawdown_pct,
  s.win_rate_pct,
  s.total_trades,
  s.avg_trade_duration,
  s.grade,
  s.composite_score,
  s.strategy_type,
  s.is_active,
  s.created_at,
  coalesce(p.username, 'Anonymous') as creator,
  p.avatar_url as creator_avatar,
  row_number() over (order by s.composite_score desc) as rank
from public.strategies s
left join public.profiles p on s.user_id = p.id
where s.is_active = true
order by s.composite_score desc;

-- ── Row Level Security ──────────────────────────────────

-- Enable RLS on both tables
alter table public.profiles enable row level security;
alter table public.strategies enable row level security;

-- Profiles: anyone can read, users can update their own
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Strategies: anyone can read, users can insert/update/delete their own
create policy "Strategies are viewable by everyone"
  on public.strategies for select
  using (true);

create policy "Users can insert own strategies"
  on public.strategies for insert
  with check (auth.uid() = user_id);

create policy "Users can update own strategies"
  on public.strategies for update
  using (auth.uid() = user_id);

create policy "Users can delete own strategies"
  on public.strategies for delete
  using (auth.uid() = user_id);

-- ── Auto-create profile on signup ───────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Indexes for performance ─────────────────────────────
create index if not exists idx_strategies_user_id on public.strategies(user_id);
create index if not exists idx_strategies_composite_score on public.strategies(composite_score desc);
create index if not exists idx_strategies_is_active on public.strategies(is_active);
create index if not exists idx_strategies_name on public.strategies using gin(name gin_trgm_ops);

-- Note: gin_trgm_ops requires the pg_trgm extension. If not available, remove the last index.
-- To enable: create extension if not exists pg_trgm;

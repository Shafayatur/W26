-- ============================================================
-- WC26 Family Prediction App — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  avatar_emoji text not null default '⚽',
  total_points integer not null default 0,
  streak integer not null default 0,
  best_streak integer not null default 0,
  banker_used_today boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ============================================================
-- MATCHES (synced from API — managed server-side)
-- ============================================================
create table public.matches (
  id text primary key,                     -- API match ID
  home_team text not null,
  away_team text not null,
  home_team_code text not null,            -- e.g. BRA, FRA
  away_team_code text not null,
  home_score integer,
  away_score integer,
  status text not null default 'SCHEDULED', -- SCHEDULED | LIVE | FINISHED | POSTPONED
  stage text not null,                     -- GROUP_STAGE | ROUND_OF_16 | QUARTER_FINALS | etc.
  group_name text,                         -- Group A, Group B, etc. (null for knockouts)
  matchday integer,
  kickoff_utc timestamptz not null,
  venue text,
  winner text,                             -- HOME | AWAY | DRAW (filled after match)
  updated_at timestamptz not null default now()
);

alter table public.matches enable row level security;

create policy "Matches are viewable by everyone"
  on public.matches for select using (true);

-- ============================================================
-- PREDICTIONS
-- ============================================================
create table public.predictions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id text references public.matches(id) on delete cascade not null,
  predicted_home integer not null,
  predicted_away integer not null,
  is_banker boolean not null default false,   -- doubles points if correct
  points_earned integer,                       -- null until match finished
  scored_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, match_id)
);

alter table public.predictions enable row level security;

create policy "Predictions visible to all authenticated users"
  on public.predictions for select using (auth.role() = 'authenticated');

create policy "Users can insert own predictions"
  on public.predictions for insert with check (auth.uid() = user_id);

create policy "Users can update own unscored predictions"
  on public.predictions for update using (
    auth.uid() = user_id and points_earned is null
  );

-- ============================================================
-- REACTIONS (emoji reactions on predictions)
-- ============================================================
create table public.reactions (
  id uuid primary key default uuid_generate_v4(),
  prediction_id uuid references public.predictions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique(prediction_id, user_id, emoji)
);

alter table public.reactions enable row level security;

create policy "Reactions visible to all authenticated users"
  on public.reactions for select using (auth.role() = 'authenticated');

create policy "Users can manage own reactions"
  on public.reactions for all using (auth.uid() = user_id);

-- ============================================================
-- COMMENTS (trash talk on predictions)
-- ============================================================
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  prediction_id uuid references public.predictions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  text text not null check (char_length(text) <= 200),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Comments visible to all authenticated users"
  on public.comments for select using (auth.role() = 'authenticated');

create policy "Users can insert own comments"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- ============================================================
-- FUNCTION: Calculate and store prediction points
-- Call this after a match finishes (from Edge Function or cron)
-- ============================================================
create or replace function calculate_prediction_points(p_match_id text)
returns void language plpgsql security definer as $$
declare
  m record;
  p record;
  pts integer;
begin
  select * into m from public.matches where id = p_match_id;
  if not found or m.status != 'FINISHED' then return; end if;

  for p in
    select * from public.predictions
    where match_id = p_match_id and points_earned is null
  loop
    pts := 0;

    -- Exact scoreline: 5 pts
    if p.predicted_home = m.home_score and p.predicted_away = m.away_score then
      pts := 5;
      if p.is_banker then pts := 10; end if;
    else
      -- Correct winner/draw
      if (p.predicted_home > p.predicted_away and m.winner = 'HOME_TEAM') or
         (p.predicted_home < p.predicted_away and m.winner = 'AWAY_TEAM') or
         (p.predicted_home = p.predicted_away and m.winner = 'DRAW') then
        
        -- Correct goal difference bonus
        if (p.predicted_home - p.predicted_away) = (m.home_score - m.away_score) then
          pts := 4;
          if p.is_banker then pts := 8; end if;
        else
          pts := 3;
          if p.is_banker then pts := 6; end if;
        end if;
      else
        -- Wrong prediction
        if p.is_banker then
          pts := -5;
        else
          pts := -1;
        end if;
      end if;
    end if;

    -- Save points on prediction
    update public.predictions
    set points_earned = pts, scored_at = now()
    where id = p.id;

    -- Update profile total
    update public.profiles
    set total_points = total_points + pts
    where id = p.user_id;
  end loop;

  -- Update streaks
  perform update_streaks();
end;
$$;

-- ============================================================
-- FUNCTION: Update streaks for all users
-- ============================================================
create or replace function update_streaks()
returns void language plpgsql security definer as $$
declare
  u record;
  last_pts integer;
  cur_streak integer;
begin
  for u in select id from public.profiles loop
    cur_streak := 0;
    for last_pts in
      select points_earned from public.predictions
      where user_id = u.id and points_earned is not null
      order by scored_at desc
      limit 10
    loop
      if last_pts > 0 then cur_streak := cur_streak + 1;
      else exit;
      end if;
    end loop;

    update public.profiles
    set
      streak = cur_streak,
      best_streak = greatest(best_streak, cur_streak)
    where id = u.id;
  end loop;
end;
$$;

-- ============================================================
-- REALTIME: enable for live score updates
-- ============================================================
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.predictions;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.comments;

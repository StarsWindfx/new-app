-- Run this in your Supabase SQL Editor (supabase.com > project > SQL Editor)

-- Enable anonymous auth in Supabase Dashboard:
-- Authentication > Providers > Anonymous > Enable

-- TABLES

create table if not exists todos (
  id uuid primary key,
  user_id uuid references auth.users not null,
  title text not null,
  completed boolean default false,
  priority text not null default 'medium',
  category text default '',
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text default '',
  date text not null,
  time text default '',
  reminder boolean default false,
  created_at timestamptz default now()
);

create table if not exists workouts (
  id uuid primary key,
  user_id uuid references auth.users not null,
  type text not null,
  duration_minutes integer default 0,
  calories integer default 0,
  notes text default '',
  date text not null,
  created_at timestamptz default now()
);

create table if not exists journal_entries (
  id uuid primary key,
  user_id uuid references auth.users not null,
  content text not null,
  mood text not null default 'neutral',
  date text not null,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY

alter table todos           enable row level security;
alter table events          enable row level security;
alter table workouts        enable row level security;
alter table journal_entries enable row level security;

create policy "own_todos"   on todos           for all using (auth.uid() = user_id);
create policy "own_events"  on events          for all using (auth.uid() = user_id);
create policy "own_workouts" on workouts        for all using (auth.uid() = user_id);
create policy "own_journal" on journal_entries for all using (auth.uid() = user_id);

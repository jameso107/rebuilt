-- Run this in your Supabase SQL Editor to create the scout_data table
-- https://supabase.com/dashboard -> Your Project -> SQL Editor

create table if not exists scout_data (
  id uuid default gen_random_uuid() primary key,
  data jsonb not null,
  created_at timestamptz default now()
);

-- Optional: Enable Row Level Security if you want to restrict access
-- alter table scout_data enable row level security;

create table if not exists current_event (
  id int primary key default 1 check (id = 1),
  event_key text not null,
  event_name text not null,
  team_numbers jsonb not null,
  updated_at timestamptz default now()
);

-- Optional: Create policies (required if RLS is enabled)
-- SELECT uses USING; INSERT/UPDATE use WITH CHECK; DELETE uses USING
-- create policy "Allow anonymous insert" on scout_data for insert with check (true);
-- create policy "Allow anonymous select" on scout_data for select using (true);
-- create policy "Allow anonymous delete" on scout_data for delete using (true);
-- create policy "Allow anonymous select" on current_event for select using (true);
-- create policy "Allow anonymous insert" on current_event for insert with check (true);
-- create policy "Allow anonymous update" on current_event for update using (true) with check (true);
-- create policy "Allow anonymous delete" on current_event for delete using (true);

-- Run this in your Supabase SQL Editor to create the scout_data table
-- https://supabase.com/dashboard -> Your Project -> SQL Editor

create table if not exists scout_data (
  id uuid default gen_random_uuid() primary key,
  data jsonb not null,
  created_at timestamptz default now()
);

-- Optional: Enable Row Level Security if you want to restrict access
-- alter table scout_data enable row level security;

-- Optional: Create policies (required if RLS is enabled)
-- create policy "Allow anonymous insert" on scout_data for insert with (true);
-- create policy "Allow anonymous select" on scout_data for select with (true);  -- needed for Admin dashboard
-- create policy "Allow anonymous delete" on scout_data for delete with (true);   -- needed for End Event / Begin Event wipe

-- Comprehensive Persistence & Permissions Fix
-- Run this in your Supabase SQL Editor

-- 1. ESTRATEGIA (Strategy Inputs)
-- Ensure 'strategy_inputs' has correct policies
alter table strategy_inputs enable row level security;

create policy "Users can manage their own strategy inputs"
on strategy_inputs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 2. FORMATOS (Formats)
-- Ensure 'formats' has correct policies
alter table formats enable row level security;

create policy "Users can manage their own formats"
on formats
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 3. GUIONES (Scripts)
-- Ensure 'scripts' has correct policies
alter table scripts enable row level security;

create policy "Users can manage their own scripts"
on scripts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 4. COMPETENCIA (Competitors)
-- Ensure 'competitors' has correct policies and remove scraping dependency
alter table competitors enable row level security;

create policy "Users can manage their own competitors"
on competitors
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 5. INSPIRACION (Inspiration / References)
-- Ensure 'inspiration' has correct policies
alter table inspiration enable row level security;

create policy "Users can manage their own inspiration"
on inspiration
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 6. STORAGE (Buckets)
-- Best effort to fix storage permissions (Requires Storage Admin privileges)
-- If this block fails, run the rest separately.

insert into storage.buckets (id, name, public)
values ('references', 'references', true)
on conflict (id) do update set public = true;

-- Allow public read of references (for <img> tags)
create policy "Public Access References"
on storage.objects for select
to public
using ( bucket_id = 'references' );

-- Allow authenticated upload
create policy "Auth Upload References"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'references' );

-- Allow authenticated update/delete own files
create policy "Auth Manage Own References"
on storage.objects for all
to authenticated
using ( bucket_id = 'references' and auth.uid() = owner );

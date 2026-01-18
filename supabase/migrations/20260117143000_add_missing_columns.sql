-- Fix Missing Columns
-- Run this in Supabase SQL Editor to allow saving to work.

-- The 'formats' table was missing the 'updated_at' column, causing save errors.
alter table formats add column if not exists updated_at timestamp with time zone default now();

-- Ensure other tables have it too
alter table strategy_inputs add column if not exists updated_at timestamp with time zone default now();
alter table scripts add column if not exists updated_at timestamp with time zone default now();

-- FIX: Add missing columns that might have been skipped
ALTER TABLE public.competitors 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS url text;

-- Re-run the previous updates just in case they were missed
ALTER TABLE public.competitors 
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS biography text,
ADD COLUMN IF NOT EXISTS profile_pic_url text,
ADD COLUMN IF NOT EXISTS external_url text,
ADD COLUMN IF NOT EXISTS is_verified boolean default false,
ADD COLUMN IF NOT EXISTS is_business_account boolean default false,
ADD COLUMN IF NOT EXISTS posts_count integer default 0,
ADD COLUMN IF NOT EXISTS follows_count integer default 0,
ADD COLUMN IF NOT EXISTS raw_data jsonb default '{}'::jsonb;

-- Add script_id to inspiration table to allow scoping references to specific scripts
alter table inspiration 
add column if not exists script_id uuid references scripts(id) on delete cascade;

-- Create index for performance
create index if not exists inspiration_script_id_idx on inspiration(script_id);

-- Update RLS policy to allow access based on script ownership (optional, but good practice)
-- Existing policy "Users can manage their own inspiration" uses user_id, which is still valid.
-- The new column just helps filtering.

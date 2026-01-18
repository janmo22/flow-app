create table if not exists collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table inspiration 
add column if not exists collection_id uuid references collections(id);

-- Add RLS policies
alter table collections enable row level security;

create policy "Users can view their own collections" on collections
  for select using (auth.uid() = user_id);

create policy "Users can insert their own collections" on collections
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own collections" on collections
  for update using (auth.uid() = user_id);

create policy "Users can delete their own collections" on collections
  for delete using (auth.uid() = user_id);

-- Create Competitors Table
create table if not exists public.competitors (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    url text not null,
    status text default 'active'::text,
    followers integer default 0,
    analysis_data jsonb default '{}'::jsonb,
    notes text,
    is_scraping boolean default false,
    last_scraped_at timestamp with time zone,
    last_content_scrape timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    
    constraint competitors_pkey primary key (id)
);

-- Enable RLS
alter table public.competitors enable row level security;

-- Policies
create policy "Users can view their own competitors"
    on public.competitors for select
    using (auth.uid() = user_id);

create policy "Users can insert their own competitors"
    on public.competitors for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own competitors"
    on public.competitors for update
    using (auth.uid() = user_id);

create policy "Users can delete their own competitors"
    on public.competitors for delete
    using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists competitors_user_id_idx on public.competitors(user_id);
create index if not exists competitors_created_at_idx on public.competitors(created_at);

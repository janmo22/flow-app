-- Update competitors table with new fields
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

-- Create competitors_posts table
CREATE TABLE IF NOT EXISTS public.competitors_posts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    competitor_id uuid NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
    remote_id text,
    short_code text,
    type text,
    caption text,
    url text,
    display_url text,
    video_url text,
    likes_count integer default 0,
    comments_count integer default 0,
    views_count integer default 0,
    published_at timestamp with time zone,
    child_posts jsonb default '[]'::jsonb,
    raw_data jsonb default '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT competitors_posts_pkey PRIMARY KEY (id)
);

-- Indexes for competitors_posts
CREATE INDEX IF NOT EXISTS competitors_posts_competitor_id_idx ON public.competitors_posts(competitor_id);
CREATE INDEX IF NOT EXISTS competitors_posts_remote_id_idx ON public.competitors_posts(remote_id);
CREATE INDEX IF NOT EXISTS competitors_posts_published_at_idx ON public.competitors_posts(published_at);

-- RLS for competitors_posts
ALTER TABLE public.competitors_posts ENABLE ROW LEVEL SECURITY;

-- Policies for competitors_posts (reusing competitor ownership logic)
CREATE POLICY "Users can view posts of their competitors"
    ON public.competitors_posts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.competitors c
            WHERE c.id = competitors_posts.competitor_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert posts for their competitors"
    ON public.competitors_posts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.competitors c
            WHERE c.id = competitors_posts.competitor_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update posts of their competitors"
    ON public.competitors_posts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.competitors c
            WHERE c.id = competitors_posts.competitor_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete posts of their competitors"
    ON public.competitors_posts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.competitors c
            WHERE c.id = competitors_posts.competitor_id
            AND c.user_id = auth.uid()
        )
    );

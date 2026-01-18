-- Enable RLS on storage.objects if not already enabled
alter table storage.objects enable row level security;

-- Create 'references' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('references', 'references', true)
on conflict (id) do nothing;

-- Policy: Allow authenticated users to upload to 'references' bucket
create policy "Authenticated users can upload references"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'references' );

-- Policy: Allow authenticated users to update their own objects
create policy "Users can update their own references"
on storage.objects for update
to authenticated
using ( bucket_id = 'references' and auth.uid() = owner );

-- Policy: Allow authenticated users to delete their own objects
create policy "Users can delete their own references"
on storage.objects for delete
to authenticated
using ( bucket_id = 'references' and auth.uid() = owner );

-- Policy: Allow public access to view/download references (since bucket is public)
-- Or restrict to authenticated if preferred, but public is easier for <img> tags
create policy "Public Access to References"
on storage.objects for select
to public
using ( bucket_id = 'references' );

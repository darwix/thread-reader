-- Add is_public column to threads and series
alter table public.threads add column if not exists is_public boolean default false;
alter table public.series add column if not exists is_public boolean default false;

-- Update RLS policies for threads to allow public read access
create policy "Anyone can view public threads" on public.threads
  for select using (is_public = true);

-- Update RLS policies for series to allow public read access
create policy "Anyone can view public series" on public.series
  for select using (is_public = true);

-- We also need to allow reading the media in the public bucket for these public threads
-- Ensure bucket is public (though my migration 2 made it public by not saying otherwise?
-- Actually Supabase storage buckets are private by default.)

-- Let's make the bucket public or add a policy
update storage.buckets set public = true where id = 'thread-media';

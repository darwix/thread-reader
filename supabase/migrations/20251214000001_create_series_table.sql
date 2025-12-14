-- Create series table
create table public.series (
  id uuid not null default gen_random_uuid (),
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  thread_ids text[] default array[]::text[],
  cover_image text,
  created_at timestamp with time zone default timezone ('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone ('utc'::text, now()) not null,
  constraint series_pkey primary key (id)
);

-- Enable RLS
alter table public.series enable row level security;

-- Policies
create policy "Users can view their own series" on public.series
  for select using (auth.uid() = user_id);

create policy "Users can insert their own series" on public.series
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own series" on public.series
  for update using (auth.uid() = user_id);

create policy "Users can delete their own series" on public.series
  for delete using (auth.uid() = user_id);

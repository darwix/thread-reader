-- Ensure threads table exists (in case it was created manually)
create table if not exists public.threads (
  id uuid not null default gen_random_uuid (),
  user_id uuid references auth.users not null,
  title text not null,
  author text not null,
  url text not null,
  tweets jsonb not null default '[]'::jsonb,
  tags text[] default array[]::text[],
  is_favorite boolean default false,
  is_archived boolean default false,
  is_read boolean default false,
  read_progress integer default 0,
  created_at timestamp with time zone default timezone ('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone ('utc'::text, now()) not null,
  constraint threads_pkey primary key (id)
);

-- Enable RLS on threads
alter table public.threads enable row level security;

-- Threads policies
do $$
begin
    if not exists (select 1 from pg_policies where policyname = 'Users can view their own threads' and tablename = 'threads') then
        create policy "Users can view their own threads" on public.threads for select using (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Users can insert their own threads' and tablename = 'threads') then
        create policy "Users can insert their own threads" on public.threads for insert with check (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Users can update their own threads' and tablename = 'threads') then
        create policy "Users can update their own threads" on public.threads for update using (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Users can delete their own threads' and tablename = 'threads') then
        create policy "Users can delete their own threads" on public.threads for delete using (auth.uid() = user_id);
    end if;
end $$;

-- Create a new bucket for thread media
insert into storage.buckets (id, name, public)
values ('thread-media', 'thread-media', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'thread-media' );

create policy "Users can upload their own media"
on storage.objects for insert
with check (
  bucket_id = 'thread-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own media"
on storage.objects for delete
using (
  bucket_id = 'thread-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

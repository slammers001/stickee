-- Stores one or more files per Stickee note. Binaries live in a private
-- Supabase Storage bucket; this table holds the metadata and the link.
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  path text not null unique,
  mime_type text not null,
  size bigint not null check (size > 0 and size <= 10485760),
  created_at timestamptz not null default now()
);

create index if not exists attachments_user_created_idx
  on public.attachments (user_id, created_at desc);

create index if not exists attachments_note_idx
  on public.attachments (note_id);

alter table public.attachments enable row level security;

drop policy if exists "attachments_select_own" on public.attachments;
create policy "attachments_select_own" on public.attachments
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "attachments_insert_own" on public.attachments;
create policy "attachments_insert_own" on public.attachments
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "attachments_delete_own" on public.attachments;
create policy "attachments_delete_own" on public.attachments
  for delete to authenticated using (auth.uid() = user_id);

-- Private bucket: files are only reachable through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "attachments_storage_select_own" on storage.objects;
create policy "attachments_storage_select_own" on storage.objects
  for select to authenticated using (
    bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attachments_storage_insert_own" on storage.objects;
create policy "attachments_storage_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attachments_storage_delete_own" on storage.objects;
create policy "attachments_storage_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text
  );

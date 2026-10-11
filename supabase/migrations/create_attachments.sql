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

alter table public.attachments enable row level security;

create policy "attachments_select_own" on public.attachments for select using (auth.uid() = user_id);
create policy "attachments_insert_own" on public.attachments for insert with check (auth.uid() = user_id);
create policy "attachments_delete_own" on public.attachments for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "attachments_storage_select_own" on storage.objects for select using (
  bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "attachments_storage_insert_own" on storage.objects for insert with check (
  bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "attachments_storage_delete_own" on storage.objects for delete using (
  bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text
);

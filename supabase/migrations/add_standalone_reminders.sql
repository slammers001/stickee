-- Standalone reminders: reminders that are not attached to a Stickee note.
--
-- Note reminders continue to live as columns on the notes table. This table
-- only holds reminders created directly from the Reminders tab.
--
-- remind_at is stored in UTC (timestamptz). remind_state values:
-- 'pending' | 'completed' | 'dismissed'. remind_repeat values:
-- 'none' | 'daily' | 'weekly' | 'monthly'.

create table if not exists reminders (
  id                    uuid        default gen_random_uuid() primary key,
  user_id               uuid        not null references auth.users(id) on delete cascade,
  title                 text,
  remind_at             timestamptz not null,
  remind_repeat         text        not null default 'none',
  remind_state          text        not null default 'pending',
  remind_fired_at       timestamptz,
  remind_snoozed_until  timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index if not exists reminders_user_remind_at_idx
  on reminders (user_id, remind_at);

alter table reminders enable row level security;

-- Create the policies only if they do not exist yet. This keeps the migration
-- safe to re-run without any DROP statements.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reminders'
      and policyname = 'Users can view their own reminders'
  ) then
    create policy "Users can view their own reminders" on reminders
      for select using (auth.uid()::text = user_id::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reminders'
      and policyname = 'Users can insert their own reminders'
  ) then
    create policy "Users can insert their own reminders" on reminders
      for insert with check (auth.uid()::text = user_id::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reminders'
      and policyname = 'Users can update their own reminders'
  ) then
    create policy "Users can update their own reminders" on reminders
      for update using (auth.uid()::text = user_id::text)
      with check (auth.uid()::text = user_id::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reminders'
      and policyname = 'Users can delete their own reminders'
  ) then
    create policy "Users can delete their own reminders" on reminders
      for delete using (auth.uid()::text = user_id::text);
  end if;
end
$$;

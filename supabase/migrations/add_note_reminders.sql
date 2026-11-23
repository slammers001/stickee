-- Reminders on notes: one reminder per note.
--
-- remind_at is stored in UTC (timestamptz). The UI converts to and from the
-- user's local time. remind_state values: 'pending' | 'completed' | 'dismissed'.
-- remind_repeat values: 'none' | 'daily' | 'weekly' | 'monthly'.
--
-- No RLS changes are needed here - the existing per-user policies on the notes
-- table already cover these columns.

alter table notes
  add column if not exists remind_at             timestamptz,
  add column if not exists remind_repeat         text        not null default 'none',
  add column if not exists remind_state          text        not null default 'pending',
  add column if not exists remind_fired_at       timestamptz,
  add column if not exists remind_snoozed_until  timestamptz;

create index if not exists notes_remind_at_idx
  on notes (user_id, remind_at)
  where remind_at is not null;

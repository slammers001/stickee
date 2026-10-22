# StickeeRemind — Reminders Design

Status: **design only, no code yet.**
Related: `ROADMAP.txt` item 5 (StickeeRemind), sidebar tab "Reminders" currently renders the
"under development" placeholder in `src/pages/Index.tsx:801`.

---

## 1. Goal

Let a user attach a date/time to any note and get a nudge when it comes due — in the app,
as an OS notification, and (later) by email.

Success looks like: "Set a reminder on a note → forget about it → the app tells me at the
right time → I can complete, snooze, or dismiss it without hunting for the note."

---

## 2. Decisions

| Decision | Choice | Why |
|---|---|---|
| Reminders per note | **One** | Keeps the UI to a single datetime field, avoids a second list component, and matches how people actually use a sticky note ("call back about X on Tuesday"). Multiple reminders = separate table, can be added later without breaking the API. |
| Storage | **Columns on `notes`** | One reminder lives with its note, so no join, no cascade rules, and `getNotes()` already returns everything the UI needs. `notes` already grew `archived` / `archived_at` / `deleted_at` the same way. |
| Storage (alternative) | Separate `reminders` table | Worth revisiting if multiple reminders, shared notes, or reminders not tied to a note are ever needed. |
| Delivery | **Web Notification API + in-app toast** | The Web Notification API works inside the Tauri WebView with no new Rust plugin, so phase 1 needs no `Cargo.toml` changes. Native toasts are phase 2. |
| Scheduling | **Client-side tick** | A 30s interval in the app checks for due reminders. Simple, no server cost, works offline-ish. |
| Recurrence | `none` / `daily` / `weekly` / `monthly` | Covers the common cases without an rrule parser. |

---

## 3. Data model

### Migration — `supabase/migrations/add_note_reminders.sql`

```sql
-- Reminders on notes: one reminder per note.
-- remind_at is stored in UTC; the UI converts to/from local time.

alter table notes
  add column if not exists remind_at             timestamptz,
  add column if not exists remind_repeat         text        not null default 'none',
  add column if not exists remind_state          text        not null default 'pending',
  add column if not exists remind_fired_at       timestamptz,
  add column if not exists remind_snoozed_until  timestamptz;

-- remind_state values: 'pending' | 'completed' | 'dismissed'
-- remind_repeat values: 'none' | 'daily' | 'weekly' | 'monthly'

create index if not exists notes_remind_at_idx
  on notes (user_id, remind_at)
  where remind_at is not null;
```

No RLS changes needed — the existing per-user policies on `notes` cover the new columns.

### Types — `src/types/note.ts`

```ts
export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly';
export type ReminderState  = 'pending' | 'completed' | 'dismissed';

export interface Note {
  // ...existing fields
  remind_at?: string | null;            // ISO UTC
  remind_repeat?: ReminderRepeat;
  remind_state?: ReminderState;
  remind_fired_at?: string | null;      // last time this reminder fired
  remind_snoozed_until?: string | null; // snooze target
}
```

`src/services/notesService.ts` must map the new columns in `mapSupabaseNote()` and allow
them to be written in `updateNote()` (it currently whitelists fields explicitly).

**Effective fire time** = `max(remind_at, remind_snoozed_until)`. Snoozing moves the
effective time without touching the original time.

Reminder *text* is not stored separately — the notification body is derived from the
note's (already encrypted at rest) title/content at render time, so no extra sensitive
column is needed.

---

## 4. Service layer — `src/services/reminderService.ts`

```ts
export interface ReminderView {
  noteId: string;
  title?: string;
  content: string;
  remindAt: string;        // ISO UTC
  repeat: ReminderRepeat;
  effectiveAt: string;     // max(remind_at, remind_snoozed_until)
  state: ReminderState;
  firedAt?: string | null;
}
```

| Function | Behaviour |
|---|---|
| `setReminder(noteId, remindAt, repeat)` | Sets `remind_at`, `remind_repeat`, resets `remind_state='pending'`, clears snooze/fired. |
| `clearReminder(noteId)` | Nulls `remind_at`, state back to `pending`. |
| `completeReminder(noteId)` | `remind_state='completed'`, `remind_at=null` (or rolls forward if recurring). |
| `dismissReminder(noteId)` | `remind_state='dismissed'`, `remind_at=null` (or rolls forward if recurring). |
| `snoozeReminder(noteId, minutes)` | `remind_snoozed_until = now + minutes`. |
| `getReminders()` | All notes with a reminder, excluding archived/trashed, ordered by effective time. |
| `getDueReminders(now)` | Effective time <= now and not yet completed/dismissed. |
| `rollRecurring(noteId)` | Computes the next occurrence and re-arms the reminder. |

### Time helpers — `src/utils/reminderTime.ts`

- `toLocalInputValue(iso)` / `fromLocalInputValue(local)` — convert between ISO UTC and the
  `datetime-local` input value.
- `formatReminderDate(iso)` — human string ("Today 3:30 PM", "Thu 12 Sep 9:00 AM").
- `nextOccurrence(iso, repeat)` — next occurrence **in local wall-clock time** so a daily
  9:00 AM reminder stays at 9:00 AM across DST changes.
- `isToday(iso)` / `isOverdue(iso)` — used for grouping and badges.

### Lifecycle rules

| Event | Result |
|---|---|
| Reminder fires | `remind_fired_at = now`, state stays `pending` (still "open" until acknowledged) |
| User completes | `state='completed'`; if recurring → `remind_at` rolls to next occurrence, state back to `pending` |
| User dismisses | `state='dismissed'`; if recurring → same roll-forward |
| User snoozes | `remind_snoozed_until = now + X` |
| Note archived / trashed / deleted | `remind_at = null` (reminder dies with the note) |
| Note status set to `Done` | Auto-complete the reminder (proposed; see open questions) |

---

## 5. UI

### 5.1 Setting a reminder

- `src/components/AddNoteDialog.tsx` and `src/components/NoteDetailDialog.tsx`:
  a "Reminder" row under Color — a `datetime-local` input, a repeat select
  (`none` / `daily` / `weekly` / `monthly`), and a Clear button.
- Quick presets next to the input: `+1h`, `Tonight 8 PM`, `Tomorrow 9 AM`.
- Saving a reminder asks for notification permission on first use (must be inside a user
  gesture): `Notification.requestPermission()`. If denied, the in-app toast still works.

### 5.2 Sticky note badge

`src/components/StickyNote.tsx` shows a small bell + time on the card:

- grey bell = upcoming
- amber bell = due today
- red bell + "Overdue" = past due and unacknowledged

The badge is display-only; clicking the card opens the note dialog where the reminder can
be edited.

### 5.3 Reminders panel

New `src/components/RemindersPanel.tsx`, rendered in `src/pages/Index.tsx` where the
"under development" placeholder currently is. Layout mirrors `ArchivedNotesPanel.tsx`
(load on mount, toast on error, empty state).

Groups, in order:

1. **Overdue** — past due, not acknowledged
2. **Today**
3. **Upcoming**
4. **Completed** — dismissed/completed reminders from the last 7 days

Each row: title (or content snippet), formatted time, and actions — Open, Complete,
Snooze (10m / 1h / tomorrow), Remove reminder.

### 5.4 Sidebar badge

`src/components/AppSidebar.tsx` renders a count next to the Reminders nav item
(number of reminders due today + overdue). `AppSidebar` currently takes no count, so
`Index.tsx` computes it and passes a new `reminderCount` prop.

---

## 6. Firing

### `src/hooks/useReminderScheduler.ts`

Mounted once at the top level of `Index.tsx` (not inside a tab branch) so reminders fire
regardless of the active tab.

```
on mount:
  catch-up pass  → fire everything that came due while the app was closed

every 30s:
  due = getDueReminders(now)
  for each due reminder:
    soundEffects.playReminderSound()
    toast("⏰ Reminder", { description: title || content.slice(0, 60),
                           action: { label: "Complete", onClick: completeReminder } })
    if Notification.permission === 'granted':
        new Notification("Stickee reminder", { body: title || content.slice(0, 60) })
    mark fired (remind_fired_at = now)
```

### Missed reminders (app was closed)

Catch-up fires anything overdue, but only surfaces a toast/OS notification for reminders
that came due within the last 24 hours. Older ones are simply listed as **Overdue** in the
panel, so returning from a week away doesn't produce a wall of toasts.

### Known caveats

- **Timers throttle in the background.** A hidden/minimised Tauri window can have its
  `setInterval` throttled to ~1/min. Fine for a 30s tick, but a reminder could fire up to
  a minute late. Native scheduled notifications (phase 2) remove this.
- **Reminders only fire while the app is running.** Phase 2 adds a server-side path.
- `Notification` is unavailable in some embedded webview configurations — the toast is
  always the fallback, so the feature degrades rather than breaks.

---

## 7. Time zones

- Store UTC (`timestamptz`); `datetime-local` input value is local wall-clock time.
- Save: `new Date(localValue).toISOString()`. Display: `new Date(iso)` + local formatter.
- Recurrence is computed on local wall-clock time, then converted to UTC, so "every day
  at 9:00 AM" survives DST changes.
- Date-only entries default to 9:00 AM local.

---

## 8. Files

**New**

- `supabase/migrations/add_note_reminders.sql`
- `src/services/reminderService.ts`
- `src/utils/reminderTime.ts`
- `src/hooks/useReminderScheduler.ts`
- `src/components/RemindersPanel.tsx`

**Changed**

- `src/types/note.ts` — `ReminderRepeat`, `ReminderState`, new `Note` fields
- `src/services/notesService.ts` — map + write the new columns
- `src/services/archiveService.ts`, `src/services/trashService.ts` — clear reminders
- `src/components/AddNoteDialog.tsx`, `src/components/NoteDetailDialog.tsx` — reminder input
- `src/components/StickyNote.tsx` — bell badge
- `src/components/AppSidebar.tsx` — count badge prop
- `src/pages/Index.tsx` — render panel, mount scheduler, pass count
- `src/utils/soundEffects.ts` — `playReminderSound()`
- `src/utils/analytics.ts` — `REMINDER_SET`, `REMINDER_FIRED`, `REMINDER_COMPLETED`,
  `REMINDER_SNOOZED`, `REMINDER_DISMISSED`

---

## 9. Build order

**Phase 1 — core (the whole feature, app-open only)**

1. Migration + types + `notesService` mapping
2. `reminderService` + `reminderTime` helpers
3. Reminder input in `AddNoteDialog` / `NoteDetailDialog`
4. Bell badge on `StickyNote`
5. `RemindersPanel` + sidebar count + `Index.tsx` wiring
6. `useReminderScheduler` + toast + sound + Web Notification
7. Complete / dismiss / snooze actions
8. Recurrence

**Phase 2 — optional**

- Native OS notifications (`tauri-plugin-notification`) — needs a `Cargo.toml` change
- Fire while the app is closed: Supabase Edge Function + `pg_cron` + web push
- Email reminders via Resend
- Multiple reminders per note (split into a `reminders` table with `unique(note_id)`)
- Calendar view (ROADMAP item 14, StickeeCal) reading `remind_at`

---

## 10. Open questions

- Setting a note's status to `Done` — should that auto-complete its reminder? (proposed: yes)
- Should a reminder be able to exist on a note without content? (notes require content today)
- Should snooze options be fixed (10m / 1h / tomorrow) or user-configurable?
- Is one reminder per note enough for real usage, or do we need the table earlier?

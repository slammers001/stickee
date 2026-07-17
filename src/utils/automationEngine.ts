import type { Note, NoteStatus } from '@/types/note';
import type {
  Automation,
  AutomationAction,
  AutomationCondition,
} from '@/types/automation';
import { EXTERNAL_ACTIONS, NOTE_STATUSES } from '@/types/automation';

// ---------------------------------------------------------------------------
// Pure rule evaluation
//
// This module is intentionally free of side effects so it can be unit tested.
// It decides WHICH notes match an automation; performing the resulting actions
// lives in the useAutomations hook, which calls the note services.
// ---------------------------------------------------------------------------

// Whole days elapsed since the note was last updated.
export const noteAgeInDays = (note: Note, now: number = Date.now()): number => {
  const updated = note.lastUpdated ?? now;
  const ms = now - updated;
  if (ms <= 0) return 0;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const asNumber = (value: string): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Evaluate a single condition against a note.
export const evaluateCondition = (
  note: Note,
  condition: AutomationCondition,
  now: number = Date.now()
): boolean => {
  const { field, operator, value } = condition;

  switch (field) {
    case 'status': {
      const status = note.status;
      if (operator === 'not-equals') return status !== value;
      return status === value;
    }
    case 'color': {
      if (operator === 'not-equals') return note.color !== value;
      return note.color === value;
    }
    case 'tag': {
      const tags = note.tags ?? [];
      const has = tags.includes(value);
      if (operator === 'not-equals') return !has;
      return has; // 'includes' / 'equals' both mean "tag present"
    }
    case 'ageDays': {
      const age = noteAgeInDays(note, now);
      const threshold = asNumber(value);
      if (operator === 'lte') return age <= threshold;
      return age >= threshold; // default & 'gte'
    }
    case 'title': {
      const title = (note.title ?? '').toLowerCase();
      const needle = value.toLowerCase();
      if (operator === 'not-equals') return !title.includes(needle);
      return title.includes(needle);
    }
    case 'content': {
      const content = (note.content ?? '').toLowerCase();
      const needle = value.toLowerCase();
      if (operator === 'not-equals') return !content.includes(needle);
      return content.includes(needle);
    }
    default:
      return false;
  }
};

// A note matches an automation when ALL conditions pass (AND semantics).
export const noteMatchesAutomation = (
  note: Note,
  automation: Automation,
  now: number = Date.now()
): boolean => {
  if (!automation.enabled) return false;
  return automation.conditions.every((c) => evaluateCondition(note, c, now));
};

// Return only the notes an automation should act on. This is where
// idempotency is enforced so a rule never re-processes a note that is
// already in its target state (prevents double-archiving / duplicate
// external actions when the cron job also runs).
export const notesToActOn = (
  notes: Note[],
  automation: Automation,
  now: number = Date.now()
): Note[] => {
  return notes.filter((note) => {
    if (!noteMatchesAutomation(note, automation, now)) return false;
    return automation.actions.some((action) => actionChangesNote(note, action));
  });
};

// Does applying this action actually change the note? Used to skip no-ops so
// runs stay idempotent. External actions are always considered "changing"
// because their effect is off-app; callers dedupe those separately.
export const actionChangesNote = (note: Note, action: AutomationAction): boolean => {
  switch (action.type) {
    case 'archive':
      return !note.archived;
    case 'unarchive':
      return Boolean(note.archived);
    case 'set-status':
      return note.status !== action.value;
    case 'add-tag':
      return !(note.tags ?? []).includes(action.value ?? '');
    case 'remove-tag':
      return (note.tags ?? []).includes(action.value ?? '');
    case 'set-color':
      return note.color !== action.value;
    case 'pin':
      return !note.pinned;
    case 'unpin':
      return note.pinned;
    default:
      return true; // side-effect actions (StickeeList / webhook)
  }
};

// Compute the note-field patch a single internal action produces. Returns null
// for external actions (which are handled out-of-band) and for no-ops.
export const applyActionToNote = (
  note: Note,
  action: AutomationAction
): Partial<Note> | null => {
  if (!actionChangesNote(note, action)) return null;
  if (EXTERNAL_ACTIONS.includes(action.type)) return null;

  switch (action.type) {
    case 'archive':
      return { archived: true, archived_at: new Date().toISOString() };
    case 'unarchive':
      return { archived: false, archived_at: undefined };
    case 'set-status':
      return NOTE_STATUSES.includes(action.value as NoteStatus)
        ? { status: action.value as NoteStatus }
        : null;
    case 'add-tag':
      return { tags: [...(note.tags ?? []), action.value ?? ''] };
    case 'remove-tag':
      return { tags: (note.tags ?? []).filter((t) => t !== action.value) };
    case 'set-color':
      return action.value ? { color: action.value } : null;
    case 'pin':
      return { pinned: true };
    case 'unpin':
      return { pinned: false };
    default:
      return null;
  }
};

// Build a short human-readable summary of a rule for the list UI.
export const describeAutomation = (automation: Automation): string => {
  const cond = automation.conditions
    .map((c) => `${c.field} ${c.operator} ${c.value}`)
    .join(' and ');
  const acts = automation.actions
    .map((a) => (a.value ? `${a.type} ${a.value}` : a.type))
    .join(', ');
  return cond ? `When ${cond} → ${acts}` : `→ ${acts}`;
};

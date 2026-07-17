import { NoteStatus } from './note';

// ---------------------------------------------------------------------------
// Automations model
//
// An automation is a user-defined rule of the shape:
//   TRIGGER  ->  CONDITION(s)  ->  ACTION(s)
//
// Two execution engines evaluate these rules:
//   1. Client-side engine (src/utils/automationEngine.ts) — runs inside the
//      running app on an interval and on note changes. Handles internal actions
//      and (optionally) external actions via a locally-stored token.
//   2. Postgres cron (SQL you run in the Supabase SQL Editor) — server-side
//      SQL that runs time-based, internal-only rules even when the app is closed.
// ---------------------------------------------------------------------------

export type TriggerType =
  | 'schedule' // time-based, evaluated on a cadence (e.g. daily)
  | 'note-created'
  | 'note-updated'
  | 'status-changed'
  | 'tag-added';

export interface AutomationTrigger {
  type: TriggerType;
  // For 'schedule' triggers, how often the client engine should re-evaluate.
  cadence?: 'on-change' | 'hourly' | 'daily';
}

export type ConditionField = 'status' | 'tag' | 'color' | 'ageDays' | 'title' | 'content';

export type ConditionOperator =
  | 'equals'
  | 'not-equals'
  | 'contains'
  | 'includes' // for the tags array
  | 'gte' // >=  (used by ageDays)
  | 'lte'; // <=  (used by ageDays)

export interface AutomationCondition {
  field: ConditionField;
  operator: ConditionOperator;
  value: string; // stored as string; coerced per field at evaluation time
}

export type ActionType =
  | 'archive'
  | 'unarchive'
  | 'set-status'
  | 'add-tag'
  | 'remove-tag'
  | 'set-color'
  | 'pin'
  | 'unpin'
  | 'checklist-add' // StickeeList (bottom-right): add a task from the note
  | 'checklist-complete' // StickeeList: mark matching task complete
  | 'webhook'; // external: POST the note to a URL

export interface AutomationAction {
  type: ActionType;
  // Optional payload depending on the action:
  //   set-status -> value is a NoteStatus
  //   add-tag / remove-tag -> value is the tag
  //   set-color -> value is the color name
  //   checklist-add -> optional custom task text (blank = note title/content)
  //   checklist-complete -> optional task text to match (blank = note title/content)
  //   webhook -> value is the destination URL
  value?: string;
}

export type AutomationExecutor = 'client' | 'postgres';

export interface Automation {
  id: string;
  user_id?: string;
  name: string;
  enabled: boolean;
  // Which engine is responsible for running this rule. Internal, time-based
  // rules can run on 'postgres'; anything with external actions runs on 'client'.
  executor: AutomationExecutor;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  last_run_at?: string | null;
  last_status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type NewAutomation = Omit<
  Automation,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_run_at' | 'last_status'
>;

// Human-readable labels used by the builder UI.
export const TRIGGER_LABELS: Record<TriggerType, string> = {
  schedule: 'On a schedule',
  'note-created': 'When a note is created',
  'note-updated': 'When a note is updated',
  'status-changed': 'When a note status changes',
  'tag-added': 'When a tag is added',
};

export const CONDITION_FIELD_LABELS: Record<ConditionField, string> = {
  status: 'Status',
  tag: 'Tag',
  color: 'Color',
  ageDays: 'Age (days)',
  title: 'Title',
  content: 'Content',
};

export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: 'is',
  'not-equals': 'is not',
  contains: 'contains',
  includes: 'includes',
  gte: 'is at least',
  lte: 'is at most',
};

export const ACTION_LABELS: Record<ActionType, string> = {
  archive: 'Archive the note',
  unarchive: 'Unarchive the note',
  'set-status': 'Set status to',
  'add-tag': 'Add tag',
  'remove-tag': 'Remove tag',
  'set-color': 'Set color to',
  pin: 'Pin the note',
  unpin: 'Unpin the note',
  'checklist-add': 'Add to StickeeList',
  'checklist-complete': 'Complete in StickeeList',
  webhook: 'Send to webhook',
};

// Side-effect actions don't patch note fields. They write elsewhere (StickeeList /
// webhook) and must run in-app (client executor), with per-note dedup.
export const SIDE_EFFECT_ACTIONS: ActionType[] = [
  'checklist-add',
  'checklist-complete',
  'webhook',
];

// Back-compat alias used by the engine for "not a note-field patch".
export const EXTERNAL_ACTIONS: ActionType[] = SIDE_EFFECT_ACTIONS;

export const NOTE_STATUSES: NoteStatus[] = ['To-Do', 'Doing', 'Done', 'Backlog'];

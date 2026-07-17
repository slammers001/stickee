import { supabase } from '@/lib/supabase';
import { getUserId } from './userService';
import type {
  Automation,
  AutomationAction,
  AutomationCondition,
  AutomationTrigger,
  NewAutomation,
} from '@/types/automation';

interface AutomationRow {
  id: string;
  user_id?: string;
  name?: string;
  enabled?: boolean;
  executor?: string;
  trigger?: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions?: AutomationAction[];
  last_run_at?: string | null;
  last_status?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Map a raw Supabase row to our Automation type, tolerating missing columns.
const mapRow = (row: AutomationRow): Automation => ({
  id: row.id,
  user_id: row.user_id,
  name: row.name ?? 'Untitled automation',
  enabled: Boolean(row.enabled),
  executor: row.executor === 'postgres' ? 'postgres' : 'client',
  trigger: row.trigger ?? { type: 'schedule', cadence: 'daily' },
  conditions: Array.isArray(row.conditions) ? row.conditions : [],
  actions: Array.isArray(row.actions) ? row.actions : [],
  last_run_at: row.last_run_at ?? null,
  last_status: row.last_status ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const formatSupabaseError = (error: unknown, fallback: string): Error => {
  if (error && typeof error === 'object') {
    const maybe = error as { message?: string; code?: string; details?: string };
    const parts = [maybe.message, maybe.details, maybe.code ? `(${maybe.code})` : '']
      .filter(Boolean)
      .join(' ');
    if (parts) {
      // Surface the common "table missing" case with a clear fix.
      if (
        /relation .*automations.* does not exist/i.test(parts) ||
        maybe.code === '42P01'
      ) {
        return new Error(
          'Automations table is missing. Run the Automations SQL in the Supabase SQL Editor, then try again.'
        );
      }
      if (/column .*tags.* does not exist/i.test(parts)) {
        return new Error(
          'Notes.tags column is missing. Run the Automations SQL (tags section) in Supabase, then try again.'
        );
      }
      return new Error(parts);
    }
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
};

// Fetch all automations for the current user.
export const getAutomations = async (): Promise<Automation[]> => {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ? data.map(mapRow) : [];
  } catch (error) {
    console.error('Error fetching automations:', error);
    throw formatSupabaseError(error, 'Failed to load automations from Supabase');
  }
};

// Create a new automation. Always persists to Supabase; throws on failure.
export const createAutomation = async (
  automation: NewAutomation
): Promise<Automation> => {
  try {
    const userId = await getUserId();
    const payload = {
      user_id: userId,
      name: automation.name,
      enabled: automation.enabled,
      executor: automation.executor,
      trigger: automation.trigger,
      conditions: automation.conditions,
      actions: automation.actions,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('automations')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Supabase returned no automation after insert');
    return mapRow(data);
  } catch (error) {
    console.error('Error creating automation:', error);
    throw formatSupabaseError(error, 'Failed to save automation to Supabase');
  }
};

// Update an existing automation. Always persists to Supabase; throws on failure.
export const updateAutomation = async (
  id: string,
  updates: Partial<NewAutomation>
): Promise<Automation> => {
  try {
    const userId = await getUserId();
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.enabled !== undefined) payload.enabled = updates.enabled;
    if (updates.executor !== undefined) payload.executor = updates.executor;
    if (updates.trigger !== undefined) payload.trigger = updates.trigger;
    if (updates.conditions !== undefined) payload.conditions = updates.conditions;
    if (updates.actions !== undefined) payload.actions = updates.actions;

    const { data, error } = await supabase
      .from('automations')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      throw new Error(
        'Automation was not updated (no matching row). Check that the automations table exists and RLS allows updates.'
      );
    }
    return mapRow(data);
  } catch (error) {
    console.error('Error updating automation:', error);
    throw formatSupabaseError(error, 'Failed to update automation in Supabase');
  }
};

// Record the outcome of the most recent run (used by the client engine).
export const recordAutomationRun = async (
  id: string,
  status: string
): Promise<{ last_run_at: string; last_status: string }> => {
  const last_run_at = new Date().toISOString();
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('automations')
      .update({ last_run_at, last_status: status })
      .eq('id', id)
      .eq('user_id', userId)
      .select('last_run_at, last_status')
      .single();

    if (error) throw error;
    return {
      last_run_at: data?.last_run_at ?? last_run_at,
      last_status: data?.last_status ?? status,
    };
  } catch (error) {
    console.error('Error recording automation run:', error);
    // Still return the intended status so the UI can show it even if the
    // write failed (e.g. offline); callers decide whether to toast.
    throw formatSupabaseError(error, 'Failed to record automation run in Supabase');
  }
};

// Delete an automation. Always persists to Supabase; throws on failure.
export const deleteAutomation = async (id: string): Promise<void> => {
  try {
    const userId = await getUserId();
    // Select-then-delete so we can confirm the row existed and was owned by us.
    const { data: existing, error: fetchError } = await supabase
      .from('automations')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      throw new Error('Automation was not found (or RLS blocked access).');
    }

    const { error } = await supabase
      .from('automations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting automation:', error);
    throw formatSupabaseError(error, 'Failed to delete automation from Supabase');
  }
};

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Note } from '@/types/note';
import type { Automation, AutomationAction, NewAutomation } from '@/types/automation';
import { SIDE_EFFECT_ACTIONS } from '@/types/automation';
import {
  createAutomation as createAutomationService,
  deleteAutomation as deleteAutomationService,
  getAutomations as getAutomationsService,
  recordAutomationRun,
  updateAutomation as updateAutomationService,
} from '@/services/automationsService';
import { updateNote as updateNoteService } from '@/services/notesService';
import { archiveNote, unarchiveNote } from '@/services/archiveService';
import { checklistService } from '@/services/checklistService';
import { getUserId } from '@/services/userService';
import { applyActionToNote, notesToActOn } from '@/utils/automationEngine';
import { hasProcessed, makeKey, markProcessed } from '@/utils/automationDedup';

// How often the client-side engine re-evaluates schedule-based rules.
const RUN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface UseAutomationsOptions {
  // Returns the current, up-to-date notes to evaluate rules against.
  getNotes: () => Note[];
  // Called after the engine has changed notes so the UI can refresh.
  onNotesChanged: () => void | Promise<void>;
  // Called after StickeeList (checklist) side effects so the panel refreshes.
  onChecklistChanged?: () => void | Promise<void>;
  // Only run when the user has accepted terms (matches the rest of the app).
  enabled: boolean;
}

// Prefer custom action value, else note title, else a short content snippet.
const taskTextFromNote = (note: Note, custom?: string): string => {
  const fromValue = custom?.trim();
  if (fromValue) return fromValue;
  const fromTitle = note.title?.trim();
  if (fromTitle) return fromTitle;
  return (note.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
};

// Side-effect actions write outside the notes table (StickeeList / webhook).
// Reject on failure so callers never mark them processed.
const runSideEffectAction = async (
  note: Note,
  action: AutomationAction
): Promise<void> => {
  if (action.type === 'webhook') {
    if (!action.value) throw new Error('Webhook URL is required.');
    const response = await fetch(action.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: note.id,
        title: note.title ?? '',
        content: note.content,
        status: note.status,
        tags: note.tags ?? [],
        color: note.color,
        pinned: note.pinned,
      }),
    });
    if (!response.ok) throw new Error(`Webhook failed (${response.status}).`);
    return;
  }

  if (action.type === 'checklist-add') {
    const text = taskTextFromNote(note, action.value);
    if (!text) throw new Error('StickeeList task text is empty.');
    const userId = await getUserId();
    // Avoid exact-text duplicates still open on the list.
    const existing = await checklistService.getItems(userId);
    const alreadyOpen = existing.some(
      (item) => !item.completed && item.text.trim() === text
    );
    if (alreadyOpen) return;
    await checklistService.addItem(userId, text);
    return;
  }

  if (action.type === 'checklist-complete') {
    const text = taskTextFromNote(note, action.value);
    if (!text) throw new Error('StickeeList match text is empty.');
    const userId = await getUserId();
    const existing = await checklistService.getItems(userId);
    const matches = existing.filter(
      (item) => !item.completed && item.text.trim() === text
    );
    if (matches.length === 0) return;
    for (const item of matches) {
      await checklistService.toggleItem(item.id, true);
    }
    return;
  }
};

export const useAutomations = ({
  getNotes,
  onNotesChanged,
  onChecklistChanged,
  enabled,
}: UseAutomationsOptions) => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const runningRef = useRef(false);

  const load = useCallback(async () => {
    if (!enabled) {
      setAutomations([]);
      setLoadError(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError(null);
      const rows = await getAutomationsService();
      setAutomations(rows);
    } catch (error) {
      console.error('Error loading automations:', error);
      setAutomations([]);
      setLoadError(
        error instanceof Error ? error.message : 'Failed to load automations from Supabase'
      );
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const createAutomation = useCallback(async (automation: NewAutomation) => {
    // Service throws on failure and returns the persisted row on success.
    const created = await createAutomationService(automation);
    setAutomations((prev) => [...prev, created]);
    setLoadError(null);
    return created;
  }, []);

  const updateAutomation = useCallback(
    async (id: string, updates: Partial<NewAutomation>) => {
      const updated = await updateAutomationService(id, updates);
      setAutomations((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    },
    []
  );

  const toggleAutomation = useCallback(async (id: string, nextEnabled: boolean) => {
    // Optimistic toggle for a snappy switch; roll back if Supabase write fails.
    let previous: boolean | undefined;
    setAutomations((prev) => {
      previous = prev.find((a) => a.id === id)?.enabled;
      return prev.map((a) => (a.id === id ? { ...a, enabled: nextEnabled } : a));
    });
    try {
      const updated = await updateAutomationService(id, { enabled: nextEnabled });
      setAutomations((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (error) {
      console.error('Error toggling automation:', error);
      setAutomations((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, enabled: previous ?? !nextEnabled } : a
        )
      );
      throw error;
    }
  }, []);

  const deleteAutomation = useCallback(async (id: string) => {
    let snapshot: Automation[] = [];
    setAutomations((prev) => {
      snapshot = prev;
      return prev.filter((a) => a.id !== id);
    });
    try {
      await deleteAutomationService(id);
    } catch (error) {
      console.error('Error deleting automation:', error);
      setAutomations(snapshot);
      throw error;
    }
  }, []);

  // Evaluate a single automation against the current notes and apply actions.
  // Every internal change is written to Supabase via notesService / archiveService.
  const runAutomation = useCallback(
    async (automation: Automation): Promise<number> => {
      // Only the client engine runs in-app; 'postgres' rules are owned by cron
      // to avoid double-applying the same rule.
      if (automation.executor !== 'client' || !automation.enabled) return 0;

      const targets = notesToActOn(getNotes(), automation);
      let changed = 0;
      let lastError: unknown = null;
      let checklistTouched = false;

      for (const note of targets) {
        // Build a working copy so multi-action rules (e.g. two add-tag) stack.
        let workingNote: Note = {
          ...note,
          tags: [...(note.tags ?? [])],
        };
        let patch: Partial<Note> = {};
        let didArchive = false;
        let didUnarchive = false;
        let firedSideEffect = false;

        for (const action of automation.actions) {
          if (SIDE_EFFECT_ACTIONS.includes(action.type)) {
            // Side effects (StickeeList / webhook) have no note-field self-heal,
            // so dedup per note to avoid re-firing every interval.
            const key = makeKey(automation.id, action.type, note.id);
            if (hasProcessed(key)) continue;
            try {
              await runSideEffectAction(workingNote, action);
              markProcessed(key);
              firedSideEffect = true;
              if (
                action.type === 'checklist-add' ||
                action.type === 'checklist-complete'
              ) {
                checklistTouched = true;
              }
            } catch (error) {
              console.error('Side-effect automation action failed:', error);
              lastError = error;
            }
            continue;
          }
          if (action.type === 'archive') {
            if (!workingNote.archived) {
              didArchive = true;
              workingNote = {
                ...workingNote,
                archived: true,
                archived_at: new Date().toISOString(),
              };
            }
            continue;
          }
          if (action.type === 'unarchive') {
            if (workingNote.archived) {
              didUnarchive = true;
              workingNote = {
                ...workingNote,
                archived: false,
                archived_at: undefined,
              };
            }
            continue;
          }
          const fieldPatch = applyActionToNote(workingNote, action);
          if (fieldPatch) {
            patch = { ...patch, ...fieldPatch };
            workingNote = { ...workingNote, ...fieldPatch };
          }
        }

        const hasInternalChange =
          Object.keys(patch).length > 0 || didArchive || didUnarchive;

        // Nothing to do for this note (side effects already deduped).
        if (!hasInternalChange && !firedSideEffect) continue;

        try {
          // Persist field changes (status, tags, color, pin, …) to Supabase.
          if (Object.keys(patch).length > 0) {
            const saved = await updateNoteService(note.id, patch);
            if (!saved) {
              throw new Error(
                `Supabase did not return the updated note (${note.id}). Check RLS and that the tags column exists if you used tag actions.`
              );
            }
          }
          // Archive / unarchive go through the dedicated service so archived_at
          // is written correctly and the note leaves the active board query.
          if (didArchive) {
            await archiveNote(note.id);
          } else if (didUnarchive) {
            await unarchiveNote(note.id);
          }
          changed += 1;
        } catch (error) {
          console.error('Error applying automation to note:', error);
          lastError = error;
        }
      }

      if (checklistTouched && onChecklistChanged) {
        try {
          await onChecklistChanged();
        } catch (error) {
          console.error('Error refreshing StickeeList after automation:', error);
        }
      }

      const status =
        changed > 0
          ? `Applied to ${changed} note(s)`
          : lastError
          ? `Failed: ${lastError instanceof Error ? lastError.message : 'unknown error'}`
          : 'No matching notes';

      try {
        const runMeta = await recordAutomationRun(automation.id, status);
        setAutomations((prev) =>
          prev.map((a) =>
            a.id === automation.id
              ? {
                  ...a,
                  last_run_at: runMeta.last_run_at,
                  last_status: runMeta.last_status,
                }
              : a
          )
        );
      } catch (error) {
        // Note changes may have succeeded even if we couldn't stamp last_run_at.
        console.error('Error recording automation run:', error);
        setAutomations((prev) =>
          prev.map((a) =>
            a.id === automation.id
              ? {
                  ...a,
                  last_run_at: new Date().toISOString(),
                  last_status: status,
                }
              : a
          )
        );
      }

      return changed;
    },
    [getNotes, onChecklistChanged]
  );

  // Run every enabled client automation once.
  const runAll = useCallback(async (): Promise<number> => {
    if (!enabled || runningRef.current) return 0;
    runningRef.current = true;
    let total = 0;
    try {
      // Re-read from state via the latest automations list.
      for (const automation of automations) {
        total += await runAutomation(automation);
      }
      if (total > 0) await onNotesChanged();
    } finally {
      runningRef.current = false;
    }
    return total;
  }, [automations, enabled, onNotesChanged, runAutomation]);

  // Background schedule: run on mount (after automations load) and on an interval.
  useEffect(() => {
    if (!enabled || loading) return;
    // Kick off an initial pass shortly after load.
    const initial = setTimeout(() => {
      runAll();
    }, 2000);
    const interval = setInterval(() => {
      runAll();
    }, RUN_INTERVAL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [enabled, loading, runAll]);

  return {
    automations,
    loading,
    loadError,
    createAutomation,
    updateAutomation,
    toggleAutomation,
    deleteAutomation,
    runAll,
    reload: load,
  };
};

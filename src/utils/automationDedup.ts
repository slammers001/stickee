// ---------------------------------------------------------------------------
// External-action dedup
//
// Internal actions self-heal: once a note is archived / retagged it no longer
// matches its rule, so the interval runner won't touch it again. External
// actions (StickeeList / webhook) have no such feedback — the note keeps matching,
// so without a marker the same task would be re-created every interval.
//
// We persist a set of "<automationId>::<actionType>::<noteId>" keys in
// localStorage and only fire an external action when its key is absent.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'stickee-automation-processed';

const readSet = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const writeSet = (set: Set<string>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Best effort — a full/blocked localStorage just means we may re-fire.
  }
};

export const makeKey = (
  automationId: string,
  actionType: string,
  noteId: string
): string => `${automationId}::${actionType}::${noteId}`;

export const hasProcessed = (key: string): boolean => readSet().has(key);

export const markProcessed = (key: string): void => {
  const set = readSet();
  set.add(key);
  writeSet(set);
};

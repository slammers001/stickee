import { describe, expect, it } from "vitest";
import type { Note } from "@/types/note";
import type { Automation } from "@/types/automation";
import {
  actionChangesNote,
  applyActionToNote,
  evaluateCondition,
  noteAgeInDays,
  noteMatchesAutomation,
  notesToActOn,
} from "./automationEngine";

const DAY = 1000 * 60 * 60 * 24;
const NOW = 1_700_000_000_000;

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: "n1",
  content: "hello",
  color: "yellow",
  status: "To-Do",
  lastUpdated: NOW,
  pinned: false,
  archived: false,
  tags: [],
  ...overrides,
});

const archiveAfter7Days: Automation = {
  id: "a1",
  name: "Archive completed after 7 days",
  enabled: true,
  executor: "client",
  trigger: { type: "schedule", cadence: "daily" },
  conditions: [
    { field: "status", operator: "equals", value: "Done" },
    { field: "ageDays", operator: "gte", value: "7" },
  ],
  actions: [{ type: "archive" }],
};

describe("noteAgeInDays", () => {
  it("computes whole days since last update", () => {
    const note = makeNote({ lastUpdated: NOW - 8 * DAY });
    expect(noteAgeInDays(note, NOW)).toBe(8);
  });

  it("never returns a negative age", () => {
    const note = makeNote({ lastUpdated: NOW + DAY });
    expect(noteAgeInDays(note, NOW)).toBe(0);
  });
});

describe("evaluateCondition", () => {
  it("matches status equals", () => {
    expect(
      evaluateCondition(makeNote({ status: "Done" }), {
        field: "status",
        operator: "equals",
        value: "Done",
      })
    ).toBe(true);
  });

  it("matches ageDays gte threshold", () => {
    const note = makeNote({ lastUpdated: NOW - 7 * DAY });
    expect(
      evaluateCondition(note, { field: "ageDays", operator: "gte", value: "7" }, NOW)
    ).toBe(true);
  });

  it("matches tag includes", () => {
    const note = makeNote({ tags: ["shopping", "urgent"] });
    expect(
      evaluateCondition(note, { field: "tag", operator: "includes", value: "shopping" })
    ).toBe(true);
  });

  it("matches title contains case-insensitively", () => {
    const note = makeNote({ title: "Weekly Groceries" });
    expect(
      evaluateCondition(note, { field: "title", operator: "contains", value: "grocer" })
    ).toBe(true);
  });
});

describe("noteMatchesAutomation", () => {
  it("requires all conditions (AND semantics)", () => {
    const done8d = makeNote({ status: "Done", lastUpdated: NOW - 8 * DAY });
    const done1d = makeNote({ status: "Done", lastUpdated: NOW - 1 * DAY });
    expect(noteMatchesAutomation(done8d, archiveAfter7Days, NOW)).toBe(true);
    expect(noteMatchesAutomation(done1d, archiveAfter7Days, NOW)).toBe(false);
  });

  it("never matches a disabled automation", () => {
    const done8d = makeNote({ status: "Done", lastUpdated: NOW - 8 * DAY });
    expect(
      noteMatchesAutomation(done8d, { ...archiveAfter7Days, enabled: false }, NOW)
    ).toBe(false);
  });
});

describe("notesToActOn (idempotency)", () => {
  it("skips notes already in the target state", () => {
    const notes: Note[] = [
      makeNote({ id: "a", status: "Done", lastUpdated: NOW - 8 * DAY }),
      makeNote({ id: "b", status: "Done", lastUpdated: NOW - 8 * DAY, archived: true }),
    ];
    const result = notesToActOn(notes, archiveAfter7Days, NOW);
    expect(result.map((n) => n.id)).toEqual(["a"]);
  });
});

describe("actionChangesNote", () => {
  it("returns false when archiving an already-archived note", () => {
    expect(actionChangesNote(makeNote({ archived: true }), { type: "archive" })).toBe(false);
  });

  it("treats external actions as always changing", () => {
    expect(actionChangesNote(makeNote(), { type: "webhook" })).toBe(true);
    expect(actionChangesNote(makeNote(), { type: "checklist-add" })).toBe(true);
    expect(actionChangesNote(makeNote(), { type: "checklist-complete" })).toBe(true);
  });
});

describe("applyActionToNote", () => {
  it("produces an archive patch", () => {
    const patch = applyActionToNote(makeNote(), { type: "archive" });
    expect(patch?.archived).toBe(true);
    expect(typeof patch?.archived_at).toBe("string");
  });

  it("adds a tag without duplicating", () => {
    const patch = applyActionToNote(makeNote({ tags: ["a"] }), {
      type: "add-tag",
      value: "b",
    });
    expect(patch?.tags).toEqual(["a", "b"]);
  });

  it("returns null for external actions", () => {
    expect(applyActionToNote(makeNote(), { type: "webhook", value: "https://x" })).toBeNull();
  });

  it("returns null for a no-op set-status", () => {
    expect(
      applyActionToNote(makeNote({ status: "Done" }), { type: "set-status", value: "Done" })
    ).toBeNull();
  });
});

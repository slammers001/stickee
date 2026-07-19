import { describe, expect, it } from "vitest";
import { applyMarkdownFormat, getMarkdownShortcut } from "./markdown";

const shortcut = (
  overrides: Partial<KeyboardEvent> & Pick<KeyboardEvent, "key">
) =>
  getMarkdownShortcut({
    key: overrides.key,
    code: overrides.code || "",
    ctrlKey: overrides.ctrlKey || false,
    metaKey: overrides.metaKey || false,
    shiftKey: overrides.shiftKey || false,
  });

describe("applyMarkdownFormat", () => {
  it("wraps a selection in bold Markdown and preserves the selection", () => {
    expect(applyMarkdownFormat("hello world", 6, 11, "bold")).toEqual({
      value: "hello **world**",
      selectionStart: 8,
      selectionEnd: 13,
    });
  });

  it("inserts useful placeholder text for an empty selection", () => {
    expect(applyMarkdownFormat("", 0, 0, "link")).toEqual({
      value: "[link text](https://)",
      selectionStart: 1,
      selectionEnd: 10,
    });
  });

  it("prefixes every selected line in a multiline checklist", () => {
    expect(applyMarkdownFormat("first\nsecond", 0, 12, "check-list").value).toBe(
      "- [ ] first\n- [ ] second"
    );
  });

  it("numbers every selected line in order", () => {
    expect(applyMarkdownFormat("first\nsecond", 0, 12, "numbered-list").value).toBe(
      "1. first\n2. second"
    );
  });
});

describe("getMarkdownShortcut", () => {
  it("supports Control shortcuts", () => {
    expect(shortcut({ key: "b", ctrlKey: true })).toBe("bold");
    expect(shortcut({ key: "i", ctrlKey: true })).toBe("italic");
    expect(shortcut({ key: "k", ctrlKey: true })).toBe("link");
  });

  it("supports macOS Meta shortcuts", () => {
    expect(shortcut({ key: "b", metaKey: true })).toBe("bold");
  });

  it("recognizes shifted digit shortcuts by physical key code", () => {
    expect(shortcut({ key: "&", code: "Digit7", ctrlKey: true, shiftKey: true })).toBe(
      "numbered-list"
    );
    expect(shortcut({ key: "*", code: "Digit8", ctrlKey: true, shiftKey: true })).toBe(
      "bullet-list"
    );
    expect(shortcut({ key: "(", code: "Digit9", ctrlKey: true, shiftKey: true })).toBe(
      "check-list"
    );
  });

  it("ignores formatting keys without Control or Meta", () => {
    expect(shortcut({ key: "b" })).toBeNull();
  });
});

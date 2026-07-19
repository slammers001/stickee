export type MarkdownFormat =
  | "bold"
  | "italic"
  | "link"
  | "code"
  | "heading"
  | "bullet-list"
  | "numbered-list"
  | "check-list";

interface MarkdownEdit {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

const wrapSelection = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string,
  placeholder: string
): MarkdownEdit => {
  const selected = value.slice(selectionStart, selectionEnd) || placeholder;
  const replacement = `${before}${selected}${after}`;

  return {
    value: `${value.slice(0, selectionStart)}${replacement}${value.slice(selectionEnd)}`,
    selectionStart: selectionStart + before.length,
    selectionEnd: selectionStart + before.length + selected.length,
  };
};

const prefixLines = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefixForIndex: (index: number) => string
): MarkdownEdit => {
  const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const nextLineBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
  const block = value.slice(lineStart, lineEnd) || "List item";
  const lines = block.split("\n");
  const replacement = lines
    .map((line, index) => `${prefixForIndex(index)}${line}`)
    .join("\n");
  const prefixLength = prefixForIndex(0).length;

  return {
    value: `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`,
    selectionStart: lineStart + prefixLength,
    selectionEnd: lineStart + replacement.length,
  };
};

export const applyMarkdownFormat = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  format: MarkdownFormat
): MarkdownEdit => {
  switch (format) {
    case "bold":
      return wrapSelection(value, selectionStart, selectionEnd, "**", "**", "bold text");
    case "italic":
      return wrapSelection(value, selectionStart, selectionEnd, "_", "_", "italic text");
    case "link":
      return wrapSelection(value, selectionStart, selectionEnd, "[", "](https://)", "link text");
    case "code":
      return wrapSelection(value, selectionStart, selectionEnd, "`", "`", "code");
    case "heading":
      return prefixLines(value, selectionStart, selectionEnd, () => "## ");
    case "bullet-list":
      return prefixLines(value, selectionStart, selectionEnd, () => "- ");
    case "numbered-list":
      return prefixLines(value, selectionStart, selectionEnd, (index) => `${index + 1}. `);
    case "check-list":
      return prefixLines(value, selectionStart, selectionEnd, () => "- [ ] ");
  }
};

export const getMarkdownShortcut = (
  event: Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "metaKey" | "shiftKey">
): MarkdownFormat | null => {
  if (!event.ctrlKey && !event.metaKey) return null;

  const key = event.key.toLowerCase();
  if (key === "b" && !event.shiftKey) return "bold";
  if (key === "i" && !event.shiftKey) return "italic";
  if (key === "k" && !event.shiftKey) return "link";
  if (key === "`" && !event.shiftKey) return "code";
  if (event.shiftKey && (event.code === "Digit7" || key === "7" || key === "&")) {
    return "numbered-list";
  }
  if (event.shiftKey && (event.code === "Digit8" || key === "8" || key === "*")) {
    return "bullet-list";
  }
  if (event.shiftKey && (event.code === "Digit9" || key === "9" || key === "(")) {
    return "check-list";
  }

  return null;
};

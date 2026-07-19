import { useRef, useState } from "react";
import {
  IconBold,
  IconBrackets,
  IconCheckbox,
  IconEye,
  IconH2,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
  IconPencil,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/MarkdownContent";
import {
  applyMarkdownFormat,
  getMarkdownShortcut,
  type MarkdownFormat,
} from "@/utils/markdown";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  minHeightClassName?: string;
  autoFocus?: boolean;
  onSaveShortcut?: () => void;
}

const TOOLBAR_ITEMS = [
  { format: "bold" as const, label: "Bold", shortcut: "Ctrl+B", icon: IconBold },
  { format: "italic" as const, label: "Italic", shortcut: "Ctrl+I", icon: IconItalic },
  { format: "heading" as const, label: "Heading", shortcut: "", icon: IconH2 },
  { format: "link" as const, label: "Link", shortcut: "Ctrl+K", icon: IconLink },
  { format: "code" as const, label: "Inline code", shortcut: "Ctrl+`", icon: IconBrackets },
  { format: "bullet-list" as const, label: "Bulleted list", shortcut: "Ctrl+Shift+8", icon: IconList },
  { format: "numbered-list" as const, label: "Numbered list", shortcut: "Ctrl+Shift+7", icon: IconListNumbers },
  { format: "check-list" as const, label: "Checklist", shortcut: "Ctrl+Shift+9", icon: IconCheckbox },
];

export function MarkdownEditor({
  value,
  onChange,
  maxLength = 1500,
  minHeightClassName = "min-h-[180px]",
  autoFocus,
  onSaveShortcut,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const applyFormat = (format: MarkdownFormat) => {
    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? value.length;
    const selectionEnd = textarea?.selectionEnd ?? value.length;
    const edit = applyMarkdownFormat(value, selectionStart, selectionEnd, format);

    if (edit.value.length > maxLength) return;

    setPreview(false);
    onChange(edit.value);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onSaveShortcut?.();
      return;
    }

    if (event.key.toLowerCase() === "p" && (event.ctrlKey || event.metaKey) && event.shiftKey) {
      event.preventDefault();
      setPreview((current) => !current);
      return;
    }

    const format = getMarkdownShortcut(event.nativeEvent);
    if (format) {
      event.preventDefault();
      applyFormat(format);
    }
  };

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-1.5">
        {TOOLBAR_ITEMS.map(({ format, label, shortcut, icon: FormatIcon }) => (
          <Button
            key={format}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-background"
            onClick={() => applyFormat(format)}
            aria-label={shortcut ? `${label} (${shortcut})` : label}
            title={shortcut ? `${label} (${shortcut})` : label}
          >
            <FormatIcon stroke={2} className="h-4 w-4" />
          </Button>
        ))}
        <div className="ml-auto flex items-center rounded-md border border-border bg-background p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-7 gap-1.5 px-2", !preview && "bg-muted")}
            onClick={() => setPreview(false)}
            aria-pressed={!preview}
          >
            <IconPencil stroke={2} className="h-3.5 w-3.5" />
            Write
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-7 gap-1.5 px-2", preview && "bg-muted")}
            onClick={() => setPreview(true)}
            aria-pressed={preview}
          >
            <IconEye stroke={2} className="h-3.5 w-3.5" />
            Preview
          </Button>
        </div>
      </div>

      {preview ? (
        <div className={cn("overflow-y-auto p-3", minHeightClassName)}>
          {value.trim() ? (
            <MarkdownContent content={value} className="font-handwriting text-lg" />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            if (event.target.value.length <= maxLength) onChange(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "resize-none rounded-none border-0 font-handwriting text-lg shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white dark:placeholder:text-gray-400",
            minHeightClassName
          )}
          placeholder="Type Markdown here..."
          autoFocus={autoFocus}
        />
      )}
    </div>
  );
}

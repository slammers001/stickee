import { useEffect, useState } from "react";
import { Bell, BellOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fromLocalInputValue, reminderPresets, toLocalInputValue } from "@/utils/reminderTime";
import type { ReminderRepeat } from "@/types/note";

const repeats: { value: ReminderRepeat; label: string }[] = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

interface ReminderEditorProps {
  /** Current reminder time as an ISO UTC string (null = no reminder) */
  value: string | null;
  repeat: ReminderRepeat;
  onChange: (value: string | null, repeat: ReminderRepeat) => void;
  /** When provided the editor saves explicitly instead of only editing a draft */
  onSave?: (remindAt: string | null, repeat: ReminderRepeat) => void | Promise<void>;
  saving?: boolean;
  compact?: boolean;
  className?: string;
}

export function ReminderEditor({
  value,
  repeat,
  onChange,
  onSave,
  saving = false,
  compact = false,
  className,
}: ReminderEditorProps) {
  const [repeatMenuOpen, setRepeatMenuOpen] = useState(false);

  useEffect(() => {
    if (!repeatMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-reminder-repeat]')) {
        setRepeatMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [repeatMenuOpen]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(fromLocalInputValue(e.target.value), repeat);
  };

  const handleClear = () => {
    onChange(null, "none");
    onSave?.(null, "none");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {!compact && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bell strokeWidth={2} className="h-4 w-4" />
            Reminder
          </div>
          {value && (
            <span className="text-xs text-muted-foreground">
              {new Date(value).toLocaleString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="datetime-local"
          value={value ? toLocalInputValue(value) : ""}
          onChange={handleDateChange}
          className="w-auto min-w-[200px] flex-1"
          aria-label="Reminder date and time"
        />
        <div className="relative w-28 shrink-0" data-reminder-repeat>
          <button
            type="button"
            aria-label="Reminder repeat"
            aria-haspopup="listbox"
            aria-expanded={repeatMenuOpen}
            onClick={() => setRepeatMenuOpen((current) => !current)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-0"
          >
            <span>{repeats.find((option) => option.value === repeat)?.label ?? "Once"}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {repeatMenuOpen && (
            <div
              role="listbox"
              aria-label="Reminder repeat"
              className="absolute bottom-0 left-0 z-50 w-full rounded-md border bg-popover p-1 shadow-lg"
            >
              {repeats.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={repeat === option.value}
                  onClick={() => {
                    onChange(value, option.value);
                    setRepeatMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    repeat === option.value && "bg-accent text-accent-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!compact && reminderPresets().map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(preset.value, repeat)}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}

        {onSave && value && (
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => onSave?.(value, repeat)}
          >
            {saving ? "Saving..." : "Set reminder"}
          </Button>
        )}

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <BellOff strokeWidth={2} className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

import { Bell, BellOff } from "lucide-react";
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
  className?: string;
}

export function ReminderEditor({
  value,
  repeat,
  onChange,
  onSave,
  saving = false,
  className,
}: ReminderEditorProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(fromLocalInputValue(e.target.value), repeat);
  };

  const handleRepeatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(value, e.target.value as ReminderRepeat);
  };

  const handleClear = () => {
    onChange(null, "none");
    onSave?.(null, "none");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bell stroke={2} className="h-4 w-4" />
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

      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="datetime-local"
          value={value ? toLocalInputValue(value) : ""}
          onChange={handleDateChange}
          className="w-auto min-w-[200px] flex-1"
          aria-label="Reminder date and time"
        />
        <select
          value={repeat}
          onChange={handleRepeatChange}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-0"
          aria-label="Reminder repeat"
        >
          {repeats.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {reminderPresets().map((preset) => (
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
            <BellOff stroke={2} className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

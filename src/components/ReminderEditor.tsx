import { useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fromLocalInputValue, reminderPresets } from "@/utils/reminderTime";
import type { ReminderRepeat } from "@/types/note";

const repeats: { value: ReminderRepeat; label: string }[] = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const pad2 = (value: number) => String(value).padStart(2, "0");
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));

  const selectedDate = value ? new Date(value) : null;
  const activeDate =
    selectedDate && !Number.isNaN(selectedDate.getTime()) ? selectedDate : null;
  const selectedTime = activeDate
    ? `${pad2(activeDate.getHours())}:${pad2(activeDate.getMinutes())}`
    : "09:00";
  const calendarLabel = activeDate
    ? `${activeDate.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
      })} · ${activeDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
    : "Pick date & time";

  useEffect(() => {
    if (!calendarOpen && !repeatMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (calendarOpen && !event.target.closest('[data-reminder-calendar]')) {
        setCalendarOpen(false);
      }
      if (repeatMenuOpen && !event.target.closest('[data-reminder-repeat]')) {
        setRepeatMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [calendarOpen, repeatMenuOpen]);

  const commitDate = (date: Date, time = selectedTime) => {
    const local = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${time}`;
    onChange(fromLocalInputValue(local), repeat);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.value) return;
    commitDate(activeDate ?? new Date(), event.target.value);
  };

  const handleClear = () => {
    onChange(null, "none");
    onSave?.(null, "none");
    setCalendarOpen(false);
    setRepeatMenuOpen(false);
  };

  const monthStart = startOfMonth(viewMonth);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - monthStart.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  return (
    <div className={cn("space-y-2", className)}>
      {!compact && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bell strokeWidth={2} className="h-4 w-4" />
            Reminder
          </div>
          {activeDate && (
            <span className="text-xs text-muted-foreground">
              {activeDate.toLocaleString(undefined, {
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
        <div className="relative min-w-[200px] flex-1" data-reminder-calendar>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={calendarOpen}
            aria-label={`Reminder date and time: ${calendarLabel}`}
            onClick={() => {
              if (!calendarOpen && activeDate) {
                setViewMonth(startOfMonth(activeDate));
              }
              setCalendarOpen((current) => !current);
            }}
            className={cn(
              "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-0",
              !activeDate && "text-muted-foreground"
            )}
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span className="truncate">{calendarLabel}</span>
            <Clock className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
          {calendarOpen && (
            <div
              role="dialog"
              aria-label="Choose reminder date and time"
              className="absolute bottom-0 left-0 z-50 w-[19rem] rounded-xl border bg-popover p-3 shadow-xl"
            >
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() =>
                    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium">
                  {viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </span>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() =>
                    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
                {weekdays.map((weekday) => (
                  <div key={weekday}>{weekday}</div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarDays.map((date) => {
                  const isCurrentMonth = date.getMonth() === viewMonth.getMonth();
                  const isSelected = activeDate ? sameLocalDay(date, activeDate) : false;
                  const isToday = sameLocalDay(date, new Date());
                  return (
                    <button
                      key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                      type="button"
                      onClick={() => commitDate(date)}
                      className={cn(
                        "h-8 rounded-md text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
                        !isCurrentMonth && "text-muted-foreground/50",
                        isToday && "ring-1 ring-primary/40",
                        isSelected &&
                          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      )}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-2 border-t pt-3">
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={handleTimeChange}
                  className="reminder-time-input h-9 w-28"
                  aria-label="Reminder time"
                />
                <Button
                  type="button"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setCalendarOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>

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
        {!compact &&
          reminderPresets().map((preset) => (
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

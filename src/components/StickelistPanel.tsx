import { useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChecklistItem } from "@/types/checklist";
import type { ReminderItem } from "@/services/reminderService";
import { formatReminderDate, formatReminderTime, isOverdue, isToday } from "@/utils/reminderTime";
import { cn } from "@/lib/utils";

interface StickelistPanelProps {
  items: ChecklistItem[];
  loading: boolean;
  reminders: ReminderItem[];
  remindersLoading: boolean;
  onAdd: (text: string, date?: string) => Promise<boolean | void> | boolean | void;
  onToggle: (id: string) => Promise<void> | void;
  onUpdate: (id: string, text: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onOpenReminderNote?: (noteId: string) => void;
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad2 = (value: number) => String(value).padStart(2, "0");
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const toTaskDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).toISOString();
const reminderTitle = (reminder: ReminderItem) =>
  reminder.title || reminder.content.slice(0, 40) || "Untitled reminder";
const reminderTone = (reminder: ReminderItem) => {
  if (reminder.state !== "pending") return "completed" as const;
  if (isOverdue(reminder.effectiveAt)) return "overdue" as const;
  if (isToday(reminder.effectiveAt)) return "today" as const;
  return "upcoming" as const;
};
const reminderChipClasses = (tone: ReturnType<typeof reminderTone>) =>
  cn(
    "truncate rounded px-1.5 py-0.5 text-[10px] leading-4",
    tone === "overdue" && "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    tone === "today" && "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    (tone === "upcoming" || tone === "completed") && "bg-muted text-muted-foreground",
    tone === "completed" && "line-through"
  );

export function StickelistPanel({
  items,
  loading,
  reminders,
  remindersLoading,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  onOpenReminderNote,
}: StickelistPanelProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [newTaskText, setNewTaskText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const tasksByDay = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of items) {
      const rawDate = item.createdAt ?? item.created_at;
      if (!rawDate) continue;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) continue;
      const key = dateKey(date);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [items]);

  const remindersByDay = useMemo(() => {
    const map = new Map<string, ReminderItem[]>();
    for (const reminder of reminders) {
      const date = new Date(reminder.effectiveAt);
      if (Number.isNaN(date.getTime())) continue;
      const key = dateKey(date);
      map.set(key, [...(map.get(key) ?? []), reminder]);
    }
    return map;
  }, [reminders]);

  const selectedTasks = tasksByDay.get(dateKey(selectedDate)) ?? [];
  const selectedReminders = remindersByDay.get(dateKey(selectedDate)) ?? [];
  const isLoading = loading || remindersLoading;

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const gridStart = new Date(monthStart);
    gridStart.setDate(1 - monthStart.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [viewMonth]);

  const handleSelectDay = (date: Date) => {
    setSelectedDate(date);
    if (date.getMonth() !== viewMonth.getMonth() || date.getFullYear() !== viewMonth.getFullYear()) {
      setViewMonth(startOfMonth(date));
    }
  };

  const handleAddTask = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = newTaskText.trim();
    if (!text) return;
    const added = await onAdd(text, toTaskDate(selectedDate));
    if (added === false) return;
    setNewTaskText("");
  };

  const handleStartEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEdit = async (id: string) => {
    const text = editingText.trim();
    if (!text) return;
    await onUpdate(id, text);
    setEditingId(null);
    setEditingText("");
  };

  const handleEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (event.key === "Enter") {
      void handleSaveEdit(id);
    } else if (event.key === "Escape") {
      setEditingId(null);
      setEditingText("");
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">StickeeList</h1>
          <p className="text-sm text-muted-foreground">Plan tasks on a calendar.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          {items.length} {items.length === 1 ? "task" : "tasks"}
          {reminders.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              {reminders.length} {reminders.length === 1 ? "reminder" : "reminders"}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() =>
                setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
              }
            >
              <ChevronLeft />
            </Button>
            <div className="text-center">
              <div className="font-semibold">
                {viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </div>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
                  setViewMonth(startOfMonth(now));
                }}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Today
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() =>
                setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
              }
            >
              <ChevronRight />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekdays.map((weekday) => (
              <div
                key={weekday}
                className="pb-2 text-center text-xs font-medium text-muted-foreground"
              >
                {weekday}
              </div>
            ))}
            {calendarDays.map((date) => {
              const key = dateKey(date);
              const dayTasks = tasksByDay.get(key) ?? [];
              const dayReminders = remindersByDay.get(key) ?? [];
              const visibleReminders = dayReminders.slice(0, 2);
              const visibleTasks = dayTasks.slice(0, dayReminders.length > 0 ? 2 : 3);
              const hiddenCount =
                dayTasks.length -
                visibleTasks.length +
                (dayReminders.length - visibleReminders.length);
              const isCurrentMonth = date.getMonth() === viewMonth.getMonth();
              const isSelected = sameLocalDay(date, selectedDate);
              const isToday = sameLocalDay(date, today);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectDay(date)}
                  className={cn(
                    "min-h-[92px] rounded-lg border p-2 text-left transition-colors hover:bg-accent/60",
                    !isCurrentMonth && "opacity-55",
                    isToday && !isSelected && "border-primary/40",
                    isSelected && "border-primary bg-primary/5 ring-1 ring-primary"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      isToday && "bg-primary text-primary-foreground"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <div className="mt-1 space-y-1">
                    {visibleReminders.map((reminder) => {
                      const tone = reminderTone(reminder);
                      return (
                        <div
                          key={`reminder-${reminder.id}`}
                          title={`${reminderTitle(reminder)} - ${formatReminderDate(reminder.effectiveAt)}`}
                          className={cn(reminderChipClasses(tone), "flex items-center gap-1")}
                        >
                          {tone === "overdue" ? (
                            <BellRing className="h-2.5 w-2.5 shrink-0" />
                          ) : (
                            <Bell className="h-2.5 w-2.5 shrink-0" />
                          )}
                          <span className="truncate">{reminderTitle(reminder)}</span>
                          <span className="ml-auto shrink-0 opacity-70">
                            {formatReminderTime(reminder.effectiveAt)}
                          </span>
                        </div>
                      );
                    })}
                    {visibleTasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "truncate rounded bg-muted px-1.5 py-0.5 text-[10px] leading-4",
                          task.completed && "text-muted-foreground line-through"
                        )}
                      >
                        {task.text}
                      </div>
                    ))}
                    {hiddenCount > 0 && (
                      <div className="text-[10px] text-muted-foreground">+{hiddenCount} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="flex h-fit flex-col rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="font-semibold">
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <p className="text-xs text-muted-foreground">
              {selectedTasks.length} {selectedTasks.length === 1 ? "task" : "tasks"} ·{" "}
              {selectedReminders.length} {selectedReminders.length === 1 ? "reminder" : "reminders"}{" "}
              on this date
            </p>
          </div>

          <form onSubmit={handleAddTask} className="mb-4 flex gap-2">
            <Input
              value={newTaskText}
              onChange={(event) => setNewTaskText(event.target.value)}
              placeholder="Add a task"
              aria-label="New task"
            />
            <Button type="submit" size="icon" aria-label="Add task">
              <Plus />
            </Button>
          </form>

          <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                {selectedReminders.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Bell className="h-3.5 w-3.5" />
                      Reminders
                    </h3>
                    {selectedReminders.map((reminder) => {
                      const tone = reminderTone(reminder);
                      const noteId = reminder.noteId;
                      return (
                        <div
                          key={`reminder-${reminder.id}`}
                          className={cn(
                            "flex items-start gap-2 rounded-lg border bg-background p-2",
                            tone === "overdue" && "border-red-300 dark:border-red-900",
                            tone === "today" && "border-amber-300 dark:border-amber-900",
                            tone === "completed" && "opacity-70"
                          )}
                        >
                          {tone === "overdue" || tone === "today" ? (
                            <BellRing
                              className={cn(
                                "mt-0.5 h-4 w-4 shrink-0",
                                tone === "overdue" ? "text-red-500" : "text-amber-500"
                              )}
                            />
                          ) : (
                            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "truncate text-sm",
                                  tone === "completed" && "text-muted-foreground line-through"
                                )}
                              >
                                {reminderTitle(reminder)}
                              </span>
                              {reminder.repeat !== "none" && (
                                <span className="shrink-0 text-[10px] capitalize text-muted-foreground">
                                  {reminder.repeat}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span
                                className={cn(
                                  tone === "overdue" && "font-semibold text-red-500"
                                )}
                              >
                                {tone === "overdue" ? "Overdue - " : ""}
                                {formatReminderDate(reminder.effectiveAt)}
                              </span>
                            </div>
                          </div>
                          {onOpenReminderNote && noteId && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              title="Open note"
                              aria-label="Open note"
                              onClick={() => onOpenReminderNote(noteId)}
                            >
                              <ExternalLink />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </section>
                )}

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground">Tasks</h3>
                  {selectedTasks.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No tasks on this date.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 rounded-lg border bg-background p-2"
                        >
                          <button
                            type="button"
                            aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
                            onClick={() => void onToggle(task.id)}
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                              task.completed
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input hover:border-primary"
                            )}
                          >
                            {task.completed && <Check className="h-3 w-3" />}
                          </button>

                          {editingId === task.id ? (
                            <>
                              <Input
                                autoFocus
                                value={editingText}
                                onChange={(event) => setEditingText(event.target.value)}
                                onKeyDown={(event) => handleEditKeyDown(event, task.id)}
                                className="h-8 flex-1"
                                aria-label="Edit task"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Cancel edit"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingText("");
                                }}
                              >
                                <X />
                              </Button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(task)}
                                className={cn(
                                  "flex-1 truncate text-left text-sm hover:text-primary",
                                  task.completed && "text-muted-foreground line-through"
                                )}
                              >
                                {task.text}
                              </button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Edit task"
                                onClick={() => handleStartEdit(task)}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Delete task"
                                onClick={() => void onDelete(task.id)}
                              >
                                <Trash2 />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

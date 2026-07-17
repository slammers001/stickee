import { useEffect, useState } from "react";
import { IconPlus, IconX } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  ActionType,
  Automation,
  AutomationAction,
  AutomationCondition,
  AutomationExecutor,
  ConditionField,
  ConditionOperator,
  NewAutomation,
  TriggerType,
} from "@/types/automation";
import {
  ACTION_LABELS,
  CONDITION_FIELD_LABELS,
  EXTERNAL_ACTIONS,
  NOTE_STATUSES,
  OPERATOR_LABELS,
  TRIGGER_LABELS,
} from "@/types/automation";

interface AutomationBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: Automation | null;
  onCreate: (automation: NewAutomation) => Promise<Automation | null>;
  onUpdate: (id: string, updates: Partial<NewAutomation>) => Promise<Automation | null>;
}

const COLORS = ["yellow", "pink", "blue", "green", "purple", "orange", "teal", "lavender", "peach", "mint"];

const selectClass =
  "h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// A rule that touches only internal, plaintext columns can run server-side.
// Anything matching title/content text, or with an external action, must run
// in-app (the cron path can't read encrypted text or call third parties).
const canRunOnPostgres = (
  conditions: AutomationCondition[],
  actions: AutomationAction[]
): boolean => {
  const textCondition = conditions.some(
    (c) => c.field === "title" || c.field === "content"
  );
  const externalAction = actions.some((a) => EXTERNAL_ACTIONS.includes(a.type));
  return !textCondition && !externalAction;
};

const emptyCondition = (): AutomationCondition => ({
  field: "status",
  operator: "equals",
  value: "Done",
});

const emptyAction = (): AutomationAction => ({ type: "archive" });

const DEFAULT_TRIGGER: TriggerType = "schedule";

export function AutomationBuilderDialog({
  open,
  onOpenChange,
  automation,
  onCreate,
  onUpdate,
}: AutomationBuilderDialogProps) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<TriggerType>(DEFAULT_TRIGGER);
  const [conditions, setConditions] = useState<AutomationCondition[]>([emptyCondition()]);
  const [actions, setActions] = useState<AutomationAction[]>([emptyAction()]);
  const [executor, setExecutor] = useState<AutomationExecutor>("client");
  const [saving, setSaving] = useState(false);

  // Load the automation being edited (or reset for a new one) when opened.
  useEffect(() => {
    if (!open) return;
    if (automation) {
      setName(automation.name);
      setTrigger(automation.trigger?.type ?? DEFAULT_TRIGGER);
      setConditions(
        automation.conditions.length ? automation.conditions : [emptyCondition()]
      );
      setActions(automation.actions.length ? automation.actions : [emptyAction()]);
      setExecutor(automation.executor);
    } else {
      setName("");
      setTrigger(DEFAULT_TRIGGER);
      setConditions([emptyCondition()]);
      setActions([emptyAction()]);
      setExecutor("client");
    }
  }, [open, automation]);

  // Keep executor honest: force in-app whenever the rule can't run server-side.
  const postgresAllowed = canRunOnPostgres(conditions, actions);
  useEffect(() => {
    if (!postgresAllowed && executor === "postgres") setExecutor("client");
  }, [postgresAllowed, executor]);

  const updateCondition = (index: number, patch: Partial<AutomationCondition>) => {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  };

  const updateAction = (index: number, patch: Partial<AutomationAction>) => {
    setActions((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  };

  const needsValue = (type: ActionType) =>
    [
      "set-status",
      "add-tag",
      "remove-tag",
      "set-color",
      "checklist-add",
      "checklist-complete",
      "webhook",
    ].includes(type);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Give your automation a name");
      return;
    }
    if (actions.length === 0) {
      toast.error("Add at least one action");
      return;
    }

    const payload: NewAutomation = {
      name: name.trim(),
      enabled: automation?.enabled ?? true,
      executor,
      trigger: { type: trigger, cadence: trigger === "schedule" ? "daily" : "on-change" },
      conditions,
      actions,
    };

    setSaving(true);
    try {
      if (automation) {
        const updated = await onUpdate(automation.id, payload);
        if (!updated) throw new Error("Supabase did not return the updated automation");
        toast.success("Automation saved to Supabase");
      } else {
        const created = await onCreate(payload);
        if (!created) throw new Error("Supabase did not return the created automation");
        toast.success("Automation saved to Supabase");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving automation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save automation to Supabase"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-handwriting text-2xl">
            {automation ? "Edit automation" : "New automation"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="automation-name">Name</Label>
            <Input
              id="automation-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Archive completed notes after 7 days"
              maxLength={80}
            />
          </div>

          {/* Trigger */}
          <div className="space-y-1.5">
            <Label>When</Label>
            <select
              className={cn(selectClass, "w-full")}
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as TriggerType)}
            >
              {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map((t) => (
                <option key={t} value={t}>
                  {TRIGGER_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Conditions */}
          <div className="space-y-2">
            <Label>Only if</Label>
            {conditions.map((condition, index) => (
              <ConditionRow
                key={index}
                condition={condition}
                onChange={(patch) => updateCondition(index, patch)}
                onRemove={
                  conditions.length > 1
                    ? () => setConditions((prev) => prev.filter((_, i) => i !== index))
                    : undefined
                }
              />
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="automation-button"
              onClick={() => setConditions((prev) => [...prev, emptyCondition()])}
            >
              <IconPlus stroke={2} className="h-4 w-4 mr-1" />
              Add condition
            </Button>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Label>Then</Label>
            {actions.map((action, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  className={cn(selectClass, "flex-1")}
                  value={action.type}
                  onChange={(e) =>
                    updateAction(index, { type: e.target.value as ActionType, value: undefined })
                  }
                >
                  {(Object.keys(ACTION_LABELS) as ActionType[]).map((t) => (
                    <option key={t} value={t}>
                      {ACTION_LABELS[t]}
                    </option>
                  ))}
                </select>

                {needsValue(action.type) && (
                  <ActionValueInput
                    action={action}
                    onChange={(value) => updateAction(index, { value })}
                  />
                )}

                {actions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="automation-button"
                    aria-label="Remove action"
                    onClick={() => setActions((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <IconX stroke={2} className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="automation-button"
              onClick={() => setActions((prev) => [...prev, emptyAction()])}
            >
              <IconPlus stroke={2} className="h-4 w-4 mr-1" />
              Add action
            </Button>
          </div>

          {/* Execution engine */}
          <div className="space-y-1.5">
            <Label>Run this rule</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <EngineOption
                active={executor === "client"}
                title="In the app"
                description="Runs while Stickee is open. Needed for text matching and external actions."
                onClick={() => setExecutor("client")}
              />
              <EngineOption
                active={executor === "postgres"}
                title="On the server (cron)"
                description="Runs even when the app is closed. Internal, status/date/tag rules only."
                onClick={() => postgresAllowed && setExecutor("postgres")}
                disabled={!postgresAllowed}
              />
            </div>
            {!postgresAllowed && (
              <p className="text-xs text-muted-foreground">
                Server execution is unavailable because this rule matches note
                text or uses an external action.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="automation-button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="automation-button-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : automation ? "Save changes" : "Create automation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConditionRow({
  condition,
  onChange,
  onRemove,
}: {
  condition: AutomationCondition;
  onChange: (patch: Partial<AutomationCondition>) => void;
  onRemove?: () => void;
}) {
  const operatorsForField = (field: ConditionField): ConditionOperator[] => {
    switch (field) {
      case "ageDays":
        return ["gte", "lte"];
      case "tag":
        return ["includes", "not-equals"];
      case "title":
      case "content":
        return ["contains", "not-equals"];
      default:
        return ["equals", "not-equals"];
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className={cn(selectClass, "flex-1")}
        value={condition.field}
        onChange={(e) => {
          const field = e.target.value as ConditionField;
          const ops = operatorsForField(field);
          onChange({ field, operator: ops[0], value: "" });
        }}
      >
        {(Object.keys(CONDITION_FIELD_LABELS) as ConditionField[]).map((f) => (
          <option key={f} value={f}>
            {CONDITION_FIELD_LABELS[f]}
          </option>
        ))}
      </select>

      <select
        className={cn(selectClass, "w-28")}
        value={condition.operator}
        onChange={(e) => onChange({ operator: e.target.value as ConditionOperator })}
      >
        {operatorsForField(condition.field).map((op) => (
          <option key={op} value={op}>
            {OPERATOR_LABELS[op]}
          </option>
        ))}
      </select>

      <ConditionValueInput condition={condition} onChange={(value) => onChange({ value })} />

      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="automation-button"
          aria-label="Remove condition"
          onClick={onRemove}
        >
          <IconX stroke={2} className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function ConditionValueInput({
  condition,
  onChange,
}: {
  condition: AutomationCondition;
  onChange: (value: string) => void;
}) {
  if (condition.field === "status") {
    return (
      <select
        className={cn(selectClass, "flex-1")}
        value={condition.value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {NOTE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    );
  }

  if (condition.field === "color") {
    return (
      <select
        className={cn(selectClass, "flex-1")}
        value={condition.value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {COLORS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Input
      className="flex-1"
      type={condition.field === "ageDays" ? "number" : "text"}
      min={condition.field === "ageDays" ? 0 : undefined}
      value={condition.value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={
        condition.field === "ageDays"
          ? "7"
          : condition.field === "tag"
          ? "shopping"
          : "value"
      }
    />
  );
}

function ActionValueInput({
  action,
  onChange,
}: {
  action: AutomationAction;
  onChange: (value: string) => void;
}) {
  if (action.type === "set-status") {
    return (
      <select
        className={cn(selectClass, "flex-1")}
        value={action.value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {NOTE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    );
  }

  if (action.type === "set-color") {
    return (
      <select
        className={cn(selectClass, "flex-1")}
        value={action.value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {COLORS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Input
      className="flex-1"
      value={action.value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={
        action.type === "webhook"
          ? "https://…"
          : action.type === "checklist-add"
          ? "Task text (optional — defaults to note title)"
          : action.type === "checklist-complete"
          ? "Task text to complete (optional — defaults to note title)"
          : action.type === "add-tag" || action.type === "remove-tag"
          ? "shopping"
          : "value"
      }
    />
  );
}

function EngineOption({
  active,
  title,
  description,
  onClick,
  disabled,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex-1 text-left rounded-md border p-3 transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/60",
        disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
      )}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
    </button>
  );
}

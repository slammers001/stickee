import { useState } from "react";
import {
  IconBolt,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { describeAutomation } from "@/utils/automationEngine";
import type { Automation, NewAutomation } from "@/types/automation";
import { AutomationBuilderDialog } from "@/components/AutomationBuilderDialog";

interface AutomationsPanelProps {
  automations: Automation[];
  loading: boolean;
  loadError?: string | null;
  disabled?: boolean;
  onCreate: (automation: NewAutomation) => Promise<Automation | null>;
  onUpdate: (id: string, updates: Partial<NewAutomation>) => Promise<Automation | null>;
  onToggle: (id: string, enabled: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRunAll: () => Promise<number>;
}

export function AutomationsPanel({
  automations,
  loading,
  loadError,
  disabled,
  onCreate,
  onUpdate,
  onToggle,
  onDelete,
  onRunAll,
}: AutomationsPanelProps) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [running, setRunning] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setBuilderOpen(true);
  };

  const openEdit = (automation: Automation) => {
    setEditing(automation);
    setBuilderOpen(true);
  };

  const handleRunAll = async () => {
    setRunning(true);
    try {
      const changed = await onRunAll();
      if (changed > 0) {
        toast.success(
          `Automations updated ${changed} note${changed === 1 ? "" : "s"} in Supabase`
        );
      } else {
        toast("No matching notes to update");
      }
    } catch (error) {
      console.error("Error running automations:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not run automations"
      );
    } finally {
      setRunning(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await onToggle(id, enabled);
    } catch (error) {
      console.error("Error toggling automation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update automation in Supabase"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      toast.success("Automation deleted");
    } catch (error) {
      console.error("Error deleting automation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not delete automation from Supabase"
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <IconBolt stroke={2} className="h-4 w-4 text-foreground" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Automations
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold font-handwriting leading-tight">
              Put your notes on autopilot
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Build simple <strong>when&nbsp;this&nbsp;→&nbsp;do&nbsp;that</strong> rules.
              Example: archive a note that&apos;s been <em>Done</em> for 7 days.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              className="automation-button"
              onClick={handleRunAll}
              disabled={disabled || running || automations.length === 0}
            >
              <IconPlayerPlay stroke={2} className="h-4 w-4 mr-2" />
              {running ? "Running…" : "Run now"}
            </Button>
            <Button type="button" className="automation-button-primary" onClick={openCreate} disabled={disabled}>
              <IconPlus stroke={2} className="h-4 w-4 mr-2" />
              New automation
            </Button>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-semibold">Could not load automations from Supabase</p>
          <p className="mt-1 opacity-90">{loadError}</p>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading automations…</p>
      ) : automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center border border-dashed border-border rounded-lg py-16 px-6">
          <IconBolt stroke={1.5} className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-xl font-semibold font-handwriting mb-1">
            No automations yet
          </h3>
          <p className="text-muted-foreground max-w-sm mb-5">
            Create your first rule to automatically archive, tag, or route your
            notes without lifting a finger. Rules are saved to Supabase.
          </p>
          <Button type="button" className="automation-button-primary" onClick={openCreate} disabled={disabled}>
            <IconPlus stroke={2} className="h-4 w-4 mr-2" />
            New automation
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((automation) => (
            <article
              key={automation.id}
              className={cn(
                "flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4",
                "dark:bg-[hsl(var(--sidebar-background))] dark:border-[hsl(var(--sidebar-border))]",
                !automation.enabled && "opacity-60"
              )}
            >
              <button
                type="button"
                onClick={() => openEdit(automation)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{automation.name}</h3>
                  <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-border text-muted-foreground shrink-0">
                    {automation.executor === "postgres" ? "Server" : "In-app"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {describeAutomation(automation)}
                </p>
                {automation.last_status && (
                  <p className="text-xs text-muted-foreground/80 mt-1 truncate">
                    Last run: {automation.last_status}
                    {automation.last_run_at
                      ? ` · ${new Date(automation.last_run_at).toLocaleString()}`
                      : ""}
                  </p>
                )}
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="sr-only">Enable automation</span>
                  <span
                    role="switch"
                    aria-checked={automation.enabled}
                    tabIndex={0}
                    onClick={() => handleToggle(automation.id, !automation.enabled)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggle(automation.id, !automation.enabled);
                      }
                    }}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      automation.enabled ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                        automation.enabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="automation-button"
                  aria-label="Delete automation"
                  onClick={() => handleDelete(automation.id)}
                >
                  <IconTrash stroke={2} className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AutomationBuilderDialog
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        automation={editing}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </div>
  );
}

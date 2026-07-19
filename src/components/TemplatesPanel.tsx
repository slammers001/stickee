import {
  IconBriefcase,
  IconBug,
  IconBulb,
  IconCalendarWeek,
  IconChecklist,
  IconHeart,
  IconPlus,
  IconRepeat,
  IconScale,
  IconTemplate,
  IconUsers,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NoteStatus } from "@/components/StickyNote";

const TEMPLATE_ICONS = {
  meeting: IconUsers,
  todo: IconChecklist,
  "brain-dump": IconBulb,
  weekly: IconCalendarWeek,
  gratitude: IconHeart,
  bug: IconBug,
  project: IconBriefcase,
  habit: IconRepeat,
  decision: IconScale,
} as const;

export interface NoteTemplate {
  id: keyof typeof TEMPLATE_ICONS;
  title: string;
  description: string;
  color: string;
  status: NoteStatus;
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "meeting",
    title: "Meeting Notes",
    description: "Attendees, agenda, and action items.",
    color: "blue",
    status: "To-Do",
    content:
      "**Attendees**\n- \n\n**Agenda**\n1. \n\n**Notes**\n- \n\n**Action Items**\n- [ ] ",
  },
  {
    id: "todo",
    title: "To-Do List",
    description: "A simple checklist-style sticky.",
    color: "green",
    status: "To-Do",
    content: "**Today**\n- [ ] \n- [ ] \n- [ ] \n\n**Later**\n- [ ] ",
  },
  {
    id: "brain-dump",
    title: "Brain Dump",
    description: "Empty your head onto a note.",
    color: "yellow",
    status: "Backlog",
    content: "**What's on my mind**\n\n\n**Ideas**\n- \n\n**Worries**\n- ",
  },
  {
    id: "weekly",
    title: "Weekly Plan",
    description: "Goals for the week ahead.",
    color: "purple",
    status: "Doing",
    content:
      "**This week's focus**\n\n**Mon**\n- \n\n**Tue**\n- \n\n**Wed**\n- \n\n**Thu**\n- \n\n**Fri**\n- \n\n**Wins**\n- ",
  },
  {
    id: "gratitude",
    title: "Gratitude",
    description: "Three things you're grateful for.",
    color: "pink",
    status: "Done",
    content: "**Today I'm grateful for**\n1. \n2. \n3. \n\n**Why it mattered**\n",
  },
  {
    id: "bug",
    title: "Bug Report",
    description: "Capture a bug before it escapes.",
    color: "orange",
    status: "To-Do",
    content:
      "**Summary**\n\n**Steps to reproduce**\n1. \n2. \n3. \n\n**Expected**\n\n**Actual**\n\n**Notes**\n",
  },
  {
    id: "project",
    title: "Project Brief",
    description: "Define a project before the work begins.",
    color: "teal",
    status: "Backlog",
    content:
      "**Project**\n\n**Goal**\n\n**Who it's for**\n\n**Key deliverables**\n- [ ] \n- [ ] \n\n**Deadline**\n\n**First step**\n- [ ] ",
  },
  {
    id: "habit",
    title: "Habit Tracker",
    description: "Keep a small daily habit moving.",
    color: "mint",
    status: "Doing",
    content:
      "**Habit**\n\n**Why it matters**\n\n**This week**\n- [ ] Mon\n- [ ] Tue\n- [ ] Wed\n- [ ] Thu\n- [ ] Fri\n- [ ] Sat\n- [ ] Sun\n\n**Notes**\n",
  },
  {
    id: "decision",
    title: "Decision Log",
    description: "Record a choice and the reasoning behind it.",
    color: "lavender",
    status: "Done",
    content:
      "**Decision**\n\n**Options considered**\n1. \n2. \n3. \n\n**What we chose**\n\n**Why**\n\n**Review date**\n",
  },
];

const colorMap: Record<string, string> = {
  yellow: "bg-[#f3e9bd]",
  pink: "bg-[#f0dce2]",
  blue: "bg-[#d3e6ed]",
  green: "bg-[#d7e8d8]",
  purple: "bg-[#e2daed]",
  orange: "bg-[#f1dfd1]",
  teal: "bg-[#d2e8e5]",
  lavender: "bg-[#e3dff0]",
  peach: "bg-[#f2dfd5]",
  mint: "bg-[#d7eadf]",
};

interface TemplatesPanelProps {
  onAddTemplate: (template: NoteTemplate) => void;
  disabled?: boolean;
}

export function TemplatesPanel({ onAddTemplate, disabled }: TemplatesPanelProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 mb-3">
          <IconTemplate stroke={2} className="h-4 w-4 text-foreground" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Templates
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold font-handwriting leading-tight">
          Start from a sticky template
        </h2>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Pick a layout, drop it on your board, and fill in the blanks. Same sticky vibe — less blank-page dread.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {NOTE_TEMPLATES.map((template) => {
          const TemplateIcon = TEMPLATE_ICONS[template.id];
          return (
            <article
              key={template.id}
              className={cn(
                "relative flex flex-col justify-between p-5 min-h-[220px] border-0 text-zinc-900",
                "rounded-sm shadow-[var(--shadow-sticky)] transition-all duration-200",
                "hover:shadow-[var(--shadow-sticky-hover)] hover:-translate-y-0.5",
                colorMap[template.color] || colorMap.yellow
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-black/10 bg-white/60">
                    <TemplateIcon stroke={2} className="h-6 w-6 text-zinc-900" />
                  </span>
                  <span className="text-[10px] uppercase tracking-widest bg-white/55 border border-black/10 px-2 py-0.5 rounded text-zinc-700">
                    {template.status}
                  </span>
                </div>
                <h3 className="text-2xl font-bold font-handwriting leading-tight mb-1">
                  {template.title}
                </h3>
                <p className="text-sm text-zinc-700 font-sans">
                  {template.description}
                </p>
              </div>

              <Button
                type="button"
                disabled={disabled}
                onClick={() => onAddTemplate(template)}
                className="template-use-button mt-5 w-full border border-black/15 bg-white/65 text-zinc-900 hover:bg-white/90 font-handwriting text-lg"
                variant="outline"
              >
                <IconPlus stroke={2.25} className="h-5 w-5 mr-2 text-zinc-900" />
                Add Template
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

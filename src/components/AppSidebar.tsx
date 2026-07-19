import {
  IconArrowLeft,
  IconArrowRight,
  IconDiamond,
  IconLayoutBoard,
  IconTemplate,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type SidebarTab = "board" | "templates";

interface AppSidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const NAV = [
  {
    id: "board" as const,
    label: "Board",
    icon: IconLayoutBoard,
    description: "Your sticky notes",
  },
  {
    id: "templates" as const,
    label: "Templates",
    icon: IconTemplate,
    description: "Ready-made note layouts",
  },
];

export function AppSidebar({
  activeTab,
  onTabChange,
  collapsed,
  onCollapsedChange,
}: AppSidebarProps) {
  return (
    <>
      {!collapsed && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => onCollapsedChange(true)}
        />
      )}

      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-40 h-screen flex flex-col",
          "border-r border-border bg-card text-card-foreground",
          "dark:bg-[hsl(var(--sidebar-background))] dark:border-[hsl(var(--sidebar-border))]",
          "transition-[width,transform] duration-200 ease-out",
          collapsed
            ? "w-[4.25rem] -translate-x-full md:translate-x-0"
            : "w-60 translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-border py-4 dark:border-[hsl(var(--sidebar-border))]",
            collapsed ? "justify-center px-2" : "gap-2 px-3"
          )}
        >
          {collapsed ? (
            <button
              type="button"
              className="group relative hidden h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
              onClick={() => onCollapsedChange(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <img
                src="./stickee.png"
                alt=""
                className="h-9 w-9 object-contain icon-crisp no-select transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0"
              />
              <IconArrowRight
                stroke={2}
                className="pointer-events-none absolute h-5 w-5 text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              />
            </button>
          ) : (
            <img
              src="./stickee.png"
              alt=""
              className="h-9 w-9 object-contain icon-crisp no-select shrink-0"
            />
          )}
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-handwriting text-xl leading-none font-bold truncate">
                Stickee
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                Menu
              </p>
            </div>
          )}
          {!collapsed && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="ml-auto hidden h-8 w-8 border-border bg-background hover:bg-muted md:inline-flex"
              onClick={() => onCollapsedChange(true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <IconArrowLeft stroke={2} className="h-5 w-5 text-foreground" />
            </Button>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <p
            className={cn(
              "px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground",
              collapsed && "sr-only"
            )}
          >
            Navigate
          </p>
          {NAV.map((item) => {
            const active = activeTab === item.id;
            const NavIcon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  if (window.innerWidth < 768) onCollapsedChange(true);
                }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-md border px-2.5 py-2.5 text-left transition-colors",
                  "font-handwriting text-lg leading-none",
                  active
                    ? "border-border bg-muted text-foreground shadow-sm dark:bg-[hsl(var(--sidebar-accent))] dark:border-[hsl(var(--sidebar-border))]"
                    : "border-transparent bg-transparent text-foreground/80 hover:bg-muted/70 hover:text-foreground dark:hover:bg-[hsl(var(--sidebar-accent))]/70"
                )}
                title={item.label}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background shrink-0",
                    active && "border-foreground/20 bg-background"
                  )}
                >
                  <NavIcon stroke={2} className="h-5 w-5 text-foreground" />
                </span>
                {!collapsed && (
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{item.label}</span>
                    <span className="block text-xs text-muted-foreground font-sans mt-0.5 truncate">
                      {item.description}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 dark:border-[hsl(var(--sidebar-border))]">
          {!collapsed ? (
            <p className="text-[11px] text-muted-foreground font-handwriting leading-snug">
              Sticky notes, but make them stick.
            </p>
          ) : (
            <IconDiamond
              stroke={2}
              className="h-4 w-4 mx-auto text-muted-foreground opacity-70"
            />
          )}
        </div>
      </aside>
    </>
  );
}

import { cn } from '@/lib/utils';
import { 
  StickyNote, 
  Share2, 
  MessageSquare, 
  CheckSquare, 
  Archive, 
  Settings, 
  Bug,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onToggleCollapse: () => void;
}

const sidebarItems = [
  {
    id: 'notes',
    label: 'My Notes',
    icon: StickyNote,
  },
  {
    id: 'shared',
    label: 'Shared Notes',
    icon: Share2,
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
  },
  {
    id: 'checklist',
    label: 'Checklist',
    icon: CheckSquare,
  },
  {
    id: 'archived',
    label: 'Archived',
    icon: Archive,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
  },
  {
    id: 'report',
    label: 'Report Issue',
    icon: Bug,
  },
];

export function Sidebar({ isOpen, isCollapsed, onToggle, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-card border-r shadow-lg z-50 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64", // Dynamic width
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0" // Always visible on desktop
      )}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <img 
                src="./stickee.png" 
                alt="Stickee" 
                className="h-8 w-8 object-contain"
              />
              <h1 className="text-xl font-bold font-handwriting">Stickee</h1>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            {/* Collapse Button (Desktop only) */}
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex group p-2 rounded-md hover:bg-[hsl(var(--note-pink))] dark:hover:bg-[hsl(var(--note-pink)/0.8)] transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-black dark:text-white transition-colors" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-black dark:text-white transition-colors" />
              )}
            </button>
            
            {/* Mobile Close Button */}
            <button
              onClick={onToggle}
              className="md:hidden group p-2 rounded-md hover:bg-[hsl(var(--note-pink))] dark:hover:bg-[hsl(var(--note-pink)/0.8)] transition-colors"
            >
              <X className="h-5 w-5 text-black dark:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  className={cn(
                    "group w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    "hover:bg-[hsl(var(--note-pink))] dark:hover:bg-[hsl(var(--note-pink)/0.8)]",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0 text-black dark:text-white transition-colors" />
                  {!isCollapsed && <span className="text-black dark:text-white transition-colors">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground">
              Made by{" "}
              <a 
                href="https://github.com/slammers001" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                slammers001
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import { cn } from '@/lib/utils';
import { 
  StickyNote, 
  Share2, 
  MessageSquare, 
  CheckSquare, 
  Archive, 
  Settings, 
  Bug,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
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

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
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
        "fixed left-0 top-0 h-full bg-card border-r shadow-lg z-50 transition-transform duration-300 ease-in-out",
        "w-64", // Fixed width
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0" // Always visible on desktop
      )}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <img 
              src="./stickee.png" 
              alt="Stickee" 
              className="h-8 w-8 object-contain"
            />
            <h1 className="text-xl font-bold font-handwriting">Stickee</h1>
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={onToggle}
            className="md:hidden p-2 rounded-md hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">
            Made by{" "}
            <a 
              href="https://github.com/slammers001" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              slammers001
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

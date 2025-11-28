import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type NoteStatus = "To-Do" | "Doing" | "Done";

interface StickyNoteProps {
  content: string;
  color: string;
  status: NoteStatus;
  index: number;
  lastUpdated: number;
  pinned: boolean;
  onClick: () => void;
  onTogglePin: () => void;
}

const colorMap: Record<string, string> = {
  yellow: "bg-[hsl(var(--note-yellow))]",
  pink: "bg-[hsl(var(--note-pink))]",
  blue: "bg-[hsl(var(--note-blue))]",
  green: "bg-[hsl(var(--note-green))]",
  purple: "bg-[hsl(var(--note-purple))]",
  orange: "bg-[hsl(var(--note-orange))]",
  teal: "bg-[hsl(var(--note-teal))]",
  lavender: "bg-[hsl(var(--note-lavender))]",
  peach: "bg-[hsl(var(--note-peach))]",
  mint: "bg-[hsl(var(--note-mint))]",
};

const statusColors: Record<NoteStatus, string> = {
  "To-Do": "bg-red-100 text-red-800 border-red-200",
  "Doing": "bg-blue-100 text-blue-800 border-blue-200",
  "Done": "bg-green-100 text-green-800 border-green-200",
};

export const StickyNote = ({ content, color, status, index, lastUpdated, pinned, onClick, onTogglePin }: StickyNoteProps) => {
  // Generate varied rotation based on index for more natural look
  const rotations = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
  const rotation = rotations[index % rotations.length];
  
  // Limit to 10 lines
  const lines = content.split('\n');
  const limitedLines = lines.slice(0, 10);
  const displayContent = limitedLines.length < lines.length 
    ? limitedLines.join('\n') + '...' 
    : content;
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
  
  return (
    <Card
      className={cn(
        "p-5 w-full aspect-square max-w-[280px] mx-auto flex flex-col justify-between",
        "transition-all duration-200 hover:scale-105 cursor-pointer",
        "border-0 animate-in fade-in-0 zoom-in-95 relative",
        "before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-16 before:h-6",
        "before:bg-background/40 before:shadow-sm before:-translate-y-2 before:rounded-sm",
        colorMap[color]
      )}
      style={{
        transform: `rotate(${rotation}deg)`,
        boxShadow: "var(--shadow-sticky)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-sticky-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-sticky)";
      }}
      onClick={onClick}
    >
      <div className="flex-1">
        <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap break-words font-handwriting font-semibold">
          {displayContent}
        </p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <Badge variant="outline" className={cn("text-xs font-handwriting", statusColors[status])}>
          {status}
        </Badge>
        <span className="text-xs text-foreground/60 font-handwriting">{formatTime(lastUpdated)}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
        className={cn(
          "absolute top-3 right-3 w-6 h-6 rounded-full transition-all",
          pinned ? "text-red-500" : "text-foreground/40 hover:text-foreground/70"
        )}
        aria-label={pinned ? "Unpin note" : "Pin note"}
      >
        📌
      </button>
    </Card>
  );
};

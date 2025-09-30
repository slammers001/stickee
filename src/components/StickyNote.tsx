import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type NoteStatus = "To-Do" | "Doing" | "Done";

interface StickyNoteProps {
  content: string;
  color: string;
  status: NoteStatus;
  index: number;
  onClick: () => void;
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

export const StickyNote = ({ content, color, status, index, onClick }: StickyNoteProps) => {
  // Generate varied rotation based on index for more natural look
  const rotations = [-6, -3, -1, 0, 2, 4, 6, -4, 3, -2];
  const rotation = rotations[index % rotations.length];
  
  // Truncate content for preview
  const displayContent = content.length > 120 ? content.substring(0, 120) + "..." : content;
  
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
      <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap break-words font-handwriting font-semibold">
        {displayContent}
      </p>
      <Badge variant="outline" className={cn("self-start mt-2 text-xs font-handwriting", statusColors[status])}>
        {status}
      </Badge>
    </Card>
  );
};

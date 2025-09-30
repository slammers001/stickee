import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StickyNoteProps {
  content: string;
  color: string;
  index: number;
}

const colorMap: Record<string, string> = {
  yellow: "bg-[hsl(var(--note-yellow))]",
  pink: "bg-[hsl(var(--note-pink))]",
  blue: "bg-[hsl(var(--note-blue))]",
  green: "bg-[hsl(var(--note-green))]",
  purple: "bg-[hsl(var(--note-purple))]",
};

export const StickyNote = ({ content, color, index }: StickyNoteProps) => {
  const rotation = (index % 3) - 1; // -1, 0, or 1 degree rotation for variety
  
  return (
    <Card
      className={cn(
        "p-6 w-full h-48 flex items-start justify-start",
        "transition-all duration-200 hover:scale-105 cursor-pointer",
        "border-0 animate-in fade-in-0 zoom-in-95",
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
    >
      <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap break-words font-medium">
        {content}
      </p>
    </Card>
  );
};

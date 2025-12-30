import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Pin, Smile } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";
import { ReactionSummary } from "@/types/emojiReaction";
import { toggleReaction } from "@/services/emojiReactionService";
import { toast } from "sonner";
import { LinkableText } from "./LinkableText";
import { memo } from "react";

export type NoteStatus = 'To-Do' | 'Doing' | 'Done' | 'Backlog';

interface StickyNoteProps {
  id: string;
  title?: string;
  content: string;
  color: string;
  status: NoteStatus;
  index: number;
  lastUpdated: number;
  pinned: boolean;
  reactions?: ReactionSummary[];
  onClick: () => void;
  onTogglePin: () => void;
  onReactionUpdate?: (reactions: ReactionSummary[]) => void;
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
  "Backlog": "bg-gray-100 text-gray-800 border-gray-200",
};

export const StickyNote = memo(({ 
  id, 
  title, 
  content, 
  color, 
  status, 
  pinned, 
  reactions = [], 
  onClick, 
  onTogglePin,
  onReactionUpdate 
}: Omit<StickyNoteProps, 'index' | 'lastUpdated'>) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ x: 0, y: 0 });

  // Generate unique random rotation between -4 and 4 degrees
  const rotation = useMemo(() => {
    // Generate a random angle between 1 and 4 degrees
    const magnitude = Math.random() * 3 + 1; // 1 to 4 degrees
    // Randomly choose left (-) or right (+) direction
    const direction = Math.random() < 0.5 ? -1 : 1;
    return magnitude * direction;
  }, []);
  
  // Limit to 13 lines (primary constraint)
  const displayContent = useMemo(() => {
    const lines = content.split('\n');
    return lines.length > 13 ? lines.slice(0, 13).join('\n') + '...' : content;
  }, [content]);

  const handleEmojiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setEmojiPickerPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = async (emoji: string) => {
    try {
      const updatedReactions = await toggleReaction(id, emoji);
      onReactionUpdate?.(updatedReactions);
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const handleReactionClick = async (emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedReactions = await toggleReaction(id, emoji);
      onReactionUpdate?.(updatedReactions);
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to toggle reaction');
    }
  };

  return (
    <>
      <Card
        className={cn(
          "p-5 w-full aspect-square max-w-[280px] mx-auto flex flex-col justify-between sticky-note",
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
          {title && (
            <h3 className="text-foreground text-xl font-bold mb-2 font-title leading-tight">
              {title.length > 20 ? `${title.substring(0, 20)}...` : title}
            </h3>
          )}
          <LinkableText 
            text={displayContent}
            className="text-foreground text-lg leading-relaxed whitespace-pre-wrap break-words font-handwriting line-clamp-13"
          />
        </div>
        
        {/* Reactions Section */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 mb-2">
            {reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={(e) => handleReactionClick(reaction.emoji, e)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all",
                  "hover:bg-accent active:scale-90",
                  reaction.hasCurrentUserReacted 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {reaction.emoji === 'stickee.png' ? (
                  <img src="/stickee.png" alt="Stickee" className="w-3 h-3" />
                ) : (
                  <span>{reaction.emoji}</span>
                )}
                <span className="text-xs">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline" className={cn("text-xs font-handwriting shrink-0 note-status dark:text-white", statusColors[status])}>
            {status}
          </Badge>
          
          {/* Emoji Reaction Button */}
          <button
            onClick={handleEmojiClick}
            className="p-1 rounded-full hover:bg-accent transition-colors"
            title="Add reaction"
          >
            <Smile size={16} className="text-foreground/60 hover:text-foreground emoji-react-icon" />
          </button>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={cn(
            "absolute top-3 right-3 w-6 h-6 rounded-full transition-all flex items-center justify-center pin-icon",
            "hover:bg-foreground/5 active:scale-90",
            pinned ? "text-red-500" : "text-foreground/40 hover:text-foreground/70"
          )}
          aria-label={pinned ? "Unpin note" : "Pin note"}
        >
          <Pin size={16} fill={pinned ? "currentColor" : "none"} />
        </button>
      </Card>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
          position={emojiPickerPosition}
        />
      )}
    </>
  );
});

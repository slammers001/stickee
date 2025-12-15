import { EmojiReaction, ReactionSummary, EmojiReactionStats } from "@/types/emojiReaction";
import { supabase } from "@/lib/supabase";
import { getUserId } from "./userService";

// Popular emojis for reactions (limited to 5 as requested)
const POPULAR_EMOJIS = ["❤️", "👍", "😊", "🎉", "😂"];
const STICKEE_EMOJI = "stickee.png";

export const getAvailableEmojis = () => {
  return [...POPULAR_EMOJIS, STICKEE_EMOJI];
};

// Add a reaction to a note
export const addReaction = async (noteId: string, emoji: string): Promise<EmojiReaction> => {
  const userId = getUserId();
  
  try {
    const { data, error } = await supabase
      .from("emoji_reactions")
      .insert({
        note_id: noteId,
        emoji: emoji,
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding reaction:", error);
    throw error;
  }
};

// Remove a reaction from a note
export const removeReaction = async (noteId: string, emoji: string): Promise<void> => {
  const userId = getUserId();
  
  try {
    const { error } = await supabase
      .from("emoji_reactions")
      .delete()
      .eq("note_id", noteId)
      .eq("emoji", emoji)
      .eq("user_id", userId);
      
    if (error) throw error;
  } catch (error) {
    console.error("Error removing reaction:", error);
    throw error;
  }
};

// Get all reactions for a note
export const getReactionsForNote = async (noteId: string): Promise<ReactionSummary[]> => {
  try {
    const { data, error } = await supabase
      .from("emoji_reactions")
      .select("*")
      .eq("note_id", noteId);
      
    if (error) throw error;
    
    if (!data || data.length === 0) return [];
    
    const currentUserId = getUserId();
    
    // Group reactions by emoji and count them
    const reactionMap = new Map<string, ReactionSummary>();
    
    data.forEach((reaction: EmojiReaction) => {
      const existing = reactionMap.get(reaction.emoji);
      
      if (existing) {
        existing.count++;
        existing.users.push(reaction.user_id);
        if (reaction.user_id === currentUserId) {
          existing.hasCurrentUserReacted = true;
        }
      } else {
        reactionMap.set(reaction.emoji, {
          emoji: reaction.emoji,
          count: 1,
          users: [reaction.user_id],
          hasCurrentUserReacted: reaction.user_id === currentUserId
        });
      }
    });
    
    return Array.from(reactionMap.values());
  } catch (error) {
    console.error("Error getting reactions:", error);
    return [];
  }
};
// Toggle a reaction (add if not present, remove if present)
export const toggleReaction = async (noteId: string, emoji: string): Promise<ReactionSummary[]> => {
  const currentReactions = await getReactionsForNote(noteId);
  const userReaction = currentReactions.find(r => r.emoji === emoji && r.hasCurrentUserReacted);
  
  if (userReaction) {
    // Remove the reaction
    await removeReaction(noteId, emoji);
  } else {
    // Add the reaction
    await addReaction(noteId, emoji);
  }
  
  // Return updated reactions
  return await getReactionsForNote(noteId);
};

// Check if user has reacted with a specific emoji
export const hasUserReacted = async (noteId: string, emoji: string): Promise<boolean> => {
  const reactions = await getReactionsForNote(noteId);
  const reaction = reactions.find(r => r.emoji === emoji);
  return reaction?.hasCurrentUserReacted || false;
};
// Get reaction statistics for a user
export const getReactionStats = async (userId?: string): Promise<EmojiReactionStats> => {
  const targetUserId = userId || getUserId();
  
  try {
    const { data, error } = await supabase
      .from("emoji_reactions")
      .select("*")
      .eq("user_id", targetUserId);
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        totalReactions: 0,
        uniqueUsers: 0,
        topEmojis: []
      };
    }
    
    // Count reactions by emoji
    const emojiCounts = new Map<string, number>();
    data.forEach((reaction: EmojiReaction) => {
      emojiCounts.set(reaction.emoji, (emojiCounts.get(reaction.emoji) || 0) + 1);
    });
    
    // Sort by count and take top 5
    const topEmojis = Array.from(emojiCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emoji, count]) => ({
        emoji,
        count,
        users: [], // Not needed for stats
        hasCurrentUserReacted: false
      }));
    
    return {
      totalReactions: data.length,
      uniqueUsers: new Set(data.map(r => r.user_id)).size,
      topEmojis
    };
  } catch (error) {
    console.error("Error getting reaction stats:", error);
    return {
      totalReactions: 0,
      uniqueUsers: 0,
      topEmojis: []
    };
  }
};

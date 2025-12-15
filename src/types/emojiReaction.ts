export interface EmojiReaction {
  id: string;
  note_id: string;
  emoji: string;
  user_id: string;
  created_at: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  users: string[]; // Array of user IDs who reacted
  hasCurrentUserReacted: boolean;
}

export interface EmojiReactionStats {
  totalReactions: number;
  uniqueUsers: number;
  topEmojis: ReactionSummary[];
}

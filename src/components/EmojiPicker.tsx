import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAvailableEmojis } from '@/services/emojiReactionService';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export function EmojiPicker({ onSelect, onClose, position }: EmojiPickerProps) {
  const emojis = getAvailableEmojis();

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClickOutside}
    >
      <div 
        className="bg-background border rounded-lg shadow-lg p-3 z-10"
        style={position ? {
          position: 'absolute',
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -100%) translateY(-10px)'
        } : {}}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-3 gap-2">
          {emojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-accent"
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji === 'stickee.png' ? (
                <img 
                  src="/stickee.png" 
                  alt="Stickee" 
                  className="w-5 h-5"
                />
              ) : (
                <span className="text-lg">{emoji}</span>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

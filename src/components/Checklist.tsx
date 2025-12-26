import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Trash2, Plus, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChecklistProps {
  items: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function Checklist({
  items = [],
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  isOpen,
  onToggleOpen,
}: ChecklistProps) {
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  
  // Check if terms are agreed
  const termsAgreed = localStorage.getItem("stickee-terms-agreed") === "true";

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      toast.error("You must agree to the Terms of Service to use the checklist");
      return;
    }
    if (!newItemText.trim()) return;
    onAdd(newItemText);
    setNewItemText('');
  };
  
  const handleToggleOpen = () => {
    if (!termsAgreed) {
      toast.error("You must agree to the Terms of Service to use the checklist");
      return;
    }
    onToggleOpen();
  };
  
  const handleToggle = (id: string) => {
    if (!termsAgreed) {
      toast.error("You must agree to the Terms of Service to use the checklist");
      return;
    }
    onToggle(id);
  };
  
  const handleDelete = (id: string) => {
    if (!termsAgreed) {
      toast.error("You must agree to the Terms of Service to use the checklist");
      return;
    }
    onDelete(id);
  };

  const handleStartEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingText.trim()) return;
    onUpdate(editingId, editingText);
    setEditingId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <Button
        variant="outline"
        size="icon"
        onClick={handleToggleOpen}
        disabled={!termsAgreed}
        className={`
          h-12 w-12 flex items-center justify-center
          bg-[hsl(var(--note-pink))] hover:bg-[hsl(var(--note-pink))]
          text-white rounded-lg transition-all duration-200
          hover:scale-105
          ${isOpen ? 'rotate-180 rounded-full' : 'rotate-0 rounded-lg'}
          transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${!termsAgreed ? 'opacity-50 cursor-not-allowed' : ''}`
        }
        title={!termsAgreed ? "You must agree to Terms of Service to use the checklist" : "Toggle checklist"}
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          {isOpen ? (
            <>
              <div className="absolute w-6 h-0.5 bg-current transform rotate-45"></div>
              <div className="absolute w-6 h-0.5 bg-current transform -rotate-45"></div>
            </>
          ) : (
            <List className="w-5 h-5 text-black" />
          )}
        </div>
      </Button>

      {isOpen && (
        <div className="fixed right-4 bottom-20 z-50 w-80 bg-background rounded-lg shadow-lg border p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-family-handwriting)' }}>StickeeList</h3>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleOpen}
              className="rounded-full h-10 w-10 hover:bg-accent"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </Button>
          </div>
          
          <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
            <Input
              type="text"
              value={newItemText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemText(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1"
              style={{ fontFamily: 'var(--font-family-handwriting)' }}
            />
            <Button type="submit" size="sm" style={{ fontFamily: 'var(--font-family-handwriting)' }}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </form>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4" style={{ fontFamily: 'var(--font-family-handwriting)' }}>
                No tasks yet. Add one above!
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center p-2 rounded hover:bg-gray-100',
                    item.completed && 'opacity-60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center mr-2 flex-shrink-0',
                      item.completed
                        ? 'bg-gray-700 border-gray-700 text-white'
                        : 'border-gray-600 hover:border-gray-700'
                    )}
                  >
                    {item.completed && <Check className="h-3 w-3" />}
                  </button>
                  {editingId === item.id ? (
                    <Input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={handleSaveEdit}
                      className="flex-1 text-sm h-6"
                      style={{ fontFamily: 'var(--font-family-handwriting)' }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className={cn(
                        'flex-1 text-sm cursor-pointer',
                        item.completed && 'line-through text-muted-foreground'
                      )}
                      onClick={() => handleStartEdit(item.id, item.text)}
                      style={{ fontFamily: 'var(--font-family-handwriting)' }}
                    >
                      {item.text}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

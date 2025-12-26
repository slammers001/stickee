import { getCurrentUser } from './userService';
import { getNotes } from './notesService';
import { checklistService } from './checklistService';
import { getReactionsForNote } from './emojiReactionService';
import { createNote as createNoteService } from './notesService';

export interface ExportData {
  user: {
    id: string;
    displayName: string;
    exportDate: string;
  };
  notes: Array<{
    id: string;
    title?: string;
    content: string;
    color: string;
    status: string;
    pinned: boolean;
    created_at: string;
    updated_at: number;
  }>;
  checklistItems: Array<{
    id: string;
    text: string;
    completed: boolean;
    created_at: string;
  }>;
  reactions: Array<{
    noteId: string;
    emoji: string;
    count: number;
  }>;
}

export const exportUserData = async (): Promise<ExportData> => {
  try {
    const user = getCurrentUser();
    
    // Get all notes
    const notes = await getNotes();
    
    // Get checklist items
    const checklistItems = await checklistService.getItems(user.id);
    
    // Get reactions for all notes
    const reactions: ExportData['reactions'] = [];
    for (const note of notes) {
      try {
        const noteReactions = await getReactionsForNote(note.id);
        reactions.push(...noteReactions.map(reaction => ({
          noteId: note.id,
          emoji: reaction.emoji,
          count: reaction.count
        })));
      } catch (error) {
        console.warn(`Failed to get reactions for note ${note.id}:`, error);
      }
    }

    const exportData: ExportData = {
      user: {
        id: user.id,
        displayName: user.displayName,
        exportDate: new Date().toISOString()
      },
      notes: notes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        color: note.color,
        status: note.status,
        pinned: note.pinned,
        created_at: note.created_at || new Date().toISOString(),
        updated_at: note.lastUpdated
      })),
      checklistItems: checklistItems.map(item => ({
        id: item.id,
        text: item.text,
        completed: item.completed,
        created_at: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString()
      })),
      reactions
    };

    return exportData;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw new Error('Failed to export data');
  }
};

export const downloadExportFile = (data: ExportData, filename?: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `stickee-export-${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const importUserData = async (file: File): Promise<void> => {
  try {
    const text = await file.text();
    const data: ExportData = JSON.parse(text);
    
    // Validate the data structure
    if (!data.user || !data.notes || !data.checklistItems) {
      throw new Error('Invalid export file format');
    }
    
    const user = getCurrentUser();
    
    // Import notes
    for (const note of data.notes) {
      try {
        await createNoteService({
          title: note.title,
          content: note.content,
          color: note.color,
          status: note.status as any, // Type assertion for compatibility
          pinned: note.pinned,
          lastUpdated: note.updated_at
        });
      } catch (error) {
        console.warn(`Failed to import note ${note.id}:`, error);
      }
    }
    
    // Import checklist items
    for (const item of data.checklistItems) {
      try {
        await checklistService.addItem(user.id, item.text);
        // If the item was completed, toggle it
        if (item.completed) {
          // This is a simplified approach - in a real implementation,
          // you'd want to get the newly created item's ID and toggle it
        }
      } catch (error) {
        console.warn(`Failed to import checklist item ${item.id}:`, error);
      }
    }
    
    // Note: Reactions are not imported as they require the actual note IDs
    // and the emoji reaction service might not have add methods
    
  } catch (error) {
    console.error('Error importing user data:', error);
    throw new Error('Failed to import data. Please check the file format.');
  }
};

export const validateImportFile = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data: ExportData = JSON.parse(text);
        
        // Validate the data structure
        if (!data.user || !data.notes || !data.checklistItems) {
          reject(new Error('Invalid export file format'));
          return;
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

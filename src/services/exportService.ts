import { getCurrentUser } from './userService';
import { getNotes } from './notesService';
import { getArchivedNotes } from './archiveService';
import { checklistService } from './checklistService';
import { getReactionsForNote } from './emojiReactionService';
import { createNote as createNoteService } from './notesService';
import { archiveNote } from './archiveService';

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
    archived?: boolean;
    archived_at?: string;
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
    const user = await getCurrentUser();
    
    // Get all regular notes
    const notes = await getNotes();
    
    // Get all archived notes
    const archivedNotes = await getArchivedNotes();
    
    // Combine all notes
    const allNotes = [...notes, ...archivedNotes];
    
    // Get checklist items
    const checklistItems = await checklistService.getItems(user.id);
    
    // Get reactions for all notes
    const reactions: ExportData['reactions'] = [];
    for (const note of allNotes) {
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
      notes: allNotes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        color: note.color,
        status: note.status,
        pinned: note.pinned,
        created_at: note.created_at || new Date().toISOString(),
        updated_at: note.lastUpdated,
        archived: note.archived || false,
        archived_at: note.archived_at || undefined
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

/**
 * Error whose message is already safe to show to the user (unlike generic
 * "check the file format" failures).
 */
export class ImportError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Validates a parsed export file. Rejects malformed notes/items (e.g.
 * `notes: [{}]`) so an import can never report success while adding nothing.
 */
export const validateImportData = (data: unknown): ExportData => {
  if (!isRecord(data)) {
    throw new ImportError('Invalid export file format');
  }

  if (!isRecord(data.user)) {
    throw new ImportError('Invalid export file format: missing "user"');
  }

  if (!Array.isArray(data.notes)) {
    throw new ImportError('Invalid export file format: "notes" must be a list');
  }

  if (!Array.isArray(data.checklistItems)) {
    throw new ImportError('Invalid export file format: "checklistItems" must be a list');
  }

  if (data.reactions !== undefined && !Array.isArray(data.reactions)) {
    throw new ImportError('Invalid export file format: "reactions" must be a list');
  }

  data.notes.forEach((note, index) => {
    if (!isRecord(note)) {
      throw new ImportError(`Invalid export file format: note #${index + 1} is not an object`);
    }
    if (typeof note.content !== 'string') {
      throw new ImportError(`Invalid export file format: note #${index + 1} is missing "content"`);
    }
    if (note.title !== undefined && note.title !== null && typeof note.title !== 'string') {
      throw new ImportError(`Invalid export file format: note #${index + 1} has an invalid "title"`);
    }
    if (note.color !== undefined && note.color !== null && typeof note.color !== 'string') {
      throw new ImportError(`Invalid export file format: note #${index + 1} has an invalid "color"`);
    }
    if (note.status !== undefined && note.status !== null && typeof note.status !== 'string') {
      throw new ImportError(`Invalid export file format: note #${index + 1} has an invalid "status"`);
    }
    if (note.pinned !== undefined && note.pinned !== null && typeof note.pinned !== 'boolean') {
      throw new ImportError(`Invalid export file format: note #${index + 1} has an invalid "pinned"`);
    }
  });

  data.checklistItems.forEach((item, index) => {
    if (!isRecord(item)) {
      throw new ImportError(`Invalid export file format: checklist item #${index + 1} is not an object`);
    }
    if (typeof item.text !== 'string' || item.text.trim().length === 0) {
      throw new ImportError(`Invalid export file format: checklist item #${index + 1} is missing "text"`);
    }
    if (item.completed !== undefined && item.completed !== null && typeof item.completed !== 'boolean') {
      throw new ImportError(`Invalid export file format: checklist item #${index + 1} has an invalid "completed"`);
    }
  });

  return data as unknown as ExportData;
};

export const importUserData = async (file: File): Promise<void> => {
  const failures: string[] = [];
  let notesFailed = 0;
  let checklistFailed = 0;
  let totalNotes = 0;
  let totalChecklistItems = 0;

  try {
    const text = await file.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON file');
    }

    const data = validateImportData(parsed);
    totalNotes = data.notes.length;
    totalChecklistItems = data.checklistItems.length;

    const user = await getCurrentUser();
    
    // Import notes
    for (const note of data.notes) {
      try {
        const createdNote = await createNoteService({
          title: note.title,
          content: note.content,
          color: note.color,
          status: note.status as any, // Type assertion for compatibility
          pinned: note.pinned,
          lastUpdated: note.updated_at
        });
        
        // If the note was archived, archive it after creation
        if (note.archived && createdNote) {
          await archiveNote(createdNote.id);
        }
      } catch (error) {
        console.warn(`Failed to import note ${note.id}:`, error);
        failures.push(`note "${note.title || note.id || 'untitled'}"`);
        notesFailed += 1;
      }
    }
    
    // Import checklist items, preserving their completion status
    for (const item of data.checklistItems) {
      try {
        await checklistService.addItem(user.id, item.text, item.completed === true);
      } catch (error) {
        console.warn(`Failed to import checklist item ${item.id}:`, error);
        failures.push(`checklist item "${item.text}"`);
        checklistFailed += 1;
      }
    }
    
    // Note: Reactions are not imported as they require the actual note IDs
    // and the emoji reaction service might not have add methods
    
    if (failures.length > 0) {
      throw new ImportError(
        `Import incomplete: ${totalNotes - notesFailed}/${totalNotes} notes and ` +
        `${totalChecklistItems - checklistFailed}/${totalChecklistItems} checklist items imported. ` +
        `Failed: ${failures.join(', ')}`
      );
    }
  } catch (error) {
    console.error('Error importing user data:', error);
    if (error instanceof ImportError) {
      throw error;
    }
    if (error instanceof Error && error.message === 'Invalid JSON file') {
      throw new ImportError(error.message);
    }
    throw new ImportError('Failed to import data. Please check the file format.');
  }
};

export const validateImportFile = async (file: File): Promise<ExportData> => {
  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new ImportError('Failed to read file');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ImportError('Invalid JSON file');
  }

  return validateImportData(parsed);
};

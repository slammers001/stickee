import { supabase } from '@/lib/supabase';
import { neonAttachments } from '@/lib/neonAttachments';
import { getUserId } from './userService';
import type { NoteAttachment } from '@/types/attachment';

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const ATTACHMENT_COLUMNS = 'id,note_id,user_id,name,path,mime_type,size,created_at';

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export const MISSING_ATTACHMENTS_SETUP_MESSAGE =
  'Attachments are not set up yet. Run supabase/migrations/create_attachments.sql in your Supabase SQL editor.';

const isMissingSetupError = (error: unknown): boolean => {
  const code = (error as { code?: string })?.code;
  const message = String((error as { message?: string })?.message || '');
  return (
    code === '42P01' ||
    code === '42703' ||
    message.includes('attachments') ||
    message.includes('bucket')
  );
};

const withSignedUrl = async (row: NoteAttachment): Promise<NoteAttachment> => {
  try {
    const url = await neonAttachments.signedUrl(row.path, SIGNED_URL_TTL_SECONDS);
    return { ...row, url };
  } catch (error) {
    console.error('Could not create attachment link:', error);
    return row;
  }
};

export const getAttachments = async (noteId: string): Promise<NoteAttachment[]> => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('attachments')
    .select(ATTACHMENT_COLUMNS)
    .eq('note_id', noteId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(isMissingSetupError(error) ? MISSING_ATTACHMENTS_SETUP_MESSAGE : error.message);
  }
  return Promise.all((data ?? []).map(withSignedUrl));
};

export const getAllAttachments = async (limit = 500): Promise<NoteAttachment[]> => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('attachments')
    .select(ATTACHMENT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(isMissingSetupError(error) ? MISSING_ATTACHMENTS_SETUP_MESSAGE : error.message);
  }
  return Promise.all((data ?? []).map(withSignedUrl));
};

export const uploadAttachments = async (noteId: string, files: File[]): Promise<NoteAttachment[]> => {
  if (!files.length) return [];

  for (const file of files) {
    if (file.size <= 0 || file.size > MAX_ATTACHMENT_SIZE) {
      throw new Error(`"${file.name}" must be between 1 byte and 10 MB.`);
    }
  }

  const userId = await getUserId();
  const uploaded: NoteAttachment[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${noteId}/${crypto.randomUUID()}-${safeName}`;

    await neonAttachments.upload(path, file, file.type || 'application/octet-stream');

    const { data, error } = await supabase
      .from('attachments')
      .insert({
        note_id: noteId,
        user_id: userId,
        name: file.name,
        path,
        mime_type: file.type || 'application/octet-stream',
        size: file.size,
      })
      .select(ATTACHMENT_COLUMNS)
      .single();

    if (error) {
      await neonAttachments.remove(path);
      throw error;
    }
    uploaded.push(await withSignedUrl(data));
  }

  return uploaded;
};

export const deleteAttachment = async (attachment: NoteAttachment): Promise<void> => {
  const userId = await getUserId();
  const { error: rowError } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachment.id)
    .eq('user_id', userId);
  if (rowError) throw rowError;

  await neonAttachments.remove(attachment.path);
};

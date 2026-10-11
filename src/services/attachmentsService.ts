import { supabase } from '@/lib/supabase';
import { getUserId } from './userService';
import type { NoteAttachment } from '@/types/attachment';

const BUCKET = 'attachments';

export const getAttachments = async (noteId: string): Promise<NoteAttachment[]> => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('attachments')
    .select('id,note_id,user_id,name,path,mime_type,size,created_at')
    .eq('note_id', noteId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((attachment) => ({
    ...attachment,
    url: supabase.storage.from(BUCKET).getPublicUrl(attachment.path).data.publicUrl,
  }));
};

export const uploadAttachments = async (noteId: string, files: File[]): Promise<NoteAttachment[]> => {
  if (!files.length) return [];
  const userId = await getUserId();
  const uploaded: NoteAttachment[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${noteId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase.from('attachments').insert({
      note_id: noteId,
      user_id: userId,
      name: file.name,
      path,
      mime_type: file.type || 'application/octet-stream',
      size: file.size,
    }).select('id,note_id,user_id,name,path,mime_type,size,created_at').single();
    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw error;
    }
    uploaded.push({ ...data, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl });
  }
  return uploaded;
};

export const deleteAttachment = async (attachment: NoteAttachment) => {
  const userId = await getUserId();
  const { error: rowError } = await supabase.from('attachments').delete().eq('id', attachment.id).eq('user_id', userId);
  if (rowError) throw rowError;
  const { error: fileError } = await supabase.storage.from(BUCKET).remove([attachment.path]);
  if (fileError) throw fileError;
};

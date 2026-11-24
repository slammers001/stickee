import { supabase } from '@/lib/supabase';

const FUNCTION_URL = import.meta.env.VITE_NEON_ATTACHMENTS_FUNCTION_URL || '';

const authHeaders = async (): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('You must be signed in to manage attachments.');
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
};

const sign = async (body: {
  key: string;
  op: 'get' | 'put';
  contentType?: string;
  expiresIn?: number;
}): Promise<string> => {
  if (!FUNCTION_URL) throw new Error('Neon attachment storage is not configured.');
  const response = await fetch(`${FUNCTION_URL}/sign`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || `Neon signer failed (${response.status}).`);
  }
  const data = (await response.json()) as { url?: string };
  if (!data.url) throw new Error('Neon signer returned no URL.');
  return data.url;
};

export const neonAttachments = {
  upload: async (path: string, file: File, contentType: string): Promise<void> => {
    const url = await sign({ key: path, op: 'put', contentType });
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Cache-Control': '3600',
      },
      body: file,
    });
    if (!response.ok) {
      throw new Error(`Neon upload failed (${response.status}).`);
    }
  },

  signedUrl: (path: string, expiresIn = 3600): Promise<string> =>
    sign({ key: path, op: 'get', expiresIn }),

  remove: async (path: string): Promise<void> => {
    if (!FUNCTION_URL) throw new Error('Neon attachment storage is not configured.');
    const response = await fetch(
      `${FUNCTION_URL}/object?key=${encodeURIComponent(path)}`,
      { method: 'DELETE', headers: await authHeaders() },
    );
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error || `Neon delete failed (${response.status}).`);
    }
  },
};

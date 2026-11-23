import { useMemo, useState } from 'react';
import {
  ExternalLink,
  FileArchive,
  FileAudio,
  FileText,
  FileVideo,
  Image as ImageIcon,
  Paperclip,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { NoteAttachment } from '@/types/attachment';

type AttachmentKind = 'images' | 'documents' | 'other';
type SortMode = 'newest' | 'oldest' | 'name' | 'size';

interface AttachmentsPanelProps {
  attachments: NoteAttachment[];
  noteTitles: Record<string, string>;
  loading: boolean;
  onRefresh: () => void;
  onOpenNote: (noteId: string) => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getKind = (mimeType: string): AttachmentKind => {
  if (mimeType.startsWith('image/')) return 'images';
  if (
    mimeType.startsWith('text/') ||
    mimeType.includes('pdf') ||
    mimeType.includes('wordprocessing') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'documents';
  }
  return 'other';
};

const getIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-sky-500" />;
  if (mimeType.startsWith('audio/')) return <FileAudio className="h-4 w-4 text-purple-500" />;
  if (mimeType.startsWith('video/')) return <FileVideo className="h-4 w-4 text-rose-500" />;
  if (mimeType.includes('zip') || mimeType.includes('compressed')) {
    return <FileArchive className="h-4 w-4 text-amber-500" />;
  }
  return <FileText className="h-4 w-4 text-muted-foreground" />;
};

export function AttachmentsPanel({
  attachments,
  noteTitles,
  loading,
  onRefresh,
  onOpenNote,
}: AttachmentsPanelProps) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | AttachmentKind>('all');
  const [sort, setSort] = useState<SortMode>('newest');

  const totalSize = useMemo(
    () => attachments.reduce((sum, attachment) => sum + attachment.size, 0),
    [attachments],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = attachments.filter((attachment) => {
      if (kind !== 'all' && getKind(attachment.mime_type) !== kind) return false;
      if (!needle) return true;
      const noteTitle = noteTitles[attachment.note_id] || '';
      return (
        attachment.name.toLowerCase().includes(needle) ||
        attachment.mime_type.toLowerCase().includes(needle) ||
        noteTitle.toLowerCase().includes(needle)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'size') return b.size - a.size;
      const delta = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sort === 'newest' ? delta : -delta;
    });
  }, [attachments, kind, noteTitles, query, sort]);

  const groups = useMemo(() => {
    const byNote = new Map<string, NoteAttachment[]>();
    for (const attachment of visible) {
      const existing = byNote.get(attachment.note_id);
      if (existing) existing.push(attachment);
      else byNote.set(attachment.note_id, [attachment]);
    }
    return Array.from(byNote.entries());
  }, [visible]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
          Loading attachments...
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-handwriting">Attachments</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {attachments.length} {attachments.length === 1 ? 'file' : 'files'} attached to your notes
              {attachments.length > 0 && ` · ${formatSize(totalSize)} used`}
            </p>
          </div>
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <Paperclip strokeWidth={1.5} className="h-16 w-16 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold text-foreground mb-2 font-handwriting">
              Nothing attached yet
            </h2>
            <p className="text-muted-foreground max-w-md">
              Open a note and attach a file. Everything you attach shows up here.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search files or notes..."
                  aria-label="Search attachments"
                  className="pl-9"
                />
              </div>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as 'all' | AttachmentKind)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-0"
                aria-label="Filter by file type"
              >
                <option value="all">All files</option>
                <option value="images">Images</option>
                <option value="documents">Documents</option>
                <option value="other">Other</option>
              </select>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-0"
                aria-label="Sort attachments"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name</option>
                <option value="size">Largest first</option>
              </select>
            </div>

            {visible.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No files match those filters.</p>
            ) : (
              <div className="space-y-8">
                {groups.map(([noteId, files]) => (
                  <section key={noteId} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="truncate font-handwriting text-lg text-foreground">
                        {noteTitles[noteId] || 'Untitled note'}
                      </h2>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {files.length} {files.length === 1 ? 'file' : 'files'}
                      </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {files.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm"
                        >
                          {attachment.mime_type.startsWith('image/') && attachment.url ? (
                            <img
                              src={attachment.url}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-md border object-cover"
                            />
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                              {getIcon(attachment.mime_type)}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground" title={attachment.name}>
                              {attachment.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatSize(attachment.size)} ·{' '}
                              {new Date(attachment.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              {attachment.url && (
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(
                                    buttonVariants({ variant: 'outline', size: 'sm' }),
                                    'h-7 px-2 text-xs',
                                  )}
                                >
                                  Open
                                </a>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => onOpenNote(noteId)}
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                Open note
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

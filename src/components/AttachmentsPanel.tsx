import { useMemo, useState } from 'react';
import {
  FileArchive,
  FileAudio,
  FileText,
  FileVideo,
  Paperclip,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
  if (mimeType.startsWith('audio/')) return <FileAudio className="h-10 w-10" />;
  if (mimeType.startsWith('video/')) return <FileVideo className="h-10 w-10" />;
  if (mimeType.includes('zip') || mimeType.includes('compressed')) {
    return <FileArchive className="h-10 w-10" />;
  }
  return <FileText className="h-10 w-10" />;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selected = attachments.find((attachment) => attachment.id === selectedId) ?? null;

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
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-foreground font-handwriting">Attachments</h1>
          <Button variant="outline" size="sm" onClick={onRefresh}>
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
              <div className="columns-2 gap-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6">
                {visible.map((attachment) => {
                  const isImage = attachment.mime_type.startsWith('image/') && Boolean(attachment.url);
                  return (
                    <button
                      key={attachment.id}
                      type="button"
                      aria-label={`View ${attachment.name}`}
                      title={attachment.name}
                      onClick={() => setSelectedId(attachment.id)}
                      className="mb-2 block w-full break-inside-avoid rounded-md text-left hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {isImage ? (
                        <img
                          src={attachment.url}
                          alt=""
                          className="block h-auto w-full rounded-md"
                        />
                      ) : (
                        <span className="flex aspect-square w-full items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
                          {getIcon(attachment.mime_type)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <Dialog open onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="truncate">{selected.name}</DialogTitle>
              <DialogDescription>Attachment details</DialogDescription>
            </DialogHeader>

            {selected.mime_type.startsWith('image/') && selected.url && (
              <div className="flex justify-center rounded-md bg-muted/30 p-2">
                <img
                  src={selected.url}
                  alt={selected.name}
                  className="max-h-[55vh] max-w-full object-contain"
                />
              </div>
            )}

            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ['Note', noteTitles[selected.note_id] || 'Untitled note'],
                ['Type', selected.mime_type || 'Unknown'],
                ['Size', formatSize(selected.size)],
                ['Uploaded', formatDate(selected.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 truncate font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  const noteId = selected.note_id;
                  setSelectedId(null);
                  onOpenNote(noteId);
                }}
              >
                Open note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}

import { useRef } from 'react';
import { FileText, Image as ImageIcon, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NoteAttachment } from '@/types/attachment';

interface AttachmentPickerProps {
  pending: File[];
  existing?: NoteAttachment[];
  onChange: (files: File[]) => void;
  onRemoveExisting?: (attachment: NoteAttachment) => void;
  busy?: boolean;
}

export function AttachmentPicker({
  pending,
  existing = [],
  onChange,
  onRemoveExisting,
  busy = false,
}: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = [...pending, ...Array.from(files)].filter(
      (file, index, all) =>
        all.findIndex((candidate) => candidate.name === file.name && candidate.size === file.size) === index,
    );
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="h-4 w-4 mr-2" />
        Attach files
      </Button>

      {(existing.length > 0 || pending.length > 0) && (
        <div className="flex flex-wrap gap-2" aria-label="Attachments">
          {existing.map((file) => (
            <span
              key={file.id}
              className="flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-sm"
            >
              {file.mime_type.startsWith('image/') ? (
                <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="max-w-48 truncate">{file.name}</span>
              {onRemoveExisting && (
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemoveExisting(file)}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </span>
          ))}
          {pending.map((file, index) => (
            <span
              key={`${file.name}-${file.size}`}
              className="flex max-w-full items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-sm"
            >
              {file.type.startsWith('image/') ? (
                <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="max-w-48 truncate">{file.name}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => onChange(pending.filter((_, fileIndex) => fileIndex !== index))}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Images and files up to 10 MB each.</p>
    </div>
  );
}

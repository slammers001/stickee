import { useEffect, useState, useRef } from 'react';
import { FileText, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NoteAttachment } from '@/types/attachment';

interface AttachmentPickerProps {
  pending: File[];
  existing?: NoteAttachment[];
  onChange: (files: File[]) => void;
  onRemoveExisting?: (attachment: NoteAttachment) => void;
  busy?: boolean;
  buttonClassName?: string;
}

export function AttachmentPicker({
  pending,
  existing = [],
  onChange,
  onRemoveExisting,
  busy = false,
  buttonClassName,
}: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const file of pending) {
      if (file.type.startsWith('image/')) {
        next[`${file.name}-${file.size}`] = URL.createObjectURL(file);
      }
    }
    setPreviews(next);
    return () => {
      Object.values(next).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pending]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = [...pending, ...Array.from(files)].filter(
      (file, index, all) =>
        all.findIndex((candidate) => candidate.name === file.name && candidate.size === file.size) === index,
    );
    onChange(next);
  };

  const removeButton = (label: string, onClick: () => void) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="absolute -right-1.5 -top-1.5 rounded-full border bg-background p-0.5 shadow-sm"
    >
      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
    </button>
  );

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
        className={cn("w-fit", buttonClassName)}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="h-4 w-4 mr-2" />
        Attach files
      </Button>

      {(existing.length > 0 || pending.length > 0) && (
        <div className="flex flex-wrap items-start gap-2" aria-label="Attachments">
          {existing.map((file) => {
            if (file.mime_type.startsWith('image/') && file.url) {
              return (
                <div key={file.id} className="relative" title={file.name}>
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-20 w-20 rounded-md border object-cover"
                  />
                  {onRemoveExisting && removeButton(`Remove ${file.name}`, () => onRemoveExisting(file))}
                </div>
              );
            }
            return (
              <span
                key={file.id}
                className="flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-sm"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
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
            );
          })}

          {pending.map((file, index) => {
            const preview = previews[`${file.name}-${file.size}`];
            if (file.type.startsWith('image/') && preview) {
              return (
                <div key={`${file.name}-${file.size}`} className="relative" title={file.name}>
                  <img
                    src={preview}
                    alt={file.name}
                    className="h-20 w-20 rounded-md border object-cover"
                  />
                  {removeButton(`Remove ${file.name}`, () =>
                    onChange(pending.filter((_, fileIndex) => fileIndex !== index)),
                  )}
                </div>
              );
            }
            return (
              <span
                key={`${file.name}-${file.size}`}
                className="flex max-w-full items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-sm"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-48 truncate">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onChange(pending.filter((_, fileIndex) => fileIndex !== index))}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Images and files up to 10 MB each.</p>
    </div>
  );
}

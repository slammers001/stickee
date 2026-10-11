import { useRef } from 'react';
import { Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NoteAttachment } from '@/types/attachment';

interface AttachmentPickerProps {
  pending: File[];
  existing?: NoteAttachment[];
  onChange: (files: File[]) => void;
  onRemoveExisting?: (attachment: NoteAttachment) => void;
}

export function AttachmentPicker({ pending, existing = [], onChange, onRemoveExisting }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = [...pending, ...Array.from(files)].filter((file, index, all) =>
      all.findIndex((candidate) => candidate.name === file.name && candidate.size === file.size) === index,
    );
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      <input ref={inputRef} type="file" multiple className="sr-only" onChange={(event) => addFiles(event.target.files)} />
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => inputRef.current?.click()}>
        <Paperclip data-icon="inline-start" /> Attach files
      </Button>
      {(existing.length > 0 || pending.length > 0) && (
        <div className="flex flex-wrap gap-2" aria-label="Attachments">
          {existing.map((file) => (
            <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="flex max-w-full items-center gap-2 rounded-md border px-2 py-1 text-sm hover:bg-muted">
              {file.mime_type.startsWith('image/') ? <ImageIcon /> : <FileText />}
              <span className="max-w-48 truncate">{file.name}</span>
              {onRemoveExisting && <button type="button" aria-label={`Remove ${file.name}`} onClick={(event) => { event.preventDefault(); onRemoveExisting(file); }}><X /></button>}
            </a>
          ))}
          {pending.map((file, index) => (
            <span key={`${file.name}-${file.size}`} className="flex max-w-full items-center gap-2 rounded-md border bg-muted/50 px-2 py-1 text-sm">
              {file.type.startsWith('image/') ? <ImageIcon /> : <FileText />}
              <span className="max-w-48 truncate">{file.name}</span>
              <button type="button" aria-label={`Remove ${file.name}`} onClick={() => onChange(pending.filter((_, fileIndex) => fileIndex !== index))}><X /></button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Images and files up to 10 MB each.</p>
    </div>
  );
}

import { useState } from "react";
import { IconPlus, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

const normalizeTag = (value: string) =>
  value.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");

export function TagInput({ tags, onChange, maxTags = 10 }: TagInputProps) {
  const [value, setValue] = useState("");

  const addTag = () => {
    const tag = normalizeTag(value);
    if (!tag || tags.includes(tag) || tags.length >= maxTags) return;
    onChange([...tags, tag]);
    setValue("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder="shopping"
          maxLength={30}
        />
        <Button type="button" variant="outline" size="icon" onClick={addTag} aria-label="Add tag">
          <IconPlus stroke={2} className="h-4 w-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-1 text-xs"
            >
              #{tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((item) => item !== tag))}
                className="rounded-full p-0.5 hover:bg-background"
                aria-label={`Remove ${tag} tag`}
              >
                <IconX stroke={2} className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add a tag ({tags.length}/{maxTags}).
      </p>
    </div>
  );
}

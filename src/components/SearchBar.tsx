import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchBar({ onSearch, placeholder = "Search notes...", disabled = false }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={disabled ? "Agree to Terms of Service to search" : placeholder}
        value={query}
        onChange={handleChange}
        disabled={disabled}
        className="pl-10 pr-4 rounded-md focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 !focus:outline-none !focus:ring-0 !focus-visible:outline-none !focus-visible:ring-0"
        style={{
          outline: 'none',
          border: 'none',
          boxShadow: 'none',
        }}
        onFocus={(e) => {
          e.target.style.outline = 'none';
          e.target.style.boxShadow = 'none';
          e.target.style.border = 'none';
        }}
      />
    </div>
  );
}

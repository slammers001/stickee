import type { CSSProperties, MouseEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";
import { openLinkInBrowser } from "@/utils/linkUtils";

interface MarkdownContentProps {
  content: string;
  className?: string;
  style?: CSSProperties;
  compact?: boolean;
}

export function MarkdownContent({
  content,
  className,
  style,
  compact = false,
}: MarkdownContentProps) {
  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>, href?: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (href) void openLinkInBrowser(href);
  };

  return (
    <div
      className={cn(
        "markdown-content break-words text-foreground",
        compact && "markdown-content-compact",
        className
      )}
      style={style}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
              onClick={(event) => handleLinkClick(event, href)}
            >
              {children}
            </a>
          ),
          input: ({ checked, node: _node, ...props }) => (
            <input
              {...props}
              checked={checked}
              readOnly
              className="mr-1.5 h-3.5 w-3.5 accent-current"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

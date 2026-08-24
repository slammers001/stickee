import React, { memo } from 'react';
import { URL_REGEX, normalizeUrl } from '@/utils/linkUtils';

interface LinkableTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

const renderLine = (line: string, lineIndex: number, isLastLine: boolean): React.ReactNode => {
  const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
  const content = headingMatch ? headingMatch[2] : line;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  Array.from(content.matchAll(URL_REGEX)).forEach((match, index) => {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      elements.push(<React.Fragment key={`text-${lineIndex}-${index}`}>{content.slice(lastIndex, matchIndex)}</React.Fragment>);
    }

    const url = match[0];
    const normalizedUrl = normalizeUrl(url);
    elements.push(
      <a
        key={`link-${lineIndex}-${index}`}
        href={normalizedUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          // Keep the link from opening the note editor. Native target=_blank
          // navigation is immediate and works without waiting for Tauri IPC.
          event.stopPropagation();
        }}
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors"
        title={`Open ${normalizedUrl} in a new tab`}
      >
        {url}
      </a>
    );
    lastIndex = matchIndex + url.length;
  });

  if (lastIndex < content.length) {
    elements.push(<React.Fragment key={`text-final-${lineIndex}`}>{content.slice(lastIndex)}</React.Fragment>);
  }

  if (!headingMatch) {
    return <React.Fragment key={`line-${lineIndex}`}>{elements}{!isLastLine && '\n'}</React.Fragment>;
  }

  const Heading = headingMatch[1].length === 1 ? 'h2' : headingMatch[1].length === 2 ? 'h3' : 'h4';
  return (
    <React.Fragment key={`heading-${lineIndex}`}>
      <Heading className="font-title font-bold leading-tight my-1">
        {elements}
      </Heading>
      {!isLastLine && '\n'}
    </React.Fragment>
  );
};

export const LinkableText: React.FC<LinkableTextProps> = memo(({ text, className, style }) => {
  if (!text) return null;

  return (
    <div className={className} style={style}>
      {text.split('\n').map((line, index, lines) => renderLine(line, index, index === lines.length - 1))}
    </div>
  );
});
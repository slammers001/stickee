import React from 'react';
import { URL_REGEX, normalizeUrl, openLinkInBrowser } from '@/utils/linkUtils';

interface LinkableTextProps {
  text: string;
  className?: string;
}

export const LinkableText: React.FC<LinkableTextProps> = ({ text, className }) => {
  if (!text) return null;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  const matches = Array.from(text.matchAll(URL_REGEX));

  matches.forEach((match, index) => {
    // Add text before the link
    if (match.index > lastIndex) {
      elements.push(
        <span key={`text-${index}`}>
          {text.substring(lastIndex, match.index)}
        </span>
      );
    }

    // Add the link
    const url = match[0];
    const normalizedUrl = normalizeUrl(url);
    
    elements.push(
      <a
        key={`link-${index}`}
        href={normalizedUrl}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await openLinkInBrowser(url);
        }}
        className="text-blue-600 hover:text-blue-800 underline cursor-pointer transition-colors"
        title={`Open ${normalizedUrl} in browser`}
      >
        {url}
      </a>
    );

    lastIndex = match.index + url.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(
      <span key="text-final">
        {text.substring(lastIndex)}
      </span>
    );
  }

  return <div className={className}>{elements}</div>;
};

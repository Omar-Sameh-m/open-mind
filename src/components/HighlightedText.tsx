import React from 'react';

interface HighlightedTextProps {
  text: string;
  highlightText: string | null;
  className?: string;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  highlightText,
  className = '',
}) => {
  if (!highlightText || !highlightText.trim()) {
    return <span className={className}>{text}</span>;
  }

  const trimmedHighlight = highlightText.trim();
  const lowerText = text.toLowerCase();
  const lowerHighlight = trimmedHighlight.toLowerCase();
  const index = lowerText.indexOf(lowerHighlight);

  if (index === -1) {
    // If exact case-insensitive substring wasn't found, try words or return normal text
    return <span className={className}>{text}</span>;
  }

  const before = text.slice(0, index);
  const matched = text.slice(index, index + trimmedHighlight.length);
  const after = text.slice(index + trimmedHighlight.length);

  return (
    <span className={className}>
      {before}
      <mark
        id="gemini-highlight-mark"
        className="bg-amber-200/80 text-amber-950 font-semibold px-1 py-0.5 rounded shadow-xs border-b-2 border-amber-500 transition-colors"
      >
        {matched}
      </mark>
      {after}
    </span>
  );
};

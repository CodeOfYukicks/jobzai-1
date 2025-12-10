import { RecordType, RecordCardData } from './RecordCard';

export type ContentSegment = 
  | { type: 'text'; content: string }
  | { type: 'card'; data: RecordCardData };

// Regex to match record card markup: [[type:id:title:subtitle]]
// The subtitle is optional
const RECORD_MARKUP_REGEX = /\[\[(application|job|interview|note|cv):([^:\]]+):([^:\]]+)(?::([^\]]*))?\]\]/g;

/**
 * Parse a message content string and extract record card markup
 * Returns an array of segments (text and cards)
 */
export function parseRecordMarkup(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex lastIndex
  RECORD_MARKUP_REGEX.lastIndex = 0;

  while ((match = RECORD_MARKUP_REGEX.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        segments.push({ type: 'text', content: textBefore });
      }
    }

    // Extract card data from the match
    const [, type, id, title, subtitle] = match;
    
    segments.push({
      type: 'card',
      data: {
        type: type as RecordType,
        id: id.trim(),
        title: title.trim(),
        subtitle: subtitle?.trim() || undefined,
      },
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last match
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText.trim()) {
      segments.push({ type: 'text', content: remainingText });
    }
  }

  // If no matches found, return the original content as a single text segment
  if (segments.length === 0 && content.trim()) {
    segments.push({ type: 'text', content });
  }

  return segments;
}

/**
 * Check if a message content contains any record card markup
 */
export function hasRecordMarkup(content: string): boolean {
  RECORD_MARKUP_REGEX.lastIndex = 0;
  return RECORD_MARKUP_REGEX.test(content);
}

/**
 * Extract all record card data from a message content
 * Useful for analytics or pre-processing
 */
export function extractRecordCards(content: string): RecordCardData[] {
  const cards: RecordCardData[] = [];
  let match: RegExpExecArray | null;

  RECORD_MARKUP_REGEX.lastIndex = 0;

  while ((match = RECORD_MARKUP_REGEX.exec(content)) !== null) {
    const [, type, id, title, subtitle] = match;
    cards.push({
      type: type as RecordType,
      id: id.trim(),
      title: title.trim(),
      subtitle: subtitle?.trim() || undefined,
    });
  }

  return cards;
}

/**
 * Remove all record card markup from content, leaving only the titles
 * Useful for plain text display or search
 */
export function stripRecordMarkup(content: string): string {
  return content.replace(RECORD_MARKUP_REGEX, (_, _type, _id, title) => title);
}


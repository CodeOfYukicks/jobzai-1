/**
 * Parser for [[EDIT_NOTE:action:content]] markup in AI assistant responses
 * This allows the AI to propose direct edits to the user's notes
 */

export interface EditNoteAction {
  action: 'insert' | 'replace';
  content: string;
}

export interface EditNoteSegment {
  type: 'text' | 'edit';
  content?: string;
  editAction?: EditNoteAction;
}

// Regex to match EDIT_NOTE markup: [[EDIT_NOTE:action:content]]
// The content can span multiple lines until the closing ]]
const EDIT_NOTE_REGEX = /\[\[EDIT_NOTE:(insert|replace):([\s\S]*?)\]\]/g;

/**
 * Parse a message content string and extract EDIT_NOTE markup
 * Returns an array of segments (text and edit actions)
 */
export function parseEditNoteMarkup(content: string): EditNoteSegment[] {
  const segments: EditNoteSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex lastIndex
  EDIT_NOTE_REGEX.lastIndex = 0;

  while ((match = EDIT_NOTE_REGEX.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        segments.push({ type: 'text', content: textBefore });
      }
    }

    // Extract edit action data from the match
    const [, action, editContent] = match;
    
    segments.push({
      type: 'edit',
      editAction: {
        action: action as 'insert' | 'replace',
        content: editContent.trim(),
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
 * Check if a message content contains any EDIT_NOTE markup
 */
export function hasEditNoteMarkup(content: string): boolean {
  EDIT_NOTE_REGEX.lastIndex = 0;
  return EDIT_NOTE_REGEX.test(content);
}

/**
 * Extract all edit note actions from a message content
 */
export function extractEditNoteActions(content: string): EditNoteAction[] {
  const actions: EditNoteAction[] = [];
  let match: RegExpExecArray | null;

  EDIT_NOTE_REGEX.lastIndex = 0;

  while ((match = EDIT_NOTE_REGEX.exec(content)) !== null) {
    const [, action, editContent] = match;
    actions.push({
      action: action as 'insert' | 'replace',
      content: editContent.trim(),
    });
  }

  return actions;
}

/**
 * Remove EDIT_NOTE markup from content, keeping only the explanatory text
 */
export function stripEditNoteMarkup(content: string): string {
  EDIT_NOTE_REGEX.lastIndex = 0;
  return content.replace(EDIT_NOTE_REGEX, '').trim();
}




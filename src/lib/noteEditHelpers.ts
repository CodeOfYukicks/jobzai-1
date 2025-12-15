/**
 * Helper functions for AI-powered note editing
 * Provides insert and replace operations for NotionEditor content
 */

/**
 * Insert text at the current cursor position in the editor
 * @param editor - TipTap editor instance
 * @param text - Text to insert
 */
export function insertTextAtCursor(editor: any, text: string): void {
  if (!editor) {
    console.warn('No editor instance provided');
    return;
  }

  try {
    // Get current selection/cursor position
    const { from } = editor.state.selection;
    
    // Insert text at cursor position
    editor
      .chain()
      .focus()
      .insertContentAt(from, text)
      .run();
  } catch (error) {
    console.error('Error inserting text at cursor:', error);
    throw error;
  }
}

/**
 * Replace all content in the editor
 * @param editor - TipTap editor instance
 * @param text - New content to set
 */
export function replaceAllContent(editor: any, text: string): void {
  if (!editor) {
    console.warn('No editor instance provided');
    return;
  }

  try {
    // Clear all content and insert new content
    editor
      .chain()
      .focus()
      .clearContent()
      .insertContent(text)
      .run();
  } catch (error) {
    console.error('Error replacing all content:', error);
    throw error;
  }
}

/**
 * Replace the currently selected text in the editor
 * @param editor - TipTap editor instance
 * @param text - Text to replace selection with
 */
export function replaceSelection(editor: any, text: string): void {
  if (!editor) {
    console.warn('No editor instance provided');
    return;
  }

  try {
    const { from, to } = editor.state.selection;
    
    // If there's a selection, replace it
    if (from !== to) {
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, text)
        .run();
    } else {
      // If no selection, insert at cursor
      insertTextAtCursor(editor, text);
    }
  } catch (error) {
    console.error('Error replacing selection:', error);
    throw error;
  }
}

/**
 * Convert plain text to TipTap JSON format
 * Handles paragraphs, headings, lists, etc.
 * @param text - Plain text or markdown-like text
 * @returns TipTap JSON content
 */
export function textToTipTapJSON(text: string): any {
  const lines = text.split('\n');
  const content: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      // Empty line
      content.push({
        type: 'paragraph',
        content: [],
      });
      continue;
    }

    // Check for headings
    if (trimmed.startsWith('# ')) {
      content.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: trimmed.substring(2) }],
      });
    } else if (trimmed.startsWith('## ')) {
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: trimmed.substring(3) }],
      });
    } else if (trimmed.startsWith('### ')) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: trimmed.substring(4) }],
      });
    }
    // Check for bullet lists
    else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      content.push({
        type: 'bulletList',
        content: [{
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: trimmed.substring(2) }],
          }],
        }],
      });
    }
    // Check for numbered lists
    else if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s/, '');
      content.push({
        type: 'orderedList',
        content: [{
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text }],
          }],
        }],
      });
    }
    // Regular paragraph
    else {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: trimmed }],
      });
    }
  }

  return {
    type: 'doc',
    content,
  };
}






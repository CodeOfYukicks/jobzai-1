/**
 * Converts markdown text to TipTap JSON format
 * Supports: headings, paragraphs, bold, italic, bullet lists, numbered lists, blockquotes, code blocks, tables
 */

interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: (TiptapNode | TiptapMark)[];
  marks?: TiptapMark[];
  text?: string;
}

interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}

interface TextNode {
  type: 'text';
  text: string;
  marks?: TiptapMark[];
}

type ContentNode = TiptapNode | TextNode;

/**
 * Parse inline formatting (bold, italic, code) from text
 */
function parseInlineFormatting(text: string): ContentNode[] {
  const nodes: ContentNode[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      nodes.push({
        type: 'text',
        text: boldMatch[2],
        marks: [{ type: 'bold' }],
      });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    
    // Italic: *text* or _text_ (not ** or __)
    const italicMatch = remaining.match(/^(\*|_)([^*_]+?)\1(?!\1)/);
    if (italicMatch) {
      nodes.push({
        type: 'text',
        text: italicMatch[2],
        marks: [{ type: 'italic' }],
      });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }
    
    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      nodes.push({
        type: 'text',
        text: codeMatch[1],
        marks: [{ type: 'code' }],
      });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }
    
    // Find next special character
    const nextSpecial = remaining.search(/[\*_`]/);
    if (nextSpecial === -1) {
      // No more special characters, add rest as plain text
      if (remaining) {
        nodes.push({ type: 'text', text: remaining });
      }
      break;
    } else if (nextSpecial === 0) {
      // Special character that didn't match a pattern, treat as literal
      nodes.push({ type: 'text', text: remaining[0] });
      remaining = remaining.slice(1);
    } else {
      // Add text up to the special character
      nodes.push({ type: 'text', text: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    }
  }
  
  // Merge adjacent text nodes with same marks
  const merged: ContentNode[] = [];
  for (const node of nodes) {
    const last = merged[merged.length - 1];
    if (last && 'text' in last && 'text' in node) {
      const lastMarks = JSON.stringify(last.marks || []);
      const nodeMarks = JSON.stringify(node.marks || []);
      if (lastMarks === nodeMarks) {
        last.text += node.text;
        continue;
      }
    }
    merged.push(node);
  }
  
  return merged.length > 0 ? merged : [{ type: 'text', text: '' }];
}

/**
 * Parse a table from markdown lines
 */
function parseTable(lines: string[]): TiptapNode | null {
  if (lines.length < 2) return null;
  
  const rows: TiptapNode[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip separator line (|---|---|)
    if (/^\|?[\s\-:|]+\|?$/.test(line)) continue;
    
    // Parse cells
    const cells = line
      .replace(/^\||\|$/g, '') // Remove leading/trailing pipes
      .split('|')
      .map(cell => cell.trim());
    
    const isHeader = i === 0;
    const cellNodes = cells.map(cellText => ({
      type: isHeader ? 'tableHeader' : 'tableCell',
      content: [
        {
          type: 'paragraph',
          content: parseInlineFormatting(cellText),
        },
      ],
    }));
    
    rows.push({
      type: 'tableRow',
      content: cellNodes,
    });
  }
  
  return {
    type: 'table',
    content: rows,
  };
}

/**
 * Main function to convert markdown to TipTap JSON
 */
export function markdownToTiptap(markdown: string): TiptapNode {
  const lines = markdown.split('\n');
  const content: TiptapNode[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      i++;
      continue;
    }
    
    // Heading: # Heading
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      content.push({
        type: 'heading',
        attrs: { level },
        content: parseInlineFormatting(headingMatch[2]),
      });
      i++;
      continue;
    }
    
    // Horizontal rule: --- or *** or ___
    if (/^([-*_]){3,}$/.test(trimmedLine)) {
      content.push({ type: 'horizontalRule' });
      i++;
      continue;
    }
    
    // Code block: ```
    if (trimmedLine.startsWith('```')) {
      const codeLines: string[] = [];
      const language = trimmedLine.slice(3).trim() || 'plaintext';
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      content.push({
        type: 'codeBlock',
        attrs: { language },
        content: [{ type: 'text', text: codeLines.join('\n') }],
      });
      i++; // Skip closing ```
      continue;
    }
    
    // Blockquote: > Quote
    if (trimmedLine.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      content.push({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: parseInlineFormatting(quoteLines.join(' ')),
          },
        ],
      });
      continue;
    }
    
    // Table: | Header | Header |
    if (trimmedLine.startsWith('|') || (trimmedLine.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---'))) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const table = parseTable(tableLines);
      if (table) {
        content.push(table);
      }
      continue;
    }
    
    // Unordered list: - item or * item
    const ulMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      const items: TiptapNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const itemMatch = lines[i].trim().match(/^[-*]\s+(.+)$/);
        if (itemMatch) {
          items.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: parseInlineFormatting(itemMatch[1]),
              },
            ],
          });
        }
        i++;
      }
      content.push({
        type: 'bulletList',
        content: items,
      });
      continue;
    }
    
    // Ordered list: 1. item
    const olMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      const items: TiptapNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemMatch = lines[i].trim().match(/^\d+\.\s+(.+)$/);
        if (itemMatch) {
          items.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: parseInlineFormatting(itemMatch[1]),
              },
            ],
          });
        }
        i++;
      }
      content.push({
        type: 'orderedList',
        content: items,
      });
      continue;
    }
    
    // Regular paragraph
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().match(/^[-*]\s+/) &&
      !lines[i].trim().match(/^\d+\.\s+/) &&
      !lines[i].trim().match(/^([-*_]){3,}$/) &&
      !lines[i].includes('|')
    ) {
      paragraphLines.push(lines[i].trim());
      i++;
    }
    
    if (paragraphLines.length > 0) {
      content.push({
        type: 'paragraph',
        content: parseInlineFormatting(paragraphLines.join(' ')),
      });
    }
  }
  
  // Ensure there's at least one paragraph
  if (content.length === 0) {
    content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    });
  }
  
  return {
    type: 'doc',
    content,
  };
}

/**
 * Clean markdown output from AI - removes common artifacts
 */
export function cleanAIMarkdown(text: string): string {
  return text
    // Remove any [[EDIT_NOTE:...]] artifacts (legacy)
    .replace(/\[\[EDIT_NOTE:[^\]]+\]\]/g, '')
    // Remove any [[type:id:title:subtitle]] record card markup
    .replace(/\[\[(?:note|application|job|interview|cv|campaign):[^\]]+\]\]/gi, '')
    // Remove triple backticks with json/markdown labels at start
    .replace(/^```(?:json|markdown)?\s*\n?/gm, '')
    .replace(/\n?```$/gm, '')
    // Remove common AI preamble phrases
    .replace(/^(?:Here(?:'s| is) (?:a |the )?(?:summary|rewritten|improved|updated|revised|enhanced|polished|refined).*?[:\n])/gim, '')
    .replace(/^(?:I(?:'ve| have) (?:improved|rewritten|updated|revised|enhanced|summarized|created).*?[:\n])/gim, '')
    .replace(/^(?:Let me (?:help you|improve|rewrite|summarize).*?[:\n])/gim, '')
    .replace(/^(?:The (?:updated|improved|revised) (?:note|content|version) is.*?[:\n])/gim, '')
    // Clean up excessive newlines
    .replace(/\n{4,}/g, '\n\n\n')
    // Trim whitespace
    .trim();
}

export default markdownToTiptap;


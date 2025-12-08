/**
 * Utility to convert plain text to Tiptap JSON format
 * Used for displaying AI-generated content in the NotionEditor
 */

export interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, any>;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
}

export interface TiptapDocument {
  type: 'doc';
  content: TiptapNode[];
}

/**
 * Convert plain text to Tiptap JSON document format
 * Handles paragraph breaks and basic text formatting
 */
export function convertTextToTiptapContent(text: string): TiptapDocument {
  if (!text || typeof text !== 'string') {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    };
  }

  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);

  const content: TiptapNode[] = paragraphs.map((paragraph) => {
    const trimmedParagraph = paragraph.trim();

    // Empty paragraph
    if (!trimmedParagraph) {
      return {
        type: 'paragraph',
      };
    }

    // Check if this is a bullet list (starts with - or •)
    if (/^[-•]\s/.test(trimmedParagraph)) {
      const listItems = trimmedParagraph
        .split(/\n/)
        .filter((line) => line.trim())
        .map((line) => {
          const itemText = line.replace(/^[-•]\s*/, '').trim();
          return {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: itemText
                  ? [
                      {
                        type: 'text',
                        text: itemText,
                      },
                    ]
                  : undefined,
              },
            ],
          };
        });

      return {
        type: 'bulletList',
        content: listItems,
      };
    }

    // Check if this is a numbered list (starts with 1. or 1))
    if (/^\d+[.)]\s/.test(trimmedParagraph)) {
      const listItems = trimmedParagraph
        .split(/\n/)
        .filter((line) => line.trim())
        .map((line) => {
          const itemText = line.replace(/^\d+[.)]\s*/, '').trim();
          return {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: itemText
                  ? [
                      {
                        type: 'text',
                        text: itemText,
                      },
                    ]
                  : undefined,
              },
            ],
          };
        });

      return {
        type: 'orderedList',
        content: listItems,
      };
    }

    // Handle single line breaks within a paragraph
    const lines = trimmedParagraph.split(/\n/);

    if (lines.length > 1) {
      // Multiple lines within a paragraph - add hard breaks
      const textContent: TiptapNode[] = [];
      lines.forEach((line, index) => {
        if (line.trim()) {
          textContent.push({
            type: 'text',
            text: line.trim(),
          });
        }
        // Add hardBreak between lines (not after the last one)
        if (index < lines.length - 1) {
          textContent.push({
            type: 'hardBreak',
          });
        }
      });

      return {
        type: 'paragraph',
        content: textContent.length > 0 ? textContent : undefined,
      };
    }

    // Regular paragraph with single line
    return {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: trimmedParagraph,
        },
      ],
    };
  });

  // Filter out any empty content arrays
  const cleanedContent = content.filter((node) => {
    if (node.type === 'paragraph' && !node.content) {
      return true; // Keep empty paragraphs for spacing
    }
    return true;
  });

  return {
    type: 'doc',
    content: cleanedContent.length > 0 ? cleanedContent : [{ type: 'paragraph' }],
  };
}

/**
 * Convert Tiptap JSON document back to plain text
 * Useful for saving/exporting content
 */
export function convertTiptapToText(doc: TiptapDocument): string {
  if (!doc || !doc.content) {
    return '';
  }

  const extractText = (nodes: TiptapNode[]): string => {
    return nodes
      .map((node) => {
        if (node.type === 'text') {
          return node.text || '';
        }

        if (node.type === 'hardBreak') {
          return '\n';
        }

        if (node.type === 'paragraph') {
          const text = node.content ? extractText(node.content) : '';
          return text;
        }

        if (node.type === 'bulletList' || node.type === 'orderedList') {
          const items = node.content || [];
          return items
            .map((item, index) => {
              const prefix = node.type === 'bulletList' ? '• ' : `${index + 1}. `;
              const itemContent = item.content ? extractText(item.content) : '';
              return prefix + itemContent;
            })
            .join('\n');
        }

        if (node.type === 'listItem') {
          return node.content ? extractText(node.content) : '';
        }

        if (node.type === 'heading') {
          const text = node.content ? extractText(node.content) : '';
          return text;
        }

        if (node.type === 'blockquote') {
          const text = node.content ? extractText(node.content) : '';
          return `> ${text}`;
        }

        if (node.type === 'codeBlock') {
          const text = node.content ? extractText(node.content) : '';
          return `\`\`\`\n${text}\n\`\`\``;
        }

        // For any other node type with content
        if (node.content) {
          return extractText(node.content);
        }

        return '';
      })
      .join('\n\n');
  };

  return extractText(doc.content).trim();
}

/**
 * Get plain text preview from Tiptap content (for cards/lists)
 */
export function getTiptapPreview(doc: TiptapDocument, maxLength: number = 150): string {
  const fullText = convertTiptapToText(doc);
  if (fullText.length <= maxLength) {
    return fullText;
  }
  return fullText.substring(0, maxLength - 3) + '...';
}







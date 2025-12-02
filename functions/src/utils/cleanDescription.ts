import TurndownService = require('turndown');

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
});

// Remove script, style, and other unwanted tags
turndownService.remove(['script', 'style', 'iframe', 'object', 'embed', 'link', 'head']);

/**
 * Decode HTML entities (handles both named and numeric entities)
 * This is needed because some ATS APIs return escaped HTML like &lt;h2&gt; instead of <h2>
 */
function decodeHTMLEntities(text: string): string {
    if (!text) return '';
    
    // Decode common named entities
    const entities: Record<string, string> = {
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '&',
        '&quot;': '"',
        '&apos;': "'",
        '&#39;': "'",
        '&nbsp;': ' ',
        '&ndash;': '–',
        '&mdash;': '—',
        '&bull;': '•',
        '&hellip;': '…',
        '&copy;': '©',
        '&reg;': '®',
        '&trade;': '™',
    };
    
    let decoded = text;
    
    // Replace named entities
    for (const [entity, char] of Object.entries(entities)) {
        decoded = decoded.replace(new RegExp(entity, 'gi'), char);
    }
    
    // Decode numeric entities (&#123; or &#x7B;)
    decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    
    return decoded;
}

export function cleanDescription(htmlOrText: string): string {
    if (!htmlOrText) return '';

    // STEP 1: Decode HTML entities first (critical for APIs returning escaped HTML)
    let cleaned = decodeHTMLEntities(htmlOrText);

    // STEP 2: Basic cleanup before conversion
    cleaned = cleaned
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style blocks
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script blocks
        .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
        .replace(/<span[^>]*font-weight:\s*700[^>]*>(.*?)<\/span>/gi, '<strong>$1</strong>') // Convert bold spans to strong
        .replace(/<span[^>]*font-weight:\s*bold[^>]*>(.*?)<\/span>/gi, '<strong>$1</strong>') // Convert bold spans to strong
        .replace(/<p>\s*[•-]\s*/gi, '<p><li>') // Convert pseudo-list items to list items (start)
        .replace(/<br\s*\/?>\s*[•-]\s*/gi, '</li><li>'); // Convert pseudo-list items to list items (middle)

    try {
        // Add a rule for converting strong/b tags that are their own paragraphs into headers
        turndownService.addRule('boldHeader', {
            filter: ['strong', 'b'],
            replacement: function (content, node, options) {
                // If the node is the only child of its parent (likely a p or div), treat as header
                if (node.parentNode && node.parentNode.childNodes.length === 1) {
                    return '\n\n### ' + content + '\n\n';
                }
                // If it's followed by a break or block element, treat as header
                return '**' + content + '**';
            }
        });

        // STEP 3: Convert HTML to Markdown
        let markdown = turndownService.turndown(cleaned);

        // STEP 4: Post-processing cleanup
        markdown = markdown
            .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
            .replace(/\[Apply now\]\(.*?\)/gi, '') // Remove "Apply now" links if they exist in text
            .replace(/^\\- /gm, '- ') // Fix escaped dashes at start of lines
            .replace(/^• /gm, '- ') // Fix bullets at start of lines
            .replace(/\\#/g, '#') // Unescape hash symbols (for headers)
            .replace(/\\\*/g, '*') // Unescape asterisks (for bold/italic)
            .replace(/\\\[/g, '[') // Unescape brackets (for links)
            .replace(/\\\]/g, ']')
            .trim();

        return markdown;
    } catch (e) {
        console.warn('Failed to convert description to markdown, returning original text', e);
        return htmlOrText;
    }
}

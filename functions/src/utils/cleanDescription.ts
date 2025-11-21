import TurndownService = require('turndown');

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
});

// Remove script, style, and other unwanted tags
turndownService.remove(['script', 'style', 'iframe', 'object', 'embed', 'link', 'head']);

export function cleanDescription(htmlOrText: string): string {
    if (!htmlOrText) return '';

    // Basic cleanup before conversion
    let cleaned = htmlOrText
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

        // Convert to Markdown
        let markdown = turndownService.turndown(cleaned);

        // Post-processing cleanup
        markdown = markdown
            .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
            .replace(/\[Apply now\]\(.*?\)/gi, '') // Remove "Apply now" links if they exist in text
            .replace(/^\\- /gm, '- ') // Fix escaped dashes at start of lines
            .replace(/^• /gm, '- ') // Fix bullets at start of lines
            .trim();

        return markdown;
    } catch (e) {
        console.warn('Failed to convert description to markdown, returning original text', e);
        return htmlOrText;
    }
}

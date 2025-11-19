import { queryPerplexity } from './perplexity';
import { ChatMessage } from '../types/job';

export interface SendMessageOptions {
  message: string;
  documentContent: string;
  documentType: 'cover_letter' | 'follow_up';
  chatHistory: ChatMessage[];
}

export interface SendMessageResult {
  content: string;
  error?: boolean;
  errorMessage?: string;
  isPartialChange?: boolean;
  targetSection?: string;
}

export interface PartialChangeDetection {
  isPartial: boolean;
  targetSection?: 'last_paragraph' | 'first_paragraph' | 'opening' | 'closing' | 'middle' | 'specific_section';
  sectionIdentifier?: string;
}

/**
 * Detects if the user is requesting a partial change to the document
 */
export function detectPartialChangeRequest(message: string): PartialChangeDetection {
  const lowerMessage = message.toLowerCase();
  
  // Patterns for partial changes
  const patterns = [
    { pattern: /\b(last|final|ending|concluding)\s+(paragraph|section|part)\b/i, section: 'last_paragraph' as const },
    { pattern: /\b(first|opening|initial|beginning)\s+(paragraph|section|part)\b/i, section: 'first_paragraph' as const },
    { pattern: /\b(opening|introduction|intro)\b/i, section: 'opening' as const },
    { pattern: /\b(closing|conclusion|ending)\b/i, section: 'closing' as const },
    { pattern: /\b(second|third|fourth|middle)\s+(paragraph|section)\b/i, section: 'middle' as const },
    { pattern: /\bchange\s+(the\s+)?(paragraph|section)\b/i, section: 'specific_section' as const },
  ];
  
  for (const { pattern, section } of patterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isPartial: true,
        targetSection: section,
        sectionIdentifier: lowerMessage.match(pattern)?.[0] || '',
      };
    }
  }
  
  // Check if message contains words that indicate full rewrite
  const fullRewriteKeywords = ['rewrite everything', 'rewrite all', 'change everything', 'improve all', 'entire', 'whole document', 'complete rewrite'];
  const isFullRewrite = fullRewriteKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (isFullRewrite) {
    return { isPartial: false };
  }
  
  // Default: if message is very short or contains "improve", "enhance" without specific section, assume full rewrite
  if (lowerMessage.length < 30 || (/\b(improve|enhance|better|fix)\b/i.test(lowerMessage) && !(/\b(paragraph|section|part|opening|closing)\b/i.test(lowerMessage)))) {
    return { isPartial: false };
  }
  
  return { isPartial: false };
}

/**
 * Cleans AI response by removing explanatory text and conversational wrappers
 */
export function cleanAIResponse(response: string): string {
  let cleaned = response.trim();
  
  // Remove common AI explanation patterns at the start
  const explanationPatterns = [
    /^Here'?s?\s+(a|an|the)?\s*(revised|improved|rewritten|updated|corrected|enhanced|better|new)\s+.*?:\s*/i,
    /^I'?(?:ve|'ve| have)\s+(revised|improved|rewritten|updated|corrected|enhanced|made)\s+.*?:\s*/i,
    /^Let me\s+(revise|improve|rewrite|update|correct|enhance|make)\s+.*?:\s*/i,
    /^I'll\s+(revise|improve|rewrite|update|correct|enhance|make)\s+.*?:\s*/i,
    /^Sure[,!]?\s+(here'?s?|here is)\s+.*?:\s*/i,
    /^Certainly[,!]?\s+(here'?s?|here is)\s+.*?:\s*/i,
    /^Of course[,!]?\s+(here'?s?|here is)\s+.*?:\s*/i,
  ];
  
  for (const pattern of explanationPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove lines that end with a colon and are short (likely explanatory headers)
  const lines = cleaned.split('\n');
  if (lines.length > 1 && lines[0].trim().endsWith(':') && lines[0].trim().length < 100) {
    cleaned = lines.slice(1).join('\n').trim();
  }
  
  // Remove common closing statements
  const closingPatterns = [
    /\n\nIf you want.*$/i,
    /\n\nWould you like.*$/i,
    /\n\nLet me know if.*$/i,
    /\n\nFeel free to.*$/i,
  ];
  
  for (const pattern of closingPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    // Extract content between code blocks
    return match.replace(/```[a-z]*\n?/gi, '').replace(/```$/g, '');
  });
  
  // Remove excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}

/**
 * Sends a message to the AI chat assistant with document context
 */
export async function sendChatMessage({
  message,
  documentContent,
  documentType,
  chatHistory,
}: SendMessageOptions): Promise<SendMessageResult> {
  try {
    const documentTypeLabel = documentType === 'cover_letter' ? 'cover letter' : 'follow-up email';
    
    // Detect if this is a partial change request
    const partialDetection = detectPartialChangeRequest(message);
    
    // Build conversation history for context
    const recentHistory = chatHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Create the prompt based on whether it's a partial or full change
    let prompt: string;
    
    if (partialDetection.isPartial) {
      // Partial change request - ask for only the changed section
      prompt = `You are a helpful AI writing assistant in a split-screen editor interface, similar to Canva's AI assistant. You're helping the user write and improve a ${documentTypeLabel}.

CURRENT DOCUMENT CONTENT:
"""
${documentContent}
"""

CONVERSATION HISTORY:
${recentHistory || 'No previous messages'}

USER'S MESSAGE:
${message}

CRITICAL INSTRUCTIONS:
1. The user wants to change ONLY the ${partialDetection.sectionIdentifier || partialDetection.targetSection} - NOT the entire document
2. Provide ONLY the new version of that specific section
3. DO NOT include ANY explanatory text, introductions, or commentary
4. DO NOT say "Here's a revised..." or similar phrases
5. Provide ONLY the actual text content that should replace the ${partialDetection.sectionIdentifier || partialDetection.targetSection}
6. Make sure the new section flows naturally with the rest of the document
7. The output should be ready to replace that section directly

Respond with ONLY the improved ${partialDetection.sectionIdentifier || partialDetection.targetSection} text - nothing else.`;
    } else {
      // Full document rewrite
      prompt = `You are a helpful AI writing assistant in a split-screen editor interface, similar to Canva's AI assistant. You're helping the user write and improve a ${documentTypeLabel}.

CURRENT DOCUMENT CONTENT:
"""
${documentContent}
"""

CONVERSATION HISTORY:
${recentHistory || 'No previous messages'}

USER'S MESSAGE:
${message}

CRITICAL INSTRUCTIONS:
1. Provide the COMPLETE rewritten ${documentTypeLabel} with your improvements
2. DO NOT include ANY explanatory text, introductions, or commentary
3. DO NOT say "Here's a revised..." or similar phrases
4. Provide ONLY the actual ${documentTypeLabel} content
5. Make sure the output is complete and ready to use
6. Include all sections (opening, body, closing) of the ${documentTypeLabel}

Respond with ONLY the complete improved ${documentTypeLabel} text - nothing else.`;
    }

    const response = await queryPerplexity(prompt);

    if (response?.error) {
      return {
        content: '',
        error: true,
        errorMessage: response.errorMessage || 'Failed to get AI response',
      };
    }

    // Clean the AI response to remove explanatory text
    const cleanedContent = cleanAIResponse(response.text || "I'm having trouble responding right now. Please try again.");

    return {
      content: cleanedContent,
      isPartialChange: partialDetection.isPartial,
      targetSection: partialDetection.targetSection,
    };
  } catch (error) {
    console.error('Error in AI chat assistant:', error);
    return {
      content: '',
      error: true,
      errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Quick action handlers for common editing tasks
 */
export const quickActions = {
  improveTone: (content: string) => 
    `Please provide the COMPLETE rewritten version with improved tone and professionalism. Here's the current text:\n\n${content}\n\nProvide the full rewritten version that I can apply to my editor.`,
  
  makeMoreConcise: (content: string) => 
    `Please provide the COMPLETE rewritten version that is more concise while keeping all key points. Here's the current text:\n\n${content}\n\nProvide the full rewritten version that I can apply to my editor.`,
  
  fixGrammar: (content: string) => 
    `Please provide the COMPLETE corrected version with all grammar, spelling, and punctuation errors fixed. Here's the current text:\n\n${content}\n\nProvide the full corrected version that I can apply to my editor.`,
  
  addDetails: (content: string) => 
    `Please provide the COMPLETE enhanced version with additional compelling details and information. Here's the current text:\n\n${content}\n\nProvide the full enhanced version that I can apply to my editor.`,
  
  strengthenOpening: (content: string) => 
    `Please provide the COMPLETE rewritten version with a stronger, more engaging opening. Here's the current text:\n\n${content}\n\nProvide the full rewritten version that I can apply to my editor.`,
  
  improveClosing: (content: string) => 
    `Please provide the COMPLETE rewritten version with a better closing/conclusion. Here's the current text:\n\n${content}\n\nProvide the full rewritten version that I can apply to my editor.`,
};

/**
 * Section Detection and Replacement Helpers
 */

interface SectionPosition {
  start: number;
  end: number;
  text: string;
}

/**
 * Splits text into paragraphs (separated by blank lines)
 */
export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Checks if a paragraph is a greeting (e.g., "Dear Hiring Manager,")
 */
function isGreeting(text: string): boolean {
  const greetingPatterns = [
    /^dear\s+/i,
    /^hi\s+/i,
    /^hello\s+/i,
    /^to whom it may concern/i,
  ];
  return greetingPatterns.some(pattern => pattern.test(text.trim())) && text.length < 100;
}

/**
 * Finds the last paragraph in the text
 */
export function findLastParagraph(text: string): SectionPosition | null {
  const paragraphs = splitIntoParagraphs(text);
  if (paragraphs.length === 0) return null;
  
  const lastParagraph = paragraphs[paragraphs.length - 1];
  const start = text.lastIndexOf(lastParagraph);
  
  return {
    start,
    end: start + lastParagraph.length,
    text: lastParagraph,
  };
}

/**
 * Finds the first paragraph in the text (skipping greetings like "Dear Hiring Manager,")
 */
export function findFirstParagraph(text: string): SectionPosition | null {
  const paragraphs = splitIntoParagraphs(text);
  if (paragraphs.length === 0) return null;
  
  // Skip greeting if present and get first body paragraph
  let firstBodyParagraph = paragraphs[0];
  let paragraphIndex = 0;
  
  if (isGreeting(paragraphs[0]) && paragraphs.length > 1) {
    firstBodyParagraph = paragraphs[1];
    paragraphIndex = 1;
  }
  
  // Find the start position in the original text
  let start = text.indexOf(firstBodyParagraph);
  
  // If we skipped a greeting, make sure we're finding the correct occurrence
  if (paragraphIndex > 0) {
    const greetingEnd = text.indexOf(paragraphs[0]) + paragraphs[0].length;
    start = text.indexOf(firstBodyParagraph, greetingEnd);
  }
  
  return {
    start,
    end: start + firstBodyParagraph.length,
    text: firstBodyParagraph,
  };
}

/**
 * Finds a specific section based on section type
 */
export function findSection(
  text: string,
  sectionType: 'last_paragraph' | 'first_paragraph' | 'opening' | 'closing' | 'middle' | 'specific_section'
): SectionPosition | null {
  const paragraphs = splitIntoParagraphs(text);
  if (paragraphs.length === 0) return null;
  
  switch (sectionType) {
    case 'last_paragraph':
    case 'closing':
      return findLastParagraph(text);
      
    case 'first_paragraph':
    case 'opening':
      return findFirstParagraph(text);
      
    case 'middle':
      if (paragraphs.length < 3) return null;
      const middleIndex = Math.floor(paragraphs.length / 2);
      const middleParagraph = paragraphs[middleIndex];
      const start = text.indexOf(middleParagraph, text.indexOf(paragraphs[0]) + paragraphs[0].length);
      return {
        start,
        end: start + middleParagraph.length,
        text: middleParagraph,
      };
      
    default:
      return null;
  }
}

/**
 * Replaces a section in the text with new content
 */
export function replaceSection(
  fullText: string,
  newSection: string,
  position: SectionPosition
): string {
  const before = fullText.substring(0, position.start);
  const after = fullText.substring(position.end);
  
  // Trim the new section to avoid extra whitespace
  const trimmedNewSection = newSection.trim();
  
  // Preserve spacing around the section by ensuring proper paragraph breaks
  let result = before + trimmedNewSection + after;
  
  // Clean up any instances of more than 2 consecutive newlines
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result;
}


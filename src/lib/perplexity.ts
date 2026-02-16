/**
 * Perplexity API Client
 * Used for general queries, news, and interview prep.
 * 
 * Note: Job extraction has been moved to jobExtractor.ts (using Claude).
 * This file is kept for backward compatibility and other features.
 */

export interface PerplexityMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface PerplexityResponse {
    content: string;
    citations?: string[];
    model?: string;
}

/**
 * General purpose search function using Perplexity API via server proxy
 */
export async function searchPerplexity(messages: PerplexityMessage[], options: any = {}): Promise<PerplexityResponse> {
    try {
        const response = await fetch('/api/perplexity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                model: options.model || 'sonar-pro', // Default to sonar-pro as seen in server
                ...options
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Perplexity API error: ${response.status}`);
        }

        const data = await response.json();

        // Extract content from standard OpenAI/Perplexity format
        const content = data.choices?.[0]?.message?.content || '';
        const citations = data.citations || [];

        return {
            content,
            citations,
            model: data.model
        };
    } catch (error) {
        console.error('Error calling Perplexity API:', error);
        throw error;
    }
}

/**
 * simplified wrapper for single prompt queries
 */
export async function queryPerplexity(prompt: string, options: any = {}): Promise<any> {
    const messages: PerplexityMessage[] = [
        { role: 'user', content: prompt }
    ];

    if (options.systemMessage) {
        messages.unshift({ role: 'system', content: options.systemMessage });
        delete options.systemMessage;
    }

    const result = await searchPerplexity(messages, options);

    // Some callers expect { text: string } or similar, let's return the full object plus text alias
    return {
        ...result,
        text: result.content,
        // Legacy error fields might be expected by some callers
        error: false
    };
}

/**
 * @deprecated Use extractJobInfo from jobExtractor.ts instead
 * Kept for backward compatibility during migration
 */
export async function queryPerplexityForJobExtraction(prompt: string): Promise<any> {
    console.warn('⚠️ Using deprecated queryPerplexityForJobExtraction. Please migrate to extractJobInfo.');

    try {
        // If the prompt contains a URL, we might want to extract it and use the new service?
        // But the prompt is usually complex text instructions. 
        // For now, let's just route it to the general queryPerplexity to keep it working as it was.
        // The server's /api/perplexity endpoint handles the actual call.

        return await queryPerplexity(prompt, {
            model: 'sonar-pro',
            temperature: 0.2
        });
    } catch (error: any) {
        return {
            error: true,
            errorMessage: error.message || 'Unknown error'
        };
    }
}

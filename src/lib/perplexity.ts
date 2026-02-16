import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export interface PerplexityMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface PerplexityResponse {
    id: string;
    model: string;
    created: number;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    citations: string[]; // URLs of sources
    choices: {
        index: number;
        finish_reason: string;
        message: PerplexityMessage;
        delta?: PerplexityMessage;
    }[];
}

let perplexityApiKey: string | null = null;

export async function getPerplexityApiKey(): Promise<string> {
    if (perplexityApiKey) return perplexityApiKey;

    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'perplexity'));
        if (settingsDoc.exists()) {
            perplexityApiKey = settingsDoc.data().apiKey;
            return perplexityApiKey || '';
        }
    } catch (error) {
        console.error('Error fetching Perplexity API key:', error);
    }
    return '';
}

export async function searchPerplexity(
    messages: PerplexityMessage[],
    model: string = 'sonar'
): Promise<{ content: string; citations: string[] }> {
    const apiKey = await getPerplexityApiKey();

    if (!apiKey) {
        throw new Error('Perplexity API key not found. Please configure it in settings.');
    }

    try {
        const response = await fetch(PERPLEXITY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.2,
                top_p: 0.9,
                stream: false
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Perplexity API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json() as PerplexityResponse;
        return {
            content: data.choices[0]?.message?.content || '',
            citations: data.citations || []
        };
    } catch (error) {
        console.error('Error calling Perplexity API:', error);
        throw error;
    }
}

export async function queryPerplexityForJobExtraction(prompt: string): Promise<{ text: string | null; error: boolean; errorMessage?: string }> {
    try {
        const messages: PerplexityMessage[] = [
            { role: 'user', content: prompt }
        ];

        // Use sonar-pro for better browsing capabilities/reasoning
        const { content } = await searchPerplexity(messages, 'sonar-pro');

        return {
            text: content,
            error: false
        };
    } catch (error: any) {
        console.error('Error in queryPerplexityForJobExtraction:', error);
        return {
            text: null,
            error: true,
            errorMessage: error.message || 'Unknown error occurred'
        };
    }
}

export async function queryPerplexity(prompt: string): Promise<{ text: string | null; error: boolean; errorMessage?: string }> {
    try {
        const messages: PerplexityMessage[] = [
            { role: 'user', content: prompt }
        ];

        // Use default model (sonar) for general chat
        const { content } = await searchPerplexity(messages);

        return {
            text: content,
            error: false
        };
    } catch (error: any) {
        console.error('Error in queryPerplexity:', error);
        return {
            text: null,
            error: true,
            errorMessage: error.message || 'Unknown error occurred'
        };
    }
}

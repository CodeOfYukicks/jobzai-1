import axios from 'axios';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { toast } from 'sonner';

// Cache the API key to avoid repeated Firestore reads
let perplexityApiKey: string | null = null;

/**
 * Retrieves the Perplexity API key from Firestore
 */
export async function getPerplexityApiKey(): Promise<string> {
  if (!perplexityApiKey) {
    try {
      // Fetch API key from Firestore settings collection
      const settingsDoc = await getDoc(doc(db, 'settings', 'perplexity'));
      if (!settingsDoc.exists()) {
        throw new Error('Perplexity settings not found');
      }

      const { apiKey } = settingsDoc.data();
      if (!apiKey) {
        throw new Error('Perplexity API key not found');
      }

      perplexityApiKey = apiKey as string;
    } catch (error) {
      console.error('Error retrieving Perplexity API key:', error);
      throw new Error('Failed to initialize Perplexity API. Please try again later.');
    }
  }
  
  if (!perplexityApiKey) {
    throw new Error('Failed to retrieve Perplexity API key');
  }
  
  return perplexityApiKey;
}

/**
 * Makes a request to the Perplexity API
 */
export async function queryPerplexity(prompt: string): Promise<any> {
  try {
    const apiKey = await getPerplexityApiKey();
    
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-reasoning',
        messages: [
          { role: 'system', content: 'You are an expert career coach helping with job interview preparation. You can browse the web to analyze job postings.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        // Enable web browsing capability
        tools: [
          {
            type: "web_search",
            web_search: {
              enable: true
            }
          }
        ],
        tool_choice: "auto"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error querying Perplexity API:', error);
    
    // Extract and return the error message from the API response if available
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data?.error?.message || 'Unknown API error';
      throw new Error(`Perplexity API Error: ${errorMessage}`);
    }
    
    throw new Error('Failed to query Perplexity API: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
} 
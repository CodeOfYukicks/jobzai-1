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
    
    console.log('Sending request to Perplexity API...');
    
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-reasoning',
        messages: [
          { 
            role: 'system', 
            content: `You are a conversational interview coach helping with job interview preparation. 

Follow these strict guidelines:
1. Keep responses extremely brief and direct - first paragraph should contain the key answer.
2. Limit to 1-2 short paragraphs total unless explicitly asked for more detail.
3. Never reveal or explain your thinking process - just provide the final answer.
4. Use natural, friendly language as if chatting with a friend.
5. When giving advice, jump straight to the actionable tips.
6. Avoid lengthy explanations or theoretical background information.
7. Use bullet points sparingly and only for very short lists.

You can browse the web when needed for specific information, but keep search results brief.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500, // Further reduced to encourage brevity
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

    console.log('Perplexity API response received:', response.status);
    
    // Parse the response properly
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const textContent = response.data.choices[0].message.content;
      console.log('Response content:', textContent.substring(0, 100) + '...');
      
      return {
        ...response.data,
        text: textContent
      };
    } else {
      console.error('Unexpected response structure:', response.data);
      return {
        text: "I received a response from the API but couldn't extract the answer. Please try again.",
        error: true,
        errorMessage: "Invalid response structure"
      };
    }
  } catch (error) {
    console.error('Error querying Perplexity API:', error);
    
    // First check if it's a network error (like being blocked by an extension)
    if (axios.isAxiosError(error) && !error.response) {
      console.error('Network error or request blocked:', error.message);
      return {
        text: "It looks like your browser might be blocking the connection to our AI service. This could be due to an ad blocker, privacy extension, or network issues. Try disabling any extensions that might interfere with API requests.",
        error: true,
        errorMessage: error.message
      };
    }
    
    // Then check for API errors
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data?.error?.message || 'Unknown API error';
      console.error('Perplexity API Error Details:', error.response.data);
      
      return {
        text: `Sorry, there was a problem with the AI service: ${errorMessage}. Please try again later.`,
        error: true,
        errorMessage: errorMessage
      };
    }
    
    // Generic error fallback
    return {
      text: "I'm sorry, I couldn't process your request due to a technical issue. This could be a network problem, an issue with the Perplexity API, or with your browser settings blocking certain requests. Please try again later.",
      error: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 
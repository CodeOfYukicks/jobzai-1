/**
 * Fast Chat API using GPT-4o-mini
 * Optimized for speed and cost while maintaining good quality for conversational responses
 */

export interface ChatFastResponse {
  text: string;
  error?: boolean;
  errorMessage?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Makes a request to the GPT-4o-mini chat endpoint for fast responses
 * This is optimized for conversational chat coaching
 */
export async function queryChatFast(
  prompt: string,
  options?: {
    systemMessage?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<ChatFastResponse> {
  try {
    console.log('Sending request to GPT-4o-mini fast chat endpoint...');
    
    const response = await fetch('/api/chat-fast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        systemMessage: options?.systemMessage,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('GPT-4o-mini API error response:', response.status, errorData);
      
      return {
        text: errorData.text || errorData.message || `Sorry, there was a problem with the AI service (${response.status}).`,
        error: true,
        errorMessage: errorData.errorMessage || errorData.message || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    console.log('GPT-4o-mini API response received:', response.status);
    
    if (data.text) {
      console.log('Response content preview:', data.text.substring(0, 100) + '...');
      return {
        text: data.text,
        error: false,
        usage: data.usage
      };
    } else if (data.error) {
      return {
        text: data.text || "I received a response but couldn't extract the answer. Please try again.",
        error: true,
        errorMessage: data.errorMessage || "Invalid response structure"
      };
    } else {
      console.error('Unexpected response structure:', data);
      return {
        text: "I received a response but couldn't extract the answer. Please try again.",
        error: true,
        errorMessage: "Invalid response structure"
      };
    }
  } catch (error) {
    console.error('Error querying GPT-4o-mini API:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error or request blocked:', error.message);
      return {
        text: "It looks like your browser might be blocking the connection. Try disabling any extensions that might interfere with API requests.",
        error: true,
        errorMessage: error.message
      };
    }
    
    // Generic error fallback
    return {
      text: "I'm sorry, I couldn't process your request due to a technical issue. Please try again later.",
      error: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Makes a request for high-quality question generation using GPT-4o
 */
export async function queryQuestionGeneration(prompt: string): Promise<ChatFastResponse> {
  try {
    console.log('Sending request to GPT-4o question generation endpoint...');
    
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('GPT-4o question generation error:', response.status, errorData);
      
      return {
        text: errorData.text || errorData.message || `Sorry, there was a problem generating questions (${response.status}).`,
        error: true,
        errorMessage: errorData.errorMessage || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    console.log('GPT-4o question generation response received');
    
    if (data.text) {
      return {
        text: data.text,
        error: false
      };
    } else {
      return {
        text: "Failed to generate questions. Please try again.",
        error: true,
        errorMessage: "Invalid response"
      };
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    return {
      text: "Failed to generate questions due to a technical issue.",
      error: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}








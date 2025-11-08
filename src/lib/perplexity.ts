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
        model: 'sonar',
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
        max_tokens: 1500 // Further reduced to encourage brevity
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
        text: `Sorry, there was a problem with the AI service: ${errorMessage}.`,
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

/**
 * Makes a specialized request to Perplexity API for job posting extraction
 * Uses sonar-online model which is better at visiting URLs and extracting exact information
 */
export async function queryPerplexityForJobExtraction(prompt: string): Promise<any> {
  try {
    const apiKey = await getPerplexityApiKey();
    
    console.log('Sending job extraction request to Perplexity API...');
    
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar', // Use sonar model for web browsing (sonar-pro may not be available)
        messages: [
          { 
            role: 'system', 
            content: `You are a precise job posting information extractor. Your ONLY task is to visit URLs and extract EXACT information from job posting pages.

CRITICAL RULES - FOLLOW THESE EXACTLY:
1. You MUST visit the URL provided and read the ACTUAL content of the page
2. Read the ENTIRE page content carefully - do NOT skim or rush
3. Understand the STRUCTURE and CONTEXT of the page - analyze how information is organized
4. Extract ONLY information that is VISIBLY DISPLAYED on the page
5. Do NOT guess, infer, or use information from your training data
6. Do NOT use information from similar job postings
7. Do NOT use information from the URL or domain name to infer details
8. For location extraction: 
   - Read the ENTIRE page to understand the context
   - Identify ALL location mentions on the page
   - Analyze the CONTEXT around each location to determine which applies to THIS specific job posting
   - The page may mention multiple locations (headquarters, other offices, general info) - you MUST identify which one is for THIS job
9. The job title/position must be the EXACT title shown on the page header/title
10. The company name must be the EXACT company name shown on the page
11. The location MUST be the EXACT location specified for THIS specific job posting - THIS IS CRITICAL:
   - STOP: Before extracting location, read the ENTIRE page content carefully and understand the CONTEXT
   - CRITICAL: The page may mention MULTIPLE locations (headquarters, other offices, general company info)
   - You MUST identify which location applies to THIS SPECIFIC job posting by analyzing the CONTEXT
   - DO NOT use any location from your training data, company knowledge, or assumptions
   - DO NOT infer location from URL, domain name, or any other source
   - DO NOT use the company's headquarters location unless explicitly stated for THIS job
   
   CONTEXTUAL ANALYSIS REQUIRED:
   - Read the ENTIRE page to understand structure and context
   - Identify ALL location mentions on the page
   - For EACH location, analyze the CONTEXT around it:
     * Location in job details section near job title → Likely the job location
     * Location in "Location:" field in job posting section → Likely the job location
     * Location in header/footer mentioning headquarters → NOT the job location
     * Location in "About Us" or "Our Offices" section → NOT the job location
     * Location with phrases like "This role is based in...", "Location for this position:" → Likely the job location
     * Location near job title/description/application section → Likely the job location
   
   SEARCH PRIORITY:
   1. Job-specific location indicators (HIGHEST PRIORITY):
      * Location field/icon in job details section (near job title)
      * "Location:" or "Work Location:" in job posting section
      * "This role is based in..." or "This position is located in..."
      * "Where you'll work:" section within job posting
      * Location in job description or requirements section
   
   2. AVOID these locations (NOT the job location):
      * Company headquarters in header/footer
      * General "Our Offices" section
      * Location in "About Us" or company information sections
      * Location in unrelated job postings on same page
   
   CRITICAL CONTEXTUAL VERIFICATION:
   - If "New York" in header/footer but "Paris" near job title → Use "Paris"
   - Analyze proximity: location near job title/description = job location
   - Analyze phrasing: "This role is based in Paris" = job location is Paris
   - Location must be CONTEXTUALLY linked to THIS specific job posting
   - If you cannot determine job location from context, return empty string "" - do NOT guess
12. The job description must include ALL sections visible on the page: overview, responsibilities, requirements, qualifications, skills, experience, education, location, benefits, company culture, team info, application process, etc.
13. Include ALL paragraphs, ALL bullet points, ALL lists, ALL text - nothing should be omitted
14. If the job description is very long (5000+ characters), that's correct - include EVERYTHING
15. Return ONLY valid JSON with no markdown, no code blocks, no explanations, no additional text
16. All string values must be properly escaped in JSON format (use \\n for newlines, \\" for quotes)
17. If you cannot access the URL or see the page content, return an error - do NOT guess
18. For the jobDescription field, include the COMPLETE, FULL text from ALL sections - completeness is critical for accurate CV matching
19. A complete job description should typically be 1000-5000+ characters - if shorter, you likely missed sections
20. For summary fields, provide comprehensive, useful summaries (3-5 sentences) that include key responsibilities, required qualifications, and what makes the role unique`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.0, // Zero temperature for maximum precision - no creativity or summarization
        max_tokens: 16000 // Maximum tokens to allow very long, complete job descriptions
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
      console.log('Response content:', textContent.substring(0, 200) + '...');
      
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
    console.error('Error querying Perplexity API for job extraction:', error);
    
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
        text: `Sorry, there was a problem with the AI service: ${errorMessage}.`,
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
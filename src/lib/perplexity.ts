// Note: API calls are now made through the local server endpoint /api/perplexity
// to avoid CORS issues. The server handles API key retrieval from Firestore.

/**
 * Makes a request to the Perplexity API via the local server endpoint
 * This avoids CORS issues by routing through the Express server
 */
export async function queryPerplexity(prompt: string): Promise<any> {
  try {
    console.log('Sending request to Perplexity API via /api/perplexity...');
    
    const response = await fetch('/api/perplexity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        model: 'sonar-pro',
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Perplexity API error response:', response.status, errorData);
      
      return {
        text: errorData.text || errorData.message || `Sorry, there was a problem with the AI service (${response.status}).`,
        error: true,
        errorMessage: errorData.errorMessage || errorData.message || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    console.log('Perplexity API response received:', response.status);
    
    // The server already formats the response with the same structure
    if (data.text) {
      console.log('Response content:', data.text.substring(0, 100) + '...');
      return data;
    } else if (data.error) {
      return {
        text: data.text || "I received a response from the API but couldn't extract the answer. Please try again.",
        error: true,
        errorMessage: data.errorMessage || "Invalid response structure"
      };
    } else {
      console.error('Unexpected response structure:', data);
      return {
        text: "I received a response from the API but couldn't extract the answer. Please try again.",
        error: true,
        errorMessage: "Invalid response structure"
      };
    }
  } catch (error) {
    console.error('Error querying Perplexity API:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error or request blocked:', error.message);
      return {
        text: "It looks like your browser might be blocking the connection to our AI service. This could be due to an ad blocker, privacy extension, or network issues. Make sure the server is running (npm run dev) and try disabling any extensions that might interfere with API requests.",
        error: true,
        errorMessage: error.message
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
 * Uses sonar-pro model which is better at visiting URLs and extracting exact information
 * Routes through the local server endpoint to avoid CORS issues
 */
export async function queryPerplexityForJobExtraction(prompt: string): Promise<any> {
  try {
    console.log('Sending job extraction request to Perplexity API via /api/perplexity...');
    
    // Build the specialized system message for job extraction
    const systemMessage = `You are a precise job posting information extractor. Your ONLY task is to visit URLs and extract EXACT information from job posting pages.

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
   
   CRITICAL CONTEXTUAL VERIFICATION - EXAMPLES:
   - Example 1: Adobe job page shows "Adobe" (San Jose, CA) in header BUT shows "Location: Paris, France" near job title → USE "Paris, France"
   - Example 2: Job description says "join our team in Paris" → USE "Paris" (NOT company HQ)
   - Example 3: "New York" in footer but "London" near job title → USE "London"
   - Rule: Analyze proximity - location near job title/description/job details = JOB location
   - Rule: Analyze phrasing - "This role is based in [City]" = job location is [City]
   - Rule: Location must be CONTEXTUALLY linked to THIS specific job posting
   - Rule: NEVER use your knowledge of where a company is headquartered
   - If you cannot find a job-specific location, return empty string "" - do NOT guess or use company HQ
12. The job description must include ALL sections visible on the page: overview, responsibilities, requirements, qualifications, skills, experience, education, location, benefits, company culture, team info, application process, etc.
13. Include ALL paragraphs, ALL bullet points, ALL lists, ALL text - nothing should be omitted
14. If the job description is very long (5000+ characters), that's correct - include EVERYTHING
15. Return ONLY valid JSON with no markdown, no code blocks, no explanations, no additional text
16. All string values must be properly escaped in JSON format (use \\n for newlines, \\" for quotes)
17. If you cannot access the URL or see the page content, return an error - do NOT guess
18. For the jobDescription field, include the COMPLETE, FULL text from ALL sections - completeness is critical for accurate CV matching
19. A complete job description should typically be 1000-5000+ characters - if shorter, you likely missed sections
20. For summary fields, provide comprehensive, useful summaries (3-5 sentences) that include key responsibilities, required qualifications, and what makes the role unique`;

    const response = await fetch('/api/perplexity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        model: 'sonar-pro',
        temperature: 0.0,
        max_tokens: 16000,
        search_recency_filter: 'day',
        return_citations: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Perplexity API error response:', response.status, errorData);
      
      return {
        text: errorData.text || errorData.message || `Sorry, there was a problem with the AI service (${response.status}).`,
        error: true,
        errorMessage: errorData.errorMessage || errorData.message || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    console.log('Perplexity API response received:', response.status);
    
    // The server already formats the response with the same structure
    if (data.text) {
      console.log('Response content:', data.text.substring(0, 200) + '...');
      return data;
    } else if (data.error) {
      return {
        text: data.text || "I received a response from the API but couldn't extract the answer. Please try again.",
        error: true,
        errorMessage: data.errorMessage || "Invalid response structure"
      };
    } else {
      console.error('Unexpected response structure:', data);
      return {
        text: "I received a response from the API but couldn't extract the answer. Please try again.",
        error: true,
        errorMessage: "Invalid response structure"
      };
    }
  } catch (error) {
    console.error('Error querying Perplexity API for job extraction:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error or request blocked:', error.message);
      return {
        text: "It looks like your browser might be blocking the connection to our AI service. This could be due to an ad blocker, privacy extension, or network issues. Make sure the server is running (npm run dev) and try disabling any extensions that might interfere with API requests.",
        error: true,
        errorMessage: error.message
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
import { queryPerplexityForJobExtraction } from './perplexity';

/**
 * Job extraction result types
 */
export interface BasicJobInfo {
  companyName: string;
  position: string;
  location: string;
  summary: string;
}

export interface DetailedJobInfo extends BasicJobInfo {
  fullJobDescription: string;
  jobInsights: {
    keyResponsibilities: string;
    requiredSkills: string;
    experienceLevel: string;
    compensationBenefits: string;
    companyCulture: string;
    growthOpportunities: string;
  };
}

export interface JobExtractionOptions {
  detailed?: boolean;
}

/**
 * Robust JSON parser with repair capabilities
 */
function parseJobJSON(jsonString: string): any {
  // Check if the API is refusing to browse (common error message)
  if (jsonString.includes('cannot actually visit') || 
      jsonString.includes('cannot access URLs') ||
      jsonString.includes('don\'t have the ability to browse')) {
    throw new Error('API cannot browse URLs. Please check your Perplexity API configuration and ensure you\'re using a model with web browsing capabilities (e.g., sonar-pro)');
  }
  
  try {
    // Clean markdown code blocks
    let cleaned = jsonString.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    
    // Extract JSON object - find first { to last }
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    } else {
      // No JSON found in response
      throw new Error('No JSON object found in API response');
    }
    
    // Try direct parse first
    return JSON.parse(cleaned);
  } catch (error) {
    // Attempt JSON repair for common issues
    try {
      let repaired = jsonString
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      const jsonMatch = repaired.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        repaired = jsonMatch[0];
      }
      
      // Fix common JSON errors
      repaired = repaired
        .replace(/,\s*\]/g, ']')           // Remove trailing commas before ]
        .replace(/,\s*\}/g, '}')            // Remove trailing commas before }
        .replace(/:\s*'([^']*)'/g, ': "$1"'); // Replace single quotes with double quotes
      
      return JSON.parse(repaired);
    } catch (repairError) {
      console.error('JSON parsing failed:', error);
      throw new Error('Failed to parse JSON response from API. The API may not have returned valid job data.');
    }
  }
}

/**
 * Extract basic job information (4 core fields)
 * Based on CalendarView's reliable approach
 */
async function extractBasicJobInfo(url: string): Promise<BasicJobInfo> {
  const prompt = `
You are a precise job posting information extractor. Your task is to visit this URL and extract EXACT information from the job posting page.

URL TO VISIT: ${url}

Extract the following fields and return as JSON:
1. companyName: exact company name from the page
2. position: exact job title from the page
3. location: CRITICAL - READ THIS CAREFULLY
4. summary: 3 concise bullet points about the job

LOCATION EXTRACTION RULES (MOST CRITICAL - READ THESE FIRST):
⚠️ STOP: Do NOT extract location until you have READ THE ENTIRE PAGE
⚠️ CRITICAL: The page will likely show MULTIPLE locations:
   - Company headquarters (often in header/footer) - THIS IS NOT THE JOB LOCATION
   - Job location (near job title, in job details) - THIS IS WHAT YOU NEED

LOCATION EXTRACTION PROCESS:
1. First, scroll through and READ THE ENTIRE job posting page
2. Look for location indicators IN THIS SPECIFIC ORDER:
   
   HIGH PRIORITY (Job-specific location):
   - Location icon/field right next to the job title at the top of the page
   - "Location:" or "Work Location:" label in the job header/details section
   - Text like "join our team in [CITY]" in the job description
   - Location metadata shown with job posting date and job ID
   
   IGNORE THESE (NOT job location):
   - Company name/logo location in page header/footer
   - "Headquarters:" or general company location
   - Locations in "About Us" or "Our offices" sections
   - Any location mentioned in site navigation/footer

3. EXAMPLE - Adobe job posting:
   - If you see "Adobe" (San Jose, CA) in header → IGNORE THIS
   - If you see "Location: Paris, France" near job title → USE THIS
   - If description says "join our team in Paris" → USE THIS
   
4. Extract the EXACT text as shown for the job-specific location
5. If you cannot find a job-specific location, return ""

CRITICAL RULES:
- Visit the URL and read ACTUAL page content - do NOT use your knowledge of where companies are based
- Do NOT use company headquarters unless explicitly stated as job location
- Extract ONLY information VISIBLY DISPLAYED on the page
- Do NOT guess, infer, or make up information based on company knowledge
- The location MUST be what you see near the job title or in job details, NOT from header/footer

BEFORE YOU RESPOND:
1. Visit the URL and load the complete page
2. Find the job title at the top of the page
3. Look IMMEDIATELY next to or below the job title for the location
4. Copy that location EXACTLY as shown
5. DO NOT use your knowledge of where ${url.includes('adobe') ? 'Adobe' : url.includes('google') ? 'Google' : url.includes('microsoft') ? 'Microsoft' : 'this company'} is headquartered

Return ONLY a valid JSON object (no markdown, no code blocks, no explanations):
{
  "companyName": "exact company name from page",
  "position": "exact job title from page",
  "location": "exact location shown near job title (NOT from your knowledge)",
  "summary": "• Point 1\\n• Point 2\\n• Point 3"
}

URL to visit: ${url}
`;

  const response = await queryPerplexityForJobExtraction(prompt);
  
  if (response.error) {
    throw new Error(response.errorMessage || 'Failed to analyze job posting');
  }

  const extractedData = parseJobJSON(response.text || '');

  // Validate required fields
  if (!extractedData.position || extractedData.position.length < 3) {
    throw new Error('Could not extract valid job position');
  }

  if (!extractedData.companyName || extractedData.companyName.length < 2) {
    throw new Error('Could not extract valid company name');
  }

  // Validate location - warn if it looks suspicious (like company HQ instead of job location)
  const location = extractedData.location?.trim() || '';
  const summary = extractedData.summary?.toLowerCase() || '';
  
  // Check if summary mentions a different city than the extracted location
  if (location && summary) {
    const majorCities = [
      'paris', 'london', 'berlin', 'tokyo', 'sydney', 'toronto', 'singapore',
      'mumbai', 'dubai', 'madrid', 'amsterdam', 'stockholm', 'copenhagen'
    ];
    
    for (const city of majorCities) {
      if (summary.includes(city) && !location.toLowerCase().includes(city)) {
        console.warn(`⚠️ Location mismatch detected: extracted location is "${location}" but job description mentions "${city}"`);
      }
    }
  }

  return {
    companyName: extractedData.companyName.trim(),
    position: extractedData.position.trim(),
    location: location,
    summary: extractedData.summary?.trim() || '',
  };
}

/**
 * Extract detailed job information (full description + insights)
 * Only called when detailed information is needed
 */
async function extractDetailedJobInfo(url: string, basicInfo: BasicJobInfo): Promise<DetailedJobInfo> {
  const prompt = `
You are extracting detailed information from a job posting.

URL TO VISIT: ${url}

VISIT THE URL AND READ THE ACTUAL PAGE CONTENT.

You already extracted these basic fields:
- Company: ${basicInfo.companyName}
- Position: ${basicInfo.position}
- Location: ${basicInfo.location}

Now extract COMPLETE detailed information and return as JSON:

1. fullJobDescription: Extract the COMPLETE, FULL text from ALL sections on the page
   - Include: Overview, Responsibilities, Requirements, Qualifications, Skills, Experience, Benefits, Culture, etc.
   - Include ALL paragraphs, ALL bullet points, ALL text
   - Use \\n\\n for paragraph breaks, • for bullet points
   - Do NOT summarize - extract the COMPLETE text (1000-5000+ characters typical)

2. jobInsights: Provide concise summaries for each area:
   - keyResponsibilities: 2-3 main duties (50-100 words)
   - requiredSkills: Top 5-7 critical skills (50-80 words)
   - experienceLevel: Years required, seniority level (30-50 words)
   - compensationBenefits: Salary, benefits, work arrangement (40-70 words, or "Not specified" if unavailable)
   - companyCulture: Work environment, values (50-80 words)
   - growthOpportunities: Career development, advancement (40-70 words, or "Not specified" if unavailable)

RULES:
- Visit the URL and read the ACTUAL content
- For fullJobDescription: include EVERYTHING - completeness is critical
- For jobInsights: provide useful summaries based on page content
- If specific insight info not available, use "Details not specified in posting"
- Do NOT invent or hallucinate information

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "fullJobDescription": "complete full description with all sections",
  "jobInsights": {
    "keyResponsibilities": "main duties",
    "requiredSkills": "critical skills",
    "experienceLevel": "experience required",
    "compensationBenefits": "salary and benefits",
    "companyCulture": "culture and values",
    "growthOpportunities": "growth potential"
  }
}

URL to visit: ${url}
`;

  const response = await queryPerplexityForJobExtraction(prompt);
  
  if (response.error) {
    throw new Error(response.errorMessage || 'Failed to extract detailed information');
  }

  const extractedData = parseJobJSON(response.text || '');

  return {
    ...basicInfo,
    fullJobDescription: extractedData.fullJobDescription?.trim() || '',
    jobInsights: {
      keyResponsibilities: extractedData.jobInsights?.keyResponsibilities?.trim() || 'Details not specified in posting',
      requiredSkills: extractedData.jobInsights?.requiredSkills?.trim() || 'Details not specified in posting',
      experienceLevel: extractedData.jobInsights?.experienceLevel?.trim() || 'Details not specified in posting',
      compensationBenefits: extractedData.jobInsights?.compensationBenefits?.trim() || 'Details not specified in posting',
      companyCulture: extractedData.jobInsights?.companyCulture?.trim() || 'Details not specified in posting',
      growthOpportunities: extractedData.jobInsights?.growthOpportunities?.trim() || 'Details not specified in posting',
    },
  };
}

/**
 * Main extraction function with configurable detail level
 * 
 * @param url - Job posting URL to extract from
 * @param options - Configuration options
 * @returns BasicJobInfo or DetailedJobInfo depending on options.detailed
 * 
 * @example
 * // Basic extraction (fast, reliable)
 * const basicInfo = await extractJobInfo(url, { detailed: false });
 * 
 * @example
 * // Detailed extraction (includes full description and insights)
 * const detailedInfo = await extractJobInfo(url, { detailed: true });
 */
export async function extractJobInfo(
  url: string,
  options: JobExtractionOptions = { detailed: false }
): Promise<BasicJobInfo | DetailedJobInfo> {
  // First, always extract basic info (fast and reliable)
  const basicInfo = await extractBasicJobInfo(url);
  
  // If detailed info requested, make second call
  if (options.detailed) {
    return await extractDetailedJobInfo(url, basicInfo);
  }
  
  return basicInfo;
}


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

/**
 * Response from the extract-job-url endpoint
 */
interface ScrapedJobContent {
  status: string;
  content: string;
  title?: string;
  company?: string;
  location?: string;
  url: string;
}

export interface JobTags {
  industry: string[];           // ["Technology", "SaaS", "Fintech"]
  sector: string;               // "Technology" (principal)
  seniority: string;            // "Senior", "Mid-level", "Entry-level"
  employmentType: string[];     // ["Full-time", "Remote"]
  technologies: string[];        // ["React", "TypeScript", "Node.js"]
  skills: string[];             // ["Leadership", "Agile", "Communication"]
  location: {
    city?: string;
    country?: string;
    remote: boolean;
    hybrid: boolean;
  };
  companySize?: string;         // "Startup", "Mid-size", "Enterprise"
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
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
  jobTags?: JobTags;
}

export interface JobExtractionOptions {
  detailed?: boolean;
}

/**
 * ===========================================
 * GPT-BASED JOB EXTRACTION (PRIMARY METHOD)
 * Uses Puppeteer scraping + GPT-4o analysis
 * ===========================================
 */

/**
 * Scrape job page content using Puppeteer endpoint
 * @param url - Job posting URL
 * @returns Scraped page content
 */
async function scrapeJobPage(url: string): Promise<ScrapedJobContent> {
  console.log('🔍 [GPT Method] Scraping job page with Puppeteer:', url);
  
  const response = await fetch('/api/extract-job-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to scrape page: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.status !== 'success') {
    throw new Error(data.message || 'Failed to extract job content from page');
  }

  console.log('✅ [GPT Method] Page scraped successfully:', {
    contentLength: data.content?.length || 0,
    hasTitle: !!data.title,
    hasCompany: !!data.company,
  });

  return data;
}

/**
 * Analyze scraped job content with GPT-4o
 * @param scrapedContent - Content from Puppeteer scraping
 * @returns Detailed job info with insights
 */
async function analyzeJobWithGPT(scrapedContent: ScrapedJobContent): Promise<DetailedJobInfo> {
  console.log('🤖 [GPT Method] Analyzing job content with GPT-4o...');
  
  const prompt = `You are an expert job posting analyzer. Analyze the following job posting content and extract structured information.

JOB POSTING CONTENT:
Title: ${scrapedContent.title || 'Unknown'}
Company: ${scrapedContent.company || 'Unknown'}
Location: ${scrapedContent.location || 'Unknown'}

Full Content:
${scrapedContent.content.substring(0, 8000)}

Extract the following information and return as JSON:

{
  "companyName": "exact company name",
  "position": "exact job title",
  "location": "job location",
  "summary": "3 concise bullet points about the job (format: • Point 1\\n• Point 2\\n• Point 3)",
  "fullJobDescription": "complete job description including responsibilities, requirements, etc.",
  "jobInsights": {
    "keyResponsibilities": "2-3 main duties (50-100 words)",
    "requiredSkills": "top 5-7 critical skills (50-80 words)",
    "experienceLevel": "years required, seniority level (30-50 words)",
    "compensationBenefits": "salary, benefits if mentioned (40-70 words, or 'Not specified')",
    "companyCulture": "work environment, values if mentioned (50-80 words, or 'Details not specified')",
    "growthOpportunities": "career development if mentioned (40-70 words, or 'Details not specified')"
  },
  "jobTags": {
    "industry": ["array of industries"],
    "sector": "primary sector",
    "seniority": "Entry-level|Mid-level|Senior|Lead|Principal|Executive|Internship",
    "employmentType": ["Full-time", "Remote", etc.],
    "technologies": ["specific technologies/tools mentioned"],
    "skills": ["soft skills and methodologies"],
    "location": {
      "city": "city if mentioned",
      "country": "country if mentioned",
      "remote": true/false,
      "hybrid": true/false
    }
  }
}

RULES:
- Extract ONLY information explicitly present in the content
- Use the provided title/company/location if they are valid
- For summary: create 3 concise bullet points highlighting the key aspects
- If information is not available, use empty strings, empty arrays, or "Not specified"/"Details not specified"
- Return ONLY valid JSON - no markdown, no code blocks`;

  const response = await fetch('/api/chatgpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      type: 'cv-edit', // This type allows JSON responses
      prompt 
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GPT API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  
  if (data.status !== 'success') {
    throw new Error(data.message || 'GPT analysis failed');
  }

  // Parse the response content
  let parsedContent;
  if (typeof data.content === 'object') {
    parsedContent = data.content;
  } else if (typeof data.content === 'string') {
    try {
      // Clean markdown if present
      let cleanContent = data.content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        parsedContent = JSON.parse(cleanContent);
      }
    } catch (parseError) {
      console.error('Failed to parse GPT response:', parseError);
      throw new Error('Failed to parse GPT response as JSON');
    }
  } else {
    throw new Error('Unexpected GPT response format');
  }

  console.log('✅ [GPT Method] GPT analysis complete:', {
    hasInsights: !!parsedContent.jobInsights,
    hasTags: !!parsedContent.jobTags,
  });

  // Build the DetailedJobInfo object
  const result: DetailedJobInfo = {
    companyName: parsedContent.companyName || scrapedContent.company || '',
    position: parsedContent.position || scrapedContent.title || '',
    location: parsedContent.location || scrapedContent.location || '',
    summary: parsedContent.summary || '',
    // IMPORTANT: Save the FULL scraped content, not truncated
    // Use scraped content as primary source (most complete), GPT extraction as fallback
    fullJobDescription: scrapedContent.content || parsedContent.fullJobDescription || '',
    jobInsights: {
      keyResponsibilities: parsedContent.jobInsights?.keyResponsibilities || 'Details not specified in posting',
      requiredSkills: parsedContent.jobInsights?.requiredSkills || 'Details not specified in posting',
      experienceLevel: parsedContent.jobInsights?.experienceLevel || 'Details not specified in posting',
      compensationBenefits: parsedContent.jobInsights?.compensationBenefits || 'Not specified',
      companyCulture: parsedContent.jobInsights?.companyCulture || 'Details not specified in posting',
      growthOpportunities: parsedContent.jobInsights?.growthOpportunities || 'Details not specified in posting',
    },
    jobTags: parsedContent.jobTags ? {
      industry: Array.isArray(parsedContent.jobTags.industry) ? parsedContent.jobTags.industry : [],
      sector: parsedContent.jobTags.sector || '',
      seniority: parsedContent.jobTags.seniority || '',
      employmentType: Array.isArray(parsedContent.jobTags.employmentType) ? parsedContent.jobTags.employmentType : [],
      technologies: Array.isArray(parsedContent.jobTags.technologies) ? parsedContent.jobTags.technologies : [],
      skills: Array.isArray(parsedContent.jobTags.skills) ? parsedContent.jobTags.skills : [],
      location: {
        city: parsedContent.jobTags.location?.city,
        country: parsedContent.jobTags.location?.country,
        remote: !!parsedContent.jobTags.location?.remote,
        hybrid: !!parsedContent.jobTags.location?.hybrid,
      },
    } : undefined,
  };

  return result;
}

/**
 * Extract job info using GPT-based method (Puppeteer + GPT-4o)
 * This is the PRIMARY extraction method - more reliable than Perplexity
 * 
 * @param url - Job posting URL
 * @returns DetailedJobInfo with all extracted data
 */
export async function extractJobInfoWithGPT(url: string): Promise<DetailedJobInfo> {
  // Step 1: Scrape the page with Puppeteer
  const scrapedContent = await scrapeJobPage(url);
  
  // Step 2: Analyze with GPT-4o
  const detailedInfo = await analyzeJobWithGPT(scrapedContent);
  
  return detailedInfo;
}

/**
 * ===========================================
 * PERPLEXITY-BASED JOB EXTRACTION (FALLBACK)
 * Uses Perplexity API with web browsing
 * ===========================================
 */

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

3. jobTags: Extract structured tags for analytics (CRITICAL - be precise and consistent):
   - industry: Array of industry categories (e.g., ["Technology", "SaaS", "Fintech"]). Include primary and sub-industries mentioned.
   - sector: Single primary sector (e.g., "Technology", "Healthcare", "Finance", "Education", "Retail", "Manufacturing", "Consulting", "Media", "Non-profit", "Government")
   - seniority: Single value - "Entry-level", "Mid-level", "Senior", "Lead", "Principal", "Executive", or "Internship" based on requirements
   - employmentType: Array of employment types (e.g., ["Full-time", "Remote"] or ["Part-time", "Contract"]). Options: "Full-time", "Part-time", "Contract", "Internship", "Remote", "Hybrid", "On-site"
   - technologies: Array of specific technologies/tools mentioned (e.g., ["React", "TypeScript", "Node.js", "AWS", "Docker"]). Extract from skills/requirements sections.
   - skills: Array of soft skills and methodologies (e.g., ["Leadership", "Agile", "Communication", "Problem-solving", "Teamwork"])
   - location: Object with:
     * city: City name if mentioned (e.g., "Paris", "New York", "London")
     * country: Country name if mentioned (e.g., "France", "United States", "United Kingdom")
     * remote: Boolean - true if remote work is mentioned or required
     * hybrid: Boolean - true if hybrid work is mentioned
   - companySize: Optional - "Startup" (1-50), "Small" (51-200), "Mid-size" (201-1000), "Enterprise" (1000+), or "Not specified" if unclear
   - salaryRange: Optional object with:
     * min: Minimum salary number (if mentioned)
     * max: Maximum salary number (if mentioned)
     * currency: Currency code (e.g., "USD", "EUR", "GBP")

RULES FOR TAGS:
- Extract ONLY information explicitly mentioned or clearly implied in the posting
- For industry: Use standard industry names (Technology, Healthcare, Finance, etc.)
- For seniority: Analyze experience requirements (years, level indicators) to determine level
- For technologies: Extract specific tech names, frameworks, tools mentioned
- For skills: Extract soft skills, methodologies, certifications mentioned
- For location: Parse the location string to extract city/country if possible
- For remote/hybrid: Check if "remote", "hybrid", "work from home" is mentioned
- For companySize: Infer from context if not explicitly stated (startup mentions, employee count, etc.)
- For salaryRange: Extract numbers and currency if salary information is provided
- If information is not available, use empty arrays [], empty strings "", false booleans, or omit optional fields
- Be consistent with naming (e.g., always use "Full-time" not "Full time" or "FT")

RULES:
- Visit the URL and read the ACTUAL content
- For fullJobDescription: include EVERYTHING - completeness is critical
- For jobInsights: provide useful summaries based on page content
- For jobTags: extract structured data precisely for analytics purposes
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
  },
  "jobTags": {
    "industry": ["Technology", "SaaS"],
    "sector": "Technology",
    "seniority": "Senior",
    "employmentType": ["Full-time", "Remote"],
    "technologies": ["React", "TypeScript", "Node.js"],
    "skills": ["Leadership", "Agile"],
    "location": {
      "city": "Paris",
      "country": "France",
      "remote": true,
      "hybrid": false
    },
    "companySize": "Mid-size",
    "salaryRange": {
      "min": 80000,
      "max": 120000,
      "currency": "EUR"
    }
  }
}

URL to visit: ${url}
`;

  const response = await queryPerplexityForJobExtraction(prompt);
  
  if (response.error) {
    throw new Error(response.errorMessage || 'Failed to extract detailed information');
  }

  const extractedData = parseJobJSON(response.text || '');

  // Parse and validate jobTags
  let jobTags: JobTags | undefined;
  if (extractedData.jobTags) {
    try {
      const tags = extractedData.jobTags;
      jobTags = {
        industry: Array.isArray(tags.industry) ? tags.industry.filter((i: any) => typeof i === 'string') : [],
        sector: typeof tags.sector === 'string' ? tags.sector.trim() : '',
        seniority: typeof tags.seniority === 'string' ? tags.seniority.trim() : '',
        employmentType: Array.isArray(tags.employmentType) ? tags.employmentType.filter((e: any) => typeof e === 'string') : [],
        technologies: Array.isArray(tags.technologies) ? tags.technologies.filter((t: any) => typeof t === 'string') : [],
        skills: Array.isArray(tags.skills) ? tags.skills.filter((s: any) => typeof s === 'string') : [],
        location: {
          city: typeof tags.location?.city === 'string' ? tags.location.city.trim() : undefined,
          country: typeof tags.location?.country === 'string' ? tags.location.country.trim() : undefined,
          remote: typeof tags.location?.remote === 'boolean' ? tags.location.remote : false,
          hybrid: typeof tags.location?.hybrid === 'boolean' ? tags.location.hybrid : false,
        },
        companySize: typeof tags.companySize === 'string' ? tags.companySize.trim() : undefined,
        salaryRange: tags.salaryRange ? {
          min: typeof tags.salaryRange.min === 'number' ? tags.salaryRange.min : undefined,
          max: typeof tags.salaryRange.max === 'number' ? tags.salaryRange.max : undefined,
          currency: typeof tags.salaryRange.currency === 'string' ? tags.salaryRange.currency.trim() : undefined,
        } : undefined,
      };
    } catch (error) {
      console.warn('Failed to parse jobTags:', error);
      jobTags = undefined;
    }
  }

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
    jobTags,
  };
}

/**
 * Generate jobTags from a job description text (fallback when URL is not available)
 * Uses ChatGPT API to analyze the description and extract structured tags
 * 
 * @param description - Full job description text
 * @param title - Job title/position
 * @param company - Company name
 * @param location - Job location string
 * @returns jobTags object with structured tags
 */
export async function generateJobTagsFromDescription(
  description: string,
  title: string,
  company: string,
  location: string = ''
): Promise<JobTags | undefined> {
  if (!description || description.trim().length === 0) {
    return undefined;
  }

  const prompt = `
You are an expert job analyst. Extract structured tags from the job description provided below for analytics purposes.

JOB POSTING DETAILS:
- Job Title: ${title}
- Company: ${company}
- Location: ${location}
- Full Job Description:
${description.substring(0, 4000)}

Your task is to analyze this job description and extract structured tags. Return ONLY a valid JSON object with the following structure:

{
  "jobTags": {
    "industry": ["Technology", "SaaS"],
    "sector": "Technology",
    "seniority": "Senior",
    "employmentType": ["Full-time", "Remote"],
    "technologies": ["React", "TypeScript", "Node.js"],
    "skills": ["Leadership", "Agile"],
    "location": {
      "city": "Paris",
      "country": "France",
      "remote": true,
      "hybrid": false
    },
    "companySize": "Mid-size",
    "salaryRange": {
      "min": 80000,
      "max": 120000,
      "currency": "EUR"
    }
  }
}

TAG EXTRACTION RULES:
- industry: Array of industry categories (e.g., ["Technology", "SaaS", "Fintech"]). Include primary and sub-industries mentioned.
- sector: Single primary sector from: "Technology", "Healthcare", "Finance", "Education", "Retail", "Manufacturing", "Consulting", "Media", "Non-profit", "Government", or "Other"
- seniority: Single value - "Entry-level", "Mid-level", "Senior", "Lead", "Principal", "Executive", or "Internship" based on requirements
- employmentType: Array of employment types. Options: "Full-time", "Part-time", "Contract", "Internship", "Remote", "Hybrid", "On-site"
- technologies: Array of specific technologies/tools mentioned (e.g., ["React", "TypeScript", "Node.js", "AWS", "Docker"])
- skills: Array of soft skills and methodologies (e.g., ["Leadership", "Agile", "Communication", "Problem-solving"])
- location: Object with city, country (extract from location string or description), remote (true if mentioned), hybrid (true if mentioned)
- companySize: "Startup" (1-50), "Small" (51-200), "Mid-size" (201-1000), "Enterprise" (1000+), or omit if unclear
- salaryRange: Extract numbers and currency if salary information is provided, or omit if not available

CRITICAL RULES:
- Extract ONLY information explicitly mentioned or clearly implied in the description
- Do NOT invent or hallucinate information
- If information is not available, use empty arrays [], empty strings "", false booleans, or omit optional fields
- Be consistent with naming (e.g., always use "Full-time" not "Full time")
- Return ONLY valid JSON - no markdown, no code blocks, no explanations

Return ONLY the JSON object:
`;

  try {
    const response = await fetch('/api/chatgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cv-edit', prompt }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    if (!text) {
      throw new Error('Empty response from API');
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to parse API response as JSON');
      }
    }

    if (data.status !== 'success') {
      throw new Error(data.message || 'API returned error status');
    }

    // Extract jobTags from response
    let jobTags;
    if (data.content && typeof data.content === 'object') {
      if (data.content.jobTags) {
        jobTags = data.content.jobTags;
      } else if (data.content.industry) {
        jobTags = data.content;
      } else {
        try {
          const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          jobTags = parsed.jobTags || parsed;
        } catch {
          throw new Error('Could not extract jobTags from API response');
        }
      }
    } else if (typeof data.content === 'string') {
      try {
        const parsed = JSON.parse(data.content);
        jobTags = parsed.jobTags || parsed;
      } catch {
        const jsonMatch = data.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          jobTags = parsed.jobTags || parsed;
        } else {
          throw new Error('Could not parse jobTags from string content');
        }
      }
    } else {
      throw new Error('Unexpected API response format');
    }

    // Validate and return jobTags with defaults
    return {
      industry: Array.isArray(jobTags.industry) ? jobTags.industry.filter((i: any) => typeof i === 'string') : [],
      sector: typeof jobTags.sector === 'string' ? jobTags.sector.trim() : '',
      seniority: typeof jobTags.seniority === 'string' ? jobTags.seniority.trim() : '',
      employmentType: Array.isArray(jobTags.employmentType) ? jobTags.employmentType.filter((e: any) => typeof e === 'string') : [],
      technologies: Array.isArray(jobTags.technologies) ? jobTags.technologies.filter((t: any) => typeof t === 'string') : [],
      skills: Array.isArray(jobTags.skills) ? jobTags.skills.filter((s: any) => typeof s === 'string') : [],
      location: {
        city: typeof jobTags.location?.city === 'string' ? jobTags.location.city.trim() : undefined,
        country: typeof jobTags.location?.country === 'string' ? jobTags.location.country.trim() : undefined,
        remote: typeof jobTags.location?.remote === 'boolean' ? jobTags.location.remote : false,
        hybrid: typeof jobTags.location?.hybrid === 'boolean' ? jobTags.location.hybrid : false,
      },
      companySize: typeof jobTags.companySize === 'string' ? jobTags.companySize.trim() : undefined,
      salaryRange: jobTags.salaryRange ? {
        min: typeof jobTags.salaryRange.min === 'number' ? jobTags.salaryRange.min : undefined,
        max: typeof jobTags.salaryRange.max === 'number' ? jobTags.salaryRange.max : undefined,
        currency: typeof jobTags.salaryRange.currency === 'string' ? jobTags.salaryRange.currency.trim() : undefined,
      } : undefined,
    };
  } catch (error) {
    console.error('Error generating jobTags from description:', error);
    return undefined;
  }
}

/**
 * Generate jobInsights from a job description text (fallback when URL is not available)
 * Uses ChatGPT API to analyze the description and extract structured insights
 * 
 * @param description - Full job description text
 * @param title - Job title/position
 * @param company - Company name
 * @returns jobInsights object with 6 structured sections
 */
export async function generateJobInsightsFromDescription(
  description: string,
  title: string,
  company: string
): Promise<DetailedJobInfo['jobInsights']> {
  if (!description || description.trim().length === 0) {
    throw new Error('Job description is required to generate insights');
  }

  const prompt = `
You are an expert career consultant analyzing a job posting. Extract structured insights from the job description provided below.

JOB POSTING DETAILS:
- Job Title: ${title}
- Company: ${company}
- Full Job Description:
${description.substring(0, 4000)}

Your task is to analyze this job description and extract structured insights. Return ONLY a valid JSON object with the following structure:

{
  "jobInsights": {
    "keyResponsibilities": "2-3 main duties and responsibilities (50-100 words). Focus on what the person will actually do day-to-day.",
    "requiredSkills": "Top 5-7 critical skills needed (50-80 words). Include both technical and soft skills mentioned.",
    "experienceLevel": "Years of experience required, seniority level, and any specific experience requirements (30-50 words).",
    "compensationBenefits": "Salary range, benefits, work arrangement, perks if mentioned (40-70 words). If not specified, use 'Not specified'.",
    "companyCulture": "Work environment, company values, team culture, work style if mentioned (50-80 words). If not specified, use 'Details not specified in posting'.",
    "growthOpportunities": "Career development, advancement opportunities, learning opportunities if mentioned (40-70 words). If not specified, use 'Details not specified in posting'."
  }
}

CRITICAL RULES:
- Extract ONLY information that is explicitly mentioned or clearly implied in the description
- Do NOT invent or hallucinate information
- If a section cannot be determined from the description, use "Details not specified in posting"
- Keep each section concise but informative (within the word limits specified)
- Return ONLY valid JSON - no markdown, no code blocks, no explanations
- The JSON must be parseable and valid

Return ONLY the JSON object:
`;

  try {
    const response = await fetch('/api/chatgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cv-edit', prompt }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    if (!text) {
      throw new Error('Empty response from API');
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to parse API response as JSON');
      }
    }

    if (data.status !== 'success') {
      throw new Error(data.message || 'API returned error status');
    }

    // Extract jobInsights from response
    let jobInsights;
    if (data.content && typeof data.content === 'object') {
      // If content is already an object
      if (data.content.jobInsights) {
        jobInsights = data.content.jobInsights;
      } else if (data.content.keyResponsibilities) {
        // If content is already the jobInsights object
        jobInsights = data.content;
      } else {
        // Try to parse as string if it's a string
        try {
          const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          jobInsights = parsed.jobInsights || parsed;
        } catch {
          throw new Error('Could not extract jobInsights from API response');
        }
      }
    } else if (typeof data.content === 'string') {
      // Content is a string, try to parse it
      try {
        const parsed = JSON.parse(data.content);
        jobInsights = parsed.jobInsights || parsed;
      } catch {
        // Try to extract JSON from the string
        const jsonMatch = data.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          jobInsights = parsed.jobInsights || parsed;
        } else {
          throw new Error('Could not parse jobInsights from string content');
        }
      }
    } else {
      throw new Error('Unexpected API response format');
    }

    // Validate and return jobInsights with defaults
    return {
      keyResponsibilities: jobInsights.keyResponsibilities?.trim() || 'Details not specified in posting',
      requiredSkills: jobInsights.requiredSkills?.trim() || 'Details not specified in posting',
      experienceLevel: jobInsights.experienceLevel?.trim() || 'Details not specified in posting',
      compensationBenefits: jobInsights.compensationBenefits?.trim() || 'Not specified',
      companyCulture: jobInsights.companyCulture?.trim() || 'Details not specified in posting',
      growthOpportunities: jobInsights.growthOpportunities?.trim() || 'Details not specified in posting',
    };
  } catch (error) {
    console.error('Error generating jobInsights from description:', error);
    throw new Error(`Failed to generate job insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
  
  // For detailed extraction, use cascade: GPT (primary) -> Perplexity (fallback)
  if (options.detailed) {
    // Try GPT-based extraction first (Puppeteer + GPT-4o) - most reliable
    try {
      console.log('🎯 [extractJobInfo] Trying PRIMARY method: GPT (Puppeteer + GPT-4o)');
      const gptResult = await extractJobInfoWithGPT(url);
      console.log('✅ [extractJobInfo] GPT method succeeded');
      return gptResult;
    } catch (gptError) {
      console.warn('⚠️ [extractJobInfo] GPT method failed:', gptError instanceof Error ? gptError.message : gptError);
      
      // Fallback to Perplexity
      try {
        console.log('🔄 [extractJobInfo] Trying FALLBACK method: Perplexity');
        const basicInfo = await extractBasicJobInfo(url);
        const perplexityResult = await extractDetailedJobInfo(url, basicInfo);
        console.log('✅ [extractJobInfo] Perplexity method succeeded');
        return perplexityResult;
      } catch (perplexityError) {
        console.error('❌ [extractJobInfo] Both GPT and Perplexity methods failed');
        console.error('   GPT error:', gptError instanceof Error ? gptError.message : gptError);
        console.error('   Perplexity error:', perplexityError instanceof Error ? perplexityError.message : perplexityError);
        // Re-throw the original GPT error (usually more informative)
        throw gptError;
      }
    }
  }
  
  // For basic extraction, use Perplexity (it's faster for basic info)
  const basicInfo = await extractBasicJobInfo(url);
  return basicInfo;
}

/**
 * Job data interface for local fallback generation
 * This matches the Job type from job-board types
 */
export interface JobDataForFallback {
  title: string;
  company: string;
  location?: string;
  description?: string;
  tags?: string[];
  type?: string;
  seniority?: string;
  salaryRange?: string;
  remote?: string;
}

/**
 * Generate basic job insights from existing job data (LOCAL FALLBACK)
 * This function does NOT make any API calls - it extracts information from the job data
 * we already have from the job board. Use this as a last resort when API calls fail.
 * 
 * @param jobData - Job data from the job board
 * @returns jobInsights object with structured sections extracted locally
 */
export function generateBasicInsightsFromJobData(
  jobData: JobDataForFallback
): DetailedJobInfo['jobInsights'] {
  const { title, company, location, description, tags, type, seniority, salaryRange, remote } = jobData;
  
  // Extract key responsibilities from description if available
  let keyResponsibilities = 'Details not available - please check the job posting directly';
  if (description && description.trim().length > 50) {
    // Try to find responsibility-related content
    const responsibilityPatterns = [
      /responsibilities?:?\s*([\s\S]*?)(?=requirements?|qualifications?|skills?|experience|about|benefits|$)/i,
      /what you['']?ll do:?\s*([\s\S]*?)(?=what you|requirements?|qualifications?|skills?|$)/i,
      /your role:?\s*([\s\S]*?)(?=requirements?|qualifications?|skills?|about|$)/i,
    ];
    
    for (const pattern of responsibilityPatterns) {
      const match = description.match(pattern);
      if (match && match[1] && match[1].trim().length > 20) {
        // Clean and truncate
        keyResponsibilities = match[1].trim().substring(0, 300);
        if (match[1].length > 300) keyResponsibilities += '...';
        break;
      }
    }
    
    // If no pattern matched, use first part of description
    if (keyResponsibilities.includes('Details not available')) {
      const firstPart = description.substring(0, 300).trim();
      if (firstPart.length > 50) {
        keyResponsibilities = firstPart + (description.length > 300 ? '...' : '');
      }
    }
  }
  
  // Build required skills from tags
  let requiredSkills = 'Skills not specified';
  if (tags && tags.length > 0) {
    requiredSkills = `Key skills: ${tags.slice(0, 7).join(', ')}`;
  } else if (description) {
    // Try to extract from description
    const skillsMatch = description.match(/skills?:?\s*([\s\S]*?)(?=experience|responsibilities?|qualifications?|about|$)/i);
    if (skillsMatch && skillsMatch[1] && skillsMatch[1].trim().length > 10) {
      requiredSkills = skillsMatch[1].trim().substring(0, 200);
    }
  }
  
  // Build experience level
  let experienceLevel = 'Experience level not specified';
  if (seniority) {
    experienceLevel = `Level: ${seniority}`;
  }
  if (type) {
    experienceLevel += experienceLevel.includes('Level') ? ` | Type: ${type}` : `Type: ${type}`;
  }
  
  // Build compensation/benefits
  let compensationBenefits = 'Compensation details not specified';
  if (salaryRange && salaryRange.trim().length > 0) {
    compensationBenefits = `Salary: ${salaryRange}`;
  }
  if (remote) {
    const remoteInfo = remote === 'remote' ? 'Remote work available' : 
                       remote === 'hybrid' ? 'Hybrid work model' : 
                       remote === 'on-site' ? 'On-site position' : '';
    if (remoteInfo) {
      compensationBenefits += compensationBenefits.includes('not specified') 
        ? remoteInfo 
        : ` | ${remoteInfo}`;
    }
  }
  
  // Company culture - try to extract from description
  let companyCulture = 'Company culture details not available in listing';
  if (description) {
    const culturePatterns = [
      /about (?:us|the company|our company):?\s*([\s\S]*?)(?=responsibilities?|requirements?|qualifications?|$)/i,
      /company culture:?\s*([\s\S]*?)(?=responsibilities?|requirements?|qualifications?|$)/i,
      /who we are:?\s*([\s\S]*?)(?=responsibilities?|requirements?|what you|$)/i,
    ];
    
    for (const pattern of culturePatterns) {
      const match = description.match(pattern);
      if (match && match[1] && match[1].trim().length > 20) {
        companyCulture = match[1].trim().substring(0, 250);
        if (match[1].length > 250) companyCulture += '...';
        break;
      }
    }
  }
  
  // Growth opportunities - try to extract from description
  let growthOpportunities = 'Growth opportunity details not available in listing';
  if (description) {
    const growthPatterns = [
      /growth|career development|advancement|learning|training/i
    ];
    
    if (growthPatterns.some(p => p.test(description))) {
      growthOpportunities = 'Potential growth opportunities mentioned in job posting - see full description';
    }
  }
  
  return {
    keyResponsibilities,
    requiredSkills,
    experienceLevel,
    compensationBenefits,
    companyCulture,
    growthOpportunities,
  };
}

/**
 * Generate a basic summary description from job data (LOCAL FALLBACK)
 * Creates a formatted bullet-point summary without making API calls
 * 
 * @param jobData - Job data from the job board
 * @returns Formatted summary string with bullet points
 */
export function generateBasicSummaryFromJobData(jobData: JobDataForFallback): string {
  const { title, company, location, tags, type, seniority, remote, salaryRange } = jobData;
  
  const bulletPoints: string[] = [];
  
  // First bullet: Role overview
  let roleOverview = `${title} position at ${company}`;
  if (location) roleOverview += ` based in ${location}`;
  if (remote === 'remote') roleOverview += ' (Remote)';
  else if (remote === 'hybrid') roleOverview += ' (Hybrid)';
  bulletPoints.push(roleOverview);
  
  // Second bullet: Job type and level
  const details: string[] = [];
  if (type) details.push(type);
  if (seniority) details.push(`${seniority} level`);
  if (salaryRange) details.push(salaryRange);
  if (details.length > 0) {
    bulletPoints.push(details.join(' • '));
  }
  
  // Third bullet: Key skills/tags
  if (tags && tags.length > 0) {
    bulletPoints.push(`Key skills: ${tags.slice(0, 5).join(', ')}`);
  }
  
  // Format as bullet points
  return bulletPoints.map(point => `• ${point}`).join('\n');
}


/**
 * ===========================================
 * SIMPLE JOB EXTRACTION WITH PUPPETEER + GPT
 * Puppeteer scrapes, GPT extracts key info
 * ===========================================
 */

/**
 * Scrape job page content using server endpoint
 */
async function scrapeJobPageSimple(url: string): Promise<{ content: string; title?: string; company?: string; location?: string }> {
  console.log('🔍 [Scrape] Fetching page content from:', url);
  
  const response = await fetch('/api/extract-job-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to scrape page: ${error}`);
  }

  const data = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.message || 'Scraping failed');
  }

  console.log('✅ [Scrape] Got content:', { 
    length: data.content?.length || 0,
    title: data.title,
    company: data.company 
  });

  return {
    content: data.content || '',
    title: data.title,
    company: data.company,
    location: data.location
  };
}

/**
 * Extract company name from URL (fallback)
 */
function extractCompanyFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    // Common patterns: careers.COMPANY.com, jobs.COMPANY.com, COMPANY.greenhouse.io
    const patterns = [
      /careers\.([a-z0-9-]+)\./i,
      /jobs\.([a-z0-9-]+)\./i,
      /([a-z0-9-]+)\.greenhouse\.io/i,
      /([a-z0-9-]+)\.lever\.co/i,
      /([a-z0-9-]+)\.workday\.com/i,
      /([a-z0-9-]+)\.myworkdayjobs\.com/i,
    ];
    
    for (const pattern of patterns) {
      const match = hostname.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        // Capitalize first letter
        return match[1].charAt(0).toUpperCase() + match[1].slice(1);
      }
    }
  } catch (e) {}
  return '';
}

/**
 * Extract job info from scraped content using GPT (simple prompt)
 */
async function extractWithGPTSimple(scraped: { content: string; title?: string; company?: string; location?: string }, url: string): Promise<DetailedJobInfo> {
  // Try to get company from URL if scraped company is bad
  let company = scraped.company || '';
  if (!company || company.length <= 2) {
    company = extractCompanyFromUrl(url);
  }
  
  // Truncate content for GPT
  const truncatedContent = scraped.content.substring(0, 4000);
  
  const prompt = `Extract job info from this page content. Return JSON only.

PAGE CONTENT:
${truncatedContent}

${scraped.title ? `DETECTED TITLE: ${scraped.title}` : ''}
${company ? `DETECTED COMPANY: ${company}` : ''}
${scraped.location ? `DETECTED LOCATION: ${scraped.location}` : ''}

Return this JSON:
{
  "companyName": "${company || 'extract from content'}",
  "position": "${scraped.title || 'extract job title from content'}",
  "location": "${scraped.location || 'extract from content'}",
  "summary": "• Key point 1\\n• Key point 2\\n• Key point 3",
  "keyResponsibilities": "main duties (1-2 sentences)",
  "requiredSkills": "key skills",
  "experienceLevel": "experience needed"
}

IMPORTANT: Use the DETECTED values if provided. Return valid JSON only.`;

  const response = await fetch('/api/chatgpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'cv-edit', prompt })
  });

  if (!response.ok) {
    throw new Error('GPT analysis failed');
  }

  const data = await response.json();
  
  if (data.status !== 'success') {
    throw new Error(data.message || 'GPT failed');
  }

  // Parse response
  let parsed;
  try {
    const content = data.content;
    if (typeof content === 'object') {
      parsed = content;
    } else {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    }
  } catch (e) {
    console.error('Failed to parse GPT response');
    // Use scraped data as fallback
    parsed = {
      companyName: scraped.company || '',
      position: scraped.title || '',
      location: scraped.location || ''
    };
  }

  console.log('✅ [GPT] Extracted:', { company: parsed.companyName, position: parsed.position });

  return {
    companyName: parsed.companyName || company || '',
    position: parsed.position || scraped.title || '',
    location: parsed.location || scraped.location || '',
    summary: parsed.summary || '',
    fullJobDescription: scraped.content.substring(0, 10000),
    jobInsights: {
      keyResponsibilities: parsed.keyResponsibilities || 'See full description',
      requiredSkills: parsed.requiredSkills || 'See full description',
      experienceLevel: parsed.experienceLevel || 'See full description',
      compensationBenefits: parsed.compensationBenefits || 'Not specified',
      companyCulture: 'See full description',
      growthOpportunities: 'See full description',
    }
  };
}

/**
 * ===========================================
 * URL TYPE DETECTION
 * Identifies the source platform for optimized extraction
 * ===========================================
 */

export type UrlType = 
  | 'linkedin' 
  | 'indeed' 
  | 'workday' 
  | 'lever' 
  | 'greenhouse' 
  | 'ashby' 
  | 'smartrecruiters' 
  | 'jobvite' 
  | 'icims'
  | 'bamboohr'
  | 'recruitee'
  | 'breezy'
  | 'jazz'
  | 'welcometothejungle'
  | 'generic';

/**
 * Platforms that require manual paste (login wall / anti-bot)
 */
export const PASTE_REQUIRED_PLATFORMS: UrlType[] = ['linkedin', 'indeed'];

/**
 * Detect the URL type/platform from a job posting URL
 * @param url - The job posting URL
 * @returns The detected platform type
 */
export function detectUrlType(url: string): UrlType {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    const fullUrl = url.toLowerCase();

    // LinkedIn - requires login
    if (hostname.includes('linkedin.com')) {
      return 'linkedin';
    }

    // Indeed - heavy anti-bot
    if (hostname.includes('indeed.com') || hostname.includes('indeed.')) {
      return 'indeed';
    }

    // Workday - various subdomains
    if (hostname.includes('myworkdayjobs.com') || hostname.includes('workday.com') || hostname.includes('wd5.myworkdayjobs.com')) {
      return 'workday';
    }

    // Lever
    if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co')) {
      return 'lever';
    }

    // Greenhouse
    if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse.io')) {
      return 'greenhouse';
    }

    // Ashby
    if (hostname.includes('ashbyhq.com') || hostname.includes('jobs.ashbyhq.com')) {
      return 'ashby';
    }

    // SmartRecruiters
    if (hostname.includes('smartrecruiters.com') || hostname.includes('jobs.smartrecruiters.com')) {
      return 'smartrecruiters';
    }

    // Jobvite
    if (hostname.includes('jobvite.com') || hostname.includes('jobs.jobvite.com')) {
      return 'jobvite';
    }

    // iCIMS
    if (hostname.includes('icims.com') || hostname.includes('careers-') || fullUrl.includes('icims')) {
      return 'icims';
    }

    // BambooHR
    if (hostname.includes('bamboohr.com')) {
      return 'bamboohr';
    }

    // Recruitee
    if (hostname.includes('recruitee.com')) {
      return 'recruitee';
    }

    // Breezy HR
    if (hostname.includes('breezy.hr')) {
      return 'breezy';
    }

    // JazzHR
    if (hostname.includes('jazz.co') || hostname.includes('applytojob.com')) {
      return 'jazz';
    }

    // Welcome to the Jungle
    if (hostname.includes('welcometothejungle.com') || hostname.includes('wttj.co')) {
      return 'welcometothejungle';
    }

    // Generic fallback
    return 'generic';
  } catch (error) {
    console.warn('Failed to parse URL for type detection:', error);
    return 'generic';
  }
}

/**
 * Check if a URL requires manual paste mode (login wall or heavy anti-bot)
 * @param url - The job posting URL
 * @returns true if paste mode should be shown
 */
export function requiresPasteMode(url: string): boolean {
  const urlType = detectUrlType(url);
  return PASTE_REQUIRED_PLATFORMS.includes(urlType);
}

/**
 * Get a human-readable name for the platform
 * @param urlType - The detected URL type
 * @returns Human-readable platform name
 */
export function getPlatformName(urlType: UrlType): string {
  const names: Record<UrlType, string> = {
    linkedin: 'LinkedIn',
    indeed: 'Indeed',
    workday: 'Workday',
    lever: 'Lever',
    greenhouse: 'Greenhouse',
    ashby: 'Ashby',
    smartrecruiters: 'SmartRecruiters',
    jobvite: 'Jobvite',
    icims: 'iCIMS',
    bamboohr: 'BambooHR',
    recruitee: 'Recruitee',
    breezy: 'Breezy HR',
    jazz: 'JazzHR',
    welcometothejungle: 'Welcome to the Jungle',
    generic: 'Job Board',
  };
  return names[urlType] || 'Job Board';
}

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
 * Main extraction function - SIMPLIFIED
 * Puppeteer scrapes the real page, GPT extracts key info
 *
 * @param url - Job posting URL to extract from
 * @param options - Configuration options  
 * @returns DetailedJobInfo with extracted data
 */
export async function extractJobInfo(
  url: string,
  options: JobExtractionOptions = { detailed: false }
): Promise<BasicJobInfo | DetailedJobInfo> {
  console.log('🚀 [extractJobInfo] Scraping + GPT extraction for:', url);
  
  // Step 1: Scrape the page (Puppeteer visits the real URL)
  const scraped = await scrapeJobPageSimple(url);
  
  // Step 2: Extract info with GPT (simple prompt)
  return await extractWithGPTSimple(scraped, url);
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
  skills?: string[];
  technologies?: string[];
  industries?: string[];
  type?: string;
  seniority?: string;
  salaryRange?: string;
  remote?: string;
  roleFunction?: string;
}

/**
 * Result from the combined summary and insights generation
 */
export interface JobSummaryAndInsightsResult {
  summary: string;  // 3 bullet points summary
  jobInsights: DetailedJobInfo['jobInsights'];
  jobTags?: JobTags;
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
  const { title, company, location, description, tags, skills, technologies, type, seniority, salaryRange, remote, industries, roleFunction } = jobData;
  
  // Extract key responsibilities from description if available
  let keyResponsibilities = `${title} role at ${company}`;
  if (location) keyResponsibilities += ` (${location})`;
  
  if (description && description.trim().length > 50) {
    // Try to find responsibility-related content
    const responsibilityPatterns = [
      /responsibilities?:?\s*([\s\S]*?)(?=requirements?|qualifications?|skills?|experience|about|benefits|$)/i,
      /what you['']?ll do:?\s*([\s\S]*?)(?=what you|requirements?|qualifications?|skills?|$)/i,
      /your role:?\s*([\s\S]*?)(?=requirements?|qualifications?|skills?|about|$)/i,
      /key duties:?\s*([\s\S]*?)(?=requirements?|qualifications?|skills?|about|$)/i,
    ];
    
    for (const pattern of responsibilityPatterns) {
      const match = description.match(pattern);
      if (match && match[1] && match[1].trim().length > 20) {
        // Clean and truncate
        keyResponsibilities = match[1].trim().substring(0, 400);
        if (match[1].length > 400) keyResponsibilities += '...';
        break;
      }
    }
    
    // If no pattern matched, use first part of description
    if (keyResponsibilities.includes('role at')) {
      const firstPart = description.substring(0, 400).trim();
      if (firstPart.length > 50) {
        keyResponsibilities = firstPart + (description.length > 400 ? '...' : '');
      }
    }
  }
  
  // Build required skills from all available sources (tags, skills, technologies)
  let requiredSkills = '';
  const allSkills: string[] = [];
  
  // Prioritize technologies
  if (technologies && technologies.length > 0) {
    allSkills.push(...technologies.slice(0, 5));
  }
  // Then add skills
  if (skills && skills.length > 0) {
    const newSkills = skills.filter(s => !allSkills.includes(s));
    allSkills.push(...newSkills.slice(0, 4));
  }
  // Then add tags
  if (tags && tags.length > 0) {
    const newTags = tags.filter(t => !allSkills.includes(t));
    allSkills.push(...newTags.slice(0, 3));
  }
  
  if (allSkills.length > 0) {
    requiredSkills = `Key skills: ${allSkills.slice(0, 8).join(', ')}`;
  } else if (description) {
    // Try to extract from description
    const skillsMatch = description.match(/skills?:?\s*([\s\S]*?)(?=experience|responsibilities?|qualifications?|about|$)/i);
    if (skillsMatch && skillsMatch[1] && skillsMatch[1].trim().length > 10) {
      requiredSkills = skillsMatch[1].trim().substring(0, 250);
    } else {
      requiredSkills = 'See full job description for required skills';
    }
  } else {
    requiredSkills = 'Skills not specified in listing';
  }
  
  // Build experience level with more context
  const experienceParts: string[] = [];
  if (seniority) experienceParts.push(seniority);
  if (type) experienceParts.push(type);
  if (roleFunction) experienceParts.push(`${roleFunction} role`);
  
  let experienceLevel = experienceParts.length > 0 
    ? experienceParts.join(' • ')
    : 'Experience level not specified';
  
  // Try to extract years from description
  if (description) {
    const yearsMatch = description.match(/(\d+)\+?\s*years?/i);
    if (yearsMatch) {
      experienceLevel += ` • ${yearsMatch[0]} experience`;
    }
  }
  
  // Build compensation/benefits with more detail
  const compensationParts: string[] = [];
  if (salaryRange && salaryRange.trim().length > 0) {
    compensationParts.push(`Salary: ${salaryRange}`);
  }
  if (remote) {
    const remoteLower = remote.toLowerCase();
    if (remoteLower.includes('remote')) compensationParts.push('Remote work available');
    else if (remoteLower.includes('hybrid')) compensationParts.push('Hybrid work model');
    else if (remoteLower.includes('on-site') || remoteLower.includes('onsite')) compensationParts.push('On-site position');
  }
  if (location) {
    compensationParts.push(`Location: ${location}`);
  }
  
  const compensationBenefits = compensationParts.length > 0 
    ? compensationParts.join(' • ')
    : 'Compensation details not specified - check full job posting';
  
  // Company culture - include industry context
  let companyCulture = '';
  if (industries && industries.length > 0) {
    companyCulture = `Industry: ${industries.join(', ')}`;
  }
  
  if (description) {
    const culturePatterns = [
      /about (?:us|the company|our company):?\s*([\s\S]*?)(?=responsibilities?|requirements?|qualifications?|$)/i,
      /company culture:?\s*([\s\S]*?)(?=responsibilities?|requirements?|qualifications?|$)/i,
      /who we are:?\s*([\s\S]*?)(?=responsibilities?|requirements?|what you|$)/i,
      /our values:?\s*([\s\S]*?)(?=responsibilities?|requirements?|what you|$)/i,
    ];
    
    for (const pattern of culturePatterns) {
      const match = description.match(pattern);
      if (match && match[1] && match[1].trim().length > 20) {
        const cultureText = match[1].trim().substring(0, 300);
        companyCulture = companyCulture 
          ? `${companyCulture}. ${cultureText}${match[1].length > 300 ? '...' : ''}`
          : cultureText + (match[1].length > 300 ? '...' : '');
        break;
      }
    }
  }
  
  if (!companyCulture) {
    companyCulture = `${company} - see full job posting for company details`;
  }
  
  // Growth opportunities - try to extract from description
  let growthOpportunities = 'Growth opportunity details not specified';
  if (description) {
    const growthPatterns = [
      /career (?:growth|development|advancement|progression):?\s*([\s\S]*?)(?=responsibilities?|requirements?|qualifications?|$)/i,
      /(?:learning|training|development) opportunities?:?\s*([\s\S]*?)(?=responsibilities?|requirements?|qualifications?|$)/i,
      /what we offer:?\s*([\s\S]*?)(?=responsibilities?|requirements?|qualifications?|how to apply|$)/i,
    ];
    
    for (const pattern of growthPatterns) {
      const match = description.match(pattern);
      if (match && match[1] && match[1].trim().length > 20) {
        growthOpportunities = match[1].trim().substring(0, 250);
        if (match[1].length > 250) growthOpportunities += '...';
        break;
      }
    }
    
    // Generic check if growth-related keywords are mentioned
    if (growthOpportunities === 'Growth opportunity details not specified') {
      const hasGrowthMention = /growth|career development|advancement|learning|training|mentorship|professional development/i.test(description);
      if (hasGrowthMention) {
        growthOpportunities = 'Growth and development opportunities mentioned - see full job description';
      }
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
  const { title, company, location, tags, skills, technologies, type, seniority, remote, salaryRange, industries, roleFunction } = jobData;
  
  const bulletPoints: string[] = [];
  
  // First bullet: Role overview with location and remote info
  let roleOverview = `${title} position at ${company}`;
  if (location) roleOverview += ` in ${location}`;
  if (remote) {
    const remoteLower = remote.toLowerCase();
    if (remoteLower.includes('remote')) roleOverview += ' (Remote)';
    else if (remoteLower.includes('hybrid')) roleOverview += ' (Hybrid)';
  }
  bulletPoints.push(roleOverview);
  
  // Second bullet: Job type, level, and industry context
  const details: string[] = [];
  if (seniority) details.push(seniority);
  if (type) details.push(type);
  if (roleFunction && roleFunction !== 'other') {
    details.push(`${roleFunction.charAt(0).toUpperCase() + roleFunction.slice(1)} role`);
  }
  if (industries && industries.length > 0) {
    details.push(industries[0]);
  }
  if (salaryRange) details.push(salaryRange);
  
  if (details.length > 0) {
    bulletPoints.push(details.join(' • '));
  }
  
  // Third bullet: Key skills/technologies (prioritize technologies, then skills, then tags)
  const allSkills: string[] = [];
  if (technologies && technologies.length > 0) {
    allSkills.push(...technologies.slice(0, 4));
  }
  if (skills && skills.length > 0) {
    const newSkills = skills.filter(s => !allSkills.includes(s));
    allSkills.push(...newSkills.slice(0, 3));
  }
  if (tags && tags.length > 0) {
    const newTags = tags.filter(t => !allSkills.includes(t));
    allSkills.push(...newTags.slice(0, 2));
  }
  
  if (allSkills.length > 0) {
    bulletPoints.push(`Key skills: ${allSkills.slice(0, 6).join(', ')}`);
  }
  
  // Format as bullet points (ensure we have at least 2 points)
  if (bulletPoints.length < 2) {
    bulletPoints.push(`Opportunity at ${company} - see full description for details`);
  }
  
  return bulletPoints.map(point => `• ${point}`).join('\n');
}

/**
 * Generate job summary, insights, and tags from existing job data in ONE API call
 * This is the SIMPLIFIED approach - uses job.description we already have from the Job Board
 * No need to scrape the website with Puppeteer/Perplexity!
 * 
 * @param jobData - Job data from the job board (already available)
 * @returns Combined summary, jobInsights, and jobTags
 */
export async function generateJobSummaryAndInsights(
  jobData: JobDataForFallback
): Promise<JobSummaryAndInsightsResult> {
  const { title, company, location, description, tags, skills, technologies, industries, type, seniority, salaryRange, remote, roleFunction } = jobData;
  
  // If no description or too short, use local fallback immediately
  if (!description || description.trim().length < 100) {
    console.log('📋 [generateJobSummaryAndInsights] Description too short, using local fallback');
    return {
      summary: generateBasicSummaryFromJobData(jobData),
      jobInsights: generateBasicInsightsFromJobData(jobData),
      jobTags: generateBasicTagsFromJobData(jobData),
    };
  }

  // Build context from all available job data
  const contextParts: string[] = [];
  if (tags && tags.length > 0) contextParts.push(`Tags: ${tags.join(', ')}`);
  if (skills && skills.length > 0) contextParts.push(`Skills: ${skills.join(', ')}`);
  if (technologies && technologies.length > 0) contextParts.push(`Technologies: ${technologies.join(', ')}`);
  if (industries && industries.length > 0) contextParts.push(`Industries: ${industries.join(', ')}`);
  if (type) contextParts.push(`Employment Type: ${type}`);
  if (seniority) contextParts.push(`Seniority: ${seniority}`);
  if (salaryRange) contextParts.push(`Salary: ${salaryRange}`);
  if (remote) contextParts.push(`Remote Policy: ${remote}`);
  if (roleFunction) contextParts.push(`Role Function: ${roleFunction}`);

  const additionalContext = contextParts.length > 0 ? `\n\nADDITIONAL METADATA:\n${contextParts.join('\n')}` : '';

  const prompt = `You are an expert career analyst. Analyze this job posting and extract structured information.

JOB POSTING:
- Title: ${title}
- Company: ${company}
- Location: ${location || 'Not specified'}

FULL DESCRIPTION:
${description.substring(0, 6000)}${additionalContext}

Return ONLY a valid JSON object with this exact structure:

{
  "summary": "• First key point about the role (what you'll do)\\n• Second key point (key requirements/skills)\\n• Third key point (what makes this opportunity interesting)",
  "jobInsights": {
    "keyResponsibilities": "2-3 main duties and responsibilities (50-100 words)",
    "requiredSkills": "Top 5-7 critical skills needed (50-80 words)",
    "experienceLevel": "Years of experience required, seniority level (30-50 words)",
    "compensationBenefits": "Salary, benefits, perks if mentioned (40-70 words). Use 'Not specified' if unavailable.",
    "companyCulture": "Work environment, values, team culture (50-80 words). Use 'Details not specified in posting' if unavailable.",
    "growthOpportunities": "Career development, learning opportunities (40-70 words). Use 'Details not specified in posting' if unavailable."
  },
  "jobTags": {
    "industry": ["Technology", "SaaS"],
    "sector": "Technology",
    "seniority": "Senior",
    "employmentType": ["Full-time", "Remote"],
    "technologies": ["React", "TypeScript"],
    "skills": ["Leadership", "Communication"],
    "location": {
      "city": "Paris",
      "country": "France",
      "remote": true,
      "hybrid": false
    }
  }
}

CRITICAL RULES:
- The summary MUST be exactly 3 bullet points starting with •
- Extract ONLY information explicitly mentioned in the description
- Do NOT invent or hallucinate information
- Keep insights concise but informative
- Return ONLY valid JSON - no markdown, no code blocks
`;

  try {
    console.log('🤖 [generateJobSummaryAndInsights] Calling ChatGPT for combined analysis...');
    
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
    } catch {
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

    // Extract content from response
    let content = data.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse content from response');
        }
      }
    }

    console.log('✅ [generateJobSummaryAndInsights] ChatGPT analysis complete');

    // Validate and format summary
    let summary = content.summary || '';
    if (summary && !summary.includes('•')) {
      // Format as bullet points if not already
      const lines = summary.split('\n').filter((line: string) => line.trim().length > 0);
      summary = lines.map((line: string) => {
        const trimmed = line.trim();
        return trimmed.startsWith('•') || trimmed.startsWith('-') ? trimmed.replace(/^-/, '•') : `• ${trimmed}`;
      }).join('\n');
    }

    // Build jobInsights with defaults
    const jobInsights = {
      keyResponsibilities: content.jobInsights?.keyResponsibilities?.trim() || 'Details not specified in posting',
      requiredSkills: content.jobInsights?.requiredSkills?.trim() || 'Details not specified in posting',
      experienceLevel: content.jobInsights?.experienceLevel?.trim() || 'Details not specified in posting',
      compensationBenefits: content.jobInsights?.compensationBenefits?.trim() || 'Not specified',
      companyCulture: content.jobInsights?.companyCulture?.trim() || 'Details not specified in posting',
      growthOpportunities: content.jobInsights?.growthOpportunities?.trim() || 'Details not specified in posting',
    };

    // Build jobTags if available
    let jobTags: JobTags | undefined;
    if (content.jobTags) {
      const tags = content.jobTags;
      jobTags = {
        industry: Array.isArray(tags.industry) ? tags.industry.filter((i: unknown) => typeof i === 'string') : [],
        sector: typeof tags.sector === 'string' ? tags.sector.trim() : '',
        seniority: typeof tags.seniority === 'string' ? tags.seniority.trim() : '',
        employmentType: Array.isArray(tags.employmentType) ? tags.employmentType.filter((e: unknown) => typeof e === 'string') : [],
        technologies: Array.isArray(tags.technologies) ? tags.technologies.filter((t: unknown) => typeof t === 'string') : [],
        skills: Array.isArray(tags.skills) ? tags.skills.filter((s: unknown) => typeof s === 'string') : [],
        location: {
          city: typeof tags.location?.city === 'string' ? tags.location.city.trim() : undefined,
          country: typeof tags.location?.country === 'string' ? tags.location.country.trim() : undefined,
          remote: typeof tags.location?.remote === 'boolean' ? tags.location.remote : false,
          hybrid: typeof tags.location?.hybrid === 'boolean' ? tags.location.hybrid : false,
        },
      };
    }

    return {
      summary: summary || generateBasicSummaryFromJobData(jobData),
      jobInsights,
      jobTags,
    };
  } catch (error) {
    console.error('❌ [generateJobSummaryAndInsights] ChatGPT failed, using local fallback:', error);
    
    // Use local fallback when API fails
    return {
      summary: generateBasicSummaryFromJobData(jobData),
      jobInsights: generateBasicInsightsFromJobData(jobData),
      jobTags: generateBasicTagsFromJobData(jobData),
    };
  }
}

/**
 * Generate basic jobTags from existing job data (LOCAL FALLBACK)
 * Creates structured tags without making API calls
 * 
 * @param jobData - Job data from the job board
 * @returns JobTags object
 */
export function generateBasicTagsFromJobData(jobData: JobDataForFallback): JobTags {
  const { location, tags, skills, technologies, industries, type, seniority, salaryRange, remote } = jobData;
  
  // Parse location string to extract city/country
  let city: string | undefined;
  let country: string | undefined;
  if (location) {
    const parts = location.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      city = parts[0];
      country = parts[parts.length - 1];
    } else if (parts.length === 1) {
      city = parts[0];
    }
  }

  // Determine remote/hybrid from remote field
  const isRemote = remote?.toLowerCase().includes('remote') || false;
  const isHybrid = remote?.toLowerCase().includes('hybrid') || false;

  // Map seniority to standard values
  let mappedSeniority = '';
  if (seniority) {
    const seniorityLower = seniority.toLowerCase();
    if (seniorityLower.includes('intern')) mappedSeniority = 'Internship';
    else if (seniorityLower.includes('entry') || seniorityLower.includes('junior')) mappedSeniority = 'Entry-level';
    else if (seniorityLower.includes('mid')) mappedSeniority = 'Mid-level';
    else if (seniorityLower.includes('senior') || seniorityLower.includes('sr')) mappedSeniority = 'Senior';
    else if (seniorityLower.includes('lead') || seniorityLower.includes('principal')) mappedSeniority = 'Lead';
    else if (seniorityLower.includes('exec') || seniorityLower.includes('director') || seniorityLower.includes('vp')) mappedSeniority = 'Executive';
    else mappedSeniority = seniority;
  }

  // Map employment type
  const employmentTypes: string[] = [];
  if (type) {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('full')) employmentTypes.push('Full-time');
    if (typeLower.includes('part')) employmentTypes.push('Part-time');
    if (typeLower.includes('contract')) employmentTypes.push('Contract');
    if (typeLower.includes('intern')) employmentTypes.push('Internship');
  }
  if (isRemote) employmentTypes.push('Remote');
  if (isHybrid) employmentTypes.push('Hybrid');

  // Parse salary if available
  let salaryRangeObj: { min?: number; max?: number; currency?: string } | undefined;
  if (salaryRange) {
    const numberMatches = salaryRange.match(/[\d,]+/g);
    if (numberMatches && numberMatches.length >= 1) {
      const numbers = numberMatches.map(n => parseInt(n.replace(/,/g, ''), 10));
      salaryRangeObj = {
        min: numbers[0],
        max: numbers.length > 1 ? numbers[1] : undefined,
        currency: salaryRange.includes('€') ? 'EUR' : salaryRange.includes('£') ? 'GBP' : 'USD',
      };
    }
  }

  return {
    industry: industries || [],
    sector: industries && industries.length > 0 ? industries[0] : '',
    seniority: mappedSeniority,
    employmentType: employmentTypes.length > 0 ? employmentTypes : ['Full-time'],
    technologies: technologies || tags?.filter(t => /^[A-Z]/.test(t) || t.includes('.') || t.includes('#')) || [],
    skills: skills || tags?.filter(t => !/^[A-Z]/.test(t) && !t.includes('.') && !t.includes('#')) || [],
    location: {
      city,
      country,
      remote: isRemote,
      hybrid: isHybrid,
    },
    salaryRange: salaryRangeObj,
  };
}

/**
 * ===========================================
 * PASTED CONTENT EXTRACTION
 * Analyze job description text pasted by user
 * ===========================================
 */

/**
 * Extract job information from pasted text content
 * This is used when automatic URL extraction fails (LinkedIn, Indeed, etc.)
 * The user copies the job description from the website and pastes it here
 * 
 * @param pastedContent - Raw text content pasted by the user
 * @param sourceUrl - Optional: the original URL for reference
 * @returns DetailedJobInfo extracted from the pasted content
 */
export async function extractFromPastedContent(
  pastedContent: string,
  sourceUrl?: string
): Promise<DetailedJobInfo> {
  if (!pastedContent || pastedContent.trim().length < 50) {
    throw new Error('Pasted content is too short. Please paste the complete job description.');
  }

  console.log('📋 [extractFromPastedContent] Analyzing pasted content...', {
    contentLength: pastedContent.length,
    sourceUrl: sourceUrl || 'none'
  });

  // Limit content to 5000 chars for faster processing
  const truncatedContent = pastedContent.substring(0, 5000);

  const prompt = `Extract job info from this posting. Return JSON only.

JOB POSTING:
${truncatedContent}

FIND THE JOB TITLE: Look for patterns like "Job Title:", "Position:", "Role:", or the first prominent heading. Common formats: "Senior X Engineer", "X Manager", "X Analyst", "Head of X", "VP of X".

Return this exact JSON structure:
{
  "companyName": "company name",
  "position": "EXACT job title as written (e.g. 'Senior Product Manager', 'Software Engineer')",
  "location": "city, country or Remote",
  "summary": "• Key point 1\\n• Key point 2\\n• Key point 3",
  "jobInsights": {
    "keyResponsibilities": "main duties (2-3 sentences)",
    "requiredSkills": "key skills needed",
    "experienceLevel": "years + level",
    "compensationBenefits": "salary/benefits or 'Not specified'",
    "companyCulture": "culture info or 'Not specified'",
    "growthOpportunities": "growth info or 'Not specified'"
  },
  "jobTags": {
    "industry": ["industries"],
    "sector": "main sector",
    "seniority": "Entry-level|Mid-level|Senior|Lead|Executive",
    "employmentType": ["Full-time","Remote"],
    "technologies": ["tech stack"],
    "skills": ["soft skills"],
    "location": {"city":"","country":"","remote":false,"hybrid":false}
  }
}

RULES: Extract EXACT position title. Return valid JSON only, no markdown.`;

  try {
    const response = await fetch('/api/chatgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: 'cv-edit',
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

    console.log('✅ [extractFromPastedContent] Successfully extracted job info:', {
      company: parsedContent.companyName,
      position: parsedContent.position,
      hasInsights: !!parsedContent.jobInsights
    });

    // Build the DetailedJobInfo object
    const result: DetailedJobInfo = {
      companyName: parsedContent.companyName || '',
      position: parsedContent.position || '',
      location: parsedContent.location || '',
      summary: parsedContent.summary || '',
      fullJobDescription: parsedContent.fullJobDescription || pastedContent,
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
  } catch (error) {
    console.error('❌ [extractFromPastedContent] Failed to extract:', error);
    throw new Error(`Failed to analyze pasted content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

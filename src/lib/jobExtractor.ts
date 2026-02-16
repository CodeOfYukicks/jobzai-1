/**
 * ===========================================
 * JOB EXTRACTION SERVICE
 * Orchestrates server-side scraping (Jina/Cheerio) + Claude Extraction
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
export const PASTE_REQUIRED_PLATFORMS: UrlType[] = []; // Enforcing auto-extract for all, as our new server scraping is robust

/**
 * Detect the URL type/platform from a job posting URL
 * @param url - The job posting URL
 * @returns The detected platform type
 */
export function detectUrlType(url: string): UrlType {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
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
  url?: string;
}

export interface JobExtractionOptions {
  detailed?: boolean;
}

/**
 * Extracts job information from a URL using the server-side Jina + Claude pipeline.
 * @param url - The URL of the job posting
 * @returns Structed job information
 */
export async function extractJobInfoWithGPT(url: string, _options?: JobExtractionOptions): Promise<DetailedJobInfo> {
  console.log('🚀 [JobExtractor] Calling server-side extraction for:', url);

  try {
    const response = await fetch('/api/extract-job-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) { }
      throw new Error(errorMessage);
    }

    const jsonResponse = await response.json();

    // Check if status is error
    if (jsonResponse.status === 'error') {
      throw new Error(jsonResponse.message || 'Extraction failed');
    }

    const data = jsonResponse.data;

    if (!data) {
      throw new Error('No data received from extraction service');
    }

    // Map the Claude JSON response to our client-side DetailedJobInfo interface
    // Note: Server returns snake_case keys from Claude prompt, we map to camelCase here

    // Helper to join array with bullets
    const bulletJoin = (arr: any[]) => Array.isArray(arr) ? arr.map(i => `• ${i}`).join('\n') : '';

    const detailedInfo: DetailedJobInfo = {
      companyName: data.company || 'Unknown Company',
      position: data.title || 'Unknown Position',
      location: data.location || 'Unknown Location',
      summary: data.description || '',
      fullJobDescription: data.description ?
        `${data.description}\n\nResponsibilities:\n${bulletJoin(data.responsibilities || [])}\n\nRequirements:\n${bulletJoin(data.requirements || [])}`
        : 'Description unavailable',

      jobInsights: {
        keyResponsibilities: bulletJoin(data.responsibilities || []) || 'Details not specified',
        requiredSkills: bulletJoin(data.requirements || []) || 'Details not specified',
        experienceLevel: data.experience_level || 'Details not specified',
        compensationBenefits: [
          data.salary ? `Salary: ${data.salary}` : null,
          ...(data.benefits || [])
        ].filter(Boolean).join('\n• ') || 'Not specified',
        companyCulture: 'See full description', // Claude prompt doesn't explicitly ask for this, could add if needed
        growthOpportunities: 'See full description',
      },

      // We could map more tags if the Claude prompt asked for them specifically in this structure
      jobTags: {
        industry: [],
        sector: '',
        seniority: data.experience_level || '',
        employmentType: data.contract_type ? [data.contract_type] : [],
        technologies: [],
        skills: data.requirements || [],
        location: {
          city: data.location ? data.location.split(',')[0].trim() : undefined,
          country: data.location ? data.location.split(',').pop()?.trim() : undefined,
          remote: data.location?.toLowerCase().includes('remote') || false,
          hybrid: data.location?.toLowerCase().includes('hybrid') || false,
        },
        salaryRange: {
          // Minimal parsing attempt, ideally extraction prompt should be more structured for this
        }
      },
      url: data.application_url || url
    };

    console.log('✅ [JobExtractor] Extraction successful:', detailedInfo.companyName, detailedInfo.position);
    return detailedInfo;

  } catch (error: any) {
    console.error('❌ [JobExtractor] Extraction failed:', error);
    throw error;
  }
}

/**
 * Alias for backward compatibility if any components rely on this name
 */
export const extractJobFromUrl = extractJobInfoWithGPT;

/**
 * Extract From Pasted Content
 * Used when URL extraction fails or for copy-paste
 */
export async function extractFromPastedContent(content: string, _url?: string): Promise<DetailedJobInfo> {
  console.log('📝 Extracting from pasted text...');

  // Fallback prompt for pasted content using the legacy GPT endpoint
  // Ideally we'd move this to the server too, but for speed we reuse existing endpoint
  const prompt = `Extract job info from this text. Return JSON only.
    
    TEXT:
    ${content.substring(0, 10000)}
    
    Return this JSON:
    {
      "companyName": "extract company name (or Unknown)",
      "position": "extract job title (or Unknown)",
      "location": "extract location (or Unknown)",
      "summary": "3 concise bullet points",
      "keyResponsibilities": "summary of duties",
      "requiredSkills": "summary of skills",
      "experienceLevel": "experience needed",
      "compensationBenefits": "salary and benefits"
    }`;

  try {
    const response = await fetch('/api/chatgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cv-edit', prompt })
    });

    if (!response.ok) throw new Error('Analysis failed');

    const resJson = await response.json();
    // The API might return { status: 'success', content: ... }
    // The content might be a string (JSON string) or an object
    let data = resJson.content;

    if (typeof data === 'string') {
      try {
        // Clean markdown
        data = JSON.parse(data.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim());
      } catch (e) {
        console.warn('Failed to parse JSON string from GPT:', e);
        // Fallback object
        data = { companyName: 'Unknown', position: 'Parsed Job' };
      }
    }

    // Map to DetailedJobInfo
    return {
      companyName: data.companyName || 'Unknown',
      position: data.position || 'Unknown',
      location: data.location || '',
      summary: data.summary || '',
      fullJobDescription: content,
      jobInsights: {
        keyResponsibilities: data.keyResponsibilities || '',
        requiredSkills: data.requiredSkills || '',
        experienceLevel: data.experienceLevel || '',
        compensationBenefits: data.compensationBenefits || '',
        companyCulture: 'See description',
        growthOpportunities: 'See description'
      }
    };

  } catch (e) {
    console.error('Failed to extract from text:', e);
    throw new Error('Failed to extract from pasted text');
  }
}

/**
 * Alias for backward compatibility
 */
export const extractJobInfo = extractJobInfoWithGPT;

/**
 * ===========================================
 * JOB ANALYSIS UTILITIES (Moved from legacy Extractor)
 * Used by JobDetailView for "Add to Wishlist" analysis
 * ===========================================
 */

export interface JobDataForFallback {
  title?: string;
  company?: string;
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

export interface JobInsights {
  keyResponsibilities: string;
  requiredSkills: string;
  experienceLevel: string;
  compensationBenefits: string;
  companyCulture: string;
  growthOpportunities: string;
}

export interface JobAnalysisResult {
  summary: string;
  jobInsights: JobInsights;
  jobTags?: string[];
}

/**
 * Generate comprehensive job insights using AI
 * Used when adding a job to wishlist from the job board
 */
export async function generateJobSummaryAndInsights(jobData: JobDataForFallback): Promise<JobAnalysisResult> {
  // If description is too short, return basic info immediately
  if (!jobData.description || jobData.description.length < 50) {
    return {
      summary: generateBasicSummaryFromJobData(jobData),
      jobInsights: generateBasicInsightsFromJobData(jobData)
    };
  }

  const prompt = `Analyze this job listing and provide a structured summary and insights.
  
  JOB TITLE: ${jobData.title}
  COMPANY: ${jobData.company}
  LOCATION: ${jobData.location}
  
  DESCRIPTION:
  ${jobData.description.substring(0, 8000)}
  
  You must return a valid JSON object with the following structure:
  {
    "summary": "A concise 2-3 sentence professional summary of the role and key expectations.",
    "jobInsights": {
      "keyResponsibilities": "List of 3-5 main responsibilities (bullet points)",
      "requiredSkills": "List of top technical and soft skills required",
      "experienceLevel": "Estimated seniority level (e.g., Junior, Mid, Senior, Lead)",
      "compensationBenefits": "Salary range and key benefits if mentioned, otherwise 'Not specified'",
      "companyCulture": "Brief description of culture if mentioned, otherwise 'Not specified'",
      "growthOpportunities": "Career growth mentioned, otherwise 'Not specified'"
    },
    "jobTags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  }`;

  try {
    const response = await fetch('/api/chatgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        type: 'json_mode'
      })
    });

    if (!response.ok) {
      // Silent fail to basic extraction if API fails
      return {
        summary: generateBasicSummaryFromJobData(jobData),
        jobInsights: generateBasicInsightsFromJobData(jobData),
        jobTags: jobData.tags || []
      };
    }

    const resJson = await response.json();
    let content = resJson.content || resJson.message || '';

    // Parse JSON
    if (typeof content === 'string') {
      try {
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        content = JSON.parse(content);
      } catch (e) {
        console.warn('Failed to parse AI response JSON');
        throw new Error('Invalid JSON from AI');
      }
    }

    return {
      summary: content.summary || generateBasicSummaryFromJobData(jobData),
      jobInsights: {
        keyResponsibilities: content.jobInsights?.keyResponsibilities || 'Not specified',
        requiredSkills: content.jobInsights?.requiredSkills || 'Not specified',
        experienceLevel: content.jobInsights?.experienceLevel || jobData.seniority || 'Not specified',
        compensationBenefits: content.jobInsights?.compensationBenefits || jobData.salaryRange || 'Not specified',
        companyCulture: content.jobInsights?.companyCulture || 'Not specified',
        growthOpportunities: content.jobInsights?.growthOpportunities || 'Not specified'
      },
      jobTags: Array.isArray(content.jobTags) ? content.jobTags : []
    };

  } catch (error) {
    console.error('Error generating job insights:', error);
    // Fallback to basic generation
    return {
      summary: generateBasicSummaryFromJobData(jobData),
      jobInsights: generateBasicInsightsFromJobData(jobData),
      jobTags: jobData.tags || []
    };
  }
}

/**
 * Generate a basic text summary from structured job data
 * (Fallback when AI is unavailable)
 */
export function generateBasicSummaryFromJobData(jobData: JobDataForFallback): string {
  const parts = [];
  parts.push(`${jobData.title} at ${jobData.company}`);
  if (jobData.location) parts.push(`located in ${jobData.location}.`);

  if (jobData.type) parts.push(`Type: ${jobData.type}.`);
  if (jobData.seniority) parts.push(`Level: ${jobData.seniority}.`);

  return parts.join(' ') + (jobData.description ? `\n\n${jobData.description.substring(0, 300)}...` : '');
}

/**
 * Generate basic insights structure from available metadata
 * (Fallback when AI is unavailable)
 */
export function generateBasicInsightsFromJobData(jobData: JobDataForFallback): JobInsights {
  return {
    keyResponsibilities: "See full job description for details.",
    requiredSkills: (jobData.skills || []).join(', ') || "See job description",
    experienceLevel: jobData.seniority || "Not specified",
    compensationBenefits: jobData.salaryRange || "Not specified",
    companyCulture: "See website",
    growthOpportunities: "Not specified"
  };
}

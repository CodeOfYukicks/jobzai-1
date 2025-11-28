import { toast } from 'sonner';

/**
 * Structure for an extracted professional experience
 */
export interface ExtractedExperience {
  title: string;
  company: string;
  startDate: string; // YYYY-MM format
  endDate: string;   // YYYY-MM format or empty if current
  current: boolean;
  industry: string;
  contractType: string;
  location: string;
  responsibilities: string[];
}

/**
 * Structure for an extracted education entry
 */
export interface ExtractedEducation {
  id: string;
  degree: string;       // bachelor, master, phd, etc.
  field: string;        // Computer Science, Business, etc.
  institution: string;  // School/University name
  startDate: string;    // YYYY-MM
  endDate: string;      // YYYY-MM
  current: boolean;
  description: string;
}

/**
 * Structure for extracted personal info
 */
export interface ExtractedPersonalInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  headline?: string;
}

/**
 * Structure for extracted language
 */
export interface ExtractedLanguage {
  language: string;
  level: string; // native, fluent, intermediate, beginner
}

/**
 * Result of CV experience extraction
 */
export interface CVExperienceExtractionResult {
  experiences: ExtractedExperience[];
  summary?: string;
}

/**
 * Full CV profile extraction result
 */
export interface CVFullProfileExtractionResult {
  personalInfo: ExtractedPersonalInfo;
  experiences: ExtractedExperience[];
  educations: ExtractedEducation[];
  skills: string[];
  tools: string[];
  languages: ExtractedLanguage[];
  summary?: string;
}

/**
 * Determine API base URL based on environment
 */
function getApiBaseUrl(): string {
  if (import.meta.env.PROD || window.location.hostname !== 'localhost') {
    return 'https://analyzecvvision-pyozgz4rbq-uc.a.run.app';
  }
  return '/api';
}

/**
 * Build the experience extraction prompt for GPT-4o
 */
function buildExperienceExtractionPrompt(): string {
  return `
# CV PROFESSIONAL EXPERIENCE EXTRACTION

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON structure.

## YOUR ROLE
You are an expert CV parser specializing in extracting professional work experience. Your task is to identify and structure ALL work experiences from the CV text.

## MISSION
Extract ALL professional experiences from the CV text and structure them in a standardized format.

## EXTRACTION RULES

### For EACH work experience, extract:
1. **Job Title** - The exact position/role title
2. **Company Name** - The employer's name
3. **Start Date** - In YYYY-MM format (e.g., "2020-01" for January 2020)
4. **End Date** - In YYYY-MM format, or empty string if currently employed
5. **Current** - Boolean: true if this is the current position
6. **Location** - City, Country or Remote
7. **Industry** - The industry sector (Technology, Finance, Healthcare, Consulting, etc.)
8. **Contract Type** - One of: full-time, part-time, contract, freelance, internship
9. **Responsibilities** - Array of bullet points describing key duties and achievements

### DATE PARSING RULES:
- "January 2020" → "2020-01"
- "Jan 2020" → "2020-01"
- "2020" (year only) → "2020-01"
- "Present" or "Current" → endDate: "", current: true
- "Aujourd'hui" or "Actuel" → endDate: "", current: true

### EXPERIENCE IDENTIFICATION:
- Look for section headers like: "Experience", "Work Experience", "Professional Experience", "Employment History", "Expérience Professionnelle"
- Each job entry typically has: title, company, dates, and description
- Consulting roles with multiple clients should be separated into distinct experiences
- Include ALL experiences, even internships and short-term positions

### RESPONSIBILITIES EXTRACTION:
- Extract bullet points as individual array items
- If description is a paragraph, split into logical bullet points
- Keep achievements and metrics (e.g., "Increased sales by 25%")
- Maximum 5-7 key responsibilities per experience

## OUTPUT JSON STRUCTURE

Return ONLY this JSON structure:

{
  "experiences": [
    {
      "title": "Senior Product Manager",
      "company": "Google",
      "startDate": "2022-01",
      "endDate": "",
      "current": true,
      "industry": "Technology / IT",
      "contractType": "full-time",
      "location": "Paris, France",
      "responsibilities": [
        "Led product strategy for mobile applications with 10M+ users",
        "Managed cross-functional team of 8 engineers and designers",
        "Increased user engagement by 35% through feature optimization"
      ]
    },
    {
      "title": "Product Manager",
      "company": "Meta",
      "startDate": "2019-06",
      "endDate": "2021-12",
      "current": false,
      "industry": "Technology / IT",
      "contractType": "full-time",
      "location": "London, UK",
      "responsibilities": [
        "Owned roadmap for advertising platform features",
        "Collaborated with data science team on ML-powered recommendations"
      ]
    }
  ],
  "summary": "Brief professional summary if found in CV"
}

## QUALITY REQUIREMENTS

1. **Completeness**: Extract ALL work experiences mentioned in the CV
2. **Accuracy**: Preserve exact job titles and company names
3. **Date Format**: Always use YYYY-MM format
4. **Order**: List experiences from most recent to oldest
5. **No Fabrication**: Only extract information explicitly stated in the CV

## INDUSTRY MAPPING
Map to one of these industries:
- Technology / IT
- Finance / Banking
- Healthcare
- Consulting
- Manufacturing
- Retail / E-commerce
- Education
- Media / Entertainment
- Real Estate
- Energy
- Transportation
- Other
`;
}

/**
 * Extract professional experiences from CV text using GPT-4o
 * 
 * @param cvText The raw text content of the CV
 * @returns Structured array of professional experiences
 */
export async function extractExperiencesFromText(cvText: string): Promise<CVExperienceExtractionResult> {
  try {
    console.log('🔍 Starting CV experience extraction from text...');
    console.log(`   Text length: ${cvText.length} characters`);

    if (!cvText || cvText.trim().length < 50) {
      throw new Error('CV text is too short or empty');
    }

    const baseApiUrl = getApiBaseUrl();
    const apiUrl = baseApiUrl.startsWith('http')
      ? baseApiUrl
      : `${baseApiUrl}/analyze-cv-vision`;

    const prompt = buildExperienceExtractionPrompt();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert CV parser. Extract professional work experiences from the provided CV text. Return ONLY valid JSON."
          },
          {
            role: "user",
            content: `${prompt}\n\n---\n\nCV TEXT TO PARSE:\n\n${cvText}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      
      if (response.status === 503) {
        errorMessage = '⚠️ OpenAI API key is not configured.';
        toast.error(errorMessage, { duration: 8000 });
        throw new Error(errorMessage);
      }
      
      try {
        const errorData = await response.json();
        errorMessage = `API error: ${errorData.error?.message || errorData.message || response.statusText}`;
      } catch (e) {
        console.error('Could not parse error response', e);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Experience extraction completed');

    // Parse the response
    if (data.status === 'success' && data.content) {
      let parsedContent: CVExperienceExtractionResult;

      if (typeof data.content === 'string') {
        parsedContent = JSON.parse(data.content);
      } else if (typeof data.content === 'object') {
        parsedContent = data.content;
      } else {
        throw new Error('Invalid response format');
      }

      // Validate and normalize experiences
      const experiences = normalizeExperiences(parsedContent.experiences || []);
      
      console.log(`   ✓ Extracted ${experiences.length} experiences`);

      return {
        experiences,
        summary: parsedContent.summary
      };
    } else {
      throw new Error(data.message || 'API returned error status');
    }
  } catch (error: unknown) {
    console.error('❌ Experience extraction failed:', error);
    toast.error(
      `Failed to extract experiences: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}

/**
 * Extract experiences from CV images using GPT-4o Vision
 * 
 * @param images Array of base64 encoded images
 * @returns Structured array of professional experiences
 */
export async function extractExperiencesFromImages(images: string[]): Promise<CVExperienceExtractionResult> {
  try {
    console.log('🔍 Starting CV experience extraction from images...');
    console.log(`   Images: ${images.length} page(s)`);

    const baseApiUrl = getApiBaseUrl();
    const apiUrl = baseApiUrl.startsWith('http')
      ? baseApiUrl
      : `${baseApiUrl}/analyze-cv-vision`;

    const prompt = buildExperienceExtractionPrompt();

    // Build content array with text prompt and images
    const content: any[] = [
      {
        type: "text",
        text: prompt
      }
    ];

    // Add each image
    images.forEach((image, index) => {
      content.push({
        type: "image_url",
        image_url: {
          url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
          detail: "high"
        }
      });
      console.log(`   ✓ Added image ${index + 1}`);
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert CV parser. Extract professional work experiences from the CV images. Return ONLY valid JSON."
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      
      if (response.status === 503) {
        errorMessage = '⚠️ OpenAI API key is not configured.';
        toast.error(errorMessage, { duration: 8000 });
        throw new Error(errorMessage);
      }
      
      try {
        const errorData = await response.json();
        errorMessage = `API error: ${errorData.error?.message || errorData.message || response.statusText}`;
      } catch (e) {
        console.error('Could not parse error response', e);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Experience extraction from images completed');

    if (data.status === 'success' && data.content) {
      let parsedContent: CVExperienceExtractionResult;

      if (typeof data.content === 'string') {
        parsedContent = JSON.parse(data.content);
      } else if (typeof data.content === 'object') {
        parsedContent = data.content;
      } else {
        throw new Error('Invalid response format');
      }

      const experiences = normalizeExperiences(parsedContent.experiences || []);
      
      console.log(`   ✓ Extracted ${experiences.length} experiences`);

      return {
        experiences,
        summary: parsedContent.summary
      };
    } else {
      throw new Error(data.message || 'API returned error status');
    }
  } catch (error: unknown) {
    console.error('❌ Experience extraction from images failed:', error);
    toast.error(
      `Failed to extract experiences: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}

/**
 * Normalize and validate extracted experiences
 */
function normalizeExperiences(experiences: any[]): ExtractedExperience[] {
  if (!Array.isArray(experiences)) return [];

  return experiences
    .filter(exp => exp && (exp.title || exp.company))
    .map(exp => ({
      title: cleanString(exp.title) || 'Unknown Position',
      company: cleanString(exp.company) || 'Unknown Company',
      startDate: normalizeDate(exp.startDate || exp.start_date),
      endDate: exp.current ? '' : normalizeDate(exp.endDate || exp.end_date),
      current: Boolean(exp.current),
      industry: cleanString(exp.industry) || '',
      contractType: normalizeContractType(exp.contractType || exp.contract_type),
      location: cleanString(exp.location) || '',
      responsibilities: normalizeResponsibilities(exp.responsibilities || exp.bullets || exp.description)
    }));
}

/**
 * Clean and trim a string
 */
function cleanString(str: any): string {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, ' ');
}

/**
 * Normalize date to YYYY-MM format
 */
function normalizeDate(date: any): string {
  if (!date) return '';
  
  const dateStr = String(date).trim().toLowerCase();
  
  // Already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Just year: "2020" → "2020-01"
  if (/^\d{4}$/.test(dateStr)) {
    return `${dateStr}-01`;
  }
  
  // Month names
  const monthMap: { [key: string]: string } = {
    'jan': '01', 'january': '01', 'janvier': '01',
    'feb': '02', 'february': '02', 'février': '02', 'fevrier': '02',
    'mar': '03', 'march': '03', 'mars': '03',
    'apr': '04', 'april': '04', 'avril': '04',
    'may': '05', 'mai': '05',
    'jun': '06', 'june': '06', 'juin': '06',
    'jul': '07', 'july': '07', 'juillet': '07',
    'aug': '08', 'august': '08', 'août': '08', 'aout': '08',
    'sep': '09', 'sept': '09', 'september': '09', 'septembre': '09',
    'oct': '10', 'october': '10', 'octobre': '10',
    'nov': '11', 'november': '11', 'novembre': '11',
    'dec': '12', 'december': '12', 'décembre': '12', 'decembre': '12'
  };
  
  // Try to extract month and year
  const match = dateStr.match(/(\w+)\s*(\d{4})/);
  if (match) {
    const month = monthMap[match[1]] || '01';
    const year = match[2];
    return `${year}-${month}`;
  }
  
  // Try year first then month: "2020 January"
  const reverseMatch = dateStr.match(/(\d{4})\s*(\w+)/);
  if (reverseMatch) {
    const year = reverseMatch[1];
    const month = monthMap[reverseMatch[2]] || '01';
    return `${year}-${month}`;
  }
  
  // Just try to find a year
  const yearMatch = dateStr.match(/\d{4}/);
  if (yearMatch) {
    return `${yearMatch[0]}-01`;
  }
  
  return '';
}

/**
 * Normalize contract type to standard values
 */
function normalizeContractType(type: any): string {
  if (!type) return 'full-time';
  
  const normalized = String(type).toLowerCase().trim();
  
  if (normalized.includes('full') || normalized.includes('cdi') || normalized.includes('permanent')) {
    return 'full-time';
  }
  if (normalized.includes('part')) {
    return 'part-time';
  }
  if (normalized.includes('contract') || normalized.includes('cdd') || normalized.includes('temporary')) {
    return 'contract';
  }
  if (normalized.includes('freelance') || normalized.includes('consultant') || normalized.includes('indépendant')) {
    return 'freelance';
  }
  if (normalized.includes('intern') || normalized.includes('stage') || normalized.includes('apprenti')) {
    return 'internship';
  }
  
  return 'full-time';
}

/**
 * Normalize responsibilities to array of strings
 */
function normalizeResponsibilities(responsibilities: any): string[] {
  if (!responsibilities) return [''];
  
  // If already an array
  if (Array.isArray(responsibilities)) {
    const cleaned = responsibilities
      .map(r => cleanString(r))
      .filter(r => r.length > 0);
    return cleaned.length > 0 ? cleaned : [''];
  }
  
  // If a string, try to split by common delimiters
  if (typeof responsibilities === 'string') {
    const text = responsibilities.trim();
    
    // Split by bullet points or newlines
    const bullets = text
      .split(/[\n•\-\*]/)
      .map(s => s.trim())
      .filter(s => s.length > 10); // Filter out very short fragments
    
    if (bullets.length > 0) {
      return bullets;
    }
    
    // Just return as single item
    return text.length > 0 ? [text] : [''];
  }
  
  return [''];
}

/**
 * Build the full profile extraction prompt for GPT-4o
 */
function buildFullProfileExtractionPrompt(): string {
  return `
# COMPLETE CV PROFILE EXTRACTION

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON structure.

## YOUR ROLE
You are an expert CV parser. Extract ALL information from the CV text including personal details, work experience, education, skills, and languages.

## EXTRACTION RULES

### 1. PERSONAL INFORMATION
Extract:
- First Name
- Last Name
- Email address
- Phone number
- City
- Country
- Professional headline/title

### 2. PROFESSIONAL EXPERIENCES
For EACH work experience:
- Job Title
- Company Name
- Start Date (YYYY-MM format)
- End Date (YYYY-MM or empty if current)
- Current (true/false)
- Location
- Industry
- Contract Type (full-time, part-time, contract, freelance, internship)
- Responsibilities (array of bullet points, max 5-7 per job)

### 3. EDUCATION
For EACH education entry:
- Degree level: high-school, associate, bachelor, master, phd, bootcamp, other
- Field of study
- Institution name
- Start Date (YYYY-MM, optional)
- End Date (YYYY-MM)
- Currently studying (true/false)
- Description (major, honors, etc.)

### 4. SKILLS (Soft Skills & Methodologies)
Extract professional and soft skills as a flat array of strings.
Include ONLY: leadership, communication, management, strategic planning, problem solving, teamwork, negotiation, project management, agile, scrum, coaching, mentoring, etc.
DO NOT include programming languages or technical tools here.

### 5. TOOLS & TECHNOLOGIES
Extract ALL technical tools and technologies as a separate flat array of strings.
Include: programming languages (Python, JavaScript, Java, etc.), frameworks (React, Node.js, Django, etc.), databases (PostgreSQL, MongoDB, etc.), cloud platforms (AWS, GCP, Azure), DevOps tools (Docker, Kubernetes), design tools (Figma, Sketch), productivity tools (Jira, Notion, Slack), data tools (Excel, Tableau, SQL), etc.

### 6. LANGUAGES
For EACH spoken language:
- Language name
- Proficiency level: native, fluent, intermediate, beginner

## DATE PARSING
- "January 2020" or "Jan 2020" → "2020-01"
- "2020" → "2020-01"
- "Present"/"Current"/"Aujourd'hui" → current: true, endDate: ""

## OUTPUT JSON STRUCTURE

{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@email.com",
    "phone": "+33 6 12 34 56 78",
    "city": "Paris",
    "country": "France",
    "headline": "Senior Product Manager"
  },
  "summary": "Results-driven Product Manager with 8+ years of experience leading cross-functional teams and delivering innovative digital products. Proven track record of increasing user engagement and driving revenue growth through data-driven decision making.",
  "experiences": [
    {
      "title": "Senior Product Manager",
      "company": "Google",
      "startDate": "2022-01",
      "endDate": "",
      "current": true,
      "industry": "Technology / IT",
      "contractType": "full-time",
      "location": "Paris, France",
      "responsibilities": ["Led product strategy...", "Managed team..."]
    }
  ],
  "educations": [
    {
      "degree": "master",
      "field": "Computer Science",
      "institution": "MIT",
      "startDate": "2016-09",
      "endDate": "2018-06",
      "current": false,
      "description": "Specialized in Machine Learning"
    }
  ],
  "skills": ["Leadership", "Strategic Planning", "Agile", "Scrum", "Project Management", "Team Building", "Communication"],
  "tools": ["Python", "React", "Node.js", "AWS", "Figma", "Jira", "SQL", "Tableau", "Google Analytics"],
  "languages": [
    { "language": "French", "level": "native" },
    { "language": "English", "level": "fluent" }
  ]
}

## QUALITY REQUIREMENTS
1. Extract ALL information found in the CV
2. Use exact names and titles as written
3. Always use YYYY-MM date format
4. Order experiences and educations from most recent to oldest
5. Do not fabricate information not present in the CV
6. IMPORTANT: Separate soft skills from technical tools - they go in different arrays
7. Extract the professional summary/objective if present at the top of the CV
`;
}

/**
 * Extract full profile data from CV text using GPT-4o
 * Includes personal info, experiences, education, skills, and languages
 * 
 * @param cvText The raw text content of the CV
 * @returns Complete structured profile data
 */
export async function extractFullProfileFromText(cvText: string): Promise<CVFullProfileExtractionResult> {
  try {
    console.log('🔍 Starting full CV profile extraction from text...');
    console.log(`   Text length: ${cvText.length} characters`);

    if (!cvText || cvText.trim().length < 50) {
      throw new Error('CV text is too short or empty');
    }

    const baseApiUrl = getApiBaseUrl();
    const apiUrl = baseApiUrl.startsWith('http')
      ? baseApiUrl
      : `${baseApiUrl}/analyze-cv-vision`;

    const prompt = buildFullProfileExtractionPrompt();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert CV parser. Extract ALL profile information from the provided CV text. Return ONLY valid JSON."
          },
          {
            role: "user",
            content: `${prompt}\n\n---\n\nCV TEXT TO PARSE:\n\n${cvText}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 6000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      
      if (response.status === 503) {
        errorMessage = '⚠️ OpenAI API key is not configured.';
        toast.error(errorMessage, { duration: 8000 });
        throw new Error(errorMessage);
      }
      
      try {
        const errorData = await response.json();
        errorMessage = `API error: ${errorData.error?.message || errorData.message || response.statusText}`;
      } catch (e) {
        console.error('Could not parse error response', e);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Full profile extraction completed');

    if (data.status === 'success' && data.content) {
      let parsedContent: any;

      if (typeof data.content === 'string') {
        parsedContent = JSON.parse(data.content);
      } else if (typeof data.content === 'object') {
        parsedContent = data.content;
      } else {
        throw new Error('Invalid response format');
      }

      // Normalize all extracted data
      const result: CVFullProfileExtractionResult = {
        personalInfo: normalizePersonalInfo(parsedContent.personalInfo || {}),
        experiences: normalizeExperiences(parsedContent.experiences || []),
        educations: normalizeEducations(parsedContent.educations || []),
        skills: normalizeSkills(parsedContent.skills || []),
        tools: normalizeTools(parsedContent.tools || []),
        languages: normalizeLanguages(parsedContent.languages || []),
        summary: cleanString(parsedContent.summary) || ''
      };
      
      console.log(`   ✓ Personal info: ${result.personalInfo.firstName} ${result.personalInfo.lastName}`);
      console.log(`   ✓ Experiences: ${result.experiences.length}`);
      console.log(`   ✓ Educations: ${result.educations.length}`);
      console.log(`   ✓ Skills: ${result.skills.length}`);
      console.log(`   ✓ Tools: ${result.tools.length}`);
      console.log(`   ✓ Languages: ${result.languages.length}`);
      console.log(`   ✓ Summary: ${result.summary ? 'Yes' : 'No'}`);

      return result;
    } else {
      throw new Error(data.message || 'API returned error status');
    }
  } catch (error: unknown) {
    console.error('❌ Full profile extraction failed:', error);
    toast.error(
      `Failed to extract profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}

/**
 * Normalize personal info
 */
function normalizePersonalInfo(info: any): ExtractedPersonalInfo {
  return {
    firstName: cleanString(info.firstName || info.first_name),
    lastName: cleanString(info.lastName || info.last_name),
    email: cleanString(info.email),
    phone: cleanString(info.phone || info.telephone),
    city: cleanString(info.city || info.ville),
    country: cleanString(info.country || info.pays),
    headline: cleanString(info.headline || info.title || info.jobTitle)
  };
}

/**
 * Normalize educations array
 */
function normalizeEducations(educations: any[]): ExtractedEducation[] {
  if (!Array.isArray(educations)) return [];

  return educations
    .filter(edu => edu && (edu.institution || edu.degree))
    .map((edu, index) => ({
      id: edu.id || `edu-${Date.now()}-${index}`,
      degree: normalizeDegree(edu.degree || edu.level),
      field: cleanString(edu.field || edu.fieldOfStudy || edu.major),
      institution: cleanString(edu.institution || edu.school || edu.university),
      startDate: normalizeDate(edu.startDate || edu.start_date),
      endDate: edu.current ? '' : normalizeDate(edu.endDate || edu.end_date || edu.graduationYear),
      current: Boolean(edu.current || edu.isCurrent),
      description: cleanString(edu.description || edu.details || '')
    }));
}

/**
 * Normalize degree level
 */
function normalizeDegree(degree: any): string {
  if (!degree) return '';
  
  const normalized = String(degree).toLowerCase().trim();
  
  if (normalized.includes('phd') || normalized.includes('doctor') || normalized.includes('doctorat')) {
    return 'phd';
  }
  if (normalized.includes('master') || normalized.includes('mba') || normalized.includes('msc') || normalized.includes('bac+5')) {
    return 'master';
  }
  if (normalized.includes('bachelor') || normalized.includes('licence') || normalized.includes('bsc') || normalized.includes('ba') || normalized.includes('bac+3')) {
    return 'bachelor';
  }
  if (normalized.includes('associate') || normalized.includes('bac+2') || normalized.includes('bts') || normalized.includes('dut')) {
    return 'associate';
  }
  if (normalized.includes('high school') || normalized.includes('bac') || normalized.includes('lycée')) {
    return 'high-school';
  }
  if (normalized.includes('bootcamp') || normalized.includes('certificate') || normalized.includes('certification')) {
    return 'bootcamp';
  }
  
  return 'other';
}

/**
 * Normalize skills array (soft skills, methodologies)
 */
function normalizeSkills(skills: any): string[] {
  if (!skills) return [];
  
  if (Array.isArray(skills)) {
    return skills
      .map(s => cleanString(typeof s === 'string' ? s : s?.name))
      .filter(s => s.length > 0);
  }
  
  if (typeof skills === 'string') {
    return skills.split(/[,;]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
  
  return [];
}

/**
 * Normalize tools array (technical tools, programming languages, frameworks)
 */
function normalizeTools(tools: any): string[] {
  if (!tools) return [];
  
  if (Array.isArray(tools)) {
    return tools
      .map(t => cleanString(typeof t === 'string' ? t : t?.name))
      .filter(t => t.length > 0);
  }
  
  if (typeof tools === 'string') {
    return tools.split(/[,;]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }
  
  return [];
}

/**
 * Normalize languages array
 */
function normalizeLanguages(languages: any[]): ExtractedLanguage[] {
  if (!Array.isArray(languages)) return [];

  return languages
    .filter(lang => lang && (lang.language || lang.name))
    .map(lang => ({
      language: cleanString(lang.language || lang.name),
      level: normalizeLanguageLevel(lang.level || lang.proficiency)
    }));
}

/**
 * Normalize language level
 */
function normalizeLanguageLevel(level: any): string {
  if (!level) return 'intermediate';
  
  const normalized = String(level).toLowerCase().trim();
  
  if (normalized.includes('native') || normalized.includes('maternel') || normalized.includes('bilingual') || normalized.includes('bilingue')) {
    return 'native';
  }
  if (normalized.includes('fluent') || normalized.includes('courant') || normalized.includes('professional') || normalized.includes('professionnel')) {
    return 'fluent';
  }
  if (normalized.includes('intermediate') || normalized.includes('intermédiaire') || normalized.includes('conversational')) {
    return 'intermediate';
  }
  if (normalized.includes('beginner') || normalized.includes('débutant') || normalized.includes('basic') || normalized.includes('elementary')) {
    return 'beginner';
  }
  
  return 'intermediate';
}


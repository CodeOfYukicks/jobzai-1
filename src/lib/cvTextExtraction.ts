import { notify } from '@/lib/notify';

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
 * Result of CV text extraction with categorized tags
 */
export interface CVExtractionResult {
    text: string;              // Raw extracted text from CV
    technologies: string[];    // Extracted technologies (React, Python, AWS, etc.)
    skills: string[];          // Extracted skills (Leadership, Agile, languages, etc.)
    experiences?: ExtractedExperience[]; // Extracted professional experiences
}

/**
 * Determine API base URL based on environment
 * @returns Base URL for API calls
 */
function getApiBaseUrl(): string {
    // In production, use direct Cloud Run URL for Firebase Functions v2
    if (import.meta.env.PROD || window.location.hostname !== 'localhost') {
        // Production: Use direct Cloud Run URL for analyzeCVVision
        return 'https://analyzecvvision-pyozgz4rbq-uc.a.run.app';
    }

    // Development: Use relative URL with proxy
    return '/api';
}

/**
 * Build the CV text extraction prompt for GPT-4o Vision
 * Optimized to extract text and generate categorized tags
 * @returns Formatted prompt string
 */
function buildTextExtractionPrompt(): string {
    return `
# CV TEXT EXTRACTION & TAG GENERATION

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON structure.

## YOUR ROLE
You are an expert CV parser with deep knowledge of technology stacks, programming languages, frameworks, tools, and professional skills. Your task is to extract ALL text from the CV images and intelligently categorize technologies and skills.

## MISSION
Analyze the CV images and extract:
1. **Complete text content** - Every word from the CV
2. **Technologies** - All technical tools, languages, frameworks, platforms
3. **Skills** - All professional skills, methodologies, spoken languages

## EXTRACTION METHODOLOGY

### PHASE 1: TEXT EXTRACTION
Extract ALL visible text from the CV images systematically:
- Contact information (name, email, phone, location, LinkedIn, GitHub, portfolio)
- Professional summary/objective
- Work experience (ALL positions, companies, dates, responsibilities, achievements)
- Education (ALL degrees, institutions, dates, honors, coursework)
- Skills section (technical and soft skills)
- Certifications and training
- Projects and portfolio work
- Awards and honors
- Publications and research
- Volunteer work and leadership
- Languages and additional sections
- ANY other text visible in the CV

**IMPORTANT**: Extract text in a clean, readable format. Preserve structure where meaningful (sections, bullet points).

### PHASE 2: TECHNOLOGY IDENTIFICATION
From the extracted text, identify ALL technologies mentioned. Technologies include:

**Programming Languages**: Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, Scala, R, etc.

**Frameworks & Libraries**: React, Angular, Vue, Node.js, Express, Django, Flask, Spring Boot, .NET, Rails, Laravel, etc.

**Databases**: PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Cassandra, Oracle, SQL Server, etc.

**Cloud & DevOps**: AWS, Azure, GCP, Docker, Kubernetes, Jenkins, GitLab CI, GitHub Actions, Terraform, Ansible, etc.

**Tools & Platforms**: Git, Jira, Figma, Sketch, Adobe XD, Salesforce, SAP, Tableau, Power BI, etc.

**Other Technologies**: REST API, GraphQL, Microservices, Serverless, Machine Learning, AI, Blockchain, etc.

**RULES**:
- Extract exact names as written (e.g., "React.js" → "React", "Node.js" → "Node.js")
- Normalize common variations (e.g., "Javascript" → "JavaScript", "Postgres" → "PostgreSQL")
- Remove duplicates
- Include technologies mentioned in work experience, skills section, projects, or education
- Be comprehensive - don't miss any technology

### PHASE 3: SKILL IDENTIFICATION
From the extracted text, identify ALL professional skills mentioned. Skills include:

**Soft Skills**: Leadership, Communication, Problem Solving, Teamwork, Project Management, Time Management, Critical Thinking, etc.

**Methodologies**: Agile, Scrum, Kanban, DevOps, CI/CD, TDD, Design Thinking, etc.

**Domain Skills**: Data Analysis, UX Design, Product Management, Business Analysis, Customer Success, etc.

**Spoken Languages**: English, French, Spanish, German, Mandarin, etc. (look for "fluent", "native", "proficient", "bilingual", language names in any section)

**Certifications as Skills**: PMP, AWS Certified, Google Analytics, Certified Scrum Master, etc.

**RULES**:
- Extract exact skill names
- Include spoken languages (very important for job matching)
- Include methodologies and frameworks (Agile, Scrum, etc.)
- Remove duplicates
- Be comprehensive - check ALL sections (summary, experience, skills, education, certifications)

### PHASE 4: PROFESSIONAL EXPERIENCE EXTRACTION
Extract ALL work experiences as structured data:

**For EACH experience, extract:**
- **title**: Exact job title/position
- **company**: Company/employer name
- **startDate**: In YYYY-MM format (e.g., "2020-01" for January 2020)
- **endDate**: In YYYY-MM format, or empty string "" if current position
- **current**: true if this is the current position, false otherwise
- **industry**: One of: Technology / IT, Finance / Banking, Healthcare, Consulting, Manufacturing, Retail / E-commerce, Education, Media / Entertainment, Real Estate, Energy, Transportation, Other
- **contractType**: One of: full-time, part-time, contract, freelance, internship
- **location**: City, Country or "Remote"
- **responsibilities**: Array of 3-7 bullet points describing key duties and achievements

**DATE PARSING:**
- "January 2020" or "Jan 2020" → "2020-01"
- "2020" (year only) → "2020-01"
- "Present", "Current", "Aujourd'hui", "Actuel" → endDate: "", current: true

**EXPERIENCE RULES:**
- Extract ALL experiences including internships
- Order from most recent to oldest
- Consulting roles with multiple clients = separate experiences
- Include metrics and achievements in responsibilities

## OUTPUT JSON STRUCTURE

Return ONLY this JSON structure (no other text):

{
  "text": "<complete_extracted_text_from_cv_clean_and_readable>",
  "technologies": [
    "Technology 1",
    "Technology 2",
    "Technology 3"
  ],
  "skills": [
    "Skill 1",
    "Skill 2",
    "Skill 3"
  ],
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
        "Led product strategy for mobile applications",
        "Managed team of 8 engineers",
        "Increased user engagement by 35%"
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
        "Owned roadmap for advertising platform",
        "Collaborated with data science team"
      ]
    }
  ]
}

## QUALITY REQUIREMENTS

1. **Text Completeness**: Extract EVERY word from the CV. Do not miss any section.
2. **Text Readability**: Format text cleanly. Use line breaks between sections. Preserve meaningful structure.
3. **Tag Accuracy**: Ensure all technologies and skills are correctly identified and categorized.
4. **No Duplicates**: Remove duplicate entries from technologies and skills arrays.
5. **Normalization**: Normalize common variations (e.g., "Javascript" → "JavaScript").
6. **Comprehensiveness**: Be thorough. Check ALL sections for technologies and skills.
7. **Experience Accuracy**: Extract ALL work experiences with correct dates and responsibilities.

## EXAMPLES

**Good Technology Extraction**:
- "Worked with React and Node.js" → Extract: ["React", "Node.js"]
- "Experience in Python, Django, and PostgreSQL" → Extract: ["Python", "Django", "PostgreSQL"]
- "AWS, Docker, Kubernetes" → Extract: ["AWS", "Docker", "Kubernetes"]

**Good Skill Extraction**:
- "Native French speaker, fluent in English" → Extract: ["French", "English"]
- "Agile methodology, Scrum master certified" → Extract: ["Agile", "Scrum"]
- "Strong leadership and communication skills" → Extract: ["Leadership", "Communication"]

**Bad Examples** (What NOT to do):
- Missing technologies mentioned in project descriptions
- Failing to extract spoken languages
- Not normalizing variations (keeping both "Javascript" and "JavaScript")
- Incomplete text extraction
`;
}

/**
 * Extract text and generate tags from CV using GPT-4o Vision
 * Sends PDF images to GPT-4o Vision with optimized prompt for text extraction and tag generation
 * 
 * @param images Array of base64 encoded images (from pdfToImages)
 * @returns Extracted text with categorized technologies and skills
 */
export async function extractCVTextAndTags(images: string[]): Promise<CVExtractionResult> {
    try {
        console.log('🔍 Starting CV text extraction with GPT-4o Vision...');
        console.log(`   Images: ${images.length} page(s)`);

        const baseApiUrl = getApiBaseUrl();
        // For direct Cloud Run URL, use it directly
        // For relative URL (/api), append the endpoint path
        const apiUrl = baseApiUrl.startsWith('http')
            ? baseApiUrl  // Direct Cloud Run URL - use as is
            : `${baseApiUrl}/analyze-cv-vision`;  // Relative URL - append path

        // Build the prompt
        const prompt = buildTextExtractionPrompt();

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
                    url: `data:image/jpeg;base64,${image}`,
                    // Using "high" detail for comprehensive text extraction
                    detail: "high"
                }
            });
            console.log(`   ✓ Added image ${index + 1} (${(image.length / 1024).toFixed(1)} KB)`);
        });

        console.log('📡 Sending request to GPT-4o Vision API for text extraction...');

        // Send request to API endpoint
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "gpt-5.1",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert CV parser specializing in text extraction, technology/skill categorization, and professional experience extraction. Extract ALL text from CV images, identify technologies and skills, and structure ALL work experiences. Return ONLY valid JSON - no markdown, no code blocks."
                    },
                    {
                        role: "user",
                        content: content
                    }
                ],
                response_format: { type: "json_object" }, // Force JSON response
                max_tokens: 6000, // Increased for text + tags + experiences
                temperature: 0.1, // Low temperature for precise, consistent extraction
                reasoning_effort: "medium" // GPT-5.1 feature for thorough CV text extraction
            })
        });

        if (!response.ok) {
            let errorMessage = `API error: ${response.status} ${response.statusText}`;
            
            // Handle missing API key error specifically (503 Service Unavailable)
            if (response.status === 503) {
                errorMessage = '⚠️ OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file and restart the server.';
                console.error('❌ Configuration Error: OpenAI API key is missing');
                notify.error(errorMessage, { duration: 8000 });
                throw new Error(errorMessage);
            }
            
            try {
                const errorData = await response.json();
                console.error('❌ GPT-4o Vision API error:', errorData);
                errorMessage = `GPT-4o Vision API error: ${errorData.error?.message || errorData.message || response.statusText}`;
            } catch (e) {
                console.error('Could not parse error response', e);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ GPT-4o Vision extraction completed successfully');

        // Parse the response
        try {
            if (data.status === 'success' && data.content) {
                let parsedContent: CVExtractionResult;

                // The API should return JSON directly due to response_format: "json_object"
                if (typeof data.content === 'string') {
                    // Try to parse as JSON
                    parsedContent = JSON.parse(data.content);
                } else if (typeof data.content === 'object') {
                    // Already parsed
                    parsedContent = data.content;
                } else {
                    throw new Error('Invalid response format from GPT-4o Vision API');
                }

                // Validate the response structure
                if (!parsedContent.text || !Array.isArray(parsedContent.technologies) || !Array.isArray(parsedContent.skills)) {
                    throw new Error('Invalid extraction result structure');
                }

                // Normalize experiences if present
                if (parsedContent.experiences && Array.isArray(parsedContent.experiences)) {
                    parsedContent.experiences = normalizeExperiences(parsedContent.experiences);
                }

                console.log(`   ✓ Extracted text: ${parsedContent.text.length} characters`);
                console.log(`   ✓ Technologies found: ${parsedContent.technologies.length}`);
                console.log(`   ✓ Skills found: ${parsedContent.skills.length}`);
                console.log(`   ✓ Experiences found: ${parsedContent.experiences?.length || 0}`);

                return parsedContent;
            } else {
                throw new Error(data.message || 'API returned error status');
            }
        } catch (parseError) {
            console.error('Failed to parse GPT-4o Vision response:', parseError);
            throw new Error('Invalid extraction format received from GPT-4o Vision. Please try again.');
        }
    } catch (error: unknown) {
        console.error('❌ GPT-4o Vision extraction failed:', error);
        notify.error(
            `Failed to extract CV text: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    
    // Month names mapping (English and French)
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
    
    // Try to extract month and year: "January 2020"
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

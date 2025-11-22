import { toast } from 'sonner';

/**
 * Result of CV text extraction with categorized tags
 */
export interface CVExtractionResult {
    text: string;              // Raw extracted text from CV
    technologies: string[];    // Extracted technologies (React, Python, AWS, etc.)
    skills: string[];          // Extracted skills (Leadership, Agile, languages, etc.)
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

## OUTPUT JSON STRUCTURE

Return ONLY this JSON structure (no other text):

{
  "text": "<complete_extracted_text_from_cv_clean_and_readable>",
  "technologies": [
    "Technology 1",
    "Technology 2",
    "Technology 3",
    ...
  ],
  "skills": [
    "Skill 1",
    "Skill 2",
    "Skill 3",
    ...
  ]
}

## QUALITY REQUIREMENTS

1. **Text Completeness**: Extract EVERY word from the CV. Do not miss any section.
2. **Text Readability**: Format text cleanly. Use line breaks between sections. Preserve meaningful structure.
3. **Tag Accuracy**: Ensure all technologies and skills are correctly identified and categorized.
4. **No Duplicates**: Remove duplicate entries from technologies and skills arrays.
5. **Normalization**: Normalize common variations (e.g., "Javascript" → "JavaScript").
6. **Comprehensiveness**: Be thorough. Check ALL sections for technologies and skills.

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
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert CV parser specializing in text extraction and technology/skill categorization. Extract ALL text from CV images and intelligently identify technologies and professional skills. Return ONLY valid JSON - no markdown, no code blocks."
                    },
                    {
                        role: "user",
                        content: content
                    }
                ],
                response_format: { type: "json_object" }, // Force JSON response
                max_tokens: 4000, // Sufficient for text extraction + tags
                temperature: 0.1 // Low temperature for precise, consistent extraction
            })
        });

        if (!response.ok) {
            let errorMessage = `API error: ${response.status} ${response.statusText}`;
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

                console.log(`   ✓ Extracted text: ${parsedContent.text.length} characters`);
                console.log(`   ✓ Technologies found: ${parsedContent.technologies.length}`);
                console.log(`   ✓ Skills found: ${parsedContent.skills.length}`);

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
        toast.error(
            `Failed to extract CV text: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        throw error;
    }
}

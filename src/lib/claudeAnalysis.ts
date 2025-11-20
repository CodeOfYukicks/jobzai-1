import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';

/**
 * Détermine l'URL de base de l'API en fonction de l'environnement
 * @returns L'URL de base pour les appels API
 */
function getApiBaseUrl(): string {
  // En production, utilisez des URLs relatives pour le même domaine
  // En développement, avec la configuration proxy dans vite.config.ts,
  // nous pouvons aussi utiliser des URLs relatives
  return '/api';
}

/**
 * Call Claude API with PDF for CV analysis
 * @param pdfFile The PDF file to analyze
 * @param jobDetails Job details for analysis context
 * @returns The analysis results
 */
export async function analyzeCVWithClaude(
  pdfFile: File,
  jobDetails: { jobTitle: string; company: string; jobDescription: string }
) {
  try {
    console.log('Starting CV analysis with Claude API...');
    
    // Obtenir l'URL de base de l'API
    const baseApiUrl = getApiBaseUrl();
    
    // Try multiple server endpoints in case the user is running on different ports
    // First, try connecting to the test endpoint to ensure server is running
    try {
      console.log('Testing connection to Claude API server...');
      const testResponse = await fetch(`${baseApiUrl}/test`);
      if (!testResponse.ok) {
        console.warn('Claude API server test failed. Will still attempt main call.');
      } else {
        const testData = await testResponse.json();
        console.log('Claude API server test successful');
      }
    } catch (testError) {
      console.warn('Failed to connect to Claude API server test endpoint:', testError);
    }
    
    // Make sure we're using the exact URL for our Express server
    const apiUrl = `${baseApiUrl}/claude`;
    
    console.log('Preparing PDF for Claude API...');
    
    // Convert PDF to base64 for direct submission
    const base64PDF = await fileToBase64(pdfFile);
    console.log('PDF converted to base64 successfully, size:', base64PDF.length);
    
    // Construct the prompt for Claude
    const prompt = buildATSAnalysisPrompt(jobDetails);
    
    console.log('Sending request to Claude API with PDF...');
    
    // Configuration de la requête Claude
    const claudeRequest = {
      model: "claude-3-5-sonnet-20241022", // Modèle qui supporte les entrées PDF
      max_tokens: 4000, // Réponse assez longue pour l'analyse
      temperature: 0.2,
      system: "You are an expert ATS (Applicant Tracking System) analyzer and career coach. Your task is to provide detailed, accurate, and helpful analysis of how well a resume matches a specific job description. Return your analysis as structured JSON data only.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt  // Simplified format without nesting
            },
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64PDF
              }
            }
          ]
        }
      ]
    };
    
    // Create the Claude API request with the PDF file using a model that supports PDF
    // Using the latest format expected by Claude API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(claudeRequest)
    });
    
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('Claude API error:', errorData);
        errorMessage = `Claude API error: ${errorData.error?.message || errorData.message || response.statusText}`;
      } catch (e) {
        console.error('Could not parse error response', e);
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Claude analysis completed successfully');
    
    // Parse the response
    try {
      // The server should now be returning a properly formatted response directly
      if (data.status === 'success') {
        const content = data.content;
        
        if (!content) {
          throw new Error('Empty response content from Claude API');
        }
        
        // Extract the JSON from Claude's response if needed
        let parsedAnalysis;
        
        if (typeof content === 'string') {
          // Claude returns more conversational responses, so we need to extract JSON
          const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                          content.match(/{[\s\S]*}/);
                          
          const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
          parsedAnalysis = JSON.parse(jsonStr);
        } else if (Array.isArray(content) && content.length > 0 && content[0].text) {
          // Handle the response format where content is an array of objects with text
          const analysisText = content[0].text;
          const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                          analysisText.match(/{[\s\S]*}/);
                          
          const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : analysisText;
          parsedAnalysis = JSON.parse(jsonStr);
        } else {
          // If it's already parsed JSON
          parsedAnalysis = content;
        }
        
        return {
          ...parsedAnalysis,
          date: new Date().toISOString(),
          id: `claude_ats_${Date.now()}`
        };
      } else {
        throw new Error(data.message || 'API returned error status');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      throw new Error('Invalid analysis format received from Claude. Please try again.');
    }
  } catch (error: unknown) {
    console.error('Claude API call failed:', error);
    toast.error(`Failed to analyze CV with Claude: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Extract text from a PDF file
 * @param file PDF file
 * @returns Extracted text
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log("Starting PDF text extraction");
    const arrayBuffer = await file.arrayBuffer();
    console.log("PDF loaded into memory, size:", arrayBuffer.byteLength);
    
    // Configure PDF.js worker to use local file from public folder
    // This avoids CORS issues and 404 errors from CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`PDF loaded successfully: ${pdf.numPages} pages`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}/${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    console.log("Text extraction completed successfully");
    return fullText || `Failed to extract meaningful text from PDF`;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return `Error extracting text: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Convert a file to base64
 * @param file File to convert
 * @returns Base64 encoded string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      // Extract just the base64 part after the prefix
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Build the prompt for Claude ATS analysis
 * @param jobDetails Details about the job for analysis
 * @returns Formatted prompt string
 */
function buildATSAnalysisPrompt(jobDetails: { 
  jobTitle: string; 
  company: string; 
  jobDescription: string; 
}): string {
  return `
# ATS Resume Analysis Task - RUTHLESS & PRECISE

## Instructions
Analyze the provided resume PDF against the job description below. Your goal is to provide a brutally honest assessment.
**CORE DIRECTIVE**: You must distinguish between a candidate who "knows about" a topic and one who "does" the job. 
**EXAMPLE**: A "Functional Consultant" is NOT a "Technical Developer" even if they know Salesforce. A "Project Manager" is NOT a "Software Engineer".

## Job Details
- Position: ${jobDetails.jobTitle}
- Company: ${jobDetails.company}
- Job Description:
\`\`\`
${jobDetails.jobDescription}
\`\`\`

## SCORING ALGORITHM: ZERO-BASED SCORING
Do NOT start at 100 and deduct. Start at **0** and ADD points only for proven matches.

### PHASE 1: THE ROLE ALIGNMENT GATE (CRITICAL)
Before checking keywords, you MUST validate the ROLE TYPE.
1. **Title/Level Check**: Does the candidate's recent history match the target role's level (e.g., Junior vs Senior, Lead vs Manager)?
2. **Nature of Work**: Is there a functional vs. technical mismatch?
   - *Example*: Functional Salesforce Consultant applying for Salesforce Developer role -> MISMATCH.
   - *Example*: Project Manager applying for Coding role -> MISMATCH.

**GATE RULE**: If there is a fundamental Role/Nature mismatch, **STOP SCORING HIGHER THAN 45%**. 
- The match score MUST be between 0-45%.
- Do NOT look at keyword matches to inflate this. Wrong role = Fail.

### PHASE 2: CALCULATE SCORE (Only if Phase 1 passes)
Start at 0. Add points as follows:

1. **Role Alignment (Max 20 pts)**: 
   - Perfect title/level match: +20
   - Adjacent role but same domain: +10
   - Mismatch: +0

2. **Hard Skills & Tools (Max 30 pts)**:
   - Meets ALL critical technical skills with required depth: +30
   - Meets most critical skills: +20
   - Missing key tools (e.g., Python for ML role): +0

3. **Experience Depth (Max 20 pts)**:
   - Meets/Exceeds years of experience in RELEVANT tasks: +20
   - Slightly under experienced: +10
   - Significantly junior/senior misalignment: +0

4. **Education & Certifications (Max 15 pts)**:
   - Degree/Certs match requirements: +15
   - Partial match: +5 to +10
   - Missing required degree/certs: +0

5. **Soft Skills & Culture (Max 15 pts)**:
   - Communication, leadership, etc. as evidenced by achievements: +15

**TOTAL SCORE = Sum of above.**

## SCORING TIERS (STRICT ENFORCEMENT)
- **0-45% (Mismatch)**: Fundamental role mismatch (e.g., Functional vs Technical) OR missing >50% critical skills.
- **46-60% (Weak)**: Right role type, but significantly underqualified or missing critical "Must-Haves".
- **61-75% (Potential)**: Good role alignment, has core skills, but missing some specific requirements or years of exp.
- **76-89% (Strong)**: Strong role alignment, meets ALL critical requirements, good experience depth.
- **90-100% (Perfect)**: Unicorn candidate. Exact role match, exceeds years, has all nice-to-haves.

## Output Format
Return ONLY a JSON object with the following structure:

\`\`\`json
{
  "matchScore": <integer_between_0_and_100>,
  "keyFindings": [<array_of_5-7_specific_key_findings_as_strings>],
  "skillsMatch": {
    "matching": [{"name": <skill_name>, "relevance": <integer_0-100>}, ...],
    "missing": [{"name": <skill_name>, "relevance": <integer_0-100>}, ...],
    "alternative": [{"name": <skill_name>, "alternativeTo": <required_skill>}, ...]
  },
  "categoryScores": {
    "skills": <integer_between_0_and_100>,
    "experience": <integer_between_0_and_100>,
    "education": <integer_between_0_and_100>,
    "industryFit": <integer_between_0_and_100>
  },
  "executiveSummary": <string_summarizing_overall_match_quality>,
  "experienceAnalysis": [
    {"aspect": <aspect_name>, "analysis": <detailed_analysis>},
    ...
  ],
  "recommendations": [
    {
      "title": <recommendation_title>,
      "description": <detailed_recommendation>,
      "priority": <"high"|"medium"|"low">,
      "examples": <example_text_or_null>
    },
    ...
  ]
}
\`\`\`

## Final Check
- Did you check for Functional vs Technical mismatch?
- If the candidate is a "Consultant" applying for a "Developer" role, did you cap the score at 45?
- Did you start at 0 and add points?
- **AVOID CLUSTERING**: Do not default to 75%. If they are a 40% match, say 40%.
`;
} 
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
# ATS Resume Analysis Task

## Instructions
Analyze the provided resume PDF against the job description below. Provide a detailed, accurate and genuinely helpful analysis of how well the resume matches the job requirements.

## Job Details
- Position: ${jobDetails.jobTitle}
- Company: ${jobDetails.company}
- Job Description:
\`\`\`
${jobDetails.jobDescription}
\`\`\`

## Analysis Requirements
1. THOROUGHLY examine both the resume and job description
2. Provide an HONEST and PRECISE match analysis with NO artificial inflation of scores
3. Vary your scores meaningfully based on the actual match quality - don't default to generic mid-range scores
4. Identify SPECIFIC strengths and gaps, not generic advice

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

## Important Guidelines
- Ensure scores are MEANINGFUL and DIFFERENTIATED, not clustered in the 70-80% range
- Assign lower scores (30-60%) when appropriate for poor matches
- Assign higher scores (80-95%) only for exceptionally strong matches
- NEVER automatically inflate scores - be honest and precise
- Include specific job-relevant KEYWORDS found/missing in the resume
- Provide detailed, actionable recommendations specific to this resume and job
- Give real examples and fixes in your recommendations
`;
} 
import axios from 'axios';
import { CVData } from '../types/cvEditor';
import { CVReviewResult, CVSuggestion, CVSectionType, SuggestionTag, SuggestionPriority } from '../types/cvReview';
import { PreviousAnalysisContext } from '../types/cvReviewHistory';

interface JobContext {
  jobTitle: string;
  company: string;
  jobDescription?: string;
  keywords: string[];
  strengths: string[];
  gaps: string[];
}

interface CVReviewRequest {
  cvData: CVData;
  jobContext?: JobContext;
  previousAnalysis?: PreviousAnalysisContext;
  signal?: AbortSignal;
}

/**
 * Analyzes CV and generates AI-powered suggestions
 */
export async function analyzeCVWithAI(request: CVReviewRequest): Promise<CVReviewResult> {
  try {
    const response = await axios.post('/api/cv-review', {
      cvData: request.cvData,
      jobContext: request.jobContext,
      previousAnalysis: request.previousAnalysis
    }, {
      timeout: 90000, // 90 seconds for complex analysis
      signal: request.signal
    });

    if (response.data.status === 'success') {
      return response.data.result;
    } else {
      throw new Error(response.data.message || 'Failed to analyze CV');
    }
  } catch (error: any) {
    console.error('Error analyzing CV:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      isCancel: axios.isCancel(error)
    });
    
    // If request was cancelled, don't throw or use fallback
    if (axios.isCancel(error)) {
      console.log('Request was cancelled, using fallback analysis');
      return generateFallbackAnalysis(request.cvData, request.jobContext, request.previousAnalysis);
    }
    
    // If API fails, return fallback analysis
    if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
      console.log('API not available, using fallback analysis');
      return generateFallbackAnalysis(request.cvData, request.jobContext, request.previousAnalysis);
    }
    
    throw error;
  }
}

/**
 * Generate fallback analysis when API is unavailable
 */
function generateFallbackAnalysis(cvData: CVData, jobContext?: JobContext, previousAnalysis?: PreviousAnalysisContext): CVReviewResult {
  const suggestions: CVSuggestion[] = [];
  const firstName = cvData.personalInfo.firstName || 'there';
  
  // Get list of applied suggestion IDs to avoid repeating them
  const appliedSuggestionIds = new Set(previousAnalysis?.appliedSuggestionIds || []);
  
  // Contact section checks - Skip if already applied
  if (!cvData.personalInfo.phone && !appliedSuggestionIds.has('contact-phone')) {
    suggestions.push({
      id: 'contact-phone',
      title: 'Add Phone Number',
      description: 'At the senior level, recruiters expect a valid phone number in a standard format to facilitate direct communication and ensure ATS compatibility.',
      section: 'contact',
      priority: 'high',
      tags: ['missing_info', 'ats_optimize'],
      action: {
        type: 'add',
        targetSection: 'contact',
        targetField: 'phone',
        suggestedValue: ''
      },
      isApplicable: false
    });
  }

  if (!cvData.personalInfo.location && !appliedSuggestionIds.has('contact-location')) {
    suggestions.push({
      id: 'contact-location',
      title: 'Add Location',
      description: 'Clarifies your geographic availability or remote/hybrid preference, which employers often consider when evaluating candidates\' fit.',
      section: 'contact',
      priority: 'high',
      tags: ['missing_info'],
      action: {
        type: 'add',
        targetSection: 'contact',
        targetField: 'location',
        suggestedValue: ''
      },
      isApplicable: false
    });
  }

  if (!cvData.personalInfo.linkedin && !appliedSuggestionIds.has('contact-linkedin')) {
    suggestions.push({
      id: 'contact-linkedin',
      title: 'Add LinkedIn Profile',
      description: 'A LinkedIn URL adds credibility and allows recruiters to learn more about your professional network and endorsements.',
      section: 'contact',
      priority: 'medium',
      tags: ['missing_info', 'ats_optimize'],
      action: {
        type: 'add',
        targetSection: 'contact',
        targetField: 'linkedin',
        suggestedValue: ''
      },
      isApplicable: false
    });
  }

  // About/Summary section checks
  if (!cvData.summary || cvData.summary.length < 50) {
    // Generate a suggested summary based on available info
    const title = cvData.personalInfo.title || 'professional';
    const name = cvData.personalInfo.firstName ? `${cvData.personalInfo.firstName}` : '';
    const yearsHint = cvData.experiences.length > 0 ? ` with ${cvData.experiences.length}+ years of experience` : '';
    const skillsHint = cvData.skills.length > 0 ? ` specializing in ${cvData.skills.slice(0, 3).map(s => s.name).join(', ')}` : '';
    
    // Always generate a meaningful summary, even without much data
    let suggestedSummary: string;
    if (cvData.experiences.length > 0 || cvData.skills.length > 0) {
      suggestedSummary = `Results-driven ${title}${yearsHint}${skillsHint}. Proven track record of delivering high-impact solutions and driving business outcomes. Passionate about leveraging technology to solve complex challenges.`;
    } else {
      suggestedSummary = `Motivated ${title} with a strong foundation in problem-solving and collaboration. Eager to contribute to innovative projects and drive meaningful results. Committed to continuous learning and professional growth.`;
    }
    
    suggestions.push({
      id: 'about-summary',
      title: 'Add Resume Summary',
      description: 'This concise, 2-3 sentence summary establishes your professional identity and key value proposition up front, setting a strong tone for the rest of your resume.',
      section: 'about',
      priority: 'high',
      tags: ['missing_info', 'add_impact', 'stay_relevant', 'be_concise', 'tailor_resume'],
      action: {
        type: 'add',
        targetSection: 'about',
        targetField: 'summary',
        suggestedValue: suggestedSummary
      },
      isApplicable: true
    });
  } else if (cvData.summary.length > 500) {
    // Generate a shorter version
    const shortenedSummary = cvData.summary.substring(0, 300).trim() + '...';
    suggestions.push({
      id: 'about-summary-concise',
      title: 'Shorten Resume Summary',
      description: 'Your summary is quite long. Aim for 2-3 impactful sentences that highlight your key achievements and value proposition.',
      section: 'about',
      priority: 'medium',
      tags: ['be_concise', 'ats_optimize'],
      action: {
        type: 'rewrite',
        targetSection: 'about',
        targetField: 'summary',
        currentValue: cvData.summary,
        suggestedValue: shortenedSummary
      },
      isApplicable: true
    });
  }

  // Experience section checks
  if (cvData.experiences.length === 0) {
    suggestions.push({
      id: 'exp-add',
      title: 'Add Work Experience',
      description: 'Work experience is the most important section of your resume. Add your relevant positions to showcase your career progression.',
      section: 'experiences',
      priority: 'high',
      tags: ['missing_info'],
      action: {
        type: 'add',
        targetSection: 'experiences'
      },
      isApplicable: false
    });
  } else {
    // Check for experiences without metrics
    cvData.experiences.forEach((exp, index) => {
      const hasMetrics = exp.bullets.some(bullet => /\d+/.test(bullet));
      if (!hasMetrics && exp.bullets.length > 0) {
        suggestions.push({
          id: `exp-metrics-${exp.id}`,
          title: `Add work experience achievement bullet: ${exp.title}`,
          description: `Add a bullet point: 'Architected and deployed a microservices solution for <Project> [supporting <X> transactions/month]' to quantify your impact at ${exp.company}.`,
          section: 'experiences',
          priority: 'high',
          tags: ['add_impact', 'stay_relevant'],
          action: {
            type: 'update',
            targetSection: 'experiences',
            targetItemId: exp.id
          },
          isApplicable: false
        });
      }

      if (exp.bullets.length === 0) {
        suggestions.push({
          id: `exp-bullets-${exp.id}`,
          title: `Add bullet points for ${exp.title}`,
          description: `Your ${exp.title} role at ${exp.company} has no bullet points. Add 3-5 achievement-focused bullets with metrics.`,
          section: 'experiences',
          priority: 'high',
          tags: ['missing_info', 'add_impact'],
          action: {
            type: 'update',
            targetSection: 'experiences',
            targetItemId: exp.id
          },
          isApplicable: false
        });
      }
    });
  }

  // Skills section checks
  if (cvData.skills.length < 5) {
    suggestions.push({
      id: 'skills-add',
      title: 'Add More Skills',
      description: 'Include at least 8-10 relevant skills for better ATS matching. Focus on technical skills mentioned in the job description.',
      section: 'skills',
      priority: 'medium',
      tags: ['missing_info', 'ats_optimize', 'tailor_resume'],
      action: {
        type: 'add',
        targetSection: 'skills'
      },
      isApplicable: false
    });
  }

  // Job-specific suggestions
  if (jobContext && jobContext.keywords.length > 0) {
    const cvText = JSON.stringify(cvData).toLowerCase();
    const missingKeywords = jobContext.keywords.filter(
      keyword => !cvText.includes(keyword.toLowerCase())
    );

    if (missingKeywords.length > 0) {
      const keywordsToAdd = missingKeywords.slice(0, 5).join(', ');
      suggestions.push({
        id: 'keywords-missing',
        title: `Add ${missingKeywords.length} Missing Keywords`,
        description: `Your resume is missing these important keywords from the job posting: ${keywordsToAdd}${missingKeywords.length > 5 ? '...' : ''}. Click Apply to add them as skills.`,
        section: 'skills',
        priority: 'high',
        tags: ['ats_optimize', 'tailor_resume'],
        action: {
          type: 'add',
          targetSection: 'skills',
          suggestedValue: keywordsToAdd
        },
        isApplicable: true
      });
    }
  }

  // Education checks
  if (cvData.education.length === 0) {
    suggestions.push({
      id: 'edu-add',
      title: 'Add Education',
      description: 'Adding your educational background helps establish credibility and may be required by ATS systems.',
      section: 'education',
      priority: 'medium',
      tags: ['missing_info', 'ats_optimize'],
      action: {
        type: 'add',
        targetSection: 'education'
      },
      isApplicable: false
    });
  }

  // Languages checks
  if (cvData.languages.length === 0) {
    suggestions.push({
      id: 'lang-add',
      title: 'Add Languages',
      description: 'Listing your language proficiencies can be valuable, especially for international roles or companies with global presence.',
      section: 'languages',
      priority: 'low',
      tags: ['missing_info'],
      action: {
        type: 'add',
        targetSection: 'languages'
      },
      isApplicable: false
    });
  }

  // Calculate score
  let score = 0;
  if (cvData.personalInfo.firstName && cvData.personalInfo.lastName) score += 5;
  if (cvData.personalInfo.email) score += 5;
  if (cvData.personalInfo.phone) score += 10;
  if (cvData.personalInfo.location) score += 5;
  if (cvData.personalInfo.linkedin) score += 5;
  if (cvData.summary && cvData.summary.length >= 50) score += 15;
  if (cvData.experiences.length > 0) score += 20;
  if (cvData.experiences.some(e => e.bullets.length > 0)) score += 10;
  if (cvData.experiences.some(e => e.bullets.some(b => /\d+/.test(b)))) score += 10;
  if (cvData.skills.length >= 5) score += 10;
  if (cvData.education.length > 0) score += 5;

  // Generate strengths based on CV
  const strengths: string[] = [];
  if (cvData.experiences.length >= 3) {
    strengths.push('Strong work history with multiple positions');
  }
  if (cvData.experiences.some(e => e.bullets.some(b => /\d+/.test(b)))) {
    strengths.push('Quantified achievements in experience section');
  }
  if (cvData.skills.length >= 8) {
    strengths.push('Comprehensive skills section');
  }
  if (cvData.summary && cvData.summary.length >= 100) {
    strengths.push('Well-developed professional summary');
  }

  // Generate main issues
  const mainIssues: string[] = [];
  if (suggestions.filter(s => s.priority === 'high').length > 3) {
    mainIssues.push('Several high-priority improvements needed');
  }
  if (!cvData.personalInfo.phone || !cvData.personalInfo.location) {
    mainIssues.push('Contact information incomplete');
  }
  if (cvData.experiences.length > 0 && !cvData.experiences.some(e => e.bullets.some(b => /\d+/.test(b)))) {
    mainIssues.push('Experience bullets lack quantified metrics');
  }

  // Generate contextual greeting based on previous analysis
  let greeting = `Hey ${firstName}, `;
  if (previousAnalysis) {
    const scoreImprovement = score - previousAnalysis.score;
    const appliedCount = previousAnalysis.appliedSuggestionIds?.length || 0;
    
    if (appliedCount > 0 && scoreImprovement > 0) {
      greeting += `great progress! You've improved your CV by ${scoreImprovement} points (from ${previousAnalysis.score} to ${score}). `;
      if (cvData.personalInfo.phone && !previousAnalysis.previousCVSnapshot?.personalInfo.phone) {
        greeting += `I see you added your phone number - excellent! `;
      }
      if (cvData.personalInfo.linkedin && !previousAnalysis.previousCVSnapshot?.personalInfo.linkedin) {
        greeting += `Adding LinkedIn was a smart move. `;
      }
      greeting += `Let's keep building on this momentum.`;
    } else if (appliedCount > 0) {
      greeting += `I see you made some changes. Let's review what else we can improve.`;
    } else {
      greeting += `welcome back! Let's continue refining your resume.`;
    }
  } else {
    greeting += `I've analyzed your resume${jobContext ? ` for the ${jobContext.jobTitle} position at ${jobContext.company}` : ''}. ${strengths.length > 0 ? `I'm impressed by ${strengths[0].toLowerCase()}.` : 'Here are my suggestions to strengthen your application.'}`;
  }

  return {
    summary: {
      greeting,
      overallScore: Math.min(100, score),
      strengths,
      mainIssues
    },
    suggestions,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Generates the AI prompt for CV analysis
 */
export function generateCVReviewPrompt(cvData: CVData, jobContext?: JobContext): string {
  const cvJson = JSON.stringify(cvData, null, 2);
  
  return `You are an expert CV/Resume reviewer and ATS optimization specialist. Analyze the following CV and provide highly specific, actionable suggestions to improve it.

${jobContext ? `
TARGET JOB CONTEXT:
- Position: ${jobContext.jobTitle}
- Company: ${jobContext.company}
- Job Description: ${jobContext.jobDescription || 'Not provided'}
- Key Skills Required: ${jobContext.keywords.join(', ') || 'Not specified'}
- Identified Strengths: ${jobContext.strengths.join(', ') || 'None identified'}
- Identified Gaps: ${jobContext.gaps.join(', ') || 'None identified'}
` : 'No specific job target provided - analyze for general improvement.'}

CV DATA (JSON):
${cvJson}

ANALYSIS REQUIREMENTS:

1. REVIEW SUMMARY:
   - Write a personalized greeting using the candidate's first name
   - Mention 1-2 specific strengths you noticed in their CV
   - Provide an ATS compatibility score (0-100)
   - List 2-3 key strengths
   - List 2-3 main issues to address

2. SUGGESTIONS:
   For each issue found, create a suggestion with:
   - id: unique identifier (e.g., "contact-phone", "exp-metrics-1")
   - title: Short, actionable title (e.g., "Add Phone Number", "Quantify achievements at [Company]")
   - description: 2-3 sentences explaining WHY this matters and HOW to fix it
   - section: One of "contact", "about", "experiences", "education", "skills", "certifications", "projects", "languages"
   - priority: "high", "medium", or "low"
   - tags: Array from ["missing_info", "ats_optimize", "add_impact", "stay_relevant", "be_concise", "tailor_resume"]
   - action: Object with:
     - type: "add", "update", "remove", or "rewrite"
     - targetSection: Same as section
     - targetField: (optional) specific field like "phone", "summary"
     - targetItemId: (optional) ID of specific experience/education item
     - suggestedValue: (optional) The suggested text/value
     - currentValue: (optional) Current value if rewriting

PRIORITIES:
- HIGH: Missing critical info (phone, email), no summary, no metrics in experience
- MEDIUM: Missing LinkedIn, skills need expansion, summary too long/short
- LOW: Nice-to-have improvements, formatting suggestions

IMPORTANT:
- Be SPECIFIC to this CV - don't give generic advice
- Reference actual content from the CV in your suggestions
- If targeting a specific job, prioritize suggestions that align with job requirements
- Include at least 5-10 suggestions across different sections
- Provide suggested text/values where possible for "add" and "rewrite" actions

ISAPPLICABLE RULES:
- Set "isApplicable": true ONLY when you provide a meaningful "suggestedValue" that can be directly applied
- Set "isApplicable": false for personal info the AI cannot know (phone number, email, LinkedIn URL, location, portfolio URL, GitHub URL) - these are user-provided values
- Set "isApplicable": true for content improvements where you suggest actual text (summary rewrites, bullet point improvements, skill additions based on job requirements)
- Always set "isApplicable": false when "suggestedValue" is empty or not provided

Respond ONLY with valid JSON in this exact structure:
{
  "summary": {
    "greeting": "string",
    "overallScore": number,
    "strengths": ["string"],
    "mainIssues": ["string"]
  },
  "suggestions": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "section": "string",
      "priority": "string",
      "tags": ["string"],
      "action": {
        "type": "string",
        "targetSection": "string",
        "targetField": "string (optional)",
        "targetItemId": "string (optional)",
        "suggestedValue": "string (optional)",
        "currentValue": "string (optional)"
      },
      "isApplicable": boolean
    }
  ],
  "analyzedAt": "ISO timestamp"
}`;
}


import axios from 'axios';
import { toast } from 'sonner';

// For TypeScript
export interface JobPostAnalysisResult {
  keyPoints: string[];
  suggestedQuestions: string[];
  suggestedAnswers: string[];
  requiredSkills: string[];
  companyInfo?: string;
  positionDetails?: string;
  cultureFit?: string;
  error?: string;
}

/**
 * Fetches the content of a job posting from a URL
 */
export const fetchJobPostContent = async (url: string): Promise<string | null> => {
  try {
    // This would need a server-side proxy to avoid CORS issues
    const response = await axios.post('/api/fetch-job-post', { url });
    
    if (response.data.status === 'success') {
      return response.data.content;
    } else {
      toast.error('Failed to fetch job post content');
      return null;
    }
  } catch (error) {
    console.error('Error fetching job post content:', error);
    toast.error('Error fetching job post: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return null;
  }
};

/**
 * Analyzes job post content using Claude AI
 */
export const analyzeJobPostWithClaude = async (jobPostContent: string, position: string, company: string): Promise<JobPostAnalysisResult> => {
  try {
    const prompt = `
You are an expert career coach helping prepare a candidate for an interview. 
Analyze this job posting for a ${position} position at ${company} and provide comprehensive interview preparation guidance.

JOB POSTING:
"""
${jobPostContent}
"""

Based on the job post above, provide the following in JSON format:
1. Key points about the role that should be emphasized during the interview
2. Skill requirements and qualifications needed
3. Suggested interview questions the candidate might be asked
4. Recommended answers for the candidate to prepare
5. Information about the company culture and values
6. Detailed position responsibilities
7. Tips for cultural fit

Ensure your response is focused on practical, actionable advice for interview preparation.

Your response should be in this exact JSON format:
{
  "keyPoints": ["point1", "point2", ...],
  "requiredSkills": ["skill1", "skill2", ...],
  "suggestedQuestions": ["question1", "question2", ...],
  "suggestedAnswers": [
    {"question": "question1", "answer": "suggested approach to answer"},
    ...
  ],
  "companyInfo": "summary of company",
  "positionDetails": "details about the position responsibilities",
  "cultureFit": "insights about company culture and how to demonstrate fit"
}
`;

    const response = await axios.post('/api/claude', {
      prompt,
      type: 'interview-prep'
    });

    if (response.data.status === 'success') {
      return response.data.content;
    } else {
      return {
        keyPoints: ['Error analyzing job post'],
        suggestedQuestions: [],
        suggestedAnswers: [],
        requiredSkills: [],
        error: response.data.message || 'Failed to analyze job post'
      };
    }
  } catch (error) {
    console.error('Error analyzing job post with Claude:', error);
    return {
      keyPoints: ['Error analyzing job post'],
      suggestedQuestions: [],
      suggestedAnswers: [],
      requiredSkills: [],
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};

/**
 * Analyzes job post content using OpenAI
 */
export const analyzeJobPostWithGPT = async (jobPostContent: string, position: string, company: string): Promise<JobPostAnalysisResult> => {
  try {
    // Similar implementation to Claude, but using GPT endpoint
    const prompt = `
You are an expert career coach helping prepare a candidate for an interview. 
Analyze this job posting for a ${position} position at ${company} and provide comprehensive interview preparation guidance.

JOB POSTING:
"""
${jobPostContent}
"""

Based on the job post above, provide the following in JSON format:
1. Key points about the role that should be emphasized during the interview
2. Skill requirements and qualifications needed
3. Suggested interview questions the candidate might be asked
4. Recommended answers for the candidate to prepare
5. Information about the company culture and values
6. Detailed position responsibilities
7. Tips for cultural fit

Ensure your response is focused on practical, actionable advice for interview preparation.

Your response should be in this exact JSON format:
{
  "keyPoints": ["point1", "point2", ...],
  "requiredSkills": ["skill1", "skill2", ...],
  "suggestedQuestions": ["question1", "question2", ...],
  "suggestedAnswers": [
    {"question": "question1", "answer": "suggested approach to answer"},
    ...
  ],
  "companyInfo": "summary of company",
  "positionDetails": "details about the position responsibilities",
  "cultureFit": "insights about company culture and how to demonstrate fit"
}
`;

    // This would call your OpenAI endpoint
    const response = await axios.post('/api/gpt', {
      prompt,
      type: 'interview-prep'
    });

    if (response.data.status === 'success') {
      return response.data.content;
    } else {
      return {
        keyPoints: ['Error analyzing job post'],
        suggestedQuestions: [],
        suggestedAnswers: [],
        requiredSkills: [],
        error: response.data.message || 'Failed to analyze job post'
      };
    }
  } catch (error) {
    console.error('Error analyzing job post with GPT:', error);
    return {
      keyPoints: ['Error analyzing job post'],
      suggestedQuestions: [],
      suggestedAnswers: [],
      requiredSkills: [],
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};

/**
 * Main function to analyze a job post URL
 * Handles fetching content and then analyzing it
 */
export const analyzeJobPost = async (
  url: string, 
  position: string, 
  company: string,
  preferredAI: 'claude' | 'gpt' = 'claude'
): Promise<JobPostAnalysisResult> => {
  try {
    // First fetch the content from the URL
    const content = await fetchJobPostContent(url);
    
    if (!content) {
      return {
        keyPoints: ['Could not fetch job post content'],
        suggestedQuestions: [],
        suggestedAnswers: [],
        requiredSkills: [],
        error: 'Failed to fetch job post content'
      };
    }
    
    // Then analyze it with the preferred AI
    if (preferredAI === 'claude') {
      return await analyzeJobPostWithClaude(content, position, company);
    } else {
      return await analyzeJobPostWithGPT(content, position, company);
    }
  } catch (error) {
    console.error('Error in job post analysis:', error);
    return {
      keyPoints: ['Error in job post analysis'],
      suggestedQuestions: [],
      suggestedAnswers: [],
      requiredSkills: [],
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}; 
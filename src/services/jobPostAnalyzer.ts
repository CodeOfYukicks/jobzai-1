import axios from 'axios';
import { toast } from 'sonner';
import { queryPerplexity } from '../lib/perplexity';

// Answer type for structured answers
export interface AnswerItem {
  question: string;
  answer: string;
}

// For TypeScript
export interface JobPostAnalysisResult {
  keyPoints: string[];
  suggestedQuestions: string[];
  suggestedAnswers: (string | AnswerItem)[];
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
 * Analyzes job post content using Perplexity API
 */
export const analyzeJobPostWithPerplexity = async (jobPostContent: string, position: string, company: string): Promise<JobPostAnalysisResult> => {
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

Make sure the output is a valid JSON object with the exact fields described above.
`;

    // Call the Perplexity API
    const response = await queryPerplexity(prompt);
    
    if (response && response.choices && response.choices[0]?.message?.content) {
      try {
        // Extract the JSON content from the response
        const content = response.choices[0].message.content;
        
        // Find JSON content within the response
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                         content.match(/\{[\s\S]*?\}/);
                         
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
        const jsonData = JSON.parse(jsonString);
        
        // Process suggested answers to ensure they're in the correct format
        let suggestedAnswers = jsonData.suggestedAnswers || [];
        
        // Check if suggestedAnswers is an array of objects with question and answer properties
        if (Array.isArray(suggestedAnswers) && suggestedAnswers.length > 0) {
          // If the first item doesn't have an answer property, convert to the required format
          if (typeof suggestedAnswers[0] === 'string') {
            suggestedAnswers = suggestedAnswers.map((answer) => ({
              question: jsonData.suggestedQuestions[suggestedAnswers.indexOf(answer)] || 'Question',
              answer: answer
            }));
          }
        }
        
        // Ensure the result has the correct structure
        return {
          keyPoints: jsonData.keyPoints || [],
          requiredSkills: jsonData.requiredSkills || [],
          suggestedQuestions: jsonData.suggestedQuestions || [],
          suggestedAnswers: suggestedAnswers,
          companyInfo: jsonData.companyInfo || '',
          positionDetails: jsonData.positionDetails || '',
          cultureFit: jsonData.cultureFit || ''
        };
      } catch (parseError) {
        console.error('Error parsing Perplexity API response:', parseError);
        return {
          keyPoints: ['Error analyzing job post'],
          suggestedQuestions: [],
          suggestedAnswers: [],
          requiredSkills: [],
          error: 'Failed to parse Perplexity response: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
        };
      }
    } else {
      return {
        keyPoints: ['Error analyzing job post'],
        suggestedQuestions: [],
        suggestedAnswers: [],
        requiredSkills: [],
        error: 'Invalid response from Perplexity API'
      };
    }
  } catch (error) {
    console.error('Error analyzing job post with Perplexity:', error);
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
 * Now directly sends the URL to the AI without fetching content separately
 */
export const analyzeJobPost = async (
  url: string, 
  position: string, 
  company: string,
  preferredAI: 'claude' | 'gpt' | 'perplexity' = 'perplexity'
): Promise<JobPostAnalysisResult> => {
  try {
    // If using Perplexity, we'll send the URL directly instead of fetching content
    if (preferredAI === 'perplexity') {
      return await analyzeJobUrlWithPerplexity(url, position, company);
    } else {
      // For other AIs, we still need to fetch content first
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
      
      if (preferredAI === 'claude') {
        return await analyzeJobPostWithClaude(content, position, company);
      } else {
        return await analyzeJobPostWithGPT(content, position, company);
      }
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

/**
 * Analyzes a job post URL directly using Perplexity API
 * This bypasses content fetching and lets Perplexity handle it
 */
export const analyzeJobUrlWithPerplexity = async (jobPostUrl: string, position: string, company: string): Promise<JobPostAnalysisResult> => {
  try {
    const prompt = `
You are an expert career coach helping prepare a candidate for an interview. 
Visit this job posting URL for a ${position} position at ${company} and provide comprehensive interview preparation guidance:

URL: ${jobPostUrl}

Based on the job posting, provide the following in JSON format:
1. Key points about the role that should be emphasized during the interview
2. Skill requirements and qualifications needed
3. Suggested interview questions the candidate might be asked
4. Recommended answers for the candidate to prepare
5. Information about the company culture and values
6. Detailed position responsibilities
7. Tips for cultural fit

If you can't access the URL, just analyze based on the position and company name.

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

Make sure the output is a valid JSON object with the exact fields described above.
`;

    // Call the Perplexity API
    const response = await queryPerplexity(prompt);
    
    if (response && response.choices && response.choices[0]?.message?.content) {
      try {
        // Extract the JSON content from the response
        const content = response.choices[0].message.content;
        
        // Find JSON content within the response
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                         content.match(/\{[\s\S]*?\}/);
                         
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
        const jsonData = JSON.parse(jsonString);
        
        // Process suggested answers to ensure they're in the correct format
        let suggestedAnswers = jsonData.suggestedAnswers || [];
        
        // Check if suggestedAnswers is an array of objects with question and answer properties
        if (Array.isArray(suggestedAnswers) && suggestedAnswers.length > 0) {
          // If the first item doesn't have an answer property, convert to the required format
          if (typeof suggestedAnswers[0] === 'string') {
            suggestedAnswers = suggestedAnswers.map((answer) => ({
              question: jsonData.suggestedQuestions[suggestedAnswers.indexOf(answer)] || 'Question',
              answer: answer
            }));
          }
        }
        
        // Ensure the result has the correct structure
        return {
          keyPoints: jsonData.keyPoints || [],
          requiredSkills: jsonData.requiredSkills || [],
          suggestedQuestions: jsonData.suggestedQuestions || [],
          suggestedAnswers: suggestedAnswers,
          companyInfo: jsonData.companyInfo || '',
          positionDetails: jsonData.positionDetails || '',
          cultureFit: jsonData.cultureFit || ''
        };
      } catch (parseError) {
        console.error('Error parsing Perplexity API response:', parseError);
        return {
          keyPoints: ['Error analyzing job post'],
          suggestedQuestions: [],
          suggestedAnswers: [],
          requiredSkills: [],
          error: 'Failed to parse Perplexity response: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
        };
      }
    } else {
      return {
        keyPoints: ['Error analyzing job post'],
        suggestedQuestions: [],
        suggestedAnswers: [],
        requiredSkills: [],
        error: 'Invalid response from Perplexity API'
      };
    }
  } catch (error) {
    console.error('Error analyzing job post with Perplexity:', error);
    return {
      keyPoints: ['Error analyzing job post'],
      suggestedQuestions: [],
      suggestedAnswers: [],
      requiredSkills: [],
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}; 
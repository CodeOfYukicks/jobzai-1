import { getOpenAIInstance } from './openai';
import { UserData } from '../types';
import { storage } from './firebase';
import { ref, getDownloadURL, getBlob } from 'firebase/storage';

export interface CVAnalysis {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  lastAnalyzed: Date;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retry<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

async function fetchCVContent(cvUrl: string): Promise<string> {
  const cvRef = ref(storage, cvUrl);
  
  try {
    // First try to get the download URL with retries
    const downloadUrl = await retry(() => getDownloadURL(cvRef));
    
    // Then try to get the blob with retries
    const cvBlob = await retry(() => getBlob(cvRef));
    
    // Convert blob to text
    const cvText = await cvBlob.text();
    
    if (!cvText.trim()) {
      throw new Error('CV content is empty');
    }
    
    return cvText;
  } catch (error: any) {
    console.error('Error fetching CV:', error);
    
    if (error?.code === 'storage/object-not-found') {
      throw new Error('CV file not found. Please try uploading it again.');
    }
    if (error?.code === 'storage/unauthorized') {
      throw new Error('You do not have permission to access this CV.');
    }
    if (error?.code === 'storage/retry-limit-exceeded') {
      throw new Error('Network issue while accessing CV. Please try again.');
    }
    
    throw new Error('Failed to access CV file. Please try again later.');
  }
}

export async function analyzeCVWithGPT(cvUrl: string, userData: UserData): Promise<CVAnalysis> {
  try {
    const openai = await getOpenAIInstance();
    
    // Get CV content with retry logic
    const cvText = await fetchCVContent(cvUrl);

    const prompt = `Analyze this CV/resume for a ${userData.jobPreferences || 'job seeker'} in the ${userData.industry || 'general'} industry.

Please provide a structured analysis with:
1. Key strengths and positive aspects
2. Areas that could be improved
3. Specific, actionable recommendations

Format the response as a JSON object with these arrays:
{
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}

Keep each point concise and actionable.

CV Content:
${cvText}`;

    const completion = await retry(() => openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert CV/resume analyst with deep knowledge of industry best practices and hiring trends."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }));

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty analysis');
    }

    try {
      const analysis = JSON.parse(content);
      
      // Validate the response structure
      if (!analysis.strengths || !analysis.improvements || !analysis.recommendations) {
        throw new Error('Invalid analysis format');
      }

      return {
        ...analysis,
        lastAnalyzed: new Date()
      };
    } catch (parseError) {
      throw new Error(`Failed to parse analysis: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error analyzing CV:', error instanceof Error ? error.message : 'Unknown error');
    throw error instanceof Error ? error : new Error('Failed to analyze CV');
  }
}
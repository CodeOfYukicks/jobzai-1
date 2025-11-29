import { getOpenAIInstance } from './openai';
import { UserData } from '../types';
import { storage } from './firebase';
import { ref, getDownloadURL } from 'firebase/storage';

async function analyzePDFWithVision(cvUrl: string): Promise<string> {
  try {
    const openai = await getOpenAIInstance();
    const downloadURL = await getDownloadURL(ref(storage, cvUrl));

    const response = await openai.chat.completions.create({
      model: "gpt-5.1", // Updated from gpt-4-vision-preview (Nov 2025)
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this CV and provide a detailed summary of the candidate's profile, including key skills, experience, and education. Focus on elements that are relevant for job applications." 
            },
            {
              type: "image_url",
              image_url: {
                url: downloadURL,
                detail: "high"
              }
            }
          ],
        },
      ],
      max_tokens: 4096,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error analyzing PDF with Vision:', error);
    return '';
  }
}

export interface InsightData {
  title: string;
  description: string;
  tips: string[];
  metrics?: {
    label: string;
    value: string;
  }[];
}

export async function generatePersonalizedInsights(
  category: 'timing' | 'salary' | 'keywords' | 'companies' | 'cv' | 'network',
  userData: UserData
): Promise<InsightData> {
  try {
    console.log('Starting insights generation for:', category);
    console.log('User data:', userData);

    if (!userData || !userData.firstName || !userData.lastName) {
      throw new Error('Incomplete user data');
    }

    // Pour l'analyse CV, utiliser GPT-4 Vision
    let cvAnalysis = '';
    if (category === 'cv' && userData.cvUrl) {
      cvAnalysis = await analyzePDFWithVision(userData.cvUrl);
    }

    const userContext = `
      Personal Information:
      - Name: ${userData.firstName} ${userData.lastName}
      - Location: ${userData.location || 'Not specified'}
      - Gender: ${userData.gender || 'Not specified'}
      
      Professional Context:
      - Contract Type: ${userData.contractType || 'Not specified'}
      - Professional Motivation: ${userData.motivation || 'Not specified'}
      - Industry: ${userData.industry || 'Not specified'}
      
      ${category === 'cv' ? `CV Analysis:\n${cvAnalysis}` : ''}`;

    // D├®placer les prompts ici pour avoir acc├¿s au userContext
    const prompts = {
      timing: `Based on this job seeker's profile:
${userContext}

Analyze the optimal application timing and provide insights in this exact JSON format:
{
  "title": "Application Timing Analysis",
  "description": "Personalized recommendations for when to apply to maximize your chances",
  "tips": [
    "specific actionable tip 1",
    "specific actionable tip 2",
    "specific actionable tip 3",
    "specific actionable tip 4",
    "specific actionable tip 5"
  ],
  "metrics": [
    {"label": "Best Days", "value": "specific days"},
    {"label": "Peak Hours", "value": "specific hours"},
    {"label": "Response Rate", "value": "expected %"},
    {"label": "Competition Level", "value": "analysis"}
  ]
}`,

      salary: `Based on this job seeker's profile:
${userContext}

Analyze salary expectations and provide insights in this exact JSON format:
{
  "title": "Salary Insights",
  "description": "Market-based salary analysis for your profile and target roles",
  "tips": [
    "specific negotiation tip 1",
    "specific negotiation tip 2",
    "specific negotiation tip 3",
    "specific negotiation tip 4",
    "specific negotiation tip 5"
  ],
  "metrics": [
    {"label": "Salary Range", "value": "specific range"},
    {"label": "Market Average", "value": "specific amount"},
    {"label": "YoY Growth", "value": "specific %"},
    {"label": "Benefits Value", "value": "analysis"}
  ]
}`,

      keywords: `Based on this job seeker's profile:
${userContext}

Analyze optimal keywords and provide insights in this exact JSON format:
{
  "title": "Keywords Optimization",
  "description": "Strategic keyword recommendations to improve your job search visibility",
  "tips": [
    "specific keyword tip 1",
    "specific keyword tip 2",
    "specific keyword tip 3",
    "specific keyword tip 4",
    "specific keyword tip 5"
  ],
  "metrics": [
    {"label": "Missing Keywords", "value": "specific number"},
    {"label": "ATS Score", "value": "specific %"},
    {"label": "Skills Gap", "value": "specific number"},
    {"label": "Industry Match", "value": "analysis"}
  ]
}`,

      companies: `Based on this job seeker's profile:
${userContext}

Analyze target companies and provide insights in this exact JSON format:
{
  "title": "Target Companies Analysis",
  "description": "Personalized company recommendations based on your profile",
  "tips": [
    "specific company targeting tip 1",
    "specific company targeting tip 2",
    "specific company targeting tip 3",
    "specific company targeting tip 4",
    "specific company targeting tip 5"
  ],
  "metrics": [
    {"label": "Matched Companies", "value": "150+"},
    {"label": "Industry Fit", "value": "specific %"},
    {"label": "Culture Match", "value": "analysis"},
    {"label": "Growth Potential", "value": "analysis"}
  ]
}`,

      cv: `Based on this detailed job seeker's profile and CV content:
${userContext}

Analyze the CV content and provide detailed recommendations in this exact JSON format:
{
  "title": "CV Analysis & Recommendations",
  "description": "Detailed analysis of your CV with personalized improvement suggestions",
  "tips": [
    "specific improvement tip 1",
    "specific improvement tip 2",
    "specific improvement tip 3",
    "specific improvement tip 4",
    "specific improvement tip 5"
  ],
  "metrics": [
    {"label": "CV Score", "value": "specific %"},
    {"label": "Key Strengths", "value": "top 3 strengths"},
    {"label": "Areas to Improve", "value": "main areas"},
    {"label": "ATS Compatibility", "value": "specific %"}
  ]
}`,

      network: `Based on this job seeker's profile:
${userContext}

Analyze networking opportunities and provide insights in this exact JSON format:
{
  "title": "Network Analysis",
  "description": "Strategic networking recommendations to expand your professional reach",
  "tips": [
    "specific networking tip 1",
    "specific networking tip 2",
    "specific networking tip 3",
    "specific networking tip 4",
    "specific networking tip 5"
  ],
  "metrics": [
    {"label": "Connection Score", "value": "720"},
    {"label": "Industry Reach", "value": "65%"},
    {"label": "Growth Potential", "value": "High"},
    {"label": "Key Contacts", "value": "25+"}
  ]
}`
    };

    const openai = await getOpenAIInstance();
    
    // Ajouter un d├®lai et une nouvelle tentative
    const makeRequest = async (retries = 3, delay = 2000, timeout = 30000) => {
      console.log('Making OpenAI request, attempt 1 of', retries);
      
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`Attempt ${i + 1}: Sending request to OpenAI`);
          const completion = await openai.chat.completions.create({
            model: "gpt-5.1", // Updated from gpt-3.5-turbo (Nov 2025)
            messages: [
              {
                role: "system",
                content: "You are an expert career advisor. Always respond with valid JSON matching the exact format requested."
              },
              {
                role: "user",
                content: `${prompts[category]}\n\nIMPORTANT: Respond ONLY with valid JSON matching the exact format shown above.`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.5,
            reasoning_effort: "medium", // GPT-5.1 feature for recommendations
            max_tokens: 1000
          });

          console.log('OpenAI response received:', completion.choices[0]?.message?.content);
          return completion;
        } catch (error: any) {
          console.error(`Attempt ${i + 1} failed:`, error);
          if (error?.response?.status === 429 && i < retries - 1) {
            console.log(`Rate limit hit, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          if (error?.response?.status === 400) {
            throw new Error('Invalid request to OpenAI API');
          }
          if (error?.response?.status === 401) {
            throw new Error('Invalid OpenAI API key');
          }
          throw error;
        }
      }
      throw new Error('Max retries reached');
    };

    const completion = await makeRequest();

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty insights');
    }

    try {
      const insights = JSON.parse(content);
      
      // Validate the response structure
      if (!insights.title || !insights.description || !insights.tips) {
        throw new Error('Invalid insights format');
      }

      return insights;
    } catch (parseError: unknown) {
      if (parseError instanceof Error) {
        throw new Error(`Failed to parse insights: ${parseError.message}`);
      }
      throw new Error('Failed to parse insights: Unknown error');
    }
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
}

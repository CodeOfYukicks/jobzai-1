import { getOpenAIInstance } from './openai';
import { UserData } from '../types';

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
  category: 'timing' | 'salary' | 'keywords' | 'companies',
  userData: UserData
): Promise<InsightData> {
  try {
    const openai = await getOpenAIInstance();

    const userContext = `
      Job Preferences: ${userData.jobPreferences || 'Not specified'}
      Industry: ${userData.industry || 'Not specified'}
      Has CV: ${userData.cvUrl ? 'Yes' : 'No'}
    `;

    const prompts = {
      timing: `Based on this job seeker's profile:
      ${userContext}
      
      Generate personalized application timing insights in JSON format with:
      {
        "title": "Application Timing Strategy",
        "description": "A brief overview of timing recommendations",
        "tips": ["specific tip 1", "specific tip 2", ...],
        "metrics": [
          {"label": "Best Time", "value": "specific time"},
          {"label": "Peak Season", "value": "specific season"},
          {"label": "Response Rate", "value": "specific rate"}
        ]
      }`,

      salary: `Based on this job seeker's profile:
      ${userContext}
      
      Generate personalized salary insights in JSON format with:
      {
        "title": "Salary Insights",
        "description": "A brief overview of compensation trends",
        "tips": ["specific tip 1", "specific tip 2", ...],
        "metrics": [
          {"label": "Salary Range", "value": "specific range"},
          {"label": "Market Average", "value": "specific amount"},
          {"label": "YoY Growth", "value": "specific percentage"}
        ]
      }`,

      keywords: `Based on this job seeker's profile:
      ${userContext}
      
      Generate personalized keyword optimization insights in JSON format with:
      {
        "title": "Keyword Strategy",
        "description": "A brief overview of keyword optimization",
        "tips": ["specific tip 1", "specific tip 2", ...],
        "metrics": [
          {"label": "Missing Keywords", "value": "specific number"},
          {"label": "ATS Score", "value": "specific score"},
          {"label": "Skills Gap", "value": "specific number"}
        ]
      }`,

      companies: `Based on this job seeker's profile:
      ${userContext}
      
      Generate personalized company targeting insights in JSON format with:
      {
        "title": "Target Companies",
        "description": "A brief overview of company recommendations",
        "tips": ["specific tip 1", "specific tip 2", ...],
        "metrics": [
          {"label": "Matched Companies", "value": "specific number"},
          {"label": "Culture Fit", "value": "specific score"},
          {"label": "Growth Potential", "value": "specific rating"}
        ]
      }`
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert career advisor specializing in personalized job search optimization. Always return responses in valid JSON format."
        },
        {
          role: "user",
          content: prompts[category]
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

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
    } catch (parseError) {
      throw new Error(`Failed to parse insights: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error generating insights:', error instanceof Error ? error.message : 'Unknown error');
    throw error instanceof Error ? error : new Error('Failed to generate insights');
  }
}
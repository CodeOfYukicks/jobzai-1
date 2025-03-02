import { UserData } from '../types';
import axios from 'axios';

export type RecommendationType = 'target-companies' | 'application-timing' | 'salary-insights' | 'job-strategy' | 'interview-prep';

interface ClaudeRecommendationRequest {
  prompt: string;
  type: RecommendationType;
  cvContent?: string | null;
}

interface ClaudeRecommendationResponse {
  content: any;
  status: 'success' | 'error';
  message?: string;
}

// Function to get Claude recommendation
export const getClaudeRecommendation = async (prompt: string, type: RecommendationType, cvContent: string | null = null) => {
  try {
    console.log(`Sending request to Claude API for ${type} recommendation`);
    
    const response = await axios.post('/api/claude', {
      prompt,
      type,
      cvContent
    });
    
    if (response.data.status === 'success') {
      return {
        data: response.data.content,
        error: null
      };
    } else {
      return {
        data: null,
        error: response.data.message || 'Unknown error'
      };
    }
  } catch (error) {
    console.error('Error getting Claude recommendation:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};

// Function to generate prompt
export const generatePrompt = (type: RecommendationType, userData: any): string => {
  
  // Helper function to format profile data as readable text
  const formatProfile = (userData: any): string => {
    if (!userData) return "No profile data available.";
    
    const details = userData.profile_details || {};
    const expertise = details.expertise || {};
    const objectives = details.objectives || {};
    const preferences = details.preferences || {};
    
    let profile = `
User Profile Summary:
- Name: ${userData.firstName || ''} ${userData.lastName || ''}
- Current Position: ${expertise.currentPosition || 'Not specified'}
- Experience Level: ${userData.experience_level || 'Not specified'}
- Years of Experience: ${expertise.yearsOfExperience || 'Not specified'}
- Target Position: ${objectives.targetPosition || 'Not specified'}
- Location: ${userData.location || 'Not specified'}
- Willing to Relocate: ${details.mobility?.willingToRelocate ? 'Yes' : 'No'}
- Work Preference: ${details.mobility?.workPreference || 'Not specified'}
- Contract Type: ${userData.contractType || 'Not specified'}

Skills & Expertise:
${expertise.skills && expertise.skills.length > 0 ? 
  '- Skills: ' + expertise.skills.join(', ') : 
  '- Skills: Not specified'}
${expertise.tools && expertise.tools.length > 0 ? 
  '- Tools & Technologies: ' + expertise.tools.join(', ') : 
  '- Tools & Technologies: Not specified'}

Career Objectives:
- Target Position: ${objectives.targetPosition || 'Not specified'}
${objectives.targetSectors && objectives.targetSectors.length > 0 ? 
  '- Target Sectors: ' + objectives.targetSectors.join(', ') : 
  '- Target Sectors: Not specified'}
- Salary Expectations: ${objectives.salaryExpectations?.min || ''} - ${objectives.salaryExpectations?.max || ''} ${objectives.salaryExpectations?.currency || 'EUR'}
- Availability: ${objectives.availabilityDate || 'Not specified'}

Work Preferences:
- Work-Life Balance Importance: ${preferences.workLifeBalance || 'Not specified'}/10
- Preferred Company Culture: ${preferences.companyCulture || 'Not specified'}
- Preferred Company Size: ${preferences.preferredCompanySize || 'Not specified'}
${preferences.sectorsToAvoid && preferences.sectorsToAvoid.length > 0 ? 
  '- Sectors to Avoid: ' + preferences.sectorsToAvoid.join(', ') : 
  '- Sectors to Avoid: Not specified'}
`;
    
    return profile;
  };

  // Format basic job market data
  const jobMarket = `
Current Job Market Context:
- Economic conditions are fluctuating, with varying levels of uncertainty across sectors.
- Digital skills are in high demand, especially in technology, healthcare, and financial services.
- Remote and hybrid work models have become increasingly prevalent and accepted.
- Companies are emphasizing diversity, equity, and inclusion in their hiring practices.
- AI integration and automation are transforming traditional roles and creating new opportunities.
- Soft skills such as adaptability, communication, and emotional intelligence are highly valued.
`;

  // Base prompts for each recommendation type
  switch (type) {
    case 'target-companies':
      return `You are an expert career coach specializing in company recommendations.
${formatProfile(userData)}
${jobMarket}

Based on the user's profile, skills, and preferences provided above, please recommend 5-6 companies that would be a good match for them.

For each company, include:
- Company name
- Match percentage (0-100%)
- Growth potential (Low/Medium/High)
- Size (number of employees if available)
- Industry
- Location
- 2-3 suitable roles at this company for the user
- A brief explanation of why this company is a good match based on the user's profile

Also include a brief summary paragraph addressing the user directly, explaining your recommendations.

Format your response as a JSON object with a "companies" array containing the company recommendations and a "summary" string with your summary paragraph. Follow this exact format:

{
  "companies": [
    {
      "name": "",
      "match": "",
      "growth_potential": "",
      "size": "",
      "industry": "",
      "location": "",
      "suitable_roles": ["", "", ""],
      "why_match": ""
    }
  ],
  "summary": ""
}`;

    case 'application-timing':
      return `You are an expert career coach specializing in job application strategies.
${formatProfile(userData)}
${jobMarket}

Based on the user's profile and the current job market context, please provide tailored recommendations on the optimal timing for their job applications.

Include the following in your analysis:
- Best days of the week to apply for jobs in their field
- Best times of day to submit applications
- Best months or seasons for job hunting in their industry
- Best quarter of the year for opportunities
- How quickly to apply after a job is posted
- Appropriate timing for follow-ups after submitting applications
- 3-5 specific insights about application timing relevant to the user's field and experience level
- A brief explanation of why these timing recommendations are appropriate for this user

Format your response as a JSON object with a "timing" object containing your recommendations. Follow this exact format:

{
  "timing": {
    "best_days": [""],
    "best_times": "",
    "best_months": [""],
    "best_quarter": "",
    "application_window": "",
    "follow_up_timing": "",
    "insights": ["", "", ""],
    "explanation": ""
  }
}`;

    case 'salary-insights':
      return `You are an expert career coach specializing in salary negotiation and compensation.
${formatProfile(userData)}
${jobMarket}

Based on the user's profile and the current job market context, please provide tailored salary insights to help them understand their market value and negotiate effectively.

Include the following in your analysis:
- Appropriate salary range for someone with their skills and experience level
- Average salary for their target position in their location/region
- Salary breakdown by experience level (entry, mid, senior) in their field
- Expected salary growth rate in their industry
- 4 specific negotiation tips tailored to their profile and industry
- 5 valuable benefits or perks they should consider beyond base salary
- Brief context about the current salary trends in their industry and how it affects their position

Format your response as a JSON object with a "salary" object containing your recommendations. Follow this exact format:

{
  "salary": {
    "range": "",
    "average": "",
    "entry_level": "",
    "mid_level": "",
    "senior_level": "",
    "growth": "",
    "negotiation_tips": ["", "", "", ""],
    "benefits": ["", "", "", "", ""],
    "market_context": ""
  }
}`;

    case 'job-strategy':
      return `You are an expert career coach specializing in job search strategy.
${formatProfile(userData)}
${jobMarket}

Based on the user's profile, skills, and the current job market context, please provide a comprehensive job search strategy to help them secure their target position.

Include the following in your analysis:
- 5 key skills from their profile they should highlight, with reasons why each is valuable in the current market
- 3 skills they could develop to increase their marketability, with reasons and suggested resources
- Assessment of their resume's likely performance with Applicant Tracking Systems (ATS) and tips for optimization
- Networking strategy tailored to their field, including 3 specific professional groups or communities they should consider joining
- Application strategy to maximize their chances of getting interviews

Format your response as a JSON object with a "strategy" object containing your recommendations. Follow this exact format:

{
  "strategy": {
    "highlight_skills": [
      {
        "skill": "",
        "reason": ""
      }
    ],
    "develop_skills": [
      {
        "skill": "",
        "reason": "",
        "resource": ""
      }
    ],
    "ats_optimization": {
      "score": "",
      "resume_tips": ["", "", ""]
    },
    "networking": {
      "strategy": "",
      "target_groups": [
        {
          "name": "",
          "value": ""
        }
      ],
      "events": ["", ""]
    },
    "application_strategy": {
      "approach": "",
      "optimization_tips": ["", "", ""]
    }
  }
}`;

    default:
      return '';
  }
};

// Function to fetch CV text from URL
export const fetchCVText = async (cvUrl: string): Promise<string | null> => {
  try {
    console.log("CV URL detected:", cvUrl);
    const response = await axios.get(`/api/fetch-cv?url=${encodeURIComponent(cvUrl)}`);
    
    if (response.data && response.data.status === 'success') {
      return response.data.content;
    } else {
      console.error("Error fetching CV content:", response.data?.message || "Unknown error");
      return null;
    }
  } catch (error) {
    console.error("Error fetching CV content:", error);
    return null;
  }
}; 
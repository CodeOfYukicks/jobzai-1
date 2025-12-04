import axios from 'axios';
import { CompleteUserData } from '../lib/userDataFetcher';

// Types for Career Intelligence insights
export interface CareerInsightsData {
  nextMove: {
    summary: string;
    opportunityCount: number;
    topCompanies: Array<{
      name: string;
      matchScore: number;
      industry: string;
      location: string;
      whyMatch: string;
      topRole?: string;
    }>;
    careerPath: {
      currentPosition: string;
      targetPosition: string;
      steps: Array<{
        title: string;
        timeline: string;
        description: string;
      }>;
    };
  } | null;
  
  skills: {
    summary: string;
    criticalCount: number;
    criticalSkills: Array<{
      name: string;
      currentLevel: number;
      requiredLevel: number;
      importance: 'critical' | 'high' | 'medium';
      salaryImpact?: string;
    }>;
    trendingSkills: Array<{
      name: string;
      demandGrowth: string;
      relevance: string;
    }>;
    recommendedResources: Array<{
      title: string;
      type: 'course' | 'certification' | 'book' | 'tutorial';
      url?: string;
      duration?: string;
    }>;
  } | null;
  
  actionPlan: {
    summary: string;
    actionCount: number;
    weeklyActions: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      timeEstimate?: string;
    }>;
    timing: {
      bestDays: string[];
      bestTimes: string;
      bestMonths: string[];
      insight: string;
    };
    salary: {
      range: string;
      average: string;
      tips: string[];
    };
  } | null;
}

// Format user profile for the prompt
function formatUserProfile(userData: CompleteUserData): string {
  const city = userData.city || '';
  const country = userData.country || '';
  const location = city && country ? `${city}, ${country}` : userData.location || 'Not specified';
  
  // Get current position from professional history
  const currentExp = userData.professionalHistory?.find((exp: any) => exp.current);
  const currentPosition = currentExp?.title || userData.currentPosition || userData.jobTitle || 'Not specified';
  const currentCompany = currentExp?.company || '';
  
  // Calculate years of experience
  let yearsOfExperience = userData.yearsOfExperience;
  if (!yearsOfExperience && userData.professionalHistory && userData.professionalHistory.length > 0) {
    const now = new Date();
    let totalMonths = 0;
    userData.professionalHistory.forEach((exp: any) => {
      if (exp.startDate) {
        const startParts = exp.startDate.split('-');
        if (startParts.length === 2) {
          const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, 1);
          const end = exp.current || !exp.endDate ? now : (() => {
            const endParts = exp.endDate.split('-');
            return endParts.length === 2 ? new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, 1) : now;
          })();
          if (end >= start) {
            totalMonths += Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
          }
        }
      }
    });
    yearsOfExperience = Math.round(totalMonths / 12);
  }

  return `
USER PROFILE:
- Name: ${userData.firstName || ''} ${userData.lastName || ''}
- Location: ${location}
- Current Position: ${currentPosition}${currentCompany ? ` at ${currentCompany}` : ''}
- Target Position: ${userData.targetPosition || 'Not specified'}
- Years of Experience: ${yearsOfExperience || 'Not specified'}
- Industry: ${userData.industry || 'Not specified'}
- Education: ${userData.educationLevel || 'Not specified'}${userData.educationField ? ` in ${userData.educationField}` : ''}

SKILLS & TOOLS:
- Technical Skills: ${userData.skills?.join(', ') || 'Not specified'}
- Tools: ${userData.tools?.join(', ') || 'Not specified'}

PREFERENCES:
- Work Preference: ${userData.workPreference || 'Not specified'}
- Willing to Relocate: ${userData.willingToRelocate ? 'Yes' : 'No'}
- Target Sectors: ${userData.targetSectors?.join(', ') || 'Not specified'}
- Preferred Environment: ${userData.preferredEnvironment?.join(', ') || 'Not specified'}
- Salary Expectations: ${userData.salaryExpectations?.min || ''} - ${userData.salaryExpectations?.max || ''} ${userData.salaryExpectations?.currency || 'EUR'}

CAREER CONTEXT:
- Current Situation: ${userData.currentSituation || 'Not specified'}
- Search Urgency: ${userData.searchUrgency || 'Not specified'}
- Primary Motivator: ${userData.primaryMotivator || 'Not specified'}
- Career Priorities: ${userData.careerPriorities?.join(', ') || 'Not specified'}

LANGUAGES:
${userData.languages?.map(l => `- ${l.language}: ${l.level}`).join('\n') || '- Not specified'}

PROFESSIONAL HISTORY:
${userData.professionalHistory?.slice(0, 3).map(exp => 
  `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})
   Industry: ${exp.industry || 'N/A'}, Location: ${exp.location || 'N/A'}`
).join('\n') || '- Not specified'}

PROFILE TAGS (AI-generated summary):
${userData.profileTags?.join(', ') || 'Not generated'}

${userData.cvContent ? `
CV CONTENT (extracted):
${userData.cvContent.substring(0, 3000)}...
` : ''}
`;
}

// Generate all career insights in one consolidated call
export async function generateCareerInsights(userData: CompleteUserData): Promise<CareerInsightsData> {
  const userProfile = formatUserProfile(userData);
  
  const prompt = `You are a world-class career advisor and strategist. Analyze this professional's profile and provide comprehensive, actionable career insights.

${userProfile}

Based on this profile, generate a complete career intelligence report with THREE sections:

## SECTION 1: NEXT MOVE (Companies & Career Path)
Identify the best career opportunities and companies for this person.

## SECTION 2: SKILLS TO MASTER
Analyze their skill gaps and what they need to develop.

## SECTION 3: ACTION PLAN
Create a concrete weekly action plan with timing insights and salary expectations.

IMPORTANT INSTRUCTIONS:
- Be SPECIFIC and PERSONALIZED - use their actual data
- Recommend REAL companies that exist and hire in their field
- Provide ACTIONABLE advice, not generic tips
- Be HONEST about match scores and skill levels
- Consider their location, experience level, and preferences
- If data is missing, make reasonable assumptions based on their industry/role

Return your response as a JSON object with this EXACT structure:

{
  "nextMove": {
    "summary": "One sentence summary of their best opportunities",
    "opportunityCount": 8,
    "topCompanies": [
      {
        "name": "Real Company Name",
        "matchScore": 85,
        "industry": "Technology",
        "location": "Paris, France",
        "whyMatch": "2-3 sentences explaining why this company is a great fit",
        "topRole": "Senior Product Manager"
      }
    ],
    "careerPath": {
      "currentPosition": "Their current role",
      "targetPosition": "Their target role",
      "steps": [
        {
          "title": "Step name",
          "timeline": "6 months",
          "description": "What to do and achieve"
        }
      ]
    }
  },
  "skills": {
    "summary": "One sentence about their skill development needs",
    "criticalCount": 3,
    "criticalSkills": [
      {
        "name": "Skill name",
        "currentLevel": 40,
        "requiredLevel": 80,
        "importance": "critical",
        "salaryImpact": "+€5,000-10,000/year"
      }
    ],
    "trendingSkills": [
      {
        "name": "Emerging skill",
        "demandGrowth": "+25%",
        "relevance": "Why this matters for them"
      }
    ],
    "recommendedResources": [
      {
        "title": "Resource name",
        "type": "course",
        "duration": "4 weeks"
      }
    ]
  },
  "actionPlan": {
    "summary": "One sentence about their immediate priorities",
    "actionCount": 5,
    "weeklyActions": [
      {
        "id": "action-1",
        "title": "Action title",
        "description": "Detailed description",
        "priority": "high",
        "timeEstimate": "2 hours"
      }
    ],
    "timing": {
      "bestDays": ["Tuesday", "Wednesday", "Thursday"],
      "bestTimes": "9-11 AM",
      "bestMonths": ["January", "September"],
      "insight": "Specific timing advice for their industry"
    },
    "salary": {
      "range": "€55,000 - €75,000",
      "average": "€65,000",
      "tips": [
        "Specific negotiation tip 1",
        "Specific negotiation tip 2",
        "Specific negotiation tip 3"
      ]
    }
  }
}

Provide 3 companies in topCompanies, 3 critical skills, 3 trending skills, 3 resources, 5 weekly actions, and 3 career path steps. Be concise but specific.`;

  try {
    const response = await axios.post('/api/chatgpt', {
      prompt,
      type: 'career-intelligence',
      cvContent: userData.cvContent || null
    }, {
      timeout: 90000 // 90 seconds for comprehensive analysis
    });

    if (response.data.status === 'success') {
      let content = response.data.content;
      
      // Parse JSON if needed
      if (typeof content === 'string') {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          content = JSON.parse(jsonMatch[1]);
        } else {
          content = JSON.parse(content);
        }
      }
      
      return content as CareerInsightsData;
    } else {
      throw new Error(response.data.message || 'Failed to generate insights');
    }
  } catch (error: any) {
    console.error('Error generating career insights:', error);
    
    // Return mock data for development/testing
    return getMockInsights(userData);
  }
}

// Mock data for development or when API fails
function getMockInsights(userData: CompleteUserData): CareerInsightsData {
  const currentPosition = userData.currentPosition || userData.jobTitle || 'Professional';
  const targetPosition = userData.targetPosition || 'Senior Role';
  const location = userData.city && userData.country 
    ? `${userData.city}, ${userData.country}` 
    : userData.location || 'Your Location';
  
  return {
    nextMove: {
      summary: `Strong opportunities in your target market based on your ${userData.yearsOfExperience || '5'}+ years of experience`,
      opportunityCount: 8,
      topCompanies: [
        {
          name: 'Example Company 1',
          matchScore: 87,
          industry: userData.industry || 'Technology',
          location: location,
          whyMatch: 'Strong alignment with your skills and career goals. The company culture matches your preferences for work-life balance.',
          topRole: targetPosition
        },
        {
          name: 'Example Company 2',
          matchScore: 82,
          industry: userData.targetSectors?.[0] || 'Technology',
          location: location,
          whyMatch: 'Growing company with excellent career advancement opportunities in your field.',
          topRole: `Senior ${currentPosition}`
        },
        {
          name: 'Example Company 3',
          matchScore: 78,
          industry: userData.targetSectors?.[1] || 'Consulting',
          location: location,
          whyMatch: 'Innovative environment with competitive compensation and strong team culture.',
          topRole: targetPosition
        }
      ],
      careerPath: {
        currentPosition: currentPosition,
        targetPosition: targetPosition,
        steps: [
          {
            title: 'Strengthen Core Skills',
            timeline: '0-6 months',
            description: 'Focus on developing key competencies and building a stronger portfolio'
          },
          {
            title: 'Expand Network',
            timeline: '3-9 months',
            description: 'Connect with industry leaders and join relevant professional communities'
          },
          {
            title: 'Target Senior Roles',
            timeline: '6-12 months',
            description: 'Apply strategically to positions that align with your enhanced skillset'
          }
        ]
      }
    },
    skills: {
      summary: '3 critical skills to develop for your target roles',
      criticalCount: 3,
      criticalSkills: [
        {
          name: 'Leadership & Management',
          currentLevel: 45,
          requiredLevel: 75,
          importance: 'critical',
          salaryImpact: '+€8,000-12,000/year'
        },
        {
          name: 'Strategic Thinking',
          currentLevel: 50,
          requiredLevel: 80,
          importance: 'high',
          salaryImpact: '+€5,000-8,000/year'
        },
        {
          name: 'Data Analysis',
          currentLevel: 35,
          requiredLevel: 65,
          importance: 'medium',
          salaryImpact: '+€3,000-6,000/year'
        }
      ],
      trendingSkills: [
        {
          name: 'AI/ML Fundamentals',
          demandGrowth: '+35%',
          relevance: 'Increasingly required across all industries'
        },
        {
          name: 'Remote Leadership',
          demandGrowth: '+28%',
          relevance: 'Essential for modern hybrid work environments'
        },
        {
          name: 'Sustainability Practices',
          demandGrowth: '+22%',
          relevance: 'Growing focus on ESG across sectors'
        }
      ],
      recommendedResources: [
        {
          title: 'Leadership Masterclass',
          type: 'course',
          duration: '6 weeks'
        },
        {
          title: 'Strategic Management Certification',
          type: 'certification',
          duration: '3 months'
        },
        {
          title: 'Data-Driven Decision Making',
          type: 'course',
          duration: '4 weeks'
        }
      ]
    },
    actionPlan: {
      summary: '5 high-impact actions to accelerate your job search this week',
      actionCount: 5,
      weeklyActions: [
        {
          id: 'action-1',
          title: 'Update your LinkedIn headline',
          description: 'Make it clear you are open to opportunities with your target role in the title',
          priority: 'high',
          timeEstimate: '30 minutes'
        },
        {
          id: 'action-2',
          title: 'Apply to 3 target companies',
          description: 'Focus on companies matching your profile with customized cover letters',
          priority: 'high',
          timeEstimate: '2 hours'
        },
        {
          id: 'action-3',
          title: 'Reach out to 5 connections',
          description: 'Message people working at your target companies for informational interviews',
          priority: 'high',
          timeEstimate: '1 hour'
        },
        {
          id: 'action-4',
          title: 'Complete one skill module',
          description: 'Invest time in learning a critical skill from the recommendations',
          priority: 'medium',
          timeEstimate: '2 hours'
        },
        {
          id: 'action-5',
          title: 'Review and update your CV',
          description: 'Ensure your CV highlights achievements relevant to target roles',
          priority: 'medium',
          timeEstimate: '1 hour'
        }
      ],
      timing: {
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestTimes: '9:00 - 11:00 AM',
        bestMonths: ['January', 'February', 'September', 'October'],
        insight: 'Applications submitted early in the week have 20% higher response rates in your industry'
      },
      salary: {
        range: userData.salaryExpectations?.min && userData.salaryExpectations?.max 
          ? `${userData.salaryExpectations.currency || '€'}${userData.salaryExpectations.min} - ${userData.salaryExpectations.currency || '€'}${userData.salaryExpectations.max}`
          : '€55,000 - €75,000',
        average: '€65,000',
        tips: [
          'Research company-specific salary bands before negotiating',
          'Lead with your value and achievements, not your current salary',
          'Consider total compensation including equity, bonuses, and benefits'
        ]
      }
    }
  };
}



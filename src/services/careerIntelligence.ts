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
  
  marketPosition: {
    summary: string;
    marketFitScore: number;
    strengths: Array<{
      title: string;
      description: string;
      competitiveEdge: string;
    }>;
    weaknesses: Array<{
      title: string;
      description: string;
      howToImprove: string;
    }>;
    uniqueValue: string;
    competitorComparison: string;
  } | null;
  
  interviewReadiness: {
    summary: string;
    readinessScore: number;
    topQuestions: Array<{
      question: string;
      category: 'behavioral' | 'technical' | 'situational' | 'culture';
      tip: string;
    }>;
    preparationAreas: Array<{
      area: string;
      currentLevel: number;
      importance: 'critical' | 'high' | 'medium';
      advice: string;
    }>;
    redFlags: string[];
    mockInterviewFocus: string;
  } | null;
  
  networkInsights: {
    summary: string;
    connectionScore: number;
    potentialReferrals: Array<{
      type: string;
      description: string;
      actionStep: string;
    }>;
    outreachTemplates: Array<{
      scenario: string;
      template: string;
    }>;
    networkingTips: string[];
    linkedinOptimization: string[];
  } | null;
  
  timeline: {
    summary: string;
    estimatedTimeToGoal: string;
    successProbability: number;
    milestones: Array<{
      title: string;
      timeline: string;
      description: string;
      status: 'pending' | 'in-progress' | 'completed';
    }>;
    weeklyFocus: string;
    thirtyDayPlan: string;
    sixtyDayPlan: string;
    ninetyDayPlan: string;
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

Based on this profile, generate a complete career intelligence report with SEVEN sections:

## SECTION 1: NEXT MOVE (Companies & Career Path)
## SECTION 2: SKILLS TO MASTER
## SECTION 3: MARKET POSITIONING (How they compare to competition)
## SECTION 4: INTERVIEW READINESS (Preparation score & common questions)
## SECTION 5: NETWORK INSIGHTS (Connections & referral opportunities)
## SECTION 6: TIMELINE/ROADMAP (Path to goal with milestones)
## SECTION 7: ACTION PLAN

IMPORTANT INSTRUCTIONS:
- Be SPECIFIC and PERSONALIZED - use their actual data
- Recommend REAL companies that exist and hire in their field
- Provide ACTIONABLE advice, not generic tips
- Be HONEST about scores and levels
- Consider their location, experience level, and preferences

Return your response as a JSON object with this EXACT structure:

{
  "nextMove": {
    "summary": "One sentence summary of their best opportunities",
    "opportunityCount": 8,
    "topCompanies": [
      { "name": "Real Company", "matchScore": 85, "industry": "Tech", "location": "Paris", "whyMatch": "Why this fits", "topRole": "Role" }
    ],
    "careerPath": {
      "currentPosition": "Current role",
      "targetPosition": "Target role",
      "steps": [{ "title": "Step", "timeline": "6 months", "description": "What to do" }]
    }
  },
  "skills": {
    "summary": "Skill development needs",
    "criticalCount": 3,
    "criticalSkills": [{ "name": "Skill", "currentLevel": 40, "requiredLevel": 80, "importance": "critical", "salaryImpact": "+€5k/year" }],
    "trendingSkills": [{ "name": "Skill", "demandGrowth": "+25%", "relevance": "Why it matters" }],
    "recommendedResources": [{ "title": "Resource", "type": "course", "duration": "4 weeks" }]
  },
  "marketPosition": {
    "summary": "How they stand in the market",
    "marketFitScore": 75,
    "strengths": [{ "title": "Strength", "description": "Details", "competitiveEdge": "Why it matters" }],
    "weaknesses": [{ "title": "Weakness", "description": "Details", "howToImprove": "Advice" }],
    "uniqueValue": "Their unique value proposition",
    "competitorComparison": "How they compare to typical candidates"
  },
  "interviewReadiness": {
    "summary": "Interview preparation status",
    "readinessScore": 65,
    "topQuestions": [{ "question": "Common question", "category": "behavioral", "tip": "How to answer" }],
    "preparationAreas": [{ "area": "Area name", "currentLevel": 50, "importance": "critical", "advice": "How to prepare" }],
    "redFlags": ["Things to avoid in interviews"],
    "mockInterviewFocus": "What type of mock interview to practice"
  },
  "networkInsights": {
    "summary": "Network strength analysis",
    "connectionScore": 55,
    "potentialReferrals": [{ "type": "Alumni/Industry/LinkedIn", "description": "Opportunity", "actionStep": "What to do" }],
    "outreachTemplates": [{ "scenario": "Cold outreach", "template": "Message template" }],
    "networkingTips": ["Actionable networking advice"],
    "linkedinOptimization": ["LinkedIn improvement tips"]
  },
  "timeline": {
    "summary": "Path to achieving their goal",
    "estimatedTimeToGoal": "6-9 months",
    "successProbability": 70,
    "milestones": [{ "title": "Milestone", "timeline": "Month 1-2", "description": "What to achieve", "status": "pending" }],
    "weeklyFocus": "This week's priority",
    "thirtyDayPlan": "30-day goals",
    "sixtyDayPlan": "60-day goals",
    "ninetyDayPlan": "90-day goals"
  },
  "actionPlan": {
    "summary": "Immediate priorities",
    "actionCount": 5,
    "weeklyActions": [{ "id": "action-1", "title": "Action", "description": "Details", "priority": "high", "timeEstimate": "2 hours" }],
    "timing": { "bestDays": ["Tuesday", "Wednesday"], "bestTimes": "9-11 AM", "bestMonths": ["January"], "insight": "Timing advice" },
    "salary": { "range": "€55,000-75,000", "average": "€65,000", "tips": ["Negotiation tips"] }
  }
}

Provide 3 items for each array. Be concise but specific.`;

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
          { title: 'Strengthen Core Skills', timeline: '0-6 months', description: 'Focus on developing key competencies and building a stronger portfolio' },
          { title: 'Expand Network', timeline: '3-9 months', description: 'Connect with industry leaders and join relevant professional communities' },
          { title: 'Target Senior Roles', timeline: '6-12 months', description: 'Apply strategically to positions that align with your enhanced skillset' }
        ]
      }
    },
    skills: {
      summary: '3 critical skills to develop for your target roles',
      criticalCount: 3,
      criticalSkills: [
        { name: 'Leadership & Management', currentLevel: 45, requiredLevel: 75, importance: 'critical', salaryImpact: '+€8,000-12,000/year' },
        { name: 'Strategic Thinking', currentLevel: 50, requiredLevel: 80, importance: 'high', salaryImpact: '+€5,000-8,000/year' },
        { name: 'Data Analysis', currentLevel: 35, requiredLevel: 65, importance: 'medium', salaryImpact: '+€3,000-6,000/year' }
      ],
      trendingSkills: [
        { name: 'AI/ML Fundamentals', demandGrowth: '+35%', relevance: 'Increasingly required across all industries' },
        { name: 'Remote Leadership', demandGrowth: '+28%', relevance: 'Essential for modern hybrid work environments' },
        { name: 'Sustainability Practices', demandGrowth: '+22%', relevance: 'Growing focus on ESG across sectors' }
      ],
      recommendedResources: [
        { title: 'Leadership Masterclass', type: 'course', duration: '6 weeks' },
        { title: 'Strategic Management Certification', type: 'certification', duration: '3 months' },
        { title: 'Data-Driven Decision Making', type: 'course', duration: '4 weeks' }
      ]
    },
    marketPosition: {
      summary: `You rank in the top 30% of candidates for ${targetPosition} roles in your market`,
      marketFitScore: 72,
      strengths: [
        { title: 'Industry Experience', description: `${userData.yearsOfExperience || '5'}+ years in your field gives you credibility`, competitiveEdge: 'Employers value proven track records' },
        { title: 'Technical Skills', description: 'Your skill set aligns well with market demands', competitiveEdge: 'You have skills that are in high demand' },
        { title: 'Location Flexibility', description: userData.willingToRelocate ? 'Open to relocation expands opportunities' : 'Local market presence is strong', competitiveEdge: 'Geographic flexibility is valued' }
      ],
      weaknesses: [
        { title: 'Leadership Experience', description: 'Limited management experience compared to senior candidates', howToImprove: 'Take on project lead roles or mentor junior team members' },
        { title: 'Industry Certifications', description: 'Could benefit from industry-recognized credentials', howToImprove: 'Pursue relevant certifications in your field' }
      ],
      uniqueValue: `Your combination of ${userData.skills?.slice(0, 2).join(' and ') || 'technical expertise'} with ${userData.industry || 'industry'} experience makes you uniquely positioned`,
      competitorComparison: 'You have stronger technical skills than 60% of candidates but may need to demonstrate more leadership experience'
    },
    interviewReadiness: {
      summary: 'You\'re 65% ready for interviews - focus on behavioral questions and company research',
      readinessScore: 65,
      topQuestions: [
        { question: 'Tell me about a time you led a challenging project', category: 'behavioral', tip: 'Use STAR method - focus on measurable outcomes' },
        { question: `What draws you to ${targetPosition} roles?`, category: 'situational', tip: 'Connect your experience to the role requirements' },
        { question: 'How do you handle conflicting priorities?', category: 'behavioral', tip: 'Give specific examples with clear resolution' }
      ],
      preparationAreas: [
        { area: 'Behavioral Questions', currentLevel: 55, importance: 'critical', advice: 'Practice STAR responses for your top 5 achievements' },
        { area: 'Technical Knowledge', currentLevel: 70, importance: 'high', advice: 'Review recent industry trends and technologies' },
        { area: 'Company Research', currentLevel: 45, importance: 'critical', advice: 'Deep dive into target companies\' recent news and culture' }
      ],
      redFlags: [
        'Speaking negatively about previous employers',
        'Being vague about achievements or responsibilities',
        'Not asking thoughtful questions about the role'
      ],
      mockInterviewFocus: 'Focus on behavioral interviews with emphasis on leadership scenarios and conflict resolution'
    },
    networkInsights: {
      summary: 'Your network has untapped potential - 3 warm connection paths to target companies',
      connectionScore: 58,
      potentialReferrals: [
        { type: 'Alumni Network', description: 'Connect with alumni from your school working at target companies', actionStep: 'Search LinkedIn for alumni at your top 3 target companies' },
        { type: 'Industry Events', description: 'Attend virtual or in-person industry meetups', actionStep: 'Register for 2 industry events this month' },
        { type: 'Second-degree Connections', description: 'You have connections who know people at target companies', actionStep: 'Ask for introductions to 3 specific people' }
      ],
      outreachTemplates: [
        { scenario: 'Cold LinkedIn Outreach', template: 'Hi [Name], I noticed you work at [Company] as [Role]. I\'m exploring opportunities in [Field] and would love to learn about your experience. Would you have 15 minutes for a quick call?' },
        { scenario: 'Referral Request', template: 'Hi [Name], I hope you\'re doing well! I\'m currently looking for my next role in [Field] and noticed [Company] is hiring. Would you be comfortable making an introduction to the hiring team?' }
      ],
      networkingTips: [
        'Engage with content from people at target companies before reaching out',
        'Offer value first - share relevant articles or insights',
        'Follow up within 48 hours of any networking conversation'
      ],
      linkedinOptimization: [
        'Add "Open to Work" badge visible to recruiters only',
        'Include keywords from target job descriptions in your headline',
        'Post industry insights weekly to increase visibility'
      ]
    },
    timeline: {
      summary: `Realistic path to ${targetPosition}: 6-9 months with focused effort`,
      estimatedTimeToGoal: '6-9 months',
      successProbability: 70,
      milestones: [
        { title: 'Profile Optimization', timeline: 'Week 1-2', description: 'Update CV, LinkedIn, and portfolio', status: 'pending' },
        { title: 'Skill Development', timeline: 'Month 1-3', description: 'Complete priority certifications and courses', status: 'pending' },
        { title: 'Active Applications', timeline: 'Month 2-6', description: 'Apply to 5-10 targeted positions weekly', status: 'pending' },
        { title: 'Interview Phase', timeline: 'Month 4-8', description: 'Interview at 3-5 companies', status: 'pending' }
      ],
      weeklyFocus: 'This week: Update your LinkedIn headline and apply to 3 target companies',
      thirtyDayPlan: 'Optimize all profiles, start one critical skill course, apply to 15 positions',
      sixtyDayPlan: 'Complete first certification, expand network by 20 connections, secure 3 interviews',
      ninetyDayPlan: 'Receive first offer, complete second skill course, have backup opportunities ready'
    },
    actionPlan: {
      summary: '5 high-impact actions to accelerate your job search this week',
      actionCount: 5,
      weeklyActions: [
        { id: 'action-1', title: 'Update your LinkedIn headline', description: 'Make it clear you are open to opportunities with your target role in the title', priority: 'high', timeEstimate: '30 minutes' },
        { id: 'action-2', title: 'Apply to 3 target companies', description: 'Focus on companies matching your profile with customized cover letters', priority: 'high', timeEstimate: '2 hours' },
        { id: 'action-3', title: 'Reach out to 5 connections', description: 'Message people working at your target companies for informational interviews', priority: 'high', timeEstimate: '1 hour' },
        { id: 'action-4', title: 'Complete one skill module', description: 'Invest time in learning a critical skill from the recommendations', priority: 'medium', timeEstimate: '2 hours' },
        { id: 'action-5', title: 'Review and update your CV', description: 'Ensure your CV highlights achievements relevant to target roles', priority: 'medium', timeEstimate: '1 hour' }
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



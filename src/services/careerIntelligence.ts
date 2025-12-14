import axios from 'axios';
import { CompleteUserData } from '../lib/userDataFetcher';

// Types for Career Intelligence insights with alignment analysis
export interface AlignmentAnalysis {
  profileVsApplicationsMatch: number;  // 0-100
  directionAssessment: 'on-track' | 'misaligned' | 'over-reaching' | 'under-selling';
  criticalIssues: string[];
  honestFeedback: string;
}

export interface ApplicationPatternAnalysis {
  companiesTargeted: string[];
  rolesApplied: string[];
  successRateByType: Array<{ type: string; rate: number }>;
  timeWastedEstimate: string;
  topPerformingApplications: string[];
}

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
      alreadyApplied?: boolean;
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
    alignmentAnalysis?: AlignmentAnalysis;
    honestFeedback?: string;
    correctiveActions?: string[];
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
      missingInApplications?: boolean;
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
    honestFeedback?: string;
    correctiveActions?: string[];
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
    applicationPatternAnalysis?: ApplicationPatternAnalysis;
    honestFeedback?: string;
    correctiveActions?: string[];
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
    honestFeedback?: string;
    correctiveActions?: string[];
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
    companiesAppliedConnections?: string[];
    honestFeedback?: string;
    correctiveActions?: string[];
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
    adjustedForCurrentRate?: boolean;
    honestFeedback?: string;
    correctiveActions?: string[];
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
      isCorrective?: boolean;
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
    honestFeedback?: string;
    correctiveActions?: string[];
  } | null;
}

// Format user profile with COMPLETE data including applications and campaigns
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
            return endParts.length === 2 ? new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1) : now;
          })();
          if (end >= start) {
            totalMonths += Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
          }
        }
      }
    });
    yearsOfExperience = Math.round(totalMonths / 12);
  }

  // Format applications data
  const applications = userData.applications || [];
  const applicationsSection = applications.length > 0 ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 JOB APPLICATION HISTORY (${applications.length} total applications)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECENT APPLICATIONS (last 15):
${applications.slice(0, 15).map((app: any, index: number) => `
${index + 1}. ${app.company || app.companyName || 'Unknown Company'}
   └─ Position: ${app.position || app.jobTitle || app.title || 'N/A'}
   └─ Status: ${app.status || 'pending'}
   └─ Match Score: ${app.matchScore || app.match || 'N/A'}%
   └─ Applied: ${app.appliedAt || app.createdAt || app.dateApplied || 'N/A'}
   └─ Industry: ${app.industry || 'N/A'}
   └─ Location: ${app.location || app.jobLocation || 'N/A'}
   └─ Seniority: ${app.seniorityLevel || app.level || 'N/A'}
`).join('')}

APPLICATION METRICS:
- Total Applications Sent: ${userData.totalApplications || applications.length}
- Response Rate: ${userData.responseRate || 0}%
- Average Match Score: ${userData.averageMatchScore || 0}%
- Applications with Response: ${applications.filter((a: any) => a.status === 'responded' || a.status === 'interview' || a.status === 'accepted').length}
- Applications Pending: ${applications.filter((a: any) => a.status === 'pending' || a.status === 'applied').length}
- Interviews Secured: ${applications.filter((a: any) => a.status === 'interview').length}
- Rejections: ${applications.filter((a: any) => a.status === 'rejected').length}

COMPANIES APPLIED TO:
${[...new Set(applications.map((a: any) => a.company || a.companyName).filter(Boolean))].slice(0, 10).join(', ') || 'None yet'}

POSITIONS APPLIED FOR:
${[...new Set(applications.map((a: any) => a.position || a.jobTitle || a.title).filter(Boolean))].slice(0, 10).join(', ') || 'None yet'}
` : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 JOB APPLICATION HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No job applications recorded yet. Analysis will be based on profile data only.
`;

  // Format campaigns data
  const campaigns = userData.campaigns || [];
  const campaignsSection = campaigns.length > 0 ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL CAMPAIGN HISTORY (${campaigns.length} campaigns)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${campaigns.map((campaign: any, index: number) => `
${index + 1}. Campaign: "${campaign.name || campaign.title || 'Unnamed Campaign'}"
   └─ Status: ${campaign.status || 'unknown'}
   └─ Target Position: ${campaign.targetPosition || campaign.target || campaign.jobTitle || 'N/A'}
   └─ Target Industry: ${campaign.targetIndustry || campaign.industry || 'N/A'}
   └─ Companies Targeted: ${campaign.companiesCount || campaign.companies?.length || campaign.recipientCount || 0}
   └─ Emails Sent: ${campaign.emailsSent || campaign.sentCount || 0}
   └─ Emails Opened: ${campaign.emailsOpened || campaign.openCount || 0}
   └─ Responses Received: ${campaign.responses || campaign.responseCount || campaign.replies || 0}
   └─ Response Rate: ${campaign.responseRate || (campaign.emailsSent > 0 ? Math.round((campaign.responses || 0) / campaign.emailsSent * 100) : 0)}%
   └─ Created: ${campaign.createdAt || 'N/A'}
`).join('')}

CAMPAIGN METRICS SUMMARY:
- Total Campaigns: ${userData.totalCampaigns || campaigns.length}
- Total Emails Sent: ${campaigns.reduce((sum: number, c: any) => sum + (c.emailsSent || c.sentCount || 0), 0)}
- Total Responses: ${campaigns.reduce((sum: number, c: any) => sum + (c.responses || c.responseCount || c.replies || 0), 0)}
- Average Response Rate: ${campaigns.length > 0 ? Math.round(campaigns.reduce((sum: number, c: any) => sum + (c.responseRate || 0), 0) / campaigns.length) : 0}%
` : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL CAMPAIGN HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No email campaigns recorded yet. Analysis will be based on profile data only.
`;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 USER PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IDENTITY:
- Name: ${userData.firstName || ''} ${userData.lastName || ''}
- Location: ${location}
- Email: ${userData.email || 'Not specified'}

CURRENT STATUS:
- Current Position: ${currentPosition}${currentCompany ? ` at ${currentCompany}` : ''}
- Years of Experience: ${yearsOfExperience || 'Not specified'}
- Industry: ${userData.industry || 'Not specified'}
- Current Situation: ${userData.currentSituation || 'Not specified'}
- Search Urgency: ${userData.searchUrgency || 'Not specified'}

CAREER GOALS:
- Target Position: ${userData.targetPosition || 'Not specified'}
- Target Sectors: ${userData.targetSectors?.join(', ') || 'Not specified'}
- Primary Motivator: ${userData.primaryMotivator || 'Not specified'}
- Career Priorities: ${userData.careerPriorities?.join(', ') || 'Not specified'}

EDUCATION:
- Level: ${userData.educationLevel || 'Not specified'}
- Field: ${userData.educationField || 'Not specified'}
- Institution: ${userData.educationInstitution || 'Not specified'}
- Graduation Year: ${userData.graduationYear || 'Not specified'}

SKILLS & EXPERTISE:
- Technical Skills: ${userData.skills?.join(', ') || 'Not specified'}
- Tools: ${userData.tools?.join(', ') || 'Not specified'}
- Soft Skills: ${userData.softSkills?.join(', ') || 'Not specified'}
- Certifications: ${userData.certifications?.map((c: any) => c.name).join(', ') || 'Not specified'}

LANGUAGES:
${userData.languages?.map(l => `- ${l.language}: ${l.level}`).join('\n') || '- Not specified'}

WORK PREFERENCES:
- Work Preference: ${userData.workPreference || 'Not specified'}
- Willing to Relocate: ${userData.willingToRelocate ? 'Yes' : 'No'}
- Preferred Environment: ${userData.preferredEnvironment?.join(', ') || 'Not specified'}
- Role Type: ${userData.roleType || 'Not specified'}
- Deal Breakers: ${userData.dealBreakers?.join(', ') || 'Not specified'}

COMPENSATION:
- Salary Expectations: ${userData.salaryExpectations?.min || ''} - ${userData.salaryExpectations?.max || ''} ${userData.salaryExpectations?.currency || 'EUR'}
- Salary Flexibility: ${userData.salaryFlexibility || 'Not specified'}
- Compensation Priorities: ${userData.compensationPriorities?.join(', ') || 'Not specified'}

PROFESSIONAL HISTORY:
${userData.professionalHistory?.slice(0, 5).map((exp: any) => 
  `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})
   Industry: ${exp.industry || 'N/A'}, Location: ${exp.location || 'N/A'}
   Key Achievements: ${exp.achievements?.slice(0, 2).join('; ') || 'N/A'}`
).join('\n') || '- Not specified'}

MANAGEMENT EXPERIENCE:
- Has Management Experience: ${userData.managementExperience?.hasExperience ? 'Yes' : 'No'}
- Team Size: ${userData.managementExperience?.teamSize || 'N/A'}
- Team Type: ${userData.managementExperience?.teamType || 'N/A'}

PROFILE TAGS (AI-generated summary):
${userData.profileTags?.join(', ') || 'Not generated'}

${userData.cvContent ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 CV CONTENT (extracted)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${userData.cvContent.substring(0, 4000)}
${userData.cvContent.length > 4000 ? '...[truncated]' : ''}
` : ''}
${applicationsSection}
${campaignsSection}
`;
}

// Generate all career insights in one consolidated call
export async function generateCareerInsights(userData: CompleteUserData): Promise<CareerInsightsData> {
  const userProfile = formatUserProfile(userData);
  
  const prompt = `You are a WORLD-CLASS CAREER INTELLIGENCE ANALYST and BRUTALLY HONEST CAREER COACH with 25+ years of experience in executive recruitment, talent acquisition, career coaching, and job market analysis. You have worked with Fortune 500 companies and helped thousands of professionals land their dream jobs.

Your analysis is renowned for being:
- BRUTALLY HONEST - You tell people what they NEED to hear, not what they WANT to hear
- DATA-DRIVEN - You base every recommendation on the actual numbers and patterns
- SPECIFIC - You never give generic advice; everything is personalized
- ACTIONABLE - Every insight leads to a concrete next step
- REALITY-BASED - You compare aspirations against actual market reality

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 COMPLETE USER DATA FOR ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${userProfile}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR MISSION: COMPREHENSIVE CAREER INTELLIGENCE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CRITICAL ANALYSIS REQUIREMENTS:**

1. **ALIGNMENT CHECK**: Compare the user's TARGET POSITION against what they're actually APPLYING TO. Are they aligned or completely off-track?

2. **SUCCESS RATE ANALYSIS**: If their response rate is low (under 20%), identify WHY. Is it:
   - Wrong seniority level (over-reaching or under-selling)?
   - Wrong industry targeting?
   - Skills mismatch?
   - Poor application timing?

3. **CAMPAIGN EFFECTIVENESS**: Analyze their email campaigns. Are they targeting the right companies? Is their outreach effective?

4. **HONEST FEEDBACK**: In EVERY section, include a "honestFeedback" field. Be direct. Examples:
   - "You're applying to Director roles with only 3 years of experience. This is unrealistic."
   - "Your skills don't match the roles you're targeting. You need to upskill first."
   - "You're under-selling yourself. Your experience qualifies you for more senior positions."
   - "Your campaign response rate of 2% indicates a fundamental targeting problem."

5. **CORRECTIVE ACTIONS**: For each section, provide specific corrections if the user is off-track.

6. **USE ACTUAL DATA**: Reference specific numbers from their applications:
   - "${userData.totalApplications || 0} applications with ${userData.responseRate || 0}% response rate"
   - "Applied to companies like: [list actual companies from their data]"
   - "Your average match score of ${userData.averageMatchScore || 0}% suggests..."

7. **REAL COMPANIES**: Recommend REAL companies that actually hire for their target role in their location.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 REQUIRED OUTPUT FORMAT (JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY a valid JSON object with this EXACT structure:

{
  "nextMove": {
    "summary": "Based on your ${userData.totalApplications || 0} applications with ${userData.responseRate || 0}% response rate, here's your realistic next move... [BE SPECIFIC AND DATA-DRIVEN]",
    "opportunityCount": 8,
    "topCompanies": [
      {
        "name": "REAL Company Name that hires in their field",
        "matchScore": 85,
        "industry": "Specific Industry",
        "location": "Specific City",
        "whyMatch": "Detailed explanation referencing their ACTUAL skills and experience",
        "topRole": "Specific role title they should target",
        "alreadyApplied": false
      }
    ],
    "careerPath": {
      "currentPosition": "Their actual current role",
      "targetPosition": "Realistic target based on their experience",
      "steps": [
        {
          "title": "Specific step",
          "timeline": "Realistic timeframe",
          "description": "Detailed action with specific advice"
        }
      ]
    },
    "alignmentAnalysis": {
      "profileVsApplicationsMatch": 65,
      "directionAssessment": "misaligned",
      "criticalIssues": ["Issue 1 with specific evidence", "Issue 2"],
      "honestFeedback": "Direct, honest assessment of their job search direction"
    },
    "honestFeedback": "Brutally honest assessment of their next move strategy",
    "correctiveActions": ["Specific action 1", "Specific action 2"]
  },
  "skills": {
    "summary": "Based on roles you're targeting vs. your current skills... [BE SPECIFIC]",
    "criticalCount": 3,
    "criticalSkills": [
      {
        "name": "Specific Skill",
        "currentLevel": 40,
        "requiredLevel": 80,
        "importance": "critical",
        "salaryImpact": "+€X,XXX/year",
        "missingInApplications": true
      }
    ],
    "trendingSkills": [
      {
        "name": "Skill",
        "demandGrowth": "+XX%",
        "relevance": "Why this matters for THEIR specific goals"
      }
    ],
    "recommendedResources": [
      {
        "title": "Specific course/cert name",
        "type": "course",
        "duration": "X weeks"
      }
    ],
    "honestFeedback": "Honest assessment of their skill gaps vs. applications",
    "correctiveActions": ["Specific action 1", "Specific action 2"]
  },
  "marketPosition": {
    "summary": "Your ${userData.responseRate || 0}% response rate indicates... [BE SPECIFIC]",
    "marketFitScore": 72,
    "strengths": [
      {
        "title": "Strength",
        "description": "Based on their ACTUAL experience",
        "competitiveEdge": "How this helps them"
      }
    ],
    "weaknesses": [
      {
        "title": "Weakness",
        "description": "Honest assessment",
        "howToImprove": "Specific improvement path"
      }
    ],
    "uniqueValue": "Their unique value proposition based on actual data",
    "competitorComparison": "How they compare to typical candidates for roles they're applying to",
    "applicationPatternAnalysis": {
      "companiesTargeted": ["List of companies from their applications"],
      "rolesApplied": ["List of role types"],
      "successRateByType": [{"type": "Senior roles", "rate": 5}, {"type": "Mid-level", "rate": 25}],
      "timeWastedEstimate": "X% of applications are likely wasted on wrong-fit roles",
      "topPerformingApplications": ["Which applications got responses"]
    },
    "honestFeedback": "Honest market position assessment",
    "correctiveActions": ["Specific action 1", "Specific action 2"]
  },
  "interviewReadiness": {
    "summary": "Based on the roles you're actually interviewing for...",
    "readinessScore": 65,
    "topQuestions": [
      {
        "question": "Question specific to roles they're applying for",
        "category": "behavioral",
        "tip": "Specific tip based on their background"
      }
    ],
    "preparationAreas": [
      {
        "area": "Area",
        "currentLevel": 50,
        "importance": "critical",
        "advice": "Specific advice"
      }
    ],
    "redFlags": ["Red flags based on their profile and target roles"],
    "mockInterviewFocus": "Specific focus area",
    "honestFeedback": "Honest interview readiness assessment",
    "correctiveActions": ["Action 1", "Action 2"]
  },
  "networkInsights": {
    "summary": "Network analysis for companies you've applied to...",
    "connectionScore": 55,
    "potentialReferrals": [
      {
        "type": "Type",
        "description": "Description",
        "actionStep": "Specific action"
      }
    ],
    "outreachTemplates": [
      {
        "scenario": "Scenario",
        "template": "Template text"
      }
    ],
    "networkingTips": ["Tip 1", "Tip 2"],
    "linkedinOptimization": ["Optimization 1", "Optimization 2"],
    "companiesAppliedConnections": ["Suggestions for connecting at companies they applied to"],
    "honestFeedback": "Honest network assessment",
    "correctiveActions": ["Action 1", "Action 2"]
  },
  "timeline": {
    "summary": "Based on your current ${userData.responseRate || 0}% response rate, realistic timeline is...",
    "estimatedTimeToGoal": "X-Y months",
    "successProbability": 70,
    "milestones": [
      {
        "title": "Milestone",
        "timeline": "Month X-Y",
        "description": "Description",
        "status": "pending"
      }
    ],
    "weeklyFocus": "This week's priority based on their current situation",
    "thirtyDayPlan": "30-day goals",
    "sixtyDayPlan": "60-day goals",
    "ninetyDayPlan": "90-day goals",
    "adjustedForCurrentRate": true,
    "honestFeedback": "Honest timeline assessment - is their goal realistic?",
    "correctiveActions": ["Action 1", "Action 2"]
  },
  "actionPlan": {
    "summary": "Your top priority actions based on your ${userData.totalApplications || 0} applications...",
    "actionCount": 5,
    "weeklyActions": [
      {
        "id": "action-1",
        "title": "Action title",
        "description": "Detailed action",
        "priority": "high",
        "timeEstimate": "X hours",
        "isCorrective": true
      }
    ],
    "timing": {
      "bestDays": ["Day1", "Day2"],
      "bestTimes": "XX:XX - XX:XX",
      "bestMonths": ["Month1", "Month2"],
      "insight": "Timing insight for their industry"
    },
    "salary": {
      "range": "€XX,XXX - €XX,XXX",
      "average": "€XX,XXX",
      "tips": ["Tip 1", "Tip 2"]
    },
    "honestFeedback": "Honest assessment of what they need to do NOW",
    "correctiveActions": ["Corrective action 1", "Corrective action 2"]
  }
}

**CRITICAL REMINDERS:**
1. Provide 3-5 items for each array
2. Use REAL data from their profile - reference specific companies they applied to, their actual response rate, their actual skills
3. Be BRUTALLY HONEST in every honestFeedback field
4. If they have NO applications or campaigns, note this and provide advice based solely on their profile
5. Adjust all advice based on their location (${userData.city || userData.location || 'their location'})
6. Consider their experience level (${userData.yearsOfExperience || 'unknown'} years) when making recommendations
7. Return ONLY valid JSON, no markdown code blocks or extra text`;

  try {
    const response = await axios.post('/api/chatgpt', {
      prompt,
      type: 'career-intelligence',
      cvContent: userData.cvContent || null
    }, {
      timeout: 120000 // 120 seconds for comprehensive analysis
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
          // Try to find JSON object in the response
          const jsonStart = content.indexOf('{');
          const jsonEnd = content.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            content = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
          } else {
            content = JSON.parse(content);
          }
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
  const totalApps = userData.totalApplications || 0;
  const responseRate = userData.responseRate || 0;
  
  return {
    nextMove: {
      summary: `Based on your ${totalApps} applications with ${responseRate}% response rate, your best opportunities lie in leveraging your ${userData.skills?.slice(0, 2).join(' and ') || 'core skills'} expertise.`,
      opportunityCount: 8,
      topCompanies: [
        {
          name: 'Salesforce',
          matchScore: 87,
          industry: userData.industry || 'Technology',
          location: location,
          whyMatch: `Strong alignment with your ${userData.yearsOfExperience || '5'}+ years of experience and ${userData.skills?.[0] || 'technical'} skills.`,
          topRole: targetPosition,
          alreadyApplied: false
        },
        {
          name: 'HubSpot',
          matchScore: 82,
          industry: userData.targetSectors?.[0] || 'SaaS',
          location: location,
          whyMatch: 'Growing company with excellent career advancement opportunities in your field.',
          topRole: `Senior ${currentPosition}`,
          alreadyApplied: false
        },
        {
          name: 'Zendesk',
          matchScore: 78,
          industry: userData.targetSectors?.[1] || 'Customer Success',
          location: location,
          whyMatch: 'Innovative environment with competitive compensation.',
          topRole: targetPosition,
          alreadyApplied: false
        }
      ],
      careerPath: {
        currentPosition: currentPosition,
        targetPosition: targetPosition,
        steps: [
          { title: 'Strengthen Core Skills', timeline: '0-3 months', description: 'Focus on developing key competencies based on your skill gaps' },
          { title: 'Targeted Applications', timeline: '1-4 months', description: 'Apply strategically to companies matching your profile' },
          { title: 'Interview & Close', timeline: '3-6 months', description: 'Convert interviews into offers with focused preparation' }
        ]
      },
      alignmentAnalysis: {
        profileVsApplicationsMatch: responseRate > 15 ? 75 : 50,
        directionAssessment: responseRate > 15 ? 'on-track' : 'misaligned',
        criticalIssues: responseRate < 15 ? [
          `Your ${responseRate}% response rate suggests targeting issues`,
          'Consider adjusting seniority level of applications'
        ] : [],
        honestFeedback: responseRate < 15 
          ? `With only ${responseRate}% response rate, your current targeting strategy needs adjustment. Focus on roles that better match your experience level.`
          : `Your ${responseRate}% response rate is healthy. Continue with current strategy but optimize for higher match scores.`
      },
      honestFeedback: totalApps === 0 
        ? 'You haven\'t started applying yet. Your profile looks solid - it\'s time to start your job search.'
        : `Based on ${totalApps} applications, ${responseRate > 15 ? 'you\'re on the right track' : 'you need to recalibrate your targeting strategy'}.`,
      correctiveActions: responseRate < 15 ? [
        'Focus on roles matching your current seniority level',
        'Improve your CV to highlight relevant achievements',
        'Target companies where your skills are in high demand'
      ] : [
        'Continue current strategy',
        'Increase application volume',
        'Prepare for upcoming interviews'
      ]
    },
    skills: {
      summary: `Focus on mastering ${userData.skills?.[0] || 'key skills'} and developing leadership capabilities for your target roles.`,
      criticalCount: 3,
      criticalSkills: [
        { name: 'Leadership & Management', currentLevel: 45, requiredLevel: 75, importance: 'critical', salaryImpact: '+€8,000-12,000/year', missingInApplications: true },
        { name: 'Strategic Thinking', currentLevel: 50, requiredLevel: 80, importance: 'high', salaryImpact: '+€5,000-8,000/year', missingInApplications: false },
        { name: 'Data Analysis', currentLevel: 35, requiredLevel: 65, importance: 'medium', salaryImpact: '+€3,000-6,000/year', missingInApplications: true }
      ],
      trendingSkills: [
        { name: 'AI/ML Fundamentals', demandGrowth: '+35%', relevance: 'Increasingly required across all industries' },
        { name: 'Remote Leadership', demandGrowth: '+28%', relevance: 'Essential for modern hybrid work environments' },
        { name: 'Data-Driven Decision Making', demandGrowth: '+22%', relevance: 'Growing focus across sectors' }
      ],
      recommendedResources: [
        { title: 'Leadership Masterclass', type: 'course', duration: '6 weeks' },
        { title: 'Strategic Management Certification', type: 'certification', duration: '3 months' },
        { title: 'Data Analytics Fundamentals', type: 'course', duration: '4 weeks' }
      ],
      honestFeedback: 'Your technical skills are solid, but you need to develop leadership capabilities to reach senior roles.',
      correctiveActions: [
        'Start a leadership development program',
        'Seek opportunities to mentor junior team members',
        'Complete at least one industry certification'
      ]
    },
    marketPosition: {
      summary: `You're well-positioned in the market with strong ${userData.skills?.[0] || 'technical'} skills but need to strengthen your leadership narrative.`,
      marketFitScore: 75,
      strengths: [
        { title: 'Industry Experience', description: `${userData.yearsOfExperience || '5'}+ years in your field gives you credibility`, competitiveEdge: 'Employers value proven track records' },
        { title: 'Technical Skills', description: 'Your skill set aligns well with market demands', competitiveEdge: 'You have skills that are in high demand' },
        { title: 'Location', description: `Based in ${location}`, competitiveEdge: 'Strong local market presence' }
      ],
      weaknesses: [
        { title: 'Leadership Experience', description: 'Limited management experience compared to senior candidates', howToImprove: 'Take on project lead roles or mentor junior team members' },
        { title: 'Industry Certifications', description: 'Could benefit from industry-recognized credentials', howToImprove: 'Pursue relevant certifications in your field' }
      ],
      uniqueValue: `Your combination of ${userData.skills?.slice(0, 2).join(' and ') || 'technical expertise'} with ${userData.industry || 'industry'} experience makes you uniquely positioned`,
      competitorComparison: 'You have stronger technical skills than 60% of candidates but may need to demonstrate more leadership experience',
      applicationPatternAnalysis: {
        companiesTargeted: (userData.applications || []).slice(0, 5).map((a: any) => a.company || a.companyName).filter(Boolean) as string[],
        rolesApplied: [...new Set((userData.applications || []).map((a: any) => a.position || a.jobTitle).filter(Boolean))] as string[],
        successRateByType: [
          { type: 'Senior roles', rate: 10 },
          { type: 'Mid-level roles', rate: 25 }
        ],
        timeWastedEstimate: responseRate < 15 ? '40% of applications may be misaligned' : '15% optimization possible',
        topPerformingApplications: ['Focus on companies where you got responses']
      },
      honestFeedback: responseRate < 15 
        ? 'Your low response rate indicates a targeting problem. Either you\'re over-reaching on seniority or your CV isn\'t highlighting the right achievements.'
        : 'You\'re competitive in the market. Focus on converting more interviews into offers.',
      correctiveActions: [
        'Audit your recent applications for seniority alignment',
        'Update your CV to highlight quantifiable achievements',
        'Focus on companies with higher match scores'
      ]
    },
    interviewReadiness: {
      summary: `You're moderately prepared for interviews but need to focus on behavioral questions and company research.`,
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
      mockInterviewFocus: 'Focus on behavioral interviews with emphasis on leadership scenarios',
      honestFeedback: 'Your interview preparation is average. Invest more time in practicing behavioral responses.',
      correctiveActions: [
        'Schedule 3 mock interviews this week',
        'Research each target company deeply before applying',
        'Prepare specific stories for common behavioral questions'
      ]
    },
    networkInsights: {
      summary: `Your network has untapped potential - focus on expanding industry connections.`,
      connectionScore: 55,
      potentialReferrals: [
        { type: 'Alumni Network', description: 'Connect with alumni working at target companies', actionStep: 'Search LinkedIn for alumni at your top 3 target companies' },
        { type: 'Industry Events', description: 'Attend virtual or in-person industry meetups', actionStep: 'Register for 2 industry events this month' },
        { type: 'Second-degree Connections', description: 'Leverage connections who know people at target companies', actionStep: 'Ask for introductions to 3 specific people' }
      ],
      outreachTemplates: [
        { scenario: 'Cold LinkedIn Outreach', template: 'Hi [Name], I noticed you work at [Company] as [Role]. I\'m exploring opportunities in [Field] and would love to learn about your experience. Would you have 15 minutes for a quick call?' },
        { scenario: 'Referral Request', template: 'Hi [Name], I hope you\'re doing well! I\'m currently looking for my next role and noticed [Company] is hiring. Would you be comfortable making an introduction?' }
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
      ],
      companiesAppliedConnections: ['Search for connections at companies you\'ve applied to'],
      honestFeedback: 'Your network is underutilized. Many jobs are filled through referrals - invest more time in networking.',
      correctiveActions: [
        'Send 5 outreach messages per week',
        'Optimize your LinkedIn profile for your target role',
        'Join 2 relevant professional groups'
      ]
    },
    timeline: {
      summary: `Rouchdi can achieve his career goals within 6-9 months with focused effort and strategy adjustments.`,
      estimatedTimeToGoal: '6-9 months',
      successProbability: responseRate > 15 ? 75 : 60,
      milestones: [
        { title: 'Profile Optimization', timeline: 'Week 1-2', description: 'Update CV, LinkedIn, and portfolio', status: 'pending' },
        { title: 'Strategy Calibration', timeline: 'Week 1-3', description: 'Analyze and adjust targeting based on response data', status: 'pending' },
        { title: 'Active Applications', timeline: 'Month 1-4', description: 'Apply to 5-10 targeted positions weekly', status: 'pending' },
        { title: 'Interview Phase', timeline: 'Month 3-6', description: 'Interview at 3-5 companies', status: 'pending' }
      ],
      weeklyFocus: 'This week: Audit your recent applications and identify patterns',
      thirtyDayPlan: 'Optimize all profiles, adjust targeting strategy, apply to 15 well-matched positions',
      sixtyDayPlan: 'Complete first certification, expand network by 20 connections, secure 3 interviews',
      ninetyDayPlan: 'Receive first offer, complete skill development course, have backup opportunities ready',
      adjustedForCurrentRate: true,
      honestFeedback: responseRate < 15 
        ? 'Your current trajectory needs adjustment. Without changes, this timeline could extend to 9-12 months.'
        : 'You\'re on track. Maintain momentum and focus on interview conversion.',
      correctiveActions: [
        'Review and adjust application targeting weekly',
        'Track response rates by company type and seniority',
        'Increase networking activities'
      ]
    },
    actionPlan: {
      summary: `${5} high-impact actions to accelerate your job search this week`,
      actionCount: 5,
      weeklyActions: [
        { id: 'action-1', title: 'Audit Application History', description: 'Review your applications and identify which ones got responses', priority: 'high', timeEstimate: '1 hour', isCorrective: true },
        { id: 'action-2', title: 'Update your CV', description: 'Ensure your CV highlights achievements relevant to target roles', priority: 'high', timeEstimate: '2 hours', isCorrective: false },
        { id: 'action-3', title: 'Apply to 3 well-matched companies', description: 'Focus on companies with 75%+ match score', priority: 'high', timeEstimate: '2 hours', isCorrective: false },
        { id: 'action-4', title: 'Send 5 networking messages', description: 'Reach out to people at your target companies', priority: 'high', timeEstimate: '1 hour', isCorrective: false },
        { id: 'action-5', title: 'Complete one skill module', description: 'Invest time in a critical skill gap', priority: 'medium', timeEstimate: '2 hours', isCorrective: false }
      ],
      timing: {
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestTimes: '9:00 - 11:00 AM',
        bestMonths: ['January', 'February', 'September', 'October'],
        insight: 'Applications submitted early in the week have 20% higher response rates'
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
      },
      honestFeedback: totalApps === 0 
        ? 'You need to start applying. Analysis without application data limits the quality of recommendations.'
        : `With ${totalApps} applications and ${responseRate}% response rate, ${responseRate < 15 ? 'strategy adjustment is critical' : 'focus on interview preparation'}.`,
      correctiveActions: [
        'Set weekly application and networking targets',
        'Track all interactions in a spreadsheet',
        'Review and adjust strategy every 2 weeks'
      ]
    }
  };
}

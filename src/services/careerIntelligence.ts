import axios from 'axios';
import { CompleteUserData } from '../lib/userDataFetcher';

// Platform features that the AI can recommend actions for
// The AI must ONLY suggest actions that map to these features
const PLATFORM_FEATURES = {
  'Resume Lab': {
    path: '/cv-editor',
    description: 'Edit and optimize your CV/resume with AI assistance',
    actions: ['Optimize CV', 'Rewrite sections', 'Fix ATS issues', 'Improve formatting']
  },
  'Job Board': {
    path: '/jobs',
    description: 'Browse curated job listings matched to your profile',
    actions: ['Apply to matched jobs', 'Save interesting positions', 'Set job alerts']
  },
  'Campaigns': {
    path: '/campaigns-auto',
    description: 'Automated cold outreach to hiring managers and recruiters',
    actions: ['Launch outreach campaign', 'Target specific companies', 'Follow up on responses']
  },
  'Application Tracking': {
    path: '/applications',
    description: 'Track all your job applications in one place',
    actions: ['Review application status', 'Update application stages', 'Analyze patterns']
  },
  'Mock Interview': {
    path: '/mock-interview',
    description: 'Practice interviews with AI feedback',
    actions: ['Practice behavioral questions', 'Get feedback on answers', 'Prepare for specific roles']
  },
  'CV Analysis': {
    path: '/cv-analysis',
    description: 'Get detailed ATS compatibility analysis',
    actions: ['Check ATS score', 'Identify missing keywords', 'Compare to job requirements']
  }
};

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
      ctaLink?: 'resume-lab' | 'job-board' | 'campaigns';
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

  // Compute key signals for the AI to reference
  const totalApps = userData.totalApplications || 0;
  const responseRate = userData.responseRate || 0;
  const avgMatchScore = userData.averageMatchScore || 0;
  const applications = userData.applications || [];
  const campaigns = userData.campaigns || [];

  // Derive situation assessment
  const hasApplications = totalApps > 0;
  const hasLowResponseRate = responseRate < 15;

  // Get companies and roles from applications
  const appliedCompanies = [...new Set(applications.map((a: any) => a.company || a.companyName).filter(Boolean))].slice(0, 8);
  const appliedRoles = [...new Set(applications.map((a: any) => a.position || a.jobTitle || a.title).filter(Boolean))].slice(0, 8);

  // Format platform features for the prompt
  const platformFeaturesText = Object.entries(PLATFORM_FEATURES)
    .map(([name, config]) => `- ${name} (${config.path}): ${config.description}`)
    .join('\n');

  const prompt = `You are a senior career strategist analyzing a job seeker's situation. Your role is to provide ONE clear strategic insight and recommend specific actions within a job search platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM CONTEXT (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This user is on a job search platform with these features:
${platformFeaturesText}

RULE: You may ONLY recommend actions that can be executed using these features.
DO NOT suggest: networking on LinkedIn, reaching out on social media, attending events, or any action outside this platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${userProfile}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY METRICS TO REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Total applications: ${totalApps}
- Response rate: ${responseRate}%
- Average match score: ${avgMatchScore}%
- Companies applied to: ${appliedCompanies.join(', ') || 'None yet'}
- Roles applied for: ${appliedRoles.join(', ') || 'None yet'}
- Active campaigns: ${campaigns.length}
${hasLowResponseRate && hasApplications ? '⚠️ LOW RESPONSE RATE - This is the primary issue to address.' : ''}
${!hasApplications ? '⚠️ NO APPLICATIONS YET - User needs to start applying.' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ANALYSIS APPROACH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Identify the SINGLE most important insight about this user's job search
2. Frame it as a strategic conclusion, not a suggestion
3. Ground every recommendation in their actual data
4. Only recommend actions within the platform features listed above

TONE:
- Assertive and direct
- No hedging ("might", "could consider")
- No motivational language
- Reference specific numbers and data points

BAD EXAMPLE: "Consider updating your CV to better highlight your skills."
GOOD EXAMPLE: "Your ${responseRate}% response rate with ${avgMatchScore}% match scores indicates CV positioning issues. Fix in Resume Lab."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON with this structure:

{
  "nextMove": {
    "summary": "One decisive sentence about their situation and what to do. Reference their ${totalApps} applications and ${responseRate}% response rate.",
    "opportunityCount": 5,
    "topCompanies": [
      {
        "name": "Real company in their field",
        "matchScore": 85,
        "industry": "Their target industry",
        "location": "Their location",
        "whyMatch": "Why this company fits their ${userData.yearsOfExperience || 'experience level'}+ years and ${userData.skills?.[0] || 'skills'}",
        "topRole": "Specific role title"
      }
    ],
    "careerPath": {
      "currentPosition": "${userData.currentPosition || userData.jobTitle || 'Current role'}",
      "targetPosition": "${userData.targetPosition || 'Target role'}",
      "steps": [
        {
          "title": "Action title",
          "timeline": "Timeframe",
          "description": "Specific action using platform feature"
        }
      ]
    },
    "alignmentAnalysis": {
      "profileVsApplicationsMatch": 70,
      "directionAssessment": "on-track or misaligned or over-reaching or under-selling",
      "criticalIssues": ["Issue grounded in data"],
      "honestFeedback": "Direct assessment"
    },
    "honestFeedback": "One sentence strategic assessment",
    "correctiveActions": ["Action using Resume Lab/Job Board/Campaigns/etc"]
  },
  "skills": {
    "summary": "Skills assessment relative to roles they're targeting",
    "criticalCount": 2,
    "criticalSkills": [
      {
        "name": "Skill name",
        "currentLevel": 50,
        "requiredLevel": 80,
        "importance": "critical",
        "salaryImpact": "+€X,XXX/year"
      }
    ],
    "trendingSkills": [
      {
        "name": "Skill",
        "demandGrowth": "+XX%",
        "relevance": "Why it matters for them"
      }
    ],
    "recommendedResources": [
      {
        "title": "Resource name",
        "type": "course",
        "duration": "X weeks"
      }
    ],
    "honestFeedback": "Skills assessment",
    "correctiveActions": ["Use CV Analysis to identify gaps"]
  },
  "marketPosition": {
    "summary": "Market position based on their ${responseRate}% response rate",
    "marketFitScore": 70,
    "strengths": [
      {
        "title": "Strength",
        "description": "Based on actual experience",
        "competitiveEdge": "How it helps"
      }
    ],
    "weaknesses": [
      {
        "title": "Weakness",
        "description": "Honest assessment",
        "howToImprove": "Use [Platform Feature]"
      }
    ],
    "uniqueValue": "Their differentiation",
    "competitorComparison": "How they compare",
    "honestFeedback": "Market assessment",
    "correctiveActions": ["Platform action"]
  },
  "interviewReadiness": {
    "summary": "Interview readiness assessment",
    "readinessScore": 65,
    "topQuestions": [
      {
        "question": "Role-specific question",
        "category": "behavioral",
        "tip": "Answer approach"
      }
    ],
    "preparationAreas": [
      {
        "area": "Area",
        "currentLevel": 50,
        "importance": "critical",
        "advice": "Practice in Mock Interview"
      }
    ],
    "redFlags": ["Potential issue"],
    "mockInterviewFocus": "Focus area for Mock Interview feature",
    "honestFeedback": "Readiness assessment",
    "correctiveActions": ["Use Mock Interview to practice X"]
  },
  "networkInsights": {
    "summary": "Outreach strategy using Campaigns",
    "connectionScore": 55,
    "potentialReferrals": [
      {
        "type": "Outreach type",
        "description": "Description",
        "actionStep": "Launch Campaign targeting X"
      }
    ],
    "outreachTemplates": [
      {
        "scenario": "Use case",
        "template": "Template for Campaigns feature"
      }
    ],
    "networkingTips": ["Use Campaigns to reach hiring managers"],
    "linkedinOptimization": ["Update CV positioning in Resume Lab"],
    "honestFeedback": "Outreach assessment",
    "correctiveActions": ["Launch Campaign targeting companies in ${userData.targetSectors?.[0] || 'target sector'}"]
  },
  "timeline": {
    "summary": "Realistic timeline based on ${responseRate}% response rate",
    "estimatedTimeToGoal": "X-Y months",
    "successProbability": 70,
    "milestones": [
      {
        "title": "Milestone",
        "timeline": "Timeframe",
        "description": "Description",
        "status": "pending"
      }
    ],
    "weeklyFocus": "This week's focus using platform",
    "thirtyDayPlan": "30-day plan",
    "sixtyDayPlan": "60-day plan",
    "ninetyDayPlan": "90-day plan",
    "honestFeedback": "Timeline assessment",
    "correctiveActions": ["Platform action"]
  },
  "actionPlan": {
    "summary": "Top 3 actions for this week",
    "actionCount": 3,
    "weeklyActions": [
      {
        "id": "action-1",
        "title": "Clear action title",
        "description": "What to do and why. Reference: ${responseRate}% response rate / ${totalApps} applications",
        "priority": "high",
        "timeEstimate": "X hours",
        "ctaLink": "resume-lab or job-board or campaigns"
      }
    ],
    "timing": {
      "bestDays": ["Tuesday", "Wednesday"],
      "bestTimes": "9:00 - 11:00 AM",
      "bestMonths": ["January", "September"],
      "insight": "Timing insight"
    },
    "salary": {
      "range": "€XX,XXX - €XX,XXX",
      "average": "€XX,XXX",
      "tips": ["Negotiation tip"]
    },
    "honestFeedback": "Action plan assessment",
    "correctiveActions": ["Immediate action in platform"]
  }
}

CRITICAL RULES:
1. Reference specific numbers: ${totalApps} applications, ${responseRate}% response rate, ${avgMatchScore}% match
2. ONLY recommend actions using: Resume Lab, Job Board, Campaigns, Mock Interview, CV Analysis, Application Tracking
3. Be decisive. No "consider" or "might want to"
4. Keep summaries to 1-2 sentences max
5. Return ONLY valid JSON, no markdown`;

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
      summary: `3 actions to improve your ${responseRate}% response rate`,
      actionCount: 3,
      weeklyActions: [
        {
          id: 'action-1',
          title: 'Optimize your CV in Resume Lab',
          description: `Your ${responseRate}% response rate suggests CV positioning issues. Use Resume Lab to strengthen your headline and achievements.`,
          priority: 'high',
          timeEstimate: '2 hours',
          isCorrective: true,
          ctaLink: 'resume-lab'
        },
        {
          id: 'action-2',
          title: 'Apply to 3 high-match roles',
          description: 'Focus on positions with 75%+ match score from the Job Board.',
          priority: 'high',
          timeEstimate: '1 hour',
          isCorrective: false,
          ctaLink: 'job-board'
        },
        {
          id: 'action-3',
          title: 'Launch an outreach campaign',
          description: 'Target hiring managers directly. Cold outreach can 3x your response rate.',
          priority: 'high',
          timeEstimate: '30 min',
          isCorrective: false,
          ctaLink: 'campaigns'
        }
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
          'Lead with your value and achievements, not your current salary'
        ]
      },
      honestFeedback: totalApps === 0
        ? 'Start by applying to 5-10 matched positions from the Job Board this week.'
        : `With ${totalApps} applications and ${responseRate}% response rate, ${responseRate < 15 ? 'fix CV positioning in Resume Lab first' : 'focus on Mock Interview preparation'}.`,
      correctiveActions: [
        'Use CV Analysis to identify keyword gaps',
        'Launch Campaign targeting your top 5 companies',
        'Practice in Mock Interview before any calls'
      ]
    }
  };
}

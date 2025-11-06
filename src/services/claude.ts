import { UserData } from '../types';
import axios from 'axios';
import { CompleteUserData } from '../lib/userDataFetcher';

export type RecommendationType = 'target-companies' | 'application-timing' | 'salary-insights' | 'job-strategy' | 'career-path' | 'skills-gap' | 'market-insights';

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

// Function to get ChatGPT recommendation (replacing Claude)
export const getClaudeRecommendation = async (prompt: string, type: RecommendationType, cvContent: string | null = null) => {
  try {
    console.log(`Sending request to ChatGPT API for ${type} recommendation`);
    
    // Add timeout to prevent hanging requests
    const response = await Promise.race([
      axios.post('/api/chatgpt', {
        prompt,
        type,
        cvContent
      }, {
        timeout: 60000 // 60 seconds timeout
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 60000)
      )
    ]) as any;
    
    if (response.data.status === 'success') {
      // Parse the JSON response from ChatGPT
      let content = response.data.content;
      if (typeof content === 'string') {
        try {
          // Try to extract JSON from markdown code blocks if present
          const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            content = JSON.parse(jsonMatch[1]);
          } else {
            content = JSON.parse(content);
          }
        } catch (e) {
          console.error('Error parsing ChatGPT response:', e);
          return {
            data: null,
            error: 'Failed to parse ChatGPT response as JSON'
          };
        }
      }
      
      return {
        data: content,
        error: null
      };
    } else {
      return {
        data: null,
        error: response.data.message || 'Unknown error'
      };
    }
  } catch (error: any) {
    console.error('Error getting ChatGPT recommendation:', error);
    
    // Better error messages
    let errorMessage = 'An unknown error occurred';
    if (error.code === 'ECONNREFUSED' || error.message?.includes('404')) {
      errorMessage = 'Server not available. Please make sure the server is running.';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      data: null,
      error: errorMessage
    };
  }
};

// Helper function to format complete user profile data as readable text
const formatCompleteProfile = (userData: CompleteUserData): string => {
  if (!userData) return "No profile data available.";
  
  let profile = `
=== USER PROFILE SUMMARY ===

Personal Information:
- Name: ${userData.firstName || ''} ${userData.lastName || ''}
- Email: ${userData.email || 'Not specified'}
- Phone: ${userData.phone || 'Not specified'}
- Location: ${userData.location || 'Not specified'}

Current Professional Status:
- Current Position: ${userData.currentPosition || userData.jobTitle || 'Not specified'}
- Job Title: ${userData.jobTitle || 'Not specified'}
- Industry: ${userData.industry || 'Not specified'}
- Years of Experience: ${userData.yearsOfExperience || 'Not specified'}
- Contract Type: ${userData.contractType || 'Not specified'}

Skills & Expertise:
${userData.skills && userData.skills.length > 0 ? 
  '- Skills: ' + userData.skills.join(', ') : 
  '- Skills: Not specified'}
${userData.tools && userData.tools.length > 0 ? 
  '- Tools & Technologies: ' + userData.tools.join(', ') : 
  '- Tools & Technologies: Not specified'}
${userData.certifications && userData.certifications.length > 0 ? 
  '- Certifications: ' + userData.certifications.map(c => `${c.name} (${c.issuer}, ${c.year})`).join(', ') : 
  '- Certifications: Not specified'}
${userData.education && userData.education.length > 0 ? 
  '- Education: ' + userData.education.join(', ') : 
  '- Education: Not specified'}

Career Objectives:
- Target Position: ${userData.targetPosition || 'Not specified'}
${userData.targetSectors && userData.targetSectors.length > 0 ? 
  '- Target Sectors: ' + userData.targetSectors.join(', ') : 
  '- Target Sectors: Not specified'}
- Salary Expectations: ${userData.salaryExpectations?.min || ''} - ${userData.salaryExpectations?.max || ''} ${userData.salaryExpectations?.currency || 'EUR'}
- Availability Date: ${userData.availabilityDate || 'Not specified'}

Mobility & Work Preferences:
- Willing to Relocate: ${userData.willingToRelocate ? 'Yes' : 'No'}
- Work Preference: ${userData.workPreference || 'Not specified'}
- Travel Preference: ${userData.travelPreference || 'Not specified'}
- Work-Life Balance Importance: ${userData.workLifeBalance || 'Not specified'}/10
- Preferred Company Culture: ${userData.companyCulture || 'Not specified'}
- Preferred Company Size: ${userData.preferredCompanySize || 'Not specified'}
${userData.sectorsToAvoid && userData.sectorsToAvoid.length > 0 ? 
  '- Sectors to Avoid: ' + userData.sectorsToAvoid.join(', ') : 
  '- Sectors to Avoid: Not specified'}
${userData.desiredCulture && userData.desiredCulture.length > 0 ? 
  '- Desired Culture: ' + userData.desiredCulture.join(', ') : 
  '- Desired Culture: Not specified'}

Professional Links:
${userData.linkedinUrl ? '- LinkedIn: ' + userData.linkedinUrl : ''}
${userData.portfolioUrl ? '- Portfolio: ' + userData.portfolioUrl : ''}
${userData.githubUrl ? '- GitHub: ' + userData.githubUrl : ''}

Job Search Statistics:
${userData.totalApplications ? '- Total Applications: ' + userData.totalApplications : ''}
${userData.responseRate ? '- Response Rate: ' + userData.responseRate + '%' : ''}
${userData.averageMatchScore ? '- Average Match Score: ' + userData.averageMatchScore + '%' : ''}
${userData.totalCampaigns ? '- Total Campaigns: ' + userData.totalCampaigns : ''}
`;

  // Add recent job applications details if available
  if (userData.applications && userData.applications.length > 0) {
    const recentApplications = userData.applications.slice(0, 10); // Last 10 applications
    profile += `
=== RECENT JOB APPLICATIONS ===
Total Applications: ${userData.applications.length}
Response Rate: ${userData.responseRate || 0}%

Recent Applications:
${recentApplications.map((app: any, index: number) => {
  return `${index + 1}. ${app.companyName || 'Unknown Company'} - ${app.position || 'Unknown Position'}
   - Status: ${app.status || 'applied'}
   - Applied Date: ${app.appliedDate || app.createdAt || 'Unknown'}
   - Location: ${app.location || 'Not specified'}
   ${app.salary ? `- Salary: ${app.salary}` : ''}
   ${app.notes ? `- Notes: ${app.notes.substring(0, 100)}` : ''}`;
}).join('\n')}

Application Patterns:
- Companies applied to: ${[...new Set(userData.applications.map((app: any) => app.companyName).filter(Boolean))].join(', ')}
- Positions applied to: ${[...new Set(userData.applications.map((app: any) => app.position).filter(Boolean))].join(', ')}
- Status distribution: ${userData.applications.reduce((acc: any, app: any) => {
  acc[app.status || 'applied'] = (acc[app.status || 'applied'] || 0) + 1;
  return acc;
}, {})}
`;
  }

  // Add campaign information if available
  if (userData.campaigns && userData.campaigns.length > 0) {
    profile += `
=== EMAIL CAMPAIGNS ===
Total Campaigns: ${userData.campaigns.length}
${userData.campaigns.slice(0, 5).map((campaign: any, index: number) => {
  return `${index + 1}. ${campaign.title || 'Untitled Campaign'}
   - Job Title: ${campaign.jobTitle || 'Not specified'}
   - Industry: ${campaign.industry || 'Not specified'}
   - Status: ${campaign.status || 'active'}
   - Emails Sent: ${campaign.emailsSent || 0}
   - Responses: ${campaign.responses || 0}`;
}).join('\n')}
`;
  }

  // Add CV content if available
  if (userData.cvContent) {
    profile += `
=== CV/RESUME CONTENT ===
${userData.cvContent.substring(0, 5000)}${userData.cvContent.length > 5000 ? '... (truncated)' : ''}
`;
  }

  return profile;
};

// Function to generate prompt (legacy - for backward compatibility)
export const generatePrompt = (type: RecommendationType, userData: any): string => {
  return generateEnhancedPrompt(type, userData as CompleteUserData);
};

// Enhanced function to generate prompt with complete user data
export const generateEnhancedPrompt = (type: RecommendationType, userData: CompleteUserData): string => {

  // Format basic job market data
  const jobMarket = `
=== CURRENT JOB MARKET CONTEXT ===
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
      return `You are an expert career coach specializing in company recommendations. You have access to the user's complete profile including their CV/Resume.

${formatCompleteProfile(userData)}
${jobMarket}

Based on the user's complete profile, CV content, skills, experience, preferences, and job search statistics provided above, please recommend 8-10 companies that would be an excellent match for them.

For each company, include:
- Company name
- Match percentage (0-100%) with detailed breakdown:
  * Skills match (30%)
  * Culture match (20%)
  * Location match (15%)
  * Salary match (15%)
  * Growth potential (10%)
  * Company size match (10%)
- Growth potential (Low/Medium/High) with brief explanation
- Size (number of employees or range like "50-200", "500-1000", etc.)
- Industry
- Location (city, country)
- 3-5 suitable roles at this company for the user, each with:
  * Role title
  * Level (Junior/Mid/Senior)
  * Match score for this specific role
  * Why this role fits
- A detailed explanation of why this company is a good match based on the user's profile, CV, and preferences
- Key strengths of the user's profile for this company
- Potential areas to improve to increase match score

Also include a comprehensive summary paragraph addressing the user directly, explaining your recommendations and providing actionable insights.

Format your response as a JSON object with a "companies" array containing the company recommendations and a "summary" string. Follow this exact format:

{
  "companies": [
    {
      "name": "",
      "match": "",
      "match_breakdown": {
        "skills": "",
        "culture": "",
        "location": "",
        "salary": "",
        "growth": "",
        "size": ""
      },
      "growth_potential": "",
      "growth_explanation": "",
      "size": "",
      "industry": "",
      "location": "",
      "suitable_roles": [
        {
          "title": "",
          "level": "",
          "match_score": "",
          "why_fits": ""
        }
      ],
      "why_match": "",
      "user_strengths": "",
      "improvement_areas": ""
    }
  ],
  "summary": ""
}`;

    case 'application-timing':
      return `You are an expert career coach specializing in job application strategies.
${formatCompleteProfile(userData)}
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
${formatCompleteProfile(userData)}
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
${formatCompleteProfile(userData)}
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

    case 'career-path':
      return `You are an expert career coach specializing in career path planning. You have access to the user's complete profile including their CV/Resume.

${formatCompleteProfile(userData)}
${jobMarket}

Based on the user's complete profile, CV content, skills, experience, preferences, and career objectives, please provide 3-4 personalized career path recommendations.

For each career path, include:
- Path name (e.g., "Natural Progression", "Career Pivot", "Fast-Track", "Entrepreneurial")
- Brief description of the path
- Timeline with milestones:
  * 6 months: position, skills to acquire, actions
  * 1 year: position, skills to acquire, actions
  * 3 years: position, skills to acquire, actions
  * 5 years: position, skills to acquire, actions
- Skills to acquire at each stage with:
  * Skill name
  * Why it's important
  * Resources to learn (courses, books, certifications)
  * Estimated time to master
- Intermediate positions suggested with:
  * Job title
  * Level (Junior/Mid/Senior)
  * Why it's a good stepping stone
- Network to develop:
  * People/roles to connect with
  * Communities to join
  * Events to attend
- Expected salaries at each milestone
- Probability of success based on the user's profile (High/Medium/Low) with explanation
- Key challenges and how to overcome them

Format your response as a JSON object with a "career_paths" array. Follow this exact format:

{
  "career_paths": [
    {
      "name": "",
      "description": "",
      "timeline": {
        "6_months": {
          "position": "",
          "skills": [""],
          "actions": [""]
        },
        "1_year": {
          "position": "",
          "skills": [""],
          "actions": [""]
        },
        "3_years": {
          "position": "",
          "skills": [""],
          "actions": [""]
        },
        "5_years": {
          "position": "",
          "skills": [""],
          "actions": [""]
        }
      },
      "skills_to_acquire": [
        {
          "skill": "",
          "importance": "",
          "resources": [""],
          "time_to_master": ""
        }
      ],
      "intermediate_positions": [
        {
          "title": "",
          "level": "",
          "why_stepping_stone": ""
        }
      ],
      "network_to_develop": {
        "people": [""],
        "communities": [""],
        "events": [""]
      },
      "expected_salaries": {
        "6_months": "",
        "1_year": "",
        "3_years": "",
        "5_years": ""
      },
      "success_probability": "",
      "success_explanation": "",
      "challenges": [""]
    }
  ]
}`;

    case 'skills-gap':
      return `You are an expert career coach specializing in skills gap analysis. You have access to the user's complete profile including their CV/Resume.

${formatCompleteProfile(userData)}
${jobMarket}

Based on the user's complete profile, CV content, skills, experience, and career objectives, please provide a comprehensive skills gap analysis.

Include the following:
- Top 5 critical missing skills:
  * Skill name
  * Why it's important for their career goals
  * Impact on salary (estimated € difference)
  * Impact on opportunities (estimated % of jobs they're missing)
  * Current level vs required level
  * Priority (High/Medium/Low)
- Personalized learning plan for each critical skill:
  * Free resources (courses, tutorials, articles)
  * Paid resources (certifications, bootcamps, courses)
  * Estimated time to master
  * Practical projects to work on
  * Recommended certifications
- Top 3 skills to strengthen (they have but need to improve):
  * Current level
  * Target level
  * Concrete actions to improve
  * Resources to use
- Emerging skills in their industry:
  * Skills/technologies that are rising in demand
  * Future opportunities these skills will unlock
  * When to start learning (now, 6 months, 1 year)
  * Learning path for each emerging skill

Format your response as a JSON object with a "skills_gap" object. Follow this exact format:

{
  "skills_gap": {
    "critical_missing_skills": [
      {
        "skill": "",
        "importance": "",
        "salary_impact": "",
        "opportunity_impact": "",
        "current_level": "",
        "required_level": "",
        "priority": ""
      }
    ],
    "learning_plans": [
      {
        "skill": "",
        "free_resources": [""],
        "paid_resources": [""],
        "time_to_master": "",
        "projects": [""],
        "certifications": [""]
      }
    ],
    "skills_to_strengthen": [
      {
        "skill": "",
        "current_level": "",
        "target_level": "",
        "actions": [""],
        "resources": [""]
      }
    ],
    "emerging_skills": [
      {
        "skill": "",
        "demand_trend": "",
        "future_opportunities": "",
        "when_to_start": "",
        "learning_path": [""]
      }
    ]
  }
}`;

    case 'market-insights':
      return `You are an expert career coach specializing in job market analysis. You have access to the user's complete profile including their CV/Resume.

${formatCompleteProfile(userData)}
${jobMarket}

Based on the user's complete profile, CV content, skills, experience, industry, and location, please provide comprehensive market insights.

Include the following:
- Market trends in their industry:
  * Sectors in growth (with growth %)
  * Skills in high demand (with demand increase %)
  * Hard-to-fill positions (with reasons)
  * Salary evolution trends
  * Remote work trends
- Hidden opportunities:
  * Companies actively hiring (5-7 companies)
  * Unpublished positions (hidden market strategies)
  * Promising startups (3-5 startups)
  * Emerging roles in their field
- Risks and opportunities:
  * Sectors in decline (with reasons)
  * Skills becoming obsolete (with timeline)
  * New opportunities emerging (with timeline)
  * Industry disruptions to watch
- Location-specific insights:
  * Job market health in their location
  * Best cities/regions for their profile
  * Remote work opportunities
  * Relocation opportunities if applicable
- Actionable recommendations:
  * Immediate actions (next 30 days)
  * Short-term actions (next 3 months)
  * Long-term actions (next 6-12 months)

Format your response as a JSON object with a "market_insights" object. Follow this exact format:

{
  "market_insights": {
    "trends": {
      "growing_sectors": [
        {
          "sector": "",
          "growth": "",
          "why": ""
        }
      ],
      "in_demand_skills": [
        {
          "skill": "",
          "demand_increase": "",
          "why": ""
        }
      ],
      "hard_to_fill_positions": [
        {
          "position": "",
          "reason": ""
        }
      ],
      "salary_trends": "",
      "remote_work_trends": ""
    },
    "hidden_opportunities": {
      "hiring_companies": [
        {
          "name": "",
          "why": ""
        }
      ],
      "hidden_market_strategies": [""],
      "promising_startups": [
        {
          "name": "",
          "why": ""
        }
      ],
      "emerging_roles": [""]
    },
    "risks_and_opportunities": {
      "declining_sectors": [
        {
          "sector": "",
          "reason": ""
        }
      ],
      "obsolete_skills": [
        {
          "skill": "",
          "timeline": ""
        }
      ],
      "emerging_opportunities": [
        {
          "opportunity": "",
          "timeline": ""
        }
      ],
      "disruptions": [""]
    },
    "location_insights": {
      "market_health": "",
      "best_locations": [""],
      "remote_opportunities": "",
      "relocation_opportunities": [""]
    },
    "recommendations": {
      "immediate": [""],
      "short_term": [""],
      "long_term": [""]
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
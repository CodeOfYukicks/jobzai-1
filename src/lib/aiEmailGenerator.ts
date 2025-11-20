import { queryPerplexity } from './perplexity';
import { JobApplication } from '../types/job';
import { UserProfile } from '../hooks/useUserProfile';

interface EmailGenerationResult {
  content: string;
  error?: boolean;
  errorMessage?: string;
}

/**
 * Generates a professional cover letter based on job application and user profile
 */
export async function generateCoverLetter(
  job: JobApplication,
  userProfile: UserProfile
): Promise<EmailGenerationResult> {
  try {
    // Build user context from profile
    const userContext = buildUserContext(userProfile);
    const jobContext = buildJobContext(job);
    
    const prompt = `You are an expert career coach and professional cover letter writer. Your task is to create a compelling, personalized cover letter that maximizes the candidate's chances of getting an interview.

**CANDIDATE PROFILE:**
${userContext}

**JOB OPPORTUNITY:**
${jobContext}

**YOUR TASK:**
Write a professional, authentic cover letter that:

1. **Opening Paragraph (Strong Hook)**:
   - Start with genuine enthusiasm for the specific role and company
   - Mention how you discovered the opportunity (if relevant)
   - Include a compelling statement about why THIS role at THIS company interests you
   - Keep it concise (3-4 sentences maximum)

2. **Body Paragraphs (Value Proposition - 2-3 paragraphs)**:
   - Paragraph 1: Highlight 2-3 most relevant experiences/achievements that directly match the job requirements
   - Use specific examples with quantifiable results when possible
   - Show how your background makes you uniquely qualified
   - Paragraph 2: Demonstrate understanding of the company's challenges/goals
   - Explain how your skills and experience can contribute to their success
   - Connect your career aspirations with the role's growth opportunities

3. **Closing Paragraph (Call to Action)**:
   - Express genuine interest in discussing how you can contribute
   - Thank them for their consideration
   - Indicate availability for an interview
   - Professional but warm closing

**CRITICAL GUIDELINES:**
- Tone: Professional yet personable, confident but not arrogant
- Length: 300-400 words (not too long, not too short)
- Voice: First person, active voice, strong action verbs
- Authenticity: Genuine enthusiasm, no clichés or generic phrases
- Customization: Specific to this role and company, not a template
- Format: Professional business letter format
- NO fluff or filler - every sentence must add value
- Show don't tell - use concrete examples over adjectives
- Research-based: Reference specific aspects of the company/role when possible

**WHAT TO AVOID:**
❌ Generic opening like "I am writing to express my interest..."
❌ Repeating resume content without adding context or achievements
❌ Overused phrases like "team player," "fast learner," "passionate professional"
❌ Being too humble or apologetic
❌ Focusing on what the job can do for you rather than what you bring
❌ Spelling/grammar errors or informal language
❌ Lengthy paragraphs (keep them digestible)

**FORMAT:**
Return ONLY the cover letter content (no subject line, no signature block with address). 
Start with: "Dear Hiring Manager," (or specific name if provided)
End with: "Sincerely," followed by the candidate's full name.

Generate the cover letter now:`;

    const response = await queryPerplexity(prompt);
    
    if (response.error) {
      return {
        content: '',
        error: true,
        errorMessage: response.errorMessage || 'Failed to generate cover letter'
      };
    }
    
    // Clean up the response
    let content = response.text || '';
    
    // Remove any markdown formatting
    content = content.replace(/```/g, '').trim();
    
    return {
      content: content
    };
  } catch (error) {
    console.error('Error generating cover letter:', error);
    return {
      content: '',
      error: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generates a professional follow-up email
 */
export async function generateFollowUp(
  job: JobApplication,
  userProfile: UserProfile
): Promise<EmailGenerationResult> {
  try {
    const userContext = buildUserContext(userProfile);
    const jobContext = buildJobContext(job);
    
    // Calculate days since application
    const appliedDate = new Date(job.appliedDate);
    const today = new Date();
    const daysSinceApplication = Math.floor((today.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const prompt = `You are an expert career coach specializing in professional follow-up communications. Your task is to create a polite, professional follow-up email that demonstrates continued interest without being pushy.

**CANDIDATE PROFILE:**
${userContext}

**JOB APPLICATION DETAILS:**
${jobContext}
- Applied: ${daysSinceApplication} days ago
- Current Status: ${job.status}
${job.notes ? `- Additional Context: ${job.notes}` : ''}

**YOUR TASK:**
Write a professional follow-up email that:

1. **Subject Line** (include this):
   - Clear and professional
   - Mentions the position and shows continued interest
   - Example: "Following Up: [Position Title] Application"

2. **Opening (1-2 sentences)**:
   - Polite greeting
   - Reference your application with position title and approximate date
   - Express continued strong interest

3. **Body (2-3 short paragraphs)**:
   - Reiterate your enthusiasm for the role and company
   - Briefly remind them of your key qualifications (1-2 specific points)
   - Show you've stayed engaged (recent company news, new relevant achievement, etc.)
   - Offer to provide additional information if needed

4. **Closing (2-3 sentences)**:
   - Thank them for their time and consideration
   - Express hope to hear from them soon
   - Professional closing with availability mention

**TONE & STYLE:**
- Professional but warm and personable
- Confident yet respectful
- Interested but not desperate
- Brief and to the point (150-250 words)
- Positive and enthusiastic without being over-the-top

**TIMING CONTEXT:**
${daysSinceApplication < 7 
  ? 'This is a relatively early follow-up - keep it brief and acknowledge that the process takes time.'
  : daysSinceApplication < 14 
  ? 'Standard follow-up timing - balance enthusiasm with patience.'
  : 'It\'s been a while - politely inquire about timeline while reaffirming interest.'}

**WHAT TO AVOID:**
❌ Sounding demanding or entitled to a response
❌ Being apologetic or self-deprecating
❌ Lengthy explanations or repeating entire resume
❌ Appearing desperate or overly eager
❌ Negative comments about the wait time
❌ Multiple follow-up questions that feel like an interrogation
❌ Generic template language

**FORMAT:**
Return the complete email including:
1. Subject line (prefixed with "Subject: ")
2. Greeting
3. Email body
4. Closing
5. Candidate's full name

Generate the follow-up email now:`;

    const response = await queryPerplexity(prompt);
    
    if (response.error) {
      return {
        content: '',
        error: true,
        errorMessage: response.errorMessage || 'Failed to generate follow-up email'
      };
    }
    
    // Clean up the response
    let content = response.text || '';
    
    // Remove any markdown formatting
    content = content.replace(/```/g, '').trim();
    
    return {
      content: content
    };
  } catch (error) {
    console.error('Error generating follow-up email:', error);
    return {
      content: '',
      error: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Helper function to build user context from profile
 */
function buildUserContext(profile: UserProfile): string {
  const parts: string[] = [];
  
  // Basic info
  if (profile.firstName || profile.lastName) {
    parts.push(`Name: ${[profile.firstName, profile.lastName].filter(Boolean).join(' ')}`);
  }
  if (profile.email) {
    parts.push(`Email: ${profile.email}`);
  }
  if (profile.location) {
    parts.push(`Location: ${profile.location}`);
  }
  
  // Professional info
  if (profile.currentJobTitle && profile.currentCompany) {
    parts.push(`Current Role: ${profile.currentJobTitle} at ${profile.currentCompany}`);
  } else if (profile.currentJobTitle) {
    parts.push(`Current Role: ${profile.currentJobTitle}`);
  }
  
  if (profile.yearsOfExperience) {
    parts.push(`Years of Experience: ${profile.yearsOfExperience}`);
  }
  
  if (profile.industry) {
    parts.push(`Industry: ${profile.industry}`);
  }
  
  // Summary
  if (profile.professionalSummary) {
    parts.push(`\nProfessional Summary:\n${profile.professionalSummary}`);
  }
  
  // Skills
  if (profile.skills && profile.skills.length > 0) {
    parts.push(`\nKey Skills: ${profile.skills.slice(0, 10).join(', ')}`);
  }
  
  // Recent work experience (top 2)
  if (profile.workExperience && profile.workExperience.length > 0) {
    parts.push('\nRecent Experience:');
    profile.workExperience.slice(0, 2).forEach(exp => {
      const dates = exp.endDate ? `${exp.startDate} - ${exp.endDate}` : `${exp.startDate} - Present`;
      parts.push(`- ${exp.title} at ${exp.company} (${dates})`);
      if (exp.description) {
        parts.push(`  ${exp.description.substring(0, 200)}${exp.description.length > 200 ? '...' : ''}`);
      }
    });
  }
  
  // Education (most recent)
  if (profile.education && profile.education.length > 0) {
    const edu = profile.education[0];
    parts.push(`\nEducation: ${edu.degree}${edu.field ? ` in ${edu.field}` : ''} from ${edu.institution} (${edu.year})`);
  }
  
  return parts.length > 0 ? parts.join('\n') : 'Limited profile information available';
}

/**
 * Helper function to build job context from application
 */
function buildJobContext(job: JobApplication): string {
  const parts: string[] = [];
  
  parts.push(`Company: ${job.companyName}`);
  parts.push(`Position: ${job.position}`);
  parts.push(`Location: ${job.location}`);
  
  if (job.description) {
    parts.push(`\nJob Summary:\n${job.description}`);
  }
  
  if (job.fullJobDescription) {
    // Use first 1000 chars of full description for context
    const desc = job.fullJobDescription.substring(0, 1500);
    parts.push(`\nFull Job Description:\n${desc}${job.fullJobDescription.length > 1500 ? '...' : ''}`);
  }
  
  if (job.url) {
    parts.push(`\nJob Posting URL: ${job.url}`);
  }
  
  return parts.join('\n');
}



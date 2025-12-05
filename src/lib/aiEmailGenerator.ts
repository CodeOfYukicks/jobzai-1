import { getOpenAIInstance } from './openai';
import { JobApplication } from '../types/job';
import { UserProfile } from '../hooks/useUserProfile';

interface EmailGenerationResult {
  content: string;
  error?: boolean;
  errorMessage?: string;
}

/**
 * Query GPT-4o for document generation
 * Uses OpenAI API for high-quality, clean document generation
 */
async function queryGPT(systemPrompt: string, userPrompt: string): Promise<EmailGenerationResult> {
  try {
    const openai = await getOpenAIInstance();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });
    
    const content = completion.choices[0]?.message?.content || '';
    
    // Basic cleanup (GPT doesn't have citations, but may have markdown)
    const cleaned = cleanGeneratedContent(content);
    
    return { content: cleaned };
  } catch (error) {
    console.error('Error querying GPT:', error);
    return {
      content: '',
      error: true,
      errorMessage: error instanceof Error ? error.message : 'Failed to generate content'
    };
  }
}

/**
 * Clean generated content - simplified for GPT (no citations to remove)
 */
function cleanGeneratedContent(content: string): string {
  let cleaned = content;
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/```/g, '');
  
  // Clean up any trailing whitespace on lines
  cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');
  
  // Remove excessive blank lines (more than 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}

/**
 * Generates a professional cover letter based on job application and user profile
 */
export async function generateCoverLetter(
  job: JobApplication,
  userProfile: UserProfile
): Promise<EmailGenerationResult> {
  const userContext = buildUserContext(userProfile);
  const jobContext = buildJobContext(job);
  
  const systemPrompt = `You are an elite career strategist and cover letter specialist. You create compelling, ATS-optimized cover letters that maximize interview potential.

WRITING FRAMEWORK:
1. Opening (3-4 sentences): Lead with enthusiasm for THIS role, reference a concrete achievement from CV
2. Body 1 (5-7 sentences): 2-3 SPECIFIC, QUANTIFIABLE achievements matching job requirements
3. Body 2 (4-6 sentences): Strategic fit, additional experiences solving their problems
4. Closing (3-4 sentences): Reaffirm enthusiasm, confident call to action

QUALITY STANDARDS:
- Tone: Professional, confident, evidence-based
- Length: 350-450 words
- Voice: First person, active voice, powerful action verbs
- Specificity: Every claim backed by CV evidence

OUTPUT FORMAT:
- Start with: "Dear Hiring Manager,"
- Clear paragraph breaks
- End with: "Sincerely," followed by candidate's full name
- Return ONLY the letter body, no explanations`;

  const userPrompt = `Generate a cover letter for:

CANDIDATE PROFILE:
${userContext}

JOB OPPORTUNITY:
${jobContext}`;

  return queryGPT(systemPrompt, userPrompt);
}

/**
 * Generates a professional follow-up email
 */
export async function generateFollowUp(
  job: JobApplication,
  userProfile: UserProfile
): Promise<EmailGenerationResult> {
  const userContext = buildUserContext(userProfile);
  const jobContext = buildJobContext(job);
  
  // Calculate days since application
  const appliedDate = new Date(job.appliedDate);
  const today = new Date();
  const daysSinceApplication = Math.floor((today.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const timingContext = daysSinceApplication < 7 
    ? 'Early follow-up - keep it brief, acknowledge process takes time.'
    : daysSinceApplication < 14 
    ? 'Standard timing - balance enthusiasm with patience.'
    : 'Been a while - politely inquire about timeline while reaffirming interest.';

  const systemPrompt = `You are an expert career coach specializing in professional follow-up communications. Create polite, professional follow-up emails that demonstrate continued interest without being pushy.

STRUCTURE:
1. Subject Line: Clear, professional, mentions position
2. Opening (1-2 sentences): Reference application, express continued interest
3. Body (2-3 short paragraphs): Enthusiasm, key qualifications, offer to provide more info
4. Closing (2-3 sentences): Thank them, professional sign-off

TONE: Professional, warm, confident, brief (150-250 words)

AVOID: Demanding tone, desperation, repeating resume, negative comments about wait time

OUTPUT: Return ONLY the email with Subject line first, then greeting, body, closing, and candidate's name. No explanations.`;

  const userPrompt = `Generate a follow-up email for:

CANDIDATE:
${userContext}

JOB APPLICATION:
${jobContext}
- Applied: ${daysSinceApplication} days ago
- Status: ${job.status}
${job.notes ? `- Notes: ${job.notes}` : ''}

TIMING: ${timingContext}`;

  return queryGPT(systemPrompt, userPrompt);
}

/**
 * Helper function to build user context from profile
 * Enhanced to utilize CV extracted data for superior personalization
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
  
  // ==========================================
  // ENHANCED: CV-EXTRACTED DATA (PRIORITY)
  // ==========================================
  
  // CV Technologies - Critical for technical matching
  if (profile.cvTechnologies && profile.cvTechnologies.length > 0) {
    parts.push(`\n🔧 TECHNICAL STACK (from CV):\n${profile.cvTechnologies.join(', ')}`);
    parts.push(`\n⚠️ PRIORITY: Match these technologies with job requirements and highlight relevant ones in the cover letter.`);
  }
  
  // CV Skills - Comprehensive skills from actual CV
  if (profile.cvSkills && profile.cvSkills.length > 0) {
    parts.push(`\n💼 PROFESSIONAL SKILLS (extracted from CV):\n${profile.cvSkills.join(', ')}`);
    parts.push(`⚠️ PRIORITY: Use these skills to demonstrate qualifications. These are verified from the actual CV.`);
  }
  
  // Full CV Text - Complete professional history and context
  if (profile.cvText && profile.cvText.trim().length > 0) {
    // Limit CV text to avoid token limits but provide substantial context
    const cvTextTrimmed = profile.cvText.substring(0, 3000);
    parts.push(`\n📄 COMPLETE CV CONTENT (Full Professional History):`);
    parts.push(`==========================================`);
    parts.push(cvTextTrimmed);
    if (profile.cvText.length > 3000) {
      parts.push(`\n[... CV content truncated for length, but above provides comprehensive professional background]`);
    }
    parts.push(`==========================================`);
    parts.push(`\n⚠️ CRITICAL INSTRUCTION: Use the COMPLETE CV CONTENT above as your PRIMARY source.`);
    parts.push(`Extract specific achievements, quantifiable results, project details, and technical expertise from this CV.`);
    parts.push(`This CV text contains the most accurate and detailed information about the candidate's experience.`);
  }
  
  // Fallback to profile fields if CV data not available
  if (!profile.cvSkills || profile.cvSkills.length === 0) {
    if (profile.skills && profile.skills.length > 0) {
      parts.push(`\nKey Skills (from profile): ${profile.skills.slice(0, 10).join(', ')}`);
    }
  }
  
  // Recent work experience (if CV text not available or as supplement)
  if (!profile.cvText || profile.cvText.trim().length === 0) {
    if (profile.workExperience && profile.workExperience.length > 0) {
      parts.push('\n📋 Recent Experience (from profile):');
      profile.workExperience.slice(0, 3).forEach(exp => {
        const dates = exp.endDate ? `${exp.startDate} - ${exp.endDate}` : `${exp.startDate} - Present`;
        parts.push(`\n• ${exp.title} at ${exp.company} (${dates})`);
        if (exp.description) {
          parts.push(`  ${exp.description}`);
        }
      });
    }
  }
  
  // Education (most recent)
  if (profile.education && profile.education.length > 0) {
    const edu = profile.education[0];
    parts.push(`\n🎓 Education: ${edu.degree}${edu.field ? ` in ${edu.field}` : ''} from ${edu.institution} (${edu.year})`);
  }
  
  // Languages if available
  if (profile.languages && profile.languages.length > 0) {
    const languageList = profile.languages.map(l => `${l.language} (${l.proficiency})`).join(', ');
    parts.push(`\n🌍 Languages: ${languageList}`);
  }
  
  // Certifications if available
  if (profile.certifications && profile.certifications.length > 0) {
    parts.push(`\n📜 Certifications:`);
    profile.certifications.slice(0, 3).forEach(cert => {
      parts.push(`  • ${cert.name} - ${cert.issuer} (${cert.date})`);
    });
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

/**
 * Generates interview preparation questions with suggested approaches
 */
export async function generateInterviewPrepQuestions(
  job: JobApplication,
  userProfile: UserProfile
): Promise<EmailGenerationResult> {
  const userContext = buildUserContext(userProfile);
  const jobContext = buildJobContext(job);

  const systemPrompt = `You are an expert interview coach. Generate likely interview questions with personalized suggested approaches.

OUTPUT FORMAT (use exactly this structure):

## Technical & Role-Specific Questions

1. **[Question]**
   💡 *Approach: [Brief suggestion referencing candidate's experience]*

2. **[Question]**
   💡 *Approach: [Brief suggestion]*

(Continue for 4-5 technical questions)

## Behavioral Questions (STAR Method)

1. **[Question]**
   💡 *Approach: [Specific experience from CV to reference]*

(Continue for 4-5 behavioral questions)

## Company & Culture Fit

1. **[Question]**
   💡 *Approach: [How to align with company values]*

(Continue for 2-3 questions)

REQUIREMENTS:
- Questions specific to THIS role and company
- Approaches reference candidate's ACTUAL CV experience
- Mix of common and unique questions
- Actionable, specific suggestions`;

  const userPrompt = `Generate interview prep questions for:

CANDIDATE:
${userContext}

JOB:
${jobContext}`;

  return queryGPT(systemPrompt, userPrompt);
}

/**
 * Generates smart questions for the candidate to ask the employer
 */
export async function generateQuestionsToAsk(
  job: JobApplication,
  userProfile: UserProfile
): Promise<EmailGenerationResult> {
  const jobContext = buildJobContext(job);
  
  // Determine seniority level from profile
  const seniorityLevel = userProfile.yearsOfExperience 
    ? (parseInt(userProfile.yearsOfExperience) > 8 ? 'senior' : parseInt(userProfile.yearsOfExperience) > 3 ? 'mid-level' : 'entry-level')
    : 'mid-level';

  const systemPrompt = `You are a career strategist helping a ${seniorityLevel} candidate prepare smart questions to ask during their interview.

OUTPUT FORMAT (use exactly this structure):

## About the Role & Day-to-Day
1. [Question showing research]
2. [Question about priorities/challenges]

## Team & Collaboration
3. [Question about team dynamics]
4. [Question about cross-functional work]

## Growth & Development
5. [Question about career progression]
6. [Question about learning opportunities]

## Company Culture & Vision
7. [Question about company direction]
8. [Question about team culture]

## Practical Considerations
9. [Question about success metrics]
10. [Question about next steps]

REQUIREMENTS:
- Questions specific to THIS company and role
- Avoid generic questions
- Show curiosity and strategic thinking
- Appropriate for a ${seniorityLevel} professional`;

  const userPrompt = `Generate 10 smart questions to ask for:

JOB:
${jobContext}`;

  return queryGPT(systemPrompt, userPrompt);
}

/**
 * Generates a thank you email to send after an interview
 */
export async function generateThankYouEmail(
  job: JobApplication,
  userProfile: UserProfile
): Promise<EmailGenerationResult> {
  const userContext = buildUserContext(userProfile);
  const jobContext = buildJobContext(job);
  
  // Get interview context if available
  const latestInterview = job.interviews?.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];
  
  const interviewContext = latestInterview 
    ? `Interview Type: ${latestInterview.type}\nDate: ${latestInterview.date}${latestInterview.notes ? `\nNotes: ${latestInterview.notes}` : ''}`
    : 'No specific interview details - write a general post-interview thank you';

  const systemPrompt = `You are an expert career coach specializing in post-interview thank you emails. Create compelling, professional emails that reinforce fit and leave lasting positive impressions.

STRUCTURE:
1. Subject Line: Professional, references position (e.g., "Thank You – [Position] Interview")
2. Opening (2-3 sentences): Gratitude, reference when you met, enthusiasm
3. Body (2-3 short paragraphs): Reference specific topic discussed, reinforce key qualification
4. Closing (2-3 sentences): Reaffirm interest, thank them, professional sign-off

TONE: Warm, professional, genuine, concise (150-200 words)

AVOID: Generic language, repeating resume, desperation, clichés

OUTPUT: Return ONLY the email with Subject line, greeting, body, closing, and candidate's name. No explanations.`;

  const userPrompt = `Generate a thank you email for:

CANDIDATE:
${userContext}

JOB:
${jobContext}

INTERVIEW:
${interviewContext}`;

  return queryGPT(systemPrompt, userPrompt);
}



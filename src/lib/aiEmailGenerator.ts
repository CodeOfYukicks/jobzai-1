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
    
    const prompt = `You are an elite career strategist and cover letter specialist with expertise in creating compelling, ATS-optimized application documents. Your mission is to craft a powerful, personalized cover letter that maximizes the candidate's interview potential by leveraging their complete professional background.

**📋 CANDIDATE'S COMPLETE PROFESSIONAL PROFILE:**
${userContext}

**🎯 TARGET JOB OPPORTUNITY:**
${jobContext}

**🚀 YOUR CRITICAL MISSION:**
Create an exceptional cover letter that strategically positions this candidate as the ideal fit by intelligently mining their CV data and aligning it perfectly with the job requirements.

**⭐ ENHANCED WRITING FRAMEWORK:**

**1. Opening Paragraph - Powerful Hook (3-4 sentences):**
   - Lead with genuine, specific enthusiasm for THIS role at THIS company
   - Reference a concrete achievement or skill from the CV that immediately demonstrates relevance
   - Create an instant connection between candidate's expertise and company's needs
   - Use an attention-grabbing insight or relevant industry knowledge
   ⚠️ MANDATORY: Scan the CV content for impressive, relevant achievements to feature upfront

**2. Body Paragraph 1 - Demonstrated Excellence (5-7 sentences):**
   - Mine the CV for 2-3 SPECIFIC, QUANTIFIABLE achievements that directly match job requirements
   - Use precise numbers, percentages, or scale from CV (e.g., "increased efficiency by 40%", "managed team of 15", "reduced costs by $200K")
   - Highlight technical stack/technologies from cvTechnologies that match job requirements
   - Emphasize relevant skills from cvSkills that align with job description
   - Use strong action verbs: spearheaded, architected, optimized, transformed, delivered
   - Structure: "In my role as [X] at [Company], I [specific achievement with metric]..."
   ⚠️ PRIORITY: Extract real project names, tools, and outcomes from the complete CV text

**3. Body Paragraph 2 - Strategic Fit & Value Addition (4-6 sentences):**
   - Demonstrate deep understanding of company's challenges, industry position, or growth stage
   - Connect 1-2 additional experiences from CV that show you can solve their specific problems
   - Reference cross-functional skills, leadership, or unique combinations from CV
   - Show how your background prepares you for future challenges in this role
   - Weave in relevant certifications, technologies, or methodologies from CV
   ⚠️ CRITICAL: Use the full CV content to identify unique selling points and differentiators

**4. Closing Paragraph - Confident Call to Action (3-4 sentences):**
   - Reaffirm enthusiasm with reference to specific company value/mission
   - Express confidence in ability to contribute based on proven track record (reference a key CV strength)
   - Clear, professional call to action: "I would welcome the opportunity to discuss how my experience in [specific area from CV] can contribute to [company's specific goal]"
   - Thank them professionally

**🎯 INTELLIGENT CV DATA UTILIZATION (MANDATORY):**
1. **If cvText is provided:** This is your GOLD MINE
   - Extract specific project names, technologies used, team sizes, budget figures
   - Find quantifiable achievements (%, $, timeframes, scale)
   - Identify unique combinations of skills or rare expertise
   - Look for leadership indicators, innovation, or problem-solving examples

2. **If cvTechnologies is provided:** 
   - Cross-reference with job requirements
   - Prioritize technologies that match the job description
   - Mention 3-5 most relevant technologies naturally in context
   - Example: "leveraging [tech stack from CV] to build [relevant achievement]"

3. **If cvSkills is provided:**
   - Align highlighted skills with job's required qualifications
   - Use these skills to frame achievements from CV text
   - Demonstrate skill application through concrete examples

**✨ ADVANCED QUALITY STANDARDS:**
- **Tone:** Professional yet authentic, confident and evidence-based (not boastful)
- **Length:** 350-450 words (substantial but focused)
- **Voice:** First person, active voice, powerful action verbs
- **Specificity:** Every claim backed by CV evidence - numbers, names, technologies, outcomes
- **Customization:** Deeply tailored to THIS role using candidate's ACTUAL experiences from CV
- **Technical Accuracy:** Use exact technology names and industry terminology from CV
- **ATS Optimization:** Naturally incorporate keywords from job description that match CV content
- **Storytelling:** Weave CV facts into a compelling narrative of capability and fit
- **Value Focus:** Every sentence answers "So what?" - shows impact and relevance

**🚫 STRICTLY AVOID:**
❌ Generic phrases without CV backing ("proven track record" without proof)
❌ Vague statements ("extensive experience" - BE SPECIFIC with CV data)
❌ Resume repetition without added context or achievement details
❌ Clichés: "team player," "fast learner," "out-of-the-box thinker," "passionate professional"
❌ Humility that undermines achievements ("I think I might be able to...")
❌ Focusing on benefits to candidate rather than value to employer
❌ Ignoring the rich CV data provided - USE IT EXTENSIVELY
❌ Making claims not supported by the CV content
❌ Being overly technical without context or results
❌ Long, dense paragraphs (break into digestible 4-7 sentence blocks)

**📝 OUTPUT FORMAT:**
- Start with: "Dear Hiring Manager," (or specific name if available in job posting)
- Use clear paragraph breaks for readability
- End with: "Sincerely," followed by candidate's full name
- NO address blocks, NO subject line, NO header/footer
- Return ONLY the letter body

**🎯 FINAL MANDATE:**
This candidate has provided their complete CV. Your cover letter must demonstrate you've thoroughly analyzed it by incorporating specific, verifiable details that prove this candidate is exceptional and perfectly suited for this role. Make every word count.

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



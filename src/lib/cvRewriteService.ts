/**
 * CV Rewrite Service - Ultra Quality Edition
 * Generates AI-powered CV rewrites tailored to specific job descriptions
 * WITHOUT inventing false information
 * 
 * Uses the FULL richness of ATS analysis data for maximum impact
 */

import { CVRewrite, AdaptationLevel } from '../types/premiumATS';

/**
 * Enriched strength data from ATS analysis
 */
interface EnrichedStrength {
  name: string;
  example_from_resume?: string;
  why_it_matters?: string;
}

/**
 * Enriched gap data from ATS analysis
 */
interface EnrichedGap {
  name: string;
  severity?: 'Low' | 'Medium' | 'High';
  how_to_fix?: string;
  why_it_matters?: string;
}

/**
 * Full ATS analysis data for ultra-quality rewriting
 */
interface EnrichedATSAnalysis {
  // Core data
  matchScore: number;

  // Enriched strengths with context
  strengths: EnrichedStrength[];

  // Enriched gaps with resolution strategies
  gaps: EnrichedGap[];

  // Keywords with priority distinction
  keywords: {
    missing: string[];
    priority_missing?: string[];  // High-priority keywords to integrate first
    found?: string[];             // Already present, to reinforce
  };

  // Pre-generated CV fixes from analysis
  cvFixes?: {
    high_impact_bullets_to_add?: string[];
    bullets_to_rewrite?: string[];
    keywords_to_insert?: string[];
    sections_to_reorder?: string[];
    estimated_score_gain?: number;
  };

  // Job understanding from analysis
  jobSummary?: {
    hidden_expectations?: string[];
    core_requirements?: string[];
    mission?: string;
  };

  // Strategic positioning guidance
  positioning?: string;
}

/**
 * Input for CV rewriting - now with full ATS richness
 */
interface CVRewriteInput {
  cvText: string;
  jobDescription: string;
  atsAnalysis: EnrichedATSAnalysis;
  jobTitle: string;
  company: string;
  adaptationLevel?: AdaptationLevel; // Controls rewriting intensity
}

/**
 * Helper: Format enriched strengths for prompt
 */
function formatEnrichedStrengths(strengths: EnrichedStrength[]): string {
  return strengths.map((s, i) => {
    const lines = [`${i + 1}. **${s.name}**`];
    if (s.example_from_resume) {
      lines.push(`   📌 Proof in CV: "${s.example_from_resume}"`);
    }
    if (s.why_it_matters) {
      lines.push(`   💡 Why it matters: ${s.why_it_matters}`);
    }
    return lines.join('\n');
  }).join('\n\n');
}

/**
 * Helper: Format enriched gaps with resolution strategies
 */
function formatEnrichedGaps(gaps: EnrichedGap[]): string {
  return gaps.map((g, i) => {
    const severity = g.severity || 'Medium';
    const severityEmoji = severity === 'High' ? '🔴' : severity === 'Medium' ? '🟡' : '🟢';
    const lines = [`${i + 1}. ${severityEmoji} **${g.name}** (${severity} priority)`];
    if (g.how_to_fix) {
      lines.push(`   ✅ HOW TO ADDRESS: ${g.how_to_fix}`);
    }
    if (g.why_it_matters) {
      lines.push(`   ⚠️ Why it matters: ${g.why_it_matters}`);
    }
    return lines.join('\n');
  }).join('\n\n');
}

/**
 * Helper: Format CV fixes as actionable guidance
 */
function formatCVFixes(cvFixes: EnrichedATSAnalysis['cvFixes']): string {
  if (!cvFixes) return 'No specific fixes provided.';

  const sections: string[] = [];

  if (cvFixes.high_impact_bullets_to_add?.length) {
    sections.push(`**High-Impact Bullets to Add (use these as inspiration):**\n${cvFixes.high_impact_bullets_to_add.map(b => `• ${b}`).join('\n')}`);
  }

  if (cvFixes.keywords_to_insert?.length) {
    sections.push(`**Keywords to Insert Strategically:**\n${cvFixes.keywords_to_insert.join(', ')}`);
  }

  if (cvFixes.bullets_to_rewrite?.length) {
    sections.push(`**Bullets That Need Rewriting:**\n${cvFixes.bullets_to_rewrite.map(b => `• ${b}`).join('\n')}`);
  }

  if (cvFixes.estimated_score_gain) {
    sections.push(`**Estimated Score Gain if Implemented:** +${cvFixes.estimated_score_gain}%`);
  }

  return sections.join('\n\n') || 'No specific fixes provided.';
}

/**
 * Helper: Format job summary insights
 */
function formatJobSummaryInsights(jobSummary: EnrichedATSAnalysis['jobSummary']): string {
  if (!jobSummary) return '';

  const sections: string[] = [];

  if (jobSummary.mission) {
    sections.push(`**Mission of this Role:**\n${jobSummary.mission}`);
  }

  if (jobSummary.core_requirements?.length) {
    sections.push(`**Core Requirements (must address):**\n${jobSummary.core_requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}`);
  }

  if (jobSummary.hidden_expectations?.length) {
    sections.push(`**🎯 Hidden Expectations (what they REALLY want but don't say):**\n${jobSummary.hidden_expectations.map((e, i) => `${i + 1}. ${e}`).join('\n')}`);
  }

  return sections.join('\n\n');
}

/**
 * Get level-specific configuration for CV rewriting
 * Controls keyword count, intensity, and transformation depth
 */
function getLevelConfig(level: AdaptationLevel): {
  keywords: string;
  intensity: string;
  scoreGoal: string;
  approach: string;
} {
  switch (level) {
    case 'conservative':
      return {
        keywords: '3-5',
        intensity: 'LOW - preserve original voice',
        scoreGoal: '5-10%',
        approach: 'Minimal changes: fix grammar, add few keywords naturally, keep original tone and structure.'
      };
    case 'balanced':
      return {
        keywords: '10-15',
        intensity: 'MODERATE - enhance while authentic',
        scoreGoal: '15-25%',
        approach: 'Balanced optimization: stronger verbs, integrate keywords, improve summary with Hook+Proof+Value format, add metrics where data exists.'
      };
    case 'optimized':
      return {
        keywords: '20+',
        intensity: 'HIGH - maximum transformation',
        scoreGoal: '30-40%',
        approach: 'Full transformation: powerful action verbs, saturate with keywords, rewrite summary for job requirements, elevate to senior-level tone, maximize ATS compatibility.'
      };
    default:
      return getLevelConfig('balanced');
  }
}

/**
 * Get detailed level-specific instructions for CV rewriting
 * These instructions dramatically change how the AI rewrites the CV
 */
function getLevelSpecificInstructions(level: AdaptationLevel): {
  bulletPointRules: string;
  summaryRules: string;
  strictRules: string;
  examples: string;
} {
  switch (level) {
    case 'conservative':
      return {
        bulletPointRules: `### Bullet Points (CONSERVATIVE - Minimal Changes)
- KEEP 80%+ of the original wording intact
- Only fix grammar, spelling, and punctuation errors
- Add maximum 1 keyword per bullet point IF it fits naturally
- Do NOT change the sentence structure significantly
- Keep the original tone and voice of the candidate
- Preserve all original metrics and numbers exactly as written
- Only replace weak verbs if they are very obvious (e.g., "did" → "completed")`,

        summaryRules: `### Professional Summary (CONSERVATIVE)
- Keep the original summary structure and length
- Only fix grammar and improve clarity slightly
- Add 1-2 keywords if they fit naturally into existing sentences
- Do NOT rewrite entirely - just polish what's there`,

        strictRules: `### Strict Rules (CONSERVATIVE MODE)
- PRESERVE the original wording as much as possible (80%+ unchanged)
- Use ONLY information from the original CV
- Keep EXACT same number of experiences and educations  
- Never invent metrics, achievements, or experiences
- Never change job titles, company names, or dates
- If a bullet is already good, LEAVE IT UNCHANGED
- Only make changes that are absolutely necessary`,

        examples: `### Before/After Examples (CONSERVATIVE)
ORIGINAL: "Worked on improving the sales process"
CONSERVATIVE: "Worked on improving the sales process using CRM tools"
(Only added keyword "CRM tools" - kept original structure)

ORIGINAL: "Helped the team with customer support tasks"
CONSERVATIVE: "Helped the team with customer support tasks and ticket resolution"
(Minimal change - added one relevant term)

ORIGINAL: "Was responsible for managing social media"
CONSERVATIVE: "Responsible for managing social media accounts"
(Fixed passive voice slightly, kept most of original)`
      };

    case 'balanced':
      return {
        bulletPointRules: `### Bullet Points (BALANCED - Professional Enhancement)
- REWRITE bullets using stronger action verbs while keeping the core meaning
- Replace weak verbs (worked, helped, did) with stronger ones (Led, Developed, Implemented)
- Integrate 2-3 keywords per experience naturally into the sentences
- Maintain the candidate's authentic voice but make it more professional
- Keep existing metrics, add context where helpful (e.g., "team of 5" → "cross-functional team of 5")
- Aim for 15-20 words per bullet point
- Structure: [Action Verb] + [What] + [Result/Impact]`,

        summaryRules: `### Professional Summary (BALANCED - Hook+Proof+Value)
- REWRITE the summary using Hook+Proof+Value format (40-50 words total):
  * HOOK (10 words): Lead with years of experience + role match
  * PROOF (20 words): One quantified achievement from the CV
  * VALUE (15 words): What you bring to the target company
- Integrate 3-4 priority keywords naturally
- Make it compelling but authentic`,

        strictRules: `### Strict Rules (BALANCED MODE)
- Rewrite content professionally while preserving factual accuracy
- Use ONLY information from the original CV
- Keep EXACT same number of experiences and educations  
- Never invent metrics - but you CAN highlight existing ones more prominently
- Never change job titles, company names, or dates
- Transform weak bullets into strong ones, but keep the core achievement
- ALWAYS extract name, firstName, lastName, and professional title from the CV header`,

        examples: `### Before/After Examples (BALANCED)
ORIGINAL: "Worked on improving the sales process"
BALANCED: "Optimized sales process workflows, contributing to improved team efficiency and revenue growth"
(Stronger verb, added business impact, integrated keywords)

ORIGINAL: "Helped the team with customer support tasks"
BALANCED: "Collaborated with customer success team to resolve support tickets and enhance client satisfaction"
(Professional language, keywords integrated, clearer impact)

ORIGINAL: "Was responsible for managing social media"
BALANCED: "Managed social media strategy across 4 platforms, driving engagement and brand visibility"
(Action verb, quantification, clear results)`
      };

    case 'optimized':
      return {
        bulletPointRules: `### Bullet Points (OPTIMIZED - MAXIMUM TRANSFORMATION)
⚠️ COMPLETELY REWRITE EVERY SINGLE BULLET POINT - No bullet should remain unchanged!
- Transform EVERY bullet into a powerful achievement statement
- Use POWER VERBS: Spearheaded, Orchestrated, Architected, Pioneered, Revolutionized, Championed, Accelerated
- SATURATE with keywords: Include 3-4 keywords per bullet when relevant
- Add quantification estimates with ~ if reasonable (e.g., "improved efficiency" → "improved efficiency by ~25%")
- Elevate tone to SENIOR/EXECUTIVE level language
- Structure: [Power Verb] + [Strategic Action] + [Quantified Business Impact]
- Each bullet should demonstrate LEADERSHIP, STRATEGY, and MEASURABLE RESULTS
- Front-load the most impressive achievements
- Max 22 words per bullet, 4-6 bullets per experience`,

        summaryRules: `### Professional Summary (OPTIMIZED - Executive Positioning)
- COMPLETELY REWRITE as a powerful executive summary (50-60 words):
  * HOOK: Position as the ideal candidate with exact job title match
  * CREDENTIALS: Years of experience + key domain expertise
  * ACHIEVEMENTS: 2 quantified wins from the CV
  * VALUE PROP: Clear statement of what you deliver
- SATURATE with 5-6 priority keywords
- Use confident, executive-level language
- Make it impossible to ignore`,

        strictRules: `### Strict Rules (OPTIMIZED MODE - Maximum Impact)
- REWRITE EVERYTHING - No content should remain in its original form
- Transform every bullet into a powerful achievement statement
- You MAY add reasonable estimates with ~ prefix (e.g., ~20%, ~15 team members) based on context
- Keep job titles, company names, and dates exactly as original
- Never INVENT new achievements, but you CAN elevate how existing achievements are described
- Ensure 20+ keyword mentions across the entire CV
- Every sentence should demonstrate value and impact
- ALWAYS extract name, firstName, lastName, and professional title from the CV header`,

        examples: `### Before/After Examples (OPTIMIZED)
ORIGINAL: "Worked on improving the sales process"
OPTIMIZED: "Spearheaded end-to-end sales process transformation leveraging CRM automation, accelerating pipeline velocity by ~30% and driving revenue growth across the organization"
(Complete transformation: power verb, keywords saturated, estimated metric, executive tone)

ORIGINAL: "Helped the team with customer support tasks"
OPTIMIZED: "Orchestrated customer success initiatives across cross-functional teams, implementing data-driven support workflows that reduced ticket resolution time by ~40% and elevated NPS scores"
(Elevated to leadership language, keywords integrated, quantified impact)

ORIGINAL: "Was responsible for managing social media"
OPTIMIZED: "Pioneered integrated digital marketing strategy spanning 5 social platforms, architecting content campaigns that amplified brand engagement by ~150% and generated ~$200K in attributed pipeline"
(Executive language, multiple keywords, impressive metrics with estimates)`
      };

    default:
      return getLevelSpecificInstructions('balanced');
  }
}

/**
 * Generate optimized CV rewriting prompt
 * Streamlined version: ~200 lines instead of 500+, 3x cheaper, more reliable
 */
function generateCVRewritePrompt(input: CVRewriteInput): string {
  const priorityKeywords = input.atsAnalysis.keywords.priority_missing || [];
  const missingKeywords = input.atsAnalysis.keywords.missing.filter(k => !priorityKeywords.includes(k));
  const adaptationLevel = input.adaptationLevel || 'balanced';
  const levelConfig = getLevelConfig(adaptationLevel);
  const levelInstructions = getLevelSpecificInstructions(adaptationLevel);

  // Format strengths and gaps concisely
  const strengths = (input.atsAnalysis.strengths || []).map(s => s.name).filter(Boolean).join(', ') || 'None identified';
  const gaps = (input.atsAnalysis.gaps || []).map(g => g.name).filter(Boolean).join(', ') || 'None identified';

  // Level-specific keyword integration rules
  const keywordRules = adaptationLevel === 'conservative'
    ? `### Keyword Integration (CONSERVATIVE - Light Touch)
1. SUMMARY: Add 1-2 keywords ONLY if they fit naturally into existing sentences
2. EXPERIENCES: Add maximum 1 keyword per bullet WHERE IT FITS NATURALLY
3. SKILLS: Include priority keywords in skills section
4. DO NOT force keywords - if it sounds unnatural, skip it
5. Preserve the candidate's original voice and wording`
    : adaptationLevel === 'balanced'
      ? `### Keyword Integration (BALANCED - Natural Enhancement)
1. SUMMARY: Integrate 3-4 priority keywords naturally
2. EXPERIENCES: Include 2-3 keywords per experience in rewritten bullets
3. SKILLS: List ALL priority keywords in skills section
4. PLACEMENT: Front-load keywords in the first 2 experiences
5. Rephrase bullets to include keywords while maintaining authenticity
   Example: "Managed team" → "Led cross-functional team using Agile methodologies"`
      : `### Keyword Integration (OPTIMIZED - MAXIMUM SATURATION)
1. SUMMARY: SATURATE with 5-6 priority keywords - make it keyword-rich
2. EXPERIENCES: Include 3-4 keywords PER BULLET - maximize keyword density
3. SKILLS: List ALL priority keywords + secondary keywords
4. EVERY BULLET must contain at least 2 keywords from the job description
5. Aim for 20+ total keyword mentions across the CV
6. Transform weak phrases into keyword-rich power statements
   Example: "Managed team" → "Orchestrated high-performance cross-functional teams leveraging Agile and Scrum methodologies"
   Example: "Did marketing" → "Spearheaded data-driven digital marketing campaigns, architecting SEO strategy and content marketing initiatives"`;

  return `You are an expert CV strategist. Your task is to rewrite this CV according to the SPECIFIC ADAPTATION LEVEL selected by the user.

## ⚠️ CRITICAL: ADAPTATION LEVEL = ${adaptationLevel.toUpperCase()}
This is a **${adaptationLevel.toUpperCase()}** level rewrite. You MUST follow the ${adaptationLevel}-specific rules below EXACTLY.
${adaptationLevel === 'conservative' ? '→ Make MINIMAL changes - preserve 80%+ of original wording' : ''}
${adaptationLevel === 'balanced' ? '→ Make PROFESSIONAL enhancements - rewrite with stronger verbs while staying authentic' : ''}
${adaptationLevel === 'optimized' ? '→ Make MAXIMUM transformation - COMPLETELY REWRITE every bullet with power verbs and keyword saturation' : ''}

## TASK
Optimize CV for: **${input.jobTitle}** at **${input.company}**
Current match: ${input.atsAnalysis.matchScore}% → Target improvement: +${levelConfig.scoreGoal}
Intensity: ${levelConfig.intensity}

## JOB DESCRIPTION
${input.jobDescription}

## ORIGINAL CV
${input.cvText}

## KEYWORDS TO INTEGRATE (Target: ${levelConfig.keywords} keywords)
Priority (MUST include): ${priorityKeywords.slice(0, 15).join(', ') || 'Extract from job description'}
Secondary: ${missingKeywords.slice(0, 10).join(', ') || 'None'}

${keywordRules}

## ATS INSIGHTS
Strengths to amplify: ${strengths}
Gaps to address: ${gaps}

## REWRITING RULES FOR ${adaptationLevel.toUpperCase()} LEVEL

${levelInstructions.summaryRules}

${levelInstructions.bulletPointRules}

${levelInstructions.strictRules}

${levelInstructions.examples}

## OUTPUT (JSON only)

IMPORTANT: Extract ALL personal information from the CV header (name, email, phone, location, LinkedIn, professional title).

{
  "structured_data": {
    "personalInfo": {
      "name": "<REQUIRED: full name from CV, e.g. 'John Smith'>",
      "firstName": "<REQUIRED: first name only, e.g. 'John'>",
      "lastName": "<REQUIRED: last name only, e.g. 'Smith'>",
      "title": "<REQUIRED: professional title/headline from CV, e.g. 'Senior Product Manager' or 'Digital Marketing Specialist'>",
      "email": "<email if present>",
      "phone": "<phone if present>",
      "location": "<city/country if present>",
      "linkedin": "<linkedin url if present>"
    },
    "summary": "<rewritten summary, 40-50 words, Hook+Proof+Value format>",
    "experiences": [
      {
        "id": "exp-0",
        "title": "<exact job title from original>",
        "company": "<exact company from original>",
        "client": "<client name if consulting role>",
        "startDate": "<exact from original>",
        "endDate": "<exact from original or 'Present'>",
        "location": "<location if mentioned>",
        "bullets": [
          "<rewritten bullet with power verb and impact>",
          "<all bullets from original, rewritten>"
        ]
      }
    ],
    "educations": [
      {
        "id": "edu-0",
        "degree": "<exact degree from original>",
        "institution": "<exact institution>",
        "endDate": "<graduation year>",
        "details": "<honors, GPA if mentioned>"
      }
    ],
    "skills": ["<MUST include ALL priority keywords here>", "<plus other relevant skills from CV>"],
    "languages": [{"name": "<language>", "level": "<Native/Fluent/Intermediate/Basic>"}],
    "certifications": [{"name": "<cert name>", "issuer": "<issuer>", "year": "<year if known>"}],
    "hobbies": ["<hobby1>", "<hobby2>"]
  },
  "analysis": {
    "positioning_strategy": "<2-3 sentences: the winning narrative angle for this candidate>",
    "key_improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
    "keywords_integrated": ["<list of priority keywords you successfully integrated into the CV>"]
  },
  "suggested_additions": [
    {
      "bullet": "<relevant achievement that couldn't fit naturally>",
      "target_experience_id": "exp-0",
      "reason": "<why important for this job>"
    }
  ]
}

CRITICAL VALIDATION:
- structured_data.experiences.length MUST equal original CV experience count
- structured_data.educations.length MUST equal original CV education count
- Return valid JSON only, no markdown code blocks`;
}

/**
 * Call OpenAI API via server endpoint to generate the CV rewrite
 * Uses the existing /api/chatgpt endpoint which has access to the API key in Firestore
 */
async function callOpenAIForRewrite(prompt: string): Promise<any> {
  // Use the server endpoint instead of calling OpenAI directly (more secure)
  // The endpoint expects: { prompt: string, type?: string }
  const response = await fetch('/api/chatgpt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      type: 'cv-rewrite', // Custom type for logging/tracking
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Server error' }));
    throw new Error(errorData.message || 'Failed to generate CV rewrite');
  }

  const data = await response.json();

  // The /api/chatgpt endpoint returns: { status: 'success', content: {...} }
  if (data.status === 'error') {
    throw new Error(data.message || 'CV generation failed');
  }

  // Extract content
  let content = data.content;

  // If content is a string, parse it as JSON
  if (typeof content === 'string') {
    try {
      // Strip markdown code blocks if present (AI sometimes wraps JSON in ```json...```)
      let cleanedContent = content.trim();

      // Remove ```json or ``` at the start
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }

      // Remove ``` at the end
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }

      cleanedContent = cleanedContent.trim();

      content = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('Failed to parse CV rewrite response:', content);
      throw new Error('Failed to parse CV rewrite response as JSON');
    }
  }

  return content;
}

/**
 * Rebuild markdown from structured CV data
 */
function rebuildMarkdownFromStructured(structuredData: any): string {
  const { personalInfo, summary, experience, education, skills, certifications, languages, hobbies } = structuredData;

  const lines: string[] = [];

  // Header
  const name = personalInfo?.name || `${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''}`.trim() || 'Your Name';
  lines.push(`# ${name}`);

  if (personalInfo?.title) lines.push(`Professional Title: ${personalInfo.title}`);
  if (personalInfo?.location) lines.push(`Location: ${personalInfo.location}`);
  if (personalInfo?.email) lines.push(`Email: ${personalInfo.email}`);
  if (personalInfo?.phone) lines.push(`Phone: ${personalInfo.phone}`);
  if (personalInfo?.linkedin) lines.push(`LinkedIn: ${personalInfo.linkedin}`);

  lines.push('');

  // Summary
  if (summary) {
    lines.push('## Professional Summary');
    lines.push(summary);
    lines.push('');
  }

  // Experiences
  if (experience && experience.length > 0) {
    lines.push('## Professional Experience');
    lines.push('');
    experience.forEach((exp: any) => {
      // Inclure le client dans le titre si disponible (priorité au client sur l'entreprise)
      const companyDisplay = exp.client ? exp.client : (exp.company || 'Unknown');
      const companySuffix = exp.client && exp.company && exp.company !== exp.client ? ` (via ${exp.company})` : '';
      lines.push(`### ${exp.title} - ${companyDisplay}${companySuffix}`);
      const period = exp.isCurrent
        ? `${exp.startDate} – Present`
        : `${exp.startDate} – ${exp.endDate}`;
      lines.push(period);
      if (exp.bullets && Array.isArray(exp.bullets)) {
        exp.bullets.forEach((bullet: string) => {
          lines.push(`- ${bullet}`);
        });
      }
      lines.push('');
    });
  }

  // Education
  if (education && education.length > 0) {
    lines.push('## Education');
    lines.push('');
    education.forEach((edu: any) => {
      lines.push(`### ${edu.degree} - ${edu.institution}`);
      if (edu.year || edu.endDate) {
        lines.push(edu.year || edu.endDate);
      }
      if (edu.details) {
        lines.push(edu.details);
      }
      lines.push('');
    });
  }

  // Skills
  if (skills && skills.length > 0) {
    lines.push('## Skills');
    const skillsList = Array.isArray(skills)
      ? skills.map((s: any) => typeof s === 'string' ? s : s.name).join(', ')
      : skills;
    lines.push(skillsList);
    lines.push('');
  }

  // Certifications
  if (certifications && certifications.length > 0) {
    lines.push('## Certifications');
    lines.push('');
    certifications.forEach((cert: any) => {
      const issuer = cert.issuer ? ` - ${cert.issuer}` : '';
      lines.push(`### ${cert.name}${issuer}`);
      if (cert.year || cert.date) {
        lines.push(cert.year || cert.date);
      }
      if (cert.details) {
        lines.push(cert.details);
      }
      lines.push('');
    });
  }

  // Languages
  if (languages && languages.length > 0) {
    lines.push('## Languages');
    languages.forEach((lang: any) => {
      const level = lang.level ? ` | ${lang.level}` : '';
      const langName = typeof lang === 'string' ? lang : lang.name;
      lines.push(`${langName}${level}`);
    });
    lines.push('');
  }

  // Hobbies
  if (hobbies && hobbies.length > 0) {
    lines.push('## Hobbies & Interests');
    const hobbiesList = Array.isArray(hobbies) ? hobbies.join(', ') : hobbies;
    lines.push(hobbiesList);
  }

  return lines.join('\n').trim();
}

/**
 * Main function to generate CV rewrite
 */
export async function generateCVRewrite(input: CVRewriteInput): Promise<CVRewrite> {
  // Import dependencies dynamically to avoid circular dependencies
  const { parseCVData } = await import('./cvSectionAI');
  const { rewriteSingleExperience } = await import('./experienceRewriter');
  const { extractFullProfileFromText } = await import('./cvExperienceExtractor');

  // Get adaptation level (default to balanced)
  const adaptationLevel = input.adaptationLevel || 'balanced';
  console.log(`🎚️ Adaptation Level: ${adaptationLevel.toUpperCase()}`);

  // 1. STEP 1: Use AI to extract and structure the original CV properly
  // This is CRITICAL for accurate before/after comparison
  console.log('🔍 Step 1: Extracting original CV structure with AI...');
  let extractedOriginal: any;
  try {
    extractedOriginal = await extractFullProfileFromText(input.cvText);
    console.log(`✅ AI extraction complete:`, {
      experiences: extractedOriginal.experiences?.length || 0,
      educations: extractedOriginal.educations?.length || 0,
      skills: extractedOriginal.skills?.length || 0,
      summary: extractedOriginal.summary ? 'Yes' : 'No'
    });
  } catch (error) {
    console.error('❌ AI extraction failed, falling back to regex parsing:', error);
    // Fallback to regex parsing if AI fails
    const parsed = parseCVData({ initial_cv: input.cvText });
    extractedOriginal = {
      personalInfo: parsed.personalInfo || {},
      summary: parsed.summary || '',
      experiences: (parsed.experience || []).map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        startDate: exp.startDate,
        endDate: exp.endDate,
        current: exp.isCurrent,
        responsibilities: exp.bullets || exp.description || [],
      })),
      educations: parsed.education || [],
      skills: parsed.skills || [],
      languages: parsed.languages || [],
    };
  }

  // Map extracted experiences to the format used by the rest of the code
  // IMPORTANT: Store original bullets in a SEPARATE copy to avoid mutation issues
  const originalExperiences = (extractedOriginal.experiences || []).map((exp: any, idx: number) => {
    // Get bullets from multiple possible field names
    const rawBullets = exp.responsibilities || exp.bullets || exp.achievements || exp.description || [];
    // Create a defensive copy to prevent any potential mutation
    const bulletsCopy = Array.isArray(rawBullets)
      ? [...rawBullets.map((b: string) => String(b))]
      : [];

    return {
      id: `exp-${idx}`,
      title: exp.title || '',
      company: exp.company || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      isCurrent: exp.current || false,
      // Store original bullets in a separate copy
      originalBullets: bulletsCopy, // NEW: Keep a clean copy for comparison
      bullets: bulletsCopy,
      description: bulletsCopy,
    };
  });

  console.log(`📊 CV Original: ${originalExperiences.length} expériences détectées`);
  originalExperiences.forEach((exp: any, idx: number) => {
    console.log(`   [${idx}] ${exp.title} at ${exp.company} - ${exp.bullets?.length || 0} bullets`);
    if (exp.bullets?.length > 0) {
      console.log(`      First bullet: "${exp.bullets[0]?.substring(0, 60)}..."`);
    }
  });

  // 2. STEP 2: Generate the AI-rewritten CV
  console.log('✍️ Step 2: Generating AI-rewritten CV...');
  const prompt = generateCVRewritePrompt(input);
  const result = await callOpenAIForRewrite(prompt);

  // 3. Vérifier que toutes les expériences ont été réécrites
  let rewrittenExperiences: any[] = [];

  // Try to get experiences from structured_data first
  if (result.structured_data?.experiences && Array.isArray(result.structured_data.experiences)) {
    rewrittenExperiences = result.structured_data.experiences;
  } else {
    // Fallback: parse from initial_cv markdown
    const parsedRewritten = parseCVData(result);
    rewrittenExperiences = parsedRewritten.experience || [];
  }

  // 4. Vérifier le nombre d'expériences
  console.log(`📊 CV Réécrit: ${rewrittenExperiences.length} expériences détectées`,
    rewrittenExperiences.map((exp: any) => `${exp.title} at ${exp.company}`)
  );

  // Helper function for fuzzy company matching
  // Handles cases where AI enhances company name (e.g., "Silae" -> "Silae (B2B SaaS)")
  const normalizeCompany = (company: string) => {
    if (!company) return '';
    // Remove parenthetical additions and normalize
    return company.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
  };

  const fuzzyCompanyMatch = (company1: string, company2: string) => {
    const norm1 = normalizeCompany(company1);
    const norm2 = normalizeCompany(company2);
    // Exact match after normalization, or one contains the other
    return norm1 === norm2 ||
      norm1.includes(norm2) ||
      norm2.includes(norm1) ||
      // Handle "Unknown Company" or empty companies
      !norm1 || !norm2;
  };

  if (originalExperiences.length !== rewrittenExperiences.length) {
    console.warn(
      `⚠️ Experience count mismatch: ${originalExperiences.length} original vs ${rewrittenExperiences.length} rewritten`
    );
    console.warn('Original experiences:', originalExperiences.map((e: any) => `${e.title} - ${e.company}`));
    console.warn('Rewritten experiences:', rewrittenExperiences.map((e: any) => `${e.title} - ${e.company}`));

    // Only try to add missing experiences if rewritten count is LESS than original
    // If AI generated MORE experiences, it likely added relevant ones - don't create duplicates
    if (rewrittenExperiences.length < originalExperiences.length) {
      console.log(`📝 Rewritten has fewer experiences, checking for missing ones...`);

      // Réécrire les expériences manquantes une par une
      for (const exp of originalExperiences) {
        // Use fuzzy matching to handle enhanced company names
        const exists = rewrittenExperiences.find(
          (r: any) =>
            r.title?.toLowerCase().includes(exp.title?.toLowerCase().split(' ')[0]) && // Match first word of title
            fuzzyCompanyMatch(r.company, exp.company)
        );

        if (!exists) {
          console.log(`Rewriting missing experience: ${exp.title} at ${exp.company}`);
          try {
            const rewritten = await rewriteSingleExperience({
              experience: {
                title: exp.title,
                company: exp.company,
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                bullets: exp.bullets || exp.description || [],
              },
              jobContext: {
                jobTitle: input.jobTitle,
                company: input.company,
                jobDescription: input.jobDescription,
                keywords: [
                  ...(input.atsAnalysis.keywords.priority_missing || []),
                  ...input.atsAnalysis.keywords.missing.slice(0, 20)
                ],
              },
              allExperiences: rewrittenExperiences,
            });

            rewrittenExperiences.push({
              id: `exp-${rewrittenExperiences.length}`,
              title: exp.title,
              company: exp.company,
              startDate: exp.startDate || '',
              endDate: exp.endDate || '',
              isCurrent: exp.isCurrent || /present|current/i.test(exp.endDate || ''),
              bullets: rewritten.bullets,
              order: rewrittenExperiences.length,
            });
          } catch (error) {
            console.error(`Failed to rewrite experience ${exp.title}:`, error);
            // Add original experience as fallback
            rewrittenExperiences.push({
              id: `exp-${rewrittenExperiences.length}`,
              ...exp,
              bullets: exp.bullets || exp.description || [],
              order: rewrittenExperiences.length,
            });
          }
        }
      }
    } else {
      console.log(`📝 Rewritten has ${rewrittenExperiences.length} experiences (>= original ${originalExperiences.length}), skipping missing check to avoid duplicates`);
    }
  }

  // 5. Parse the rewritten result for building structured_data
  const parsedRewritten = parseCVData(result);
  // Note: finalMarkdown no longer used since we store original CV text directly

  // 6. Construire structured_data complet et robuste
  // Utiliser structured_data du résultat si disponible, sinon construire depuis parsedRewritten
  let finalStructuredData = result.structured_data;

  if (!finalStructuredData || !finalStructuredData.experiences || finalStructuredData.experiences.length !== rewrittenExperiences.length) {
    // Construire structured_data depuis les données parsées
    console.log('🔧 Construction de structured_data depuis les données parsées...');

    finalStructuredData = {
      personalInfo: parsedRewritten.personalInfo || extractedOriginal.personalInfo || {},
      summary: parsedRewritten.summary || extractedOriginal.summary || '',
      experiences: rewrittenExperiences.map((exp: any) => ({
        id: exp.id || `exp-${rewrittenExperiences.indexOf(exp)}`,
        title: exp.title || '',
        company: exp.company || '',
        client: exp.client || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || 'Present',
        duration: exp.duration || '',
        location: exp.location || '',
        bullets: Array.isArray(exp.bullets) ? exp.bullets : (exp.description || []),
      })),
      educations: (parsedRewritten.education || extractedOriginal.educations || []).map((edu: any, idx: number) => ({
        id: edu.id || `edu-${idx}`,
        degree: edu.degree || '',
        institution: edu.institution || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || edu.year || '',
        year: edu.year || edu.endDate || '',
        gpa: edu.gpa || '',
        honors: edu.honors || '',
        details: edu.details || '',
      })),
      skills: parsedRewritten.skills || extractedOriginal.skills || [],
      languages: (parsedRewritten.languages || extractedOriginal.languages || []).map((lang: any) => {
        if (typeof lang === 'string') {
          // Parser "French | Native" ou "French - Native"
          const parts = lang.split(/[|-]/).map((p: string) => p.trim());
          return { name: parts[0] || lang, level: parts[1] || 'Intermediate' };
        }
        return {
          name: lang.name || lang.language || lang,
          level: lang.level || lang.proficiency || 'Intermediate',
        };
      }),
      certifications: (parsedRewritten.certifications || extractedOriginal.certifications || []).map((cert: any) => {
        if (typeof cert === 'string') {
          return { name: cert };
        }
        return {
          name: cert.name || cert,
          issuer: cert.issuer || '',
          date: cert.date || '',
          year: cert.year || '',
          credentialId: cert.credentialId || '',
          details: cert.details || '',
        };
      }),
      hobbies: parsedRewritten.hobbies || [],
    };

    console.log(`✅ structured_data construit: ${finalStructuredData.experiences.length} expériences, ${finalStructuredData.educations.length} éducations`);
  }

  // 7. Validation finale
  const validation = {
    original_experiences_count: originalExperiences.length,
    rewritten_experiences_count: finalStructuredData.experiences.length,
    original_educations_count: (extractedOriginal.educations || []).length,
    rewritten_educations_count: finalStructuredData.educations.length,
    match: originalExperiences.length === finalStructuredData.experiences.length &&
      (extractedOriginal.educations || []).length === finalStructuredData.educations.length,
  };

  if (!validation.match) {
    console.warn('⚠️ Validation échouée:', validation);
  } else {
    console.log('✅ Validation réussie:', validation);
  }

  // Build original structured data from AI-extracted data for before/after comparison
  // CRITICAL: Use ORIGINAL bullets (not rewritten) for proper comparison
  // Use the SAME IDs as finalStructuredData for reliable matching in comparison
  // Note: Firestore doesn't accept undefined values, so we use empty strings or omit fields

  console.log('🔧 Building original_structured_data for before/after comparison...');

  const originalStructuredData = {
    personalInfo: extractedOriginal.personalInfo || {},
    summary: extractedOriginal.summary || '',
    experiences: originalExperiences.map((exp: any, idx: number) => {
      // Use the same ID as the corresponding rewritten experience for perfect matching
      const matchingRewrittenId = finalStructuredData.experiences[idx]?.id || `exp-${idx}`;

      // CRITICAL: Use originalBullets (the clean copy) to ensure original data
      // This prevents any potential mutation issues where bullets could be overwritten
      const bulletsArray = Array.isArray(exp.originalBullets) && exp.originalBullets.length > 0
        ? [...exp.originalBullets] // Create another copy for safety
        : Array.isArray(exp.bullets) && exp.bullets.length > 0
          ? [...exp.bullets]
          : [];

      // DEBUG: Log what we're storing vs what's in rewritten
      const rewrittenBullets = finalStructuredData.experiences[idx]?.bullets || [];
      console.log(`   [${idx}] "${exp.title}" at "${exp.company}":`);
      console.log(`      Original bullets: ${bulletsArray.length} items`);
      console.log(`      Rewritten bullets: ${rewrittenBullets.length} items`);
      if (bulletsArray.length > 0 && rewrittenBullets.length > 0) {
        const sameFirst = bulletsArray[0] === rewrittenBullets[0];
        if (sameFirst) {
          console.warn(`      ⚠️ WARNING: First bullet is SAME in original and rewritten - possible issue!`);
        } else {
          console.log(`      ✅ Bullets are different (original vs rewritten)`);
        }
      }

      const experience: any = {
        id: matchingRewrittenId, // Same ID as rewritten for comparison matching
        title: exp.title || '',
        company: exp.company || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || 'Present',
        // Store in BOTH formats for backwards compatibility
        bullets: bulletsArray,
        responsibilities: bulletsArray, // Keep this for legacy code that reads responsibilities
      };
      // Only add optional fields if they have values
      if (exp.client) experience.client = exp.client;
      if (exp.location) experience.location = exp.location;

      return experience;
    }),
    educations: (extractedOriginal.educations || []).map((edu: any, idx: number) => {
      // Use the same ID as the corresponding rewritten education for perfect matching
      const matchingRewrittenId = finalStructuredData.educations[idx]?.id || `edu-${idx}`;
      const education: any = {
        id: matchingRewrittenId, // Same ID as rewritten for comparison matching
        degree: edu.degree || '',
        institution: edu.institution || '',
        endDate: edu.endDate || edu.year || '',
        details: edu.description || edu.details || '',
      };
      // Only add optional fields if they have values
      if (edu.startDate) education.startDate = edu.startDate;
      if (edu.year) education.year = edu.year;
      if (edu.field) education.field = edu.field;
      if (edu.gpa) education.gpa = edu.gpa;
      return education;
    }),
    skills: extractedOriginal.skills || [],
    tools: extractedOriginal.tools || [],
    languages: (extractedOriginal.languages || []).map((lang: any) => {
      if (typeof lang === 'string') return { name: lang, level: '' };
      return { name: lang.language || lang.name || '', level: lang.level || '' };
    }),
    certifications: extractedOriginal.certifications || [],
    hobbies: extractedOriginal.hobbies || [], // Store hobbies separately from experiences
  };

  console.log(`✅ Original structured data built: ${originalStructuredData.experiences.length} experiences, ${originalStructuredData.educations.length} educations`);
  // Debug: Log bullet counts for comparison debugging
  originalStructuredData.experiences.forEach((exp: any, idx: number) => {
    console.log(`   Original[${idx}] ID: ${exp.id}, "${exp.title}" at "${exp.company}" - ${exp.bullets?.length || 0} bullets`);
  });
  finalStructuredData.experiences.forEach((exp: any, idx: number) => {
    console.log(`   Rewritten[${idx}] ID: ${exp.id}, "${exp.title}" at "${exp.company}" - ${exp.bullets?.length || 0} bullets`);
  });

  return {
    adaptationLevel, // Track which level was used for this rewrite
    analysis: result.analysis || {
      positioning_strategy: '',
      strengths: [],
      gaps: [],
      recommended_keywords: [],
      experience_relevance: [],
    },
    initial_cv: input.cvText, // Raw original CV text (backup)
    original_structured_data: originalStructuredData, // NEW: Original parsed structured data for comparison
    cv_templates: result.cv_templates || {},
    internal_prompt_used: prompt,
    structured_data: finalStructuredData, // AI-rewritten structured data
    validation: validation,
  };
}

/**
 * Translate CV content between English and French
 * Uses the server endpoint for secure API key management
 */
export async function translateCV(cvContent: string, targetLanguage: 'en' | 'fr'): Promise<string> {
  const prompt = `You are a professional translator specializing in CVs/resumes. Translate the following CV to ${targetLanguage === 'en' ? 'English' : 'French'} while maintaining professional tone and formatting. Return ONLY the translated content in a JSON object with this format: {"translated_text": "the translated content"}.
  
CV to translate:
${cvContent}`;

  // Use the server endpoint instead of calling OpenAI directly
  const response = await fetch('/api/chatgpt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      type: 'cv-translation',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Translation failed' }));
    throw new Error(errorData.message || 'Translation failed');
  }

  const data = await response.json();

  if (data.status === 'error') {
    throw new Error(data.message || 'Translation failed');
  }

  // Extract the translated content
  let content = data.content;
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch (e) {
      // If not JSON, assume it's the translated text directly
      return content;
    }
  }

  return content.translated_text || content.content || content || '';
}


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
 * Simplified version - controls keyword count and intensity
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
 * Generate optimized CV rewriting prompt
 * Streamlined version: ~200 lines instead of 500+, 3x cheaper, more reliable
 */
function generateCVRewritePrompt(input: CVRewriteInput): string {
  const priorityKeywords = input.atsAnalysis.keywords.priority_missing || [];
  const missingKeywords = input.atsAnalysis.keywords.missing.filter(k => !priorityKeywords.includes(k));
  const adaptationLevel = input.adaptationLevel || 'balanced';
  const levelConfig = getLevelConfig(adaptationLevel);
  
  // Format strengths and gaps concisely
  const strengths = (input.atsAnalysis.strengths || []).map(s => s.name).filter(Boolean).join(', ') || 'None identified';
  const gaps = (input.atsAnalysis.gaps || []).map(g => g.name).filter(Boolean).join(', ') || 'None identified';

  return `You are an expert CV strategist. Rewrite this CV to maximize job match while preserving factual accuracy.

## TASK
Optimize CV for: **${input.jobTitle}** at **${input.company}**
Current match: ${input.atsAnalysis.matchScore}% → Target improvement: +${levelConfig.scoreGoal}
Intensity: ${levelConfig.intensity}
Approach: ${levelConfig.approach}

## JOB DESCRIPTION
${input.jobDescription}

## ORIGINAL CV
${input.cvText}

## KEYWORDS TO INTEGRATE (${levelConfig.keywords} keywords - THIS IS CRITICAL FOR ATS)
Priority (MUST include): ${priorityKeywords.slice(0, 15).join(', ') || 'Extract from job description'}
Secondary: ${missingKeywords.slice(0, 10).join(', ') || 'None'}

### Keyword Integration Rules (MANDATORY)
1. SUMMARY: Include 2-3 priority keywords in the professional summary
2. EXPERIENCES: Each bullet point should naturally include 1-2 keywords when relevant
3. SKILLS: List ALL priority keywords in the skills section
4. PLACEMENT: Front-load keywords in the first 2 experiences (most recent = most important)
5. NATURAL: Rephrase bullets to include keywords WITHOUT changing the meaning
   Example: "Managed team" → "Led cross-functional team using Agile methodologies"
   Example: "Did marketing" → "Drove digital marketing campaigns leveraging SEO and content strategy"

## ATS INSIGHTS
Strengths to amplify: ${strengths}
Gaps to address: ${gaps}

## REWRITING RULES

### Professional Summary (40-50 words, Hook+Proof+Value format)
- HOOK (10 words): Strongest differentiator for this role
- PROOF (20 words): One concrete achievement with metric FROM the original CV
- VALUE (15 words): What you bring to ${input.company}

### Bullet Points
- Use power verbs: Architected, Delivered, Drove, Orchestrated, Spearheaded
- Avoid: Worked on, Helped, Participated, Was responsible for
- Include metrics ONLY if present in original CV (use ~ for estimates)
- Max 20 words per bullet, 3-5 bullets per experience

### Strict Rules
- Use ONLY information from the original CV
- Keep EXACT same number of experiences and educations  
- Never invent metrics, achievements, or experiences
- Never confuse education entries with work experience
- ALWAYS extract name, firstName, lastName, and professional title from the CV header

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
      content = JSON.parse(content);
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
  const originalExperiences = (extractedOriginal.experiences || []).map((exp: any, idx: number) => ({
    id: `exp-${idx}`,
    title: exp.title || '',
    company: exp.company || '',
    startDate: exp.startDate || '',
    endDate: exp.endDate || '',
    isCurrent: exp.current || false,
    bullets: exp.responsibilities || exp.bullets || [],
    description: exp.responsibilities || exp.bullets || [],
  }));
  
  console.log(`📊 CV Original: ${originalExperiences.length} expériences détectées`);
  originalExperiences.forEach((exp: any, idx: number) => {
    console.log(`   [${idx}] ${exp.title} at ${exp.company} - ${exp.bullets?.length || 0} bullets`);
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
  // IMPORTANT: Use the SAME IDs as finalStructuredData for reliable matching in comparison
  // Note: Firestore doesn't accept undefined values, so we use empty strings or omit fields
  const originalStructuredData = {
    personalInfo: extractedOriginal.personalInfo || {},
    summary: extractedOriginal.summary || '',
    experiences: originalExperiences.map((exp: any, idx: number) => {
      // Use the same ID as the corresponding rewritten experience for perfect matching
      const matchingRewrittenId = finalStructuredData.experiences[idx]?.id || `exp-${idx}`;
      // Get bullets from multiple possible sources
      const bulletsArray = Array.isArray(exp.bullets) ? exp.bullets : 
                          Array.isArray(exp.responsibilities) ? exp.responsibilities :
                          Array.isArray(exp.description) ? exp.description : [];
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
      
      // Debug log
      console.log(`   Building original exp[${idx}]: "${experience.title}" - ${experience.bullets.length} bullets`);
      
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


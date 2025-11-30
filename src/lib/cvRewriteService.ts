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
 * Generate level-specific instructions for the AI prompt
 * These control how aggressively the AI rewrites the CV
 */
function getAdaptationLevelInstructions(level: AdaptationLevel): {
  missionStatement: string;
  rewritingIntensity: string;
  keywordStrategy: string;
  styleGuidance: string;
} {
  switch (level) {
    case 'conservative':
      return {
        missionStatement: `Your mission is to make MINIMAL, targeted improvements while preserving the candidate's authentic voice and original style. Focus on corrections and subtle enhancements.`,
        rewritingIntensity: `
## 🎚️ ADAPTATION LEVEL: CONSERVATIVE (Level 1)

**Rewriting Intensity: LOW - Preserve Original Voice**

Your approach for this level:
1. **PRESERVE** the original tone, writing style, and sentence structure as much as possible
2. **CORRECT** only grammatical errors, typos, and formatting issues
3. **SUBTLY ADD** 3-5 priority keywords where they fit NATURALLY (don't force them)
4. **MINIMAL REPHRASING** - only change wording if it's clearly weak or unclear
5. **KEEP** the original summary structure - just polish it slightly
6. **DON'T** use aggressive power verbs unless the original already has a strong tone
7. **PRIORITIZE** authenticity over optimization - the CV should still "sound like" the candidate

The goal is a 5-10% improvement in match score, NOT a complete transformation.
`,
        keywordStrategy: `
### 🔑 CONSERVATIVE KEYWORD APPROACH
- Add only 3-5 of the most critical keywords
- Keywords should blend in naturally with existing content
- Don't restructure sentences to accommodate keywords
- If a keyword doesn't fit naturally, skip it
`,
        styleGuidance: `
### ✍️ STYLE PRESERVATION
- Keep the candidate's original vocabulary and tone
- Minor grammar/spelling corrections only
- Light formatting improvements
- Preserve original bullet structure and length
`
      };

    case 'balanced':
      return {
        missionStatement: `Your mission is to create a BALANCED optimization that improves job match while maintaining the candidate's professional identity. Aim for noticeable improvement without losing authenticity.`,
        rewritingIntensity: `
## 🎚️ ADAPTATION LEVEL: BALANCED (Level 2)

**Rewriting Intensity: MODERATE - Thoughtful Optimization**

Your approach for this level:
1. **ENHANCE** bullet points with stronger action verbs and clearer impact statements
2. **INTEGRATE** 10-15 priority keywords naturally throughout the CV
3. **IMPROVE** the professional summary with better structure (Hook + Proof + Value)
4. **REORDER** experiences if needed to highlight most relevant ones first
5. **ADD QUANTIFICATION** where data exists in the original (use ~ for reasonable estimates)
6. **MAINTAIN** the overall structure and format of the original CV
7. **BALANCE** optimization with authenticity - improve but don't transform completely

The goal is a 15-25% improvement in match score with natural-sounding content.
`,
        keywordStrategy: `
### 🔑 BALANCED KEYWORD APPROACH
- Integrate 10-15 priority keywords across all sections
- Rephrase sentences to include keywords naturally
- Add a Skills/Core Competencies section if missing
- Keywords should appear 1-2 times each
`,
        styleGuidance: `
### ✍️ STYLE ENHANCEMENT
- Upgrade weak verbs to stronger alternatives
- Improve sentence structure for impact
- Add relevant context to bullet points
- Maintain professional but enhanced tone
`
      };

    case 'optimized':
      return {
        missionStatement: `Your mission is to MAXIMIZE job match potential through comprehensive optimization. Transform this CV into the strongest possible match while keeping core experiences and achievements intact.`,
        rewritingIntensity: `
## 🎚️ ADAPTATION LEVEL: OPTIMIZED (Level 3)

**Rewriting Intensity: HIGH - Maximum Impact**

Your approach for this level:
1. **TRANSFORM** every bullet point to use powerful action verbs and quantified results
2. **SATURATE** the CV with 20+ priority keywords, each appearing 2-3 times
3. **REWRITE** the professional summary to directly address the job's core requirements
4. **RESTRUCTURE** content to front-load the most relevant experiences and skills
5. **AMPLIFY** all achievements to their maximum truthful potential
6. **CREATE** a comprehensive Skills/Core Competencies section with keyword clusters
7. **ELEVATE** language to senior-level tone throughout
8. **OPTIMIZE** for ATS with strategic keyword placement and formatting

The goal is a 30-40%+ improvement in match score - create the STRONGEST possible CV.

⚠️ IMPORTANT: Even at maximum intensity, NEVER invent experiences, metrics, or achievements.
Transform what exists, don't fabricate what doesn't.
`,
        keywordStrategy: `
### 🔑 OPTIMIZED KEYWORD APPROACH
- Saturate with 20+ keywords across all sections
- Each priority keyword should appear 2-3 times
- Add keyword variations and synonyms
- Create dedicated skills clusters by category
- Front-load keywords in summary and recent experiences
`,
        styleGuidance: `
### ✍️ STYLE TRANSFORMATION
- Use the most powerful action verbs available
- Add maximum impact to every statement
- Elevate all language to senior executive level
- Create compelling, memorable achievements
- Ensure every bullet demonstrates value
`
      };

    default:
      // Default to balanced if unknown level
      return getAdaptationLevelInstructions('balanced');
  }
}

/**
 * Generate the ULTRA-QUALITY CV rewriting prompt
 * Uses a 3-Phase strategic approach with full ATS data richness
 */
function generateCVRewritePrompt(input: CVRewriteInput): string {
  // Format enriched data
  const formattedStrengths = formatEnrichedStrengths(input.atsAnalysis.strengths);
  const formattedGaps = formatEnrichedGaps(input.atsAnalysis.gaps);
  const formattedCVFixes = formatCVFixes(input.atsAnalysis.cvFixes);
  const formattedJobInsights = formatJobSummaryInsights(input.atsAnalysis.jobSummary);
  
  // Prepare keywords
  const priorityKeywords = input.atsAnalysis.keywords.priority_missing || [];
  const otherMissingKeywords = input.atsAnalysis.keywords.missing.filter(k => !priorityKeywords.includes(k));
  const foundKeywords = input.atsAnalysis.keywords.found || [];
  
  // Get level-specific instructions (default to balanced)
  const adaptationLevel = input.adaptationLevel || 'balanced';
  const levelInstructions = getAdaptationLevelInstructions(adaptationLevel);
  
  return `You are an ELITE CV STRATEGIST with 25+ years placing top executives at FAANG, McKinsey, Goldman Sachs, and Fortune 100 companies. Your CVs have a 94% interview callback rate.

${levelInstructions.missionStatement}

${levelInstructions.rewritingIntensity}

═══════════════════════════════════════════════════════════════════════════════
                           PHASE 1: DEEP UNDERSTANDING
═══════════════════════════════════════════════════════════════════════════════

## 🎯 TARGET OPPORTUNITY
- **Company**: ${input.company}
- **Position**: ${input.jobTitle}
- **Current Match Score**: ${input.atsAnalysis.matchScore}%
- **Adaptation Level**: ${adaptationLevel.toUpperCase()}

## 📋 JOB DESCRIPTION (Analyze EVERY requirement)
"""
${input.jobDescription}
"""

${formattedJobInsights ? `## 🔍 DEEP JOB INSIGHTS (From ATS Analysis)\n${formattedJobInsights}\n` : ''}

${input.atsAnalysis.positioning ? `## 🧭 STRATEGIC POSITIONING GUIDANCE\n${input.atsAnalysis.positioning}\n` : ''}

## 📄 ORIGINAL CV (Your raw material)
"""
${input.cvText}
"""

═══════════════════════════════════════════════════════════════════════════════
                        PHASE 2: STRATEGIC ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

## 💪 STRENGTHS TO AMPLIFY (with proof points)
${formattedStrengths}

## ⚠️ GAPS TO ADDRESS (with resolution strategies)
${formattedGaps}

## 🔧 PRE-ANALYZED CV FIXES
${formattedCVFixes}

## 🔑 KEYWORD STRATEGY

### 🔴 PRIORITY KEYWORDS
${priorityKeywords.length > 0 ? priorityKeywords.join(', ') : 'None specified - use keywords from job description'}

### 🟡 SECONDARY KEYWORDS
${otherMissingKeywords.slice(0, 20).join(', ') || 'None'}

### 🟢 KEYWORDS ALREADY PRESENT
${foundKeywords.slice(0, 15).join(', ') || 'None identified'}

${levelInstructions.keywordStrategy}

${levelInstructions.styleGuidance}

═══════════════════════════════════════════════════════════════════════════════
                         PHASE 3: EXECUTION EXCELLENCE
═══════════════════════════════════════════════════════════════════════════════

## 📝 PROFESSIONAL SUMMARY FORMAT: Hook + Proof + Value (40-50 words)

Create a summary using this precise structure:
1. **HOOK (10 words)**: A compelling statement that creates urgency. Start with the candidate's strongest differentiator relevant to ${input.jobTitle}.
2. **PROOF (20 words)**: ONE concrete achievement with a real metric FROM THE CV (not invented). This proves the hook.
3. **VALUE (15 words)**: What unique value they bring to ${input.company}'s specific needs.

**Example for Product Manager at Spotify:**
"Music-obsessed Product Leader who scaled engagement features to 2M DAU. Delivered $4M ARR growth through data-driven experimentation. Ready to redefine audio experiences at Spotify."

❌ AVOID: Generic phrases like "results-driven", "passionate", "team player", "motivated professional"
✅ USE: Specific, memorable, job-relevant differentiators

## 📊 QUANTIFICATION RULES (CAUTIOUS APPROACH)

### ✅ ALLOWED Quantification:
1. **Direct from CV**: If CV says "team of 5" → Use "team of 5"
2. **Reasonable estimates with ~**: If CV says "several team members" → Use "~5-8 team members"
3. **Calculable metrics**: If CV says "3 years at company, led 2 major projects/year" → Use "6+ major projects"
4. **Industry standard ranges**: If CV says "managed large budget" for senior role → Use "~$500K-1M budget"

### ❌ FORBIDDEN Quantification:
1. **Never invent percentages**: If CV says "improved performance" → DON'T add "by 40%"
2. **Never add revenue/cost numbers**: Unless CV explicitly mentions financial impact
3. **Never guess user counts**: Unless CV mentions scale
4. **Never fabricate timeframes**: Unless CV mentions them

### 💡 Smart Alternative When No Metrics:
Instead of inventing: "Improved system performance, reducing latency and enhancing user experience for enterprise clients"
(Focus on WHAT was done and WHO benefited, without fake numbers)

## ⚡ POWER VERB ARSENAL
Replace ALL weak verbs immediately:
- ❌ "Worked on" → ✅ "Architected", "Engineered", "Built", "Delivered"
- ❌ "Helped" → ✅ "Enabled", "Catalyzed", "Drove", "Empowered"
- ❌ "Was responsible for" → ✅ "Owned", "Led", "Championed", "Spearheaded"
- ❌ "Participated in" → ✅ "Contributed", "Collaborated", "Partnered with"
- ❌ "Managed" (overused) → ✅ "Orchestrated", "Directed", "Steered", "Oversaw"

## 👔 SENIORITY ELEVATION
Transform EVERY statement to sound senior-level:
- Show STRATEGIC thinking, not just execution
- Emphasize LEADERSHIP and INFLUENCE over tasks
- Highlight CROSS-FUNCTIONAL impact and stakeholder management
- Demonstrate BUSINESS ACUMEN and ROI awareness
- Feature MENTORSHIP and team development
- Example: "Developed features" → "Architected strategic product initiatives, establishing engineering patterns adopted across 5 product teams"

## 🤖 ATS OPTIMIZATION
- Front-load PRIORITY keywords in Summary and first experience
- Create "Core Competencies" section with keyword clusters
- Use standard section headers ATS systems recognize
- Include both acronyms AND full terms: "CI/CD (Continuous Integration/Continuous Deployment)"
- Ensure PRIORITY keywords appear 2-3 times naturally

## 📏 ONE-PAGE A4 OPTIMIZATION
- **Summary**: 40-50 words maximum (Hook + Proof + Value format)
- **Bullets**: 3-5 per experience, max 20 words each
- **Content**: Compact, impactful, no filler words
- **Goal**: Fit comfortably on one A4 page

---

## 🚫 ABSOLUTE RULES - NEVER VIOLATE:
1. ✅ ONLY use information that exists in the original CV
2. ❌ NEVER invent jobs, dates, companies, metrics, degrees, or achievements
3. ✅ Rephrase, restructure, amplify, and emphasize - but ALWAYS truthful
4. ✅ If a metric isn't in the CV, don't invent it (but you can add "~" for estimates if reasonable)
5. ✅ If there's a gap, address it through smart positioning, not fabrication

## 🚫 CRITICAL: EXPERIENCE CREATION RULES - ABSOLUTE PROHIBITION
⛔ **NEVER CREATE NEW EXPERIENCES** - This is the #1 rule you must NEVER break:
1. ❌ NEVER create a new experience entry that doesn't exist in the original CV
2. ❌ NEVER use the candidate's name (first name or full name) as a job title or company name
3. ❌ NEVER add experiences like "Rouchdi Touil - 2018 - Present" or "Firstname Lastname - Date"
4. ❌ NEVER invent freelance/consulting experiences that aren't in the original CV
5. ✅ ONLY modify/enhance bullet points within EXISTING experiences
6. ✅ If you want to add new skills/achievements, add them as NEW BULLETS to EXISTING experiences
7. ✅ If a skill cannot fit into any existing experience, put it in "suggested_additions" (NOT as a new experience)

## 🎓 CRITICAL: EDUCATION ≠ EXPERIENCE - NEVER CONFUSE THEM
⛔ **EDUCATION entries are NOT work experiences** - This is a CRITICAL distinction:
1. ❌ NEVER transform a degree/diploma/certification into a work experience entry
2. ❌ "Master's in Management", "Bachelor's", "MBA", "Engineering Degree", "Master's" = EDUCATION ONLY
3. ❌ Universities, Business Schools, Colleges, Institutes = NOT valid "company" names for experiences
4. ❌ NEVER create experience bullet points for education/study periods
5. ❌ NEVER add work achievements to a degree - degrees don't have "achievements", only courses/GPA/honors
6. ✅ Education achievements (GPA, honors, thesis, relevant courses) go in the EDUCATION section ONLY
7. ✅ A valid EXPERIENCE entry MUST have ALL of these:
   - A REAL job title (Developer, Manager, Analyst, Consultant, Intern, etc.) - NOT a degree name
   - A REAL company/business name (Accenture, Google, Danone, etc.) - NOT a school/university
   - Actual WORK responsibilities - NOT academic projects (unless it's an internship at a company)

**BEFORE ADDING ANY EXPERIENCE TO THE OUTPUT, ASK YOURSELF:**
- Is the "company" field a real business/corporation (NOT a university/school)? If NO → This is NOT an experience
- Is the "title" field a real job position (NOT a degree name like "Master's")? If NO → This is NOT an experience  
- Did this exact experience exist in the ORIGINAL CV as a real JOB? If NO → This is NOT an experience
- Would a recruiter see this as a real work experience? If NO → This is NOT an experience

**VALIDATION CHECK**: Before returning, verify that:
- The number of experiences in your output EXACTLY matches the original CV
- No experience has the candidate's name as company or title
- No new experience entries were created
- ⚠️ NO education/degree was incorrectly placed in the experiences array
- ⚠️ Every experience has a REAL company name (Accenture, Google, etc. - NOT a school/university)
- ⚠️ Every experience has a REAL job title (Manager, Developer, etc. - NOT a degree name like "Master's")

## CRITICAL DATA PRESERVATION RULES:
⚠️ **MOST IMPORTANT**: You MUST preserve ALL experiences and ALL educations from the original CV

1. **EXPERIENCES - PRESERVE EVERY SINGLE ONE**:
   - If the original CV has 3 projects under Accenture (Ayvens, Danone, Technicolor), you MUST include ALL 3
   - If the original CV has 5 experiences, you MUST include ALL 5
   - Each project/client MUST be a separate experience entry with its own ### header
   - Extract ALL bullet points for EACH experience - DO NOT skip any
   - If an experience has 8 bullets, include ALL 8 (you can optimize wording but keep all content)
   - DO NOT combine multiple projects into one experience entry
   - DO NOT remove experiences even if they seem less relevant

2. **EDUCATIONS - PRESERVE EVERY SINGLE ONE**:
   - If the original CV has Master + Prépa, you MUST include BOTH
   - If the original CV has 3 education entries, you MUST include ALL 3
   - Each degree/certificate MUST be a separate education entry with its own ### header
   - DO NOT combine multiple educations into one entry

3. **VALIDATION BEFORE RETURNING**:
   - Count experiences in original CV
   - Count experiences in your output
   - They MUST match - if not, you're missing data
   - Same for educations - count must match

6. ✅ Make it so compelling that recruiters MUST call this candidate

---

## CRITICAL OUTPUT REQUIREMENTS - PRESERVE ALL EXPERIENCES:

STEP 1: COUNT ORIGINAL EXPERIENCES FIRST
- Parse the original CV and count EVERY work experience
- Count internships, part-time, contract, volunteer positions separately
- Note the exact number: original_experiences_count = <number>

STEP 2: Generate structured JSON FIRST (before markdown) - THIS IS CRITICAL:

⚠️ **structured_data MUST be a complete, accurate JSON representation of ALL CV data**

{
  "structured_data": {
    "personalInfo": {
      "name": "<full name from CV>",
      "firstName": "<first name>",
      "lastName": "<last name>",
      "email": "<email from CV>",
      "phone": "<phone from CV>",
      "location": "<location from CV>",
      "linkedin": "<linkedin URL if present>",
      "title": "<professional title/headline if present>"
    },
    "summary": "<complete professional summary text, 2-3 sentences>",
    "experiences": [
      {
        "id": "exp-0",
        "title": "<EXACT job title from original CV>",
        "company": "<EXACT company name from original>",
        "client": "<client/project name if different from company, e.g., 'Ayvens' or 'Danone'>",
        "startDate": "<EXACT start date from original, e.g., 'Jan 2020' or '2018'>",
        "endDate": "<EXACT end date or 'Present'>",
        "duration": "<duration if mentioned, e.g., '38 months'>",
        "location": "<location if mentioned>",
        "bullets": [
          "<rewritten bullet 1 - optimized but preserving all content>",
          "<rewritten bullet 2>",
          "<rewritten bullet 3>",
          "... ALL bullets from original experience - DO NOT skip any"
        ]
      },
      {
        "id": "exp-1",
        "title": "<NEXT experience title>",
        "company": "<NEXT experience company>",
        // ... REPEAT for EVERY experience from original CV
      }
      // ⚠️ CRITICAL: If original CV has 3 projects (Ayvens, Danone, Technicolor), you MUST create 3 separate objects here
      // ⚠️ CRITICAL: Count MUST match original_experiences_count
    ],
    "educations": [
      {
        "id": "edu-0",
        "degree": "<EXACT degree name from original, e.g., 'Master's in Management' or 'PGE'>",
        "institution": "<EXACT institution name from original>",
        "startDate": "<start date if shown>",
        "endDate": "<end date or graduation year, e.g., '2018'>",
        "year": "<graduation year if different from endDate>",
        "gpa": "<GPA if mentioned>",
        "honors": "<honors if mentioned>",
        "details": "<any additional details like relevant coursework>"
      },
      {
        "id": "edu-1",
        "degree": "<NEXT education entry, e.g., 'Prépa' or 'Preparatory Course'>",
        "institution": "<NEXT institution>",
        // ... REPEAT for EVERY education from original CV
      }
      // ⚠️ CRITICAL: If original CV has Master + Prépa, you MUST create 2 separate objects here
    ],
    "skills": [
      "<skill 1>",
      "<skill 2>",
      "... ALL skills from original CV"
    ],
    "languages": [
      {
        "name": "<language name, e.g., 'French'>",
        "level": "<proficiency level: Native/Fluent/Intermediate/Basic>"
      }
      // ⚠️ CRITICAL: Languages ONLY, NOT certifications
    ],
    "certifications": [
      {
        "name": "<certification name, e.g., 'Salesforce Certified Administrator'>",
        "issuer": "<issuing organization, e.g., 'Salesforce'>",
        "date": "<date if mentioned>",
        "year": "<year if mentioned>",
        "credentialId": "<credential ID if visible>",
        "details": "<any additional details>"
      }
      // ⚠️ CRITICAL: Professional certifications ONLY, NOT languages
    ],
    "hobbies": [
      "<hobby 1>",
      "<hobby 2>",
      "... if present in original CV"
    ]
  },
  "validation": {
    "original_experiences_count": <number from step 1 - count ALL experiences including each project/client separately>,
    "rewritten_experiences_count": <number in structured_data.experiences array - MUST match original>,
    "original_educations_count": <number - count ALL education entries including prépa, master, etc.>,
    "rewritten_educations_count": <number in structured_data.educations array - MUST match original>,
    "match": <true ONLY if BOTH counts match, false otherwise>
  },
  "analysis": {
    "positioning_strategy": "One powerful paragraph (150-200 words) explaining THE WINNING narrative angle for this candidate. What's their superpower? How do we frame their experience to make ${input.company} desperate to interview them?",
    "strengths": [
      "5-7 key strengths WITH specific context",
      "Example: 'Strong full-stack experience with React/Node.js, evident from 3+ years building scalable web applications'"
    ],
    "gaps": [
      "3-5 gaps identified WITH tactical strategies to address them through positioning",
      "Example: 'Missing cloud experience → Emphasize related DevOps work and quick learning ability'"
    ],
    "recommended_keywords": [
      "20-30 keywords to integrate naturally, prioritized by importance",
      "Include both hard skills and soft skills relevant to the role"
    ],
    "experience_relevance": [
      "Ordered list of which experiences are MOST relevant to ${input.jobTitle} at ${input.company} and WHY",
      "This guides how to prioritize and structure the Experience section"
    ]
  },
  "suggested_additions": {
    "description": "Skills, achievements, or bullets that are HIGHLY RELEVANT to ${input.jobTitle} but could NOT be naturally integrated into existing experiences. These will be shown to the user as suggestions they can manually add.",
    "items": [
      {
        "bullet": "<A powerful, job-relevant bullet point that matches ${input.jobTitle} requirements>",
        "reason": "<Why this skill/achievement is important for ${input.company}>",
        "target_experience_id": "<exp-0 or exp-1 etc. - the experience ID where this could potentially be added>",
        "target_experience_title": "<Title of the experience where this could be added>",
        "priority": "<high/medium/low based on job relevance>"
      }
    ],
    "note": "ONLY include bullets here if they CANNOT be naturally added to existing experience bullets. Prefer modifying existing bullets first. Maximum 5 suggestions."
  },
  "initial_cv": "The ULTIMATE rewritten CV in markdown format - this is your MASTERPIECE. Every word counts. Every achievement quantified. Every bullet powerful. This should be ready to copy-paste into an editor. Use ## for sections, ### for job titles, bullet points for achievements. MUST include ALL experiences from structured_data.experiences. CRITICAL: For experiences with a 'client' field (e.g., client='Ayvens', company='Accenture'), format the header as: ### Job Title - Client (via Company). Example: ### PO/PM - Ayvens (via Accenture). This ensures the client name is prominently displayed. IMPORTANT: Keep content compact and concise - Professional Summary: 2-3 sentences (50-60 words max), 3-5 bullets per experience (max 20 words each). The CV must fit comfortably on one A4 page.",
  "cv_templates": {
    "tech_minimalist": "Full CV in Google/Linear/Vercel style - Clean, modern, highly scannable. Perfect for tech companies. Heavy emphasis on tech stack and impact metrics. Modern language. Each bullet starts with impact.",
    "consulting": "Full CV in McKinsey/BCG/Bain style - STAR format religiously. Every bullet: [Result/Metric] by [Action] resulting in [Business Impact]. Example: 'Increased revenue by 40% ($12M) by restructuring pricing strategy, enabling expansion into 3 new markets.' Metrics dominate.",
    "ats_boost": "Pure ATS optimization masterpiece - Maximum keyword density but NATURAL. Strategic keyword placement in all sections. Core Competencies section at top. Keywords distributed throughout. Standard headers. No fancy formatting. This CV will score 95%+ on any ATS.",
    "harvard": "Harvard Business School style - Traditional, professional, executive-level. Strong emphasis on leadership, progression, and team impact. Education prominent. Professional Summary emphasizes strategic leadership. Shows clear career progression.",
    "notion": "Notion/Figma/Linear style - Modern hierarchy with clear visual structure. Well-organized sections. Skills categorized (Technical, Domain, Soft). Clean but distinctive. Great for design-forward tech companies.",
    "apple": "Apple/Airbnb ultra-minimal style - Elegant, sophisticated, maximum impact with minimum words. Only the essential, perfectly crafted. Each bullet is a mini-case-study. Perfect spacing. Only top 3-4 experiences. Quality over quantity."
  },
  "internal_prompt_used": "This exact prompt (for transparency and debugging)"
}

STEP 3: CRITICAL VALIDATION RULES - VERIFY BEFORE RETURNING:

⚠️ **MANDATORY VALIDATION CHECKLIST:**

1. **EXPERIENCES VALIDATION:**
   - Count original experiences from CV: <number>
   - Count experiences in structured_data.experiences: <number>
   - ✅ They MUST match EXACTLY - if not, you're missing data
   - If original has 3 projects (Ayvens, Danone, Technicolor), structured_data.experiences MUST have 3 objects
   - If original has 5 experiences, structured_data.experiences MUST have 5 objects
   - Each experience object MUST have:
     * id (exp-0, exp-1, exp-2, etc. - sequential)
     * title (EXACT from original, do not modify)
     * company (EXACT from original, do not modify)
     * startDate and endDate (EXACT from original, do not modify)
     * bullets (rewritten and optimized, but ALL bullets from original must be included)

2. **EDUCATIONS VALIDATION:**
   - Count original educations from CV: <number>
   - Count educations in structured_data.educations: <number>
   - ✅ They MUST match EXACTLY - if not, you're missing data
   - If original has Master + Prépa, structured_data.educations MUST have 2 objects
   - Each education object MUST have:
     * id (edu-0, edu-1, etc. - sequential)
     * degree (EXACT from original)
     * institution (EXACT from original)
     * endDate or year (EXACT from original)

3. **LANGUAGES vs CERTIFICATIONS:**
   - Languages MUST be in structured_data.languages (array of {name, level})
   - Certifications MUST be in structured_data.certifications (array of {name, issuer, date})
   - ❌ DO NOT put languages in certifications
   - ❌ DO NOT put certifications in languages

4. **FINAL CHECK:**
   - validation.original_experiences_count === validation.rewritten_experiences_count
   - validation.original_educations_count === validation.rewritten_educations_count
   - validation.match === true ONLY if BOTH match
   - The initial_cv markdown must include ALL experiences from structured_data.experiences as separate ### headers
   - CRITICAL FORMATTING: If an experience has a 'client' field, format the header as: ### Job Title - Client (via Company)
     Example: If client='Ayvens' and company='Accenture', use: ### PO/PM - Ayvens (via Accenture)
     This ensures clients/projects are prominently displayed, not just the parent company
   - If validation.match is false, you MUST fix structured_data before returning

### STRUCTURE & SECTION RULES (NON-NEGOTIABLE)
1. The master \`initial_cv\` MUST begin with this exact contact header (use real values):
\`\`\`
# Firstname Lastname
Professional Title: Senior Product Manager
Location: Paris, France
Email: firstname.lastname@email.com
Phone: +33 6 12 34 56 78
LinkedIn: https://linkedin.com/in/username
\`\`\`
2. After the contact header, include sections in this order (all of them, even if concise):
   - ## Professional Summary
   - ## Professional Experience
   - ## Education
   - ## Skills
   - ## Certifications
   - ## Languages
   - ## Hobbies & Interests
3. **CRITICAL FOR EXPERIENCES**: Every experience entry MUST use \`### Job Title - Company\` followed by a period line (e.g., \`2019 – Present\`) and bullet points starting with "-" or "•".
   - **If the original CV has multiple projects under the same company (e.g., Accenture with projects: Ayvens, Danone, Technicolor), you MUST create SEPARATE \`###\` blocks for EACH project:**
     \`\`\`
     ### Project Manager - Ayvens (via Accenture)
     2020 - 2023
     - Bullet 1
     - Bullet 2
     
     ### Project Manager - Danone (via Accenture)
     2019 - 2020
     - Bullet 1
     - Bullet 2
     \`\`\`
   - **DO NOT group multiple projects under a single \`###\` header**
   - **Each distinct project/client/role MUST have its own \`###\` header**
4. Skills should be comma-separated keyword clusters (e.g., "Product Strategy, AI Platforms, Salesforce, GTM Leadership").
5. Certifications use \`### Certification - Issuer\` followed by the year/ID on the next line and optional bullet(s) for impact.
6. Languages section lines follow \`Language | Level\` with Level ∈ {Basic, Intermediate, Advanced, Fluent, Native}.
7. Hobbies & Interests must be a short comma-separated list of curated interests (no sentences).

## TEMPLATE-SPECIFIC REQUIREMENTS:

### Tech Minimalist:
- Opening: Powerful 2-line summary highlighting tech stack and impact
- Experience: Tech stack visible in each role, metrics prominent
- Format: "Built [product/feature] using [tech stack], resulting in [quantified impact]"
- Skills: Categorized by type (Languages, Frameworks, Tools, Cloud, etc.)

### Consulting:
- Opening: Results-driven summary with biggest wins
- Experience: Every bullet follows: "[Metric/Result] by [Action] for [Business Impact]"
- Heavy on business metrics: Revenue, cost savings, efficiency, ROI
- Shows strategic thinking and client impact

### ATS Boost:
- Core Competencies section at top with keyword clusters
- Standard headers: Professional Summary, Professional Experience, Education, Skills
- Keywords naturally repeated across sections
- Both acronyms and full terms included
- Maximum parsability for ATS systems

### Harvard:
- Professional Summary emphasizes leadership philosophy
- Experience shows clear progression and increasing responsibility
- Team size and management scope clearly stated
- Education section prominent (include GPA if strong, honors, relevant coursework)
- Professional but warm tone

### Notion:
- Clear hierarchy with section breaks
- Skills organized into categories
- Modern but professional language
- Bullet structure with sub-bullets where appropriate
- Visual clarity through spacing and structure

### Apple:
- Absolute minimalism - only what matters most
- Each experience is a story of impact
- 3-4 most impressive roles only
- Each bullet is perfectly crafted
- Sophisticated, elegant, confident tone
- Lots of white space

---

## QUALITY CHECKLIST - VERIFY BEFORE RETURNING:

✅ ALL original experiences preserved (count matches exactly)
✅ Every achievement has a number/percentage/scale
✅ Every verb is powerful (NO "helped", "worked on", "participated")
✅ All missing keywords integrated naturally (check the list!)
✅ Reads at senior/leadership level
✅ Perfect ATS-optimized structure
✅ NO fabricated information (verify against original CV)
✅ Compelling narrative that tells a story
✅ ${input.company} will be desperate to interview this candidate
✅ Each template is COMPLETE and ready to use
✅ All 6 templates are distinctly different in style and structure
✅ structured_data.experiences array contains ALL experiences from original CV
✅ validation.match is true (original count = rewritten count)

## 🚫 FINAL EXPERIENCE VALIDATION (CRITICAL):
⛔ VERIFY NO NEW EXPERIENCES WERE CREATED:
✅ Count of experiences in output EQUALS count in original CV
✅ NO experience has candidate's first name or full name as title/company
✅ NO experience like "Firstname Lastname - 2018 - Present" exists
✅ ALL experience titles/companies match EXACTLY with original CV
✅ suggested_additions contains any skills that couldn't fit (max 5 items)
✅ suggested_additions items have valid target_experience_id references

If ANY of these checks fail, FIX THE OUTPUT before returning!

---

NOW, CREATE THE BEST CV THIS CANDIDATE HAS EVER SEEN. Make ${input.company} regret not hiring them sooner. This is the CV that changes their career. GO!`;
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
  
  if (originalExperiences.length !== rewrittenExperiences.length) {
    console.warn(
      `⚠️ Experience count mismatch: ${originalExperiences.length} original vs ${rewrittenExperiences.length} rewritten`
    );
    console.warn('Original experiences:', originalExperiences.map((e: any) => `${e.title} - ${e.company}`));
    console.warn('Rewritten experiences:', rewrittenExperiences.map((e: any) => `${e.title} - ${e.company}`));
    
    // Réécrire les expériences manquantes une par une
    for (const exp of originalExperiences) {
      const exists = rewrittenExperiences.find(
        (r: any) => 
          r.title?.toLowerCase() === exp.title?.toLowerCase() &&
          r.company?.toLowerCase() === exp.company?.toLowerCase()
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


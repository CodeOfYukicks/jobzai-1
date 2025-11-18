/**
 * CV Rewrite Service
 * Generates AI-powered CV rewrites tailored to specific job descriptions
 * WITHOUT inventing false information
 */

import { CVRewrite } from '../types/premiumATS';

interface CVRewriteInput {
  cvText: string;
  jobDescription: string;
  atsAnalysis: {
    strengths: string[];
    gaps: string[];
    keywords: string[];
    matchScore: number;
  };
  jobTitle: string;
  company: string;
}

/**
 * Generate the ULTIMATE CV rewriting prompt
 * This prompt creates world-class CVs that get interviews
 */
function generateCVRewritePrompt(input: CVRewriteInput): string {
  return `You are THE WORLD'S BEST CV STRATEGIST - Elite headhunter with 20+ years placing candidates at FAANG, McKinsey, and Fortune 500 companies.

Your mission: Transform this CV into one that makes ${input.company} IMMEDIATELY call this candidate for the ${input.jobTitle} position.

## CRITICAL CONTEXT:
- **Target Company**: ${input.company}
- **Target Position**: ${input.jobTitle}
- **Current Match Score**: ${input.atsAnalysis.matchScore}%
- **YOUR GOAL**: Transform this into a 90%+ match that gets an interview

## ORIGINAL CV:
"""
${input.cvText}
"""

## JOB DESCRIPTION (STUDY EVERY WORD):
"""
${input.jobDescription}
"""

## ATS ANALYSIS INSIGHTS:
**Strengths to AMPLIFY (make these SHINE):**
${input.atsAnalysis.strengths.map(s => `✓ ${s}`).join('\n')}

**Gaps to ADDRESS (without lying, use positioning):**
${input.atsAnalysis.gaps.map(g => `⚠ ${g}`).join('\n')}

**Missing Keywords to INTEGRATE NATURALLY:**
${input.atsAnalysis.keywords.slice(0, 30).join(', ')}

---

## YOUR WORLD-CLASS REWRITING STRATEGY:

### 1. 🎯 PSYCHOLOGICAL POSITIONING (Most Critical!)
- Identify the EXACT persona ${input.company} wants for ${input.jobTitle}
- What's the ONE narrative that makes this candidate irresistible?
- Lead with the strongest angle: Technical excellence? Leadership? Business impact? Innovation?
- Position weaknesses as "opportunities for fresh perspective"

### 2. 🔑 KEYWORD ALCHEMY (Not keyword stuffing!)
- Weave missing keywords NATURALLY into existing achievements
- Use the EXACT terminology that ${input.company} uses in the job description
- Mirror the language patterns from the job posting
- Create "keyword clusters" in Skills and Summary sections for maximum ATS impact
- Repeat critical keywords 2-3 times across different sections (naturally!)

### 3. 📊 QUANTIFICATION MAXIMIZATION
- EVERY achievement MUST have a number, percentage, scale, or timeframe
- Transform vague statements into powerful metrics:
  * "Improved performance" → "Accelerated system response time by 73%, supporting 2.5M daily active users"
  * "Led team" → "Led cross-functional team of 8 engineers, delivering $2M+ revenue features 3 weeks ahead of schedule"
- Show business impact in: Revenue, Cost savings, Time saved, Users impacted, Efficiency gained

### 4. ⚡ POWER VERB ARSENAL
Replace ALL weak verbs with impact verbs:
- ❌ "Worked on" → ✅ "Architected", "Engineered", "Built", "Delivered"
- ❌ "Helped" → ✅ "Enabled", "Facilitated", "Drove", "Catalyzed"
- ❌ "Was responsible for" → ✅ "Owned", "Led", "Championed", "Spearheaded"
- ❌ "Participated in" → ✅ "Contributed", "Collaborated", "Partnered with"

### 5. 👔 SENIORITY ELEVATION (Make it Senior-Level)
Transform EVERY statement to sound senior:
- Emphasize LEADERSHIP and INFLUENCE, not just execution
- Show STRATEGIC thinking and ARCHITECTURAL decisions
- Highlight CROSS-FUNCTIONAL collaboration and stakeholder management
- Demonstrate BUSINESS ACUMEN and ROI thinking
- Feature MENTORSHIP, hiring, and team building
- Example: "Coded features" → "Architected scalable microservices platform, establishing engineering patterns adopted across 5 product teams"

### 6. 🤖 ATS OPTIMIZATION SECRETS
- Front-load keywords in first 1/3 of resume (Summary + first experience)
- Create a "Core Competencies" or "Technical Expertise" section with keyword clusters
- Use standard section headers that ATS systems recognize
- Ensure critical keywords appear 2-3 times naturally across sections
- No tables, no graphics, no fancy formatting - pure parseable text
- Include both acronyms AND full terms: "CI/CD (Continuous Integration/Continuous Deployment)"

### 7. 📖 NARRATIVE FLOW (Tell a Story)
- Most impressive/relevant experience FIRST (even if not most recent)
- Each bullet builds on the previous (crescendo effect)
- Show progression: Individual Contributor → Tech Lead → Architect
- Create a story of increasing impact and responsibility

### 8. 🎨 FORMATTING EXCELLENCE
- Use markdown headers: ## for sections, ### for job titles
- Bullets with powerful opening words
- Consistent date formats
- Clean, scannable structure
- Each bullet: [Action Verb] + [What you did] + [Quantified Result/Impact]

### 9. 📏 ONE-PAGE CV OPTIMIZATION (Critical for A4 Format)
- **Professional Summary**: Keep to 2-3 sentences maximum (50-60 words). Be concise and impactful.
- **Bullet Points**: Limit to 3-5 bullets per experience, maximum 20 words per bullet. Prioritize most relevant achievements.
- **Content Density**: Generate compact, impactful content that fits naturally on one A4 page (297mm height).
- **Word Economy**: Use powerful, concise language. Remove filler words. Every word must add value.
- **Section Balance**: Distribute content evenly. Don't let one section dominate. If content is extensive, condense less relevant parts.
- **Goal**: The final CV should fit comfortably on one page without looking cramped or losing readability.

---

## ABSOLUTE RULES - NEVER VIOLATE:
1. ✅ ONLY use information that exists in the original CV
2. ❌ NEVER invent jobs, dates, companies, metrics, degrees, or achievements
3. ✅ Rephrase, restructure, amplify, and emphasize - but ALWAYS truthful
4. ✅ If a metric isn't in the CV, don't invent it (but you can add "~" for estimates if reasonable)
5. ✅ If there's a gap, address it through smart positioning, not fabrication

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
  // Import parseCVData dynamically to avoid circular dependencies
  const { parseCVData } = await import('./cvSectionAI');
  const { rewriteSingleExperience } = await import('./experienceRewriter');
  
  // 1. Génération initiale du CV réécrit
  const prompt = generateCVRewritePrompt(input);
  const result = await callOpenAIForRewrite(prompt);
  
  // 2. Parser le CV initial pour obtenir les expériences
  const parsedInitial = parseCVData({ initial_cv: input.cvText });
  const originalExperiences = parsedInitial.experience || [];
  
  console.log(`📊 CV Original: ${originalExperiences.length} expériences détectées`, 
    originalExperiences.map((exp: any) => `${exp.title} at ${exp.company}`)
  );
  
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
              keywords: input.atsAnalysis.keywords,
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
  
  // 5. Reconstruire le markdown avec toutes les expériences
  const parsedRewritten = parseCVData(result);
  const finalMarkdown = rebuildMarkdownFromStructured({
    ...parsedRewritten,
    experience: rewrittenExperiences,
  });
  
  // 6. Construire structured_data complet et robuste
  // Utiliser structured_data du résultat si disponible, sinon construire depuis parsedRewritten
  let finalStructuredData = result.structured_data;
  
  if (!finalStructuredData || !finalStructuredData.experiences || finalStructuredData.experiences.length !== rewrittenExperiences.length) {
    // Construire structured_data depuis les données parsées
    console.log('🔧 Construction de structured_data depuis les données parsées...');
    
    finalStructuredData = {
      personalInfo: parsedRewritten.personalInfo || parsedInitial.personalInfo || {},
      summary: parsedRewritten.summary || parsedInitial.summary || '',
      experiences: rewrittenExperiences.map((exp: any) => ({
        id: exp.id || `exp-${rewrittenExperiences.indexOf(exp)}`,
        title: exp.title || '',
        company: exp.company || '',
        client: exp.client || undefined,
        startDate: exp.startDate || '',
        endDate: exp.endDate || 'Present',
        duration: exp.duration || undefined,
        location: exp.location || undefined,
        bullets: Array.isArray(exp.bullets) ? exp.bullets : (exp.description || []),
      })),
      educations: (parsedRewritten.education || parsedInitial.education || []).map((edu: any, idx: number) => ({
        id: edu.id || `edu-${idx}`,
        degree: edu.degree || '',
        institution: edu.institution || '',
        startDate: edu.startDate || undefined,
        endDate: edu.endDate || edu.year || '',
        year: edu.year || edu.endDate || undefined,
        gpa: edu.gpa || undefined,
        honors: edu.honors || undefined,
        details: edu.details || '',
      })),
      skills: parsedRewritten.skills || parsedInitial.skills || [],
      languages: (parsedRewritten.languages || parsedInitial.languages || []).map((lang: any) => {
        if (typeof lang === 'string') {
          // Parser "French | Native" ou "French - Native"
          const parts = lang.split(/[|-]/).map(p => p.trim());
          return { name: parts[0] || lang, level: parts[1] || 'Intermediate' };
        }
        return {
          name: lang.name || lang,
          level: lang.level || lang.proficiency || 'Intermediate',
        };
      }),
      certifications: (parsedRewritten.certifications || parsedInitial.certifications || []).map((cert: any) => {
        if (typeof cert === 'string') {
          return { name: cert };
        }
        return {
          name: cert.name || cert,
          issuer: cert.issuer || undefined,
          date: cert.date || undefined,
          year: cert.year || undefined,
          credentialId: cert.credentialId || undefined,
          details: cert.details || undefined,
        };
      }),
      hobbies: parsedRewritten.hobbies || parsedInitial.hobbies || [],
    };
    
    console.log(`✅ structured_data construit: ${finalStructuredData.experiences.length} expériences, ${finalStructuredData.educations.length} éducations`);
  }
  
  // 7. Validation finale
  const validation = {
    original_experiences_count: originalExperiences.length,
    rewritten_experiences_count: finalStructuredData.experiences.length,
    original_educations_count: (parsedInitial.education || []).length,
    rewritten_educations_count: finalStructuredData.educations.length,
    match: originalExperiences.length === finalStructuredData.experiences.length &&
           (parsedInitial.education || []).length === finalStructuredData.educations.length,
  };
  
  if (!validation.match) {
    console.warn('⚠️ Validation échouée:', validation);
  } else {
    console.log('✅ Validation réussie:', validation);
  }
  
  return {
    analysis: result.analysis || {
      positioning_strategy: '',
      strengths: [],
      gaps: [],
      recommended_keywords: [],
      experience_relevance: [],
    },
    initial_cv: finalMarkdown || result.initial_cv,
    cv_templates: result.cv_templates || {},
    internal_prompt_used: prompt,
    structured_data: finalStructuredData, // NOUVEAU: Structure JSON complète
    validation: validation, // NOUVEAU: Validation des comptes
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


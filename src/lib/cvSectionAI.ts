/**
 * AI Service for Section-by-Section CV Rewriting
 * ULTIMATE QUALITY - Ultra-precise prompts with full context
 */

interface SectionRewriteInput {
  sectionType: string;
  currentContent: string;
  action: string;
  fullCV?: string; // Complete CV for context
  jobContext: {
    jobTitle: string;
    company: string;
    jobDescription?: string;
    keywords: string[];
    strengths: string[];
    gaps: string[];
  };
}

/**
 * Build ultra-precise context-aware prompts for each action
 */
function buildActionPrompt(input: SectionRewriteInput): string {
  const baseContext = `
# CONTEXT - WORLD-CLASS CV OPTIMIZATION

You are THE BEST CV strategist in the world, with 20+ years placing candidates at FAANG, McKinsey, and Fortune 500 companies.
Your mission: Transform this section to make **${input.jobContext.company}** IMMEDIATELY want to interview this candidate for **${input.jobContext.jobTitle}**.

## 🎯 TARGET POSITION:
- **Role**: ${input.jobContext.jobTitle}
- **Company**: ${input.jobContext.company}
${input.jobContext.jobDescription ? `- **Requirements**: ${input.jobContext.jobDescription.substring(0, 500)}...` : ''}

## 💪 STRENGTHS TO AMPLIFY (Make these SHINE):
${input.jobContext.strengths.map(s => `  ✓ ${s}`).join('\n') || 'No specific strengths identified'}

## ⚠️ GAPS TO ADDRESS (Position cleverly without lying):
${input.jobContext.gaps.map(g => `  → ${g}`).join('\n') || 'No significant gaps identified'}

## 🔑 MUST-HAVE KEYWORDS (Integrate naturally):
${input.jobContext.keywords.slice(0, 15).join(', ') || 'No specific keywords identified'}

${input.fullCV ? `## 📄 FULL CV CONTEXT (for consistency):\n${input.fullCV.substring(0, 1500)}...\n` : ''}

## 📝 CURRENT SECTION TO OPTIMIZE (${input.sectionType.toUpperCase()}):
"""
${input.currentContent}
"""

## CRITICAL RULES:
1. ✅ ONLY use information that exists - NEVER invent facts
2. ✅ Every statement must be QUANTIFIED if possible (%, $, #, time)
3. ✅ Use POWER VERBS (Led, Architected, Drove, Delivered, Spearheaded)
4. ✅ Mirror the EXACT language from the job description
5. ✅ Make it sound SENIOR and STRATEGIC, not just operational
6. ✅ Optimize for ATS parsing (clean structure, keywords repeated 2-3x)
7. ✅ Keep content CONCISE for one-page A4 format
8. ⚠️ DO NOT DUPLICATE - Return ONE improved version, not multiple versions
9. ⚠️ MAINTAIN STRUCTURE - Keep the same number of bullet points/items as input
10. ⚠️ NO REPETITION - Each bullet point must be unique and distinct`;

  let actionInstructions = '';
  
  switch (input.action) {
    case 'rewrite':
      actionInstructions = `
## ACTION: COMPLETE PROFESSIONAL REWRITE 🚀

Transform this section into a WORLD-CLASS statement that makes ${input.jobContext.company} desperate to hire this candidate.

**YOUR REWRITING STRATEGY:**

1. **PSYCHOLOGICAL POSITIONING** 🧠
   - What does ${input.jobContext.company} REALLY want for this ${input.jobContext.jobTitle} role?
   - Frame EVERYTHING through that lens
   - Lead with the most impressive/relevant achievements

2. **POWER VERB ARSENAL** ⚡
   - Replace ALL weak verbs immediately:
     ❌ "Worked on" → ✅ "Architected", "Engineered", "Delivered"
     ❌ "Helped" → ✅ "Enabled", "Catalyzed", "Drove"
     ❌ "Was responsible for" → ✅ "Owned", "Led", "Spearheaded"

3. **QUANTIFICATION MAXIMIZATION** 📊
   - EVERY achievement needs a number:
     • Team size, budget, timeline, impact
     • Performance improvements (73% faster, 2.5x growth)
     • Scale (2M users, $5M revenue, 15 countries)

4. **KEYWORD INTEGRATION** 🔑
   - Weave in these missing keywords NATURALLY:
     ${input.jobContext.keywords.slice(0, 5).join(', ')}
   - Use exact terminology from the job description
   - Repeat critical keywords 2-3 times across the content

5. **SENIORITY ELEVATION** 👔
   - Show STRATEGIC thinking, not just execution
   - Emphasize LEADERSHIP and INFLUENCE
   - Highlight CROSS-FUNCTIONAL collaboration
   - Demonstrate BUSINESS IMPACT

**OUTPUT REQUIREMENTS:**
- Concise, impactful statements (20 words max per bullet)
- Front-load keywords in first 1/3 of content
- Use parallel structure for consistency
- Optimize for one-page A4 format

Return ONLY the rewritten content, ready to paste.`;
      break;

    case 'improve':
    case 'improve_tone':
      actionInstructions = `
## ACTION: IMPROVE TONE TO SENIOR/CONFIDENT LEVEL

Elevate the tone of this section to sound more senior, confident, and achievement-oriented.

**Your Mission:**
1. **Replace** passive language with active, powerful verbs
2. **Transform** task descriptions into achievement statements
3. **Emphasize** leadership, ownership, and impact
4. **Remove** weak words (helped, assisted, worked on, participated)
5. **Add** confidence and authority to the language
6. **Highlight** decision-making and strategic contributions

**Examples of Tone Improvement:**
- "Worked on frontend" → "Architected and delivered core frontend infrastructure"
- "Helped improve performance" → "Led performance optimization initiative, achieving 60% faster load times"
- "Participated in code reviews" → "Established and enforced code review standards across 15-person engineering team"

**Critical Rules:**
- Keep ALL factual content unchanged
- Only change phrasing and tone
- Don't invent achievements
- Make every statement stronger and more confident

Return ONLY the improved section content.`;
      break;

    case 'metrics':
    case 'add_metrics':
      actionInstructions = `
## ACTION: EMPHASIZE METRICS & QUANTIFY ACHIEVEMENTS

Make this section more impactful by highlighting quantifiable achievements and measurable outcomes.

**Your Mission:**
1. **Identify** any existing metrics in the content (%, numbers, time, scale, team size, revenue, users, etc.)
2. **Emphasize** these metrics by placing them prominently in each statement
3. **Structure** bullets to lead with impact: "[Action] [Metric/Outcome] [Context]"
4. **Add context** to numbers where appropriate (e.g., "30% improvement in..." rather than just "30%")
5. **Highlight** scale and scope (team size, budget, users, geographic reach)

**Metric Priority:**
- Business impact (revenue, cost savings, ROI)
- Performance improvements (%, time reductions, efficiency gains)
- Scale (users, transactions, data volume)
- Team leadership (team size, people managed, mentored)
- Delivery (projects shipped, features launched, timelines met)

**Examples:**
- "Improved system performance" → "Optimized system architecture, reducing response time by 65% and increasing throughput to 10M requests/day"
- "Led a team" → "Led cross-functional team of 8 engineers, delivering $2M+ revenue-generating features on time and 15% under budget"

**Critical Rules:**
- ONLY use metrics that exist in the original content
- If no metrics exist, keep the content as is (don't invent)
- Make existing metrics more prominent and contextualized
- Ensure metrics are specific and credible

Return ONLY the metrics-enhanced section content.`;
      break;

    case 'senior':
    case 'make_senior':
      actionInstructions = `
## ACTION: ELEVATE TO SENIOR-LEVEL POSITIONING

Rewrite this section to emphasize senior-level responsibilities, leadership, and strategic impact.

**Your Mission:**
1. **Highlight** leadership and team management aspects
2. **Emphasize** strategic decision-making and architecture
3. **Show** cross-functional collaboration and stakeholder management
4. **Demonstrate** business acumen and impact on company goals
5. **Feature** mentorship, hiring, and team building
6. **Showcase** technical depth combined with business understanding

**Senior-Level Indicators to Emphasize:**
- Architecture and system design decisions
- Technical leadership and mentorship
- Cross-team collaboration
- Strategic planning and roadmap contribution
- Hiring and team building
- Stakeholder communication
- Business impact and revenue influence
- Industry best practices and standards

**Transformation Examples:**
- "Developed features" → "Led technical architecture and development of core platform features, establishing patterns adopted across 5 product teams"
- "Code reviews" → "Established engineering excellence standards through rigorous code reviews, technical mentorship of 6 engineers, and architectural decision records"
- "Worked with product team" → "Partnered with product leadership to define technical strategy, translating business requirements into scalable engineering solutions"

**Critical Rules:**
- Only emphasize senior aspects that exist in the content
- Don't invent leadership roles or responsibilities
- Frame existing work in senior-level language
- Show strategic thinking and broader impact

Return ONLY the senior-level rewritten content.`;
      break;

    case 'keywords':
    case 'insert_keywords':
      actionInstructions = `
## ACTION: STRATEGIC KEYWORD INTEGRATION

Naturally integrate critical missing keywords to improve ATS match score and recruiter resonance.

**Missing Keywords to Integrate:**
${input.jobContext.keywords.slice(0, 12).join(', ')}

**Your Mission:**
1. **Analyze** each keyword for relevance to this section
2. **Identify** where keywords fit naturally in the existing content
3. **Integrate** keywords smoothly without forcing or keyword-stuffing
4. **Maintain** natural language flow and readability
5. **Ensure** keywords make sense in context
6. **Prioritize** the most critical keywords for this specific section

**Integration Strategies:**
- Add keywords as technologies/tools used: "using React, TypeScript, and Node.js"
- Add as methodologies: "following Agile/Scrum practices"
- Add in context of achievements: "Led migration to microservices architecture"
- Add as skills demonstrated: "demonstrated expertise in system design and scalability"

**Examples:**
- Original: "Built web applications"
- Enhanced: "Architected and delivered scalable web applications using React, TypeScript, and GraphQL"

- Original: "Improved team productivity"
- Enhanced: "Enhanced team velocity by 40% through CI/CD automation, code review standards, and Agile sprint optimization"

**Critical Rules:**
- ONLY add keywords that make contextual sense
- Don't force-fit keywords awkwardly
- Maintain professional, natural language
- If a keyword doesn't fit naturally, skip it
- Prioritize readability over keyword count

Return ONLY the keyword-enhanced section content.`;
      break;

    case 'shorten':
      actionInstructions = `
## ACTION: MAKE MORE CONCISE

Condense this section while keeping the most impactful and relevant information for the ${input.jobContext.jobTitle} role.

**Your Mission:**
1. **Identify** the most impactful achievements and statements
2. **Remove** redundancy and filler words
3. **Combine** related points where possible
4. **Keep** all quantified achievements and metrics
5. **Preserve** job-relevant skills and experiences
6. **Eliminate** generic statements that don't add value
7. **Focus** on what matters most for THIS specific job

**Shortening Strategies:**
- Remove weak verbs and qualifiers
- Combine similar accomplishments
- Cut generic responsibilities (keep unique achievements)
- Focus on outcomes over processes
- Prioritize quantified results

**Examples:**
- Before (wordy): "Was responsible for working on and helping to improve the frontend architecture of our main application which resulted in better performance"
- After (concise): "Optimized frontend architecture, improving performance by 45%"

**Critical Rules:**
- Keep the BEST and most relevant content
- Don't lose important achievements
- Maintain all factual information
- Target 30-40% reduction in length
- Keep professional tone

Return ONLY the concise, impactful content.`;
      break;

    case 'expand':
      actionInstructions = `
## ACTION: EXPAND WITH STRATEGIC DETAIL

Add depth and detail to this section by elaborating on methodologies, technologies, impact, and context.

**Your Mission:**
1. **Add technical depth** - Mention specific technologies, frameworks, methodologies used
2. **Expand on impact** - Add context to achievements (before/after, scale, business value)
3. **Show methodology** - Explain approach and problem-solving process
4. **Demonstrate** cross-functional collaboration and stakeholder engagement
5. **Include** relevant keywords naturally as you expand
6. **Provide** context that showcases expertise

**Expansion Strategies:**
- Add "how" to achievements: "...by implementing [methodology/technology]"
- Add scale and context: "...across 5 product teams serving 2M+ users"
- Add business impact: "...resulting in $X revenue increase" or "...enabling Y business capability"
- Add technical stack: "...using React, TypeScript, GraphQL, and AWS"

**Examples:**
- Before: "Led team to improve application"
- After: "Led cross-functional team of 6 engineers to architect and deliver scalable microservices platform using Node.js, Kubernetes, and PostgreSQL, improving deployment frequency by 300% and enabling 10x user growth capacity"

**Critical Rules:**
- ONLY expand based on what's IMPLIED or reasonable from existing content
- Don't invent specific metrics or technologies not present
- Add depth and context, not fabrication
- Make expansions relevant to the target job
- Ensure expanded content sounds natural and credible

Return ONLY the expanded section content.`;
      break;

    default:
      actionInstructions = `
## ACTION: IMPROVE THIS SECTION

Enhance this section to better position the candidate for the ${input.jobContext.jobTitle} role.

Return ONLY the improved section content.`;
  }

  return baseContext + actionInstructions + `

## OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "content": "the improved section text here"
}

⚠️ CRITICAL OUTPUT RULES TO PREVENT DUPLICATION:
1. Return ONLY ONE improved version - NEVER duplicate or repeat content
2. Maintain the EXACT same structure as input (same number of bullets/items)
3. Each bullet point must be UNIQUE - no repetition of information
4. If input has 3 bullet points, output EXACTLY 3 improved bullet points
5. DO NOT concatenate or merge multiple attempts
6. The "content" field should contain ONLY the final improved text
7. NO explanations, NO markdown formatting, NO code blocks
8. Just the clean, improved text ready to paste into the CV`;
}

/**
 * Generate improved section content using AI with ultimate quality prompts
 * Uses the existing /api/chatgpt endpoint (same as rest of app)
 */
export async function rewriteSection(input: SectionRewriteInput): Promise<string> {
  const prompt = buildActionPrompt(input);

  try {
    // Use the existing API endpoint (same as CVOptimizerPage, etc.)
    const response = await fetch('/api/chatgpt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'cv-section-rewrite',
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'AI service unavailable' }));
      throw new Error(errorData.message || 'Failed to rewrite section');
    }

    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'AI service returned an error');
    }

    // Extract content from response
    let content = '';
    if (typeof data.content === 'string') {
      content = data.content;
    } else if (data.content && typeof data.content === 'object') {
      // OpenAI returns JSON object with 'content' field
      if (data.content.content) {
        content = data.content.content;
      } else {
        // Fallback to stringifying the whole object
        content = JSON.stringify(data.content);
      }
    }

    return content.trim();
  } catch (error: any) {
    console.error('Section rewrite error:', error);
    throw new Error(error.message || 'Failed to rewrite section');
  }
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractSectionContent = (content: string, titles: string[]): string => {
  if (!content) return '';
  const pattern = new RegExp(
    `##\\s+(?:${titles.map(escapeRegExp).join('|')})\\s*\\n?([\\s\\S]*?)(?=\\n##|$)`,
    'i'
  );
  const match = content.match(pattern);
  return match ? match[1].trim() : '';
};

const splitBlocksByHeading = (sectionText: string): string[] => {
  if (!sectionText?.trim()) return [];
  
  // Pattern amélioré pour détecter les blocs avec headers ###
  // Supporte: \n###, \n\n###, ### au début de ligne
  const blocks = sectionText
    .split(/(?=\n*###\s+)/)
    .map(block => block.trim())
    .filter(Boolean);
  
  // Si on n'a trouvé qu'un seul bloc mais qu'il contient plusieurs ###, essayer de le diviser
  if (blocks.length === 1 && blocks[0].match(/###\s+/g)?.length > 1) {
    // Diviser par lignes qui commencent par ###
    const lines = blocks[0].split('\n');
    const newBlocks: string[] = [];
    let currentBlock: string[] = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('###')) {
        // Nouveau bloc détecté
        if (currentBlock.length > 0) {
          newBlocks.push(currentBlock.join('\n'));
        }
        currentBlock = [line];
      } else if (currentBlock.length > 0) {
        currentBlock.push(line);
      }
    }
    
    // Ajouter le dernier bloc
    if (currentBlock.length > 0) {
      newBlocks.push(currentBlock.join('\n'));
    }
    
    return newBlocks.length > 0 ? newBlocks : blocks;
  }
  
  return blocks;
};

const normalizeBulletLine = (line: string) => line.replace(/^[-•*\s]+/, '').trim();

/**
 * Normalize date strings to a consistent format
 * Handles: "Jan 2020", "2020-01", "2020", "January 2020", "01/2020", etc.
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  
  const cleaned = dateStr.trim();
  
  // Handle "Present", "Current", etc.
  if (/present|current|actuel|en cours/i.test(cleaned)) {
    return 'Present';
  }
  
  // Handle formats like "Jan 2020", "January 2020"
  const monthYearMatch = cleaned.match(/([a-z]+)\s+(\d{4})/i);
  if (monthYearMatch) {
    const month = monthYearMatch[1].substring(0, 3);
    const year = monthYearMatch[2];
    return `${month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()} ${year}`;
  }
  
  // Handle formats like "2020-01", "2020/01"
  const yearMonthMatch = cleaned.match(/(\d{4})[-/](\d{1,2})/);
  if (yearMonthMatch) {
    const year = yearMonthMatch[1];
    const monthNum = parseInt(yearMonthMatch[2]);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${months[monthNum - 1]} ${year}`;
    }
  }
  
  // Handle formats like "01/2020", "01-2020"
  const monthYearSlashMatch = cleaned.match(/(\d{1,2})[-/](\d{4})/);
  if (monthYearSlashMatch) {
    const monthNum = parseInt(monthYearSlashMatch[1]);
    const year = monthYearSlashMatch[2];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${months[monthNum - 1]} ${year}`;
    }
  }
  
  // Handle year only "2020"
  const yearOnlyMatch = cleaned.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    return yearOnlyMatch[1];
  }
  
  // Return as-is if no pattern matches
  return cleaned;
}

const parsePeriodLine = (line?: string) => {
  if (!line) return { start: '', end: '' };
  const cleaned = line.replace(/\s{2,}/g, ' ').trim();
  
  // Try multiple patterns
  const patterns = [
    /([\w./]+\s*\d{4}|Present|Current|Actuel)\s*[-–—]\s*([\w./]+\s*\d{4}|Present|Current|Actuel)/i,
    /(\d{4})\s*[-–—]\s*(\d{4}|Present|Current|Actuel)/i,
    /([a-z]+\s+\d{4})\s*[-–—]\s*([a-z]+\s+\d{4}|Present|Current|Actuel)/i,
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      return {
        start: normalizeDate(match[1].trim()),
        end: normalizeDate(match[2].trim()),
      };
    }
  }
  
  return { start: '', end: '' };
};

/**
 * Detect experiences even without ### headers
 * Looks for patterns like "Job Title at Company (2020-2022)" or similar
 */
function detectExperiencesWithoutHeaders(text: string): any[] {
  const experiences: any[] = [];
  
  // Pattern 1: "Job Title at Company Name (Start - End)"
  const pattern1 = /([^•\n]+?)\s+at\s+([^(]+?)\s*\(([^)]+)\)/gi;
  let match;
  while ((match = pattern1.exec(text)) !== null) {
    const title = match[1].trim();
    const company = match[2].trim();
    const period = match[3].trim();
    const { start, end } = parsePeriodLine(period);
    
    if (title && company) {
      experiences.push({
        title,
        company,
        startDate: start,
        endDate: end,
        isCurrent: /present|current/i.test(end),
        bullets: [],
        order: experiences.length,
      });
    }
  }
  
  // Pattern 2: Look for job titles followed by company and dates on next lines
  const lines = text.split('\n');
  for (let i = 0; i < lines.length - 2; i++) {
    const line1 = lines[i].trim();
    const line2 = lines[i + 1].trim();
    const line3 = lines[i + 2].trim();
    
    // Check if line2 looks like a company and line3 looks like dates
    if (
      line1 &&
      !line1.startsWith('#') &&
      !line1.startsWith('-') &&
      !line1.startsWith('•') &&
      line2 &&
      !line2.match(/^\d/) &&
      line3.match(/\d{4}/)
    ) {
      const { start, end } = parsePeriodLine(line3);
      if (start || end) {
        // Try to split line1 into title and company if it contains " - "
        const parts = line1.split(' - ');
        if (parts.length >= 2) {
          experiences.push({
            title: parts[0].trim(),
            company: parts.slice(1).join(' - ').trim(),
            startDate: start,
            endDate: end,
            isCurrent: /present|current/i.test(end),
            bullets: [],
            order: experiences.length,
          });
        }
      }
    }
  }
  
  return experiences;
}

/**
 * Detect sub-experiences within a single block (e.g., multiple projects under same company)
 * Looks for patterns like "Project Name (XX months)", "Company - Project", or bold project names
 */
function detectSubExperiences(blockText: string, mainTitle: string, mainCompany: string): any[] {
  const subExperiences: any[] = [];
  const lines = blockText.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Pattern 1: Lines like "Project Name - Company (XX months)" or "Project Name (XX months)"
  const projectPatternMonths = /^([^-•\n]+?)\s*[-–—]?\s*([^(]+?)?\s*\((\d+)\s*months?\)/i;
  
  // Pattern 2: Lines like "Project Name - Company" or "Project Name" followed by dates
  const projectPatternName = /^([A-Z][^-•\n]{3,}?)(?:\s*[-–—]\s*([A-Z][^-•\n]+))?$/;
  
  // Pattern 3: Lines with dates that might indicate a new project section
  const datePattern = /(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)/i;
  
  let currentSubExp: any = null;
  let currentBullets: string[] = [];
  let foundFirstProject = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip the main header line (already processed)
    if (line.startsWith('###')) continue;
    
    // Skip date lines that belong to main experience
    if (i < 3 && datePattern.test(line) && !foundFirstProject) {
      continue; // This is probably the main experience date
    }
    
    // Check for project pattern with months
    const projectMatchMonths = line.match(projectPatternMonths);
    if (projectMatchMonths) {
      // Save previous sub-experience if exists
      if (currentSubExp) {
        currentSubExp.bullets = currentBullets;
        subExperiences.push(currentSubExp);
      }
      
      // Start new sub-experience
      const projectName = projectMatchMonths[1].trim();
      const companyName = projectMatchMonths[2]?.trim() || mainCompany;
      
      currentSubExp = {
        title: projectName,
        company: companyName,
        duration: `${projectMatchMonths[3]} months`,
        bullets: [],
      };
      currentBullets = [];
      foundFirstProject = true;
      continue;
    }
    
    // Check for project name pattern (bold text, company names, etc.)
    // Look for lines that look like project/client names (capitalized, not bullets, not dates)
    if (!line.startsWith('-') && !line.startsWith('•') && !line.startsWith('*') && 
        !datePattern.test(line) && 
        line.length > 5 && line.length < 100 &&
        /^[A-Z]/.test(line) && // Starts with capital
        !line.includes('@') && // Not an email
        !line.match(/^\d+%/) && // Not a percentage
        (line.includes('-') || line.match(/^[A-Z][a-z]+/))) { // Has dash or looks like a name
      
      // Check if next line has dates
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const nextHasDate = datePattern.test(nextLine);
      
      // Check if previous line was empty or a bullet (indicates new section)
      const prevLine = i > 0 ? lines[i - 1] : '';
      const isNewSection = !prevLine || prevLine.startsWith('-') || prevLine.startsWith('•');
      
      if ((nextHasDate || isNewSection) && !currentSubExp) {
        // This might be a new project/client name
        const parts = line.split(/\s*[-–—]\s*/);
        currentSubExp = {
          title: parts[0]?.trim() || line,
          company: parts[1]?.trim() || mainCompany,
          bullets: [],
        };
        currentBullets = [];
        foundFirstProject = true;
        
        if (nextHasDate) {
          const dateMatch = nextLine.match(datePattern);
          if (dateMatch) {
            currentSubExp.startDate = dateMatch[1];
            currentSubExp.endDate = dateMatch[2];
            i++; // Skip the date line
          }
        }
        continue;
      }
    }
    
    // Check for dates pattern that might indicate new project
    const dateMatch = line.match(datePattern);
    if (dateMatch && currentSubExp && !currentSubExp.startDate) {
      // Add dates to current sub-experience
      currentSubExp.startDate = dateMatch[1];
      currentSubExp.endDate = dateMatch[2];
      continue;
    }
    
    // Collect bullets for current sub-experience
    if (currentSubExp && (line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))) {
      currentBullets.push(normalizeBulletLine(line));
    } else if (!currentSubExp && (line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))) {
      // Bullets without a sub-experience - might be main experience bullets
      // We'll keep them for the main experience
    }
  }
  
  // Save last sub-experience
  if (currentSubExp) {
    currentSubExp.bullets = currentBullets;
    subExperiences.push(currentSubExp);
  }
  
  return subExperiences;
}

const parseExperienceBlocks = (sectionText: string): any[] => {
  const blocks = splitBlocksByHeading(sectionText);
  
  console.log(`🔍 splitBlocksByHeading returned ${blocks.length} blocks`);
  
  // Fallback: try to detect experiences without headers
  if (!blocks.length) {
    console.log('⚠️ No blocks found, trying detectExperiencesWithoutHeaders');
    const detected = detectExperiencesWithoutHeaders(sectionText);
    if (detected.length > 0) {
      console.log(`✅ Detected ${detected.length} experiences without headers`);
      return detected.map((exp, idx) => ({
        ...exp,
        id: `exp-${idx}`,
      }));
    }
    return [];
  }
  
  const parsedExperiences: any[] = [];
  
  blocks.forEach((block, idx) => {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    if (!lines.length) {
      return;
    }

    const headerLine = lines[0].replace(/^###\s*/, '');
    const [title, ...companyParts] = headerLine.split(' - ');
    const company = companyParts.join(' - ').trim();

    let periodLine = '';
    const bullets: string[] = [];
    let subExperiences: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!periodLine && !line.startsWith('-') && !line.startsWith('•') && !line.startsWith('*')) {
        // Check if this line looks like a date period
        if (line.match(/\d{4}|Present|Current/i)) {
          periodLine = line;
          continue;
        }
      }
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        bullets.push(normalizeBulletLine(line));
      }
    }

    const { start, end } = parsePeriodLine(periodLine);
    const isCurrent = /present|current|actuel/i.test(end);

    // Check if this block contains sub-experiences (multiple projects)
    // Si le bloc est très long, contient des patterns de sous-projets, ou plusieurs lignes de dates
    const hasMultipleDates = (block.match(/(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)/gi) || []).length > 1;
    const hasProjectPatterns = block.match(/\((\d+)\s*months?\)/i) || block.match(/[A-Z][a-z]+\s*[-–—]\s*[A-Z]/);
    
    if (block.length > 500 || hasMultipleDates || hasProjectPatterns) {
      subExperiences = detectSubExperiences(block, title, company);
      console.log(`🔍 Block ${idx} (${title}): contains ${subExperiences.length} sub-experiences`, {
        blockLength: block.length,
        hasMultipleDates,
        hasProjectPatterns: !!hasProjectPatterns,
      });
    }

    // Si on a trouvé des sous-expériences, les créer séparément
    if (subExperiences.length > 0) {
      subExperiences.forEach((subExp, subIdx) => {
        parsedExperiences.push({
          id: `exp-${idx}-${subIdx}`,
          title: subExp.title || title,
          company: subExp.company || company,
          startDate: subExp.startDate || normalizeDate(start),
          endDate: subExp.endDate || normalizeDate(end),
          isCurrent: subExp.endDate ? /present|current/i.test(subExp.endDate) : isCurrent,
          bullets: subExp.bullets.length > 0 ? subExp.bullets : bullets,
          order: parsedExperiences.length,
        });
      });
    } else {
      // Expérience normale
      parsedExperiences.push({
        id: `exp-${idx}`,
        title: (title || '').trim(),
        company: company || '',
        startDate: normalizeDate(start),
        endDate: normalizeDate(end),
        isCurrent,
        bullets: bullets.filter(Boolean).length > 0 ? bullets.filter(Boolean) : ['[No bullets provided]'],
        order: idx,
      });
    }
  });
  
  console.log(`✅ Total parsed experiences: ${parsedExperiences.length}`);
  return parsedExperiences.filter(Boolean);
};

const parseEducationBlocks = (sectionText: string): any[] => {
  const blocks = splitBlocksByHeading(sectionText);
  if (!blocks.length) return [];
  return blocks.map((block, idx) => {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    if (!lines.length) {
      return null;
    }
    const headerLine = lines[0].replace(/^###\s*/, '');
    const [degree, ...institutionParts] = headerLine.split(' - ');
    const institution = institutionParts.join(' - ').trim();
    let year = '';
    let detailsLines: string[] = [];

    if (lines[1] && !lines[1].startsWith('-') && !lines[1].startsWith('•')) {
      year = lines[1];
      detailsLines = lines.slice(2);
    } else {
      detailsLines = lines.slice(1);
    }

    const yearNormalized = normalizeDate(year.trim());
    const isCurrent = /present|current|actuel|en cours/i.test(yearNormalized);

    return {
      id: `edu-${idx}`, // ID unique
      degree: (degree || '').trim(),
      institution: institution || '',
      year: yearNormalized,
      endDate: yearNormalized, // Alias pour compatibilité
      isCurrent,
      details: detailsLines.join('\n').trim(),
      order: idx,
    };
  }).filter(Boolean);
};

const parseCertificationBlocks = (sectionText: string): any[] => {
  const blocks = splitBlocksByHeading(sectionText);
  if (!blocks.length) return [];
  return blocks.map(block => {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    if (!lines.length) return null;
    const headerLine = lines[0].replace(/^###\s*/, '');
    const [name, ...issuerParts] = headerLine.split(' - ');
    const issuer = issuerParts.join(' - ').trim();
    let year = '';
    let detailsLines: string[] = [];

    if (lines[1] && !lines[1].startsWith('-') && !lines[1].startsWith('•')) {
      year = lines[1];
      detailsLines = lines.slice(2);
    } else {
      detailsLines = lines.slice(1);
    }

    return {
      name: (name || '').trim(),
      issuer,
      year: year.trim(),
      details: detailsLines.join('\n').trim(),
    };
  }).filter(Boolean);
};

const parseLanguageEntries = (sectionText: string): any[] => {
  if (!sectionText?.trim()) return [];
  return sectionText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const cleaned = normalizeBulletLine(line);
      if (!cleaned) return null;
      const pipeMatch = cleaned.split('|');
      if (pipeMatch.length === 2) {
        return { name: pipeMatch[0].trim(), level: pipeMatch[1].trim() };
      }
      const dashMatch = cleaned.split(/[-–—]/);
      if (dashMatch.length === 2) {
        return { name: dashMatch[0].trim(), level: dashMatch[1].trim() };
      }
      const parenMatch = cleaned.match(/^(.+?)\s*\((.+)\)$/);
      if (parenMatch) {
        return { name: parenMatch[1].trim(), level: parenMatch[2].trim() };
      }
      return { name: cleaned };
    })
    .filter(Boolean);
};

const parseListFromSection = (sectionText: string): string[] => {
  if (!sectionText?.trim()) return [];
  return sectionText
    .split('\n')
    .map(line => normalizeBulletLine(line))
    .join(', ')
    .split(/[,;]+/)
    .map(item => item.trim())
    .filter(Boolean);
};

const getLabeledValue = (lines: string[], labels: string[]): string => {
  for (const line of lines) {
    for (const label of labels) {
      const regex = new RegExp(`^${escapeRegExp(label)}\\s*:\\s*(.+)$`, 'i');
      const match = line.match(regex);
      if (match) {
        return match[1].trim();
      }
    }
  }
  return '';
};

/**
 * Parse CV data from the generated rewrite into structured format
 */
// Helper function to convert structured data to CVData format
function convertStructuredDataToCVData(structuredData: any): any {
  console.log('Converting structured data to CVData format:', structuredData);
  
  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  return {
    personalInfo: {
      firstName: structuredData.personalInfo?.firstName || '',
      lastName: structuredData.personalInfo?.lastName || '',
      email: structuredData.personalInfo?.email || '',
      phone: structuredData.personalInfo?.phone || '',
      location: structuredData.personalInfo?.location || '',
      linkedin: structuredData.personalInfo?.linkedin || '',
      portfolio: structuredData.personalInfo?.portfolio || '',
      github: structuredData.personalInfo?.github || '',
      title: structuredData.personalInfo?.title || structuredData.personalInfo?.jobTitle || ''
    },
    summary: structuredData.summary || '',
    experiences: (structuredData.experiences || []).map((exp: any) => ({
      id: exp.id || generateId(),
      title: exp.title || exp.position || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.startDate || exp.start_date || '',
      endDate: exp.endDate || exp.end_date || '',
      current: exp.current || exp.endDate === 'Present',
      description: exp.description || '',
      bullets: exp.bullets || exp.achievements || []
    })),
    education: (structuredData.educations || structuredData.education || []).map((edu: any) => ({
      id: edu.id || generateId(),
      degree: edu.degree || '',
      field: edu.field || edu.major || '',
      institution: edu.institution || edu.school || '',
      location: edu.location || '',
      startDate: edu.startDate || edu.start_date || '',
      endDate: edu.endDate || edu.end_date || edu.graduationYear || '',
      gpa: edu.gpa || '',
      honors: edu.honors || [],
      coursework: edu.coursework || []
    })),
    skills: Array.isArray(structuredData.skills) 
      ? structuredData.skills.map((skill: string | any) => ({
          id: generateId(),
          name: typeof skill === 'string' ? skill : (skill.name || skill),
          category: typeof skill === 'object' ? (skill.category || 'technical') : 'technical'
        }))
      : [],
    certifications: (structuredData.certifications || []).map((cert: any) => ({
      id: cert.id || generateId(),
      name: cert.name || cert.title || '',
      issuer: cert.issuer || cert.organization || '',
      date: cert.date || cert.issue_date || '',
      expiryDate: cert.expiryDate || cert.expiry_date || '',
      credentialId: cert.credentialId || cert.credential_id || '',
      url: cert.url || ''
    })),
    projects: (structuredData.projects || []).map((project: any) => ({
      id: project.id || generateId(),
      name: project.name || project.title || '',
      description: project.description || '',
      technologies: project.technologies || [],
      url: project.url || project.link || '',
      startDate: project.startDate || project.start_date || '',
      endDate: project.endDate || project.end_date || '',
      highlights: project.highlights || project.achievements || []
    })),
    languages: (structuredData.languages || []).map((lang: any) => ({
      id: lang.id || generateId(),
      name: typeof lang === 'string' ? lang : (lang.name || lang.language || ''),
      proficiency: typeof lang === 'object' ? (lang.proficiency || lang.level || 'intermediate') : 'intermediate'
    })),
    sections: [
      { id: 'personal', type: 'personal', title: 'Personal Information', enabled: true, order: 0 },
      { id: 'summary', type: 'summary', title: 'Professional Summary', enabled: !!structuredData.summary, order: 1 },
      { id: 'experience', type: 'experience', title: 'Work Experience', enabled: (structuredData.experiences || []).length > 0, order: 2 },
      { id: 'education', type: 'education', title: 'Education', enabled: (structuredData.educations || structuredData.education || []).length > 0, order: 3 },
      { id: 'skills', type: 'skills', title: 'Skills', enabled: (structuredData.skills || []).length > 0, order: 4 },
      { id: 'certifications', type: 'certifications', title: 'Certifications', enabled: (structuredData.certifications || []).length > 0, order: 5 },
      { id: 'projects', type: 'projects', title: 'Projects', enabled: (structuredData.projects || []).length > 0, order: 6 },
      { id: 'languages', type: 'languages', title: 'Languages', enabled: (structuredData.languages || []).length > 0, order: 7 }
    ]
  };
}

export function parseCVData(cvRewrite: any): any {
  // If it's already structured data, convert and return it
  if (cvRewrite.structured_data) {
    console.log('📄 Found structured_data, converting to CVData format');
    return convertStructuredDataToCVData(cvRewrite.structured_data);
  }
  
  // Parse the initial_cv markdown into structured data
  // Try multiple sources for the CV content
  const content = cvRewrite.initial_cv || 
                  cvRewrite.content ||
                  cvRewrite.initial_markdown ||
                  cvRewrite.cv_content ||
                  cvRewrite || // If cvRewrite is a string itself
                  '';
  
  // If content is an object, try to extract text from it
  const textContent = typeof content === 'string' ? content : (content.text || content.content || '');
  
  console.log('📄 Parsing CV data:', {
    source: cvRewrite.initial_cv ? 'initial_cv' : 
            cvRewrite.content ? 'content' : 
            cvRewrite.initial_markdown ? 'initial_markdown' : 
            cvRewrite.cv_content ? 'cv_content' : 
            typeof cvRewrite === 'string' ? 'direct string' : 'NONE',
    contentLength: textContent.length,
    contentPreview: textContent.substring(0, 200)
  });
  
  // Extract name (first # or ## header)
  const nameMatch = textContent.match(/^#{1,2}\s+(.+)$/m);
  const name = nameMatch ? nameMatch[1].trim() : 'Your Name';
  const [firstName, ...lastNameParts] = name.split(/\s+/).filter(Boolean);
  const lastName = lastNameParts.join(' ');
  
  // Extract contact info
  const emailMatch = textContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = textContent.match(/(\+?\d[\d\s().-]{7,})/);
  const linkedinMatch = textContent.match(/(https?:\/\/(?:www\.)?linkedin\.com\/[^\s]+)/i);

  const headerBlock = textContent.split(/\n##\s+/)[0] || '';
  const headerLines = headerBlock
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line && !line.startsWith('##') && !line.startsWith('#'));

  const jobTitle = getLabeledValue(headerLines, [
    'Professional Title',
    'Job Title',
    'Title',
    'Role',
  ]);
  const locationFromHeader = getLabeledValue(headerLines, ['Location', 'Based In', 'City']);
  const emailFromHeader = getLabeledValue(headerLines, ['Email', 'E-mail']);
  const phoneFromHeader = getLabeledValue(headerLines, ['Phone', 'Tel', 'Telephone']);
  const linkedinFromHeader = getLabeledValue(headerLines, ['LinkedIn', 'LinkedIn URL']);

  let inferredLocation = locationFromHeader;
  if (!inferredLocation) {
    const fallbackLine = headerLines.find((line: string) => line.includes(',') && !line.includes('@') && !line.toLowerCase().includes('linkedin'));
    inferredLocation = fallbackLine || '';
  }
  
  // Extract summary
  // 1. Try explicit summary headers
  let summary = '';
  const summarySection = extractSectionContent(textContent, [
    'Professional Summary',
    'Summary',
    'Profile',
    'Executive Summary',
  ]);
  if (summarySection) {
    summary = summarySection.trim();
  } else {
    const lines = headerBlock.split('\n').map((line: string) => line.trim());
    const summaryLines: string[] = [];
    for (const line of lines) {
      if (!line || line.startsWith('#') || line.includes(':')) continue;
      summaryLines.push(line);
      if (summaryLines.length >= 2) break;
    }
    summary = summaryLines.join(' ');
  }
  
  let experienceSection = extractSectionContent(textContent, [
    'Professional Experience',
    'Experience',
    'Work Experience',
    'Career Experience',
  ]);
  
  // Debug: log la section extraite
  if (experienceSection) {
    const headerCount = (experienceSection.match(/###\s+/g) || []).length;
    console.log(`📋 Experience section extracted: ${experienceSection.length} chars, ${headerCount} ### headers`);
    // Log un extrait pour voir le format
    console.log(`📋 Experience section preview (first 500 chars):`, experienceSection.substring(0, 500));
  }
  
  let experiences = parseExperienceBlocks(experienceSection);
  
  // Debug: log le nombre d'expériences parsées et leurs détails
  console.log(`📋 Parsed ${experiences.length} experiences from section`);
  if (experiences.length > 0) {
    console.log(`📋 Experiences details:`, experiences.map((exp: any) => ({
      id: exp.id,
      title: exp.title,
      company: exp.company,
      bulletsCount: exp.bullets?.length || 0,
    })));
  }
  
  if (!experiences.length) {
    // Fallback: essayer de parser avant la section Education
    const beforeEducation = textContent.split(/##\s+Education/i)[0] || textContent;
    const fallbackHeaderCount = (beforeEducation.match(/###\s+/g) || []).length;
    console.log(`⚠️ No experiences parsed, trying fallback. Found ${fallbackHeaderCount} ### headers before Education`);
    experiences = parseExperienceBlocks(beforeEducation);
    console.log(`📋 Fallback parsing: ${experiences.length} experiences`);
  }
  
  const educationSection = extractSectionContent(textContent, [
    'Education',
    'Academic Background',
    'Academics',
    'Education & Certifications',
  ]);
  const education = parseEducationBlocks(educationSection);
  
  // Extract skills
  const skillsSection = extractSectionContent(textContent, [
    'Skills',
    'Core Competencies',
    'Technical Skills',
    'Key Skills',
  ]);
  const skills = parseListFromSection(skillsSection);

  const certificationsSection = extractSectionContent(textContent, [
    'Certifications',
    'Certificates',
    'Licenses',
    'Professional Certifications',
  ]);
  const certifications = parseCertificationBlocks(certificationsSection);
  
  const languagesSection = extractSectionContent(textContent, [
    'Languages',
    'Language Skills',
    'Languages & Proficiency',
  ]);
  const languages = parseLanguageEntries(languagesSection);
  
  const hobbiesSection = extractSectionContent(textContent, [
    'Hobbies & Interests',
    'Hobbies',
    'Interests',
    'Activities',
    'Personal Interests',
  ]);
  const hobbies = parseListFromSection(hobbiesSection);

  return {
    personalInfo: {
      name,
      firstName,
      lastName,
      title: jobTitle || '',
      jobTitle: jobTitle || '',
      email: emailFromHeader || (emailMatch ? emailMatch[1] : ''),
      phone: phoneFromHeader || (phoneMatch ? phoneMatch[1] : ''),
      location: inferredLocation || '',
      linkedin: linkedinFromHeader || (linkedinMatch ? linkedinMatch[1] : ''),
    },
    summary,
    experience: experiences,
    education,
    skills,
    certifications,
    languages,
    hobbies,
  };
}


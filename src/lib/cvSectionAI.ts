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
  conversationHistory?: string[]; // History of user's previous custom requests
}

/**
 * Detect user's intent from their custom request
 */
function detectUserIntent(userRequest: string): {
  type: 'structure' | 'tone' | 'length' | 'content' | 'general';
  specificRequest: string;
} {
  const lower = userRequest.toLowerCase();
  
  // Détection de structuration (nombre de points/bullets)
  if (lower.match(/keep (only )?\d+ (points?|bullets?|achievements?)/i) || 
      lower.match(/reduce to \d+ (points?|bullets?|achievements?)/i) ||
      lower.match(/just \d+ (points?|bullets?|achievements?)/i) ||
      lower.match(/only \d+ (points?|bullets?|achievements?)/i)) {
    return { type: 'structure', specificRequest: userRequest };
  }
  
  // Détection de longueur/mots
  if (lower.match(/\d+ words?/i) || 
      lower.includes('shorter') || 
      lower.includes('longer') || 
      lower.includes('more concise') ||
      lower.includes('brief')) {
    return { type: 'length', specificRequest: userRequest };
  }
  
  // Détection de contenu (add/remove)
  if (lower.includes('remove') || 
      lower.includes('delete') ||
      lower.includes('without') ||
      lower.includes('no metrics') ||
      lower.includes('no numbers') ||
      lower.includes('add ')) {
    return { type: 'content', specificRequest: userRequest };
  }
  
  // Détection de ton/style
  if (lower.includes('tone') || 
      lower.includes('more technical') || 
      lower.includes('more creative') ||
      lower.includes('less formal') ||
      lower.includes('more professional')) {
    return { type: 'tone', specificRequest: userRequest };
  }
  
  return { type: 'general', specificRequest: userRequest };
}

/**
 * Build simple, intent-based prompt for custom requests (no contradictory rules)
 */
function buildSimplePromptForIntent(
  input: SectionRewriteInput,
  intent: { type: string; specificRequest: string }
): string {
  
  const simpleBaseContext = `
You are an expert CV writer. Your job is to follow the user's request EXACTLY.

TARGET JOB: ${input.jobContext.jobTitle} at ${input.jobContext.company}
KEY KEYWORDS (use if relevant): ${input.jobContext.keywords.slice(0, 8).join(', ')}

CURRENT CONTENT:
"""
${input.currentContent.replace(/\[USER REQUEST\]:.*$/s, '').trim()}
"""

USER REQUEST: "${intent.specificRequest}"
`;

  let simpleInstruction = '';
  
  switch (intent.type) {
    case 'structure':
      simpleInstruction = `
YOUR TASK: Follow the user's request about the NUMBER of bullet points EXACTLY.

RULES (simple):
1. If they say "keep only 3 points" → Output EXACTLY 3 bullet points (keep the best 3)
2. If they say "reduce to 2 bullets" → Output EXACTLY 2 bullets (keep the top 2)
3. Choose the most impactful bullets for the ${input.jobContext.jobTitle} role
4. Keep power verbs and any existing metrics
5. Don't add new bullets, don't keep extra bullets

OUTPUT: Return exactly the requested number of bullet points, nothing more, nothing less.`;
      break;
      
    case 'length':
      simpleInstruction = `
YOUR TASK: Follow the user's request about LENGTH/WORD COUNT exactly.

RULES (simple):
1. If specific word count mentioned (e.g., "30 words") → Count every word and match it EXACTLY
2. If "shorter" → Reduce by 30-40%, keep most impactful parts
3. If "longer" → Expand with relevant details, no filler
4. Keep impactful content, cut fluff

OUTPUT: Content matching the exact length requirement.`;
      break;
      
    case 'content':
      simpleInstruction = `
YOUR TASK: Add or remove what the user specifically asked for.

RULES (simple):
1. If "remove metrics" → Remove ALL numbers, percentages, and quantified data
2. If "remove X" → Remove every mention of X
3. If "add Y" → Integrate Y naturally into the content
4. If "no numbers" → Strip out all numerical data
5. Do literally what is asked, nothing more

OUTPUT: Content with the exact modifications requested.`;
      break;
      
    case 'tone':
      simpleInstruction = `
YOUR TASK: Change the TONE/STYLE as requested.

RULES (simple):
1. Keep all facts, achievements, and content unchanged
2. Change ONLY the phrasing, word choice, and tone
3. Apply the requested tone consistently across all content
4. Don't add or remove information

OUTPUT: Same content with the requested tone applied.`;
      break;
      
    default:
      simpleInstruction = `
YOUR TASK: Make the improvement the user requested.

RULES (simple):
1. Follow their request precisely
2. Keep content relevant to ${input.jobContext.jobTitle} role
3. Use power verbs (Led, Drove, Architected, Delivered)
4. Integrate keywords naturally if possible: ${input.jobContext.keywords.slice(0, 5).join(', ')}
5. Don't invent facts

OUTPUT: Improved content as requested.`;
  }
  
  return simpleBaseContext + simpleInstruction + `

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "content": "the modified text here"
}

CRITICAL: Return ONLY the JSON, no explanations, no markdown, just the clean improved text in the "content" field.`;
}

/**
 * Build specialized prompt for Professional Summary in Resume Builder context
 * Focus: Help users write professional content from scratch
 */
function buildResumeBuilderSummaryPrompt(input: SectionRewriteInput): string {
  const baseContext = `
# PROFESSIONAL SUMMARY - WRITING ASSISTANT

You are an expert resume writer helping a professional craft their summary from scratch.
Your mission: Guide them to create a compelling, professional summary that showcases their expertise and value.

## 📝 YOUR ROLE:
- Help write professional, impactful content that works for general job applications
- Focus on clarity, impact, and professional positioning
- Use best practices and industry standards
- Guide users to craft compelling elevator pitches

${input.fullCV ? `## 📄 CV CONTEXT (to understand their background):\n${input.fullCV.substring(0, 2000)}...\n` : ''}

## 📝 CURRENT SUMMARY (what they've written so far):
"""
${input.currentContent || 'No content yet - help them write from scratch'}
"""

## UNIVERSAL RULES FOR SUMMARY:
1. ✅ ONLY use information provided by the user - NEVER invent facts
2. ✅ Third person, no "I/me/my"
3. ✅ NO generic phrases ("results-driven", "team player", "passionate")
4. ✅ Every achievement needs proof (metric, scale, impact) when available
5. ✅ Use professional, industry-standard language
6. ✅ Help them position themselves professionally
7. ✅ Focus on clarity and impact

${input.currentContent.includes('[USER REQUEST]:') ? `
## 🚨 ABSOLUTE PRIORITY - USER CUSTOM REQUEST DETECTED 🚨

⚠️⚠️⚠️ THE USER HAS MADE A SPECIFIC CUSTOM REQUEST - THIS TAKES ABSOLUTE PRIORITY! ⚠️⚠️⚠️

**CRITICAL: OVERRIDE ALL SUMMARY RULES AND GUIDELINES ABOVE IF THEY CONFLICT WITH THE USER'S REQUEST**

The user's custom request is embedded in the content above with [USER REQUEST]: tag.

**YOU MUST FOLLOW THE USER'S REQUEST LITERALLY AND PRECISELY:**
1. ✅ If user says "remove metrics" or "no numbers" → Remove ALL numbers, percentages, and quantified results completely
2. ✅ If user says "add more details" or "make it longer" → Ignore 50-60 word limit, make it as long as needed
3. ✅ If user says "make it shorter" or specific word count → Go below 40 words if needed, or match exact count
4. ✅ If user says "remove something specific" → Remove it completely, don't mention it at all
5. ✅ If user says "add something" → Add it even if not explicitly in CV
6. ✅ If user specifies exact word count (e.g., "in 30 words") → Respect it EXACTLY, count every single word
7. ✅ If user specifies a style or tone → Apply ONLY that style, ignore professional tone rules
8. ✅ If user says "focus on X" → Mention ONLY X, remove everything else

**THE CUSTOM REQUEST COMPLETELY OVERRIDES ALL OTHER INSTRUCTIONS!**
` : ''}

${input.conversationHistory && input.conversationHistory.length > 0 ? `
## 💬 CONVERSATION HISTORY - User's Previous Requests

The user has made the following requests in sequence. Each new request builds on the previous ones:

${input.conversationHistory.map((msg, idx) => `${idx + 1}. "${msg}"`).join('\n')}

**IMPORTANT: Consider ALL previous requests when generating the output.**

The user is refining iteratively - STACK all their requests together, don't forget the earlier ones!

**Your output must satisfy ALL requests in the history, not just the most recent one!**
` : ''}`;

  let actionInstructions = '';

  switch (input.action) {
    case 'improve':
    case 'improve_tone':
    case 'rewrite':
      actionInstructions = `
${input.currentContent.includes('[USER REQUEST]:') ? `
⚠️⚠️⚠️ USER CUSTOM REQUEST DETECTED - FOLLOW IT EXACTLY, IGNORE THE INSTRUCTIONS BELOW IF THEY CONFLICT ⚠️⚠️⚠️

The user's specific request OVERRIDES all storytelling, word count, and structure guidelines below.
` : ''}
## ACTION: CRAFT COMPELLING PROFESSIONAL SUMMARY 🎬

Help them create a compelling 50-60 word professional summary that tells their career story.

**MANDATORY STRUCTURE:**

**Part 1 - HOOK (10-15 words):**
Start with unique positioning that grabs attention
- Example: "8-year software engineer specializing in scalable cloud architecture"
- Formula: "[X-year] [Job Title] specializing in [unique strength/area]"

**Part 2 - STORY ARC (20-30 words):**
Show progression with key achievements
- Example: "From building microservices to leading platform architecture, consistently delivering high-performance solutions"
- Show evolution: where they started → key milestones → where they are now
- Include 1-2 quantified achievements if available

**Part 3 - VALUE PROPOSITION (15-20 words):**
End with what they bring to potential employers
- Example: "Seeking to leverage expertise to drive innovation and deliver measurable results"
- Formula: "Seeking to bring [key skills] to [type of organization] to [specific impact]"

**TONE & STYLE:**
- Professional and confident
- Clear and impactful
- Show progression and expertise
- Make recruiters want to learn more

**CRITICAL REQUIREMENTS:**
- EXACTLY 50-60 words (count carefully)
- Third person throughout
- Must tell a story of progression
- Every claim needs proof (numbers, scale, impact) when available
- Use professional terminology and industry-standard language

**OUTPUT:** Return ONLY the summary text, 50-60 words, ready to use.`;
      break;

    case 'metrics':
    case 'add_metrics':
      actionInstructions = `
${input.currentContent.includes('[USER REQUEST]:') ? `
⚠️⚠️⚠️ USER CUSTOM REQUEST DETECTED - FOLLOW IT EXACTLY, IGNORE THE INSTRUCTIONS BELOW IF THEY CONFLICT ⚠️⚠️⚠️

If user says "remove metrics" or "no numbers", DO NOT add metrics. The user's request OVERRIDES all metric guidelines below.
` : ''}
## ACTION: HIGHLIGHT METRICS & QUANTIFIABLE ACHIEVEMENTS 📊

Help them create a data-driven summary that showcases impact through numbers.

**YOUR MISSION:**
Scan the CV context and extract the TOP 3 most impressive metrics, then build the summary around them.

**METRIC PRIORITIES (choose top 3 if available):**
1. Revenue impact ($X generated/saved, ARR, cost reduction)
2. Scale (Xk users, X projects, X countries, X transactions)
3. Efficiency gains (X% improvement, X hours saved, X faster)
4. Team leadership (X people managed, X teams built)
5. Growth metrics (X% increase, Xx growth, market expansion)

**FORMULA TO FOLLOW:**
"[Job Title] with [X years] driving measurable impact: [Achievement 1 with impressive metric], [Achievement 2 with metric], [Achievement 3 with metric]. Proven ability to deliver [key strength] and drive results."

**FORMATTING RULES:**
- Lead with most impressive number first
- Format numbers for maximum impact: "2.5M" not "2,500,000"
- Every sentence should contain at least one number when possible
- Use comparative metrics when possible: "40% faster", "3x growth", "50% reduction"
- 50-60 words total

**EXAMPLES OF STRONG METRICS:**
- "Led platform serving 2M users across 15 markets, improving data accuracy 40%"
- "Shipped features generating $5M ARR while reducing operational costs 35%"
- "Architected infrastructure processing 10M daily transactions with 99.9% uptime"

**TONE:** Confident, proof-based, let the numbers do the talking

**OUTPUT:** Return ONLY the metrics-heavy summary, 50-60 words.`;
      break;

    case 'shorten':
      actionInstructions = `
${input.currentContent.includes('[USER REQUEST]:') ? `
⚠️⚠️⚠️ USER CUSTOM REQUEST DETECTED - FOLLOW IT EXACTLY, IGNORE THE INSTRUCTIONS BELOW IF THEY CONFLICT ⚠️⚠️⚠️

If user specifies a different word count, follow theirs EXACTLY. The user's request OVERRIDES the 40-50 word guideline below.
` : ''}
## ACTION: CREATE ULTRA-CONCISE SUMMARY ⚡

Help them create the MOST CONCISE version possible (40-50 words) while maximizing impact per word.

**STRICT REQUIREMENTS:**
- EXACTLY 40-50 words (count every single word)
- Every word must earn its place
- Remove ALL filler words and adjectives
- Keep ONLY: positioning + best proof + value proposition

**3-PART FORMULA (follow exactly):**

**Part 1 (5-8 words): WHO THEY ARE**
- Format: "[Job Title]. [X years]. [Primary specialization]"
- Example: "Software Engineer. 8 years. Cloud architecture specialist."

**Part 2 (20-25 words): BEST PROOF POINT**
- Their single most impressive achievement with metric
- Format: "Led [what] serving [scale metric], [impact metric]"
- Example: "Led platform serving 2M users across 15 markets, improving performance 40% and reducing costs 60%"

**Part 3 (12-15 words): VALUE PROPOSITION**
- What they bring to potential employers
- Format: "Bringing [expertise type] to drive [relevant initiative]"
- Example: "Bringing enterprise-scale expertise to drive digital transformation and operational excellence"

**WHAT TO CUT:**
❌ Adjectives: "skilled", "experienced", "passionate", "dedicated"
❌ Generic statements: "results-driven professional", "team player"
❌ Weak verbs: "worked on", "helped with", "participated in"
❌ Filler phrases: "with a focus on", "in order to", "as well as"

**WHAT TO KEEP:**
✅ Power verbs: Led, Drove, Architected, Delivered, Scaled, Built
✅ Concrete metrics and numbers
✅ Specific technologies, methodologies, or domains
✅ Clear value proposition

**OUTPUT:** Return ONLY the ultra-concise summary, 40-50 words exactly.`;
      break;

    case 'keywords':
    case 'insert_keywords':
      actionInstructions = `
${input.currentContent.includes('[USER REQUEST]:') ? `
⚠️⚠️⚠️ USER CUSTOM REQUEST DETECTED - FOLLOW IT EXACTLY, IGNORE THE INSTRUCTIONS BELOW IF THEY CONFLICT ⚠️⚠️⚠️

The user's specific request OVERRIDES all keyword integration guidelines below.
` : ''}
## ACTION: GENERAL ATS OPTIMIZATION 🎯

Help them optimize their summary for ATS (Applicant Tracking System) while maintaining natural flow.

**YOUR MISSION:**
- Use industry-standard terminology and keywords naturally
- Focus on common ATS-friendly terms for their field
- Maintain readability and professional tone
- Avoid keyword stuffing

**INTEGRATION STRATEGY:**

**Part 1 - HOOK (integrate professional terms):**
- Weave in role-specific terminology naturally
- Example: "Senior Software Engineer specializing in cloud architecture and DevOps"

**Part 2 - PROOF (integrate technical skills):**
- Naturally mention technologies, methodologies, frameworks
- Example: "Architected scalable platforms using Python and AWS, implementing CI/CD pipelines with Kubernetes"

**Part 3 - VALUE (integrate soft skills & business impact):**
- Weave in leadership, collaboration, business terms naturally
- Example: "Bringing agile leadership and cross-functional expertise to drive innovation"

**CRITICAL RULES:**
1. Must sound 100% NATURAL - no keyword stuffing
2. Use industry-standard terms that fit their field
3. Prioritize readability over keyword count
4. Maintain storytelling and impact focus
5. 50-60 words total

**BALANCE: 70% compelling pitch + 30% strategic keywords**

**OUTPUT:** Return ONLY the optimized summary, 50-60 words, sounding completely natural.`;
      break;

    default:
      actionInstructions = `
## ACTION: IMPROVE PROFESSIONAL SUMMARY

Help them create a compelling 50-60 word Professional Summary that works as a powerful elevator pitch.

Focus on:
- Unique positioning and professional expertise
- Top 2-3 quantified achievements (if available)
- Clear value proposition for potential employers

OUTPUT: Return ONLY the improved summary, 50-60 words.`;
  }

  return baseContext + actionInstructions + `

## OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "content": "the improved professional summary here (50-60 words)"
}

⚠️ CRITICAL:
- Return ONLY ONE version of the summary
- Count words carefully to stay within limit
- No explanations, no markdown formatting, no code blocks
- Just clean summary text in the "content" field`;
}

/**
 * Build specialized prompt for Professional Summary (elevator pitch format)
 */
function buildSummaryPrompt(input: SectionRewriteInput): string {
  // Check if this is Resume Builder context (no specific job target)
  const isResumeBuilderContext = input.jobContext.jobTitle === 'General Professional Role' || 
                                input.jobContext.company === 'Target Company' ||
                                !input.jobContext.jobDescription || 
                                input.jobContext.jobDescription === 'General professional position';

  // Use Resume Builder prompts for Resume Builder context
  if (isResumeBuilderContext) {
    return buildResumeBuilderSummaryPrompt(input);
  }

  // Use existing CV Analysis prompts (unchanged)
  // Check if this is general enhancement (no specific job target)
  const isGeneralEnhancement = input.jobContext.jobTitle === 'General Professional Role' || 
                                input.jobContext.company === 'Target Company' ||
                                !input.jobContext.jobDescription || 
                                input.jobContext.jobDescription === 'General professional position';

  const baseContext = isGeneralEnhancement ? `
# PROFESSIONAL SUMMARY - ELEVATOR PITCH GENERATOR

You are an elite executive speechwriter who crafts compelling 30-second elevator pitches.

## 📝 GENERAL ENHANCEMENT GUIDELINES:
- Create a professional, impactful summary that works for general job applications
- Highlight key achievements and expertise
- Use strong action verbs and quantify results where possible
- Optimize for ATS (Applicant Tracking System) parsing
- Keep it concise (50-60 words) and compelling
` : `
# PROFESSIONAL SUMMARY - ELEVATOR PITCH GENERATOR

You are an elite executive speechwriter who crafts compelling 30-second elevator pitches.

## 🎯 TARGET POSITION:
- **Role**: ${input.jobContext.jobTitle}
- **Company**: ${input.jobContext.company}
${input.jobContext.jobDescription ? `- **Job Description**: ${input.jobContext.jobDescription.substring(0, 500)}...` : ''}

## 💪 KEY STRENGTHS TO HIGHLIGHT:
${input.jobContext.strengths.map(s => `  ✓ ${s}`).join('\n') || 'No specific strengths identified'}

## ⚠️ GAPS TO ADDRESS CLEVERLY:
${input.jobContext.gaps.map(g => `  → ${g}`).join('\n') || 'No significant gaps identified'}

## 🔑 KEYWORDS FOR ATS (use naturally):
${input.jobContext.keywords.slice(0, 12).join(', ') || 'No specific keywords identified'}

${input.fullCV ? `## 📄 FULL CV FOR CONTEXT (extract best metrics):\n${input.fullCV.substring(0, 2000)}...\n` : ''}

## 📝 CURRENT SUMMARY:
"""
${input.currentContent}
"""

## UNIVERSAL RULES FOR SUMMARY:
1. ✅ ONLY use real information from CV - NEVER invent
2. ✅ Third person, no "I/me/my"
3. ✅ NO generic phrases ("results-driven", "team player", "passionate")
4. ✅ Every achievement needs proof (metric, scale, impact)
${isGeneralEnhancement ? '5. ✅ Use professional, industry-standard language' : '5. ✅ Mirror job description terminology naturally'}

${input.currentContent.includes('[USER REQUEST]:') ? `
## 🚨🚨🚨 ABSOLUTE PRIORITY - USER CUSTOM REQUEST DETECTED 🚨🚨🚨

⚠️⚠️⚠️ THE USER HAS MADE A SPECIFIC CUSTOM REQUEST - THIS TAKES ABSOLUTE PRIORITY OVER EVERYTHING ELSE! ⚠️⚠️⚠️

**CRITICAL: OVERRIDE ALL SUMMARY RULES AND GUIDELINES ABOVE IF THEY CONFLICT WITH THE USER'S REQUEST**

The user's custom request is embedded in the content above with [USER REQUEST]: tag.

**YOU MUST FOLLOW THE USER'S REQUEST LITERALLY AND PRECISELY:**

1. ✅ If user says "remove metrics" or "no numbers" → Remove ALL numbers, percentages, and quantified results completely
2. ✅ If user says "add more details" or "make it longer" → Ignore 50-60 word limit, make it as long as needed
3. ✅ If user says "make it shorter" or specific word count → Go below 40 words if needed, or match exact count
4. ✅ If user says "remove something specific" → Remove it completely, don't mention it at all
5. ✅ If user says "add something" → Add it even if not explicitly in CV
6. ✅ If user specifies exact word count (e.g., "in 30 words") → Respect it EXACTLY, count every single word
7. ✅ If user specifies a style or tone → Apply ONLY that style, ignore professional tone rules
8. ✅ If user says "focus on X" → Mention ONLY X, remove everything else

**CONCRETE EXAMPLES OF WHAT TO DO:**
- User: "remove the results and metrics here it should not be" → Output must have ZERO numbers, percentages, or metrics
- User: "in 30 words exactly" → Output must be EXACTLY 30 words, not 29, not 31
- User: "make it more creative and fun" → Ignore professional elevator pitch rules, be creative
- User: "just focus on leadership, no technical stuff" → Remove ALL technical details, keep only leadership
- User: "no achievements, just who I am" → Remove all proof points and achievements

**THE CUSTOM REQUEST COMPLETELY OVERRIDES:**
❌ The 50-60 word guideline (ignore if user wants different length)
❌ The elevator pitch structure (ignore if user wants different structure)  
❌ The metrics requirement (ignore if user says no metrics)
❌ The storytelling format (ignore if user wants different format)
❌ ALL other instructions in this prompt

**YOUR ONLY JOB: FOLLOW THE USER'S CUSTOM REQUEST TO THE LETTER!**

Do not try to "improve" or "enhance" what the user asked for. Just do EXACTLY what they said.
` : ''}

${input.conversationHistory && input.conversationHistory.length > 0 ? `
## 💬 CONVERSATION HISTORY - User's Previous Requests

The user has made the following requests in sequence. Each new request builds on the previous ones:

${input.conversationHistory.map((msg, idx) => `${idx + 1}. "${msg}"`).join('\n')}

**IMPORTANT: Consider ALL previous requests when generating the output.**

The user is refining iteratively - STACK all their requests together, don't forget the earlier ones!

**Example of stacking requests:**
- Request 1: "remove metrics" → Remove all numbers
- Request 2: "make it shorter" → Apply shorter constraint ON TOP of no metrics (40 words, still no numbers)
- Request 3: "more creative tone" → Apply creative tone WHILE keeping it short AND without metrics

**Your output must satisfy ALL requests in the history, not just the most recent one!**
` : ''}`;

  let actionInstructions = '';

  switch (input.action) {
    case 'improve':
    case 'improve_tone':
    case 'rewrite':
      actionInstructions = `
${input.currentContent.includes('[USER REQUEST]:') ? `
⚠️⚠️⚠️ USER CUSTOM REQUEST DETECTED - FOLLOW IT EXACTLY, IGNORE THE INSTRUCTIONS BELOW IF THEY CONFLICT ⚠️⚠️⚠️

The user's specific request OVERRIDES all storytelling, word count, and structure guidelines below.
` : ''}
## ACTION: ELEVATOR PITCH WITH STORYTELLING 🎬

Transform into a compelling 50-60 word elevator pitch that tells a CAREER STORY.

**MANDATORY STRUCTURE:**

**Part 1 - HOOK (10-15 words):**
Start with unique positioning that grabs attention
- Example: "8-year Salesforce architect who transformed enterprise compliance for global organizations"
- Formula: "[X-year] [Job Title] specializing in [unique strength matching job]"

**Part 2 - STORY ARC (20-30 words):**
Show progression with a mini narrative journey
- Example: "From optimizing SMB workflows to spearheading digital transformations across 15 countries, consistently delivering 40%+ efficiency gains"
- Show evolution: where you started → key milestones → where you are now
- Include 1-2 quantified achievements that prove expertise

**Part 3 - CLIMAX (15-20 words):**
End with powerful value proposition${isGeneralEnhancement ? '' : ` for target company`}
${isGeneralEnhancement ? 
  `- Example: "Seeking to leverage expertise to drive innovation and deliver measurable results in next role"
- Formula: "Seeking to bring [key skills] to [type of organization] to [specific impact]"` :
  `- Example: "Now ready to drive ${input.jobContext.company}'s next phase of cloud innovation and operational excellence"
- Formula: "Now/Seeking to bring [key skills] to ${input.jobContext.company} to [specific impact]"`
}"

**TONE & STYLE:**
- Like a movie trailer: create intrigue, show growth, make recruiter lean in
- Confident but authentic
- Show progression and evolution
- End with a hook that makes them want to interview you

**CRITICAL REQUIREMENTS:**
- EXACTLY 50-60 words (count carefully)
- Third person throughout
- Must tell a story of progression
- Every claim needs proof (numbers, scale, impact)
${isGeneralEnhancement ? '- Use professional terminology and industry-standard language' : '- Weave in top 3-4 keywords from job naturally'}

**OUTPUT:** Return ONLY the summary text, 50-60 words, ready to use.`;
      break;

    case 'metrics':
    case 'add_metrics':
      actionInstructions = `
${input.currentContent.includes('[USER REQUEST]:') ? `
⚠️⚠️⚠️ USER CUSTOM REQUEST DETECTED - FOLLOW IT EXACTLY, IGNORE THE INSTRUCTIONS BELOW IF THEY CONFLICT ⚠️⚠️⚠️

If user says "remove metrics" or "no numbers", DO NOT add metrics. The user's request OVERRIDES all metric guidelines below.
` : ''}
## ACTION: METRICS-HEAVY IMPACT SUMMARY 📊

Rewrite as a DATA-DRIVEN summary that screams "high-performer" through numbers.

**YOUR MISSION:**
Scan the FULL CV and extract the TOP 3 most impressive metrics, then build the summary around them.

**METRIC PRIORITIES (choose top 3):**
1. Revenue impact ($X generated/saved, ARR, cost reduction)
2. Scale (Xk users, X projects, X countries, X transactions)
3. Efficiency gains (X% improvement, X hours saved, X faster)
4. Team leadership (X people managed, X teams built)
5. Growth metrics (X% increase, Xx growth, market expansion)

**FORMULA TO FOLLOW:**
"${isGeneralEnhancement ? 
  '[Job Title] with [X years] driving measurable impact: [Achievement 1 with impressive metric], [Achievement 2 with metric], [Achievement 3 with metric]. Proven ability to deliver [key strength] and drive results.' :
  `[Job Title] with [X years] driving measurable impact: [Achievement 1 with impressive metric], [Achievement 2 with metric], [Achievement 3 with metric]. Proven ability to deliver [key strength] for ${input.jobContext.company}.`
}"

**FORMATTING RULES:**
- Lead with most impressive number first
- Format numbers for maximum impact: "2.5M" not "2,500,000"
- Every sentence MUST contain at least one number
- Use comparative metrics when possible: "40% faster", "3x growth", "50% reduction"
- 50-60 words total

**EXAMPLES OF STRONG METRICS:**
- "Led platform serving 2M users across 15 markets, improving data accuracy 40%"
- "Shipped features generating $5M ARR while reducing operational costs 35%"
- "Architected infrastructure processing 10M daily transactions with 99.9% uptime"

**TONE:** Confident, proof-based, let the numbers do the talking

**OUTPUT:** Return ONLY the metrics-heavy summary, 50-60 words.`;
      break;

    case 'shorten':
      actionInstructions = `
${input.currentContent.includes('[USER REQUEST]:') ? `
⚠️⚠️⚠️ USER CUSTOM REQUEST DETECTED - FOLLOW IT EXACTLY, IGNORE THE INSTRUCTIONS BELOW IF THEY CONFLICT ⚠️⚠️⚠️

If user specifies a different word count, follow theirs EXACTLY. The user's request OVERRIDES the 40-50 word guideline below.
` : ''}
## ACTION: ULTRA-CONCISE POWER PITCH ⚡

Create the MOST CONCISE version possible (40-50 words) while maximizing impact per word.

**STRICT REQUIREMENTS:**
- EXACTLY 40-50 words (count every single word)
- Every word must earn its place
- Remove ALL filler words and adjectives
- Keep ONLY: positioning + best proof + value proposition

**3-PART FORMULA (follow exactly):**

**Part 1 (5-8 words): WHO YOU ARE**
- Format: "[Job Title]. [X years]. [Primary specialization]"
- Example: "Salesforce Architect. 8 years. Enterprise compliance specialist."

**Part 2 (20-25 words): BEST PROOF POINT**
- Your single most impressive achievement with metric
- Format: "Led [what] serving [scale metric], [impact metric]"
- Example: "Led compliance platform serving 2M users across 15 markets, improving data accuracy 40% and reducing audit time 60%"

**Part 3 (12-15 words): VALUE PROPOSITION**
${isGeneralEnhancement ? 
  `- What you bring to potential employers
- Format: "Bringing [expertise type] to [type of organization]'s [relevant initiative]"
- Example: "Bringing enterprise-scale expertise to drive digital transformation and operational excellence"` :
  `- What you bring to the specific company
- Format: "Bringing [expertise type] to ${input.jobContext.company}'s [relevant initiative]"
- Example: "Bringing enterprise-scale expertise to ${input.jobContext.company}'s digital transformation and compliance evolution"`
}

**WHAT TO CUT:**
❌ Adjectives: "skilled", "experienced", "passionate", "dedicated"
❌ Generic statements: "results-driven professional", "team player"
❌ Weak verbs: "worked on", "helped with", "participated in"
❌ Filler phrases: "with a focus on", "in order to", "as well as"

**WHAT TO KEEP:**
✅ Power verbs: Led, Drove, Architected, Delivered, Scaled, Built
✅ Concrete metrics and numbers
✅ Specific technologies, methodologies, or domains
✅ Clear value proposition

**EXAMPLES (40-50 words):**
- "Product Leader. 10 years. Shipped features generating $5M ARR. Built cross-functional teams of 12 across 3 countries. Ready to scale ${input.jobContext.company}'s next growth phase with proven SaaS expertise." (31 words - too short, needs expansion)
- "Data Engineer specializing in real-time analytics. Architected ML infrastructure processing 5M daily transactions with 99.9% uptime. 6 years building scalable pipelines using Python, AWS, Kubernetes. Bringing cloud-native expertise to ${input.jobContext.company}'s data platform evolution." (41 words - perfect)

**OUTPUT:** Return ONLY the ultra-concise summary, 40-50 words exactly.`;
      break;

    case 'keywords':
    case 'insert_keywords':
      actionInstructions = `
${input.currentContent.includes('[USER REQUEST]:') ? `
⚠️⚠️⚠️ USER CUSTOM REQUEST DETECTED - FOLLOW IT EXACTLY, IGNORE THE INSTRUCTIONS BELOW IF THEY CONFLICT ⚠️⚠️⚠️

The user's specific request OVERRIDES all keyword integration guidelines below.
` : ''}
## ACTION: ATS KEYWORD OPTIMIZATION (NATURAL) 🎯

Strategically integrate missing ATS keywords while maintaining natural storytelling flow.

**MISSING KEYWORDS TO INTEGRATE (prioritize top 8):**
${input.jobContext.keywords.slice(0, 12).join(', ')}

**INTEGRATION STRATEGY:**

**Part 1 - HOOK (integrate job title keywords):**
- Weave in role-specific terms and job title variations
- Example: If keywords include "Senior Engineer", "Cloud Architecture", "DevOps"
- "Senior Software Engineer specializing in cloud architecture and DevOps transformation"

**Part 2 - PROOF (integrate technical skills):**
- Naturally mention technologies, methodologies, frameworks
- Example: If keywords include "Python", "AWS", "Kubernetes", "CI/CD"
- "Architected scalable platforms using Python and AWS, implementing CI/CD pipelines with Kubernetes for 99.9% uptime"

**Part 3 - VALUE (integrate soft skills & business impact):**
- Weave in leadership, collaboration, business terms
- Example: If keywords include "Agile", "Cross-functional", "Stakeholder Management"
- "Bringing agile leadership and cross-functional stakeholder management expertise to drive innovation"

**CRITICAL RULES:**
1. Must sound 100% NATURAL - recruiter should NOT notice optimization
2. Integrate only 5-8 keywords maximum (not all of them)
3. Prioritize keywords that fit naturally into elevator pitch format
4. NO keyword stuffing or forced phrases
5. Maintain storytelling and impact focus
6. 50-60 words total

**BALANCE: 70% compelling pitch + 30% strategic keywords**

**GOOD EXAMPLE (natural integration):**
${isGeneralEnhancement ?
  `"Senior Data Engineer specializing in Python, AWS, and real-time analytics pipelines. Architected scalable ML infrastructure processing 5M daily transactions, leveraging Docker and Kubernetes for 99.9% uptime. Seeking to bring cloud-native expertise and agile leadership to drive data platform evolution."
*(Keywords naturally integrated: Python, AWS, ML, Docker, Kubernetes, cloud-native, agile)*` :
  `"Senior Data Engineer specializing in Python, AWS, and real-time analytics pipelines. Architected scalable ML infrastructure processing 5M daily transactions, leveraging Docker and Kubernetes for 99.9% uptime. Seeking to bring cloud-native expertise and agile leadership to ${input.jobContext.company}'s data platform evolution."
*(Keywords naturally integrated: Python, AWS, ML, Docker, Kubernetes, cloud-native, agile)*`
}

**BAD EXAMPLE (keyword stuffing - AVOID):**
"Python AWS Kubernetes expert skilled in machine learning, Docker, DevOps, CI/CD, with cloud-native experience in agile teams using microservices architecture..."
*(Too many keywords, no storytelling, obvious stuffing)*

**OUTPUT:** Return ONLY the keyword-optimized summary, 50-60 words, sounding completely natural.`;
      break;

    default:
      actionInstructions = `
## ACTION: IMPROVE PROFESSIONAL SUMMARY

Create a compelling 50-60 word Professional Summary that works as a powerful elevator pitch.

Focus on:
${isGeneralEnhancement ? 
  `- Unique positioning and professional expertise
- Top 2-3 quantified achievements
- Clear value proposition for potential employers` :
  `- Unique positioning for the ${input.jobContext.jobTitle} role
- Top 2-3 quantified achievements
- Clear value proposition for ${input.jobContext.company}`
}

OUTPUT: Return ONLY the improved summary, 50-60 words.`;
  }

  return baseContext + actionInstructions + `

## OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "content": "the improved professional summary here (50-60 words)"
}

⚠️ CRITICAL:
- Return ONLY ONE version of the summary
- Count words carefully to stay within limit
- No explanations, no markdown formatting, no code blocks
- Just clean summary text in the "content" field`;
}

/**
 * Build specialized prompt for Experience/Projects in Resume Builder context
 * Focus: Help users write professional content from scratch
 */
function buildResumeBuilderActionPrompt(input: SectionRewriteInput): string {
  const baseContext = `
# PROFESSIONAL CV WRITING ASSISTANT

You are an expert resume writer helping a professional craft their ${input.sectionType === 'experience' ? 'work experience' : 'project'} content from scratch.
Your mission: Guide them to create professional, impactful descriptions that showcase their achievements and expertise.

## 📝 YOUR ROLE:
- Help write professional, impactful content that works for general job applications
- Focus on clarity, impact, and professional positioning
- Use best practices and industry standards
- Guide users to craft compelling achievement statements

${input.fullCV ? `## 📄 CV CONTEXT (to understand their background):\n${input.fullCV.substring(0, 1500)}...\n` : ''}

## 📝 CURRENT CONTENT (what they've written so far):
"""
${input.currentContent || 'No content yet - help them write from scratch'}
"""

${input.currentContent && input.currentContent.includes('[USER REQUEST]:') && !input.currentContent.replace(/\[USER REQUEST\]:.*$/s, '').trim() ? `
## 🎯 GENERATING FROM USER INSTRUCTIONS

The user has provided instructions but no existing content. Generate professional ${input.sectionType === 'experience' ? 'achievement bullet points' : input.sectionType === 'project' ? 'project description and highlights' : 'professional summary'} based SOLELY on their instructions.

**IMPORTANT:**
- Follow their instructions EXACTLY (e.g., if they ask for "two bullet points", create exactly 2)
- Use the information they provided in their instructions
- Make it professional and impactful
- Use power verbs and quantify when possible
- Format appropriately for the section type
- If they mention specific details (technologies, clients, projects), incorporate them naturally
` : ''}

## CRITICAL RULES:
1. ✅ ONLY use information provided by the user - NEVER invent facts
2. ✅ Every statement should be QUANTIFIED if possible (%, $, #, time)
3. ✅ Use POWER VERBS (Led, Architected, Drove, Delivered, Spearheaded)
4. ✅ Use professional, industry-standard language
5. ✅ Make it sound SENIOR and STRATEGIC, not just operational
6. ✅ Optimize for ATS parsing (clean structure, clear formatting)
7. ✅ Keep content CONCISE for one-page A4 format
8. ⚠️ DO NOT DUPLICATE - Return ONE improved version, not multiple versions
9. ⚠️ MAINTAIN STRUCTURE - Keep the same number of bullet points/items as input
10. ⚠️ NO REPETITION - Each bullet point must be unique and distinct

${input.currentContent.includes('[USER REQUEST]:') ? `
## 🚨 ABSOLUTE PRIORITY - USER CUSTOM REQUEST DETECTED 🚨

⚠️⚠️⚠️ THE USER HAS MADE A SPECIFIC CUSTOM REQUEST - THIS TAKES ABSOLUTE PRIORITY! ⚠️⚠️⚠️

**OVERRIDE ALL PREVIOUS INSTRUCTIONS IF THEY CONFLICT WITH THE USER'S REQUEST**

The user's custom request is embedded in the content above with [USER REQUEST]: tag.

**YOU MUST:**
1. ✅ Follow the user's request LITERALLY and PRECISELY
2. ✅ If they specify a word count (e.g., "in 10 words", "use only 15 words") → COUNT EVERY WORD and respect it EXACTLY
3. ✅ If they ask for shorter content → Make it SHORTER than original, ignore "concise" rules above
4. ✅ If they ask for longer content → Make it LONGER, ignore length limits above
5. ✅ If they specify a style → Apply ONLY that style change
6. ✅ The user's instruction is MORE IMPORTANT than any other optimization

**EXAMPLES:**
- User says "in 10 words" → Your output MUST be EXACTLY 10 words, not 11, not 50
- User says "make it more technical" → Focus ONLY on technical terminology
- User says "remove metrics" → Remove ALL numbers and percentages
- User says "one sentence" → Return EXACTLY one sentence

**THE CUSTOM REQUEST OVERRIDES EVERYTHING ELSE IN THIS PROMPT!**
` : ''}

${input.conversationHistory && input.conversationHistory.length > 0 ? `
## 💬 CONVERSATION HISTORY - User's Previous Requests

The user has made the following requests in sequence for this section:

${input.conversationHistory.map((msg, idx) => `${idx + 1}. "${msg}"`).join('\n')}

**IMPORTANT: Consider ALL previous requests when generating the output.**

The user is refining iteratively - STACK all their requests together:

**Example:**
- Request 1: "remove metrics" → Remove all numbers
- Request 2: "make it shorter" → Apply shorter constraint ON TOP of no metrics
- Request 3: "more technical" → Apply technical tone WHILE keeping it short AND without metrics

**Your output must satisfy ALL requests in the history!**
` : ''}`;

  let actionInstructions = '';
  
  switch (input.action) {
    case 'rewrite':
      actionInstructions = `
## ACTION: COMPLETE PROFESSIONAL REWRITE 🚀

Help them transform this section into a professional, impactful statement.

**YOUR REWRITING STRATEGY:**

1. **PROFESSIONAL POSITIONING** 🧠
   - Frame their work in a way that showcases expertise and value
   - Lead with the most impressive achievements
   - Show progression and growth

2. **POWER VERB ARSENAL** ⚡
   - Replace ALL weak verbs immediately:
     ❌ "Worked on" → ✅ "Architected", "Engineered", "Delivered"
     ❌ "Helped" → ✅ "Enabled", "Catalyzed", "Drove"
     ❌ "Was responsible for" → ✅ "Owned", "Led", "Spearheaded"

3. **QUANTIFICATION MAXIMIZATION** 📊
   - EVERY achievement should have a number when possible:
     • Team size, budget, timeline, impact
     • Performance improvements (73% faster, 2.5x growth)
     • Scale (2M users, $5M revenue, 15 countries)

4. **SENIORITY ELEVATION** 👔
   - Show STRATEGIC thinking, not just execution
   - Emphasize LEADERSHIP and INFLUENCE
   - Highlight CROSS-FUNCTIONAL collaboration
   - Demonstrate BUSINESS IMPACT

**OUTPUT REQUIREMENTS:**
- Concise, impactful statements (20 words max per bullet)
- Use parallel structure for consistency
- Optimize for one-page A4 format

Return ONLY the rewritten content, ready to paste.`;
      break;

    case 'improve':
    case 'improve_tone':
      actionInstructions = `
## ACTION: IMPROVE TONE TO SENIOR/CONFIDENT LEVEL

Help them elevate the tone to sound more senior, confident, and achievement-oriented.

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

Help them make this section more impactful by highlighting quantifiable achievements and measurable outcomes.

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

Help them rewrite this section to emphasize senior-level responsibilities, leadership, and strategic impact.

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
## ACTION: GENERAL ATS OPTIMIZATION

Help them naturally integrate industry-standard keywords to improve ATS match score.

**Your Mission:**
1. **Analyze** the content for opportunities to add relevant industry terms
2. **Identify** where keywords fit naturally in the existing content
3. **Integrate** keywords smoothly without forcing or keyword-stuffing
4. **Maintain** natural language flow and readability
5. **Ensure** keywords make sense in context
6. **Use** common ATS-friendly terms for their field

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

Help them condense this section while keeping the most impactful and relevant information.

**Your Mission:**
1. **Identify** the most impactful achievements and statements
2. **Remove** redundancy and filler words
3. **Combine** related points where possible
4. **Keep** all quantified achievements and metrics
5. **Preserve** relevant skills and experiences
6. **Eliminate** generic statements that don't add value
7. **Focus** on what matters most

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

Help them add depth and detail to this section by elaborating on methodologies, technologies, impact, and context.

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
- Make expansions relevant and natural
- Ensure expanded content sounds natural and credible

Return ONLY the expanded section content.`;
      break;

    default:
      actionInstructions = `
## ACTION: IMPROVE THIS SECTION

Help them enhance this section to better showcase their professional expertise and achievements.

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
 * Build ultra-precise context-aware prompts for each action
 */
function buildActionPrompt(input: SectionRewriteInput): string {
  // Special handling for Professional Summary - use elevator pitch format
  if (input.sectionType === 'summary') {
    return buildSummaryPrompt(input);
  }

  // For Work Experience/Projects: if custom request, use simple intent-based prompt
  if ((input.sectionType === 'experience' || input.sectionType === 'project') && 
      input.currentContent.includes('[USER REQUEST]:')) {
    const userRequest = input.currentContent.split('[USER REQUEST]:')[1]?.trim() || '';
    const intent = detectUserIntent(userRequest);
    return buildSimplePromptForIntent(input, intent);
  }

  // Check if this is Resume Builder context (no specific job target)
  const isResumeBuilderContext = input.jobContext.jobTitle === 'General Professional Role' || 
                                input.jobContext.company === 'Target Company' ||
                                !input.jobContext.jobDescription || 
                                input.jobContext.jobDescription === 'General professional position';

  // Use Resume Builder prompts for Resume Builder context
  if (isResumeBuilderContext) {
    return buildResumeBuilderActionPrompt(input);
  }

  // Use existing CV Analysis prompts (unchanged)
  // Check if this is general enhancement (no specific job target)
  const isGeneralEnhancement = input.jobContext.jobTitle === 'General Professional Role' || 
                                input.jobContext.company === 'Target Company' ||
                                !input.jobContext.jobDescription || 
                                input.jobContext.jobDescription === 'General professional position';

  const baseContext = isGeneralEnhancement ? `
# CONTEXT - PROFESSIONAL CV ENHANCEMENT

You are an expert CV strategist with 20+ years of experience helping professionals create standout resumes.
Your mission: Enhance this section to make it more professional, impactful, and ATS-friendly for general job applications.

## 📝 GENERAL ENHANCEMENT GUIDELINES:
- Make the content more professional and impactful
- Use strong action verbs and quantify achievements where possible
- Optimize for ATS (Applicant Tracking System) parsing
- Keep content concise and clear
- Highlight achievements and results
- Use industry-standard terminology
` : `
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
${isGeneralEnhancement ? '4. ✅ Use professional, industry-standard language' : '4. ✅ Mirror the EXACT language from the job description'}
5. ✅ Make it sound SENIOR and STRATEGIC, not just operational
6. ✅ Optimize for ATS parsing (clean structure, keywords repeated 2-3x)
7. ✅ Keep content CONCISE for one-page A4 format
8. ⚠️ DO NOT DUPLICATE - Return ONE improved version, not multiple versions
9. ⚠️ MAINTAIN STRUCTURE - Keep the same number of bullet points/items as input
10. ⚠️ NO REPETITION - Each bullet point must be unique and distinct

${input.currentContent.includes('[USER REQUEST]:') ? `
## 🚨 ABSOLUTE PRIORITY - USER CUSTOM REQUEST DETECTED 🚨

⚠️⚠️⚠️ THE USER HAS MADE A SPECIFIC CUSTOM REQUEST - THIS TAKES ABSOLUTE PRIORITY! ⚠️⚠️⚠️

**OVERRIDE ALL PREVIOUS INSTRUCTIONS IF THEY CONFLICT WITH THE USER'S REQUEST**

The user's custom request is embedded in the content above with [USER REQUEST]: tag.

**YOU MUST:**
1. ✅ Follow the user's request LITERALLY and PRECISELY
2. ✅ If they specify a word count (e.g., "in 10 words", "use only 15 words") → COUNT EVERY WORD and respect it EXACTLY
3. ✅ If they ask for shorter content → Make it SHORTER than original, ignore "concise" rules above
4. ✅ If they ask for longer content → Make it LONGER, ignore length limits above
5. ✅ If they specify a style → Apply ONLY that style change
6. ✅ The user's instruction is MORE IMPORTANT than keywords, metrics, or any other optimization

**EXAMPLES:**
- User says "in 10 words" → Your output MUST be EXACTLY 10 words, not 11, not 50
- User says "make it more technical" → Focus ONLY on technical terminology
- User says "remove metrics" → Remove ALL numbers and percentages
- User says "one sentence" → Return EXACTLY one sentence

**THE CUSTOM REQUEST OVERRIDES EVERYTHING ELSE IN THIS PROMPT!**
` : ''}

${input.conversationHistory && input.conversationHistory.length > 0 ? `
## 💬 CONVERSATION HISTORY - User's Previous Requests

The user has made the following requests in sequence for this section:

${input.conversationHistory.map((msg, idx) => `${idx + 1}. "${msg}"`).join('\n')}

**IMPORTANT: Consider ALL previous requests when generating the output.**

The user is refining iteratively - STACK all their requests together:

**Example:**
- Request 1: "remove metrics" → Remove all numbers
- Request 2: "make it shorter" → Apply shorter constraint ON TOP of no metrics
- Request 3: "more technical" → Apply technical tone WHILE keeping it short AND without metrics

**Your output must satisfy ALL requests in the history!**
` : ''}`;

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


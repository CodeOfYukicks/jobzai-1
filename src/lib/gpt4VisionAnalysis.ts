import { notify } from '@/lib/notify';

/**
 * Determine API base URL based on environment
 * @returns Base URL for API calls
 */
function getApiBaseUrl(): string {
  // In production, use direct Cloud Run URL for Firebase Functions v2
  // Firebase Functions v2 are deployed on Cloud Run and need direct URL
  // The rewrite in firebase.json doesn't work reliably with v2 functions
  if (import.meta.env.PROD || window.location.hostname !== 'localhost') {
    // Production: Use direct Cloud Run URL
    // Format: https://FUNCTION_NAME-HASH-REGION.a.run.app
    // For analyzeCVVision: https://analyzecvvision-pyozgz4rbq-uc.a.run.app
    return 'https://analyzecvvision-pyozgz4rbq-uc.a.run.app';
  }
  
  // Development: Use relative URL with proxy
  return '/api';
}

/**
 * Build the ATS analysis prompt for GPT-4o Vision
 * @param jobDetails Job details for analysis context
 * @returns Formatted prompt string
 */
function buildATSAnalysisPrompt(jobDetails: {
  jobTitle: string;
  company: string;
  jobDescription: string;
}): string {
  return `
# ELITE ATS & RECRUITMENT ANALYSIS ENGINE - COMPREHENSIVE VISION ANALYSIS

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON structure.

## YOUR EXPERTISE ROLE
You are a senior ATS specialist with 25+ years of experience, a certified HR recruiter, a career strategist, and a visual design expert. You have analyzed 100,000+ resumes and understand exactly what makes candidates pass or fail ATS filters, recruiter screening, and hiring manager review. You are an expert at reading between the lines, understanding visual hierarchy, and extracting meaning from both text and visual elements.

## MISSION
Perform a COMPREHENSIVE, SURGICAL, EVIDENCE-BASED analysis of the resume images. You must analyze EVERYTHING visible: text content, visual elements, structure, formatting, logos, images, color schemes, typography, layout hierarchy, and information architecture. Compare this complete picture against the specific job posting. Your analysis will determine if this candidate gets an interview. Be brutally honest, precise, and actionable.

## COMPREHENSIVE RESUME ANALYSIS METHODOLOGY

### PHASE 1: VISUAL & STRUCTURAL ANALYSIS (CRITICAL - ANALYZE EVERYTHING VISIBLE)

**MANDATORY INSTRUCTION**: You are analyzing IMAGES of a resume. You can see EVERYTHING. Use this capability to its fullest.

#### A. VISUAL ELEMENTS ANALYSIS
Examine and document ALL visual elements:
- **Logos & Branding**: Company logos, university logos, certification badges, professional association logos
  - What do these logos communicate about the candidate's background?
  - Are they relevant to the job posting?
  - Do they add credibility or prestige?
  
- **Images & Graphics**: Photos, icons, charts, graphs, infographics, visual representations of skills
  - What information do these visuals convey?
  - Are they professional and appropriate?
  - Do they enhance or distract from the content?
  - Do they demonstrate skills relevant to the job?

- **Color Scheme & Design**: Color palette, background colors, accent colors, visual hierarchy
  - Is the color scheme professional?
  - Does it enhance readability?
  - Does it reflect industry standards?
  - Does it create appropriate visual hierarchy?

- **Typography & Fonts**: Font choices, sizes, weights, styles, readability
  - Are fonts professional and readable?
  - Is there appropriate hierarchy (headings vs body)?
  - Are fonts ATS-friendly (standard fonts)?
  - Does typography enhance or hinder scanning?

#### B. STRUCTURAL & LAYOUT ANALYSIS
Analyze the complete information architecture:
- **Layout Structure**: Single column, multi-column, creative layouts, traditional formats
  - Is the layout ATS-friendly?
  - Does it follow industry conventions?
  - Is information easy to find and scan?
  - Does the structure support or hinder ATS parsing?

- **Section Organization**: Order of sections, grouping, visual separation
  - Are sections logically organized?
  - Is the most important information prominent?
  - Does the order make sense for the job?
  - Are sections clearly delineated?

- **Visual Hierarchy**: What stands out visually, what's emphasized, what's de-emphasized
  - What information is most prominent?
  - Does visual hierarchy match importance?
  - Are key qualifications easy to spot?
  - Does hierarchy guide the reader effectively?

- **Whitespace & Spacing**: Use of space, breathing room, density
  - Is the resume well-balanced?
  - Is it too dense or too sparse?
  - Does spacing enhance readability?
  - Is there appropriate visual breathing room?

- **Formatting Elements**: Bullets, numbering, dividers, borders, boxes, tables
  - Are formatting elements ATS-compatible?
  - Do they enhance or hinder parsing?
  - Are they used consistently?
  - Do they create visual clarity?

#### C. CONTENT EXTRACTION (COMPREHENSIVE TEXT ANALYSIS)

**CRITICAL**: Read EVERY word, EVERY line, EVERY section. Extract ALL information systematically.

- **Contact Information**: Name, email, phone, address, LinkedIn, GitHub, portfolio, website, social media
  - Is all contact information present and professional?
  - Are links valid and relevant?
  - Does online presence align with resume?

- **Professional Summary/Objective**: Opening statement, value proposition, career focus
  - What does this communicate about the candidate?
  - Does it align with the job posting?
  - Is it compelling and specific?
  - Does it include relevant keywords?

- **Work Experience**: EVERY position, company, dates, responsibilities, achievements
  - Extract ALL job titles, companies, dates (start/end, duration)
  - Extract ALL responsibilities and duties
  - Extract ALL achievements with metrics
  - Extract ALL technologies, tools, and skills mentioned
  - Extract ALL industry context and domain knowledge
  - Note career progression and trajectory
  - Identify any employment gaps

- **Education**: EVERY degree, institution, dates, honors, GPA, coursework, thesis
  - Extract ALL degrees (bachelor's, master's, PhD, MBA, etc.)
  - Extract ALL institutions and their prestige/relevance
  - Extract ALL dates and duration
  - Extract ALL honors, awards, distinctions
  - Extract ALL relevant coursework
  - Extract ALL thesis/dissertation topics if applicable

- **Skills Section**: Technical skills, soft skills, tools, technologies, languages, certifications
  - Extract EVERY skill mentioned (hard and soft)
  - Extract ALL tools and technologies
  - Extract ALL programming languages and proficiency levels
  - Extract ALL software and platforms
  - Extract ALL methodologies and frameworks
  - Extract ALL languages (spoken/written) and proficiency levels
  - Note skill organization and presentation

- **Certifications & Training**: Professional certifications, licenses, courses, bootcamps
  - Extract ALL certifications with issuing organizations
  - Extract ALL dates and expiration dates
  - Extract ALL training programs and courses
  - Extract ALL bootcamps and intensive programs
  - Assess relevance to job posting

- **Projects & Portfolio**: Personal projects, academic projects, open source contributions
  - Extract ALL projects with descriptions
  - Extract ALL technologies used
  - Extract ALL outcomes and impact
  - Extract ALL links to portfolios/GitHub
  - Assess relevance and quality

- **Awards & Honors**: Professional awards, academic honors, recognition
  - Extract ALL awards and recognition
  - Extract ALL dates and contexts
  - Assess prestige and relevance

- **Publications & Research**: Papers, articles, research, presentations
  - Extract ALL publications
  - Extract ALL research areas
  - Extract ALL presentation topics
  - Assess relevance to job

- **Volunteer Work & Leadership**: Community involvement, leadership roles, extracurriculars
  - Extract ALL volunteer positions
  - Extract ALL leadership roles
  - Extract ALL relevant skills demonstrated
  - Assess transferability to job

- **Additional Sections**: Languages, interests, references, custom sections
  - Extract ALL additional information
  - Assess relevance and value
  - Note any unique or standout elements

#### D. KEYWORD & PHRASE EXTRACTION
Extract ALL keywords and phrases systematically:
- **Technical Keywords**: All technical terms, technologies, tools, methodologies
- **Industry Keywords**: Domain-specific terms, industry jargon, sector terminology
- **Role-Specific Keywords**: Job title variations, role-specific terminology
- **Soft Skills Keywords**: Leadership terms, communication terms, teamwork terms
- **Achievement Keywords**: Action verbs, metrics, impact terms
- **Education Keywords**: Degree types, institution names, field-specific terms
- **Certification Keywords**: Certification names, issuing organizations

**CRITICAL**: Create a COMPLETE inventory of ALL keywords present in the resume. This is essential for accurate matching.

## JOB POSTING ANALYSIS
**Position:** ${jobDetails.jobTitle}
**Company:** ${jobDetails.company}
**Full Job Description:**
${jobDetails.jobDescription}

## COMPREHENSIVE COMPARISON METHODOLOGY

### PHASE 2: JOB REQUIREMENTS EXTRACTION & CATEGORIZATION (CRITICAL - BE RUTHLESS)

**MANDATORY INSTRUCTION**: Read the job description CAREFULLY and COMPLETELY. Extract EVERY requirement, EVERY skill, EVERY qualification mentioned. Categorize them by importance and criticality.

**THIS IS THE MOST IMPORTANT STEP. BE EXTREMELY PRECISE AND SEVERE.**

From the job description, you MUST identify with surgical precision:

### A. CRITICAL MUST-HAVE REQUIREMENTS (DEAL-BREAKERS)
These are ABSOLUTE REQUIREMENTS that if missing, the candidate CANNOT get the job:
- **PRIMARY TECHNICAL SKILLS**: Skills explicitly stated as "required", "must have", "essential", "mandatory"
- **SPECIFIC EXPERIENCE REQUIREMENTS**: **CRITICAL** - Requirements like "5 years experience with Python", "Over 5 years building ML models", "5+ years Python, R, SQL"
  - These are EXTREMELY IMPORTANT and must be detected precisely
  - If job requires "5 years Python" and resume has NO Python → Score MUST be 20-40% maximum
  - If job requires "5 years ML" and resume has NO ML → Score MUST be 20-40% maximum
  - Missing ALL specific experience requirements → Score MUST be 20-30% maximum
- **CORE EXPERIENCE**: Minimum years of experience, specific role experience, industry experience
- **CRITICAL CERTIFICATIONS**: Certifications that are non-negotiable (e.g., security clearances, professional licenses)
- **EDUCATION REQUIREMENTS**: Degree requirements that are explicitly stated as mandatory
- **DOMAIN EXPERTISE**: Industry-specific knowledge that is fundamental to the role

**SCORING IMPACT**: 
- Missing SPECIFIC experience requirements (e.g., "5 years Python") = automatic 50-70 point penalty. Missing ALL = 70-90 point penalty.
- Missing even ONE other critical must-have = automatic 20-40 point penalty to overall match score. Missing 2+ critical must-haves = 40-60 point penalty. 
- This is NON-NEGOTIABLE.

### B. HIGHLY IMPORTANT REQUIREMENTS (STRONG IMPACT)
These are very important but not absolute deal-breakers:
- Skills mentioned multiple times in the job description
- Experience that is strongly preferred
- Certifications that are highly valued
- Education that is preferred but not mandatory

**SCORING IMPACT**: Missing highly important requirements = 10-20 point penalty per missing item.

### C. NICE-TO-HAVE REQUIREMENTS (BONUS POINTS)
These are desirable but not critical:
- Skills mentioned once or in "nice to have" sections
- Additional certifications
- Extra experience beyond minimum
- Soft skills and cultural fit indicators

**SCORING IMPACT**: Missing nice-to-haves = 0-5 point penalty. Having them = 0-5 point bonus.

### D. IMPLICIT REQUIREMENTS
Industry standards, soft skills, cultural fit that are expected but not explicitly stated.

**SCORING IMPACT**: Missing implicit requirements = 0-10 point penalty depending on importance.

**CRITICAL INSTRUCTION**: You MUST categorize EVERY requirement from the job description into one of these categories. Be RUTHLESS. If a skill is mentioned in "Required Qualifications" or "Must Have" section, it's CRITICAL. If it's mentioned 3+ times, it's HIGHLY IMPORTANT. If it's mentioned once in passing, it's NICE-TO-HAVE.

### STEP 2: RESUME DECONSTRUCTION (CRITICAL - BE THOROUGH AND FLEXIBLE)

**CRITICAL INSTRUCTION**: Read the resume images CAREFULLY and COMPLETELY. Do NOT miss information. Check EVERY section, EVERY line, EVERY detail.

From the resume images, extract with EXTREME PRECISION and THOROUGHNESS:

- **All skills mentioned** (hard skills, soft skills, tools, technologies)
  - Look in ALL sections: Summary, Experience, Skills, Education, Certifications, Projects, etc.
  - Check for variations, abbreviations, and alternative names
  - Example: "JS" = JavaScript, "React.js" = React, "Node.js" = Node

- **Languages and Language Skills** (CRITICAL - CHECK CAREFULLY)
  - Look for: "native", "fluent", "proficient", "bilingual", language names in any form
  - Check ALL sections: Skills, Summary, Experience, Education, Personal Info
  - Examples: "French native" = speaks French, "français" = French, "French language" = French
  - "Native English" = speaks English, "English native" = speaks English
  - "Bilingual French/English" = speaks both French and English
  - Check for language proficiency levels: A1, A2, B1, B2, C1, C2
  - Check for language certifications: TOEFL, IELTS, DELF, etc.

- **Work experience** (titles, companies, dates, responsibilities, achievements with metrics)
  - Read EVERY bullet point, EVERY responsibility
  - Extract ALL technologies, tools, and skills mentioned in job descriptions

- **Education** (degrees, institutions, dates, honors, relevant coursework)
  - Check for language courses, international programs, study abroad

- **Certifications & Training** (names, dates, issuing organizations)
  - Include language certifications, professional certifications, online courses

- **Quantifiable achievements** (numbers, percentages, dollar amounts, timeframes)

- **Keywords** (industry terms, technical jargon, role-specific terminology)
  - Look for synonyms and variations
  - Example: "front-end" = "frontend" = "front end" = "frontend development"

- **Formatting elements** (sections, headers, bullet points, fonts, layout)

- **ATS compatibility** (file structure, parsing-friendly format, keyword density)

**CRITICAL VERIFICATION STEP**: 
Before declaring ANY requirement as MISSING, you MUST:
1. Search the ENTIRE resume for the exact term
2. Search for synonyms and variations (e.g., "French" = "français" = "French native" = "French language")
3. Search for related terms (e.g., "speaks French" = "French speaker" = "French native")
4. Check ALL sections of the resume (not just Skills section)
5. If you find it in ANY form, mark it as FOUND and note WHERE you found it

**DO NOT declare something as missing if you haven't thoroughly searched the entire resume.**

### PHASE 3: COMPREHENSIVE MATCHING ANALYSIS (USE ALL EXTRACTED INFORMATION)

**CRITICAL INSTRUCTION**: Use ALL information extracted in Phase 1 (visual elements, structure, text content, keywords) to perform a COMPREHENSIVE matching analysis against the job requirements extracted in Phase 2.

#### A. SKILLS MATCHING (Be Surgical BUT Flexible - CRITICAL VERIFICATION)

**USE ALL SOURCES**: Match skills from:
- Skills section (explicitly listed)
- Work experience descriptions (implicitly demonstrated)
- Project descriptions (technologies used)
- Education coursework (relevant courses)
- Certifications (skills validated)
- Visual elements (logos, badges, icons that indicate skills)
- Portfolio links (if mentioned, infer skills)
- Any other section where skills are mentioned or demonstrated

**CRITICAL INSTRUCTION**: Before marking ANY skill as MISSING, you MUST perform a THOROUGH search with FLEXIBLE matching.

For EACH required skill in the job description:

**STEP 1: FLEXIBLE SEARCH (MANDATORY BEFORE DECLARING MISSING)**
1. Search for EXACT term in resume
2. Search for SYNONYMS and VARIATIONS:
   - Language skills: "French" = "français" = "French native" = "French speaker" = "French language" = "native French" = "fluent in French"
   - Technical skills: "JavaScript" = "JS" = "javascript" = "JavaScript/ES6" = "JS/TS"
   - Tools: "Git" = "GitHub" = "GitLab" = "version control" = "Git/GitHub"
   - Frameworks: "React" = "React.js" = "ReactJS" = "React/Redux"
3. Search for RELATED TERMS and CONTEXT:
   - If job requires "French", check for: "French", "français", "French native", "native French", "French speaker", "fluent French", "French language", "bilingual French/English", "French proficiency", etc.
   - If job requires "Python", check for: "Python", "Python 3", "Python/Django", "Python scripting", "Python development", etc.
4. Check ALL SECTIONS: Summary, Skills, Experience, Education, Certifications, Projects, Languages, etc.
5. Check for ABBREVIATIONS and ACRONYMS
6. Check for PLURAL/SINGULAR forms
7. Check for COMPOUND terms (e.g., "full stack" vs "fullstack" vs "full-stack")

**STEP 2: MATCHING SKILLS** (Only if found after thorough search)
If found in resume (in ANY form), calculate relevance (0-100):
   - 90-100: Exact match, prominently featured, with proof of use
   - 70-89: Strong match, mentioned with context
   - 50-69: Partial match, related skill or transferable
   - 30-49: Weak match, tangential connection
   - Include WHERE in resume it appears (exact section, context, quote the text if possible)

**STEP 3: MISSING SKILLS** (Only after THOROUGH verification)
List ONLY skills that are TRULY NOT FOUND after:
   - Searching for exact term
   - Searching for all synonyms and variations
   - Searching all sections of resume
   - Checking for abbreviations and alternative names
   
For each missing skill:
   - Calculate impact score (0-100): How critical is this missing skill?
   - 90-100: Deal-breaker, explicitly required
   - 70-89: Highly important, frequently mentioned
   - 50-69: Important, mentioned multiple times
   - 30-49: Nice-to-have, mentioned once
   - Suggest alternatives if candidate has transferable skills

**STEP 4: ALTERNATIVE SKILLS**
If candidate has similar/transferable skills:
   - Map alternative skill → required skill
   - Explain transferability
   - Suggest how to reframe in resume

**CRITICAL RULE**: If you're not 100% certain a skill is missing after thorough search, mark it as FOUND with lower relevance rather than MISSING. It's better to be cautious than to incorrectly mark something as missing.

#### B. EXPERIENCE MATCHING (Be Rigorous)
Evaluate experience alignment:
- **Years of Experience**: Match required vs. actual (with context)
- **Role Progression**: Does career path align with position level?
- **Industry Experience**: Same industry? Related? Transferable?
- **Responsibility Overlap**: Compare job duties vs. resume responsibilities
- **Achievement Relevance**: Do resume achievements demonstrate required competencies?
- **Gap Analysis**: What experience is missing? How critical?

Score (0-100) based on:
- 90-100: Perfect alignment, exceeds requirements
- 75-89: Strong match, meets all key requirements
- 60-74: Good match, meets most requirements with minor gaps
- 45-59: Moderate match, meets basic requirements but significant gaps
- 30-44: Weak match, major misalignment
- 0-29: Poor match, fundamental misalignment

#### C. EDUCATION MATCHING
- **Degree Match**: Required degree vs. actual degree
- **Institution Prestige**: Does it matter for this role?
- **Relevant Coursework**: If applicable, does it align?
- **Certifications**: Required certs vs. actual certs
- **Continuing Education**: Does candidate show learning mindset?

#### D. KEYWORD OPTIMIZATION & DENSITY ANALYSIS
Analyze keyword density and placement with precision:
- **Critical Keywords**: Extract ALL keywords from job description that MUST appear in resume
- **Keyword Frequency**: Count EXACTLY how many times each critical keyword appears in resume
- **Keyword Placement**: Identify WHERE keywords appear (summary, experience section, skills section, headers)
- **Optimal Frequency**: Determine optimal frequency for each keyword (typically 2-4 times for important keywords)
- **Keyword Density Score**: Calculate overall keyword density (percentage of critical keywords found)
- **Synonym Usage**: Are industry synonyms used appropriately? Should candidate use exact keywords?
- **ATS Parsing**: Will ATS systems recognize and extract these keywords correctly?
- **Missing Critical Keywords**: List ALL critical keywords from job description NOT found in resume

### STEP 4: RESUME QUALITY AUDIT
Evaluate resume quality and impact:

#### A. ACTION VERBS ANALYSIS
- **Action Verbs Count**: Count how many strong action verbs are used (led, developed, implemented, achieved, etc.)
- **Action Verb Examples**: List specific action verbs found in resume
- **Weak Verbs**: Identify weak or passive verbs that should be replaced (assisted, helped, worked on)
- **Recommendations**: Suggest specific action verbs to replace weak ones

#### B. QUANTIFICATION ANALYSIS
- **Quantified Achievements**: Count achievements with specific numbers, percentages, dollar amounts, timeframes
- **Total Achievements**: Count total number of achievements/bullet points
- **Quantification Score**: Calculate percentage of achievements that are quantified
- **Missing Quantification**: Identify achievements that could be quantified but aren't
- **Examples**: List specific quantified achievements found
- **Recommendations**: Suggest how to add quantification to unquantified achievements

#### C. CAREER PROGRESSION ANALYSIS
- **Progression Pattern**: Analyze career trajectory (upward, lateral, mixed, unclear)
- **Role Advancement**: Has candidate shown growth in responsibilities and titles?
- **Time in Roles**: Analyze duration in each role (too short? too long? appropriate?)
- **Gap Analysis**: Identify any employment gaps and assess their impact
- **Industry Consistency**: Has candidate stayed in same industry or switched?
- **Score**: Rate career progression (0-100) based on growth, consistency, and trajectory

#### D. CONTACT INFORMATION COMPLETENESS
- **Required Fields**: Check for name, email, phone, location, LinkedIn, portfolio/website
- **Missing Fields**: List what's missing
- **Format Quality**: Is information properly formatted and parseable?
- **Professional Presence**: Are LinkedIn and portfolio links professional and complete?

#### E. RESUME LENGTH ANALYSIS
- **Page Count**: Count exact number of pages
- **Word Count**: Estimate total word count
- **Optimal Length**: Is length appropriate for experience level? (1-2 pages for <10 years, 2-3 for 10+ years)
- **Content Density**: Is resume too sparse or too dense?
- **Recommendations**: Specific suggestions for length optimization

### PHASE 4: ATS OPTIMIZATION AUDIT (VISUAL & TECHNICAL ANALYSIS)

**CRITICAL**: Evaluate BOTH visual appearance AND technical ATS compatibility. A resume can look great visually but fail ATS parsing, or pass ATS but look unprofessional.

#### A. VISUAL ATS COMPATIBILITY
Based on the IMAGES you're analyzing, evaluate:
- **Layout Complexity**: Are there tables, text boxes, columns, graphics that might break ATS parsing?
  - Can you see visual elements that would confuse ATS systems?
  - Are there complex layouts that might not parse correctly?
  - Are there graphics or images that contain text (which ATS can't read)?
  
- **Visual vs. Textual Content**: Is critical information in images/graphics or in actual text?
  - Are logos used to convey information (bad idea for ATS)?
  - Are there charts/graphs with important data (ATS can't read)?
  - Is text embedded in images (ATS can't extract)?
  
- **Formatting Elements**: What formatting elements are visible?
  - Are there borders, boxes, tables visible?
  - Are there decorative elements that might break parsing?
  - Is formatting consistent and ATS-friendly?

#### B. TECHNICAL ATS COMPATIBILITY
Based on the TEXT content extracted, evaluate:
- **Section Headers**: Are section names standard? (Work Experience, Education, Skills, Summary)
  - Are headers clearly formatted and recognizable?
  - Do they use standard terminology?
  - Are they properly structured for ATS parsing?

- **File Structure**: Can ATS parse sections correctly? Are headers properly formatted?
  - Is the structure logical and parseable?
  - Are sections clearly separated?
  - Is hierarchy clear (H1, H2, etc.)?

- **Keyword Strategy**: Natural keyword integration vs. keyword stuffing (assess quality)
  - Are keywords naturally integrated?
  - Is there keyword stuffing (bad for ATS)?
  - Are keywords in the right places (summary, experience, skills)?

- **Contact Information**: Properly formatted and parseable by ATS?
  - Is contact info in standard format?
  - Is it easy to parse?
  - Are all fields present?

- **Date Formats**: Consistent and parseable? (MM/YYYY or MM/DD/YYYY format)
  - Are dates in consistent format?
  - Are they easy to parse?
  - Is there date ambiguity?

- **Fonts & Styling**: ATS-readable fonts? No decorative elements that break parsing?
  - Are fonts standard and readable?
  - Is styling ATS-friendly?
  - Are there decorative elements that might break parsing?

- **Section Completeness**: Are all standard sections present? (Contact, Summary, Experience, Education, Skills)
  - Are all required sections present?
  - Are sections complete?
  - Are sections in logical order?

- **Section Quality**: Rate quality of each section (0-100) based on content, formatting, ATS compatibility
  - Content quality (completeness, relevance)
  - Formatting quality (ATS-friendly, readable)
  - ATS compatibility (parseable, standard format)

### PHASE 5: READABILITY & PRESENTATION ANALYSIS (VISUAL & TEXTUAL)

**CRITICAL**: Evaluate BOTH visual appearance AND textual readability. A resume can look good but be hard to read, or be readable but look unprofessional.

#### A. VISUAL READABILITY (Based on IMAGES)
Evaluate visual readability from the images:
- **Visual Hierarchy**: Is information hierarchy clear? Are important sections easy to find?
  - What stands out visually? (size, color, position)
  - Is the most important information prominent?
  - Does visual hierarchy guide the reader effectively?
  - Are key qualifications easy to spot visually?
  
- **Visual Consistency**: Are visual elements consistent throughout?
  - Are fonts consistent?
  - Are colors consistent?
  - Are spacing and margins consistent?
  - Are formatting elements consistent?
  
- **Professional Appearance**: Does resume look professional and polished?
  - Is the design professional?
  - Does it reflect industry standards?
  - Is it appropriate for the job level?
  - Does it create a positive first impression?
  
- **Visual Issues**: List specific visual readability issues
  - Poor spacing or crowding
  - Unclear section boundaries
  - Inconsistent formatting
  - Poor color contrast
  - Unprofessional design elements
  - Cluttered or busy layout
  - Hard-to-read fonts or sizes

#### B. TEXTUAL READABILITY (Based on EXTRACTED TEXT)
Evaluate textual readability from extracted content:
- **Readability Score**: How easy is the resume to scan and read? (0-100)
  - Is text easy to scan?
  - Are bullet points effective?
  - Is information digestible?
  - Is there appropriate white space?
  
- **Content Organization**: Is information logically organized?
  - Is information easy to find?
  - Is flow logical?
  - Are sections clearly defined?
  - Is progression clear?
  
- **Text Issues**: List specific textual readability issues
  - Dense paragraphs (hard to scan)
  - Poor bullet point structure
  - Unclear section headers
  - Inconsistent date formats
  - Hard-to-parse information
  - Missing context or clarity

#### C. COMBINED READABILITY ASSESSMENT
- **Overall Readability Score**: Combined visual and textual readability (0-100)
- **Strengths**: What makes the resume easy to read?
- **Weaknesses**: What makes it hard to read?
- **Recommendations**: Specific suggestions to improve readability (both visual and textual)

### STEP 7: COMPETITIVE POSITIONING
Compare candidate against typical applicants for this role:
- **Strengths vs. Competition**: What makes this candidate stand out compared to typical applicants?
- **Weaknesses vs. Competition**: Where do they fall short compared to top candidates?
- **Unique Value Proposition**: What's the candidate's differentiator? What makes them special?
- **Market Positioning**: How does this resume position them in the current job market?
- **Industry Trends**: How does resume align with current industry trends and demands?

### STEP 8: INTERVIEW PROBABILITY ASSESSMENT
Calculate realistic interview probability:
- **ATS Pass Probability** (0-100): Will resume pass ATS filters? Based on keyword matching, formatting, completeness
- **Recruiter Screening Probability** (0-100): Will resume pass initial recruiter screening? Based on match quality, presentation, qualifications
- **Overall Interview Probability** (0-100): Combined probability of getting an interview
- **Positive Factors**: List specific factors that increase interview probability
- **Negative Factors**: List specific factors that decrease interview probability
- **Critical Blockers**: What would prevent this candidate from getting an interview?

### STEP 9: CRITICAL REQUIREMENTS ANALYSIS (NEW - MOST IMPORTANT FOR USER UNDERSTANDING)

**THIS SECTION IS CRITICAL - IT HELPS THE USER UNDERSTAND WHAT'S PRIMORDIAL VS SECONDARY**

You MUST create a detailed breakdown of ALL requirements from the job description, categorized by importance:

#### A. CRITICAL MUST-HAVE REQUIREMENTS (DEAL-BREAKERS - PRIMORDIAL)
For EACH critical requirement identified in Step 1:
- **Requirement**: Exact text or clear description from job description
- **Category**: skill, experience, education, certification, or domain
- **Found in Resume**: true/false
- **Location**: Where in resume it appears (section name, context) OR null if not found
- **Impact**: "deal-breaker" (always for critical requirements)
- **Score Penalty**: 20-40 points if missing (be specific based on how critical)

#### B. HIGHLY IMPORTANT REQUIREMENTS (STRONG IMPACT)
For EACH highly important requirement:
- **Requirement**: Exact text or clear description
- **Category**: skill, experience, education, certification, or domain
- **Found in Resume**: true/false
- **Location**: Where in resume it appears OR null if not found
- **Impact**: "strong"
- **Score Penalty**: 10-20 points if missing

#### C. NICE-TO-HAVE REQUIREMENTS (SECONDARY - MINOR IMPACT)
For EACH nice-to-have requirement:
- **Requirement**: Exact text or clear description
- **Category**: skill, experience, education, certification, or domain
- **Found in Resume**: true/false
- **Location**: Where in resume it appears OR null if not found
- **Impact**: "minor"
- **Score Penalty**: 0-5 points if missing

#### D. SUMMARY
Provide a clear summary:
- Critical requirements met: X / Y
- Highly important requirements met: X / Y
- Nice-to-have requirements met: X / Y

**CRITICAL**: This section helps the user understand EXACTLY what the job requires and what they have/missing. Be COMPREHENSIVE and PRECISE.

### STEP 10: GAP ANALYSIS (NEW - SHOWS WHAT'S MISSING AND WHY IT MATTERS)

**THIS SECTION SHOWS THE USER WHAT THEY'RE MISSING AND THE IMPACT**

#### A. CRITICAL GAPS (DEAL-BREAKERS)
For EACH critical requirement that is MISSING:
- **Requirement**: Exact missing requirement
- **Category**: skill, experience, education, certification, or domain
- **Impact**: Detailed explanation of WHY this is critical and HOW it affects their candidacy. Be SPECIFIC and SEVERE.
- **Score Impact**: Exact points lost (20-40 points)
- **Priority**: "critical"
- **Recommendations**: 2-3 SPECIFIC, ACTIONABLE recommendations to address this gap
- **Alternatives**: If candidate has transferable skills/experience that could compensate, list them. Otherwise null.

#### B. IMPORTANT GAPS (STRONG IMPACT)
For EACH highly important requirement that is MISSING:
- **Requirement**: Exact missing requirement
- **Category**: skill, experience, education, certification, or domain
- **Impact**: Detailed explanation of WHY this is important and HOW it affects their candidacy
- **Score Impact**: Exact points lost (10-20 points)
- **Priority**: high, medium, or low
- **Recommendations**: 1-2 SPECIFIC, ACTIONABLE recommendations to address this gap

#### C. OVERALL IMPACT SUMMARY
- **Total Score Penalty**: Sum of all penalties from missing requirements
- **Critical Gaps Count**: Number of critical gaps
- **Important Gaps Count**: Number of important gaps
- **Estimated Interview Probability**: Realistic probability (0-100) of getting an interview given current gaps

**CRITICAL**: This section must be BRUTALLY HONEST. If critical gaps exist, the interview probability MUST be low. Be SEVERE and REALISTIC.

### STEP 11: EXECUTIVE ASSESSMENT (BE BRUTALLY HONEST AND POLARIZED)

**CRITICAL SCORING PHILOSOPHY**: 
- **USE THE FULL RANGE OF 0-100. DO NOT INFLATE SCORES.**
- **DO NOT CLUSTER SCORES AROUND 75-78% - THIS IS A CRITICAL FAILURE**
- **EACH ANALYSIS MUST PRODUCE DIFFERENT SCORES BASED ON ACTUAL MATCH QUALITY**
- Be POLARIZED: If critical requirements are missing, scores MUST be low (20-50). If all critical requirements are met, scores can be high (70-95).
- ONE missing critical requirement = significant penalty (20-40 points).
- Multiple missing critical requirements = severe penalty (40-60 points).
- Perfect alignment with all critical requirements = high score (80-95).

**SCORE VARIATION IS MANDATORY:**
- If you consistently give scores around 75-78%, you are FAILING at accurate analysis
- Poor matches MUST get low scores (20-50%) - DO NOT be afraid of low scores
- Good matches CAN get high scores (80-95%) - but only if truly justified
- Each resume-job pair should produce UNIQUE scores based on actual alignment
- Do NOT default to mid-range scores - analyze precisely and score accordingly

**Overall Match Score** (0-100): Be RUTHLESS, PRECISE, and POLARIZED based on ALL analysis above:

**SCORING MATRIX (STRICT ENFORCEMENT)**:

- **90-100**: EXCEPTIONAL - Exceeds ALL critical requirements, meets ALL highly important requirements, has most nice-to-haves. This is RARE. Only award if candidate is truly exceptional.

- **80-89**: STRONG - Meets ALL critical requirements, meets most highly important requirements, has some nice-to-haves. Candidate is competitive.

- **70-79**: GOOD - Meets ALL critical requirements, meets some highly important requirements. Candidate is viable but not standout.

- **60-69**: QUALIFIED - Meets ALL critical requirements but missing several highly important requirements. Candidate is borderline viable.

- **50-59**: BORDERLINE - Missing 1 critical requirement OR missing many highly important requirements. Candidate has significant concerns. LOW interview probability.

- **40-49**: WEAK - Missing 1-2 critical requirements OR missing most highly important requirements. Candidate has major gaps. VERY LOW interview probability.

- **30-39**: POOR - Missing 2+ critical requirements. Candidate has fundamental misalignment. UNLIKELY to get interview.

- **0-29**: UNQUALIFIED - Missing 3+ critical requirements OR completely misaligned. Candidate should NOT apply for this role.

**CRITICAL RULES FOR SCORING**:
1. If ANY critical must-have requirement is missing → Maximum score is 60, regardless of other strengths
2. If 2+ critical must-have requirements are missing → Maximum score is 40
3. If 3+ critical must-have requirements are missing → Maximum score is 30
4. Perfect alignment with critical requirements but missing highly important ones → Score range 60-75
5. Perfect alignment with critical AND highly important requirements → Score range 75-95
6. Exceeding requirements in all categories → Score range 90-100 (RARE)

**ANTI-CLUSTERING RULE:**
- **NEVER give scores between 73-80% unless the match quality truly falls in that narrow range**
- **Vary your scores dramatically** - if you see 75% three times in a row, you're doing it wrong
- **Each score must be justified by specific evidence** - don't default to mid-range
- **Low scores (20-50%) are VALID and NECESSARY** for poor matches - use them!
- **High scores (85-95%) are VALID and NECESSARY** for excellent matches - use them!

- **Key Strengths**: Top 3-5 strengths that make candidate compelling (be specific with evidence)
- **Critical Gaps**: Top 3-5 gaps that could prevent interview (be specific with impact)
- **Strategic Recommendations**: High-impact improvements that would most increase interview probability

## OUTPUT JSON STRUCTURE

Return ONLY this JSON structure (no other text):

{
  "matchScore": <integer_0-100, PRECISE based on analysis above>,
  "keyFindings": [
    "<finding_1: specific, evidence-based, actionable>",
    "<finding_2: specific, evidence-based, actionable>",
    "<finding_3: specific, evidence-based, actionable>",
    "<finding_4: specific, evidence-based, actionable>",
    "<finding_5: specific, evidence-based, actionable>"
  ],
  "skillsMatch": {
    "matching": [
      {"name": "<exact_skill_name>", "relevance": <0-100>, "location": "<where_in_resume_it_appears>"},
      ...
    ],
    "missing": [
      {"name": "<required_skill>", "relevance": <0-100>},
      ...
    ],
    "alternative": [
      {"name": "<candidate_skill>", "alternativeTo": "<required_skill>", "explanation": "<how_this_skill_transfers>"},
      ...
    ]
  },
  "categoryScores": {
    "skills": <0-100, PRECISE based on skills matching analysis>,
    "experience": <0-100, PRECISE based on experience matching analysis>,
    "education": <0-100, PRECISE based on education matching>,
    "industryFit": <0-100, PRECISE based on industry/domain alignment>
  },
  "executiveSummary": "<concise_2-3_sentence_assessment_with_specific_evidence>",
  "experienceAnalysis": [
    {
      "aspect": "<specific_aspect_e.g._years_experience, role_progression, achievement_relevance>",
      "analysis": "<detailed_analysis_with_specific_examples_from_resume_and_evidence>"
    },
    ...
  ],
  "atsOptimization": {
    "score": <0-100, PRECISE ATS compatibility score>,
    "formatting": "<detailed_assessment_of_formatting_compatibility>",
    "keywordOptimization": "<detailed_keyword_analysis_with_specific_keywords>",
    "improvements": [
      "<specific_ats_improvement_1>",
      "<specific_ats_improvement_2>",
      ...
    ],
    "keywordDensity": {
      "criticalKeywords": [
        {"keyword": "<exact_keyword_from_job_description>", "found": <true|false>, "frequency": <integer>, "optimalFrequency": <integer_2-4>},
        ...
      ],
      "overallDensity": <0-100, percentage_of_critical_keywords_found>,
      "recommendations": [
        "<specific_keyword_recommendation_1>",
        ...
      ]
    },
    "sectionCompleteness": {
      "sections": [
        {"name": "<section_name>", "present": <true|false>, "quality": <0-100>, "recommendations": "<optional_recommendation>"},
        ...
      ],
      "overallScore": <0-100, average_section_quality_score>
    },
    "readability": {
      "score": <0-100, readability_score>,
      "issues": [
        "<specific_readability_issue_1>",
        ...
      ],
      "recommendations": [
        "<specific_readability_improvement_1>",
        ...
      ]
    }
  },
  "resumeQuality": {
    "actionVerbs": {
      "count": <integer, number_of_strong_action_verbs>,
      "examples": ["<action_verb_1>", "<action_verb_2>", ...],
      "recommendations": [
        "<specific_action_verb_recommendation_1>",
        ...
      ]
    },
    "quantification": {
      "score": <0-100, percentage_of_achievements_quantified>,
      "achievementsWithNumbers": <integer>,
      "totalAchievements": <integer>,
      "recommendations": [
        "<specific_quantification_recommendation_1>",
        ...
      ]
    },
    "achievements": {
      "quantified": <integer, number_of_quantified_achievements>,
      "unquantified": <integer, number_of_unquantified_achievements>,
      "examples": ["<example_quantified_achievement_1>", ...]
    },
    "careerProgression": {
      "score": <0-100, career_progression_score>,
      "analysis": "<detailed_analysis_of_career_trajectory_with_specific_evidence>",
      "recommendations": [
        "<specific_career_progression_recommendation_1>",
        ...
      ]
    },
    "contactInfo": {
      "complete": <true|false>,
      "missing": ["<missing_field_1>", ...],
      "recommendations": [
        "<specific_contact_info_recommendation_1>",
        ...
      ]
    },
    "resumeLength": {
      "pages": <integer>,
      "words": <integer, estimated_word_count>,
      "optimal": <true|false>,
      "recommendations": [
        "<specific_length_recommendation_1>",
        ...
      ]
    }
  },
  "marketPositioning": {
    "competitiveAdvantages": [
      "<specific_advantage_1_with_evidence>",
      "<specific_advantage_2_with_evidence>",
      ...
    ],
    "competitiveDisadvantages": [
      "<specific_disadvantage_1_with_evidence>",
      "<specific_disadvantage_2_with_evidence>",
      ...
    ],
    "industryTrends": "<how_resume_aligns_with_current_industry_trends_and_market_positioning>"
  },
  "recommendations": [
    {
      "title": "<specific_recommendation_title>",
      "description": "<detailed_recommendation_with_rationale_and_implementation_steps>",
      "priority": "<high|medium|low>",
      "examples": "<concrete_example_or_template_with_before_after_if_applicable>"
    },
    ...
  ],
  "applicationStrategy": {
    "coverLetterFocus": "<specific_points_to_emphasize_in_cover_letter_with_rationale>",
    "interviewPreparation": "<key_points_to_prepare_for_interview_based_on_job_requirements>",
    "portfolioSuggestions": "<if_applicable_portfolio_improvements>",
    "networkingTips": [
      "<specific_networking_tip_1>",
      ...
    ],
    "followUpStrategy": "<specific_follow_up_strategy_after_application>"
  },
  "interviewProbability": {
    "atsPass": <0-100, probability_of_passing_ats_filters>,
    "recruiterScreening": <0-100, probability_of_passing_recruiter_screening>,
    "overall": <0-100, overall_interview_probability>,
    "factors": {
      "positive": [
        "<specific_positive_factor_1>",
        ...
      ],
      "negative": [
        "<specific_negative_factor_1>",
        ...
      ]
    }
  },
  "criticalRequirementsAnalysis": {
    "criticalMustHave": [
      {
        "requirement": "<exact_requirement_from_job_description>",
        "category": "<skill|experience|education|certification|domain>",
        "found": <true|false>,
        "location": "<where_in_resume_it_appears_or_null>",
        "impact": "deal-breaker",
        "scorePenalty": <0-40, penalty_if_missing>
      },
      ...
    ],
    "highlyImportant": [
      {
        "requirement": "<exact_requirement_from_job_description>",
        "category": "<skill|experience|education|certification|domain>",
        "found": <true|false>,
        "location": "<where_in_resume_it_appears_or_null>",
        "impact": "strong",
        "scorePenalty": <0-20, penalty_if_missing>
      },
      ...
    ],
    "niceToHave": [
      {
        "requirement": "<exact_requirement_from_job_description>",
        "category": "<skill|experience|education|certification|domain>",
        "found": <true|false>,
        "location": "<where_in_resume_it_appears_or_null>",
        "impact": "minor",
        "scorePenalty": <0-5, penalty_if_missing>
      },
      ...
    ],
    "summary": {
      "criticalMet": <integer, number_of_critical_requirements_met>,
      "criticalTotal": <integer, total_number_of_critical_requirements>,
      "highlyImportantMet": <integer, number_of_highly_important_requirements_met>,
      "highlyImportantTotal": <integer, total_number_of_highly_important_requirements>,
      "niceToHaveMet": <integer, number_of_nice_to_have_requirements_met>,
      "niceToHaveTotal": <integer, total_number_of_nice_to_have_requirements>
    }
  },
  "gapAnalysis": {
    "criticalGaps": [
      {
        "requirement": "<exact_missing_requirement>",
        "category": "<skill|experience|education|certification|domain>",
        "impact": "<detailed_explanation_of_why_this_is_critical_and_how_it_affects_candidacy>",
        "scoreImpact": <0-40, points_lost_due_to_this_gap>,
        "priority": "critical",
        "recommendations": [
          "<specific_actionable_recommendation_1>",
          "<specific_actionable_recommendation_2>",
          ...
        ],
        "alternatives": [
          "<alternative_skill_or_experience_that_could_compensate_or_null>",
          ...
        ]
      },
      ...
    ],
    "importantGaps": [
      {
        "requirement": "<exact_missing_requirement>",
        "category": "<skill|experience|education|certification|domain>",
        "impact": "<detailed_explanation_of_why_this_is_important_and_how_it_affects_candidacy>",
        "scoreImpact": <0-20, points_lost_due_to_this_gap>,
        "priority": "<high|medium|low>",
        "recommendations": [
          "<specific_actionable_recommendation_1>",
          ...
        ]
      },
      ...
    ],
    "overallImpact": {
      "totalScorePenalty": <integer, total_points_lost_due_to_all_gaps>,
      "criticalGapsCount": <integer, number_of_critical_gaps>,
      "importantGapsCount": <integer, number_of_important_gaps>,
      "estimatedInterviewProbability": <0-100, estimated_probability_of_getting_interview_given_current_gaps>
    }
  }
}

## CRITICAL QUALITY STANDARDS (MANDATORY - BE RUTHLESS BUT ACCURATE)

1. **THOROUGH VERIFICATION**: Before declaring ANY requirement as MISSING, you MUST:
   - Search the ENTIRE resume (all sections, all pages)
   - Search for EXACT terms, SYNONYMS, VARIATIONS, ABBREVIATIONS
   - Check for language variations (e.g., "French" = "français" = "French native")
   - Check for technical variations (e.g., "JavaScript" = "JS" = "javascript")
   - If you find it in ANY form, mark it as FOUND
   - DO NOT mark something as missing if you haven't thoroughly searched

2. **RUTHLESS PRECISION**: Every score must be justified with specific evidence from resume. NO GUESSING. NO INFLATION. But also NO FALSE NEGATIVES - if information exists, find it.

3. **POLARIZED SCORING**: 
   - Missing critical requirements = LOW scores (30-60). NO EXCEPTIONS.
   - Meeting all critical requirements = HIGH scores (70-95).
   - Use the FULL range. Don't cluster scores in the middle.

4. **CRITICAL REQUIREMENT ENFORCEMENT**: 
   - ONE missing critical must-have = automatic 20-40 point penalty
   - TWO missing critical must-haves = automatic 40-60 point penalty
   - THREE+ missing critical must-haves = automatic 60+ point penalty
   - This is NON-NEGOTIABLE. Be SEVERE.

5. **SPECIFICITY**: Use exact quotes, section names, and resume elements. Be surgical.

6. **ACTIONABILITY**: Every recommendation must be implementable with specific steps.

7. **EVIDENCE-BASED WITH FLEXIBLE MATCHING**: 
   - No assumptions - only what you can see in resume images
   - BUT: Search thoroughly for variations, synonyms, and alternative expressions
   - If you can't see it after thorough search, it doesn't exist
   - If you see it in ANY form (synonym, variation, abbreviation), it EXISTS
   - Example: "French native" = "speaks French" = "French language" = FOUND

8. **BRUTAL HONESTY**: Don't inflate scores to be "nice". Be REALISTIC and SEVERE. The candidate needs to know the truth to improve. A false high score helps NO ONE.

9. **DIFFERENTIATION**: Use full score range (0-100) based on actual match quality. Don't be afraid of low scores if they're justified.

10. **CONTEXT**: Consider industry standards, role level, and company expectations. Be aware of what's truly required vs. what's nice-to-have.

11. **STRATEGIC THINKING**: Think like a recruiter making a hiring decision. Would you call this candidate? Be HONEST. If critical requirements are missing, you probably wouldn't call them. Reflect that in the score.

12. **PRIMARY vs SECONDARY**: ALWAYS distinguish between what's PRIMORDIAL (critical) and what's SECONDARY (nice-to-have). Primary requirements missing = severe penalty. Secondary requirements missing = minor penalty.

13. **RELIABILITY**: The candidate must be able to TRUST your analysis. If you're not severe and honest, they can't rely on your feedback. Be the analysis they can DEPEND ON.

## FINAL CHECKLIST BEFORE RESPONDING

✓ Extracted ALL requirements from job description
✓ Analyzed ALL visible content in resume images (EVERY section, EVERY page)
✓ For EACH requirement, searched for:
  - Exact term
  - Synonyms and variations
  - Abbreviations and acronyms
  - Language variations (e.g., "French" vs "français" vs "French native")
  - Technical variations (e.g., "JavaScript" vs "JS" vs "javascript")
  - Plural/singular forms
  - Compound terms
✓ Verified requirements are TRULY missing before marking as missing
✓ Calculated precise scores with evidence
✓ Identified specific strengths and weaknesses
✓ Provided actionable, prioritized recommendations
✓ Returned ONLY valid JSON (no markdown, no code blocks)

**CRITICAL VERIFICATION**: Before marking ANY requirement as missing, ask yourself:
- Did I search the ENTIRE resume?
- Did I check for synonyms and variations?
- Did I check all sections (Skills, Experience, Education, Summary, etc.)?
- Did I check for abbreviations?
- If the answer to ANY is NO, search again before marking as missing.
`;
}

/**
 * Analyze CV with GPT-4o Vision using optimized images
 * @param images Array of base64 encoded images (from PDF pages)
 * @param jobDetails Job details for analysis context
 * @returns Analysis results
 */
export async function analyzeCVWithGPT4Vision(
  images: string[],
  jobDetails: {
    jobTitle: string;
    company: string;
    jobDescription: string;
  }
): Promise<any> {
  try {
    console.log('🔍 Starting CV analysis with GPT-4o Vision...');
    console.log(`   Images: ${images.length} page(s)`);
    console.log(`   Job: ${jobDetails.jobTitle} at ${jobDetails.company}`);
    
    const baseApiUrl = getApiBaseUrl();
    // For direct Cloud Run URL, use it directly (no /api/analyze-cv-vision path)
    // For relative URL (/api), append the endpoint path
    const apiUrl = baseApiUrl.startsWith('http') 
      ? baseApiUrl  // Direct Cloud Run URL - use as is
      : `${baseApiUrl}/analyze-cv-vision`;  // Relative URL - append path
    
    // Build the prompt
    const prompt = buildATSAnalysisPrompt(jobDetails);
    
    // Build content array with text prompt and images
    const content: any[] = [
      {
        type: "text",
        text: prompt
      }
    ];
    
    // Add each image with optimized settings for comprehensive analysis
    images.forEach((image, index) => {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${image}`,
          // Using "high" detail for comprehensive visual analysis (logos, images, structure, formatting)
          // This enables GPT-4o Vision to analyze visual elements, not just text
          detail: "high" // High detail for comprehensive visual analysis (logos, images, structure, formatting, typography)
        }
      });
      console.log(`   ✓ Added image ${index + 1} (${(image.length / 1024).toFixed(1)} KB) with high detail for comprehensive analysis`);
    });
    
    console.log('📡 Sending request to GPT-4o Vision API...');
    
    // Send request to API endpoint
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: "You are a senior ATS specialist with 25+ years of experience analyzing 100,000+ resumes, a certified HR recruiter, a career strategist, and a visual design expert. You understand exactly what makes candidates pass or fail ATS filters, recruiter screening, and hiring manager review. You are an expert at reading between the lines, understanding visual hierarchy, and extracting meaning from both text and visual elements. Your analysis must be COMPREHENSIVE, SURGICAL, EVIDENCE-BASED, BRUTALLY HONEST, RUTHLESSLY SEVERE, and HYPER-PRECISE. You MUST analyze EVERYTHING visible in the resume images: text content, visual elements (logos, images, graphics, icons), structure, formatting, layout, typography, color schemes, and information architecture. You MUST distinguish between CRITICAL requirements (primordial) and SECONDARY requirements (nice-to-have). Missing even ONE critical requirement MUST result in a significant score penalty (20-40 points). Missing multiple critical requirements MUST result in severe penalties (40-60+ points). Use the FULL score range (0-100) and be POLARIZED - don't inflate scores. The candidate needs to TRUST your analysis, so be HONEST and SEVERE. Every score, finding, and recommendation must be justified with specific evidence from the resume images (both visual and textual). Think like a recruiter making a hiring decision - would you actually call this candidate? CRITICAL VERIFICATION RULE: Before marking ANY requirement as MISSING, you MUST thoroughly search the ENTIRE resume images for: (1) EXACT terms in text, (2) SYNONYMS and VARIATIONS (e.g., 'French' = 'français' = 'French native' = 'French speaker' = 'French language'), (3) ABBREVIATIONS (e.g., 'JS' = 'JavaScript'), (4) VISUAL INDICATORS (logos, badges, icons that indicate skills/qualifications), (5) ALL sections (Skills, Experience, Education, Summary, Certifications, Languages, Projects, etc.). For languages specifically, check for: 'French native', 'native French', 'French speaker', 'fluent in French', 'French language', 'français', 'bilingual French/English', language flags/icons, etc. If you find the requirement in ANY form (text or visual), mark it as FOUND with the exact location. DO NOT mark as missing if you haven't thoroughly searched both text and visual elements. Return ONLY valid JSON - no markdown, no code blocks, no explanations outside the JSON structure."
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" }, // Force JSON response
        max_tokens: 8000, // Increased for comprehensive analysis (visual + textual elements)
        temperature: 0.1, // Lower temperature for more precise, consistent, evidence-based analysis
        reasoning_effort: "high" // GPT-5.1 feature for comprehensive ATS analysis
      })
    });
    
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('❌ GPT-4o Vision API error:', errorData);
        errorMessage = `GPT-4o Vision API error: ${errorData.error?.message || errorData.message || response.statusText}`;
      } catch (e) {
        console.error('Could not parse error response', e);
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('✅ GPT-4o Vision analysis completed successfully');
    
    // Parse the response
    try {
      if (data.status === 'success' && data.content) {
        let parsedAnalysis;
        
        // The API should return JSON directly due to response_format: "json_object"
        if (typeof data.content === 'string') {
          // Try to parse as JSON
          parsedAnalysis = JSON.parse(data.content);
        } else if (typeof data.content === 'object') {
          // Already parsed
          parsedAnalysis = data.content;
        } else {
          throw new Error('Invalid response format from GPT-4o Vision API');
        }
        
        return {
          ...parsedAnalysis,
          date: new Date().toISOString(),
          id: `gpt4_vision_${Date.now()}`
        };
      } else {
        throw new Error(data.message || 'API returned error status');
      }
    } catch (parseError) {
      console.error('Failed to parse GPT-4o Vision response:', parseError);
      throw new Error('Invalid analysis format received from GPT-4o Vision. Please try again.');
    }
  } catch (error: unknown) {
    console.error('❌ GPT-4o Vision API call failed:', error);
    notify.error(
      `Failed to analyze CV with GPT-4o Vision: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}



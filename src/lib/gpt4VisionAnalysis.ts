import { toast } from 'sonner';

/**
 * Determine API base URL based on environment
 * @returns Base URL for API calls
 */
function getApiBaseUrl(): string {
  // In production, use relative URLs for same domain
  // In development, with proxy config in vite.config.ts,
  // we can also use relative URLs
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
# ELITE ATS & RECRUITMENT ANALYSIS ENGINE

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON structure.

## YOUR EXPERTISE ROLE
You are a senior ATS specialist with 15+ years of experience, a certified HR recruiter, and a career strategist. You have analyzed 50,000+ resumes and understand exactly what makes candidates pass or fail ATS filters and recruiter screening.

## MISSION
Perform a surgical, evidence-based analysis comparing the resume images against this specific job posting. Your analysis will determine if this candidate gets an interview. Be brutally honest, precise, and actionable.

## JOB POSTING ANALYSIS
**Position:** ${jobDetails.jobTitle}
**Company:** ${jobDetails.company}
**Full Job Description:**
${jobDetails.jobDescription}

## STEP-BY-STEP ANALYSIS METHODOLOGY

### STEP 1: EXTRACT & CATEGORIZE REQUIREMENTS
From the job description, identify:
- **MUST-HAVE requirements** (deal-breakers if missing)
- **NICE-TO-HAVE requirements** (bonus points)
- **IMPLICIT requirements** (industry standards, soft skills, cultural fit)
- **TECHNICAL SKILLS** (specific tools, technologies, certifications)
- **EXPERIENCE LEVEL** (years, seniority, domain expertise)
- **EDUCATION REQUIREMENTS** (degree, certifications, training)

### STEP 2: RESUME DECONSTRUCTION
From the resume images, extract with precision:
- **All skills mentioned** (hard skills, soft skills, tools, technologies)
- **Work experience** (titles, companies, dates, responsibilities, achievements with metrics)
- **Education** (degrees, institutions, dates, honors, relevant coursework)
- **Certifications & Training** (names, dates, issuing organizations)
- **Quantifiable achievements** (numbers, percentages, dollar amounts, timeframes)
- **Keywords** (industry terms, technical jargon, role-specific terminology)
- **Formatting elements** (sections, headers, bullet points, fonts, layout)
- **ATS compatibility** (file structure, parsing-friendly format, keyword density)

### STEP 3: PRECISE MATCHING ANALYSIS

#### A. SKILLS MATCHING (Be Surgical)
For EACH required skill in the job description:
1. **Matching Skills**: If found in resume, calculate relevance (0-100):
   - 90-100: Exact match, prominently featured, with proof of use
   - 70-89: Strong match, mentioned with context
   - 50-69: Partial match, related skill or transferable
   - 30-49: Weak match, tangential connection
   - 0-29: No match found
   - Include WHERE in resume it appears (section, context)

2. **Missing Skills**: List ALL required skills NOT found:
   - Calculate impact score (0-100): How critical is this missing skill?
   - 90-100: Deal-breaker, explicitly required
   - 70-89: Highly important, frequently mentioned
   - 50-69: Important, mentioned multiple times
   - 30-49: Nice-to-have, mentioned once
   - Suggest alternatives if candidate has transferable skills

3. **Alternative Skills**: If candidate has similar/transferable skills:
   - Map alternative skill → required skill
   - Explain transferability
   - Suggest how to reframe in resume

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

### STEP 5: ATS OPTIMIZATION AUDIT
Evaluate technical ATS compatibility with precision:
- **Formatting**: Is resume ATS-friendly? (no tables, graphics, complex layouts, text boxes)
- **Section Headers**: Are section names standard? (Work Experience, Education, Skills, Summary)
- **File Structure**: Can ATS parse sections correctly? Are headers properly formatted?
- **Keyword Strategy**: Natural keyword integration vs. keyword stuffing (assess quality)
- **Contact Information**: Properly formatted and parseable by ATS?
- **Date Formats**: Consistent and parseable? (MM/YYYY or MM/DD/YYYY format)
- **Fonts & Styling**: ATS-readable fonts? No decorative elements that break parsing?
- **Section Completeness**: Are all standard sections present? (Contact, Summary, Experience, Education, Skills)
- **Section Quality**: Rate quality of each section (0-100) based on content, formatting, ATS compatibility

### STEP 6: READABILITY & PRESENTATION
Evaluate resume readability and professional presentation:
- **Readability Score**: How easy is the resume to scan and read? (0-100)
- **Visual Hierarchy**: Is information hierarchy clear? Are important sections easy to find?
- **Consistency**: Are formatting, fonts, spacing consistent throughout?
- **Professional Appearance**: Does resume look professional and polished?
- **Issues**: List specific readability issues (poor spacing, unclear sections, inconsistent formatting)
- **Recommendations**: Specific suggestions to improve readability

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

### STEP 9: EXECUTIVE ASSESSMENT
Provide a concise, strategic assessment:
- **Overall Match Score** (0-100): Be precise and justified based on ALL analysis above
  - 90-100: Exceptional candidate, exceeds requirements, strong interview probability
  - 80-89: Strong candidate, meets all requirements, good interview probability
  - 70-79: Good candidate, meets most requirements, moderate interview probability
  - 60-69: Qualified candidate, meets basic requirements, low-moderate interview probability
  - 50-59: Borderline candidate, some concerns, low interview probability
  - 40-49: Weak candidate, significant gaps, very low interview probability
  - 0-39: Poor candidate, major misalignment, unlikely to get interview

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
  }
}

## CRITICAL QUALITY STANDARDS

1. **PRECISION**: Every score must be justified with specific evidence from resume
2. **SPECIFICITY**: Use exact quotes, section names, and resume elements
3. **ACTIONABILITY**: Every recommendation must be implementable
4. **EVIDENCE-BASED**: No assumptions - only what you can see in resume images
5. **HONESTY**: Don't inflate scores. Be realistic to help candidate improve
6. **DIFFERENTIATION**: Use full score range (0-100) based on actual match quality
7. **CONTEXT**: Consider industry standards, role level, and company expectations
8. **STRATEGIC**: Think like a recruiter - what would make you call this candidate?

## FINAL CHECKLIST BEFORE RESPONDING

✓ Extracted ALL requirements from job description
✓ Analyzed ALL visible content in resume images
✓ Calculated precise scores with evidence
✓ Identified specific strengths and weaknesses
✓ Provided actionable, prioritized recommendations
✓ Returned ONLY valid JSON (no markdown, no code blocks)
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
    const apiUrl = `${baseApiUrl}/analyze-cv-vision`;
    
    // Build the prompt
    const prompt = buildATSAnalysisPrompt(jobDetails);
    
    // Build content array with text prompt and images
    const content: any[] = [
      {
        type: "text",
        text: prompt
      }
    ];
    
    // Add each image with optimized settings
    images.forEach((image, index) => {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${image}`,
          detail: "low" // Optimized for cost - sufficient for text reading
        }
      });
      console.log(`   ✓ Added image ${index + 1} (${(image.length / 1024).toFixed(1)} KB)`);
    });
    
    console.log('📡 Sending request to GPT-4o Vision API...');
    
    // Send request to API endpoint
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a senior ATS specialist with 15+ years of experience analyzing 50,000+ resumes, a certified HR recruiter, and a career strategist. You understand exactly what makes candidates pass or fail ATS filters and recruiter screening. Your analysis must be surgical, evidence-based, brutally honest, and hyper-precise. Every score, finding, and recommendation must be justified with specific evidence from the resume images. Think like a recruiter making a hiring decision. Return ONLY valid JSON - no markdown, no code blocks, no explanations outside the JSON structure."
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" }, // Force JSON response
        max_tokens: 6000, // Increased for more detailed analysis
        temperature: 0.1 // Lower temperature for more precise, consistent analysis
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
    toast.error(
      `Failed to analyze CV with GPT-4o Vision: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}



/**
 * Enhanced ATS analysis for optimized CV
 * Based on keywords matching, structure analysis, and quality metrics
 */

interface OptimizedCVScore {
  overall: number;
  skills: number;
  experience: number;
  keywords: number;
  structure: number;
  quality?: number; // Quality score based on content analysis
}

/**
 * Extract keywords from text (simplified version)
 */
function extractKeywords(text: string): string[] {
  // Remove markdown formatting
  const cleanText = text
    .replace(/#{1,6}\s+/g, '') // Headers
    .replace(/\*\*/g, '') // Bold
    .replace(/\*/g, '') // Italic
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
    .toLowerCase();

  // Extract words (3+ characters, alphanumeric)
  const words = cleanText.match(/\b[a-z0-9]{3,}\b/gi) || [];
  
  // Filter out common stop words
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
  ]);

  return words
    .filter(word => !stopWords.has(word.toLowerCase()))
    .filter((word, index, self) => self.indexOf(word) === index) // Remove duplicates
    .slice(0, 100); // Limit to top 100
}

/**
 * Extract critical keywords from job description
 */
function extractJobKeywords(jobDescription: string): {
  critical: string[];
  important: string[];
  all: string[];
} {
  // Extract keywords
  const allKeywords = extractKeywords(jobDescription);
  
  // Identify critical keywords (mentioned in requirements sections or multiple times)
  const requirementPatterns = [
    /required[:\s]+([^.\n]+)/gi,
    /must have[:\s]+([^.\n]+)/gi,
    /essential[:\s]+([^.\n]+)/gi,
    /qualifications[:\s]+([^.\n]+)/gi,
  ];
  
  const criticalKeywords = new Set<string>();
  requirementPatterns.forEach(pattern => {
    const matches = [...jobDescription.matchAll(pattern)];
    matches.forEach(match => {
      if (match[1]) {
        const section = match[1].toLowerCase();
        const words = section.match(/\b[a-z0-9]{3,}\b/gi) || [];
        words.forEach(word => {
          if (word.length >= 3) criticalKeywords.add(word);
        });
      }
    });
  });
  
  // Count keyword frequency
  const keywordFrequency: Record<string, number> = {};
  allKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    keywordFrequency[keyword] = (jobDescription.match(regex) || []).length;
  });
  
  // Important keywords (mentioned 2+ times)
  const importantKeywords = allKeywords.filter(
    kw => keywordFrequency[kw] >= 2 && !criticalKeywords.has(kw)
  );
  
  return {
    critical: Array.from(criticalKeywords),
    important: importantKeywords,
    all: allKeywords
  };
}

/**
 * Check if keyword or its variations exist in text
 */
function hasKeywordOrVariation(text: string, keyword: string): boolean {
  const textLower = text.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  
  // Direct match
  if (textLower.includes(keywordLower)) return true;
  
  // Common variations and synonyms
  const variations: Record<string, string[]> = {
    'javascript': ['js', 'node', 'nodejs', 'react', 'vue', 'angular'],
    'python': ['py', 'django', 'flask', 'pandas'],
    'management': ['manage', 'managing', 'managed', 'manager', 'leadership', 'lead', 'led'],
    'development': ['develop', 'developer', 'developing', 'developed', 'dev'],
    'cloud': ['aws', 'azure', 'gcp', 'google cloud', 'amazon web services'],
    'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'db'],
    'agile': ['scrum', 'kanban', 'sprint'],
    'communication': ['communicate', 'communicating', 'collaboration', 'collaborate'],
  };
  
  // Check if keyword has known variations
  if (variations[keywordLower]) {
    return variations[keywordLower].some(variant => textLower.includes(variant));
  }
  
  // Check plural/singular forms
  if (keywordLower.endsWith('s') && textLower.includes(keywordLower.slice(0, -1))) return true;
  if (textLower.includes(keywordLower + 's')) return true;
  
  // Check common suffixes (ing, ed, er)
  const root = keywordLower.replace(/(ing|ed|er)$/, '');
  if (root.length > 3 && textLower.includes(root)) return true;
  
  return false;
}

/**
 * Calculate keyword match score with enhanced matching
 */
function calculateKeywordScore(
  cvText: string,
  jobKeywords: { critical: string[]; important: string[]; all: string[] }
): number {
  const cvLower = cvText.toLowerCase();
  let score = 0;
  let maxScore = 0;
  
  // Critical keywords (40% of score)
  maxScore += jobKeywords.critical.length * 40;
  jobKeywords.critical.forEach(keyword => {
    if (hasKeywordOrVariation(cvText, keyword)) {
      score += 40;
    }
  });
  
  // Important keywords (30% of score)
  maxScore += jobKeywords.important.length * 30;
  jobKeywords.important.forEach(keyword => {
    if (hasKeywordOrVariation(cvText, keyword)) {
      score += 30;
    }
  });
  
  // Other keywords (30% of score, but weighted less)
  const otherKeywords = jobKeywords.all.filter(
    kw => !jobKeywords.critical.includes(kw) && !jobKeywords.important.includes(kw)
  ).slice(0, 20); // Limit to top 20
  
  maxScore += otherKeywords.length * 1.5;
  otherKeywords.forEach(keyword => {
    if (hasKeywordOrVariation(cvText, keyword)) {
      score += 1.5;
    }
  });
  
  // Normalize to 0-100
  if (maxScore === 0) return 50; // Default if no keywords
  return Math.min(100, Math.round((score / maxScore) * 100));
}

/**
 * Calculate structure score
 */
function calculateStructureScore(cvText: string): number {
  let score = 0;
  
  // Check for common CV sections
  const sections = [
    { name: 'summary', patterns: [/summary|profile|objective|about/i] },
    { name: 'experience', patterns: [/experience|employment|work history|professional experience/i] },
    { name: 'education', patterns: [/education|academic|qualifications|degree/i] },
    { name: 'skills', patterns: [/skills|competencies|technical skills|core competencies/i] },
  ];
  
  sections.forEach(section => {
    const found = section.patterns.some(pattern => pattern.test(cvText));
    if (found) score += 25;
  });
  
  // Check for bullet points (indicates structured content)
  const bulletCount = (cvText.match(/^[\s]*[-•*]\s/gm) || []).length;
  if (bulletCount >= 5) score += 10;
  if (bulletCount >= 10) score += 10;
  
  return Math.min(100, score);
}

/**
 * Calculate skills score based on keyword matching
 */
function calculateSkillsScore(
  cvText: string,
  jobKeywords: { critical: string[]; important: string[]; all: string[] }
): number {
  // Focus on technical/professional keywords
  const technicalKeywords = [
    ...jobKeywords.critical,
    ...jobKeywords.important,
    ...jobKeywords.all.filter(kw => kw.length >= 4) // Longer words are more likely to be skills
  ].slice(0, 30);
  
  const cvLower = cvText.toLowerCase();
  const matched = technicalKeywords.filter(kw => cvLower.includes(kw.toLowerCase())).length;
  
  if (technicalKeywords.length === 0) return 50;
  return Math.round((matched / technicalKeywords.length) * 100);
}

/**
 * Calculate experience score
 */
function calculateExperienceScore(
  cvText: string,
  jobDescription: string
): number {
  let score = 50; // Base score
  
  // Check for years of experience mentioned in job
  const yearsPattern = /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi;
  const jobYearsMatches = [...jobDescription.matchAll(yearsPattern)];
  
  if (jobYearsMatches.length > 0) {
    // Check if CV mentions similar experience
    const hasExperience = /experience|worked|years|professional/i.test(cvText);
    if (hasExperience) score += 30;
    
    // Check for quantified achievements (indicates real experience)
    const quantifiedPattern = /(?:increased|improved|reduced|managed|led|achieved).*?(?:\d+|%)/gi;
    const quantifiedMatches = [...cvText.matchAll(quantifiedPattern)];
    if (quantifiedMatches.length >= 2) score += 20;
  } else {
    // No specific years requirement, check for general experience indicators
    const experienceIndicators = [
      /experience/i,
      /worked|working/i,
      /responsible|managed|led/i,
      /achieved|delivered|improved/i
    ];
    
    const foundIndicators = experienceIndicators.filter(pattern => pattern.test(cvText)).length;
    score += foundIndicators * 12.5;
  }
  
  return Math.min(100, score);
}

/**
 * Calculate quality score based on content analysis
 */
function calculateQualityScore(cvText: string): number {
  let score = 0;
  const maxScore = 100;
  
  // Action verbs (30 points)
  const actionVerbs = [
    'achieved', 'delivered', 'improved', 'increased', 'reduced', 'managed', 'led', 
    'created', 'developed', 'built', 'implemented', 'optimized', 'designed', 'launched',
    'established', 'initiated', 'executed', 'coordinated', 'streamlined', 'enhanced'
  ];
  const actionVerbCount = actionVerbs.filter(verb => 
    new RegExp(`\\b${verb}\\b`, 'i').test(cvText)
  ).length;
  score += Math.min(30, actionVerbCount * 2);
  
  // Quantified achievements (35 points)
  const quantifiedPatterns = [
    /\d+%/g, // Percentages
    /\$\d+[kmb]?/gi, // Money amounts
    /\d+\+?\s*(?:users|customers|clients|projects|teams|people)/gi, // Numbers with context
    /increased.*?\d+/gi,
    /reduced.*?\d+/gi,
    /improved.*?\d+/gi,
  ];
  let quantifiedCount = 0;
  quantifiedPatterns.forEach(pattern => {
    quantifiedCount += (cvText.match(pattern) || []).length;
  });
  score += Math.min(35, quantifiedCount * 5);
  
  // Professional terminology (20 points)
  const professionalTerms = [
    'strategic', 'analytics', 'optimization', 'implementation', 'framework',
    'methodology', 'architecture', 'scalable', 'efficient', 'collaborative',
    'cross-functional', 'stakeholder', 'initiative', 'roadmap', 'kpi'
  ];
  const termCount = professionalTerms.filter(term => 
    new RegExp(`\\b${term}\\b`, 'i').test(cvText)
  ).length;
  score += Math.min(20, termCount * 2);
  
  // Content structure quality (15 points)
  const bulletPoints = (cvText.match(/^[\s]*[-•*]\s/gm) || []).length;
  score += Math.min(10, bulletPoints * 0.5);
  
  // Check for impact statements (vs just responsibilities)
  const impactStatements = (cvText.match(/(?:resulted in|leading to|which|that)\s+(?:improved|increased|reduced|enhanced)/gi) || []).length;
  score += Math.min(5, impactStatements * 2);
  
  return Math.min(maxScore, Math.round(score));
}

/**
 * Ensure minimum improvement for optimized CVs
 */
function ensureMinimumImprovement(
  originalScore: number,
  optimizedScore: number,
  isOptimizedCV: boolean = true
): number {
  if (!isOptimizedCV) return optimizedScore;
  
  const MIN_IMPROVEMENT = 3;
  const OPTIMIZATION_BOOST = 5; // Base boost for being optimized
  
  let finalScore = optimizedScore;
  
  // Apply optimization boost
  finalScore = Math.min(100, optimizedScore + OPTIMIZATION_BOOST);
  
  // Ensure minimum improvement
  if (finalScore < originalScore + MIN_IMPROVEMENT) {
    finalScore = Math.min(100, originalScore + MIN_IMPROVEMENT);
  }
  
  return Math.round(finalScore);
}

/**
 * Analyze optimized CV and return scores with guaranteed improvement
 */
export function analyzeOptimizedCV(
  optimizedCVText: string,
  jobDescription: string,
  originalScore?: { overall: number; skills: number; experience: number }
): OptimizedCVScore {
  // Extract job keywords
  const jobKeywords = extractJobKeywords(jobDescription);
  
  // Calculate individual scores
  const keywordsScore = calculateKeywordScore(optimizedCVText, jobKeywords);
  const structureScore = calculateStructureScore(optimizedCVText);
  const skillsScore = calculateSkillsScore(optimizedCVText, jobKeywords);
  const experienceScore = calculateExperienceScore(optimizedCVText, jobDescription);
  const qualityScore = calculateQualityScore(optimizedCVText);
  
  // Calculate base overall score (weighted average with quality boost)
  const baseOverall = Math.round(
    keywordsScore * 0.30 +
    skillsScore * 0.25 +
    experienceScore * 0.25 +
    structureScore * 0.10 +
    qualityScore * 0.10
  );
  
  // Apply quality boost to subscores
  const qualityMultiplier = 1 + (qualityScore / 500); // 0-20% boost based on quality
  const boostedSkills = Math.min(100, Math.round(skillsScore * qualityMultiplier));
  const boostedExperience = Math.min(100, Math.round(experienceScore * qualityMultiplier));
  
  // Ensure minimum improvement if original scores provided
  let finalOverall = baseOverall;
  let finalSkills = boostedSkills;
  let finalExperience = boostedExperience;
  
  if (originalScore) {
    finalOverall = ensureMinimumImprovement(originalScore.overall, baseOverall, true);
    finalSkills = ensureMinimumImprovement(originalScore.skills, boostedSkills, true);
    finalExperience = ensureMinimumImprovement(originalScore.experience, boostedExperience, true);
  }
  
  return {
    overall: Math.min(100, Math.max(0, finalOverall)),
    skills: Math.min(100, Math.max(0, finalSkills)),
    experience: Math.min(100, Math.max(0, finalExperience)),
    keywords: Math.min(100, Math.max(0, keywordsScore)),
    structure: Math.min(100, Math.max(0, structureScore)),
    quality: Math.min(100, Math.max(0, qualityScore))
  };
}


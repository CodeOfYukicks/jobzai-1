/**
 * Simplified ATS analysis for optimized CV
 * Based on keywords matching and structure analysis
 */

interface OptimizedCVScore {
  overall: number;
  skills: number;
  experience: number;
  keywords: number;
  structure: number;
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
 * Calculate keyword match score
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
    if (cvLower.includes(keyword.toLowerCase())) {
      score += 40;
    }
  });
  
  // Important keywords (30% of score)
  maxScore += jobKeywords.important.length * 30;
  jobKeywords.important.forEach(keyword => {
    if (cvLower.includes(keyword.toLowerCase())) {
      score += 30;
    }
  });
  
  // Other keywords (30% of score, but weighted less)
  const otherKeywords = jobKeywords.all.filter(
    kw => !jobKeywords.critical.includes(kw) && !jobKeywords.important.includes(kw)
  ).slice(0, 20); // Limit to top 20
  
  maxScore += otherKeywords.length * 1.5;
  otherKeywords.forEach(keyword => {
    if (cvLower.includes(keyword.toLowerCase())) {
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
 * Analyze optimized CV and return scores
 */
export function analyzeOptimizedCV(
  optimizedCVText: string,
  jobDescription: string
): OptimizedCVScore {
  // Extract job keywords
  const jobKeywords = extractJobKeywords(jobDescription);
  
  // Calculate individual scores
  const keywordsScore = calculateKeywordScore(optimizedCVText, jobKeywords);
  const structureScore = calculateStructureScore(optimizedCVText);
  const skillsScore = calculateSkillsScore(optimizedCVText, jobKeywords);
  const experienceScore = calculateExperienceScore(optimizedCVText, jobDescription);
  
  // Calculate overall score (weighted average)
  const overall = Math.round(
    keywordsScore * 0.35 +
    skillsScore * 0.30 +
    experienceScore * 0.25 +
    structureScore * 0.10
  );
  
  return {
    overall: Math.min(100, Math.max(0, overall)),
    skills: Math.min(100, Math.max(0, skillsScore)),
    experience: Math.min(100, Math.max(0, experienceScore)),
    keywords: Math.min(100, Math.max(0, keywordsScore)),
    structure: Math.min(100, Math.max(0, structureScore))
  };
}


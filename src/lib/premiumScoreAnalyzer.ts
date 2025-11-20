/**
 * Premium Score Analysis System
 * Provides detailed analysis of CV optimization with quality metrics and insights
 */

import { analyzeOptimizedCV } from './optimizedCVAnalyzer';

export interface ScoreChange {
  original: number;
  optimized: number;
  change: number;
  changePercent: number;
}

export interface CategoryAnalysis extends ScoreChange {
  reasons: string[];
  improvements: string[];
}

export interface PremiumScoreAnalysis {
  comparison: {
    overall: CategoryAnalysis;
    skills: CategoryAnalysis;
    experience: CategoryAnalysis;
  };
  qualityMetrics: {
    atsScore: number; // Raw ATS score based on keywords
    realQualityScore: number; // Score based on content quality
    targetingScore: number; // How targeted the CV is for the job
    overallQuality: 'excellent' | 'good' | 'fair' | 'needs-improvement';
  };
  improvements: {
    category: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    icon: string;
  }[];
  confidenceLevel: number; // 0-100
  recommendations: string[];
  insights: {
    strongPoints: string[];
    optimizationAreas: string[];
  };
}

/**
 * Analyze what improved in the skills section
 */
function analyzeSkillsImprovements(
  originalCV: string,
  optimizedCV: string,
  jobDescription: string
): { reasons: string[]; improvements: string[] } {
  const reasons: string[] = [];
  const improvements: string[] = [];
  
  const originalLower = originalCV.toLowerCase();
  const optimizedLower = optimizedCV.toLowerCase();
  const jobLower = jobDescription.toLowerCase();
  
  // Extract key technical terms from job
  const technicalTerms = [
    'python', 'javascript', 'java', 'react', 'node', 'aws', 'cloud', 'sql',
    'agile', 'scrum', 'leadership', 'management', 'analytics', 'data'
  ];
  
  const newSkills = technicalTerms.filter(
    term => !originalLower.includes(term) && optimizedLower.includes(term) && jobLower.includes(term)
  );
  
  if (newSkills.length > 0) {
    reasons.push(`Added ${newSkills.length} relevant skills from job requirements`);
    improvements.push(`Incorporated key skills: ${newSkills.slice(0, 3).join(', ')}${newSkills.length > 3 ? '...' : ''}`);
  }
  
  // Check for better keyword density
  const originalKeywordCount = technicalTerms.filter(t => originalLower.includes(t)).length;
  const optimizedKeywordCount = technicalTerms.filter(t => optimizedLower.includes(t)).length;
  
  if (optimizedKeywordCount > originalKeywordCount) {
    reasons.push('Improved keyword coverage and relevance');
    improvements.push(`Enhanced technical skills alignment with job requirements`);
  }
  
  // Check for skills section improvements
  if (/skills?:/i.test(optimizedCV) && !/skills?:/i.test(originalCV)) {
    reasons.push('Added dedicated skills section');
    improvements.push('Created clear, ATS-friendly skills section');
  }
  
  return { reasons, improvements };
}

/**
 * Analyze what improved in the experience section
 */
function analyzeExperienceImprovements(
  originalCV: string,
  optimizedCV: string,
  jobDescription: string
): { reasons: string[]; improvements: string[] } {
  const reasons: string[] = [];
  const improvements: string[] = [];
  
  // Check for action verbs
  const actionVerbs = [
    'achieved', 'delivered', 'improved', 'increased', 'reduced', 'managed', 'led',
    'developed', 'implemented', 'launched', 'optimized', 'established'
  ];
  
  const originalActionVerbs = actionVerbs.filter(v => 
    new RegExp(`\\b${v}\\b`, 'i').test(originalCV)
  ).length;
  const optimizedActionVerbs = actionVerbs.filter(v => 
    new RegExp(`\\b${v}\\b`, 'i').test(optimizedCV)
  ).length;
  
  if (optimizedActionVerbs > originalActionVerbs) {
    reasons.push(`Added ${optimizedActionVerbs - originalActionVerbs} more action verbs`);
    improvements.push('Strengthened impact statements with action-oriented language');
  }
  
  // Check for quantified achievements
  const originalQuantified = (originalCV.match(/\d+%|\$\d+|\d+\s*(?:users|projects|teams)/gi) || []).length;
  const optimizedQuantified = (optimizedCV.match(/\d+%|\$\d+|\d+\s*(?:users|projects|teams)/gi) || []).length;
  
  if (optimizedQuantified > originalQuantified) {
    reasons.push(`Added ${optimizedQuantified - originalQuantified} quantified achievements`);
    improvements.push('Enhanced credibility with measurable accomplishments');
  }
  
  // Check for job-relevant experience
  const jobKeywords = extractTopKeywords(jobDescription);
  const originalMatches = jobKeywords.filter(k => originalCV.toLowerCase().includes(k)).length;
  const optimizedMatches = jobKeywords.filter(k => optimizedCV.toLowerCase().includes(k)).length;
  
  if (optimizedMatches > originalMatches) {
    reasons.push('Better alignment with job requirements');
    improvements.push('Highlighted most relevant experiences for this role');
  }
  
  return { reasons, improvements };
}

/**
 * Extract top keywords from job description
 */
function extractTopKeywords(jobDescription: string): string[] {
  const text = jobDescription.toLowerCase();
  const commonWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'will', 'you', 'are', 'have']);
  
  const words = text.match(/\b[a-z]{4,}\b/g) || [];
  const frequency: Record<string, number> = {};
  
  words.forEach(word => {
    if (!commonWords.has(word)) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

/**
 * Generate improvement items for display
 */
function generateImprovements(
  skillsAnalysis: { reasons: string[]; improvements: string[] },
  experienceAnalysis: { reasons: string[]; improvements: string[] },
  overallChange: number
): Array<{ category: string; description: string; impact: 'high' | 'medium' | 'low'; icon: string }> {
  const improvements: Array<{ category: string; description: string; impact: 'high' | 'medium' | 'low'; icon: string }> = [];
  
  // Skills improvements
  skillsAnalysis.improvements.forEach(imp => {
    improvements.push({
      category: 'Skills',
      description: imp,
      impact: 'high',
      icon: '🎯'
    });
  });
  
  // Experience improvements
  experienceAnalysis.improvements.forEach(imp => {
    improvements.push({
      category: 'Experience',
      description: imp,
      impact: 'high',
      icon: '💼'
    });
  });
  
  // Overall optimization
  if (overallChange >= 10) {
    improvements.push({
      category: 'Overall',
      description: 'Significant improvement in ATS compatibility',
      impact: 'high',
      icon: '🚀'
    });
  } else if (overallChange >= 5) {
    improvements.push({
      category: 'Overall',
      description: 'Strong optimization for target position',
      impact: 'medium',
      icon: '✨'
    });
  }
  
  return improvements;
}

/**
 * Check if keyword or variation exists (similar to optimizedCVAnalyzer)
 */
function hasKeywordMatch(text: string, keyword: string): boolean {
  const textLower = text.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  
  // Direct match
  if (textLower.includes(keywordLower)) return true;
  
  // Check plural/singular
  if (keywordLower.endsWith('s') && textLower.includes(keywordLower.slice(0, -1))) return true;
  if (textLower.includes(keywordLower + 's')) return true;
  
  // Check common suffixes
  const root = keywordLower.replace(/(ing|ed|er|ion|tion)$/, '');
  if (root.length > 3 && textLower.includes(root)) return true;
  
  return false;
}

/**
 * Calculate targeting score (how well the CV targets the specific job)
 */
function calculateTargetingScore(
  cvText: string,
  jobDescription: string
): number {
  const jobKeywords = extractTopKeywords(jobDescription);
  const cvLower = cvText.toLowerCase();
  
  // Use more flexible matching
  const matchedKeywords = jobKeywords.filter(kw => hasKeywordMatch(cvText, kw)).length;
  const baseScore = (matchedKeywords / jobKeywords.length) * 100;
  
  // Bonus for job-specific terms in CV
  const jobSpecificTerms = [
    'experience', 'expertise', 'proficient', 'skilled', 'specialized',
    'years', 'proven', 'demonstrated', 'successful', 'track record'
  ];
  const specificTermsCount = jobSpecificTerms.filter(term => cvLower.includes(term)).length;
  const bonus = Math.min(15, specificTermsCount * 3);
  
  return Math.min(100, Math.round(baseScore + bonus));
}

/**
 * Generate recommendations for further improvements
 */
function generateRecommendations(
  optimizedScore: { overall: number; skills: number; experience: number; quality?: number },
  qualityScore: number
): string[] {
  const recommendations: string[] = [];
  
  if (optimizedScore.overall < 75) {
    recommendations.push('Consider adding more job-specific keywords naturally throughout the CV');
  }
  
  if (optimizedScore.skills < 80) {
    recommendations.push('Expand the skills section with more relevant technical competencies');
  }
  
  if (qualityScore < 70) {
    recommendations.push('Add more quantified achievements to demonstrate impact');
    recommendations.push('Use stronger action verbs to begin bullet points');
  }
  
  if (optimizedScore.experience < 80) {
    recommendations.push('Highlight experiences that directly relate to the job requirements');
  }
  
  // If score is already high, give positive reinforcement
  if (optimizedScore.overall >= 80 && recommendations.length === 0) {
    recommendations.push('Your CV is well-optimized! Consider tailoring the summary section for extra impact.');
  }
  
  return recommendations;
}

/**
 * Calculate confidence level in the score improvement
 */
function calculateConfidence(
  overallChange: number,
  skillsChange: number,
  experienceChange: number,
  qualityScore: number
): number {
  let confidence = 70; // Base confidence
  
  // Higher change = higher confidence
  if (overallChange >= 10) confidence += 15;
  else if (overallChange >= 5) confidence += 10;
  else if (overallChange >= 3) confidence += 5;
  
  // Consistent improvements across categories
  if (skillsChange > 0 && experienceChange > 0) confidence += 10;
  
  // Quality score indicates real improvement
  if (qualityScore >= 80) confidence += 5;
  else if (qualityScore >= 70) confidence += 3;
  
  return Math.min(100, confidence);
}

/**
 * Main function to analyze premium score comparison
 */
export function analyzePremiumScore(
  originalCV: string,
  optimizedCV: string,
  jobDescription: string,
  originalScore: { overall: number; skills: number; experience: number },
  optimizedScore: { overall: number; skills: number; experience: number; keywords?: number; structure?: number; quality?: number }
): PremiumScoreAnalysis {
  // Calculate changes
  const overallChange = optimizedScore.overall - originalScore.overall;
  const skillsChange = optimizedScore.skills - originalScore.skills;
  const experienceChange = optimizedScore.experience - originalScore.experience;
  
  const overallChangePercent = originalScore.overall > 0 
    ? Math.round((overallChange / originalScore.overall) * 100) 
    : 0;
  const skillsChangePercent = originalScore.skills > 0 
    ? Math.round((skillsChange / originalScore.skills) * 100) 
    : 0;
  const experienceChangePercent = originalScore.experience > 0 
    ? Math.round((experienceChange / originalScore.experience) * 100) 
    : 0;
  
  // Analyze improvements
  const skillsAnalysis = analyzeSkillsImprovements(originalCV, optimizedCV, jobDescription);
  const experienceAnalysis = analyzeExperienceImprovements(originalCV, optimizedCV, jobDescription);
  
  // Calculate quality metrics
  // ATS Score should be the overall optimized score (not just keywords)
  const atsScore = optimizedScore.overall;
  const realQualityScore = optimizedScore.quality || 75;
  const targetingScore = calculateTargetingScore(optimizedCV, jobDescription);
  
  const overallQuality: 'excellent' | 'good' | 'fair' | 'needs-improvement' = 
    optimizedScore.overall >= 85 ? 'excellent' :
    optimizedScore.overall >= 75 ? 'good' :
    optimizedScore.overall >= 65 ? 'fair' : 'needs-improvement';
  
  // Generate improvements list
  const improvements = generateImprovements(skillsAnalysis, experienceAnalysis, overallChange);
  
  // Calculate confidence
  const confidenceLevel = calculateConfidence(overallChange, skillsChange, experienceChange, realQualityScore);
  
  // Generate recommendations
  const recommendations = generateRecommendations(optimizedScore, realQualityScore);
  
  // Generate insights
  const strongPoints: string[] = [];
  const optimizationAreas: string[] = [];
  
  if (optimizedScore.overall >= 80) {
    strongPoints.push('Excellent overall match with job requirements');
  }
  if (optimizedScore.skills >= 80) {
    strongPoints.push('Strong technical skills alignment');
  }
  if (realQualityScore >= 80) {
    strongPoints.push('High-quality content with measurable achievements');
  }
  if (targetingScore >= 80) {
    strongPoints.push('Well-targeted for this specific position');
  }
  
  if (optimizedScore.skills < 75) {
    optimizationAreas.push('Skills section could be expanded');
  }
  if (optimizedScore.experience < 75) {
    optimizationAreas.push('Experience section needs more relevant details');
  }
  if (realQualityScore < 70) {
    optimizationAreas.push('Add more quantified achievements');
  }
  
  return {
    comparison: {
      overall: {
        original: originalScore.overall,
        optimized: optimizedScore.overall,
        change: overallChange,
        changePercent: overallChangePercent,
        reasons: [
          ...skillsAnalysis.reasons,
          ...experienceAnalysis.reasons
        ],
        improvements: [
          ...skillsAnalysis.improvements,
          ...experienceAnalysis.improvements
        ]
      },
      skills: {
        original: originalScore.skills,
        optimized: optimizedScore.skills,
        change: skillsChange,
        changePercent: skillsChangePercent,
        reasons: skillsAnalysis.reasons,
        improvements: skillsAnalysis.improvements
      },
      experience: {
        original: originalScore.experience,
        optimized: optimizedScore.experience,
        change: experienceChange,
        changePercent: experienceChangePercent,
        reasons: experienceAnalysis.reasons,
        improvements: experienceAnalysis.improvements
      }
    },
    qualityMetrics: {
      atsScore,
      realQualityScore,
      targetingScore,
      overallQuality
    },
    improvements,
    confidenceLevel,
    recommendations,
    insights: {
      strongPoints,
      optimizationAreas
    }
  };
}


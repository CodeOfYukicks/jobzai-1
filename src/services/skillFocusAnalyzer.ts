export interface SkillFocusRecommendation {
  skill: string;
  priorityScore: number;
  reasoning: string[];
  gap: number;
  rating: number;
  daysUntilInterview: number;
  jobDescriptionMentions: number;
}

export interface FocusAnalysisInput {
  skillGaps: Array<{ skill: string; rating: number; gap: number }>;
  interviewDate?: string;
  interviewTime?: string;
  jobDescription?: string;
  requiredSkills?: string[];
}

/**
 * Analyzes skills and recommends which one to focus on
 * Considers: gap size (40%), time urgency (30%), job relevance (30%)
 */
export function analyzeSkillFocus(input: FocusAnalysisInput): SkillFocusRecommendation | null {
  const { skillGaps, interviewDate, interviewTime, jobDescription, requiredSkills } = input;

  if (!skillGaps || skillGaps.length === 0) {
    return null;
  }

  // Calculate days until interview
  let daysUntilInterview = 999; // Default to far future if no date
  if (interviewDate) {
    try {
      const interviewDateTime = new Date(`${interviewDate}T${interviewTime || '09:00'}`);
      const now = new Date();
      const diffMs = interviewDateTime.getTime() - now.getTime();
      daysUntilInterview = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      // If interview is in the past, set to 0
      if (daysUntilInterview < 0) {
        daysUntilInterview = 0;
      }
    } catch (error) {
      console.error('Error calculating days until interview:', error);
    }
  }

  // Normalize job description to lowercase for matching
  const jobDescLower = (jobDescription || '').toLowerCase();

  // Score each skill
  const scoredSkills = skillGaps.map(({ skill, rating, gap }) => {
    const reasoning: string[] = [];
    
    // 1. Gap Score (40% weight) - Larger gaps = higher priority
    const gapScore = Math.min(gap / 5, 1) * 0.4; // Normalize to 0-1, then apply 40% weight
    reasoning.push(`Gap of ${gap} points (${gapScore.toFixed(2)} priority)`);

    // 2. Time Urgency Score (30% weight) - Less time = higher priority
    let timeScore = 0;
    if (daysUntilInterview <= 7) {
      timeScore = 1.0; // Critical urgency
      reasoning.push(`Interview in ${daysUntilInterview} day${daysUntilInterview !== 1 ? 's' : ''} - urgent`);
    } else if (daysUntilInterview <= 14) {
      timeScore = 0.7; // High urgency
      reasoning.push(`Interview in ${daysUntilInterview} days - high priority`);
    } else if (daysUntilInterview <= 30) {
      timeScore = 0.4; // Medium urgency
      reasoning.push(`Interview in ${daysUntilInterview} days`);
    } else {
      timeScore = 0.1; // Low urgency
      reasoning.push(`Interview in ${daysUntilInterview} days - plenty of time`);
    }
    timeScore *= 0.3; // Apply 30% weight

    // 3. Job Description Relevance (30% weight) - More mentions = higher priority
    const skillLower = skill.toLowerCase();
    const mentions = (jobDescLower.match(new RegExp(skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    const relevanceScore = Math.min(mentions / 5, 1) * 0.3; // Cap at 5 mentions, apply 30% weight
    if (mentions > 0) {
      reasoning.push(`Mentioned ${mentions} time${mentions !== 1 ? 's' : ''} in job description`);
    } else {
      reasoning.push('Not explicitly mentioned in job description');
    }

    // Calculate total priority score
    const priorityScore = gapScore + timeScore + relevanceScore;

    return {
      skill,
      priorityScore,
      reasoning,
      gap,
      rating,
      daysUntilInterview,
      jobDescriptionMentions: mentions,
    };
  });

  // Sort by priority score (highest first)
  scoredSkills.sort((a, b) => b.priorityScore - a.priorityScore);

  // Return the top recommendation
  const recommendation = scoredSkills[0];

  // Add summary reasoning
  if (recommendation.priorityScore > 0.6) {
    recommendation.reasoning.unshift('High priority - focus here first');
  } else if (recommendation.priorityScore > 0.3) {
    recommendation.reasoning.unshift('Medium priority - good to focus on');
  } else {
    recommendation.reasoning.unshift('Consider focusing on this skill');
  }

  return recommendation;
}











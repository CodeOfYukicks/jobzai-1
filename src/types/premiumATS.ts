/**
 * Premium ATS Analysis Types
 * TypeScript definitions for the premium analysis structure
 */

export interface PremiumATSAnalysis {
  // Metadata
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobUrl?: string;
  date: string;
  status?: 'processing' | 'completed' | 'failed';
  type: 'premium';
  
  // For backward compatibility and queries
  matchScore: number; // Same as match_scores.overall_score
  categoryScores: {
    skills: number;
    experience: number;
    education: number;
    industryFit: number;
  };
  
  // Premium analysis data
  executive_summary: string;
  job_summary: JobSummary;
  match_scores: MatchScores;
  match_breakdown: MatchBreakdown;
  top_strengths: Strength[];
  top_gaps: Gap[];
  cv_fixes: CVFixes;
  action_plan_48h: ActionPlan48H;
  learning_path: LearningPath;
  opportunity_fit: OpportunityFit;
}

export interface JobSummary {
  role: string;
  mission: string;
  key_responsibilities: string[];
  core_requirements: string[];
  hidden_expectations: string[];
}

export interface MatchScores {
  overall_score: number; // 0-100
  category: 'Weak' | 'Medium' | 'Strong' | 'Excellent';
  skills_score: number; // 0-100
  experience_score: number; // 0-100
  education_score: number; // 0-100
  industry_fit_score: number; // 0-100
  ats_keywords_score: number; // 0-100
}

export interface MatchBreakdown {
  skills: CategoryBreakdown;
  experience: CategoryBreakdown;
  education: CategoryBreakdown;
  industry: CategoryBreakdown;
  keywords: KeywordsBreakdown;
}

export interface CategoryBreakdown {
  matched: string[];
  missing: string[];
  explanations?: string;
}

export interface KeywordsBreakdown {
  found: string[];
  missing: string[];
  priority_missing: string[];
}

export interface Strength {
  name: string;
  score: number; // 0-100
  example_from_resume: string;
  why_it_matters: string;
}

export interface Gap {
  name: string;
  severity: 'Low' | 'Medium' | 'High';
  why_it_matters: string;
  how_to_fix: string;
}

export interface CVFixes {
  high_impact_bullets_to_add: string[];
  bullets_to_rewrite: string[];
  keywords_to_insert: string[];
  sections_to_reorder: string[];
  estimated_score_gain: number;
}

export interface ActionPlan48H {
  cv_edits: string[];
  portfolio_items: string[];
  linkedin_updates: string[];
  message_to_recruiter: string;
  job_specific_positioning: string;
}

export interface LearningPath {
  one_sentence_plan: string;
  resources: LearningResource[];
}

export interface LearningResource {
  name: string;
  type: 'video' | 'course' | 'article' | 'documentation';
  link: string;
  why_useful: string;
}

export interface OpportunityFit {
  why_you_will_succeed: string[];
  risks: string[];
  mitigation: string[];
}

// Helper type for navigation
export interface NavSection {
  id: string;
  label: string;
  count?: number;
}


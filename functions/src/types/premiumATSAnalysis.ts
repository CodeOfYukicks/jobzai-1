/**
 * Premium ATS Analysis Types
 * Comprehensive type definitions for elite-level ATS analysis
 */

export interface PremiumATSAnalysis {
  analysis: Analysis;
  product_updates: ProductUpdates;
}

export interface Analysis {
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
  skills: SkillsBreakdown;
  experience: ExperienceBreakdown;
  education: EducationBreakdown;
  industry: IndustryBreakdown;
  keywords: KeywordsBreakdown;
}

export interface SkillsBreakdown {
  matched: string[];
  missing: string[];
  explanations: string;
}

export interface ExperienceBreakdown {
  matched: string[];
  missing: string[];
}

export interface EducationBreakdown {
  matched: string[];
  missing: string[];
}

export interface IndustryBreakdown {
  matched: string[];
  missing: string[];
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

export interface ProductUpdates {
  new_analysis_flow: NewAnalysisFlow;
  ats_analysis_page_design: ATSAnalysisPageDesign;
}

export interface NewAnalysisFlow {
  goal: string;
  steps: string[];
  microcopy: NewAnalysisFlowMicrocopy;
  premium_experience: string[];
}

export interface NewAnalysisFlowMicrocopy {
  cta_button: string;
  upload_instructions: string;
  placeholder_text: string;
  loading_status_1?: string;
  loading_status_2?: string;
  loading_status_3?: string;
  loading_status_4?: string;
  loading_status_5?: string;
  success_message?: string;
  error_message_generic?: string;
  error_message_file_type?: string;
  error_message_file_size?: string;
}

export interface ATSAnalysisPageDesign {
  hero_section: string[];
  layout_structure: string[];
  design_language: string[];
  new_components: string[];
  micro_interactions: string[];
  copywriting: ATSAnalysisPageCopywriting;
}

export interface ATSAnalysisPageCopywriting {
  strength_label: string;
  gap_label: string;
  cta_copy: string;
  download_cta?: string;
  share_cta?: string;
  section_overview?: string;
  section_skills?: string;
  section_gaps?: string;
  section_recommendations?: string;
  section_learning?: string;
  empty_state?: string;
  success_state?: string;
  warning_state?: string;
  error_state?: string;
}


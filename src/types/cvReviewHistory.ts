import { CVData } from './cvEditor';
import { CVReviewResult, CVSuggestion } from './cvReview';

/**
 * Represents a single analysis in the history
 */
export interface AnalysisHistoryEntry {
  id: string;
  cvSnapshot: CVData;  // Full CV state at analysis time
  result: CVReviewResult;
  appliedSuggestions: string[];  // IDs of suggestions that were applied
  timestamp: string;
  scoreImprovement?: number;  // Delta from previous analysis
}

/**
 * Previous analysis context to send to API
 */
export interface PreviousAnalysisContext {
  score: number;
  suggestions: CVSuggestion[];
  appliedSuggestionIds: string[];
  previousCVSnapshot?: CVData;
  timestamp: string;
}

/**
 * Analysis comparison result
 */
export interface AnalysisComparison {
  scoreImprovement: number;
  fixedIssuesCount: number;
  newIssuesCount: number;
  fixedSuggestions: string[];  // IDs
  improvementSummary: string;
}

/**
 * Extended CV review request with history
 */
export interface CVReviewRequestWithHistory {
  cvData: CVData;
  jobContext?: {
    jobTitle: string;
    company: string;
    jobDescription?: string;
    keywords: string[];
    strengths: string[];
    gaps: string[];
  };
  previousAnalysis?: PreviousAnalysisContext;
}

/**
 * Extended CV review result with improvement metrics
 */
export interface CVReviewResultWithMetrics extends CVReviewResult {
  improvement?: AnalysisComparison;
}









import { JobPostAnalysisResult } from '../services/jobPostAnalyzer';

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  position?: { x: number; y: number };
  connections?: string[];
  width?: number;
  height?: number;
}

export interface Connection {
  id: string;
  start: string;
  end: string;
  label?: string;
}

export interface Interview {
  id: string;
  date: string;
  time: string;
  type: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  interviewers?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  stickyNotes?: Note[];
  noteConnections?: Connection[];
  feedback?: string;
  location?: string;
  preparation?: JobPostAnalysisResult;
  jobPostContent?: string;
  jobPostUrl?: string;
  lastAnalyzed?: string;
  skillRatings?: Record<string, number>;
  chatHistory?: ChatMessage[];
  checklist?: ChecklistItem[];
  companyNews?: NewsItem[];
  lastCompanyNewsUpdated?: string;
  skillCoach?: {
    microTasks?: Record<string, { id: string; label: string; done: boolean }[]>;
    starStories?: Record<string, { id: string; situation: string; action: string; result: string }[]>;
    readiness?: Record<string, 'ready' | 'needs_work'>;
  };
  resourcesData?: {
    reviewedTips?: string[];
    savedLinks?: { id: string; title: string; url: string }[];
    questionsToAsk?: string[];
    elevatorPitch?: string;
  };
  freeFormNotes?: string;
  noteDocuments?: NoteDocument[];
  activeNoteDocumentId?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  section: 'overview' | 'questions' | 'skills' | 'resources' | 'chat';
  priority?: boolean;
}

export interface NewsItem {
  title: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  source?: string;
  url?: string;
}

export interface NoteDocument {
  id: string;
  title: string;
  content: string; // HTML from rich text editor
  createdAt: number;
  updatedAt: number;
  preview?: string; // First 100 chars for library view
}

export interface QuestionEntry {
  id: number;
  rawValue: string;
  text: string;
  tags: ('technical' | 'behavioral' | 'company-specific' | 'role-specific')[];
  suggestedApproach?: string | null;
}

// AI Interview Analysis Types
export type QuestionTag = 'technical' | 'behavioral' | 'company-specific' | 'role-specific';

export interface AnswerHighlight {
  text: string;
  type: 'strength' | 'improvement' | 'weakness';
  comment: string;
}

export interface STAREvaluation {
  situation: boolean; // true if situation is clearly described
  task: boolean; // true if task/challenge is explained
  action: boolean; // true if actions taken are detailed
  result: boolean; // true if results/outcomes are mentioned
}

export interface AnswerAnalysis {
  questionId: number;
  score: number; // 0-100
  feedback?: string; // Detailed paragraph feedback
  highlights: AnswerHighlight[];
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  starEvaluation?: STAREvaluation;
}

export interface InterviewAnalysis {
  overallScore: number; // 0-100
  passed: boolean;
  passReason: string;
  tier: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  executiveSummary: string;
  keyStrengths: string[];
  areasForImprovement: string[];
  recommendation: string;
  answerAnalyses: AnswerAnalysis[];
  actionItems: string[];
}

export interface JobContext {
  companyName: string;
  position: string;
  jobDescription?: string;
  requiredSkills?: string[];
}

// ============================================
// Mock Interview Analysis Types (Enhanced v2)
// ============================================

export interface MockInterviewVerdict {
  passed: boolean;
  confidence: 'high' | 'medium' | 'low';
  hireDecision: 'yes' | 'maybe' | 'no';
}

export interface MockInterviewContentAnalysis {
  relevanceScore: number; // 0-100
  specificityScore: number; // 0-100
  didAnswerQuestions: 'yes' | 'partially' | 'no';
  questionsEvaded?: string[];
  examplesProvided: number;
  examplesQuality: 'vague' | 'generic' | 'specific' | 'excellent';
  starMethodUsage: STAREvaluation;
  contentVerdict: string;
}

export interface MockInterviewExpressionAnalysis {
  organizationScore: number; // 0-100
  clarityScore: number; // 0-100
  confidenceScore: number; // 0-100
  structureAssessment: 'organized' | 'scattered' | 'mixed';
  fillerWordsDetected?: string[];
  hedgingPhrases?: string[];
  rambling: boolean;
  expressionVerdict: string;
}

export interface MockInterviewJobFitAnalysis {
  fitScore: number; // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  experienceRelevance: 'high' | 'medium' | 'low';
  wouldSurvive90Days: 'likely' | 'unlikely' | 'uncertain';
  competitivePosition: string;
  jobFitVerdict: string;
}

export interface MockInterviewTranscriptHighlight {
  entryId: string; // Reference to transcript entry ID
  excerpt: string; // Exact quote from transcript
  type: 'strength' | 'improvement' | 'weakness';
  category: 'content' | 'expression' | 'relevance';
  feedback: string; // Specific actionable feedback
}

export interface MockInterviewResponseAnalysis {
  entryId: string; // Reference to transcript entry ID
  responseText: string; // What the candidate said
  questionAsked: string; // What the interviewer asked before this
  structureScore: number; // 0-100
  contentScore: number; // 0-100
  expressionScore: number; // 0-100
  overallResponseScore: number; // 0-100 average
  tone: 'confident' | 'neutral' | 'hesitant' | 'enthusiastic';
  whatWasGood: string[]; // Positive aspects
  whatToImprove: string[]; // Areas for improvement
  idealResponse: string; // What they SHOULD have said
  detailedFeedback: string; // Full explanation
}

export interface MockInterviewAnalysis {
  verdict: MockInterviewVerdict;
  overallScore: number; // 0-100
  executiveSummary: string;
  
  contentAnalysis: MockInterviewContentAnalysis;
  expressionAnalysis: MockInterviewExpressionAnalysis;
  jobFitAnalysis: MockInterviewJobFitAnalysis;
  
  transcriptHighlights: MockInterviewTranscriptHighlight[];
  responseAnalysis?: MockInterviewResponseAnalysis[]; // Per-response detailed analysis
  strengths: string[];
  criticalIssues: string[];
  actionPlan: string[];
}


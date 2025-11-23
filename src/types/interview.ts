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


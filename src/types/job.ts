export interface Interview {
  id: string;
  date: string;
  time: string;
  type: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  interviewers?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  location?: string;
}

export interface StatusChange {
  status:
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'archived'
  | 'pending_decision'
  | 'wishlist';
  date: string;
  notes?: string;
}

export interface GeneratedEmail {
  id: string;
  type: 'cover_letter' | 'follow_up';
  content: string;
  createdAt: string;
  noteId?: string;  // ID of linked NotionDocument in notes collection
}

export interface StickyNote {
  id: string;
  content: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface FocusModeState {
  content: string;
  chatHistory: ChatMessage[];
  isOpen: boolean;
}

export interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  location: string;
  status:
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'archived'
  | 'pending_decision'
  | 'wishlist';
  appliedDate: string;
  url?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  salary?: string;
  workType?: string;
  platform?: string;
  description?: string;  // AI-powered summary (short, 3 bullet points)
  fullJobDescription?: string;  // Complete job description from the posting
  notes?: string;         // Personal notes from the user (deprecated - use stickyNotes instead)
  createdAt: string;
  updatedAt: string;
  interviews?: Interview[];
  statusHistory?: StatusChange[];
  generatedEmails?: GeneratedEmail[];  // History of AI-generated emails
  stickyNotes?: StickyNote[];  // User's sticky notes for this application
  jobInsights?: {  // Enhanced AI-extracted insights for premium summary display
    keyResponsibilities?: string;
    requiredSkills?: string;
    experienceLevel?: string;
    compensationBenefits?: string;
    companyCulture?: string;
    growthOpportunities?: string;
  };
  jobTags?: {  // Structured tags extracted by AI for analytics
    industry: string[];
    sector: string;
    seniority: string;
    employmentType: string[];
    technologies: string[];
    skills: string[];
    location: {
      city?: string;
      country?: string;
      remote: boolean;
      hybrid: boolean;
    };
    companySize?: string;
    salaryRange?: {
      min?: number;
      max?: number;
      currency?: string;
    };
  };
  cvAnalysisId?: string;  // ID of linked CV analysis from CV Analysis page
  linkedNoteIds?: string[];  // IDs of linked NotionDocuments from AI-generated content
  linkedResumeIds?: string[];  // IDs of linked CVs/Resumes from Resume Builder
  linkedDocumentIds?: string[];  // IDs of linked PDF Documents from Resume Builder
  linkedWhiteboardIds?: string[];  // IDs of linked Whiteboards from Resume Builder
}

export interface AutomationSettings {
  autoRejectDays: {
    enabled: boolean;
    days: number;
    applyTo: ('applied' | 'interview' | 'pending_decision')[];
  };
  autoArchiveRejected: {
    enabled: boolean;
    days: number;
  };
  autoMoveToInterview: {
    enabled: boolean;
  };
  inactiveReminder: {
    enabled: boolean;
    days: number;
  };
  autoMoveToPendingDecision: {
    enabled: boolean;
    interviewCount: number;
  };
  autoRejectNoResponse: {
    enabled: boolean;
    days: number;
    applyTo: ('applied' | 'interview')[];
  };
}

export const defaultAutomationSettings: AutomationSettings = {
  autoRejectDays: {
    enabled: false,
    days: 30,
    applyTo: ['applied', 'interview', 'pending_decision'],
  },
  autoArchiveRejected: {
    enabled: false,
    days: 30,
  },
  autoMoveToInterview: {
    enabled: true,
  },
  inactiveReminder: {
    enabled: false,
    days: 14,
  },
  autoMoveToPendingDecision: {
    enabled: false,
    interviewCount: 2,
  },
  autoRejectNoResponse: {
    enabled: false,
    days: 30,
    applyTo: ['applied', 'interview'],
  },
};

export interface AutomationUpdate {
  applicationId: string;
  newStatus: JobApplication['status'];
  reason: string;
}




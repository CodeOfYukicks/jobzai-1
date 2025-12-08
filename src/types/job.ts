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
  // Job Application statuses
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'archived'
  | 'pending_decision'
  | 'wishlist'
  // Campaign/Outreach statuses
  | 'targets'
  | 'contacted'
  | 'follow_up'
  | 'replied'
  | 'meeting'
  | 'opportunity'
  | 'no_response'
  | 'closed';
  date: string;
  notes?: string;
}

export interface GeneratedEmail {
  id: string;
  type: 'cover_letter' | 'follow_up' | 'interview_prep' | 'questions_to_ask' | 'thank_you';
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
  // Job Application statuses
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'archived'
  | 'pending_decision'
  | 'wishlist'
  // Campaign/Outreach statuses
  | 'targets'
  | 'contacted'
  | 'follow_up'
  | 'replied'
  | 'meeting'
  | 'opportunity'
  | 'no_response'
  | 'closed';
  appliedDate: string;
  url?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactRole?: string;           // Campaign: Contact's job title (e.g., "Head of Engineering")
  contactLinkedIn?: string;       // Campaign: Contact's LinkedIn URL
  outreachChannel?: 'email' | 'linkedin' | 'referral' | 'event' | 'cold_call' | 'other';  // Campaign: How you reached out
  messageSent?: string;           // Campaign: Summary of the outreach message
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
  cvAnalysisId?: string;  // ID of linked CV analysis from CV Analysis page (deprecated - use cvAnalysisIds)
  cvAnalysisIds?: string[];  // IDs of all linked CV analyses from CV Analysis page
  linkedNoteIds?: string[];  // IDs of linked NotionDocuments from AI-generated content
  linkedResumeIds?: string[];  // IDs of linked CVs/Resumes from Resume Builder
  linkedDocumentIds?: string[];  // IDs of linked PDF Documents from Resume Builder
  linkedWhiteboardIds?: string[];  // IDs of linked Whiteboards from Resume Builder
  boardId?: string;  // ID of the Kanban board this application belongs to (null/undefined = default board)
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

// Custom column for Kanban boards
export interface CustomColumn {
  id: string;
  name: string;
  color: string;
  order: number;
}

// Board type - Jobs (classic job applications) or Campaigns (spontaneous applications)
export type BoardType = 'jobs' | 'campaigns';

// Kanban Board interface for multi-board feature
export interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  icon?: string;           // emoji or icon name
  color?: string;          // board accent color
  coverPhoto?: string;     // board-specific cover photo
  customColumns?: CustomColumn[];  // additional custom columns
  isDefault?: boolean;     // true for the default board
  boardType?: BoardType;   // 'jobs' (default) or 'campaigns'
  createdAt: any;          // Firestore Timestamp
  updatedAt: any;          // Firestore Timestamp
}

// Standard Kanban columns (always present)
export const STANDARD_COLUMNS = [
  'wishlist',
  'applied', 
  'interview',
  'pending_decision',
  'offer',
  'rejected',
  'archived'
] as const;

export type StandardColumnType = typeof STANDARD_COLUMNS[number];

// Board color presets
export const BOARD_COLORS = [
  '#635BFF', // Indigo (default)
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
] as const;

// Columns per board type
export const BOARD_TYPE_COLUMNS = {
  jobs: ['wishlist', 'applied', 'interview', 'pending_decision', 'offer', 'rejected', 'archived'],
  campaigns: ['targets', 'contacted', 'follow_up', 'replied', 'meeting', 'opportunity', 'no_response', 'closed'],
} as const;

// Column labels for Jobs board type
export const JOB_COLUMN_LABELS: Record<string, string> = {
  wishlist: 'Wishlist',
  applied: 'Applied',
  interview: 'Interview',
  pending_decision: 'Pending',
  offer: 'Offer',
  rejected: 'Rejected',
  archived: 'Archived',
};

// Column labels for Campaigns board type
export const CAMPAIGN_COLUMN_LABELS: Record<string, string> = {
  targets: 'Targets',
  contacted: 'Contacted',
  follow_up: 'Follow-up',
  replied: 'Replied',
  meeting: 'Meeting',
  opportunity: 'Opportunity',
  no_response: 'No Response',
  closed: 'Closed',
};

// Column colors for Campaigns board type
export const CAMPAIGN_COLUMN_COLORS: Record<string, string> = {
  targets: '#8B5CF6',      // Purple
  contacted: '#3B82F6',    // Blue
  follow_up: '#F59E0B',    // Amber
  replied: '#06B6D4',      // Cyan
  meeting: '#6366F1',      // Indigo
  opportunity: '#10B981',  // Emerald
  no_response: '#6B7280',  // Gray
  closed: '#374151',       // Dark Gray
};




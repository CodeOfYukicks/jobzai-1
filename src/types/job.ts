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

// ==========================================
// OUTREACH CAMPAIGN TYPES
// ==========================================

// Relationship goal for outreach campaigns
export type RelationshipGoal = 'networking' | 'prospecting' | 'referral';

// Warmth level of the relationship
export type WarmthLevel = 'cold' | 'warm' | 'hot';

// Meeting types for campaigns (replaces interview types)
export type MeetingType = 'coffee_chat' | 'call' | 'video_call' | 'in_person' | 'other';

// Outreach message status
export type OutreachMessageStatus = 'draft' | 'sent' | 'delivered' | 'opened' | 'replied';

// Outreach channel types (extended)
export type OutreachChannel = 'email' | 'linkedin' | 'referral' | 'event' | 'cold_call' | 'twitter' | 'phone' | 'in_person' | 'other';

// Message in conversation history
export interface OutreachMessage {
  id: string;
  type: 'sent' | 'received';
  channel: OutreachChannel;
  subject?: string;
  content: string;
  sentAt: string;
  status?: OutreachMessageStatus;
}

// Meeting for campaigns (similar to Interview but with campaign vocabulary)
export interface Meeting {
  id: string;
  date: string;
  time: string;
  type: MeetingType;
  attendees?: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  location?: string;
  agenda?: string;
  outcome?: string;  // What was the result of the meeting
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
  outreachChannel?: OutreachChannel;  // Campaign: How you reached out
  messageSent?: string;           // Campaign: Summary of the outreach message
  
  // Enhanced Campaign/Outreach fields
  relationshipGoal?: RelationshipGoal;  // Campaign: Goal of the outreach (networking, prospecting, referral)
  warmthLevel?: WarmthLevel;            // Campaign: Current relationship warmth (cold, warm, hot)
  lastContactedAt?: string;             // Campaign: Date of last contact
  nextFollowUpDate?: string;            // Campaign: Scheduled follow-up date
  conversationHistory?: OutreachMessage[];  // Campaign: Full conversation history
  meetings?: Meeting[];                 // Campaign: Scheduled/completed meetings
  contactBio?: string;                  // Campaign: Short bio or notes about the contact
  contactCompanyWebsite?: string;       // Campaign: Company website URL
  contactCompanyIndustry?: string;      // Campaign: Company industry
  contactCompanySize?: string;          // Campaign: Company size (startup, smb, enterprise)
  gmailThreadId?: string;              // Campaign: Gmail thread ID for fetching replies
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

// ==========================================
// OUTREACH CAMPAIGN LABELS & COLORS
// ==========================================

// Relationship goal labels
export const RELATIONSHIP_GOAL_LABELS: Record<RelationshipGoal, string> = {
  networking: 'Networking',
  prospecting: 'Prospecting',
  referral: 'Referral',
};

// Relationship goal colors
export const RELATIONSHIP_GOAL_COLORS: Record<RelationshipGoal, { bg: string; text: string; border: string }> = {
  networking: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  prospecting: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  referral: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
};

// Warmth level labels
export const WARMTH_LEVEL_LABELS: Record<WarmthLevel, string> = {
  cold: 'Cold',
  warm: 'Warm',
  hot: 'Hot',
};

// Warmth level colors
export const WARMTH_LEVEL_COLORS: Record<WarmthLevel, { bg: string; text: string; border: string; icon: string }> = {
  cold: { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', icon: '❄️' },
  warm: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', icon: '🌤️' },
  hot: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800', icon: '🔥' },
};

// Outreach channel labels and icons
export const OUTREACH_CHANNEL_CONFIG: Record<OutreachChannel, { label: string; icon: string; color: string }> = {
  email: { label: 'Email', icon: 'Mail', color: 'text-blue-500' },
  linkedin: { label: 'LinkedIn', icon: 'Linkedin', color: 'text-[#0A66C2]' },
  referral: { label: 'Referral', icon: 'Users', color: 'text-green-500' },
  event: { label: 'Event', icon: 'Calendar', color: 'text-purple-500' },
  cold_call: { label: 'Cold Call', icon: 'Phone', color: 'text-orange-500' },
  twitter: { label: 'Twitter/X', icon: 'Twitter', color: 'text-sky-500' },
  phone: { label: 'Phone', icon: 'Phone', color: 'text-emerald-500' },
  in_person: { label: 'In Person', icon: 'User', color: 'text-indigo-500' },
  other: { label: 'Other', icon: 'MessageSquare', color: 'text-gray-500' },
};

// Meeting type labels
export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  coffee_chat: 'Coffee Chat',
  call: 'Phone Call',
  video_call: 'Video Call',
  in_person: 'In Person',
  other: 'Other',
};

// Meeting type colors
export const MEETING_TYPE_COLORS: Record<MeetingType, { bg: string; text: string }> = {
  coffee_chat: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  call: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  video_call: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  in_person: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  other: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400' },
};


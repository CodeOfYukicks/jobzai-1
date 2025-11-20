import { JobApplication, Interview, Note, Connection, ChecklistItem, NewsItem, ChatMessage, QuestionEntry } from '../../../types/interview';

export interface TabProps {
  application: JobApplication;
  interview: Interview;
  currentUser: any;
  applicationId: string;
  interviewId: string;
  // Overview tab props
  preparationProgress?: number;
  checklist?: ChecklistItem[];
  newsItems?: NewsItem[];
  isNewsLoading?: boolean;
  newsError?: string | null;
  showAllChecklistItems?: boolean;
  showAllNewsItems?: boolean;
  newTaskText?: string;
  // Questions tab props
  questionEntries?: QuestionEntry[];
  filteredQuestions?: QuestionEntry[];
  activeQuestionFilter?: string;
  isRegeneratingQuestions?: boolean;
  regeneratingProgress?: number;
  regeneratingMessage?: string;
  savedQuestionsState?: string[];
  collapsedQuestions?: Record<number, boolean>;
  focusedQuestion?: QuestionEntry | null;
  // Skills tab props
  skillRatings?: Record<string, number>;
  skillCoach?: Interview['skillCoach'];
  // Resources tab props
  resourcesData?: Interview['resourcesData'];
  newResourceTitle?: string;
  newResourceUrl?: string;
  // Chat tab props
  chatMessages?: ChatMessage[];
  message?: string;
  isSending?: boolean;
  typingMessages?: Record<number, string>;
  isUserNearBottom?: boolean;
  chatEndRef?: React.RefObject<HTMLDivElement>;
  chatContainerRef?: React.RefObject<HTMLDivElement>;
  // Common handlers
  setTab?: (tab: 'overview' | 'questions' | 'skills' | 'resources' | 'chat') => void;
  setActiveQuestionFilter?: (filter: string) => void;
  setShowAllChecklistItems?: (show: boolean) => void;
  setShowAllNewsItems?: (show: boolean) => void;
  setNewTaskText?: (text: string) => void;
  setNewResourceTitle?: (text: string) => void;
  setNewResourceUrl?: (text: string) => void;
  setMessage?: (text: string) => void;
  toggleChecklistItem?: (id: string) => void;
  addChecklistItem?: () => void;
  deleteChecklistItem?: (id: string) => void;
  updateChecklistItemText?: (id: string, text: string) => void;
  regenerateQuestions?: () => Promise<void>;
  handleToggleSuggestionVisibility?: (questionId: number) => void;
  handleToggleSaveQuestion?: (rawQuestion: string) => void;
  handleCreateNoteFromQuestion?: (content: string, displayIndex: number) => void;
  setFocusedQuestion?: (question: QuestionEntry | null) => void;
  handleRateSkill?: (skill: string, rating: number) => Promise<void>;
  toggleMicroTask?: (skill: string, taskId: string) => Promise<void>;
  ensureDefaultTasks?: (skill: string) => Array<{ id: string; label: string; done: boolean }>;
  addStarStory?: (skill: string) => Promise<void>;
  updateStarField?: (skill: string, storyId: string, field: 'situation' | 'action' | 'result', value: string) => Promise<void>;
  deleteStarStory?: (skill: string, storyId: string) => Promise<void>;
  exportStoryToNotes?: (skill: string, storyId: string) => void;
  practiceInChat?: (skill: string) => void;
  saveResourcesData?: (data: Interview['resourcesData']) => Promise<void>;
  setResourcesData?: (data: Interview['resourcesData']) => void;
  fetchCompanyNews?: () => Promise<void>;
  createNoteFromNews?: (news: NewsItem) => void;
  sendMessage?: () => Promise<void>;
  getProgressMilestones?: () => Array<{
    id: string;
    label: string;
    description: string;
    completed: boolean;
    icon: React.ReactNode;
    action: () => void;
  }>;
  skillGaps?: Array<{ skill: string; rating: number; gap: number }>;
  shortenText?: (text: string, max?: number) => string;
}



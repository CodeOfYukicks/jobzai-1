import { memo } from 'react';
import { Play } from 'lucide-react';
import { InterviewQuestionsHeader } from '../questions/InterviewQuestionsHeader';
import { QuestionEntry } from '../../../types/interview';
import QuestionsVirtualizedList from './QuestionsVirtualizedList';
import { useAvatarConfig } from '@/hooks/useAvatarConfig';
import Avatar from '@/components/assistant/avatar/Avatar';

const QUESTION_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'technical', label: 'Technical' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'company-specific', label: 'Company' },
  { id: 'role-specific', label: 'Role' },
] as const;

interface QuestionsTabProps {
  questionEntries: QuestionEntry[];
  filteredQuestions: QuestionEntry[];
  activeQuestionFilter: string;
  isRegeneratingQuestions: boolean;
  regeneratingProgress: number;
  regeneratingMessage: string;
  savedQuestionsState: string[];
  collapsedQuestions: Record<number, boolean>;
  focusedQuestion: QuestionEntry | null;
  application: { position?: string };
  setActiveQuestionFilter: (filter: string) => void;
  regenerateQuestions: () => Promise<void>;
  handleToggleSuggestionVisibility: (questionId: number) => void;
  handleToggleSaveQuestion: (rawQuestion: string) => void;
  handleCreateNoteFromQuestion: (content: string, displayIndex: number) => void;
  setFocusedQuestion: (question: QuestionEntry | null) => void;
  onStartLiveSession: () => void;
}

const QuestionsTab = memo(function QuestionsTab({
  questionEntries,
  filteredQuestions,
  activeQuestionFilter,
  isRegeneratingQuestions,
  regeneratingProgress,
  regeneratingMessage,
  savedQuestionsState,
  collapsedQuestions,
  setActiveQuestionFilter,
  regenerateQuestions,
  handleToggleSuggestionVisibility,
  handleToggleSaveQuestion,
  handleCreateNoteFromQuestion,
  setFocusedQuestion,
  onStartLiveSession,
}: QuestionsTabProps) {
  const avatarConfig = useAvatarConfig();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Loading Overlay - Minimal */}
      {isRegeneratingQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-[#1a1a1c]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center text-center px-6 max-w-md">
            {/* Progress Bar */}
            <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-[#2b2a2c] overflow-hidden mb-6">
              <div
                className="h-full bg-slate-900 dark:bg-white transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, regeneratingProgress))}%` }}
              />
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-white">
              {regeneratingMessage}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This may take a moment
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <InterviewQuestionsHeader
        totalCount={questionEntries.length}
        filteredCount={filteredQuestions.length}
        filters={QUESTION_FILTERS as any}
        activeFilter={activeQuestionFilter}
        onFilterChange={setActiveQuestionFilter}
        onRegenerate={regenerateQuestions}
        isRegenerating={isRegeneratingQuestions}
        actionSlot={
          <button
            onClick={onStartLiveSession}
            className="
              group inline-flex items-center gap-2
              px-4 py-2 rounded-lg
              text-sm font-medium
              bg-slate-900 dark:bg-white
              text-white dark:text-slate-900
              hover:bg-slate-800 dark:hover:bg-slate-100
              transition-all duration-200
              hover:shadow-lg hover:shadow-[#b7e219]/20
            "
          >
            <div className="relative flex-shrink-0">
              {/* Lime ring glow on hover */}
              <div className="absolute -inset-0.5 rounded-full bg-[#b7e219]/0 group-hover:bg-[#b7e219]/30 transition-all duration-300" />
              <Avatar 
                config={avatarConfig} 
                size={18} 
                className="relative rounded-full ring-1 ring-white/30 dark:ring-slate-900/30 group-hover:ring-[#b7e219]/50 transition-all duration-300"
              />
            </div>
            <span>Practice Live</span>
            <Play className="w-3 h-3 fill-current opacity-60" />
          </button>
        }
      />

      {/* Content */}
      {!isRegeneratingQuestions && (
        <div className="mt-8">
          {/* Empty State - No Questions */}
          {questionEntries.length === 0 && (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#2b2a2c] mb-6">
                <span className="text-2xl">?</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No questions yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Analyze a job posting to generate tailored interview questions
              </p>
            </div>
          )}

          {/* Empty State - No Filter Results */}
          {questionEntries.length > 0 && filteredQuestions.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                No {QUESTION_FILTERS.find(f => f.id === activeQuestionFilter)?.label?.toLowerCase()} questions found
              </p>
              <button
                type="button"
                onClick={() => setActiveQuestionFilter('all')}
                className="
                  text-sm font-medium
                  text-slate-900 dark:text-white
                  underline underline-offset-4
                  hover:no-underline
                  transition-all
                "
              >
                Show all questions
              </button>
            </div>
          )}

          {/* Questions List */}
          {filteredQuestions.length > 0 && (
            <div className="divide-y-0">
              <QuestionsVirtualizedList
                questions={filteredQuestions}
                collapsedQuestions={collapsedQuestions}
                savedQuestionsState={savedQuestionsState}
                handleToggleSuggestionVisibility={handleToggleSuggestionVisibility}
                handleToggleSaveQuestion={handleToggleSaveQuestion}
                handleCreateNoteFromQuestion={handleCreateNoteFromQuestion}
                setFocusedQuestion={setFocusedQuestion}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default QuestionsTab;

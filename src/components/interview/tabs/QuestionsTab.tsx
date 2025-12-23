import { memo } from 'react';
import { Play } from 'lucide-react';
import { InterviewQuestionsHeader } from '../questions/InterviewQuestionsHeader';
import { QuestionEntry } from '../../../types/interview';
import QuestionsVirtualizedList from './QuestionsVirtualizedList';
import { usePlanLimits } from '../../../hooks/usePlanLimits';
import { CREDIT_COSTS } from '../../../lib/planLimits';

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
  const { getUsageStats, isLoading: isLoadingLimits } = usePlanLimits();
  const stats = getUsageStats('liveSessions');

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
          <div className="flex items-center gap-3">
            {/* Usage Quota Indicator */}
            {!isLoadingLimits && stats && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Sessions:
                </span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {stats.used}/{stats.limit}
                </span>
                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${stats.percentage >= 100
                      ? 'bg-red-500'
                      : stats.percentage >= 80
                        ? 'bg-amber-500'
                        : 'bg-[#635bff]'
                      }`}
                    style={{ width: `${Math.min(100, stats.percentage)}%` }}
                  />
                </div>
                {stats.remaining === 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {CREDIT_COSTS.liveSession}cr
                  </span>
                )}
              </div>
            )}

            {/* Practice Live Button */}
            <button
              onClick={onStartLiveSession}
              className="
                inline-flex items-center gap-2
                px-4 py-2 rounded-lg
                text-sm font-medium
                bg-slate-900 dark:bg-white
                text-white dark:text-slate-900
                hover:bg-slate-800 dark:hover:bg-slate-100
                transition-all duration-200
                hover:shadow-lg hover:shadow-[#b7e219]/20
              "
            >
              <span>Practice Live</span>
              <Play className="w-3 h-3 fill-current opacity-60" />
            </button>
          </div>
        }
      />

      {/* Content */}
      {!isRegeneratingQuestions && (
        <div>
          {/* Empty State - No Questions */}
          {questionEntries.length === 0 && (
            <div className="rounded-2xl bg-white dark:bg-[#2b2a2c] ring-1 ring-slate-200/60 dark:ring-[#3d3c3e]/60 py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#1a1b1e] mb-6">
                <span className="text-2xl">?</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No questions yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Analyze a job posting to generate tailored interview questions
              </p>
            </div>
          )}

          {/* Empty State - No Filter Results */}
          {questionEntries.length > 0 && filteredQuestions.length === 0 && (
            <div className="rounded-2xl bg-white dark:bg-[#2b2a2c] ring-1 ring-slate-200/60 dark:ring-[#3d3c3e]/60 py-16 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                No {QUESTION_FILTERS.find(f => f.id === activeQuestionFilter)?.label?.toLowerCase()} questions found
              </p>
              <button
                type="button"
                onClick={() => setActiveQuestionFilter('all')}
                className="
                  text-sm font-semibold
                  text-jobzai-600 dark:text-jobzai-400
                  hover:text-jobzai-700 dark:hover:text-jobzai-300
                  transition-colors
                "
              >
                Show all questions
              </button>
            </div>
          )}

          {/* Questions List */}
          {filteredQuestions.length > 0 && (
            <QuestionsVirtualizedList
              questions={filteredQuestions}
              collapsedQuestions={collapsedQuestions}
              savedQuestionsState={savedQuestionsState}
              handleToggleSuggestionVisibility={handleToggleSuggestionVisibility}
              handleToggleSaveQuestion={handleToggleSaveQuestion}
              handleCreateNoteFromQuestion={handleCreateNoteFromQuestion}
              setFocusedQuestion={setFocusedQuestion}
            />
          )}
        </div>
      )}
    </div>
  );
});

export default QuestionsTab;

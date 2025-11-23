import { memo } from 'react';
import { MessageSquare, Play, Sparkles } from 'lucide-react';
import { InterviewQuestionsHeader } from '../questions/InterviewQuestionsHeader';
import { QuestionEntry } from '../../../types/interview';
import QuestionsVirtualizedList from './QuestionsVirtualizedList';

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
  focusedQuestion,
  application,
  setActiveQuestionFilter,
  regenerateQuestions,
  handleToggleSuggestionVisibility,
  handleToggleSaveQuestion,
  handleCreateNoteFromQuestion,
  setFocusedQuestion,
  onStartLiveSession,
}: QuestionsTabProps) {
  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay - Simplified for performance */}
      {isRegeneratingQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center text-center px-6">
            <div className="w-[min(60vw,520px)] h-2 rounded-full bg-white/20 dark:bg-white/15 overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, regeneratingProgress))}%` }}
              />
            </div>
            <p className="text-base font-semibold text-white">
              {regeneratingMessage}
            </p>
            <p className="mt-2 text-sm text-white/80">
              This may take up to 2 minutes.
            </p>
          </div>
        </div>
      )}

      <InterviewQuestionsHeader
        totalCount={questionEntries.length}
        filteredCount={filteredQuestions.length}
        filters={QUESTION_FILTERS as any}
        activeFilter={activeQuestionFilter}
        onFilterChange={setActiveQuestionFilter}
        onRegenerate={regenerateQuestions}
        isRegenerating={isRegeneratingQuestions}
        subtitle={application?.position ? `Tailored questions for your ${application.position} interview` : undefined}
        actionSlot={
          <button
            onClick={onStartLiveSession}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-neutral-800 hover:shadow-xl dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-10 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 dark:group-hover:opacity-20" />
            <Play className="h-4 w-4 fill-current" />
            <span className="relative">Prepare Live</span>
            <Sparkles className="h-3.5 w-3.5 text-purple-400 dark:text-purple-600" />
          </button>
        }
      />

      {!isRegeneratingQuestions && (
        <div className="mt-8 space-y-5">
          {questionEntries.length === 0 && (
            <div className="rounded-[20px] border border-dashed border-black/10 bg-white/70 px-6 py-12 text-center shadow-[0_20px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
              <MessageSquare className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
              <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">No suggested questions yet</h3>
              <p className="mt-2 text-sm text-neutral-500">
                Analyze a job posting to let the AI craft premium interview questions for you.
              </p>
            </div>
          )}

          {questionEntries.length > 0 && filteredQuestions.length === 0 && (
            <div className="rounded-[20px] border border-black/5 bg-white/80 px-6 py-10 text-center shadow-[0_16px_30px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
              <MessageSquare className="mx-auto h-12 w-12 text-neutral-200 dark:text-neutral-600" />
              <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
                No {QUESTION_FILTERS.find(filter => filter.id === activeQuestionFilter)?.label?.toLowerCase() || 'selected'} questions found
              </h3>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-300">
                Try another filter or show all questions to continue practicing.
              </p>
              <button
                type="button"
                onClick={() => setActiveQuestionFilter('all')}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                Show all questions
              </button>
            </div>
          )}

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

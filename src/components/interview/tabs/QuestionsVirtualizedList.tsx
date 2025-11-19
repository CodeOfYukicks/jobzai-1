import { memo, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { QuestionEntry } from '../../../types/interview';
import { QuestionCard } from '../questions/QuestionCard';

interface QuestionsVirtualizedListProps {
  questions: QuestionEntry[];
  collapsedQuestions: Record<number, boolean>;
  savedQuestionsState: string[];
  handleToggleSuggestionVisibility: (id: number) => void;
  handleToggleSaveQuestion: (rawValue: string) => void;
  handleCreateNoteFromQuestion: (text: string, index: number) => void;
  setFocusedQuestion: (question: QuestionEntry) => void;
}

const QuestionsVirtualizedList = memo(function QuestionsVirtualizedList({
  questions,
  collapsedQuestions,
  savedQuestionsState,
  handleToggleSuggestionVisibility,
  handleToggleSaveQuestion,
  handleCreateNoteFromQuestion,
  setFocusedQuestion,
}: QuestionsVirtualizedListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Estimate size based on whether suggestion is open (larger) or closed (smaller)
  const estimateSize = useMemo(() => {
    return (index: number) => {
      const entry = questions[index];
      const isOpen = collapsedQuestions[entry.id] === false;
      // Base height + extra if suggestion is open
      return isOpen ? 400 : 150;
    };
  }, [questions, collapsedQuestions]);

  const virtualizer = useVirtualizer({
    count: questions.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 3,
  });

  const items = virtualizer.getVirtualItems();

  // Only virtualize if we have more than 10 questions for better UX
  if (questions.length <= 10) {
    return (
      <div className="space-y-5">
        {questions.map((entry, displayIndex) => (
          <QuestionCard
            key={entry.id}
            index={displayIndex}
            question={entry.text}
            tags={entry.tags}
            suggestedApproach={entry.suggestedApproach}
            isSuggestionOpen={collapsedQuestions[entry.id] === false}
            isSaved={savedQuestionsState.includes(entry.rawValue)}
            onToggleSuggestion={() => handleToggleSuggestionVisibility(entry.id)}
            onToggleSave={() => handleToggleSaveQuestion(entry.rawValue)}
            onCreateNote={() => handleCreateNoteFromQuestion(entry.text, displayIndex + 1)}
            onFocus={() => setFocusedQuestion(entry)}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{
        height: 'calc(100vh - 400px)',
        minHeight: '500px',
        maxHeight: '800px',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualItem) => {
          const entry = questions[virtualItem.index];
          const displayIndex = virtualItem.index;
          
          return (
            <div
              key={entry.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                paddingBottom: '1.25rem',
              }}
            >
              <QuestionCard
                index={displayIndex}
                question={entry.text}
                tags={entry.tags}
                suggestedApproach={entry.suggestedApproach}
                isSuggestionOpen={collapsedQuestions[entry.id] === false}
                isSaved={savedQuestionsState.includes(entry.rawValue)}
                onToggleSuggestion={() => handleToggleSuggestionVisibility(entry.id)}
                onToggleSave={() => handleToggleSaveQuestion(entry.rawValue)}
                onCreateNote={() => handleCreateNoteFromQuestion(entry.text, displayIndex + 1)}
                onFocus={() => setFocusedQuestion(entry)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default QuestionsVirtualizedList;


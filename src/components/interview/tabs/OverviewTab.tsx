import { memo, useMemo } from 'react';
import { Interview, ChecklistItem, NewsItem } from '../../../types/interview';
import { JobApplication } from '../../../types/job';
import {
  PreparationProgress,
  ChecklistSection,
  KeyPointsSection,
  CompanyProfileSection,
  PositionDetailsSection,
  CompanyUpdatesSection,
} from '../sections';
import { LazySection } from '../utils/LazySection';

interface OverviewTabProps {
  application: JobApplication;
  interview: Interview;
  preparationProgress: number;
  checklist: ChecklistItem[];
  newsItems: NewsItem[];
  isNewsLoading: boolean;
  newsError: string | null;
  showAllChecklistItems: boolean;
  showAllNewsItems: boolean;
  newTaskText: string;
  getProgressMilestones: () => Array<{
    id: string;
    label: string;
    description: string;
    completed: boolean;
    icon: React.ReactNode;
    action: () => void;
  }>;
  setTab: (tab: 'overview' | 'questions' | 'skills' | 'resources' | 'chat') => void;
  setShowAllChecklistItems: (show: boolean) => void;
  setShowAllNewsItems: (show: boolean) => void;
  setNewTaskText: (text: string) => void;
  toggleChecklistItem: (id: string) => void;
  addChecklistItem: () => void;
  deleteChecklistItem: (id: string) => void;
  updateChecklistItemText: (id: string, text: string) => void;
  fetchCompanyNews: () => Promise<void>;
  createNoteFromNews: (news: NewsItem) => void;
}

const OverviewTab = memo(function OverviewTab({
  application,
  interview,
  preparationProgress,
  checklist,
  newsItems,
  isNewsLoading,
  newsError,
  showAllChecklistItems,
  showAllNewsItems,
  newTaskText,
  getProgressMilestones,
  setTab,
  setShowAllChecklistItems,
  setShowAllNewsItems,
  setNewTaskText,
  toggleChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
  updateChecklistItemText,
  fetchCompanyNews,
  createNoteFromNews,
}: OverviewTabProps) {
  const milestones = useMemo(() => getProgressMilestones(), [getProgressMilestones]);

  return (
    <div className="space-y-5">
      {/* Always render first section for immediate visibility */}
      <PreparationProgress
        preparationProgress={preparationProgress}
        milestones={milestones}
      />

      {/* Lazy load sections below the fold */}
      <LazySection minHeight="300px">
        <ChecklistSection
          checklist={checklist}
          showAllChecklistItems={showAllChecklistItems}
          newTaskText={newTaskText}
          setTab={setTab}
          setShowAllChecklistItems={setShowAllChecklistItems}
          setNewTaskText={setNewTaskText}
          toggleChecklistItem={toggleChecklistItem}
          addChecklistItem={addChecklistItem}
          deleteChecklistItem={deleteChecklistItem}
          updateChecklistItemText={updateChecklistItemText}
        />
      </LazySection>

      <LazySection minHeight="200px">
        <KeyPointsSection interview={interview} />
      </LazySection>

      <LazySection minHeight="400px">
        <div className="space-y-4">
          <CompanyProfileSection application={application} interview={interview} />
          <PositionDetailsSection application={application} interview={interview} />
        </div>
      </LazySection>

      {interview?.preparation && (
        <LazySection minHeight="300px">
          <CompanyUpdatesSection
            interview={interview}
            newsItems={newsItems}
            isNewsLoading={isNewsLoading}
            newsError={newsError}
            showAllNewsItems={showAllNewsItems}
            setShowAllNewsItems={setShowAllNewsItems}
            fetchCompanyNews={fetchCompanyNews}
            createNoteFromNews={createNoteFromNews}
          />
        </LazySection>
      )}
    </div>
  );
});

export default OverviewTab;


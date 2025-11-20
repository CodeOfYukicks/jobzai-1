import { memo } from 'react';
import { Interview, ChecklistItem, NewsItem } from '../../../types/interview';
import { JobApplication } from '../../../types/job';
import {
  KeyPointsSection,
  CompanyProfileSection,
  PositionDetailsSection,
  CompanyUpdatesSection,
} from '../sections';
import { LazySection } from '../utils/LazySection';

interface OverviewTabProps {
  application: JobApplication;
  interview: Interview;
  checklist: ChecklistItem[];
  newsItems: NewsItem[];
  isNewsLoading: boolean;
  newsError: string | null;
  showAllChecklistItems: boolean;
  showAllNewsItems: boolean;
  newTaskText: string;
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
  checklist,
  newsItems,
  isNewsLoading,
  newsError,
  showAllChecklistItems,
  showAllNewsItems,
  newTaskText,
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
  return (
    <div className="space-y-5">
      {/* Company Profile First */}
      <LazySection minHeight="300px">
        <CompanyProfileSection application={application} interview={interview} />
      </LazySection>

      <LazySection minHeight="300px">
        <PositionDetailsSection application={application} interview={interview} />
      </LazySection>

      <LazySection minHeight="200px">
        <KeyPointsSection interview={interview} />
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


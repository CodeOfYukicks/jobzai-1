import { memo } from 'react';
import { Interview, ChecklistItem, NewsItem } from '../../../types/interview';
import { JobApplication } from '../../../types/job';
import {
  KeyPointsSection,
  CompanyProfileSection,
  PositionDetailsSection,
  CompanyUpdatesSection,
} from '../sections';

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
  newsItems,
  isNewsLoading,
  newsError,
  showAllNewsItems,
  setShowAllNewsItems,
  fetchCompanyNews,
  createNoteFromNews,
}: OverviewTabProps) {
  const hasPreparation = !!interview?.preparation;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Column - Company Profile (spans 8 cols) */}
        <div className="lg:col-span-8">
          <CompanyProfileSection application={application} interview={interview} />
        </div>

        {/* Side Column - Key Points (spans 4 cols) */}
        <div className="lg:col-span-4">
          <KeyPointsSection interview={interview} />
        </div>

        {/* Full Width - Position Details */}
        <div className="lg:col-span-12">
          <PositionDetailsSection application={application} interview={interview} />
        </div>

        {/* Company Updates - Full width, collapsible */}
        {hasPreparation && (
          <div className="lg:col-span-12">
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
          </div>
        )}
      </div>
    </div>
  );
});

export default OverviewTab;

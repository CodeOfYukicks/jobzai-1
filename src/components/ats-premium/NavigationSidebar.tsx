import React from 'react';
import { 
  LayoutGrid, TrendingUp, AlertCircle, FileEdit, 
  Clock, GraduationCap, Target, CheckCircle 
} from 'lucide-react';

interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface NavigationSidebarProps {
  sections: NavSection[];
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  isVisible?: boolean;
  sidebarRef?: React.RefObject<HTMLElement>;
}

export default function NavigationSidebar({ 
  sections, 
  activeSection, 
  onNavigate,
  isVisible = true,
  sidebarRef 
}: NavigationSidebarProps) {
  return (
    <aside 
      ref={sidebarRef as any}
      className="hidden lg:block w-64 flex-shrink-0"
    >
      <nav className="sticky top-24 space-y-1">
        <div className="bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200 dark:border-gray-800 p-2 shadow-sm backdrop-blur-sm">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => onNavigate(section.id)}
                className={`
                  w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg
                  text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    ${isActive 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-400 dark:text-gray-500'
                    }
                  `}>
                    {section.icon}
                  </div>
                  <span>{section.label}</span>
                </div>
                
                {section.count !== undefined && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${isActive
                      ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {section.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl border border-indigo-200 dark:border-indigo-900 p-4">
          <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide mb-2">
            Quick Tip
          </p>
          <p className="text-sm text-indigo-800 dark:text-indigo-400 leading-relaxed">
            Focus on the high-impact CV fixes first for maximum score improvement.
          </p>
        </div>
      </nav>
    </aside>
  );
}

// Default sections configuration
export const DEFAULT_SECTIONS: NavSection[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-5 h-5" /> },
  { id: 'job-summary', label: 'Job Summary', icon: <Target className="w-5 h-5" /> },
  { id: 'breakdown', label: 'Match Breakdown', icon: <CheckCircle className="w-5 h-5" /> },
  { id: 'strengths', label: 'Strengths', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'gaps', label: 'Gaps', icon: <AlertCircle className="w-5 h-5" /> },
  { id: 'cv-fixes', label: 'CV Fixes', icon: <FileEdit className="w-5 h-5" /> },
  { id: 'action-plan', label: '48H Action Plan', icon: <Clock className="w-5 h-5" /> },
  { id: 'learning', label: 'Learning Path', icon: <GraduationCap className="w-5 h-5" /> },
  { id: 'fit', label: 'Opportunity Fit', icon: <Target className="w-5 h-5" /> },
];


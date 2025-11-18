import React from 'react';
import { 
  LayoutGrid, TrendingUp, AlertCircle, FileEdit, 
  Clock, GraduationCap, Target, CheckCircle, PenTool, Loader2
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
  analysisId?: string; // For CV Rewrite navigation
  onGenerateCVRewrite?: () => void; // Function to generate CV rewrite
  isGeneratingCV?: boolean; // Loading state for CV generation
  horizontal?: boolean; // Display menu horizontally instead of vertically
}

export default function NavigationSidebar({ 
  sections, 
  activeSection, 
  onNavigate,
  isVisible: _isVisible = true,
  sidebarRef,
  analysisId: _analysisId,
  onGenerateCVRewrite,
  isGeneratingCV = false,
  horizontal = false
}: NavigationSidebarProps) {
  // Horizontal layout - Premium Design
  if (horizontal) {
    // Group sections logically
    const analysisSections = sections.filter(s => 
      ['overview', 'job-summary', 'breakdown', 'strengths', 'gaps'].includes(s.id)
    );
    const actionSections = sections.filter(s => 
      ['cv-fixes', 'cv-rewrite', 'action-plan'].includes(s.id)
    );
    const resourceSections = sections.filter(s => 
      ['learning', 'fit'].includes(s.id)
    );

    const getActiveIndex = () => {
      const allSections = [...analysisSections, ...actionSections, ...resourceSections];
      return allSections.findIndex(s => s.id === activeSection);
    };

    const getTotalSections = () => {
      return analysisSections.length + actionSections.length + resourceSections.length;
    };

    const activeIndex = getActiveIndex();
    const totalSections = getTotalSections();
    const progressPercentage = totalSections > 0 ? ((activeIndex + 1) / totalSections) * 100 : 0;

    return (
      <nav 
        ref={sidebarRef as any}
        className="sticky top-0 z-40 w-full mb-8 -mx-6 px-6 pt-4 pb-3 bg-gray-50/80 dark:bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300"
      >
        {/* Progress Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Main Navigation Container */}
          <div className="bg-white/70 dark:bg-[#1A1A1D]/70 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col gap-3.5">
              {/* Analysis Group */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-2 py-1">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Analysis
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                {analysisSections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => onNavigate(section.id)}
                      className={`
                        relative flex items-center gap-2 px-4 py-2 rounded-lg
                        text-sm font-medium transition-all duration-300 whitespace-nowrap
                        ${isActive
                          ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-lg animate-pulse" />
                      )}
                      <div className={`
                        relative flex items-center transition-colors duration-300
                        ${isActive 
                          ? 'text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-400 dark:text-gray-500'
                        }
                      `}>
                        <div className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                          {section.icon}
                        </div>
                      </div>
                      <span className="relative">{section.label}</span>
                      {section.count !== undefined && (
                        <span className={`
                          relative px-1.5 py-0.5 rounded-md text-xs font-semibold min-w-[20px] text-center
                          ${isActive
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
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

              {/* Action Group */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-2 py-1">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Actions
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                {actionSections.map((section) => {
                  const isActive = activeSection === section.id;
                  const isCVRewrite = section.id === 'cv-rewrite';
                  
                  if (isCVRewrite) {
                    return (
                      <button
                        key={section.id}
                        onClick={onGenerateCVRewrite}
                        disabled={isGeneratingCV}
                        className={`
                          relative flex items-center gap-2 px-4 py-2 rounded-lg
                          text-sm font-medium transition-all duration-300 whitespace-nowrap
                          ${isGeneratingCV
                            ? 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 text-purple-700 dark:text-purple-300 cursor-wait'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                          }
                          disabled:opacity-75
                        `}
                      >
                        <div className={`
                          relative flex items-center transition-colors duration-300
                          ${isGeneratingCV ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}
                        `}>
                          {isGeneratingCV ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <div className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                              {section.icon}
                            </div>
                          )}
                        </div>
                        <span className="relative">{isGeneratingCV ? 'Generating CV...' : section.label}</span>
                        {isGeneratingCV && (
                          <span className="relative px-1.5 py-0.5 rounded-md text-xs font-semibold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 animate-pulse">
                            AI
                          </span>
                        )}
                      </button>
                    );
                  }
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => onNavigate(section.id)}
                      className={`
                        relative flex items-center gap-2 px-4 py-2 rounded-lg
                        text-sm font-medium transition-all duration-300 whitespace-nowrap
                        ${isActive
                          ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-lg animate-pulse" />
                      )}
                      <div className={`
                        relative flex items-center transition-colors duration-300
                        ${isActive 
                          ? 'text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-400 dark:text-gray-500'
                        }
                      `}>
                        <div className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                          {section.icon}
                        </div>
                      </div>
                      <span className="relative">{section.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Resources Group */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-2 py-1">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Resources
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                {resourceSections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => onNavigate(section.id)}
                      className={`
                        relative flex items-center gap-2 px-4 py-2 rounded-lg
                        text-sm font-medium transition-all duration-300 whitespace-nowrap
                        ${isActive
                          ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-lg animate-pulse" />
                      )}
                      <div className={`
                        relative flex items-center transition-colors duration-300
                        ${isActive 
                          ? 'text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-400 dark:text-gray-500'
                        }
                      `}>
                        <div className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                          {section.icon}
                        </div>
                      </div>
                      <span className="relative">{section.label}</span>
                      {section.count !== undefined && (
                        <span className={`
                          relative px-1.5 py-0.5 rounded-md text-xs font-semibold min-w-[20px] text-center
                          ${isActive
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
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
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Vertical layout (original)
  return (
    <aside 
      ref={sidebarRef as any}
      className="hidden lg:block w-64 flex-shrink-0"
    >
      <nav className="sticky top-24 space-y-1">
        <div className="bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200 dark:border-gray-800 p-2 shadow-sm backdrop-blur-sm">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            const isCVRewrite = section.id === 'cv-rewrite';
            
            // CV Rewrite button - generates CV on click
            if (isCVRewrite) {
              return (
                <button
                  key={section.id}
                  onClick={onGenerateCVRewrite}
                  disabled={isGeneratingCV}
                  className={`
                    w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg
                    text-sm font-medium transition-all duration-200
                    ${isGeneratingCV
                      ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 text-purple-700 dark:text-purple-400 cursor-wait'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-gray-100'
                    }
                    disabled:opacity-75
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${isGeneratingCV ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {isGeneratingCV ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        section.icon
                      )}
                    </div>
                    <span>{isGeneratingCV ? 'Generating CV...' : section.label}</span>
                  </div>
                  
                  {section.count !== undefined && !isGeneratingCV && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {section.count}
                    </span>
                  )}
                  
                  {isGeneratingCV && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 animate-pulse">
                      AI
                    </span>
                  )}
                </button>
              );
            }
            
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
  { id: 'cv-rewrite', label: 'CV Rewrite', icon: <PenTool className="w-5 h-5" /> },
  { id: 'action-plan', label: '48H Action Plan', icon: <Clock className="w-5 h-5" /> },
  { id: 'learning', label: 'Learning Path', icon: <GraduationCap className="w-5 h-5" /> },
  { id: 'fit', label: 'Opportunity Fit', icon: <Target className="w-5 h-5" /> },
];


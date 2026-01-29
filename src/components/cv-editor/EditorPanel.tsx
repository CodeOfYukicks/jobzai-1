import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical, Plus, Eye, EyeOff, ChevronDown, ChevronLeft, ChevronRight,
  User, FileText, Briefcase, GraduationCap, Code, Award,
  FolderOpen, Globe, Sparkles, Edit3, Layout, Inbox
} from 'lucide-react';
import { CVData, CVSection, CVLayoutSettings, CVTemplate, SectionClickTarget } from '../../types/cvEditor';
import { CVSuggestion, CVReviewResult, HighlightTarget } from '../../types/cvReview';
import SectionEditor from './SectionEditor';
import { sortSections } from '../../lib/cvEditorUtils';
import LayoutStyleTab from './tabs/LayoutStyleTab';
import TemplatesTab from './tabs/TemplatesTab';
import AIReviewTab from './tabs/AIReviewTab';
import { Palette } from 'lucide-react';

export type TabType = 'ai-review' | 'editor' | 'templates' | 'layout-style';

interface EditorPanelProps {
  cvData: CVData;
  onUpdate: (sectionId: string, updates: any) => void;
  onReorder: (sections: CVSection[]) => void;
  onToggleSection: (sectionId: string) => void;
  layoutSettings: CVLayoutSettings;
  onLayoutSettingsChange: (settings: Partial<CVLayoutSettings>) => void;
  template: CVTemplate;
  onTemplateChange: (template: CVTemplate) => void;
  jobContext?: {
    jobTitle: string;
    company: string;
    jobDescription?: string;
    keywords: string[];
    strengths: string[];
    gaps: string[];
  };
  // Click-to-edit from preview
  activeSectionTarget?: SectionClickTarget | null;
  onActiveSectionProcessed?: () => void;
  // Highlight section in preview from AI review
  onHighlightSection?: (target: HighlightTarget | null) => void;
  // Apply suggestion to CV
  onApplySuggestion?: (suggestion: CVSuggestion) => void;
  // AI Review state managed by parent
  reviewState?: {
    result: CVReviewResult | null;
    ignoredIds: Set<string>;
    hasAnalyzed: boolean;
  };
  onReviewStateChange?: (state: { result: CVReviewResult | null; ignoredIds: Set<string>; hasAnalyzed: boolean }) => void;
  // AI analysis loading and trigger
  isAnalyzing?: boolean;
  onReanalyze?: () => void;
  // Panel collapse
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  // External Tab Control
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

const sectionIcons: Record<string, React.ReactNode> = {
  personal: <User className="w-5 h-5" />,
  summary: <FileText className="w-5 h-5" />,
  experience: <Briefcase className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  skills: <Code className="w-5 h-5" />,
  certifications: <Award className="w-5 h-5" />,
  projects: <FolderOpen className="w-5 h-5" />,
  languages: <Globe className="w-5 h-5" />
};

const sectionIconsSmall: Record<string, React.ReactNode> = {
  personal: <User className="w-5 h-5" />,
  summary: <FileText className="w-5 h-5" />,
  experience: <Briefcase className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  skills: <Code className="w-5 h-5" />,
  certifications: <Award className="w-5 h-5" />,
  projects: <FolderOpen className="w-5 h-5" />,
  languages: <Globe className="w-5 h-5" />
};

export default function EditorPanel({
  cvData,
  onUpdate,
  onReorder,
  onToggleSection,
  layoutSettings,
  onLayoutSettingsChange,
  template,
  onTemplateChange,
  jobContext,
  activeSectionTarget,
  onActiveSectionProcessed,
  onHighlightSection,
  onApplySuggestion,
  reviewState,
  onReviewStateChange,
  isAnalyzing,
  onReanalyze,
  isCollapsed,
  onToggleCollapse,
  activeTab: propsActiveTab,
  onTabChange
}: EditorPanelProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabType>('editor');
  const activeTab = propsActiveTab || internalActiveTab;

  const setActiveTab = (tab: TabType) => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };
  const [expandedSection, setExpandedSection] = useState<string | null>(null); // All sections closed by default
  const [searchQuery, setSearchQuery] = useState('');
  const [externalItemId, setExternalItemId] = useState<string | null>(null);
  const sectionsContainerRef = useRef<HTMLDivElement>(null);

  // Handle applying suggestions from AI Review
  const handleApplySuggestion = (suggestion: CVSuggestion) => {
    console.log('🟡 EditorPanel.handleApplySuggestion called');
    console.log('   Has onApplySuggestion prop:', !!onApplySuggestion);

    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    } else {
      console.error('❌ onApplySuggestion prop is undefined in EditorPanel!');
    }
  };

  // Handle external section activation from CV preview clicks
  useEffect(() => {
    if (activeSectionTarget) {
      // Switch to editor tab
      setActiveTab('editor');

      // Find the section by type
      const targetSection = cvData.sections.find(s => s.type === activeSectionTarget.sectionType);
      if (targetSection) {
        // Expand the section
        setExpandedSection(targetSection.id);

        // If there's an item ID, set it for the SectionEditor
        if (activeSectionTarget.itemId) {
          setExternalItemId(activeSectionTarget.itemId);
        }

        // Scroll to the section after a short delay to allow for animation
        setTimeout(() => {
          const sectionElement = document.getElementById(`section-${targetSection.id}`);
          if (sectionElement && sectionsContainerRef.current) {
            sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }

      // Clear the target
      onActiveSectionProcessed?.();
    }
  }, [activeSectionTarget, cvData.sections, onActiveSectionProcessed]);

  // Clear external item ID after it's been processed
  const handleExternalItemProcessed = () => {
    setExternalItemId(null);
  };

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sections = [...cvData.sections];
    const [reorderedSection] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, reorderedSection);

    // Update order values
    const updatedSections = sections.map((section, index) => ({
      ...section,
      order: index
    }));

    onReorder(updatedSections);
  };



  // Get section data
  const getSectionData = (section: CVSection) => {
    switch (section.type) {
      case 'personal':
        return cvData.personalInfo;
      case 'summary':
        return { summary: cvData.summary };
      case 'experience':
        return { experiences: cvData.experiences };
      case 'education':
        return { education: cvData.education };
      case 'skills':
        return { skills: cvData.skills };
      case 'certifications':
        return { certifications: cvData.certifications };
      case 'projects':
        return { projects: cvData.projects };
      case 'languages':
        return { languages: cvData.languages };
      default:
        return cvData.customSections?.[section.id] || {};
    }
  };

  // Filter sections based on search
  const filteredSections = sortSections(cvData.sections).filter(section => {
    if (!searchQuery) return true;
    return section.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isSectionEmpty = (section: CVSection) => {
    switch (section.type) {
      case 'personal':
        return !cvData.personalInfo.firstName && !cvData.personalInfo.lastName;
      case 'summary':
        return !cvData.summary || cvData.summary.trim() === '';
      case 'experience':
        return cvData.experiences.length === 0;
      case 'education':
        return cvData.education.length === 0;
      case 'skills':
        return cvData.skills.length === 0;
      case 'certifications':
        return cvData.certifications.length === 0;
      case 'projects':
        return cvData.projects.length === 0;
      case 'languages':
        return cvData.languages.length === 0;
      case 'custom':
        return !cvData.customSections?.[section.id]?.content;
      default:
        return false;
    }
  };

  // Collapsed version - just icons
  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-[#242325]">
        {/* Collapsed Header with expand button */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#242325]">
          <div className="px-3 py-3 flex items-center justify-center">
            {onToggleCollapse && (
              <motion.button
                onClick={onToggleCollapse}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#2b2a2c] hover:bg-gray-200 dark:hover:bg-[#3d3c3e] border border-gray-200 dark:border-[#3d3c3e] transition-all duration-200 group"
                aria-label="Expand panel"
                title="Ouvrir le panneau"
              >
                <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Collapsed Sections - Icon only */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 px-2 pb-24 lg:pb-3 space-y-2">
          {sortSections(cvData.sections).map((section) => (
            <motion.button
              key={section.id}
              onClick={() => {
                onToggleCollapse?.();
                setTimeout(() => {
                  setExpandedSection(section.id);
                  setActiveTab('editor');
                }, 300);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative w-full flex items-center justify-center p-2.5 rounded-lg transition-all
                ${section.enabled
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e]'
                  : 'text-gray-400 dark:text-gray-600 opacity-50'
                }
              `}
              title={section.title}
            >
              {sectionIcons[section.type] || <FileText className="w-5 h-5" />}
              {/* AI indicator for sections with AI enhancement */}
              {(section.type === 'summary' || section.type === 'experience' || section.type === 'projects') && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border border-white dark:border-[#242325]">
                  <Sparkles className="w-2 h-2 text-white" />
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-[#242325]">
      {/* Premium Tabs Navigation - Hidden on mobile, handled by bottom sheet */}
      <div className="hidden lg:block flex-shrink-0 border-b border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#242325]">
        <div className="flex items-center overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {/* Tabs Container */}
          <div className="flex items-center px-2 sm:px-4 py-2 gap-1 sm:gap-0">
            {/* AI Review Tab */}
            <button
              onClick={() => setActiveTab('ai-review')}
              className={`
                relative flex items-center gap-1.5 px-3 sm:px-2.5 py-2.5 sm:py-2 text-[13px] font-medium transition-all whitespace-nowrap rounded-lg snap-start
                ${activeTab === 'ai-review'
                  ? 'text-[#635BFF] dark:text-[#a5a0ff] bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50'
                }
              `}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Review</span>
              {activeTab === 'ai-review' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-2 left-2 right-2 h-0.5 bg-[#635BFF] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>

            {/* Editor Tab */}
            <button
              onClick={() => setActiveTab('editor')}
              className={`
                relative flex items-center gap-1.5 px-3 sm:px-2.5 py-2.5 sm:py-2 text-[13px] font-medium transition-all whitespace-nowrap rounded-lg snap-start
                ${activeTab === 'editor'
                  ? 'text-[#635BFF] dark:text-[#a5a0ff] bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50'
                }
              `}
            >
              <Edit3 className="w-4 h-4" />
              <span>Editor</span>
              {activeTab === 'editor' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-2 left-2 right-2 h-0.5 bg-[#635BFF] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>

            {/* Templates Tab */}
            <button
              onClick={() => setActiveTab('templates')}
              className={`
                relative flex items-center gap-1.5 px-3 sm:px-2.5 py-2.5 sm:py-2 text-[13px] font-medium transition-all whitespace-nowrap rounded-lg snap-start
                ${activeTab === 'templates'
                  ? 'text-[#635BFF] dark:text-[#a5a0ff] bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50'
                }
              `}
            >
              <Palette className="w-4 h-4" />
              <span>Templates</span>
              {activeTab === 'templates' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-2 left-2 right-2 h-0.5 bg-[#635BFF] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>

            {/* Layout & Style Tab */}
            <button
              onClick={() => setActiveTab('layout-style')}
              className={`
                relative flex items-center gap-1.5 px-3 sm:px-2.5 py-2.5 sm:py-2 text-[13px] font-medium transition-all whitespace-nowrap rounded-lg snap-start
                ${activeTab === 'layout-style'
                  ? 'text-[#635BFF] dark:text-[#a5a0ff] bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50'
                }
              `}
            >
              <Layout className="w-4 h-4" />
              <span>Style</span>
              {activeTab === 'layout-style' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-2 left-2 right-2 h-0.5 bg-[#635BFF] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Collapse Panel Button - Hidden on mobile */}
          {onToggleCollapse && (
            <motion.button
              onClick={onToggleCollapse}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden lg:flex items-center justify-center w-8 h-8 mr-4 rounded-lg bg-gray-100 dark:bg-[#2b2a2c] hover:bg-gray-200 dark:hover:bg-[#3d3c3e] border border-gray-200 dark:border-[#3d3c3e] transition-all duration-200 group"
              aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
              title="Réduire le panneau"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'ai-review' && (
          <motion.div
            key="ai-review"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="h-full flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            <AIReviewTab
              cvData={cvData}
              jobContext={jobContext}
              onApplySuggestion={handleApplySuggestion}
              reviewState={reviewState}
              onReviewStateChange={onReviewStateChange}
              isAnalyzing={isAnalyzing}
              onReanalyze={onReanalyze}
              onHighlightSection={onHighlightSection}
            />
          </motion.div>
        )}

        {activeTab === 'editor' && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="h-full flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            {/* Detail View (Focus Mode) */}
            {expandedSection && (
              <motion.div
                key="detail-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col bg-white dark:bg-[#1f1e20]"
              >
                {(() => {
                  const section = cvData.sections.find(s => s.id === expandedSection);
                  if (!section) return null;

                  return (
                    <>
                      {/* Detail Header */}
                      <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-100 dark:border-[#3d3c3e]/60">
                        <button
                          onClick={() => setExpandedSection(null)}
                          className="p-1.5 -ml-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-all"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-[#635BFF]/10 text-[#635BFF] dark:text-[#a5a0ff]">
                            {sectionIconsSmall[section.type] || <FileText className="w-4 h-4" />}
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {section.title}
                          </h3>
                        </div>
                      </div>

                      {/* Detail Content */}
                      <div className="flex-1 overflow-y-auto px-4 py-6">
                        <SectionEditor
                          section={section}
                          data={getSectionData(section)}
                          onChange={(updates) => onUpdate(section.id, updates)}
                          jobContext={jobContext}
                          fullCV={JSON.stringify(cvData)}
                          externalEditItemId={externalItemId}
                          onExternalEditProcessed={handleExternalItemProcessed}
                          layoutSettings={layoutSettings}
                          onLayoutSettingsChange={onLayoutSettingsChange}
                          template={template}
                        />
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* List View */}
            {!expandedSection && (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                <div ref={sectionsContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-24 lg:pb-6 pt-3">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="cv-sections">
                      {(provided, droppableSnapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`space-y-2 rounded-xl ${droppableSnapshot.isDraggingOver ? 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10' : ''
                            }`}
                        >
                          {filteredSections.map((section, index) => {
                            const isEmpty = isSectionEmpty(section);
                            const isAiEnhanced = (section.type === 'summary' || section.type === 'experience' || section.type === 'projects');

                            return (
                              <Draggable
                                key={section.id}
                                draggableId={section.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    id={`section-${section.id}`}
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`
                                      group rounded-lg border transition-all duration-200
                                      ${snapshot.isDragging
                                        ? 'shadow-xl ring-1 ring-[#635BFF] bg-white dark:bg-[#2b2a2c] border-[#635BFF] z-50'
                                        : 'bg-white dark:bg-[#242325] border-transparent hover:border-gray-200 dark:hover:border-[#3d3c3e] hover:shadow-sm'
                                      }
                                    `}
                                    style={provided.draggableProps.style}
                                  >
                                    {/* Section Header */}
                                    <div
                                      className="w-full flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                                      onClick={() => setExpandedSection(section.id)}
                                    >
                                      {/* Drag Handle */}
                                      <div
                                        {...provided.dragHandleProps}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`
                                          flex items-center justify-center w-6 h-6 rounded cursor-grab active:cursor-grabbing transition-colors
                                          ${snapshot.isDragging
                                            ? 'text-[#635BFF]'
                                            : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500'
                                          }
                                        `}
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </div>

                                      {/* Section Icon */}
                                      <div className={`
                                        flex items-center justify-center
                                        text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300
                                      `}>
                                        {sectionIconsSmall[section.type] || <FileText className="w-4 h-4" />}
                                      </div>

                                      {/* Section Title */}
                                      <div className="flex-1 flex items-center gap-2 text-left min-w-0">
                                        <h3 className="text-[14px] font-medium truncate transition-colors text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                          {section.title}
                                        </h3>
                                      </div>

                                      {/* Right Side Actions/Badges */}
                                      <div className="flex items-center gap-2">
                                        {/* AI Badge */}
                                        {isAiEnhanced && (
                                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
                                            <Sparkles className="w-2.5 h-2.5" />
                                            AI
                                          </span>
                                        )}

                                        {/* Empty Badge */}
                                        {isEmpty && (
                                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                                            <Inbox className="w-2.5 h-2.5" />
                                            Empty
                                          </span>
                                        )}

                                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  {/* Add Section Button */}
                  <div className="mt-4 px-1">
                    <button
                      onClick={() => {
                        // Placeholder for Add Section functionality
                        console.log('Add Section clicked');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#2b2a2c] transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500">
                        <Plus className="w-3 h-3" />
                      </div>
                      <span className="text-sm font-medium">Add Section</span>
                    </button>
                    <div className="mt-3 text-center">
                      <button className="text-xs text-gray-400 hover:text-[#635BFF] dark:text-gray-500 dark:hover:text-[#a5a0ff] transition-colors border-b border-dashed border-gray-300 dark:border-gray-700 hover:border-[#635BFF] dark:hover:border-[#a5a0ff]">
                        or Reorder & Rename
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="h-full flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            <TemplatesTab
              template={template}
              onTemplateChange={onTemplateChange}
              layoutSettings={layoutSettings}
              onSettingsChange={onLayoutSettingsChange}
            />
          </motion.div>
        )}

        {activeTab === 'layout-style' && (
          <motion.div
            key="layout-style"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="h-full flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            <LayoutStyleTab
              sections={cvData.sections}
              onReorder={onReorder}
              layoutSettings={layoutSettings}
              onSettingsChange={onLayoutSettingsChange}
              template={template}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GripVertical, Plus, Eye, EyeOff, ChevronDown, ChevronLeft, ChevronRight,
  User, FileText, Briefcase, GraduationCap, Code, Award,
  FolderOpen, Globe, Sparkles, Edit3, Layout
} from 'lucide-react';
import { CVData, CVSection, CVLayoutSettings, CVTemplate, SectionClickTarget } from '../../types/cvEditor';
import { CVSuggestion, CVReviewResult, HighlightTarget } from '../../types/cvReview';
import SectionEditor from './SectionEditor';
import { sortSections } from '../../lib/cvEditorUtils';
import LayoutStyleTab from './tabs/LayoutStyleTab';
import TemplatesTab from './tabs/TemplatesTab';
import AIReviewTab from './tabs/AIReviewTab';
import { Palette } from 'lucide-react';

type TabType = 'ai-review' | 'editor' | 'templates' | 'layout-style';

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
  onToggleCollapse
}: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('editor');
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

  // Toggle section expansion - click to open, click again to close
  const toggleExpanded = (sectionId: string) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId);
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

  // Collapsed version - just icons
  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900">
        {/* Collapsed Header with expand button */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-3 py-3 flex items-center justify-center">
            {onToggleCollapse && (
              <motion.button
                onClick={onToggleCollapse}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-200 group"
                aria-label="Expand panel"
                title="Ouvrir le panneau"
              >
                <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Collapsed Sections - Icon only */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-2">
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
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'text-gray-400 dark:text-gray-600 opacity-50'
                }
              `}
              title={section.title}
            >
              {sectionIcons[section.type] || <FileText className="w-5 h-5" />}
              {/* AI indicator for sections with AI enhancement */}
              {(section.type === 'summary' || section.type === 'experience' || section.type === 'projects') && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border border-white dark:border-gray-900">
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
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* Premium Tabs Navigation */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-4 py-3 flex items-center">
          {/* AI Review Tab */}
          <button
            onClick={() => setActiveTab('ai-review')}
            className={`
              relative flex items-center gap-1.5 px-2.5 text-[13px] font-medium transition-all whitespace-nowrap
              ${activeTab === 'ai-review' 
                ? 'text-[#EB7134] dark:text-[#EB7134]' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Review</span>
            {activeTab === 'ai-review' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#EB7134]"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>

          {/* Editor Tab */}
          <button
            onClick={() => setActiveTab('editor')}
            className={`
              relative flex items-center gap-1.5 px-2.5 text-[13px] font-medium transition-all whitespace-nowrap
              ${activeTab === 'editor' 
                ? 'text-[#EB7134] dark:text-[#EB7134]' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <Edit3 className="w-4 h-4" />
            <span>Editor</span>
            {activeTab === 'editor' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#EB7134]"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>

          {/* Templates Tab */}
          <button
            onClick={() => setActiveTab('templates')}
            className={`
              relative flex items-center gap-1.5 px-2.5 text-[13px] font-medium transition-all whitespace-nowrap
              ${activeTab === 'templates' 
                ? 'text-[#EB7134] dark:text-[#EB7134]' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <Palette className="w-4 h-4" />
            <span>Templates</span>
            {activeTab === 'templates' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#EB7134]"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>

          {/* Layout & Style Tab */}
          <button
            onClick={() => setActiveTab('layout-style')}
            className={`
              relative flex items-center gap-1.5 px-2.5 text-[13px] font-medium transition-all whitespace-nowrap
              ${activeTab === 'layout-style' 
                ? 'text-[#EB7134] dark:text-[#EB7134]' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <Layout className="w-4 h-4" />
            <span>Style</span>
            {activeTab === 'layout-style' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#EB7134]"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Collapse Panel Button */}
          {onToggleCollapse && (
            <motion.button
              onClick={onToggleCollapse}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-200 group"
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
            className="flex-1 min-h-0 overflow-hidden flex flex-col"
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
            className="flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            {/* Sections List */}
            <div ref={sectionsContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="cv-sections">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {filteredSections.map((section, index) => (
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
                                group rounded-lg transition-all duration-200 border
                                ${snapshot.isDragging 
                                  ? 'shadow-2xl scale-[1.02] ring-2 ring-[#EB7134] bg-white dark:bg-gray-800 border-[#EB7134]' 
                                  : expandedSection === section.id
                                    ? 'bg-white dark:bg-gray-800 shadow-lg border border-gray-300/70 dark:border-gray-600/70 ring-1 ring-gray-200/50 dark:ring-gray-700/50'
                                    : 'bg-white dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300/80 dark:hover:border-gray-600/80 hover:shadow-md hover:bg-gray-50/30 dark:hover:bg-gray-800/60'
                                }
                              `}
                            >
                              {/* Section Header */}
                              <div 
                                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                                onClick={() => toggleExpanded(section.id)}
                              >
                                {/* Drag Handle - subtle, appears on hover */}
                                <div
                                  {...provided.dragHandleProps}
                                  onClick={(e) => e.stopPropagation()}
                                  className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-all duration-200"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                {/* Section Icon */}
                                <div className={`
                                  transition-colors duration-200
                                  ${expandedSection === section.id 
                                    ? 'text-gray-700 dark:text-gray-300' 
                                    : 'text-gray-500 dark:text-gray-400'
                                  }
                                `}>
                                  {sectionIconsSmall[section.type] || <FileText className="w-5 h-5" />}
                                </div>

                                {/* Section Title */}
                                <div className="flex-1 flex items-center gap-2">
                                  <h3 className={`
                                    text-sm font-semibold transition-colors duration-200
                                    ${expandedSection === section.id 
                                      ? 'text-gray-900 dark:text-white' 
                                      : 'text-gray-600 dark:text-gray-400'
                                    }
                                  `}>
                                    {section.title}
                                  </h3>
                                  {/* AI Badge for sections with AI enhancement */}
                                  {(section.type === 'summary' || section.type === 'experience' || section.type === 'projects') && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      AI
                                    </span>
                                  )}
                                </div>

                                  {/* Toggle Visibility */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleSection(section.id);
                                    }}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                    title={section.enabled ? 'Hide section' : 'Show section'}
                                  >
                                    {section.enabled ? (
                                    <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                    )}
                                  </button>

                                  {/* Expand/Collapse Chevron */}
                                  <ChevronDown 
                                    className={`
                                    w-4 h-4 transition-all duration-200
                                      ${expandedSection === section.id 
                                      ? 'rotate-180 text-gray-600 dark:text-gray-400' 
                                        : 'text-gray-400 dark:text-gray-500'
                                      }
                                    `}
                                  />
                              </div>

                              {/* Section Content */}
                              <AnimatePresence>
                                {expandedSection === section.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 bg-gradient-to-b from-gray-50/30 to-transparent dark:from-gray-900/20">
                                      <SectionEditor
                                        section={section}
                                        data={getSectionData(section)}
                                        onChange={(updates) => onUpdate(section.id, updates)}
                                        jobContext={jobContext}
                                        fullCV={JSON.stringify(cvData)}
                                        externalEditItemId={externalItemId}
                                        onExternalEditProcessed={handleExternalItemProcessed}
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-h-0 overflow-hidden flex flex-col"
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
            className="flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            <LayoutStyleTab 
              sections={cvData.sections} 
              onReorder={onReorder}
              layoutSettings={layoutSettings}
              onSettingsChange={onLayoutSettingsChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

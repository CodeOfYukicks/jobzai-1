import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GripVertical, Plus, Eye, EyeOff, ChevronDown, ChevronRight,
  User, FileText, Briefcase, GraduationCap, Code, Award,
  FolderOpen, Globe, Settings, Sparkles, Edit3, Layout, Search
} from 'lucide-react';
import { CVData, CVSection, CVLayoutSettings, CVTemplate, SectionClickTarget } from '../../types/cvEditor';
import SectionEditor from './SectionEditor';
import { sortSections } from '../../lib/cvEditorUtils';
import LayoutStyleTab from './tabs/LayoutStyleTab';

type TabType = 'ai-review' | 'editor' | 'layout-style';

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
}

const sectionIcons: Record<string, React.ReactNode> = {
  personal: <User className="w-4 h-4" />,
  summary: <FileText className="w-4 h-4" />,
  experience: <Briefcase className="w-4 h-4" />,
  education: <GraduationCap className="w-4 h-4" />,
  skills: <Code className="w-4 h-4" />,
  certifications: <Award className="w-4 h-4" />,
  projects: <FolderOpen className="w-4 h-4" />,
  languages: <Globe className="w-4 h-4" />
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
  onActiveSectionProcessed
}: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('editor');
  const [expandedSection, setExpandedSection] = useState<string | null>(null); // All sections closed by default
  const [searchQuery, setSearchQuery] = useState('');
  const [externalItemId, setExternalItemId] = useState<string | null>(null);
  const sectionsContainerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* Premium Tabs Navigation */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
        <div className="flex items-center px-4">
          {/* AI Review Tab */}
          <button
            onClick={() => setActiveTab('ai-review')}
            className={`
              relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all
              ${activeTab === 'ai-review' 
                ? 'text-[#EB7134] dark:text-[#EB7134]' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Review</span>
            {activeTab === 'ai-review' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EB7134] dark:bg-[#EB7134]"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>

          {/* Editor Tab */}
          <button
            onClick={() => setActiveTab('editor')}
            className={`
              relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all
              ${activeTab === 'editor' 
                ? 'text-[#EB7134] dark:text-[#EB7134]' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <Edit3 className="w-4 h-4" />
            <span>Editor</span>
            {activeTab === 'editor' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EB7134] dark:bg-[#EB7134]"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>

          {/* Layout & Style Tab */}
          <button
            onClick={() => setActiveTab('layout-style')}
            className={`
              relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all
              ${activeTab === 'layout-style' 
                ? 'text-[#EB7134] dark:text-[#EB7134]' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <Layout className="w-4 h-4" />
            <span>Layout & Style</span>
            {activeTab === 'layout-style' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EB7134] dark:bg-[#EB7134]"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
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
            className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center p-8"
          >
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#EB7134]/10 dark:bg-[#EB7134]/20 mb-4">
                <Sparkles className="w-8 h-8 text-[#EB7134] dark:text-[#EB7134]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                AI Review Coming Soon
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get intelligent feedback and suggestions to improve your CV with AI-powered analysis.
              </p>
            </div>
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
                      className="space-y-1.5"
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
                                group rounded-md transition-all duration-200 border
                                ${snapshot.isDragging 
                                  ? 'shadow-2xl scale-[1.02] ring-2 ring-[#EB7134] bg-white dark:bg-gray-800 border-[#EB7134]' 
                                  : expandedSection === section.id
                                    ? 'bg-white dark:bg-gray-800 shadow-xl border-2 border-[#EB7134] dark:border-[#EB7134]'
                                    : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                                }
                              `}
                            >
                              {/* Section Header */}
                              <div 
                                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                                onClick={() => toggleExpanded(section.id)}
                              >
                                {/* Drag Handle - subtle, appears on hover */}
                                <div
                                  {...provided.dragHandleProps}
                                  onClick={(e) => e.stopPropagation()}
                                  className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-opacity"
                                >
                                  <GripVertical className="w-3 h-3" />
                                </div>

                                {/* Section Icon */}
                                <div className={`
                                  transition-colors
                                  ${expandedSection === section.id 
                                    ? 'text-[#EB7134] dark:text-[#EB7134]' 
                                    : 'text-gray-500 dark:text-gray-400'
                                  }
                                `}>
                                  {sectionIcons[section.type] || <FileText className="w-3 h-3" />}
                                </div>

                                {/* Section Title */}
                                <div className="flex-1">
                                  <h3 className={`
                                    text-xs font-semibold transition-colors
                                    ${expandedSection === section.id 
                                      ? 'text-gray-900 dark:text-white' 
                                      : 'text-gray-600 dark:text-gray-400'
                                    }
                                  `}>
                                    {section.title}
                                  </h3>
                                </div>

                                {/* Toggle Visibility */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSection(section.id);
                                  }}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                  title={section.enabled ? 'Hide section' : 'Show section'}
                                >
                                  {section.enabled ? (
                                    <Eye className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                  ) : (
                                    <EyeOff className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                  )}
                                </button>

                                {/* Expand/Collapse Chevron */}
                                <ChevronDown 
                                  className={`
                                    w-3 h-3 transition-all duration-200
                                    ${expandedSection === section.id 
                                      ? 'rotate-180 text-[#EB7134] dark:text-[#EB7134]' 
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
                                    <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
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
              template={template}
              onTemplateChange={onTemplateChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

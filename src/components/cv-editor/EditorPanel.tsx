import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GripVertical, Plus, Eye, EyeOff, ChevronDown, ChevronRight,
  User, FileText, Briefcase, GraduationCap, Code, Award,
  FolderOpen, Globe, Settings
} from 'lucide-react';
import { CVData, CVSection } from '../../types/cvEditor';
import SectionEditor from './SectionEditor';
import { sortSections } from '../../lib/cvEditorUtils';

interface EditorPanelProps {
  cvData: CVData;
  onUpdate: (sectionId: string, updates: any) => void;
  onReorder: (sections: CVSection[]) => void;
  onToggleSection: (sectionId: string) => void;
  jobContext?: {
    jobTitle: string;
    company: string;
    jobDescription?: string;
    keywords: string[];
    strengths: string[];
    gaps: string[];
  };
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
  jobContext
}: EditorPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['personal', 'summary', 'experience']) // Default expanded sections
  );
  const [searchQuery, setSearchQuery] = useState('');

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

  // Toggle section expansion
  const toggleExpanded = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            CV Sections
          </h2>
          <button
            onClick={() => {
              // TODO: Add new section functionality
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Add section"
          >
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-9 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="cv-sections">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="p-4 space-y-3"
              >
                {filteredSections.map((section, index) => (
                  <Draggable
                    key={section.id}
                    draggableId={section.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`
                          bg-white dark:bg-gray-800 rounded-lg border transition-all
                          ${snapshot.isDragging 
                            ? 'border-purple-400 shadow-lg scale-[1.02]' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        {/* Section Header */}
                        <div className="flex items-center gap-3 p-4">
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>

                          {/* Section Icon */}
                          <div className="text-gray-500 dark:text-gray-400">
                            {sectionIcons[section.type] || <FileText className="w-4 h-4" />}
                          </div>

                          {/* Section Title */}
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {section.title}
                            </h3>
                          </div>

                          {/* Toggle Visibility */}
                          <button
                            onClick={() => onToggleSection(section.id)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title={section.enabled ? 'Hide section' : 'Show section'}
                          >
                            {section.enabled ? (
                              <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>

                          {/* Expand/Collapse */}
                          <button
                            onClick={() => toggleExpanded(section.id)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {expandedSections.has(section.id) ? (
                              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            )}
                          </button>
                        </div>

                        {/* Section Content */}
                        <AnimatePresence>
                          {expandedSections.has(section.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-gray-100 dark:border-gray-700 overflow-hidden"
                            >
                              <div className="p-4">
                                <SectionEditor
                                  section={section}
                                  data={getSectionData(section)}
                                  onChange={(updates) => onUpdate(section.id, updates)}
                                  jobContext={jobContext}
                                  fullCV={JSON.stringify(cvData)}
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

      {/* Footer Tips */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Drag sections to reorder • Click eye icon to show/hide • Expand to edit
        </p>
      </div>
    </div>
  );
}

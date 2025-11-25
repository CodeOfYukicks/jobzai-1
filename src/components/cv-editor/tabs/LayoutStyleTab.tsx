import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  GripVertical, User, FileText, Briefcase, GraduationCap, 
  Code, Award, FolderOpen, Globe, Lock, Minus, Plus,
  ChevronDown, Edit3, Type
} from 'lucide-react';
import { CVSection, CVLayoutSettings } from '../../../types/cvEditor';
import { sortSections } from '../../../lib/cvEditorUtils';

interface LayoutStyleTabProps {
  sections: CVSection[];
  onReorder: (sections: CVSection[]) => void;
  layoutSettings: CVLayoutSettings;
  onSettingsChange: (settings: Partial<CVLayoutSettings>) => void;
}

// Premium font families with their categories
const PREMIUM_FONTS = [
  { 
    name: 'Inter', 
    category: 'Sans-Serif',
    description: 'Modern, clean, excellent readability'
  },
  { 
    name: 'Playfair Display', 
    category: 'Serif',
    description: 'Elegant serif for executive CVs'
  },
  { 
    name: 'Montserrat', 
    category: 'Sans-Serif',
    description: 'Geometric, professional'
  },
  { 
    name: 'Lora', 
    category: 'Serif',
    description: 'Contemporary serif, sophisticated'
  },
  { 
    name: 'Raleway', 
    category: 'Sans-Serif',
    description: 'Elegant, refined'
  },
  { 
    name: 'Merriweather', 
    category: 'Serif',
    description: 'Highly readable serif'
  },
  { 
    name: 'Poppins', 
    category: 'Sans-Serif',
    description: 'Modern geometric, friendly'
  },
  { 
    name: 'Source Sans Pro', 
    category: 'Sans-Serif',
    description: 'Clean, professional'
  }
];

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

const lockedSections = ['personal', 'contact', 'links'];

export default function LayoutStyleTab({ sections, onReorder, layoutSettings, onSettingsChange }: LayoutStyleTabProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  // Debounce fontSize changes to avoid too many re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      // Already managed by parent
    }, 100);
    return () => clearTimeout(timer);
  }, [layoutSettings.fontSize]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sortedSections = sortSections(sections);
    const [reorderedSection] = sortedSections.splice(result.source.index, 1);
    sortedSections.splice(result.destination.index, 0, reorderedSection);

    const updatedSections = sortedSections.map((section, index) => ({
      ...section,
      order: index
    }));

    onReorder(updatedSections);
  };

  const startEditingTitle = (sectionId: string, currentTitle: string) => {
    setEditingSection(sectionId);
    setTempTitle(currentTitle);
  };

  const saveTitle = () => {
    // TODO: Implement title save
    setEditingSection(null);
  };

  const sortedSections = sortSections(sections);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Section Order & Titles */}
        <div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Section Order & Titles
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Drag to reorder sections, click to edit titles
            </p>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="layout-sections">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {sortedSections.map((section, index) => {
                    const isLocked = lockedSections.includes(section.type);
                    
                    return (
                      <Draggable
                        key={section.id}
                        draggableId={section.id}
                        index={index}
                        isDragDisabled={isLocked}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border transition-all
                              ${snapshot.isDragging 
                                ? 'shadow-xl scale-[1.02] ring-2 ring-[#EB7134]' 
                                : 'shadow-sm border-gray-200 dark:border-gray-700'
                              }
                              ${isLocked ? 'opacity-60' : ''}
                            `}
                          >
                            {/* Drag Handle or Lock Icon */}
                            <div
                              {...provided.dragHandleProps}
                              className={`
                                ${isLocked 
                                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                                  : 'text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing hover:text-gray-600 dark:hover:text-gray-400'
                                }
                              `}
                            >
                              {isLocked ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <GripVertical className="w-4 h-4" />
                              )}
                            </div>

                            {/* Section Icon */}
                            <div className="text-gray-500 dark:text-gray-400">
                              {sectionIcons[section.type] || <FileText className="w-4 h-4" />}
                            </div>

                            {/* Section Title - Editable */}
                            <div className="flex-1">
                              {editingSection === section.id ? (
                                <input
                                  type="text"
                                  value={tempTitle}
                                  onChange={(e) => setTempTitle(e.target.value)}
                                  onBlur={saveTitle}
                                  onKeyPress={(e) => e.key === 'Enter' && saveTitle()}
                                  autoFocus
                                  className="w-full px-2 py-1 text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-[#EB7134]/30 dark:border-[#EB7134]/60 rounded focus:outline-none focus:ring-2 focus:ring-[#EB7134]"
                                />
                              ) : (
                                <button
                                  onClick={() => !isLocked && startEditingTitle(section.id, section.title)}
                                  className={`
                                    text-sm font-medium text-gray-900 dark:text-white text-left
                                    ${!isLocked && 'hover:text-[#EB7134] dark:hover:text-[#EB7134]'}
                                  `}
                                  disabled={isLocked}
                                >
                                  {section.title}
                                </button>
                              )}
                            </div>

                            {/* Edit Icon */}
                            {!isLocked && editingSection !== section.id && (
                              <button
                                onClick={() => startEditingTitle(section.id, section.title)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                              </button>
                            )}
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
        </div>

        {/* Locked Sections Info */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Locked Sections for Template
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Contact and Links sections are locked and cannot be reordered or renamed to maintain template consistency.
              </p>
            </div>
          </div>
        </div>

        {/* Other Settings */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Other Settings
          </h3>

          <div className="space-y-6">
            {/* Font Size */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
                Font Size
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onSettingsChange({ fontSize: Math.max(8, layoutSettings.fontSize - 1) })}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={layoutSettings.fontSize <= 8}
                >
                  <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="range"
                      min="8"
                      max="14"
                      value={layoutSettings.fontSize}
                      onChange={(e) => onSettingsChange({ fontSize: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#EB7134]"
                    />
                  </div>
                </div>

                <button
                  onClick={() => onSettingsChange({ fontSize: Math.min(14, layoutSettings.fontSize + 1) })}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={layoutSettings.fontSize >= 14}
                >
                  <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>

                <div className="w-12 text-center">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {layoutSettings.fontSize}
                  </span>
                </div>
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
                Font Family
              </label>
              <div className="relative">
                <select
                  value={layoutSettings.fontFamily}
                  onChange={(e) => onSettingsChange({ fontFamily: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-transparent appearance-none cursor-pointer transition-all"
                  style={{ fontFamily: layoutSettings.fontFamily }}
                >
                  <optgroup label="Sans-Serif">
                    {PREMIUM_FONTS.filter(f => f.category === 'Sans-Serif').map(font => (
                      <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                        {font.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Serif">
                    {PREMIUM_FONTS.filter(f => f.category === 'Serif').map(font => (
                      <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                        {font.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <Type className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {PREMIUM_FONTS.find(f => f.name === layoutSettings.fontFamily)?.description}
              </p>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
                Date Format
              </label>
              <div className="relative">
                <select
                  value={layoutSettings.dateFormat}
                  onChange={(e) => onSettingsChange({ dateFormat: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-transparent appearance-none cursor-pointer transition-all"
                >
                  <option value="jan-24">Jan '24 (Short Name & Year)</option>
                  <option value="january-2024">January 2024 (Full Name & Year)</option>
                  <option value="01-2024">01/2024 (Numeric)</option>
                  <option value="2024-01">2024-01 (ISO Format)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Preview: {layoutSettings.dateFormat === 'jan-24' && "Jan '24"}
                {layoutSettings.dateFormat === 'january-2024' && 'January 2024'}
                {layoutSettings.dateFormat === '01-2024' && '01/2024'}
                {layoutSettings.dateFormat === '2024-01' && '2024-01'}
              </p>
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
                Line Height
              </label>
              <div className="relative">
                <select
                  value={layoutSettings.lineHeight}
                  onChange={(e) => onSettingsChange({ lineHeight: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-transparent appearance-none cursor-pointer transition-all"
                >
                  <option value="1.0">1.0 (Compact)</option>
                  <option value="1.3">1.3 (Standard)</option>
                  <option value="1.5">1.5 (Comfortable)</option>
                  <option value="2.0">2.0 (Spacious)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


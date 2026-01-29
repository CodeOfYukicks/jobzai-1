import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical, User, FileText, Briefcase, GraduationCap,
  Code, Award, FolderOpen, Globe, Lock, Minus, Plus,
  ChevronDown, ChevronRight, Edit3, Type, Check, Palette,
  Calendar, AlignLeft, Layers, LayoutPanelLeft, LayoutList
} from 'lucide-react';
import { CVSection, CVLayoutSettings, CVColorScheme, CVTemplate } from '../../../types/cvEditor';
import { sortSections } from '../../../lib/cvEditorUtils';
import { TEMPLATE_INFO } from '../TemplateCard';

// Define template layouts - which sections go in sidebar vs main content
interface TemplateLayout {
  hasSidebar: boolean;
  sidebarSections: string[];
  mainSections: string[];
}

const TEMPLATE_LAYOUTS: Record<CVTemplate, TemplateLayout> = {
  'modern-professional': {
    hasSidebar: false,
    sidebarSections: [],
    mainSections: ['summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'languages']
  },
  'executive-classic': {
    // Two-column: Left (70%) = Summary, Experience, Projects | Right (30%) = Education, Skills, Certifications, Languages
    hasSidebar: true,
    sidebarSections: ['education', 'skills', 'certifications', 'languages'],
    mainSections: ['summary', 'experience', 'projects']
  },
  'tech-minimalist': {
    hasSidebar: false,
    sidebarSections: [],
    mainSections: ['summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'languages']
  },
  'creative-balance': {
    // Grid layout: Main (2/3) = Experience, Projects | Sidebar (1/3) = Skills, Education, Certifications, Languages
    // Note: Summary is above the grid (treated as main)
    hasSidebar: true,
    sidebarSections: ['skills', 'education', 'certifications', 'languages'],
    mainSections: ['summary', 'experience', 'projects']
  },
  'harvard-classic': {
    hasSidebar: false,
    sidebarSections: [],
    mainSections: ['summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'languages']
  },
  'swiss-photo': {
    // Two-column: Left sidebar = Personal, Skills, Education, Languages, Certifications | Right = Summary, Experience, Projects
    hasSidebar: true,
    sidebarSections: ['skills', 'education', 'languages', 'certifications'],
    mainSections: ['summary', 'experience', 'projects']
  },
  'corporate-photo': {
    // Two-column with sidebar containing Skills, Education, Languages, Certifications
    hasSidebar: true,
    sidebarSections: ['skills', 'education', 'languages', 'certifications'],
    mainSections: ['summary', 'experience', 'projects']
  },
  'elegant-simple': {
    hasSidebar: false,
    sidebarSections: [],
    mainSections: ['summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'languages']
  }
};

interface LayoutStyleTabProps {
  sections: CVSection[];
  onReorder: (sections: CVSection[]) => void;
  layoutSettings: CVLayoutSettings;
  onSettingsChange: (settings: Partial<CVLayoutSettings>) => void;
  template: CVTemplate;
}

// Premium font families with their categories
const PREMIUM_FONTS = [
  {
    name: 'Inter',
    category: 'Sans-Serif',
    description: 'Modern, clean, excellent readability',
    preview: 'The quick brown fox'
  },
  {
    name: 'Playfair Display',
    category: 'Serif',
    description: 'Elegant serif for executive CVs',
    preview: 'The quick brown fox'
  },
  {
    name: 'Montserrat',
    category: 'Sans-Serif',
    description: 'Geometric, professional',
    preview: 'The quick brown fox'
  },
  {
    name: 'Lora',
    category: 'Serif',
    description: 'Contemporary serif, sophisticated',
    preview: 'The quick brown fox'
  },
  {
    name: 'Raleway',
    category: 'Sans-Serif',
    description: 'Elegant, refined',
    preview: 'The quick brown fox'
  },
  {
    name: 'Merriweather',
    category: 'Serif',
    description: 'Highly readable serif',
    preview: 'The quick brown fox'
  },
  {
    name: 'Poppins',
    category: 'Sans-Serif',
    description: 'Modern geometric, friendly',
    preview: 'The quick brown fox'
  },
  {
    name: 'Source Sans Pro',
    category: 'Sans-Serif',
    description: 'Clean, professional',
    preview: 'The quick brown fox'
  }
];

// Color swatches for accent color
const COLOR_SWATCHES: { id: CVColorScheme; name: string; hex: string; ring: string }[] = [
  { id: 'slate', name: 'Slate', hex: '#475569', ring: 'ring-slate-500' },
  { id: 'charcoal', name: 'Charcoal', hex: '#1f2937', ring: 'ring-gray-800' },
  { id: 'blue', name: 'Classic Blue', hex: '#2563eb', ring: 'ring-blue-500' },
  { id: 'orange', name: 'Vibrant Orange', hex: '#ea580c', ring: 'ring-orange-500' },
  { id: 'teal', name: 'Modern Teal', hex: '#0d9488', ring: 'ring-teal-500' },
  { id: 'emerald', name: 'Fresh Green', hex: '#059669', ring: 'ring-emerald-500' },
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

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
  badge
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`
      transition-all duration-200
      ${isOpen
        ? 'bg-gray-50/50 dark:bg-[#2b2a2c]/30 rounded-xl border border-gray-100 dark:border-[#3d3c3e]/60'
        : 'hover:bg-gray-50 dark:hover:bg-[#2b2a2c]/30 rounded-lg'
      }
    `}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 cursor-pointer"
      >
        <div className={`
          flex items-center justify-center p-1.5 rounded-lg transition-colors
          ${isOpen
            ? 'bg-[#635BFF]/10 text-[#635BFF] dark:text-[#a5a0ff]'
            : 'bg-gray-100 dark:bg-[#2b2a2c] text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
          }
        `}>
          <Icon className="w-4 h-4" />
        </div>

        <span className={`
          flex-1 text-left text-[14px] font-medium transition-colors
          ${isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}
        `}>
          {title}
        </span>

        {badge && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700">
            {badge}
          </span>
        )}

        <ChevronRight className={`
          w-4 h-4 text-gray-400 transition-transform duration-200
          ${isOpen ? 'rotate-90' : ''}
        `} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-4 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Premium Slider Component
function PremiumSlider({
  value,
  onChange,
  min,
  max,
  label,
  valueSuffix = '',
  showTicks = true,
  tickLabels,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  valueSuffix?: string;
  showTicks?: boolean;
  tickLabels?: string[];
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  const tickCount = tickLabels?.length || 5;
  const ticks = tickLabels || Array.from({ length: tickCount }, (_, i) =>
    String(Math.round(min + (i * (max - min)) / (tickCount - 1)))
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="px-2.5 py-1 text-xs font-semibold bg-[#635BFF]/10 text-[#635BFF] dark:bg-[#635BFF]/20 dark:text-[#a5a0ff] rounded-full tabular-nums">
          {value}{valueSuffix}
        </span>
      </div>
      <div className="relative pt-1 pb-1">
        <div className="relative h-2 bg-gray-100 dark:bg-[#2b2a2c] rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#635BFF] to-[#8B5CF6] rounded-full"
            initial={false}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-200 rounded-full shadow-lg border-2 border-[#635BFF] cursor-pointer pointer-events-none"
          initial={false}
          animate={{ left: `calc(${percentage}% - 10px)` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{ marginTop: '4px' }}
        />
      </div>
      {showTicks && (
        <div className="flex justify-between px-0.5">
          {ticks.map((tick, i) => (
            <span
              key={i}
              className={`text-[10px] tabular-nums transition-colors ${i <= (percentage / 100) * (tickCount - 1)
                ? 'text-[#635BFF]/70 dark:text-[#a5a0ff]/70'
                : 'text-gray-400 dark:text-gray-600'
                }`}
            >
              {tick}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Visual Font Picker Component
function FontPicker({
  selectedFont,
  onSelect,
}: {
  selectedFont: string;
  onSelect: (font: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedFontData = PREMIUM_FONTS.find(f => f.name === selectedFont);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#2b2a2c]/60 border border-gray-200 dark:border-[#3d3c3e]/60 rounded-xl hover:border-[#635BFF]/50 dark:hover:border-[#635BFF]/30 transition-all group"
      >
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#3d3c3e]/50 group-hover:bg-[#635BFF]/10 transition-colors">
          <Type className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-[#635BFF]" />
        </div>
        <div className="flex-1 text-left">
          <p
            className="text-sm font-semibold text-gray-900 dark:text-white"
            style={{ fontFamily: selectedFont }}
          >
            {selectedFont}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {selectedFontData?.description}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e] rounded-xl shadow-xl z-20 overflow-hidden max-h-[320px] overflow-y-auto"
            >
              {/* Sans-Serif Group */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-[#2b2a2c]/50 sticky top-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Sans-Serif
                </span>
              </div>
              {PREMIUM_FONTS.filter(f => f.category === 'Sans-Serif').map(font => (
                <button
                  key={font.name}
                  onClick={() => { onSelect(font.name); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedFont === font.name ? 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10' : ''
                    }`}
                >
                  <div className="flex-1 text-left">
                    <p
                      className="text-sm text-gray-900 dark:text-white"
                      style={{ fontFamily: font.name }}
                    >
                      {font.name}
                    </p>
                    <p
                      className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                      style={{ fontFamily: font.name }}
                    >
                      {font.preview}
                    </p>
                  </div>
                  {selectedFont === font.name && (
                    <Check className="w-4 h-4 text-[#635BFF]" />
                  )}
                </button>
              ))}

              {/* Serif Group */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-[#2b2a2c]/50 sticky top-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Serif
                </span>
              </div>
              {PREMIUM_FONTS.filter(f => f.category === 'Serif').map(font => (
                <button
                  key={font.name}
                  onClick={() => { onSelect(font.name); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedFont === font.name ? 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10' : ''
                    }`}
                >
                  <div className="flex-1 text-left">
                    <p
                      className="text-sm text-gray-900 dark:text-white"
                      style={{ fontFamily: font.name }}
                    >
                      {font.name}
                    </p>
                    <p
                      className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                      style={{ fontFamily: font.name }}
                    >
                      {font.preview}
                    </p>
                  </div>
                  {selectedFont === font.name && (
                    <Check className="w-4 h-4 text-[#635BFF]" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Color Swatch Picker Component
function ColorSwatchPicker({
  selectedColor,
  onSelect,
}: {
  selectedColor: CVColorScheme;
  onSelect: (color: CVColorScheme) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
          Accent Color
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {COLOR_SWATCHES.find(c => c.id === selectedColor)?.name}
        </span>
      </div>
      <div className="flex gap-2.5 flex-wrap">
        {COLOR_SWATCHES.map(color => (
          <motion.button
            key={color.id}
            onClick={() => onSelect(color.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-9 h-9 rounded-xl transition-all ${selectedColor === color.id
              ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ' + color.ring
              : 'hover:ring-2 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 hover:ring-gray-300 dark:hover:ring-gray-600'
              }`}
            style={{ backgroundColor: color.hex }}
            title={color.name}
          >
            {selectedColor === color.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white drop-shadow-sm" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Option Selector Component (for Date Format, Line Height)
function OptionSelector({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: string | number; label: string; preview?: string }[];
  value: string | number;
  onChange: (value: string | number) => void;
  label: string;
}) {
  return (
    <div className="space-y-3">
      <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <div className="grid grid-cols-2 gap-2">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-start px-3 py-2.5 rounded-xl border transition-all text-left ${value === option.value
              ? 'border-[#635BFF] bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
              : 'border-gray-200 dark:border-[#3d3c3e]/60 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-[#2b2a2c]/40'
              }`}
          >
            <span className={`text-sm font-medium ${value === option.value
              ? 'text-[#635BFF] dark:text-[#a5a0ff]'
              : 'text-gray-900 dark:text-white'
              }`}>
              {option.preview || option.label}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LayoutStyleTab({ sections, onReorder, layoutSettings, onSettingsChange, template }: LayoutStyleTabProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  // Check if current template supports colors
  const templateInfo = TEMPLATE_INFO.find(t => t.value === template);
  const hasColors = (templateInfo?.availableColors?.length ?? 0) > 0;

  // Get template layout configuration
  const templateLayout = TEMPLATE_LAYOUTS[template] || TEMPLATE_LAYOUTS['modern-professional'];

  // Debounce fontSize changes to avoid too many re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      // Already managed by parent
    }, 100);
    return () => clearTimeout(timer);
  }, [layoutSettings.fontSize]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // If template has sidebar, only allow reordering within same column
    if (templateLayout.hasSidebar) {
      // Check if both source and destination are in same droppable
      if (source.droppableId !== destination.droppableId) {
        return; // Don't allow moving between sidebar and main
      }
    }

    // Get sections for the specific droppable
    const sortedSections = sortSections(sections);

    if (templateLayout.hasSidebar) {
      // Separate sections into sidebar and main
      const sidebarSections = sortedSections.filter(s => templateLayout.sidebarSections.includes(s.type));
      const mainSections = sortedSections.filter(s =>
        templateLayout.mainSections.includes(s.type) && s.type !== 'personal'
      );

      if (source.droppableId === 'sidebar-sections') {
        // Reorder within sidebar
        const [reorderedSection] = sidebarSections.splice(source.index, 1);
        sidebarSections.splice(destination.index, 0, reorderedSection);

        // Recombine and reorder
        const personalSection = sortedSections.find(s => s.type === 'personal');
        const allSections = [
          ...(personalSection ? [personalSection] : []),
          ...mainSections,
          ...sidebarSections
        ];

        const updatedSections = allSections.map((section, index) => ({
          ...section,
          order: index
        }));

        onReorder(updatedSections);
      } else if (source.droppableId === 'main-sections') {
        // Reorder within main
        const [reorderedSection] = mainSections.splice(source.index, 1);
        mainSections.splice(destination.index, 0, reorderedSection);

        // Recombine and reorder
        const personalSection = sortedSections.find(s => s.type === 'personal');
        const allSections = [
          ...(personalSection ? [personalSection] : []),
          ...mainSections,
          ...sidebarSections
        ];

        const updatedSections = allSections.map((section, index) => ({
          ...section,
          order: index
        }));

        onReorder(updatedSections);
      }
    } else {
      // Single column - all sections can be reordered freely
      const reorderableSections = sortedSections.filter(s => !lockedSections.includes(s.type));
      const [reorderedSection] = reorderableSections.splice(source.index, 1);
      reorderableSections.splice(destination.index, 0, reorderedSection);

      // Combine locked sections (personal) at the start with reordered sections
      const lockedAtStart = sortedSections.filter(s => lockedSections.includes(s.type));
      const allSections = [...lockedAtStart, ...reorderableSections];

      const updatedSections = allSections.map((section, index) => ({
        ...section,
        order: index
      }));

      onReorder(updatedSections);
    }
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

  // Separate sections for sidebar templates
  const sidebarSectionsList = templateLayout.hasSidebar
    ? sortedSections.filter(s => templateLayout.sidebarSections.includes(s.type))
    : [];
  const mainSectionsList = templateLayout.hasSidebar
    ? sortedSections.filter(s => templateLayout.mainSections.includes(s.type) && s.type !== 'personal')
    : sortedSections.filter(s => !lockedSections.includes(s.type));

  return (
    <div className="h-full flex-1 min-h-0 overflow-y-auto overscroll-contain pt-3">
      <div className="px-3 pb-24 lg:pb-6 space-y-2">
        {/* Section Order - Collapsible */}
        <CollapsibleSection
          title="Section Order & Titles"
          icon={Layers}
          badge={`${sortedSections.length}`}
        >
          <DragDropContext onDragEnd={handleDragEnd}>
            {templateLayout.hasSidebar ? (
              /* Two-column layout for templates with sidebar */
              <div className="space-y-4">
                {/* Main Content Sections */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutList className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Main Content
                    </span>
                  </div>
                  <Droppable droppableId="main-sections">
                    {(provided, droppableSnapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-1.5 rounded-lg p-2 border-2 border-dashed transition-colors ${droppableSnapshot.isDraggingOver
                          ? 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10 border-[#635BFF]/30'
                          : 'border-gray-200 dark:border-[#3d3c3e]/60'
                          }`}
                      >
                        {mainSectionsList.map((section, index) => (
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
                                  group flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                  ${snapshot.isDragging
                                    ? 'bg-white dark:bg-[#2b2a2c] shadow-2xl ring-2 ring-[#635BFF] z-50'
                                    : 'bg-white dark:bg-[#2b2a2c] border border-gray-100 dark:border-[#3d3c3e]/60'
                                  }
                                `}
                                style={provided.draggableProps.style}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className={`
                                    flex-shrink-0 p-1.5 rounded-lg transition-all duration-200
                                    text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-800
                                    ${snapshot.isDragging ? 'text-[#635BFF] bg-[#635BFF]/10' : ''}
                                  `}
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                                <div className={`flex-shrink-0 transition-colors duration-200 ${snapshot.isDragging ? 'text-[#635BFF]' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                  {sectionIcons[section.type] || <FileText className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {section.title}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {mainSectionsList.length === 0 && (
                          <div className="text-center py-3 text-xs text-gray-400">
                            No main sections enabled
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Sidebar Sections */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutPanelLeft className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Sidebar
                    </span>
                  </div>
                  <Droppable droppableId="sidebar-sections">
                    {(provided, droppableSnapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-1.5 rounded-lg p-2 border-2 border-dashed transition-colors ${droppableSnapshot.isDraggingOver
                          ? 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10 border-[#635BFF]/30'
                          : 'border-gray-200 dark:border-[#3d3c3e]/60'
                          }`}
                      >
                        {sidebarSectionsList.map((section, index) => (
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
                                  group flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                  ${snapshot.isDragging
                                    ? 'bg-white dark:bg-[#2b2a2c] shadow-2xl ring-2 ring-[#635BFF] z-50'
                                    : 'bg-white dark:bg-[#2b2a2c] border border-gray-100 dark:border-[#3d3c3e]/60'
                                  }
                                `}
                                style={provided.draggableProps.style}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className={`
                                    flex-shrink-0 p-1.5 rounded-lg transition-all duration-200
                                    text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-800
                                    ${snapshot.isDragging ? 'text-[#635BFF] bg-[#635BFF]/10' : ''}
                                  `}
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                                <div className={`flex-shrink-0 transition-colors duration-200 ${snapshot.isDragging ? 'text-[#635BFF]' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                  {sectionIcons[section.type] || <FileText className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {section.title}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {sidebarSectionsList.length === 0 && (
                          <div className="text-center py-3 text-xs text-gray-400">
                            No sidebar sections enabled
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Info notice for two-column layouts */}
                <div className="flex items-start gap-2 px-3 py-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                  <LayoutPanelLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    This template has a two-column layout. Sections can only be reordered within their own column (Main or Sidebar).
                  </p>
                </div>
              </div>
            ) : (
              /* Single column layout */
              <>
                <Droppable droppableId="layout-sections">
                  {(provided, droppableSnapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-1.5 rounded-lg ${droppableSnapshot.isDraggingOver ? 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10' : ''
                        }`}
                    >
                      {sortedSections.map((section, index) => {
                        const isLocked = lockedSections.includes(section.type);

                        // For single column, only render non-locked sections in the droppable
                        if (isLocked) {
                          return (
                            <div
                              key={section.id}
                              className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50/50 dark:bg-[#2b2a2c]/20 border border-transparent"
                            >
                              <div className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 dark:text-gray-600 cursor-not-allowed">
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                                {sectionIcons[section.type] || <FileText className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="block text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                  {section.title}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        // Find the index within non-locked sections
                        const nonLockedIndex = sortedSections
                          .filter(s => !lockedSections.includes(s.type))
                          .findIndex(s => s.id === section.id);

                        return (
                          <Draggable
                            key={section.id}
                            draggableId={section.id}
                            index={nonLockedIndex}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`
                                  group flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                  ${snapshot.isDragging
                                    ? 'bg-white dark:bg-[#2b2a2c] shadow-2xl ring-2 ring-[#635BFF] z-50'
                                    : 'bg-white dark:bg-[#2b2a2c] border border-gray-100 dark:border-[#3d3c3e]/60 hover:border-gray-200 dark:hover:border-[#3d3c3e]'
                                  }
                                `}
                                style={provided.draggableProps.style}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className={`
                                    flex-shrink-0 p-1.5 rounded-lg transition-all duration-200
                                    text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-800
                                    ${snapshot.isDragging ? 'text-[#635BFF] bg-[#635BFF]/10' : ''}
                                  `}
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                                <div className={`flex-shrink-0 transition-colors duration-200 ${snapshot.isDragging ? 'text-[#635BFF]' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                  {sectionIcons[section.type] || <FileText className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {editingSection === section.id ? (
                                    <input
                                      type="text"
                                      value={tempTitle}
                                      onChange={(e) => setTempTitle(e.target.value)}
                                      onBlur={saveTitle}
                                      onKeyPress={(e) => e.key === 'Enter' && saveTitle()}
                                      autoFocus
                                      className="w-full px-2 py-1 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-[#3d3c3e] border border-[#635BFF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30"
                                    />
                                  ) : (
                                    <span
                                      onClick={() => startEditingTitle(section.id, section.title)}
                                      className="block text-sm font-medium text-gray-900 dark:text-white truncate cursor-text hover:text-[#635BFF] dark:hover:text-[#a5a0ff] transition-colors"
                                    >
                                      {section.title}
                                    </span>
                                  )}
                                </div>
                                {editingSection !== section.id && (
                                  <button
                                    onClick={() => startEditingTitle(section.id, section.title)}
                                    className="p-1.5 hover:bg-gray-200/70 dark:hover:bg-gray-700/70 rounded-lg transition-all duration-200 flex-shrink-0 opacity-0 group-hover:opacity-100"
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

                {/* Locked sections notice */}
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Header sections are locked to maintain template consistency
                  </p>
                </div>
              </>
            )}
          </DragDropContext>
        </CollapsibleSection>

        {/* Typography - Collapsible */}
        <CollapsibleSection title="Text & Font Style" icon={Type}>
          <div className="space-y-5">
            {/* Font Family - Visual Picker */}
            <FontPicker
              selectedFont={layoutSettings.fontFamily}
              onSelect={(font) => onSettingsChange({ fontFamily: font })}
            />

            {/* Font Size - Premium Slider */}
            <PremiumSlider
              value={layoutSettings.fontSize}
              onChange={(v) => onSettingsChange({ fontSize: v })}
              min={8}
              max={14}
              label="Font Size"
              valueSuffix="pt"
              tickLabels={['8', '10', '12', '14']}
            />

            {/* Line Height - Option Selector */}
            <OptionSelector
              label="Line Height"
              value={layoutSettings.lineHeight}
              onChange={(v) => onSettingsChange({ lineHeight: Number(v) })}
              options={[
                { value: 1.0, label: 'Compact', preview: '1.0×' },
                { value: 1.3, label: 'Standard', preview: '1.3×' },
                { value: 1.5, label: 'Comfortable', preview: '1.5×' },
                { value: 2.0, label: 'Spacious', preview: '2.0×' },
              ]}
            />
          </div>
        </CollapsibleSection>

        {/* Colors - Collapsible - Only show if template supports colors */}
        {hasColors && (
          <CollapsibleSection title="Colors" icon={Palette}>
            <ColorSwatchPicker
              selectedColor={layoutSettings.accentColor || 'blue'}
              onSelect={(color) => onSettingsChange({ accentColor: color })}
            />
          </CollapsibleSection>
        )}

        {/* Date Format - Collapsible */}
        <CollapsibleSection title="Date Format" icon={Calendar}>
          <OptionSelector
            label="Date Format"
            value={layoutSettings.dateFormat}
            onChange={(v) => onSettingsChange({ dateFormat: String(v) })}
            options={[
              { value: 'jan-24', label: 'Short', preview: "Jan '24" },
              { value: 'january-2024', label: 'Full', preview: 'January 2024' },
              { value: '01-2024', label: 'Numeric', preview: '01/2024' },
              { value: '2024-01', label: 'ISO', preview: '2024-01' },
            ]}
          />
        </CollapsibleSection>

        {/* Layout & Spacing - Collapsible */}
        <CollapsibleSection title="Layout & Spacing" icon={LayoutList}>
          <div className="space-y-5">
            {/* Experience Spacing - Premium Slider */}
            <PremiumSlider
              value={layoutSettings.experienceSpacing ?? 6}
              onChange={(v) => onSettingsChange({ experienceSpacing: v })}
              min={0}
              max={12}
              label="Section Spacing"
              tickLabels={['Tight', '', 'Normal', '', 'Loose']}
            />
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

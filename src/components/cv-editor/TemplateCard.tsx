import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { CVTemplate, CVColorScheme, CVColorOption, CVTemplateInfo } from '../../types/cvEditor';

// Color palette definitions
export const COLOR_OPTIONS: CVColorOption[] = [
  { id: 'slate', name: 'Slate', hex: '#475569', darkHex: '#334155' },
  { id: 'charcoal', name: 'Charcoal', hex: '#1f2937', darkHex: '#111827' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6', darkHex: '#2563eb' },
  { id: 'orange', name: 'Orange', hex: '#EB7134', darkHex: '#dc5714' },
  { id: 'teal', name: 'Teal', hex: '#14b8a6', darkHex: '#0d9488' },
  { id: 'emerald', name: 'Emerald', hex: '#10b981', darkHex: '#059669' },
];

// Hex map for easy lookup - exported for use in template components
export const COLOR_HEX_MAP: Record<CVColorScheme, string> = {
  slate: '#475569',
  charcoal: '#1f2937',
  blue: '#3b82f6',
  orange: '#EB7134',
  teal: '#14b8a6',
  emerald: '#10b981',
};

// Template definitions with metadata
// Only Modern and Creative support accent colors
export const TEMPLATE_INFO: CVTemplateInfo[] = [
  { 
    value: 'modern-professional', 
    label: 'Modern', 
    description: 'Clean and ATS-optimized',
    styleDescriptor: 'clean · professional',
    availableColors: ['emerald', 'teal', 'blue', 'charcoal', 'orange'] // Emerald first
  },
  { 
    value: 'executive-classic', 
    label: 'Classic', 
    description: 'Traditional and elegant',
    styleDescriptor: 'black & white',
    availableColors: [] // No colors - pure black & white
  },
  { 
    value: 'tech-minimalist', 
    label: 'Minimalist', 
    description: 'Google/Linear inspired',
    styleDescriptor: 'monochrome',
    availableColors: [] // No colors - grayscale only
  },
  { 
    value: 'creative-balance', 
    label: 'Creative', 
    description: 'Modern with personality',
    styleDescriptor: 'colorful · bold',
    availableColors: ['emerald', 'teal', 'blue', 'orange'] // Emerald first
  },
];

interface TemplateCardProps {
  template: CVTemplateInfo;
  isSelected: boolean;
  selectedColor: CVColorScheme;
  onSelect: () => void;
  onColorChange: (color: CVColorScheme) => void;
}

// Template Preview Component - Accurate visual representation of each template
function TemplatePreview({ template, accentColor }: { template: CVTemplate; accentColor: string }) {
  // Different layouts matching the actual templates
  const getPreviewContent = () => {
    switch (template) {
      // Modern Professional: Single column, large name, contact row with icons
      case 'modern-professional':
        return (
          <div className="w-full h-full p-2.5 flex flex-col">
            {/* Header - Large name, title, contact row */}
            <div className="mb-2">
              <div className="h-3 w-28 rounded-sm bg-gray-800 mb-1" />
              <div className="h-1.5 w-20 rounded-sm" style={{ backgroundColor: accentColor }} />
              {/* Contact row with icons */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex items-center gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                  <div className="h-1 w-8 bg-gray-300 rounded-sm" />
                </div>
                <div className="flex items-center gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                  <div className="h-1 w-6 bg-gray-300 rounded-sm" />
                </div>
                <div className="flex items-center gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                  <div className="h-1 w-7 bg-gray-300 rounded-sm" />
                </div>
              </div>
            </div>
            
            {/* Summary */}
            <div className="mb-2">
              <div className="h-1.5 w-10 rounded-sm mb-1" style={{ backgroundColor: accentColor }} />
              <div className="space-y-0.5">
                <div className="h-1 bg-gray-200 rounded-sm w-full" />
                <div className="h-1 bg-gray-200 rounded-sm w-11/12" />
              </div>
            </div>

            {/* Experience */}
            <div className="mb-2">
              <div className="h-1.5 w-14 rounded-sm mb-1" style={{ backgroundColor: accentColor }} />
              <div className="mb-1">
                <div className="h-1.5 bg-gray-400 rounded-sm w-16 mb-0.5" />
                <div className="h-1 bg-gray-300 rounded-sm w-12" />
              </div>
              <div className="space-y-0.5">
                <div className="h-1 bg-gray-200 rounded-sm w-full" />
                <div className="h-1 bg-gray-200 rounded-sm w-10/12" />
              </div>
            </div>

            {/* Skills */}
            <div className="mt-auto">
              <div className="h-1.5 w-8 rounded-sm mb-1" style={{ backgroundColor: accentColor }} />
              <div className="flex flex-wrap gap-0.5">
                <div className="h-1.5 px-1 rounded-sm bg-gray-200" style={{ width: '18px' }} />
                <div className="h-1.5 px-1 rounded-sm bg-gray-200" style={{ width: '22px' }} />
                <div className="h-1.5 px-1 rounded-sm bg-gray-200" style={{ width: '16px' }} />
                <div className="h-1.5 px-1 rounded-sm bg-gray-200" style={{ width: '20px' }} />
              </div>
            </div>
          </div>
        );

      // Executive Classic: Black & white, centered header, 2-column layout (NO COLORS)
      case 'executive-classic':
        return (
          <div className="w-full h-full p-2 flex flex-col">
            {/* Centered header with bottom border - BLACK */}
            <div className="text-center pb-1.5 mb-1.5 border-b-2 border-gray-900">
              <div className="h-2 w-20 mx-auto rounded-sm bg-gray-900 mb-0.5" />
              <div className="h-1 w-14 mx-auto rounded-sm bg-gray-400 mb-0.5" />
              {/* Contact centered with dots */}
              <div className="flex justify-center items-center gap-1">
                <div className="h-0.5 w-8 bg-gray-400 rounded-sm" />
                <div className="w-0.5 h-0.5 rounded-full bg-gray-500" />
                <div className="h-0.5 w-6 bg-gray-400 rounded-sm" />
              </div>
            </div>

            {/* Two column layout */}
            <div className="flex gap-1.5 flex-1">
              {/* Left column */}
              <div className="flex-1 space-y-1.5" style={{ flex: '0 0 65%' }}>
                <div>
                  <div className="h-1 w-8 rounded-sm mb-0.5 bg-gray-800 uppercase" />
                  <div className="space-y-0.5">
                    <div className="h-0.5 bg-gray-200 rounded-sm w-full" />
                    <div className="h-0.5 bg-gray-200 rounded-sm w-11/12" />
                  </div>
                </div>
                <div>
                  <div className="h-1 w-10 rounded-sm mb-0.5 bg-gray-800" />
                  <div className="h-1 bg-gray-500 rounded-sm w-12 mb-0.5" />
                  <div className="space-y-0.5">
                    <div className="h-0.5 bg-gray-200 rounded-sm w-full" />
                    <div className="h-0.5 bg-gray-200 rounded-sm w-4/5" />
                  </div>
                </div>
              </div>
              
              {/* Right column */}
              <div className="space-y-1.5" style={{ flex: '0 0 32%' }}>
                <div>
                  <div className="h-1 w-6 rounded-sm mb-0.5 bg-gray-800" />
                  <div className="space-y-0.5">
                    <div className="h-0.5 bg-gray-200 rounded-sm w-full" />
                    <div className="h-0.5 bg-gray-200 rounded-sm w-4/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // Tech Minimalist: Monochrome, clean single column (NO COLORS)
      case 'tech-minimalist':
        return (
          <div className="w-full h-full p-2 flex flex-col">
            {/* Header split - name left, contact right */}
            <div className="flex justify-between items-start mb-1.5 pb-1 border-b border-gray-200">
              <div>
                <div className="h-2 w-16 rounded-sm bg-gray-800 mb-0.5" />
                <div className="h-1 w-12 rounded-sm bg-gray-400" />
              </div>
              {/* Right-aligned contact - gray icons */}
              <div className="text-right space-y-0.5">
                <div className="flex items-center justify-end gap-0.5">
                  <div className="h-0.5 w-10 bg-gray-300 rounded-sm" />
                  <div className="w-1 h-1 rounded-sm bg-gray-400" />
                </div>
                <div className="flex items-center justify-end gap-0.5">
                  <div className="h-0.5 w-8 bg-gray-300 rounded-sm" />
                  <div className="w-1 h-1 rounded-sm bg-gray-400" />
                </div>
              </div>
            </div>

            {/* Single column content */}
            <div className="space-y-1.5 flex-1">
              <div>
                <div className="h-1 w-8 rounded-sm mb-0.5 bg-gray-600" />
                <div className="space-y-0.5">
                  <div className="h-0.5 bg-gray-200 rounded-sm w-full" />
                  <div className="h-0.5 bg-gray-200 rounded-sm w-11/12" />
                </div>
              </div>
              
              <div>
                <div className="h-1 w-10 rounded-sm mb-0.5 bg-gray-600" />
                <div className="h-1 bg-gray-400 rounded-sm w-12 mb-0.5" />
                <div className="space-y-0.5">
                  <div className="h-0.5 bg-gray-200 rounded-sm w-full" />
                  <div className="h-0.5 bg-gray-200 rounded-sm w-10/12" />
                </div>
              </div>

              {/* Skills - simple tags */}
              <div className="mt-auto">
                <div className="h-1 w-6 rounded-sm mb-0.5 bg-gray-600" />
                <div className="flex flex-wrap gap-0.5">
                  <div className="h-1 rounded-sm bg-gray-100 border border-gray-300" style={{ width: '14px' }} />
                  <div className="h-1 rounded-sm bg-gray-100 border border-gray-300" style={{ width: '18px' }} />
                  <div className="h-1 rounded-sm bg-gray-100 border border-gray-300" style={{ width: '12px' }} />
                </div>
              </div>
            </div>
          </div>
        );

      // Creative Balance: Accent border header, bold first name, colored icon circles
      case 'creative-balance':
        return (
          <div className="w-full h-full p-2.5 flex flex-col">
            {/* Header with accent bottom border */}
            <div className="pb-2 mb-2 border-b-4" style={{ borderColor: accentColor }}>
              <div className="flex justify-between items-start">
                <div>
                  {/* Bold first name + light last name */}
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-12 rounded-sm bg-gray-800" />
                    <div className="h-2.5 w-14 rounded-sm bg-gray-400" />
                  </div>
                  <div className="h-1.5 w-16 rounded-sm mt-0.5" style={{ backgroundColor: accentColor }} />
                </div>
                {/* Contact with colored circles */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-end gap-1">
                    <div className="h-1 w-10 bg-gray-300 rounded-sm" />
                    <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <div className="h-1 w-8 bg-gray-300 rounded-sm" />
                    <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content with accent left borders */}
            <div className="space-y-2 flex-1">
              {/* Summary with accent border */}
              <div className="border-l-2 pl-1.5" style={{ borderColor: accentColor }}>
                <div className="h-1.5 w-10 rounded-sm mb-1 bg-gray-600" />
                <div className="space-y-0.5">
                  <div className="h-1 bg-gray-200 rounded-sm w-full" />
                  <div className="h-1 bg-gray-200 rounded-sm w-11/12" />
                </div>
              </div>

              {/* Experience with accent border */}
              <div className="border-l-2 pl-1.5" style={{ borderColor: accentColor }}>
                <div className="h-1.5 w-12 rounded-sm mb-1 bg-gray-600" />
                <div className="h-1.5 bg-gray-400 rounded-sm w-14 mb-0.5" />
                <div className="space-y-0.5">
                  <div className="h-1 bg-gray-200 rounded-sm w-full" />
                  <div className="h-1 bg-gray-200 rounded-sm w-4/5" />
                </div>
              </div>

              {/* Skills as colored pills */}
              <div className="mt-auto">
                <div className="h-1.5 w-8 rounded-sm mb-1 bg-gray-600" />
                <div className="flex flex-wrap gap-0.5">
                  <div className="h-1.5 rounded-full" style={{ width: '18px', backgroundColor: `${accentColor}30` }} />
                  <div className="h-1.5 rounded-full" style={{ width: '22px', backgroundColor: `${accentColor}30` }} />
                  <div className="h-1.5 rounded-full" style={{ width: '16px', backgroundColor: `${accentColor}30` }} />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full aspect-[5/6] bg-white rounded-md shadow-inner overflow-hidden border border-gray-100">
      {getPreviewContent()}
    </div>
  );
}

// Color Swatch Component - Very Compact
function ColorSwatch({ 
  color, 
  isSelected, 
  onClick 
}: { 
  color: CVColorOption; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        relative w-4 h-4 rounded-full transition-all duration-150
        ${isSelected 
          ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-800' 
          : 'hover:ring-1 hover:ring-offset-1 hover:ring-gray-300'
        }
      `}
      style={{ 
        backgroundColor: color.hex,
        ['--tw-ring-color' as string]: color.hex
      }}
      title={color.name}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Check className="w-2 h-2 text-white drop-shadow-sm" />
        </motion.div>
      )}
    </motion.button>
  );
}

// Main Template Card Component
export default function TemplateCard({
  template,
  isSelected,
  selectedColor,
  onSelect,
  onColorChange
}: TemplateCardProps) {
  const hasColors = template.availableColors.length > 0;
  const accentColorHex = hasColors 
    ? (COLOR_OPTIONS.find(c => c.id === selectedColor)?.hex || COLOR_OPTIONS.find(c => c.id === template.availableColors[0])?.hex || '#10b981')
    : '#374151'; // Gray for no-color templates
  const availableColorOptions = COLOR_OPTIONS.filter(c => template.availableColors.includes(c.id));

  return (
    <motion.div
      whileHover={{ y: -1 }}
      onClick={onSelect}
      className={`
        relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200
        ${isSelected 
          ? 'ring-2 ring-emerald-500 shadow-md' 
          : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-gray-300 dark:hover:ring-gray-600 hover:shadow-sm'
        }
        bg-white dark:bg-gray-800
      `}
    >
      {/* Selected badge */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-1 right-1 z-10 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center shadow-md"
        >
          <Check className="w-2 h-2 text-white" />
        </motion.div>
      )}

      {/* Preview area - very compact */}
      <div className="p-1.5 bg-gray-50 dark:bg-gray-900/50">
        <TemplatePreview template={template.value} accentColor={accentColorHex} />
      </div>

      {/* Info area - very compact */}
      <div className="px-2 py-1.5 space-y-1">
        {/* Template name and style */}
        <div>
          <h4 className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight">
            {template.label}
          </h4>
          <p className="text-[9px] text-gray-500 dark:text-gray-400">
            {template.styleDescriptor}
          </p>
        </div>

        {/* Color swatches or B&W label */}
        {hasColors ? (
          <div className="flex items-center gap-0.5">
            {availableColorOptions.map((color) => (
              <ColorSwatch
                key={color.id}
                color={color}
                isSelected={selectedColor === color.id}
                onClick={() => onColorChange(color.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-gray-800 ring-1 ring-gray-300" />
            <div className="w-3.5 h-3.5 rounded-full bg-white ring-1 ring-gray-300" />
            <span className="text-[9px] text-gray-400">No accent</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}


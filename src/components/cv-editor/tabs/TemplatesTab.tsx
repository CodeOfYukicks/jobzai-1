import { CVTemplate, CVColorScheme, CVLayoutSettings } from '../../../types/cvEditor';
import TemplateCard, { TEMPLATE_INFO } from '../TemplateCard';

interface TemplatesTabProps {
  template: CVTemplate;
  onTemplateChange: (template: CVTemplate) => void;
  layoutSettings: CVLayoutSettings;
  onSettingsChange: (settings: Partial<CVLayoutSettings>) => void;
}

export default function TemplatesTab({
  template,
  onTemplateChange,
  layoutSettings,
  onSettingsChange
}: TemplatesTabProps) {
  
  const handleColorChange = (color: CVColorScheme) => {
    onSettingsChange({ accentColor: color });
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
      <div className="max-w-md mx-auto">
        {/* Header - Compact */}
        <div className="mb-2">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
            Choose Your Template
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            Select a template and customize the accent color
          </p>
        </div>

        {/* Premium Template Grid - Compact */}
        <div className="grid grid-cols-2 gap-1.5">
          {TEMPLATE_INFO.map((t) => (
            <TemplateCard
              key={t.value}
              template={t}
              isSelected={template === t.value}
              selectedColor={layoutSettings.accentColor || 'blue'}
              onSelect={() => onTemplateChange(t.value)}
              onColorChange={handleColorChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


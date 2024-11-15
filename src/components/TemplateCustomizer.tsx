import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Layout, Type, Eye, ChevronDown, ChevronUp, Wand2 } from 'lucide-react';

interface TemplateCustomizerProps {
  content: string;
  onUpdate: (content: string) => void;
}

interface CustomizationOptions {
  font: string;
  fontSize: string;
  spacing: string;
  greeting: string;
  signature: string;
  tone: 'formal' | 'casual' | 'enthusiastic';
  style: 'concise' | 'detailed' | 'storytelling';
}

const fonts = [
  { name: 'Default', value: 'font-sans' },
  { name: 'Serif', value: 'font-serif' },
  { name: 'Monospace', value: 'font-mono' },
];

const fontSizes = [
  { name: 'Small', value: 'text-sm' },
  { name: 'Medium', value: 'text-base' },
  { name: 'Large', value: 'text-lg' },
];

const spacings = [
  { name: 'Compact', value: 'space-y-4' },
  { name: 'Normal', value: 'space-y-6' },
  { name: 'Relaxed', value: 'space-y-8' },
];

const toneDescriptions = {
  formal: 'Professional and traditional',
  casual: 'Friendly and approachable',
  enthusiastic: 'Energetic and passionate',
};

const styleDescriptions = {
  concise: 'Short and to the point',
  detailed: 'Comprehensive and thorough',
  storytelling: 'Narrative and engaging',
};

export default function TemplateCustomizer({ content, onUpdate }: TemplateCustomizerProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>('typography');
  const [options, setOptions] = useState<CustomizationOptions>({
    font: 'font-sans',
    fontSize: 'text-base',
    spacing: 'space-y-6',
    greeting: 'Dear Hiring Manager',
    signature: 'Best regards',
    tone: 'formal',
    style: 'concise',
  });

  const updateContent = (newOptions: Partial<CustomizationOptions>) => {
    const updatedOptions = { ...options, ...newOptions };
    setOptions(updatedOptions);

    // Update content with new options
    let updatedContent = content;
    if (newOptions.greeting !== undefined) {
      updatedContent = updatedContent.replace(/^.*?\n/, `${newOptions.greeting}\n`);
    }
    if (newOptions.signature !== undefined) {
      updatedContent = updatedContent.replace(/\n.*?\n\[Your name\]$/, `\n${newOptions.signature}\n[Your name]`);
    }
    onUpdate(updatedContent);
  };

  const Section = ({ 
    id, 
    title, 
    icon: Icon, 
    children 
  }: { 
    id: string;
    title: string;
    icon: any;
    children: React.ReactNode;
  }) => (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setActiveSection(activeSection === id ? null : id)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-[#4D3E78]" />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {activeSection === id ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      <AnimatePresence>
        {activeSection === id && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Customize Template</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              // Simulate AI suggestions
              const suggestions = [
                { greeting: 'Hi there', tone: 'casual' as const },
                { greeting: 'Dear Hiring Team', tone: 'formal' as const },
                { greeting: 'Hello', tone: 'enthusiastic' as const },
              ];
              const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
              updateContent(suggestion);
            }}
            className="flex items-center space-x-2 text-[#4D3E78] hover:text-[#4D3E78]/80"
          >
            <Wand2 className="h-4 w-4" />
            <span>AI Suggestions</span>
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 text-[#4D3E78] hover:text-[#4D3E78]/80"
          >
            <Eye className="h-4 w-4" />
            <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customization Controls */}
        <div className="space-y-4">
          <Section id="typography" title="Typography" icon={Type}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Font</label>
                <select
                  value={options.font}
                  onChange={(e) => updateContent({ font: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#4D3E78] focus:ring-[#4D3E78]"
                >
                  {fonts.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Size</label>
                <select
                  value={options.fontSize}
                  onChange={(e) => updateContent({ fontSize: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#4D3E78] focus:ring-[#4D3E78]"
                >
                  {fontSizes.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Section>

          <Section id="layout" title="Layout" icon={Layout}>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Paragraph Spacing</label>
              <select
                value={options.spacing}
                onChange={(e) => updateContent({ spacing: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#4D3E78] focus:ring-[#4D3E78]"
              >
                {spacings.map((spacing) => (
                  <option key={spacing.value} value={spacing.value}>
                    {spacing.name}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          <Section id="content" title="Content" icon={Palette}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Opening Greeting</label>
                <input
                  type="text"
                  value={options.greeting}
                  onChange={(e) => updateContent({ greeting: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#4D3E78] focus:ring-[#4D3E78]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Closing Signature</label>
                <input
                  type="text"
                  value={options.signature}
                  onChange={(e) => updateContent({ signature: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#4D3E78] focus:ring-[#4D3E78]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tone</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['formal', 'casual', 'enthusiastic'] as const).map((tone) => (
                    <button
                      key={tone}
                      onClick={() => updateContent({ tone })}
                      className={`px-4 py-3 rounded-md text-left transition-colors ${
                        options.tone === tone
                          ? 'bg-[#4D3E78] text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium capitalize">{tone}</div>
                      <div className="text-sm opacity-80">{toneDescriptions[tone]}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Writing Style</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['concise', 'detailed', 'storytelling'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => updateContent({ style })}
                      className={`px-4 py-3 rounded-md text-left transition-colors ${
                        options.style === style
                          ? 'bg-[#4D3E78] text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium capitalize">{style}</div>
                      <div className="text-sm opacity-80">{styleDescriptions[style]}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:h-auto"
            >
              <div className="sticky top-4">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Live Preview</h4>
                  <div className={`${options.font} ${options.fontSize} ${options.spacing}`}>
                    <pre className="whitespace-pre-wrap font-inherit">
                      {content}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Eye, Sparkles, MessageSquare, FileText, Target, Wand2, Loader2 } from 'lucide-react';
import { CampaignData } from '../NewCampaignModal';
import { notify } from '@/lib/notify';
import { getAuth } from 'firebase/auth';
import MergeFieldPills from '../MergeFieldPills';

interface ABTestingStepProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
}

type Section = 'hooks' | 'bodies' | 'ctas';

interface SectionConfig {
  id: Section;
  icon: typeof MessageSquare;
  title: string;
  description: string;
  placeholder: string;
  maxVariants: number;
}

const sections: SectionConfig[] = [
  {
    id: 'hooks',
    icon: MessageSquare,
    title: 'Opening Hooks',
    description: 'First sentences to grab attention (3-5 variants)',
    placeholder: 'Hi {{firstName}}, I noticed your work at {{company}}...',
    maxVariants: 5,
  },
  {
    id: 'bodies',
    icon: FileText,
    title: 'Email Bodies',
    description: 'Main message content (2-3 variants)',
    placeholder: 'I wanted to reach out because...',
    maxVariants: 3,
  },
  {
    id: 'ctas',
    icon: Target,
    title: 'Call-to-Actions',
    description: 'Closing and next steps (2-3 variants)',
    placeholder: 'Would you be open to a quick call this week?',
    maxVariants: 3,
  },
];

export default function ABTestingStep({ data, onUpdate }: ABTestingStepProps) {
  const [activeSection, setActiveSection] = useState<Section>('hooks');
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndices, setPreviewIndices] = useState({ hook: 0, body: 0, cta: 0 });
  const [generatingVariantIndex, setGeneratingVariantIndex] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [outreachGoal, setOutreachGoal] = useState<'job' | 'internship' | 'networking'>(
    data.outreachGoal || 'job'
  );
  
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Initialize with empty arrays if not set
  const abTestConfig = data.abTestConfig || { hooks: [''], bodies: [''], ctas: [''] };

  // Update outreach goal in campaign data
  const handleOutreachGoalChange = (goal: 'job' | 'internship' | 'networking') => {
    setOutreachGoal(goal);
    onUpdate({ outreachGoal: goal });
  };

  const updateVariants = (section: Section, variants: string[]) => {
    onUpdate({
      abTestConfig: {
        ...abTestConfig,
        [section]: variants,
      }
    });
  };

  const addVariant = (section: Section) => {
    const currentVariants = abTestConfig[section];
    const sectionConfig = sections.find(s => s.id === section);
    
    if (currentVariants.length >= (sectionConfig?.maxVariants || 5)) {
      notify.warning(`Maximum ${sectionConfig?.maxVariants} variants allowed`);
      return;
    }

    updateVariants(section, [...currentVariants, '']);
  };

  const removeVariant = (section: Section, index: number) => {
    const currentVariants = abTestConfig[section];
    
    if (currentVariants.length <= 1) {
      notify.warning('At least one variant is required');
      return;
    }

    updateVariants(section, currentVariants.filter((_, i) => i !== index));
  };

  const updateVariant = (section: Section, index: number, value: string) => {
    const currentVariants = abTestConfig[section];
    const updated = [...currentVariants];
    updated[index] = value;
    updateVariants(section, updated);
  };

  // Insert merge field at cursor position
  const insertMergeField = (fieldName: string, variantIndex: number) => {
    const textareaKey = `${activeSection}-${variantIndex}`;
    const textarea = textareaRefs.current.get(textareaKey);
    
    if (!textarea) {
      // Fallback: append to end
      const currentText = abTestConfig[activeSection][variantIndex];
      updateVariant(activeSection, variantIndex, currentText + fieldName);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = abTestConfig[activeSection][variantIndex];
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = before + fieldName + after;
    updateVariant(activeSection, variantIndex, newText);

    // Remettre le focus et déplacer le curseur après le merge field
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + fieldName.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Generate single variant with AI
  const generateVariant = async (section: Section, index: number) => {
    setGeneratingVariantIndex(index);
    
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      const existingVariants = abTestConfig[section].filter(v => v.trim());

      const response = await fetch(`${BACKEND_URL}/api/campaigns/generate-variant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: section === 'hooks' ? 'hook' : section === 'bodies' ? 'body' : 'cta',
          tone: data.emailTone || 'casual',
          language: data.language || 'en',
          outreachGoal: outreachGoal,
          existingVariants
        })
      });

      const result = await response.json();

      if (result.success && result.variant) {
        updateVariant(section, index, result.variant);
        notify.success('Variant generated!');
      } else {
        notify.error(result.error || 'Failed to generate variant');
      }
    } catch (error) {
      console.error('Error generating variant:', error);
      notify.error('Failed to generate variant');
    } finally {
      setGeneratingVariantIndex(null);
    }
  };

  // Generate all variants for current section
  const generateAllVariants = async () => {
    setGeneratingAll(true);
    
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      const variantCount = Math.min(activeVariants.length, activeSectionConfig.maxVariants);

      for (let i = 0; i < variantCount; i++) {
        try {
          const existingVariants = abTestConfig[activeSection]
            .filter((v, idx) => idx !== i && v.trim());

          const response = await fetch(`${BACKEND_URL}/api/campaigns/generate-variant`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              type: activeSection === 'hooks' ? 'hook' : activeSection === 'bodies' ? 'body' : 'cta',
              tone: data.emailTone || 'casual',
              language: data.language || 'en',
              outreachGoal: outreachGoal,
              existingVariants
            })
          });

          const result = await response.json();

          if (result.success && result.variant) {
            updateVariant(activeSection, i, result.variant);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error generating variant ${i}:`, error);
        }
      }

      notify.success(`Generated ${variantCount} variants!`);
    } catch (error) {
      console.error('Error generating all variants:', error);
      notify.error('Failed to generate variants');
    } finally {
      setGeneratingAll(false);
    }
  };

  const activeSectionConfig = sections.find(s => s.id === activeSection)!;
  const activeVariants = abTestConfig[activeSection];

  // Generate preview email
  const generatePreview = () => {
    const hook = abTestConfig.hooks[previewIndices.hook] || '';
    const body = abTestConfig.bodies[previewIndices.body] || '';
    const cta = abTestConfig.ctas[previewIndices.cta] || '';
    
    return `${hook}\n\n${body}\n\n${cta}`;
  };

  // Check if configuration is valid
  const isValid = () => {
    return (
      abTestConfig.hooks.some(h => h.trim()) &&
      abTestConfig.bodies.some(b => b.trim()) &&
      abTestConfig.ctas.some(c => c.trim())
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          A/B Testing Configuration
        </h3>
        <p className="text-sm text-gray-500 dark:text-white/60">
          Create multiple variants to test what resonates best
        </p>
      </div>

      {/* Outreach Goal Filter */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-white/[0.02] dark:to-white/[0.01] border border-gray-200 dark:border-white/[0.08]">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          What's your goal with this outreach?
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleOutreachGoalChange('job')}
            className={`
              px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
              ${outreachGoal === 'job'
                ? 'bg-[#b7e219] text-gray-900 border-2 border-[#9fc015] shadow-sm'
                : 'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.12]'
              }
            `}
          >
            <div className="text-center">
              <div className="text-base font-semibold mb-0.5">💼 Job</div>
              <div className="text-xs opacity-70">Looking for position</div>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => handleOutreachGoalChange('internship')}
            className={`
              px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
              ${outreachGoal === 'internship'
                ? 'bg-[#b7e219] text-gray-900 border-2 border-[#9fc015] shadow-sm'
                : 'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.12]'
              }
            `}
          >
            <div className="text-center">
              <div className="text-base font-semibold mb-0.5">🎓 Internship</div>
              <div className="text-xs opacity-70">Seeking experience</div>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => handleOutreachGoalChange('networking')}
            className={`
              px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
              ${outreachGoal === 'networking'
                ? 'bg-[#b7e219] text-gray-900 border-2 border-[#9fc015] shadow-sm'
                : 'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.12]'
              }
            `}
          >
            <div className="text-center">
              <div className="text-base font-semibold mb-0.5">🤝 Networking</div>
              <div className="text-xs opacity-70">Just connecting</div>
            </div>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 dark:text-blue-200 mb-2">
              <strong>How it works:</strong> Each email will randomly combine one hook, one body, and one CTA. 
              We'll track which combinations perform best.
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Use merge fields to personalize: click the pills to insert them into your text
            </p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-white/[0.04] rounded-lg">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const variantCount = abTestConfig[section.id].filter(v => v.trim()).length;
          
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{section.title}</span>
              <span className={`
                inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold
                ${isActive
                  ? 'bg-[#b7e219] text-gray-900'
                  : 'bg-gray-200 dark:bg-white/[0.08] text-gray-600 dark:text-gray-400'
                }
              `}>
                {variantCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                {activeSectionConfig.title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-white/60">
                {activeSectionConfig.description}
              </p>
            </div>
            <button
              onClick={() => addVariant(activeSection)}
              disabled={activeVariants.length >= activeSectionConfig.maxVariants}
              className={`
                inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${activeVariants.length >= activeSectionConfig.maxVariants
                  ? 'bg-gray-100 dark:bg-white/[0.04] text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-[#b7e219] text-gray-900 hover:bg-[#a5cb17] border border-[#9fc015]'
                }
              `}
            >
              <Plus className="w-4 h-4" />
              Add Variant
            </button>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            {activeVariants.map((variant, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="relative group"
              >
                <div className="flex items-start gap-3">
                  {/* Variant Number */}
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-400 flex-shrink-0 mt-2">
                    {index + 1}
                  </div>

                  {/* Variant Content Area */}
                  <div className="flex-1 space-y-2">
                    {/* Merge Field Pills */}
                    <MergeFieldPills onInsert={(field) => insertMergeField(field, index)} />

                    {/* Textarea with Overlay for Merge Field Pills */}
                    <div className="relative">
                      <textarea
                        ref={(el) => {
                          const key = `${activeSection}-${index}`;
                          if (el) {
                            textareaRefs.current.set(key, el);
                          } else {
                            textareaRefs.current.delete(key);
                          }
                        }}
                        value={variant}
                        onChange={(e) => updateVariant(activeSection, index, e.target.value)}
                        placeholder={activeSectionConfig.placeholder}
                        rows={activeSection === 'bodies' ? 4 : 2}
                        className="w-full px-4 py-3 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.08]
                          rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b7e219]/20 focus:border-[#b7e219]
                          text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40
                          resize-none transition-all duration-200"
                        style={{
                          lineHeight: '1.8',
                          color: 'transparent',
                          caretColor: '#1f2937'
                        }}
                      />
                      {/* Overlay with styled merge fields */}
                      <div 
                        className="absolute inset-0 px-4 py-3 text-sm pointer-events-none rounded-lg overflow-hidden"
                        style={{
                          lineHeight: '1.8'
                        }}
                      >
                        <div className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                          {variant.split(/(\{\{[^}]+\}\})/g).map((part, idx) => {
                            if (part.match(/\{\{[^}]+\}\}/)) {
                              return (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md
                                    bg-[#b7e219]/15 dark:bg-[#b7e219]/25
                                    text-[#b7e219] dark:text-[#b7e219]
                                    border border-[#b7e219]/40
                                    font-mono text-xs font-semibold
                                    shadow-sm"
                                >
                                  {part}
                                </span>
                              );
                            }
                            return <span key={idx}>{part || '\u00A0'}</span>;
                          })}
                        </div>
                      </div>
                    </div>

                    {/* AI Generate Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generateVariant(activeSection, index)}
                        disabled={generatingVariantIndex === index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                          bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-500/10 dark:to-indigo-500/10
                          text-purple-700 dark:text-purple-300 
                          border border-purple-200 dark:border-purple-500/20
                          hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-500/20 dark:hover:to-indigo-500/20
                          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingVariantIndex === index ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>Generate with AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Delete Button */}
                  {activeVariants.length > 1 && (
                    <button
                      onClick={() => removeVariant(activeSection, index)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-2
                        text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400
                        hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200
                        opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Preview Button */}
      <div className="flex items-center justify-center pt-4 border-t border-gray-200 dark:border-white/[0.08]">
        <button
          onClick={() => setShowPreview(!showPreview)}
          disabled={!isValid()}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${isValid()
              ? 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06]'
              : 'bg-gray-100 dark:bg-white/[0.04] text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }
          `}
        >
          <Eye className="w-4 h-4" />
          {showPreview ? 'Hide Preview' : 'Preview Email'}
        </button>
      </div>

      {/* Preview Panel */}
      <AnimatePresence>
        {showPreview && isValid() && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/[0.04] dark:to-white/[0.02] border border-gray-200 dark:border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Preview Combination
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50">
                  <span>Hook {previewIndices.hook + 1}</span>
                  <span>•</span>
                  <span>Body {previewIndices.body + 1}</span>
                  <span>•</span>
                  <span>CTA {previewIndices.cta + 1}</span>
                </div>
              </div>

              {/* Preview Selectors */}
              <div className="flex items-center gap-2 mb-4">
                <select
                  value={previewIndices.hook}
                  onChange={(e) => setPreviewIndices(prev => ({ ...prev, hook: parseInt(e.target.value) }))}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-700 dark:text-gray-300"
                >
                  {abTestConfig.hooks.map((_, idx) => (
                    <option key={idx} value={idx}>Hook {idx + 1}</option>
                  ))}
                </select>
                <select
                  value={previewIndices.body}
                  onChange={(e) => setPreviewIndices(prev => ({ ...prev, body: parseInt(e.target.value) }))}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-700 dark:text-gray-300"
                >
                  {abTestConfig.bodies.map((_, idx) => (
                    <option key={idx} value={idx}>Body {idx + 1}</option>
                  ))}
                </select>
                <select
                  value={previewIndices.cta}
                  onChange={(e) => setPreviewIndices(prev => ({ ...prev, cta: parseInt(e.target.value) }))}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-700 dark:text-gray-300"
                >
                  {abTestConfig.ctas.map((_, idx) => (
                    <option key={idx} value={idx}>CTA {idx + 1}</option>
                  ))}
                </select>
              </div>

              {/* Preview Content with Merge Field Highlighting */}
              <div className="p-4 rounded-lg bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08]">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {generatePreview().split(/(\{\{[^}]+\}\})/g).map((part, idx) => {
                    if (part.match(/\{\{[^}]+\}\}/)) {
                      return (
                        <span 
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md
                            bg-[#b7e219]/10 dark:bg-[#b7e219]/20
                            text-[#b7e219] dark:text-[#b7e219]
                            border border-[#b7e219]/30
                            font-mono text-xs font-semibold"
                        >
                          {part}
                        </span>
                      );
                    }
                    return <span key={idx}>{part}</span>;
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Warning */}
      {!isValid() && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Please add at least one variant for each section (hooks, bodies, and CTAs) to continue.
          </p>
        </div>
      )}
    </div>
  );
}

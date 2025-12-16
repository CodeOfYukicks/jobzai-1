import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Eye, Sparkles, MessageSquare, FileText, Target, ChevronRight, Shuffle, Mail, ChevronDown } from 'lucide-react';
import { CampaignData } from '../NewCampaignModal';
import { notify } from '@/lib/notify';
import { getAuth } from 'firebase/auth';
import MergeFieldPills from '../MergeFieldPills';
import { useAvatarConfig } from '@/hooks/useAvatarConfig';
import Avatar from '@/components/assistant/avatar/Avatar';

interface ABTestingStepProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
}

type SubStep = 'hooks' | 'bodies' | 'ctas';

interface SectionConfig {
  id: SubStep;
  icon: typeof MessageSquare;
  title: string;
  subtitle: string;
  placeholder: string;
  maxVariants: number;
  recommended: string;
}

const SUB_STEPS: SubStep[] = ['hooks', 'bodies', 'ctas'];

export default function ABTestingStep({ data, onUpdate }: ABTestingStepProps) {
  const [activeSubStep, setActiveSubStep] = useState<SubStep>('hooks');

  const sections: SectionConfig[] = [
    {
      id: 'hooks',
      icon: MessageSquare,
      title: 'Opening Hooks',
      subtitle: 'Attention-grabbing first lines',
      placeholder: 'e.g., I noticed your team is hiring...',
      maxVariants: 5,
      recommended: '3-5',
    },
    {
      id: 'bodies',
      icon: FileText,
      title: 'Email Bodies',
      subtitle: 'Main message content',
      placeholder: 'e.g., With my background in...',
      maxVariants: 3,
      recommended: '2-3',
    },
    {
      id: 'ctas',
      icon: Target,
      title: 'Call to Actions',
      subtitle: 'Closing statements',
      placeholder: 'e.g., Would you be open to a quick call?',
      maxVariants: 3,
      recommended: '2-3',
    },
  ];
  const [previewIndices, setPreviewIndices] = useState({ hook: 0, body: 0, cta: 0 });
  const [generatingVariantIndex, setGeneratingVariantIndex] = useState<number | null>(null);
  
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const avatarConfig = useAvatarConfig();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Initialize with empty arrays if not set
  const abTestConfig = data.abTestConfig || { hooks: [''], bodies: [''], ctas: [''] };

  // Get current sub-step index
  const currentSubStepIndex = SUB_STEPS.indexOf(activeSubStep);
  const activeSectionConfig = sections.find(s => s.id === activeSubStep)!;
  const activeVariants = abTestConfig[activeSubStep];

  const updateVariants = (section: SubStep, variants: string[]) => {
    onUpdate({
      abTestConfig: {
        ...abTestConfig,
        [section]: variants,
      }
    });
  };

  const addVariant = (section: SubStep) => {
    const currentVariants = abTestConfig[section];
    const sectionConfig = sections.find(s => s.id === section);
    
    if (currentVariants.length >= (sectionConfig?.maxVariants || 5)) {
      notify.warning(`Maximum ${sectionConfig?.maxVariants} variants allowed`);
      return;
    }

    updateVariants(section, [...currentVariants, '']);
  };

  const removeVariant = (section: SubStep, index: number) => {
    const currentVariants = abTestConfig[section];
    
    if (currentVariants.length <= 1) {
      notify.warning('At least one variant is required');
      return;
    }

    updateVariants(section, currentVariants.filter((_, i) => i !== index));
  };

  const updateVariant = (section: SubStep, index: number, value: string) => {
    const currentVariants = abTestConfig[section];
    const updated = [...currentVariants];
    updated[index] = value;
    updateVariants(section, updated);
  };

  // Insert merge field at cursor position
  const insertMergeField = (fieldName: string, variantIndex: number) => {
    const textareaKey = `${activeSubStep}-${variantIndex}`;
    const textarea = textareaRefs.current.get(textareaKey);
    
    if (!textarea) {
      const currentText = abTestConfig[activeSubStep][variantIndex];
      updateVariant(activeSubStep, variantIndex, currentText + fieldName);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = abTestConfig[activeSubStep][variantIndex];
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = before + fieldName + after;
    updateVariant(activeSubStep, variantIndex, newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + fieldName.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Generate single variant with AI
  const generateVariant = async (section: SubStep, index: number) => {
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
          outreachGoal: data.outreachGoal || 'job',
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

  // Check if current section has at least one valid variant
  const currentSectionValid = activeVariants.some(v => v.trim());

  // Highlight merge fields in preview with subtle styling
  const highlightMergeFieldsInPreview = (text: string) => {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, idx) => {
      if (part.match(/\{\{[^}]+\}\}/)) {
        return (
          <span 
            key={idx} 
            className="inline-flex items-center px-1 py-0.5 mx-0.5 rounded
              bg-violet-500/10 dark:bg-violet-400/15
              text-violet-600 dark:text-violet-400
              text-[12px] font-medium"
          >
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Check if configuration is valid (for preview)
  const hasContent = () => {
    return (
      abTestConfig.hooks.some(h => h.trim()) ||
      abTestConfig.bodies.some(b => b.trim()) ||
      abTestConfig.ctas.some(c => c.trim())
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header Section */}
      <div className="flex-shrink-0 space-y-5 mb-6">
        {/* Sub-step Progress Indicator - Simplified */}
        <div className="flex items-center gap-2">
            {sections.map((section, idx) => {
          const Icon = section.icon;
              const isActive = activeSubStep === section.id;
              const isPast = idx < currentSubStepIndex;
          const variantCount = abTestConfig[section.id].filter(v => v.trim()).length;
          
          return (
            <button
              key={section.id}
                  onClick={() => setActiveSubStep(section.id)}
              className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium
                transition-all duration-200
                ${isActive
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                      : isPast
                      ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-white/[0.08]'
                      : 'bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05]'
                    }
                  `}
                >
                <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{section.title}</span>
                  {variantCount > 0 && (
              <span className={`
                    inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                ${isActive
                      ? 'bg-white/20 dark:bg-gray-900/20 text-white dark:text-gray-900'
                  : 'bg-gray-200 dark:bg-white/[0.08] text-gray-600 dark:text-gray-400'
                }
              `}>
                {variantCount}
              </span>
                  )}
                  {idx < sections.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-1 hidden sm:block" />
                  )}
            </button>
          );
        })}
        </div>

        {/* Info Tip - Subtle */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/[0.06]">
          <Sparkles className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <p className="text-[12px] text-gray-500 dark:text-gray-400">
            Each email will randomly combine one hook, one body, and one CTA. We'll track which combinations perform best.
          </p>
        </div>
      </div>

      {/* Active Section Editor */}
      <div className="flex-1 min-h-0">
      <AnimatePresence mode="wait">
        <motion.div
            key={activeSubStep}
            initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-5"
        >
          {/* Section Header */}
            <div className="flex items-start justify-between">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">
                {activeSectionConfig.title}
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-white/60">
                  {activeSectionConfig.subtitle} <span className="text-gray-400 dark:text-white/40">({activeSectionConfig.recommended})</span>
              </p>
            </div>
              
              <button
                onClick={() => addVariant(activeSubStep)}
                disabled={activeVariants.length >= activeSectionConfig.maxVariants}
                className={`
                  inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-medium
                  transition-all duration-200
                ${activeVariants.length >= activeSectionConfig.maxVariants
                  ? 'bg-gray-100 dark:bg-white/[0.04] text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm'
                }
              `}
            >
                <Plus className="w-3.5 h-3.5" />
              Add Variant
            </button>
          </div>

            {/* Shared Merge Fields */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/[0.06]">
              <p className="text-[10px] font-medium text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2.5">
                Personalization Fields
              </p>
              <MergeFieldPills onInsert={(field) => {
                // Insert into the first variant's textarea by default, or the focused one
                const focusedTextarea = Array.from(textareaRefs.current.entries()).find(([key]) => 
                  document.activeElement === textareaRefs.current.get(key)
                );
                const targetIndex = focusedTextarea ? parseInt(focusedTextarea[0].split('-')[1]) : 0;
                insertMergeField(field, targetIndex);
              }} />
            </div>

            {/* Variants List */}
            <div className="space-y-4">
            {activeVariants.map((variant, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="group relative"
              >
                  <div className="flex items-start gap-3">
                  {/* Variant Number */}
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06] 
                      flex items-center justify-center text-[13px] font-bold text-gray-500 dark:text-gray-400 
                      flex-shrink-0 mt-1">
                    {index + 1}
                  </div>

                    {/* Textarea Container - Fixed cursor issue */}
                    <div className="flex-1 space-y-2.5">
                      <textarea
                        ref={(el) => {
                            const key = `${activeSubStep}-${index}`;
                          if (el) {
                            textareaRefs.current.set(key, el);
                          } else {
                            textareaRefs.current.delete(key);
                          }
                        }}
                        value={variant}
                          onChange={(e) => updateVariant(activeSubStep, index, e.target.value)}
                        placeholder={activeSectionConfig.placeholder}
                        rows={activeSubStep === 'bodies' ? 4 : 2}
                        className="w-full px-4 py-3 text-[13px] bg-white dark:bg-[#1a1a1a] 
                          text-gray-900 dark:text-white
                            border border-gray-200 dark:border-white/[0.08]
                          rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/[0.1] focus:border-gray-300 dark:focus:border-white/[0.15]
                          placeholder-gray-400 dark:placeholder-white/30
                            resize-none transition-all duration-200 leading-relaxed"
                      />

                      {/* AI Generate Button */}
                      <button
                        onClick={() => generateVariant(activeSubStep, index)}
                        disabled={generatingVariantIndex === index}
                        className="group/btn inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium
                          bg-gray-100 dark:bg-white/[0.05]
                          text-gray-600 dark:text-gray-400
                          border border-gray-200/80 dark:border-white/[0.06]
                          hover:bg-gray-200/80 dark:hover:bg-white/[0.08]
                          hover:text-gray-900 dark:hover:text-white
                          active:scale-[0.98]
                          transition-all duration-200
                          disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {/* Avatar */}
                          <motion.div
                            animate={generatingVariantIndex === index ? {
                            scale: [1, 1.1, 1],
                            } : {}}
                            transition={{
                            duration: 1.2,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                          >
                            <Avatar 
                              config={avatarConfig} 
                            size={16} 
                            className="rounded-full"
                            />
                          </motion.div>
                        
                        <span>
                          {generatingVariantIndex === index ? 'Generating...' : 'Generate with AI'}
                        </span>
                      </button>
                  </div>

                  {/* Delete Button */}
                  {activeVariants.length > 1 && (
                    <button
                        onClick={() => removeVariant(activeSubStep, index)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1
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
      
            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 pt-4">
              {SUB_STEPS.map((step, idx) => (
              <button
                    key={step}
                  onClick={() => setActiveSubStep(step)}
                    className={`
                    h-2 rounded-full transition-all duration-200
                      ${idx === currentSubStepIndex
                      ? 'w-6 bg-gray-900 dark:bg-white'
                        : idx < currentSubStepIndex
                        ? 'w-2 bg-gray-400 dark:bg-gray-500 hover:bg-gray-500 dark:hover:bg-gray-400'
                        : 'w-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }
                    `}
                  />
                ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Preview Section - Email-like UI */}
      <div className="flex-shrink-0 mt-6 pt-5 border-t border-gray-200/50 dark:border-white/[0.06]">
        {/* Preview Header */}
              <div className="flex items-center justify-between mb-4">
          <h4 className="text-[13px] font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              Live Preview
                </h4>
            
          {/* Variant Combination Selector */}
            {hasContent() && (
              <div className="flex items-center gap-2">
              {/* Pill Selectors */}
              <div className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-white/[0.04] rounded-lg">
                {/* Hook Selector */}
                <div className="relative group">
                  <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold
                    bg-amber-500/10 text-amber-600 dark:text-amber-400 
                    hover:bg-amber-500/20 transition-all duration-200">
                    <MessageSquare className="w-3 h-3" />
                    <span>H{previewIndices.hook + 1}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 z-20 hidden group-hover:block">
                    <div className="py-1 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-white/[0.08]">
                      {abTestConfig.hooks.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPreviewIndices(prev => ({ ...prev, hook: idx }))}
                          className={`w-full px-3 py-1.5 text-[11px] font-medium text-left transition-colors
                            ${previewIndices.hook === idx 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                            }`}
                        >
                          Hook {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <span className="text-gray-300 dark:text-gray-600 text-[10px]">+</span>

                {/* Body Selector */}
                <div className="relative group">
                  <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold
                    bg-blue-500/10 text-blue-600 dark:text-blue-400 
                    hover:bg-blue-500/20 transition-all duration-200">
                    <FileText className="w-3 h-3" />
                    <span>B{previewIndices.body + 1}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 z-20 hidden group-hover:block">
                    <div className="py-1 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-white/[0.08]">
                      {abTestConfig.bodies.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPreviewIndices(prev => ({ ...prev, body: idx }))}
                          className={`w-full px-3 py-1.5 text-[11px] font-medium text-left transition-colors
                            ${previewIndices.body === idx 
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                            }`}
                        >
                          Body {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <span className="text-gray-300 dark:text-gray-600 text-[10px]">+</span>

                {/* CTA Selector */}
                <div className="relative group">
                  <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold
                    bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 
                    hover:bg-emerald-500/20 transition-all duration-200">
                    <Target className="w-3 h-3" />
                    <span>C{previewIndices.cta + 1}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                  <div className="absolute top-full right-0 mt-1 z-20 hidden group-hover:block">
                    <div className="py-1 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-white/[0.08]">
                      {abTestConfig.ctas.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPreviewIndices(prev => ({ ...prev, cta: idx }))}
                          className={`w-full px-3 py-1.5 text-[11px] font-medium text-left transition-colors
                            ${previewIndices.cta === idx 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                            }`}
                        >
                          CTA {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shuffle Button */}
              <button
                onClick={() => setPreviewIndices({
                  hook: Math.floor(Math.random() * abTestConfig.hooks.length),
                  body: Math.floor(Math.random() * abTestConfig.bodies.length),
                  cta: Math.floor(Math.random() * abTestConfig.ctas.length),
                })}
                className="p-2 rounded-lg text-gray-400 dark:text-gray-500 
                  hover:text-gray-600 dark:hover:text-gray-300 
                  hover:bg-gray-100 dark:hover:bg-white/[0.06]
                  transition-all duration-200"
                title="Randomize combination"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              </div>
            )}
              </div>

        {/* Email Preview Card */}
          {hasContent() ? (
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f0f]">
            {/* Email Header */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200/50 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-900 dark:text-white truncate">
                    To: <span className="text-gray-500 dark:text-gray-400">{'{{firstName}} {{lastName}}'}</span>
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-500">
                    at <span className="text-gray-600 dark:text-gray-400">{'{{company}}'}</span>
                  </p>
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-600">
                  Preview
                </div>
              </div>
            </div>

            {/* Email Body - Segmented View */}
            <div className="p-4 space-y-0 max-h-[180px] overflow-y-auto">
              {/* Hook Section */}
              {abTestConfig.hooks[previewIndices.hook]?.trim() && (
                <div className="group relative">
                  <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-amber-400/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed pl-0 group-hover:pl-2 transition-all duration-200">
                    {highlightMergeFieldsInPreview(abTestConfig.hooks[previewIndices.hook])}
                  </p>
                </div>
              )}
              
              {/* Body Section */}
              {abTestConfig.bodies[previewIndices.body]?.trim() && (
                <div className="group relative mt-3">
                  <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-blue-400/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed pl-0 group-hover:pl-2 transition-all duration-200">
                    {highlightMergeFieldsInPreview(abTestConfig.bodies[previewIndices.body])}
                  </p>
                </div>
              )}
              
              {/* CTA Section */}
              {abTestConfig.ctas[previewIndices.cta]?.trim() && (
                <div className="group relative mt-3">
                  <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-emerald-400/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed pl-0 group-hover:pl-2 transition-all duration-200">
                    {highlightMergeFieldsInPreview(abTestConfig.ctas[previewIndices.cta])}
                  </p>
                </div>
              )}
            </div>

            {/* Combination Stats */}
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200/50 dark:border-white/[0.06]">
              <p className="text-[10px] text-gray-500 dark:text-gray-500">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {abTestConfig.hooks.filter(h => h.trim()).length * 
                   abTestConfig.bodies.filter(b => b.trim()).length * 
                   abTestConfig.ctas.filter(c => c.trim()).length}
                </span>
                {' '}possible combinations will be tested
              </p>
            </div>
            </div>
          ) : (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.01] p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
              <Eye className="w-5 h-5 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-[13px] font-medium text-gray-600 dark:text-gray-400 mb-1">
              No preview available
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-600">
              Add variants above to see how your email will look
          </p>
        </div>
      )}
      </div>
    </div>
  );
}

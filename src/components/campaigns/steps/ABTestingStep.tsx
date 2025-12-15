import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Eye, Sparkles, MessageSquare, FileText, Target, ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
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

const sections: SectionConfig[] = [
  {
    id: 'hooks',
    icon: MessageSquare,
    title: 'Opening Hooks',
    subtitle: 'First sentences to grab attention',
    placeholder: 'Hi {{firstName}}, I noticed your work at {{company}}...',
    maxVariants: 5,
    recommended: '3-5 variants',
  },
  {
    id: 'bodies',
    icon: FileText,
    title: 'Email Bodies',
    subtitle: 'Main message content',
    placeholder: 'I wanted to reach out because...',
    maxVariants: 3,
    recommended: '2-3 variants',
  },
  {
    id: 'ctas',
    icon: Target,
    title: 'Call-to-Actions',
    subtitle: 'Closing and next steps',
    placeholder: 'Would you be open to a quick call this week?',
    maxVariants: 3,
    recommended: '2-3 variants',
  },
];

const SUB_STEPS: SubStep[] = ['hooks', 'bodies', 'ctas'];

export default function ABTestingStep({ data, onUpdate }: ABTestingStepProps) {
  const [activeSubStep, setActiveSubStep] = useState<SubStep>('hooks');
  const [previewIndices, setPreviewIndices] = useState({ hook: 0, body: 0, cta: 0 });
  const [generatingVariantIndex, setGeneratingVariantIndex] = useState<number | null>(null);
  const [outreachGoal, setOutreachGoal] = useState<'job' | 'internship' | 'networking'>(
    data.outreachGoal || 'job'
  );
  
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const avatarConfig = useAvatarConfig();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Initialize with empty arrays if not set
  const abTestConfig = data.abTestConfig || { hooks: [''], bodies: [''], ctas: [''] };

  // Get current sub-step index
  const currentSubStepIndex = SUB_STEPS.indexOf(activeSubStep);
  const activeSectionConfig = sections.find(s => s.id === activeSubStep)!;
  const activeVariants = abTestConfig[activeSubStep];

  // Update outreach goal in campaign data
  const handleOutreachGoalChange = (goal: 'job' | 'internship' | 'networking') => {
    setOutreachGoal(goal);
    onUpdate({ outreachGoal: goal });
  };

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

  // Navigation between sub-steps
  const handleNextSubStep = () => {
    const nextIndex = currentSubStepIndex + 1;
    if (nextIndex < SUB_STEPS.length) {
      setActiveSubStep(SUB_STEPS[nextIndex]);
    }
  };

  const handlePrevSubStep = () => {
    const prevIndex = currentSubStepIndex - 1;
    if (prevIndex >= 0) {
      setActiveSubStep(SUB_STEPS[prevIndex]);
    }
  };

  // Check if current section has at least one valid variant
  const currentSectionValid = activeVariants.some(v => v.trim());

  // Generate preview email
  const generatePreview = () => {
    const hook = abTestConfig.hooks[previewIndices.hook] || '';
    const body = abTestConfig.bodies[previewIndices.body] || '';
    const cta = abTestConfig.ctas[previewIndices.cta] || '';
    
    return `${hook}\n\n${body}\n\n${cta}`;
  };

  // Check if configuration is valid (for preview)
  const hasContent = () => {
    return (
      abTestConfig.hooks.some(h => h.trim()) ||
      abTestConfig.bodies.some(b => b.trim()) ||
      abTestConfig.ctas.some(c => c.trim())
    );
  };

  // Render merge field highlighted text
  const renderHighlightedText = (text: string) => {
    return text.split(/(\{\{[^}]+\}\})/g).map((part, idx) => {
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
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header Section - Compact */}
      <div className="flex-shrink-0 space-y-6 mb-8">
        {/* Outreach Goal Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-3">
            Outreach Goal
          </label>
          <div className="inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/[0.04] rounded-xl">
            {(['job', 'internship', 'networking'] as const).map((goal) => (
          <button
                key={goal}
            type="button"
                onClick={() => handleOutreachGoalChange(goal)}
            className={`
                  px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200
                  ${outreachGoal === goal
                ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
                {goal === 'job' ? 'Job Search' : goal === 'internship' ? 'Internship' : 'Networking'}
          </button>
            ))}
        </div>
      </div>

        {/* Sub-step Progress Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
                    flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-medium
                transition-all duration-200
                ${isActive
                      ? 'bg-[#b7e219]/10 dark:bg-[#b7e219]/15 text-gray-900 dark:text-white ring-1 ring-[#b7e219]/50'
                      : isPast
                        ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.04]'
                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#b7e219]' : ''}`} />
              <span className="hidden sm:inline">{section.title}</span>
                  {variantCount > 0 && (
              <span className={`
                      inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold
                ${isActive
                  ? 'bg-[#b7e219] text-gray-900'
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
        </div>

        {/* Info Tip - Compact */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200/50 dark:border-purple-500/20">
          <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
          <p className="text-[12px] text-purple-700 dark:text-purple-300">
            Each email will randomly combine one hook, one body, and one CTA. We'll track which combinations perform best.
          </p>
        </div>
      </div>

      {/* Active Section Editor - Full Width */}
      <div className="flex-1 min-h-0">
      <AnimatePresence mode="wait">
        <motion.div
            key={activeSubStep}
            initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-6"
        >
          {/* Section Header */}
            <div className="flex items-start justify-between">
            <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {activeSectionConfig.title}
                </h3>
                <p className="text-[14px] text-gray-500 dark:text-white/60">
                  {activeSectionConfig.subtitle} <span className="text-gray-400 dark:text-white/40">({activeSectionConfig.recommended})</span>
              </p>
            </div>
              
              <button
                onClick={() => addVariant(activeSubStep)}
                disabled={activeVariants.length >= activeSectionConfig.maxVariants}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold
                  transition-all duration-200
                ${activeVariants.length >= activeSectionConfig.maxVariants
                  ? 'bg-gray-100 dark:bg-white/[0.04] text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-[#b7e219] text-gray-900 hover:bg-[#a5cb17] shadow-sm hover:shadow-md'
                }
              `}
            >
              <Plus className="w-4 h-4" />
              Add Variant
            </button>
          </div>

            {/* Shared Merge Fields - Once at the top */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/[0.06]">
              <p className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider mb-3">
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
                  <div className="flex items-start gap-4">
                  {/* Variant Number */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/[0.06] dark:to-white/[0.02] 
                      flex items-center justify-center text-[15px] font-bold text-gray-500 dark:text-gray-400 
                      flex-shrink-0 mt-1 border border-gray-200/50 dark:border-white/[0.06]">
                    {index + 1}
                  </div>

                    {/* Textarea Container */}
                  <div className="flex-1 space-y-3">
                    <div className="relative">
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
                          rows={activeSubStep === 'bodies' ? 5 : 3}
                          className="w-full px-5 py-4 text-[14px] bg-white dark:bg-[#1a1a1a] 
                            border border-gray-200 dark:border-white/[0.08]
                            rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b7e219]/30 focus:border-[#b7e219]
                            text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30
                            resize-none transition-all duration-200 leading-relaxed"
                        style={{
                          color: 'transparent',
                            caretColor: 'currentColor'
                        }}
                      />
                      {/* Overlay with styled merge fields */}
                      <div 
                          className="absolute inset-0 px-5 py-4 text-[14px] pointer-events-none rounded-xl overflow-hidden leading-relaxed"
                      >
                        <div className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                            {renderHighlightedText(variant)}
                          </div>
                      </div>
                    </div>

                      {/* AI Generate Button - Premium Avatar */}
                      <button
                        onClick={() => generateVariant(activeSubStep, index)}
                        disabled={generatingVariantIndex === index}
                        className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-[12px] font-medium
                          bg-white/60 dark:bg-white/[0.06] backdrop-blur-md
                          text-gray-600 dark:text-gray-300
                          border border-white/50 dark:border-white/[0.08]
                          shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)]
                          hover:bg-white/80 dark:hover:bg-white/[0.1]
                          hover:border-[#b7e219]/40 dark:hover:border-[#b7e219]/30
                          hover:text-gray-900 dark:hover:text-white
                          hover:shadow-[0_4px_16px_-2px_rgba(183,226,25,0.2)] dark:hover:shadow-[0_4px_16px_-2px_rgba(183,226,25,0.15)]
                          active:scale-[0.98]
                          transition-all duration-300 ease-out
                          disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {/* Avatar Container with Premium Ring */}
                        <div className="relative flex-shrink-0">
                          {/* Animated ring when generating */}
                          {generatingVariantIndex === index && (
                            <motion.div
                              className="absolute -inset-1 rounded-full"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <motion.div
                                className="absolute inset-0 rounded-full border-2 border-transparent"
                                style={{
                                  background: 'linear-gradient(90deg, transparent 50%, #b7e219 50%) border-box',
                                  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                                  WebkitMaskComposite: 'xor',
                                  maskComposite: 'exclude',
                                }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              />
                            </motion.div>
                          )}
                          
                          {/* Subtle glow ring on hover (when not generating) */}
                          <div className={`
                            absolute -inset-0.5 rounded-full 
                            bg-gradient-to-r from-[#b7e219]/0 via-[#b7e219]/30 to-[#b7e219]/0
                            opacity-0 group-hover:opacity-100 
                            transition-opacity duration-300
                            ${generatingVariantIndex === index ? 'hidden' : ''}
                          `} />
                          
                          {/* Avatar with pulse animation when generating */}
                          <motion.div
                            animate={generatingVariantIndex === index ? {
                              scale: [1, 1.08, 1],
                            } : {}}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                            className="relative"
                          >
                            <Avatar 
                              config={avatarConfig} 
                              size={18} 
                              className={`
                                rounded-full ring-1 ring-offset-1 ring-offset-white dark:ring-offset-[#1a1a1a]
                                ${generatingVariantIndex === index 
                                  ? 'ring-[#b7e219]' 
                                  : 'ring-gray-200/60 dark:ring-white/10 group-hover:ring-[#b7e219]/50'
                                }
                                transition-all duration-300
                              `}
                            />
                          </motion.div>
                        </div>
                        
                        {/* Text with generating state */}
                        <span className={`
                          transition-colors duration-300
                          ${generatingVariantIndex === index 
                            ? 'text-[#b7e219] dark:text-[#b7e219]' 
                            : 'group-hover:text-gray-900 dark:group-hover:text-white'
                          }
                        `}>
                          {generatingVariantIndex === index ? 'Generating...' : 'Generate with AI'}
                        </span>
                        
                        {/* Sparkle accent on hover */}
                        <Sparkles className={`
                          w-3 h-3 transition-all duration-300
                          ${generatingVariantIndex === index 
                            ? 'text-[#b7e219] animate-pulse' 
                            : 'text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-[#b7e219]'
                          }
                        `} />
                      </button>
                  </div>

                  {/* Delete Button */}
                  {activeVariants.length > 1 && (
                    <button
                        onClick={() => removeVariant(activeSubStep, index)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-1
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
      
            {/* Internal Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200/50 dark:border-white/[0.06]">
              <button
                onClick={handlePrevSubStep}
                disabled={currentSubStepIndex === 0}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium
                  transition-all duration-200
                  ${currentSubStepIndex === 0
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                  }
                `}
              >
                <ArrowLeft className="w-4 h-4" />
                {currentSubStepIndex > 0 ? sections[currentSubStepIndex - 1].title : 'Back'}
              </button>

              <div className="flex items-center gap-2">
                {SUB_STEPS.map((step, idx) => (
                  <div
                    key={step}
                    className={`
                      w-2 h-2 rounded-full transition-all duration-200
                      ${idx === currentSubStepIndex
                        ? 'w-6 bg-[#b7e219]'
                        : idx < currentSubStepIndex
                          ? 'bg-[#b7e219]/50'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }
                    `}
                  />
                ))}
      </div>

              {currentSubStepIndex < SUB_STEPS.length - 1 ? (
        <button
                  onClick={handleNextSubStep}
                  disabled={!currentSectionValid}
          className={`
                    inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold
            transition-all duration-200
                    ${currentSectionValid
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm'
              : 'bg-gray-100 dark:bg-white/[0.04] text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }
          `}
        >
                  {sections[currentSubStepIndex + 1].title}
                  <ArrowRight className="w-4 h-4" />
        </button>
              ) : (
                <div className="w-[120px]" /> 
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Preview Section - Sticky Bottom */}
      <div className="flex-shrink-0 mt-8 pt-6 border-t border-gray-200/50 dark:border-white/[0.06]">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-white/[0.03] dark:to-white/[0.01] 
          border border-gray-200/60 dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
            <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              Live Preview
                </h4>
            
            {/* Mini Selectors */}
            {hasContent() && (
              <div className="flex items-center gap-2">
                <select
                  value={previewIndices.hook}
                  onChange={(e) => setPreviewIndices(prev => ({ ...prev, hook: parseInt(e.target.value) }))}
                  className="px-2.5 py-1.5 text-[11px] font-medium bg-white dark:bg-[#1a1a1a] 
                    border border-gray-200 dark:border-white/[0.08] rounded-lg 
                    text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {abTestConfig.hooks.map((_, idx) => (
                    <option key={idx} value={idx}>Hook {idx + 1}</option>
                  ))}
                </select>
                <span className="text-gray-300 dark:text-gray-600">+</span>
                <select
                  value={previewIndices.body}
                  onChange={(e) => setPreviewIndices(prev => ({ ...prev, body: parseInt(e.target.value) }))}
                  className="px-2.5 py-1.5 text-[11px] font-medium bg-white dark:bg-[#1a1a1a] 
                    border border-gray-200 dark:border-white/[0.08] rounded-lg 
                    text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {abTestConfig.bodies.map((_, idx) => (
                    <option key={idx} value={idx}>Body {idx + 1}</option>
                  ))}
                </select>
                <span className="text-gray-300 dark:text-gray-600">+</span>
                <select
                  value={previewIndices.cta}
                  onChange={(e) => setPreviewIndices(prev => ({ ...prev, cta: parseInt(e.target.value) }))}
                  className="px-2.5 py-1.5 text-[11px] font-medium bg-white dark:bg-[#1a1a1a] 
                    border border-gray-200 dark:border-white/[0.08] rounded-lg 
                    text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {abTestConfig.ctas.map((_, idx) => (
                    <option key={idx} value={idx}>CTA {idx + 1}</option>
                  ))}
                </select>
              </div>
            )}
              </div>

          {/* Preview Content */}
          {hasContent() ? (
            <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-gray-200/50 dark:border-white/[0.06] 
              max-h-[150px] overflow-y-auto">
              <p className="text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {renderHighlightedText(generatePreview())}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[13px] text-gray-400 dark:text-white/40">
                Add variants to see preview
          </p>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

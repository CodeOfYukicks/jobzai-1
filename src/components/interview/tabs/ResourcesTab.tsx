import { memo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Sparkles, Copy, Check, Loader2, Linkedin, MessageCircleQuestion, RefreshCw } from 'lucide-react';
import { Interview } from '../../../types/interview';
import { JobApplication } from '../../../types/job';

interface ResourcesTabProps {
  application: JobApplication;
  interview?: Interview;
  resourcesData?: Interview['resourcesData'];
  setResourcesData: (data: Interview['resourcesData']) => void;
  saveResourcesData: (data: Interview['resourcesData']) => Promise<void>;
  onGenerateQuestions: () => Promise<string[]>;
  onGeneratePitch: () => Promise<string>;
  isGeneratingQuestions?: boolean;
  isGeneratingPitch?: boolean;
}

const ResourcesTab = memo(function ResourcesTab({
  application,
  interview,
  resourcesData,
  setResourcesData,
  saveResourcesData,
  onGenerateQuestions,
  onGeneratePitch,
  isGeneratingQuestions = false,
  isGeneratingPitch = false,
}: ResourcesTabProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pitchText, setPitchText] = useState(resourcesData?.elevatorPitch || '');

  // Sync pitch text with resourcesData
  useEffect(() => {
    if (resourcesData?.elevatorPitch !== undefined) {
      setPitchText(resourcesData.elevatorPitch);
    }
  }, [resourcesData?.elevatorPitch]);

  // Debounced save for elevator pitch
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (pitchText !== (resourcesData?.elevatorPitch || '')) {
        const updated = { ...(resourcesData || {}), elevatorPitch: pitchText } as Interview['resourcesData'];
        setResourcesData(updated);
        saveResourcesData(updated);
      }
    }, 800);
    return () => clearTimeout(timeout);
  }, [pitchText]);

  const handleCopyQuestion = useCallback((question: string, index: number) => {
    navigator.clipboard.writeText(question);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const handleGenerateQuestions = async () => {
    const questions = await onGenerateQuestions();
    if (questions.length > 0) {
      const updated = { ...(resourcesData || {}), questionsToAsk: questions } as Interview['resourcesData'];
      setResourcesData(updated);
      await saveResourcesData(updated);
    }
  };

  const handleGeneratePitch = async () => {
    const pitch = await onGeneratePitch();
    if (pitch) {
      setPitchText(pitch);
      const updated = { ...(resourcesData || {}), elevatorPitch: pitch } as Interview['resourcesData'];
      setResourcesData(updated);
      await saveResourcesData(updated);
    }
  };

  // Word count and estimated speaking time
  const wordCount = pitchText.trim().split(/\s+/).filter(Boolean).length;
  const speakingTime = Math.round(wordCount / 2.5); // ~150 words per minute = 2.5 words per second

  const essentialResources = [
    { 
      id: 'glassdoor', 
      title: 'Glassdoor Reviews', 
      url: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(application.companyName)}`, 
      description: 'Check employee reviews and interview experiences',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20',
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white',
      Icon: ({ className }: { className?: string }) => (
        <div className={`font-bold text-sm ${className}`}>GD</div>
      )
    },
    { 
      id: 'linkedin', 
      title: 'LinkedIn Company Page', 
      url: `https://www.linkedin.com/company/${encodeURIComponent(application.companyName)}`, 
      description: 'Research employees and company updates',
      bgColor: 'bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-950/40 dark:to-sky-900/20',
      iconBg: 'bg-sky-500',
      iconColor: 'text-white',
      Icon: Linkedin
    },
    {
      id: 'levels',
      title: 'Levels.fyi Salaries',
      url: `https://www.levels.fyi/companies/${encodeURIComponent(application.companyName.toLowerCase().replace(/\s+/g, '-'))}/salaries/${encodeURIComponent(application.position.toLowerCase().replace(/\s+/g, '-'))}`,
      description: 'Detailed salary data by level and location',
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20',
      iconBg: 'bg-amber-500',
      iconColor: 'text-white',
      Icon: ({ className }: { className?: string }) => (
        <div className={`font-bold text-sm ${className}`}>L.</div>
      )
    },
    {
      id: 'glassdoor-salary',
      title: 'Glassdoor Salaries',
      url: `https://www.glassdoor.com/Salaries/index.htm?keyword=${encodeURIComponent(application.position)}`,
      description: 'Salary ranges & trends for this role',
      bgColor: 'bg-gradient-to-br from-jobzai-50 to-jobzai-100/50 dark:from-jobzai-950/40 dark:to-jobzai-900/20',
      iconBg: '',
      iconStyle: { background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)' },
      iconColor: 'text-white',
      Icon: ({ className }: { className?: string }) => (
        <div className={`font-bold text-sm ${className}`}>$</div>
      )
    },
  ];

  // Premium Generate Button Component
  const GenerateButton = ({ 
    onClick, 
    isLoading, 
    label = 'Generate with AI',
    loadingLabel = 'Generating...',
    variant = 'primary'
  }: { 
    onClick: () => void; 
    isLoading: boolean; 
    label?: string;
    loadingLabel?: string;
    variant?: 'primary' | 'secondary';
  }) => (
    <motion.button
      onClick={onClick}
      disabled={isLoading}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
      className={`
        group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold transition-all
        ${variant === 'primary' 
          ? 'text-white shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none' 
          : 'ring-1 ring-slate-200 dark:ring-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:ring-jobzai-400 dark:hover:ring-jobzai-600 hover:text-jobzai-600 dark:hover:text-jobzai-400 disabled:opacity-50'
        }
      `}
      style={variant === 'primary' ? { background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)', boxShadow: '0 4px 14px rgba(99, 91, 255, 0.35)' } : undefined}
    >
      <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
      
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin relative z-10" />
          <span className="relative z-10">{loadingLabel}</span>
        </>
      ) : (
        <>
          {variant === 'secondary' ? (
            <RefreshCw className="w-4 h-4 relative z-10" />
          ) : (
            <Sparkles className="w-4 h-4 relative z-10" />
          )}
          <span className="relative z-10">{label}</span>
        </>
      )}
    </motion.button>
  );

  return (
    <div className="space-y-16 max-w-5xl mx-auto">
      {/* Section 1: Essential Resources */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 px-1">Essential Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {essentialResources.map((resource, index) => (
            <motion.a 
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className={`
                relative flex flex-col p-5 rounded-2xl transition-all duration-300 
                ring-1 ring-slate-200/60 dark:ring-slate-800/60
                hover:shadow-premium-hover hover:ring-jobzai-300/50 dark:hover:ring-jobzai-700/50
                group overflow-hidden
                ${resource.bgColor}
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className={`w-10 h-10 rounded-xl ${resource.iconBg} flex items-center justify-center shadow-sm`}
                  style={(resource as any).iconStyle}
                >
                  <resource.Icon className={`w-5 h-5 ${resource.iconColor}`} />
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="mt-auto">
                <h4 className="font-semibold text-sm mb-1.5 text-slate-900 dark:text-white">
                  {resource.title}
                </h4>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {resource.description}
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </motion.section>

      {/* Section 2: Questions to Ask Generator */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Questions to Ask</h3>
          {resourcesData?.questionsToAsk && resourcesData.questionsToAsk.length > 0 && (
            <GenerateButton 
              onClick={handleGenerateQuestions} 
              isLoading={isGeneratingQuestions}
              label="Regenerate"
              loadingLabel="Generating..."
              variant="secondary"
            />
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resourcesData?.questionsToAsk && resourcesData.questionsToAsk.length > 0 ? (
            resourcesData.questionsToAsk.map((question, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative p-5 rounded-xl bg-white dark:bg-slate-800/50 ring-1 ring-slate-200/60 dark:ring-slate-700/50 hover:shadow-premium-soft hover:ring-jobzai-300/50 dark:hover:ring-jobzai-700/50 transition-all duration-200"
              >
                {/* Subtle indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-jobzai-400 to-jobzai-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pr-8">
                  {question}
                </p>
                <motion.button
                  onClick={() => handleCopyQuestion(question, index)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-3 right-3 p-2 text-slate-400 hover:text-jobzai-600 dark:hover:text-jobzai-400 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 dark:bg-slate-800/90 rounded-lg backdrop-blur-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50"
                  title="Copy question"
                >
                  {copiedIndex === index ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </motion.button>
              </motion.div>
            ))
          ) : (
            // Premium Empty State
            <div className="col-span-full relative overflow-hidden rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/50 bg-gradient-to-br from-slate-50 via-white to-jobzai-50/30 dark:from-slate-800/50 dark:via-slate-900 dark:to-jobzai-950/10">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
              
              {/* Decorative Gradient Orbs */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-jobzai-200 dark:bg-jobzai-900/30 rounded-full blur-3xl opacity-40" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-jobzai-300 dark:bg-jobzai-800/30 rounded-full blur-3xl opacity-40" />
              
              <div className="relative flex flex-col items-center justify-center py-20 px-6 text-center">
                {/* Icon with Glow */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-jobzai-400/30 dark:bg-jobzai-500/20 rounded-full blur-xl scale-150" />
                  <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)', boxShadow: '0 4px 14px rgba(99, 91, 255, 0.35)' }}>
                    <MessageCircleQuestion className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                {/* Text Content */}
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Prepare thoughtful questions
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                  Stand out by asking smart, role-specific questions. Our AI will generate personalized questions based on the company and position.
                </p>
                
                {/* CTA Button */}
                <GenerateButton 
                  onClick={handleGenerateQuestions} 
                  isLoading={isGeneratingQuestions}
                  label="Generate Questions"
                  loadingLabel="Generating..."
                />
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Section 3: Elevator Pitch Builder */}
      <motion.section 
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Elevator Pitch</h3>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => {
                  navigator.clipboard.writeText(pitchText);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-xs font-medium text-slate-500 hover:text-jobzai-600 dark:text-slate-400 dark:hover:text-jobzai-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                disabled={!pitchText}
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </motion.button>
              <GenerateButton 
                onClick={handleGeneratePitch} 
                isLoading={isGeneratingPitch}
                label="Auto-generate"
                loadingLabel="Generating..."
                variant="secondary"
              />
            </div>
          </div>

          <div className="relative group rounded-2xl bg-white dark:bg-slate-800 shadow-premium-soft ring-1 ring-slate-200/60 dark:ring-slate-700/60 overflow-hidden transition-all hover:shadow-premium-hover hover:ring-jobzai-300/50 dark:hover:ring-jobzai-700/50">
            {/* Subtle top accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-jobzai-500/20 via-jobzai-500/40 to-jobzai-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <textarea
              value={pitchText}
              onChange={(e) => setPitchText(e.target.value)}
              placeholder="Start typing your 30-second pitch here... Who are you? What do you do? Why are you excited about this role?"
              className="w-full h-96 p-8 text-lg leading-relaxed text-slate-700 dark:text-slate-200 bg-transparent border-none focus:ring-0 resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
              spellCheck={false}
            />
            
            {/* Floating status bar */}
            <div className="absolute bottom-6 right-6 flex items-center gap-3 pointer-events-none transition-opacity duration-200 opacity-60 group-hover:opacity-100">
              <div className={`
                px-3 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md ring-1 transition-colors
                ${speakingTime >= 30 && speakingTime <= 60 
                  ? 'bg-emerald-50/90 text-emerald-600 ring-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-800/50' 
                  : speakingTime > 60 
                    ? 'bg-amber-50/90 text-amber-600 ring-amber-200/60 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-800/50'
                    : 'bg-slate-50/90 text-slate-500 ring-slate-200/60 dark:bg-slate-800/90 dark:text-slate-400 dark:ring-slate-700/60'
                }
              `}>
                ~{speakingTime}s speaking time
              </div>
              <div className="px-3 py-1.5 rounded-full bg-slate-50/90 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 text-[11px] font-semibold ring-1 ring-slate-200/60 dark:ring-slate-700/60 backdrop-blur-md">
                {wordCount} words
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
});

export default ResourcesTab;

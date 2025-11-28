import { memo, useState, useEffect, useCallback } from 'react';
import { ExternalLink, Sparkles, Copy, Check, Loader2, Linkedin, MessageCircleQuestion } from 'lucide-react';
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
      bgColor: 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800',
      borderColor: 'border-emerald-100 dark:border-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      Icon: ({ className }: { className?: string }) => (
        <div className={`font-bold text-lg ${className}`}>GD</div>
      )
    },
    { 
      id: 'linkedin', 
      title: 'LinkedIn Company Page', 
      url: `https://www.linkedin.com/company/${encodeURIComponent(application.companyName)}`, 
      description: 'Research employees and company updates',
      bgColor: 'bg-gradient-to-br from-blue-600 to-indigo-700',
      borderColor: 'border-blue-500',
      iconColor: 'text-white',
      textColor: 'text-white',
      descColor: 'text-blue-100',
      Icon: Linkedin
    },
    {
      id: 'levels',
      title: 'Levels.fyi Salaries',
      url: `https://www.levels.fyi/companies/${encodeURIComponent(application.companyName.toLowerCase().replace(/\s+/g, '-'))}/salaries/${encodeURIComponent(application.position.toLowerCase().replace(/\s+/g, '-'))}`,
      description: 'Detailed salary data by level and location',
      bgColor: 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800',
      borderColor: 'border-amber-100 dark:border-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      Icon: ({ className }: { className?: string }) => (
        <div className={`font-bold text-lg ${className}`}>L.</div>
      )
    },
    {
      id: 'glassdoor-salary',
      title: 'Glassdoor Salaries',
      url: `https://www.glassdoor.com/Salaries/index.htm?keyword=${encodeURIComponent(application.position)}`,
      description: 'Salary ranges & trends for this role',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800',
      borderColor: 'border-emerald-100 dark:border-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      Icon: ({ className }: { className?: string }) => (
        <div className={`font-bold text-lg ${className}`}>$</div>
      )
    },
  ];

  // Shared Generate Button Component
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
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-medium transition-all
        ${variant === 'primary' 
          ? 'bg-neutral-900 text-white shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none dark:bg-white dark:text-neutral-900' 
          : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
        }
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
      
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin relative z-10" />
          <span className="relative z-10">{loadingLabel}</span>
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 relative z-10" />
          <span className="relative z-10">{label}</span>
        </>
      )}
    </button>
  );

  return (
    <div className="space-y-16 max-w-5xl mx-auto">
      {/* Section 1: Essential Resources */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 px-1">Essential Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {essentialResources.map((resource) => (
            <a 
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                relative flex flex-col p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group overflow-hidden
                ${resource.bgColor} ${resource.borderColor}
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-white/20 backdrop-blur-sm ${resource.iconColor}`}>
                  <resource.Icon className="w-6 h-6" />
                </div>
                <ExternalLink className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${resource.textColor || 'text-gray-400 dark:text-gray-500'}`} />
              </div>
              
              <div className="mt-auto">
                <h4 className={`font-semibold text-sm mb-1 ${resource.textColor || 'text-gray-900 dark:text-white'}`}>
                  {resource.title}
                </h4>
                <p className={`text-xs leading-relaxed ${resource.descColor || 'text-gray-500 dark:text-gray-400'}`}>
                  {resource.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Section 2: Questions to Ask Generator */}
      <section>
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Questions to Ask</h3>
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
              <div 
                key={index}
                className="group relative p-5 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-purple-100 dark:hover:border-purple-900/30 transition-all duration-200"
              >
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pr-8">
                  {question}
                </p>
                <button
                  onClick={() => handleCopyQuestion(question, index)}
                  className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm"
                  title="Copy question"
                >
                  {copiedIndex === index ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))
          ) : (
            // Premium Empty State
            <div className="col-span-full relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/50 bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-800/50 dark:via-gray-800 dark:to-purple-900/10">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
              
              {/* Decorative Gradient Orbs */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-200 dark:bg-purple-900/30 rounded-full blur-3xl opacity-40" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-200 dark:bg-indigo-900/30 rounded-full blur-3xl opacity-40" />
              
              <div className="relative flex flex-col items-center justify-center py-20 px-6 text-center">
                {/* Icon with Glow */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-purple-400/30 dark:bg-purple-500/20 rounded-full blur-xl scale-150" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <MessageCircleQuestion className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                {/* Text Content */}
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Prepare thoughtful questions
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
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
      </section>

      {/* Section 3: Elevator Pitch Builder */}
      <section className="flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Elevator Pitch</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pitchText);
                }}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={!pitchText}
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
              <GenerateButton 
                onClick={handleGeneratePitch} 
                isLoading={isGeneratingPitch}
                label="Auto-generate"
                loadingLabel="Generating..."
                variant="secondary"
              />
            </div>
          </div>

          <div className="relative group rounded-xl bg-white dark:bg-gray-800 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            {/* Subtle top accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <textarea
              value={pitchText}
              onChange={(e) => setPitchText(e.target.value)}
              placeholder="Start typing your 30-second pitch here... Who are you? What do you do? Why are you excited about this role?"
              className="w-full h-96 p-8 text-lg leading-relaxed text-gray-700 dark:text-gray-200 bg-transparent border-none focus:ring-0 resize-none placeholder:text-gray-300 dark:placeholder:text-gray-600 font-serif"
              spellCheck={false}
            />
            
            {/* Floating status bar */}
            <div className="absolute bottom-6 right-6 flex items-center gap-3 pointer-events-none transition-opacity duration-200 opacity-60 group-hover:opacity-100">
              <div className={`
                px-3 py-1.5 rounded-full text-[11px] font-medium backdrop-blur-md border transition-colors
                ${speakingTime >= 30 && speakingTime <= 60 
                  ? 'bg-emerald-50/80 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' 
                  : speakingTime > 60 
                    ? 'bg-amber-50/80 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50'
                    : 'bg-gray-50/80 text-gray-500 border-gray-100 dark:bg-gray-800/80 dark:text-gray-400 dark:border-gray-700'
                }
              `}>
                ~{speakingTime}s speaking time
              </div>
              <div className="px-3 py-1.5 rounded-full bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 text-[11px] font-medium border border-gray-100 dark:border-gray-700 backdrop-blur-md">
                {wordCount} words
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

export default ResourcesTab;

import { memo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Copy, Check, Loader2, Sparkles, MessageSquare, Link2, Mic } from 'lucide-react';
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
  resourcesData,
  setResourcesData,
  saveResourcesData,
  onGenerateQuestions,
  onGeneratePitch,
  isGeneratingQuestions = false,
  isGeneratingPitch = false,
}: ResourcesTabProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pitchCopied, setPitchCopied] = useState(false);
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

  const handleCopyPitch = useCallback(() => {
    navigator.clipboard.writeText(pitchText);
    setPitchCopied(true);
    setTimeout(() => setPitchCopied(false), 2000);
  }, [pitchText]);

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
  const speakingTime = Math.round(wordCount / 2.5);

  const essentialResources = [
    { 
      id: 'glassdoor', 
      title: 'Glassdoor', 
      url: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(application.companyName)}`, 
      description: 'Reviews & interviews',
      abbr: 'GD',
      bgColor: 'bg-emerald-500 hover:bg-emerald-600',
      iconBg: 'bg-emerald-600/30',
    },
    { 
      id: 'linkedin', 
      title: 'LinkedIn', 
      url: `https://www.linkedin.com/company/${encodeURIComponent(application.companyName)}`, 
      description: 'Company page',
      abbr: 'in',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      iconBg: 'bg-blue-700/30',
    },
    {
      id: 'levels',
      title: 'Levels.fyi',
      url: `https://www.levels.fyi/companies/${encodeURIComponent(application.companyName.toLowerCase().replace(/\s+/g, '-'))}/salaries/${encodeURIComponent(application.position.toLowerCase().replace(/\s+/g, '-'))}`,
      description: 'Salary data',
      abbr: 'L.',
      bgColor: 'bg-violet-500 hover:bg-violet-600',
      iconBg: 'bg-violet-600/30',
    },
    {
      id: 'glassdoor-salary',
      title: 'Salaries',
      url: `https://www.glassdoor.com/Salaries/index.htm?keyword=${encodeURIComponent(application.position)}`,
      description: 'Salary ranges',
      abbr: '$',
      bgColor: 'bg-amber-500 hover:bg-amber-600',
      iconBg: 'bg-amber-600/30',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Section 1: Useful Links */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl bg-white dark:bg-[#2b2a2c] ring-1 ring-slate-200/60 dark:ring-[#3d3c3e]/60 p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#1a1b1e]">
            <Link2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400 dark:text-slate-500">
              Useful Links
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Research resources for {application.companyName}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {essentialResources.map((resource, index) => (
            <motion.a 
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              className={`
                group flex items-center gap-3 p-4
                rounded-xl shadow-md
                ${resource.bgColor}
                hover:shadow-lg
                transition-all duration-200
              `}
            >
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-lg
                ${resource.iconBg}
                flex items-center justify-center
                text-sm font-bold text-white
              `}>
                {resource.abbr}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {resource.title}
                </div>
                <div className="text-[11px] text-white/70 truncate">
                  {resource.description}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors flex-shrink-0" />
            </motion.a>
          ))}
        </div>
      </motion.section>

      {/* Section 2: Questions to Ask */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl bg-white dark:bg-[#2b2a2c] ring-1 ring-slate-200/60 dark:ring-[#3d3c3e]/60 p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#1a1b1e]">
              <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400 dark:text-slate-500">
                Questions to Ask
              </span>
              {resourcesData?.questionsToAsk && resourcesData.questionsToAsk.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 91, 255, 0.1) 0%, rgba(82, 73, 230, 0.1) 100%)',
                    color: '#635BFF',
                  }}
                >
                  {resourcesData.questionsToAsk.length}
                </span>
              )}
            </div>
          </div>
          
          <motion.button
            onClick={handleGenerateQuestions}
            disabled={isGeneratingQuestions}
            whileHover={{ scale: isGeneratingQuestions ? 1 : 1.02 }}
            whileTap={{ scale: isGeneratingQuestions ? 1 : 0.98 }}
            className="
              inline-flex items-center gap-2 px-4 py-2
              text-xs font-semibold rounded-xl
              text-white shadow-md
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-200
            "
            style={{
              background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)',
              boxShadow: '0 2px 8px rgba(99, 91, 255, 0.3)',
            }}
          >
            {isGeneratingQuestions ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {resourcesData?.questionsToAsk?.length ? 'Regenerate' : 'Generate with AI'}
              </>
            )}
          </motion.button>
        </div>
        
        {resourcesData?.questionsToAsk && resourcesData.questionsToAsk.length > 0 ? (
          <div className="space-y-3">
            {resourcesData.questionsToAsk.map((question, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="
                  group flex items-start gap-4 p-4
                  rounded-xl ring-1 ring-slate-200/40 dark:ring-[#3d3c3e]/40
                  bg-slate-50 dark:bg-[#1a1b1e]
                  hover:ring-slate-300/60 dark:hover:ring-[#4d4c4e]/60
                  transition-all duration-200
                "
              >
                {/* Number indicator */}
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-lg text-white text-[11px] font-bold flex items-center justify-center shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)',
                    boxShadow: '0 2px 6px rgba(99, 91, 255, 0.25)',
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1 pt-0.5">
                  {question}
                </p>
                
                <motion.button
                  onClick={() => handleCopyQuestion(question, index)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="
                    flex-shrink-0 p-2 rounded-lg
                    text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                    hover:bg-slate-200/50 dark:hover:bg-slate-700/50
                    opacity-0 group-hover:opacity-100
                    transition-all duration-200
                  "
                  title="Copy"
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="
            flex flex-col items-center justify-center py-12 px-6
            rounded-xl ring-1 ring-dashed ring-slate-300/60 dark:ring-[#3d3c3e]/60
            bg-slate-50/50 dark:bg-[#1a1b1e]/50
            text-center
          ">
            <div className="
              w-12 h-12 rounded-xl mb-4
              bg-slate-100 dark:bg-[#2b2a2c]
              flex items-center justify-center
              text-slate-400 dark:text-slate-500
            ">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              No questions generated yet
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Click Generate to create role-specific questions
            </p>
          </div>
        )}
      </motion.section>

      {/* Section 3: Elevator Pitch */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-2xl bg-white dark:bg-[#2b2a2c] ring-1 ring-slate-200/60 dark:ring-[#3d3c3e]/60 p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#1a1b1e]">
              <Mic className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400 dark:text-slate-500">
                Elevator Pitch
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your 30-second introduction
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleCopyPitch}
              disabled={!pitchText}
              whileHover={{ scale: pitchText ? 1.05 : 1 }}
              whileTap={{ scale: pitchText ? 0.95 : 1 }}
              className="
                inline-flex items-center gap-1.5 px-3 py-1.5
                text-xs font-medium rounded-lg
                text-slate-500 dark:text-slate-400
                hover:text-slate-700 dark:hover:text-slate-300
                hover:bg-slate-100 dark:hover:bg-[#1a1b1e]
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              {pitchCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy
            </motion.button>
            
            <motion.button
              onClick={handleGeneratePitch}
              disabled={isGeneratingPitch}
              whileHover={{ scale: isGeneratingPitch ? 1 : 1.02 }}
              whileTap={{ scale: isGeneratingPitch ? 1 : 0.98 }}
              className="
                inline-flex items-center gap-2 px-4 py-2
                text-xs font-semibold rounded-xl
                text-white shadow-md
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200
              "
              style={{
                background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)',
                boxShadow: '0 2px 8px rgba(99, 91, 255, 0.3)',
              }}
            >
              {isGeneratingPitch ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-generate
                </>
              )}
            </motion.button>
          </div>
        </div>

        <div className="
          rounded-xl ring-1 ring-slate-200/60 dark:ring-[#3d3c3e]/60
          bg-slate-50 dark:bg-[#1a1b1e]
          overflow-hidden
        ">
          <textarea
            value={pitchText}
            onChange={(e) => setPitchText(e.target.value)}
            placeholder="Write your 30-second pitch here... Who are you? What do you do? Why this role?"
            className="
              w-full h-64 p-5
              text-sm leading-relaxed
              text-slate-700 dark:text-slate-300
              bg-transparent border-none
              focus:ring-0 focus:outline-none resize-none
              placeholder:text-slate-400 dark:placeholder:text-slate-500
            "
            spellCheck={false}
          />
          
          {/* Footer stats */}
          <div className="
            flex items-center justify-between px-5 py-3
            border-t border-slate-200/60 dark:border-[#3d3c3e]/60
          ">
            <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                {wordCount} words
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-jobzai-400" />
                ~{speakingTime}s speaking time
              </span>
            </div>
            
            {wordCount > 0 && (
              <div className={`text-[11px] font-medium ${
                speakingTime <= 30 
                  ? 'text-emerald-500' 
                  : speakingTime <= 45 
                    ? 'text-amber-500' 
                    : 'text-red-500'
              }`}>
                {speakingTime <= 30 ? '✓ Perfect length' : speakingTime <= 45 ? '⚠ A bit long' : '✗ Too long'}
              </div>
            )}
          </div>
        </div>
      </motion.section>
    </div>
  );
});

export default ResourcesTab;

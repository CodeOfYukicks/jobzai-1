import { memo, useState, useEffect, useCallback } from 'react';
import { ExternalLink, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
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
      abbr: 'GD'
    },
    { 
      id: 'linkedin', 
      title: 'LinkedIn', 
      url: `https://www.linkedin.com/company/${encodeURIComponent(application.companyName)}`, 
      description: 'Company page',
      abbr: 'in'
    },
    {
      id: 'levels',
      title: 'Levels.fyi',
      url: `https://www.levels.fyi/companies/${encodeURIComponent(application.companyName.toLowerCase().replace(/\s+/g, '-'))}/salaries/${encodeURIComponent(application.position.toLowerCase().replace(/\s+/g, '-'))}`,
      description: 'Salary data',
      abbr: 'L.'
    },
    {
      id: 'glassdoor-salary',
      title: 'Salaries',
      url: `https://www.glassdoor.com/Salaries/index.htm?keyword=${encodeURIComponent(application.position)}`,
      description: 'Salary ranges',
      abbr: '$'
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      
      {/* Section 1: Useful Links */}
      <section>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
          Useful Links
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {essentialResources.map((resource) => (
            <a 
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="
                group flex items-center gap-3 p-3
                rounded-lg border border-neutral-200 dark:border-neutral-700
                bg-white dark:bg-neutral-800/50
                hover:border-neutral-300 dark:hover:border-neutral-600
                hover:bg-neutral-50 dark:hover:bg-neutral-800
                transition-colors
              "
            >
              <div className="
                flex-shrink-0 w-8 h-8 rounded-md
                bg-neutral-100 dark:bg-neutral-700
                flex items-center justify-center
                text-xs font-bold text-neutral-500 dark:text-neutral-400
              ">
                {resource.abbr}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                  {resource.title}
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                  {resource.description}
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
          ))}
        </div>
      </section>

      {/* Section 2: Questions to Ask */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Questions to Ask
          </h3>
          <button
            onClick={handleGenerateQuestions}
            disabled={isGeneratingQuestions}
            className="
              inline-flex items-center gap-1.5 px-3 py-1.5
              text-xs font-medium rounded-md
              bg-neutral-900 text-white dark:bg-white dark:text-neutral-900
              hover:bg-neutral-800 dark:hover:bg-neutral-100
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {isGeneratingQuestions ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3" />
                {resourcesData?.questionsToAsk?.length ? 'Regenerate' : 'Generate'}
              </>
            )}
          </button>
        </div>
        
        {resourcesData?.questionsToAsk && resourcesData.questionsToAsk.length > 0 ? (
          <div className="space-y-2">
            {resourcesData.questionsToAsk.map((question, index) => (
              <div 
                key={index}
                className="
                  group flex items-start justify-between gap-3 p-3
                  rounded-lg border border-neutral-200 dark:border-neutral-700
                  bg-white dark:bg-neutral-800/50
                  hover:bg-neutral-50 dark:hover:bg-neutral-800
                  transition-colors
                "
              >
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed flex-1">
                  {question}
                </p>
                <button
                  onClick={() => handleCopyQuestion(question, index)}
                  className="
                    flex-shrink-0 p-1.5 rounded
                    text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300
                    opacity-0 group-hover:opacity-100
                    transition-all
                  "
                  title="Copy"
                >
                  {copiedIndex === index ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="
            flex flex-col items-center justify-center py-12 px-6
            rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700
            text-center
          ">
            <div className="
              w-10 h-10 rounded-lg mb-3
              bg-neutral-100 dark:bg-neutral-800
              flex items-center justify-center
              text-neutral-400
            ">
              ?
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
              No questions generated yet
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              Click Generate to create role-specific questions
            </p>
          </div>
        )}
      </section>

      {/* Section 3: Elevator Pitch */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Elevator Pitch
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPitch}
              disabled={!pitchText}
              className="
                inline-flex items-center gap-1 px-2 py-1
                text-xs font-medium
                text-neutral-500 dark:text-neutral-400
                hover:text-neutral-700 dark:hover:text-neutral-300
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {pitchCopied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              Copy
            </button>
            <button
              onClick={handleGeneratePitch}
              disabled={isGeneratingPitch}
              className="
                inline-flex items-center gap-1.5 px-3 py-1.5
                text-xs font-medium rounded-md
                text-neutral-600 dark:text-neutral-400
                hover:text-neutral-900 dark:hover:text-white
                hover:bg-neutral-100 dark:hover:bg-neutral-800
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {isGeneratingPitch ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Auto-generate
                </>
              )}
            </button>
          </div>
        </div>

        <div className="
          rounded-lg border border-neutral-200 dark:border-neutral-700
          bg-white dark:bg-neutral-800/50
          overflow-hidden
        ">
          <textarea
            value={pitchText}
            onChange={(e) => setPitchText(e.target.value)}
            placeholder="Write your 30-second pitch here... Who are you? What do you do? Why this role?"
            className="
              w-full h-64 p-4
              text-sm leading-relaxed
              text-neutral-700 dark:text-neutral-300
              bg-transparent border-none
              focus:ring-0 resize-none
              placeholder:text-neutral-400 dark:placeholder:text-neutral-500
            "
            spellCheck={false}
          />
          
          {/* Footer stats */}
          <div className="
            flex items-center justify-end gap-4 px-4 py-2
            border-t border-neutral-100 dark:border-neutral-700
            text-[11px] text-neutral-400 dark:text-neutral-500
          ">
            <span>{wordCount} words</span>
            <span>~{speakingTime}s</span>
          </div>
        </div>
      </section>
    </div>
  );
});

export default ResourcesTab;

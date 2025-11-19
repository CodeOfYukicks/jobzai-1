import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, HelpCircle, MessageSquare, FileText, ChevronUp } from 'lucide-react';
import { JobApplication, GeneratedEmail } from '../../types/job';
import { useUserProfile } from '../../hooks/useUserProfile';
import { StatusBadge } from './StatusBadge';
import { ToolCard } from './ToolCard';
import { EmailGenerator } from './EmailGenerator';
import { GenerationLoadingScreen } from './GenerationLoadingScreen';
import { GeneratedHistoryModal } from './GeneratedHistoryModal';
import { GeneratedContentView } from './GeneratedContentView';
import { toast } from 'sonner';

interface AIToolsTabProps {
  job: JobApplication;
  onUpdate?: (updates: Partial<JobApplication>) => Promise<void>;
}

type ToolType = 'cover_letter' | 'follow_up' | 'interview_prep' | 'questions_to_ask' | 'thank_you' | null;

export const AIToolsTab = ({ job, onUpdate }: AIToolsTabProps) => {
  const { profile, loading: profileLoading } = useUserProfile();
  const [expandedSections, setExpandedSections] = useState({
    application: true,
    interview: true,
  });
  const [activeGenerator, setActiveGenerator] = useState<ToolType>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewingContent, setViewingContent] = useState<{ toolType: ToolType; content: string } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ toolType: ToolType; isOpen: boolean }>({
    toolType: null,
    isOpen: false,
  });

  const handleSaveEmail = async (email: GeneratedEmail) => {
    if (!onUpdate) return;

    const updatedEmails = [...(job.generatedEmails || []), email];
    
    await onUpdate({
      generatedEmails: updatedEmails,
    });
  };

  const handleDeleteEmail = async (emailId: string) => {
    if (!onUpdate) return;
    
    const updatedEmails = (job.generatedEmails || []).filter(e => e.id !== emailId);
    await onUpdate({
      generatedEmails: updatedEmails,
    });
  };

  const loadEmailFromHistory = (email: GeneratedEmail) => {
    const toolType = email.type as ToolType;
    // Show content in dedicated view
    setViewingContent({ toolType, content: email.content });
  };

  const handleGenerate = (toolType: ToolType) => {
    // Only allow generation for functional tools
    if (toolType === 'cover_letter' || toolType === 'follow_up') {
      setViewingContent(null);
      setActiveGenerator(toolType);
      setIsGenerating(true);
    }
  };

  const handleContentGenerated = (toolType: ToolType, content: string) => {
    // Show content in dedicated view
    setViewingContent({ toolType, content });
    setIsGenerating(false);
    setActiveGenerator(null);
  };

  const handleGenerationComplete = () => {
    // Content will be shown via handleContentGenerated
  };

  const handleCloseGenerator = () => {
    setActiveGenerator(null);
    setIsGenerating(false);
    setViewingContent(null);
  };

  const handleRegenerate = (toolType: ToolType) => {
    setViewingContent(null);
    handleGenerate(toolType);
  };

  const getHistoryForTool = (toolType: ToolType): GeneratedEmail[] => {
    if (!job.generatedEmails || !toolType) return [];
    return job.generatedEmails
      .filter(email => email.type === toolType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };


  const getToolName = (toolType: ToolType): string => {
    switch (toolType) {
      case 'cover_letter':
        return 'Cover Letter';
      case 'follow_up':
        return 'Follow Up';
      default:
        return 'Document';
    }
  };

  const hasBasicProfile = profile && (profile.firstName || profile.email);
  const isDisabled = !hasBasicProfile || profileLoading;

  const toggleSection = (section: 'application' | 'interview') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Show loading screen overlay if generating
  const showLoadingScreen = isGenerating && activeGenerator;

  // Show content view if we have content to display
  if (viewingContent && (viewingContent.toolType === 'cover_letter' || viewingContent.toolType === 'follow_up')) {
    return (
      <GeneratedContentView
        content={viewingContent.content}
        toolType={viewingContent.toolType}
        toolName={getToolName(viewingContent.toolType)}
        onBack={() => setViewingContent(null)}
        onSave={handleSaveEmail}
        onRegenerate={() => handleRegenerate(viewingContent.toolType)}
      />
    );
  }

  return (
    <div className="space-y-4 relative min-h-[500px]">
      {/* Loading Screen Overlay */}
      {showLoadingScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-white dark:bg-gray-800 rounded-xl"
        >
          <GenerationLoadingScreen
            onBack={handleCloseGenerator}
            toolName={getToolName(activeGenerator)}
          />
        </motion.div>
      )}

      {/* Status badge */}
      <div className="flex justify-end">
        <StatusBadge profile={profile} loading={profileLoading} />
      </div>

      {/* Application Stage Section */}
      <div className="space-y-3">
        {/* Section Header */}
        <button
          onClick={() => toggleSection('application')}
          className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
        >
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Application Stage
          </h2>
          <motion.div
            animate={{ rotate: expandedSections.application ? 0 : 180 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          </motion.div>
        </button>

        {/* Section Content */}
        <AnimatePresence>
          {expandedSections.application && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Cover Letter Card */}
                <ToolCard
                  title="Cover Letter"
                  description="A personalized letter to employers, explaining why you are good fit for the position and how your skills and experiences align with the company's needs."
                  color="purple"
                  icon={Mail}
                  onGenerate={() => handleGenerate('cover_letter')}
                  disabled={isDisabled}
                  historyCount={getHistoryForTool('cover_letter').length}
                  onViewHistory={() => setHistoryModal({ toolType: 'cover_letter', isOpen: true })}
                />

                {/* Follow Up Card */}
                <ToolCard
                  title="Follow Up After Application"
                  description="If there's no response from the employer within a reasonable timeframe, a polite follow-up email can be sent to inquire about the status of the application."
                  color="green"
                  icon={Send}
                  onGenerate={() => handleGenerate('follow_up')}
                  disabled={isDisabled}
                  historyCount={getHistoryForTool('follow_up').length}
                  onViewHistory={() => setHistoryModal({ toolType: 'follow_up', isOpen: true })}
                />
              </div>
              
              {/* Hidden EmailGenerator for background generation */}
              {activeGenerator === 'cover_letter' && (
                <div className="hidden">
                  <EmailGenerator
                    job={job}
                    type="cover_letter"
                    onSave={handleSaveEmail}
                    autoGenerate={true}
                    onGenerationComplete={handleGenerationComplete}
                    onContentGenerated={(content) => handleContentGenerated('cover_letter', content)}
                    hideUI={true}
                  />
                </div>
              )}
              {activeGenerator === 'follow_up' && (
                <div className="hidden">
                  <EmailGenerator
                    job={job}
                    type="follow_up"
                    onSave={handleSaveEmail}
                    autoGenerate={true}
                    onGenerationComplete={handleGenerationComplete}
                    onContentGenerated={(content) => handleContentGenerated('follow_up', content)}
                    hideUI={true}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interview Stage Section */}
      <div className="space-y-3">
        {/* Section Header */}
        <button
          onClick={() => toggleSection('interview')}
          className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
        >
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Interview Stage
          </h2>
          <motion.div
            animate={{ rotate: expandedSections.interview ? 0 : 180 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          </motion.div>
        </button>

        {/* Section Content */}
        <AnimatePresence>
          {expandedSections.interview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Interview Prep Questions Card */}
                <ToolCard
                  title="Interview Prep Questions"
                  description="A list of questions to help you prepare for an upcoming interview."
                  color="blue"
                  icon={HelpCircle}
                  onGenerate={() => handleGenerate('interview_prep')}
                  disabled={true}
                  isActive={false}
                >
                  {/* Coming soon - no children */}
                </ToolCard>

                {/* Questions to Ask Card */}
                <ToolCard
                  title="Questions to Ask"
                  description="Generate a curated list of questions for job interviewees to ask employers, aimed at gaining deeper insights into the role and company culture."
                  color="red"
                  icon={MessageSquare}
                  onGenerate={() => handleGenerate('questions_to_ask')}
                  disabled={true}
                  isActive={false}
                >
                  {/* Coming soon - no children */}
                </ToolCard>

                {/* Thank You After Interview Card */}
                <ToolCard
                  title="Thank You After Interview"
                  description="Sent shortly after an interview, this message expresses gratitude for the interview, reinforces your interest in the position, and briefly restates why you're are a good fit."
                  color="orange"
                  icon={FileText}
                  onGenerate={() => handleGenerate('thank_you')}
                  disabled={true}
                  isActive={false}
                >
                  {/* Coming soon - no children */}
                </ToolCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Modal */}
      <GeneratedHistoryModal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ toolType: null, isOpen: false })}
        emails={getHistoryForTool(historyModal.toolType)}
        toolName={historyModal.toolType ? getToolName(historyModal.toolType) : ''}
        onLoad={(email) => {
          loadEmailFromHistory(email);
          setHistoryModal({ toolType: null, isOpen: false });
        }}
          onDelete={handleDeleteEmail}
        />
    </div>
  );
};

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, HelpCircle, MessageSquare, FileText, ChevronUp, ChevronRight } from 'lucide-react';
import { JobApplication, GeneratedEmail } from '../../types/job';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from './StatusBadge';
import { ToolCard } from './ToolCard';
import { EmailGenerator } from './EmailGenerator';
import { GenerationLoadingScreen } from './GenerationLoadingScreen';
import { GeneratedHistoryModal } from './GeneratedHistoryModal';
import { GeneratedContentView } from './GeneratedContentView';
import { notify } from '@/lib/notify';
import { createNote } from '../../lib/notionDocService';
import { convertTextToTiptapContent } from '../../lib/textToTiptap';

interface AIToolsTabProps {
  job: JobApplication;
  onUpdate?: (updates: Partial<JobApplication>) => Promise<void>;
}

type ToolType = 'cover_letter' | 'follow_up' | 'interview_prep' | 'questions_to_ask' | 'thank_you' | null;

export const AIToolsTab = ({ job, onUpdate }: AIToolsTabProps) => {
  const { profile, loading: profileLoading } = useUserProfile();
  const { currentUser } = useAuth();
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

  /**
   * Save generated content as both:
   * 1. A NotionDocument in the notes collection
   * 2. A GeneratedEmail entry linked to this job application
   */
  const handleSaveEmail = async (email: GeneratedEmail) => {
    if (!onUpdate || !currentUser) return;

    try {
      // 1. Create NotionDocument in notes collection
      const getToolInfo = (type: string) => {
        switch (type) {
          case 'cover_letter':
            return { name: 'Cover Letter', emoji: '✉️' };
          case 'follow_up':
            return { name: 'Follow Up', emoji: '📧' };
          case 'interview_prep':
            return { name: 'Interview Prep', emoji: '❓' };
          case 'questions_to_ask':
            return { name: 'Questions to Ask', emoji: '💬' };
          case 'thank_you':
            return { name: 'Thank You', emoji: '🙏' };
          default:
            return { name: 'Document', emoji: '📄' };
        }
      };

      const { name: toolTypeName, emoji: noteEmoji } = getToolInfo(email.type);
      const noteTitle = `${toolTypeName} - ${job.companyName} (${job.position})`;
      const tiptapContent = convertTextToTiptapContent(email.content);

      const newNote = await createNote({
        userId: currentUser.uid,
        title: noteTitle,
        content: tiptapContent,
        emoji: noteEmoji,
      });

      // 2. Update email with noteId
      const emailWithNoteId: GeneratedEmail = {
        ...email,
        noteId: newNote.id,
      };

      // 3. Update job application with both generatedEmails and linkedNoteIds
      const updatedEmails = [...(job.generatedEmails || []), emailWithNoteId];
      const updatedLinkedNoteIds = [...(job.linkedNoteIds || []), newNote.id];

      await onUpdate({
        generatedEmails: updatedEmails,
        linkedNoteIds: updatedLinkedNoteIds,
      });

      notify.success('Saved as note! You can access it from your Documents page.');
    } catch (error) {
      console.error('Error saving note:', error);
      notify.error('Failed to save as note');
      throw error;
    }
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
    if (!toolType) return;
    setViewingContent(null);
    setActiveGenerator(toolType);
    setIsGenerating(true);
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
      case 'interview_prep':
        return 'Interview Prep Questions';
      case 'questions_to_ask':
        return 'Questions to Ask';
      case 'thank_you':
        return 'Thank You Email';
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
  if (viewingContent && viewingContent.toolType) {
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
      {/* Mobile In-Tab Loading Overlay - Minimalist */}
      {showLoadingScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden absolute inset-0 z-50 bg-white dark:bg-[#1a1a1a] rounded-xl flex flex-col items-center justify-center"
        >
          {/* Minimal animated ring */}
          <div className="relative mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full border-2 border-gray-100 dark:border-[#3d3c3e] border-t-[#635BFF]"
            />
          </div>

          {/* Loading Text */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Generating {getToolName(activeGenerator)}
          </p>

          {/* Cancel */}
          <button
            onClick={handleCloseGenerator}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Cancel
          </button>
        </motion.div>
      )}

      {/* Desktop Loading Screen Overlay */}
      {showLoadingScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="hidden md:block absolute inset-0 z-50 bg-white dark:bg-[#2b2a2c] rounded-xl"
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
              {/* Mobile List Items */}
              <div className="md:hidden space-y-2">
                {/* Cover Letter - Mobile */}
                <button
                  onClick={() => handleGenerate('cover_letter')}
                  disabled={isDisabled}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-100 dark:border-[#3d3c3e] active:bg-gray-50 dark:active:bg-[#343335] transition-colors disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">Cover Letter</span>
                  {getHistoryForTool('cover_letter').length > 0 && (
                    <span className="text-xs text-gray-400">{getHistoryForTool('cover_letter').length}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                </button>

                {/* Follow Up - Mobile */}
                <button
                  onClick={() => handleGenerate('follow_up')}
                  disabled={isDisabled}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-100 dark:border-[#3d3c3e] active:bg-gray-50 dark:active:bg-[#343335] transition-colors disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Send className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">Follow Up Email</span>
                  {getHistoryForTool('follow_up').length > 0 && (
                    <span className="text-xs text-gray-400">{getHistoryForTool('follow_up').length}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                </button>
              </div>

              {/* Desktop Cards */}
              <div className="hidden md:grid grid-cols-2 gap-3">
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
              {/* Mobile List Items */}
              <div className="md:hidden space-y-2">
                {/* Interview Prep - Mobile */}
                <button
                  onClick={() => handleGenerate('interview_prep')}
                  disabled={isDisabled}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-100 dark:border-[#3d3c3e] active:bg-gray-50 dark:active:bg-[#343335] transition-colors disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">Interview Prep</span>
                  {getHistoryForTool('interview_prep').length > 0 && (
                    <span className="text-xs text-gray-400">{getHistoryForTool('interview_prep').length}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                </button>

                {/* Questions to Ask - Mobile */}
                <button
                  onClick={() => handleGenerate('questions_to_ask')}
                  disabled={isDisabled}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-100 dark:border-[#3d3c3e] active:bg-gray-50 dark:active:bg-[#343335] transition-colors disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">Questions to Ask</span>
                  {getHistoryForTool('questions_to_ask').length > 0 && (
                    <span className="text-xs text-gray-400">{getHistoryForTool('questions_to_ask').length}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                </button>

                {/* Thank You - Mobile */}
                <button
                  onClick={() => handleGenerate('thank_you')}
                  disabled={isDisabled}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-100 dark:border-[#3d3c3e] active:bg-gray-50 dark:active:bg-[#343335] transition-colors disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">Thank You Email</span>
                  {getHistoryForTool('thank_you').length > 0 && (
                    <span className="text-xs text-gray-400">{getHistoryForTool('thank_you').length}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                </button>
              </div>

              {/* Desktop Cards */}
              <div className="hidden md:grid grid-cols-3 gap-3">
                {/* Interview Prep Questions Card */}
                <ToolCard
                  title="Interview Prep Questions"
                  description="A list of likely questions you may be asked, with suggested approaches based on your experience."
                  color="blue"
                  icon={HelpCircle}
                  onGenerate={() => handleGenerate('interview_prep')}
                  disabled={isDisabled}
                  historyCount={getHistoryForTool('interview_prep').length}
                  onViewHistory={() => setHistoryModal({ toolType: 'interview_prep', isOpen: true })}
                />

                {/* Questions to Ask Card */}
                <ToolCard
                  title="Questions to Ask"
                  description="Smart questions to ask the interviewer, tailored to the role and company."
                  color="red"
                  icon={MessageSquare}
                  onGenerate={() => handleGenerate('questions_to_ask')}
                  disabled={isDisabled}
                  historyCount={getHistoryForTool('questions_to_ask').length}
                  onViewHistory={() => setHistoryModal({ toolType: 'questions_to_ask', isOpen: true })}
                />

                {/* Thank You After Interview Card */}
                <ToolCard
                  title="Thank You After Interview"
                  description="A personalized thank you email to send after your interview, reinforcing your interest."
                  color="orange"
                  icon={FileText}
                  onGenerate={() => handleGenerate('thank_you')}
                  disabled={isDisabled}
                  historyCount={getHistoryForTool('thank_you').length}
                  onViewHistory={() => setHistoryModal({ toolType: 'thank_you', isOpen: true })}
                />
              </div>

              {/* Hidden EmailGenerators for interview tools */}
              {activeGenerator === 'interview_prep' && (
                <div className="hidden">
                  <EmailGenerator
                    job={job}
                    type="interview_prep"
                    onSave={handleSaveEmail}
                    autoGenerate={true}
                    onGenerationComplete={handleGenerationComplete}
                    onContentGenerated={(content) => handleContentGenerated('interview_prep', content)}
                    hideUI={true}
                  />
                </div>
              )}
              {activeGenerator === 'questions_to_ask' && (
                <div className="hidden">
                  <EmailGenerator
                    job={job}
                    type="questions_to_ask"
                    onSave={handleSaveEmail}
                    autoGenerate={true}
                    onGenerationComplete={handleGenerationComplete}
                    onContentGenerated={(content) => handleContentGenerated('questions_to_ask', content)}
                    hideUI={true}
                  />
                </div>
              )}
              {activeGenerator === 'thank_you' && (
                <div className="hidden">
                  <EmailGenerator
                    job={job}
                    type="thank_you"
                    onSave={handleSaveEmail}
                    autoGenerate={true}
                    onGenerationComplete={handleGenerationComplete}
                    onContentGenerated={(content) => handleContentGenerated('thank_you', content)}
                    hideUI={true}
                  />
                </div>
              )}
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

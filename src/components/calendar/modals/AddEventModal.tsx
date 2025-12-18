import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Loader2,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import moment from 'moment';
import { notify } from '@/lib/notify';
import { useAuth } from '../../../contexts/AuthContext';
import {
  extractJobInfo,
  DetailedJobInfo,
  detectUrlType,
  requiresPasteMode,
  getPlatformName,
} from '../../../lib/jobExtractor';
import DatePicker from '../../ui/DatePicker';
import {
  KanbanBoard,
  BoardType,
  RelationshipGoal,
  WarmthLevel,
  OutreachChannel,
  JobApplication,
} from '../../../types/job';
import { ProfileAvatar, generateGenderedAvatarConfigByName } from '../../profile/avatar';

interface AddEventModalProps {
  selectedDate: Date;
  onClose: () => void;
  onAddEvent: (eventData: any) => Promise<void>;
  boards?: KanbanBoard[];
  currentBoardId?: string;
  currentBoardType?: BoardType;
}

// Warmth Indicator Component
const WarmthIndicator = ({ level, size = 'sm' }: { level: WarmthLevel; size?: 'sm' | 'md' }) => {
  const config = {
    cold: { icon: '❄️', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' },
    warm: { icon: '🌤️', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-300' },
    hot: { icon: '🔥', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-300' },
  };
  const { icon, bg, text } = config[level] || config.cold;
  const sizeClasses = size === 'md' ? 'w-10 h-10 text-lg' : 'w-8 h-8 text-sm';
  
  return (
    <div className={`${sizeClasses} ${bg} ${text} rounded-full flex items-center justify-center`}>
      {icon}
    </div>
  );
};

export const AddEventModal = ({
  selectedDate,
  onClose,
  onAddEvent,
  boards = [],
  currentBoardId,
  currentBoardType = 'jobs',
}: AddEventModalProps) => {
  const { currentUser } = useAuth();
  const [eventType, setEventType] = useState<'application' | null>('application');
  const [formData, setFormData] = useState<Partial<JobApplication> & {
    messageSent?: string;
  }>({
    companyName: '',
    position: '',
    location: '',
    status: 'applied',
    appliedDate: moment(selectedDate).format('YYYY-MM-DD'),
    url: '',
    description: '',
    fullJobDescription: '',
    notes: '',
    salary: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactRole: '',
    contactLinkedIn: '',
    // Campaign fields
    outreachChannel: 'email',
    relationshipGoal: 'networking',
    warmthLevel: 'cold',
    messageSent: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  
  // Paste mode state for LinkedIn/Indeed
  const [showPasteMode, setShowPasteMode] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  
  // Form state
  const [showFullForm, setShowFullForm] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);

  const resetForm = () => {
    setEventType('application');
    setFormData({
      companyName: '',
      position: '',
      location: '',
      status: 'applied',
      appliedDate: moment(selectedDate).format('YYYY-MM-DD'),
      url: '',
      description: '',
      fullJobDescription: '',
      notes: '',
      salary: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      contactRole: '',
      contactLinkedIn: '',
      outreachChannel: 'email',
      relationshipGoal: 'networking',
      warmthLevel: 'cold',
      messageSent: '',
    });
    setShowPasteMode(false);
    setDetectedPlatform(null);
    setShowFullForm(false);
    setWizardStep(1);
  };

  // Apply extracted data to form
  const applyExtractedDataToForm = (extractedData: DetailedJobInfo) => {
    let formattedDescription = extractedData.summary;
    if (formattedDescription) {
      formattedDescription = formattedDescription
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/, "'")
        .trim();

      if (!formattedDescription.includes('•') && !formattedDescription.includes('-')) {
        const lines = formattedDescription.split('\n').filter((line: string) => line.trim().length > 0);
        if (lines.length > 0) {
          formattedDescription = lines.map((line: string) => {
            const trimmed = line.trim();
            if (!trimmed.startsWith('•') && !trimmed.startsWith('-')) {
              return `• ${trimmed}`;
            }
            return trimmed;
          }).join('\n');
        }
      }

      if (formData.description && formData.description.trim()) {
        formattedDescription = `${formData.description}\n\n---\n\n${formattedDescription}`;
      }
    }

    setFormData(prev => ({
      ...prev,
      companyName: extractedData.companyName || prev.companyName,
      position: extractedData.position || prev.position,
      location: extractedData.location || prev.location,
      description: formattedDescription || prev.description || '',
      fullJobDescription: extractedData.fullJobDescription || prev.fullJobDescription || '',
      jobInsights: extractedData.jobInsights || prev.jobInsights,
      jobTags: extractedData.jobTags || prev.jobTags
    }));

    setShowFullForm(true);
  };

  // AI Job Extraction with paste mode fallback
  const handleExtractJobInfo = async () => {
    if (!formData.url || !formData.url.trim()) {
      notify.error('Please enter a job URL first');
      return;
    }

    const jobUrl = formData.url.trim();
    
    // Detect URL type
    const urlType = detectUrlType(jobUrl);
    const platformName = getPlatformName(urlType);
    setDetectedPlatform(platformName);
    
    // Check if this platform requires manual paste (LinkedIn, Indeed)
    if (requiresPasteMode(jobUrl)) {
      setShowPasteMode(true);
      setShowFullForm(true);
      notify.info(`${platformName} requires login. Please fill in the details manually.`, { duration: 5000 });
      return;
    }

    // For other URLs, try automatic extraction
    setIsAnalyzingJob(true);
    notify.info(`Analyzing ${platformName} job posting...`, { duration: 2000 });

    try {
      const extractedData = await extractJobInfo(jobUrl, { detailed: true }) as DetailedJobInfo;

      const hasValidData = extractedData.position && extractedData.position.length > 2;
      
      if (!hasValidData) {
        setShowPasteMode(true);
        setShowFullForm(true);
        notify.warning('Auto-extraction incomplete. Please fill in the details manually.', { duration: 5000 });
        setIsAnalyzingJob(false);
        return;
      }

      applyExtractedDataToForm(extractedData);
      
      if (!extractedData.companyName || extractedData.companyName.length <= 2) {
        notify.success('Job extracted! Please verify the company name.', { duration: 3000 });
      } else {
        notify.success('Job information extracted successfully!');
      }
    } catch (error) {
      console.error('Error extracting job info:', error);
      setShowPasteMode(true);
      setShowFullForm(true);
      notify.warning('Auto-extraction failed. Please fill in the details manually.', { duration: 5000 });
    } finally {
      setIsAnalyzingJob(false);
    }
  };

  const handleSubmit = async () => {
    if (!eventType) {
      notify.error('Please select an event type first');
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        ...formData,
        date: moment(selectedDate).format('YYYY-MM-DD'),
        eventType,
        boardId: currentBoardId,
        boardType: currentBoardType,
      };

      await onAddEvent(eventData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding event:', error);
      notify.error('Failed to add event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          resetForm();
          onClose();
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#2b2a2c] w-full sm:rounded-2xl rounded-t-2xl max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
        >
          {/* Header - Matching JobApplicationsPage */}
          <div className="px-6 py-4 border-b border-gray-100/80 dark:border-[#3d3c3e]/50 flex items-center justify-between bg-white dark:bg-[#2b2a2c] sticky top-0 z-10">
            <div>
              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                {currentBoardType === 'campaigns' ? 'New Outreach' : 'New Application'}
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {currentBoardType === 'campaigns' ? 'Track a new outreach contact' : 'Track a new job opportunity'}
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-300 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content - Matching JobApplicationsPage */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-5">

              {/* Job URL (Jobs board only) */}
              {eventType === 'application' && currentBoardType === 'jobs' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Job URL
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-600 dark:text-purple-400">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full pl-4 pr-24 py-2.5 bg-gray-50/50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/10 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      placeholder="Paste job posting URL..."
                      autoFocus
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExtractJobInfo}
                        disabled={isAnalyzingJob || !formData.url || !formData.url.trim()}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {isAnalyzingJob ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {isAnalyzingJob ? 'Filling...' : 'Fill'}
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Warning message when auto-extraction fails */}
                  {showPasteMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            {detectedPlatform ? `${detectedPlatform} requires manual input` : 'Auto-extraction unavailable'}
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            Please fill in the job details below. AI insights will be generated after creation.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Campaigns: Wizard-based Outreach Form */}
              {eventType === 'application' && currentBoardType === 'campaigns' && (
                <div className="space-y-6">
                  {/* Wizard Step Indicator */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        wizardStep === 1
                          ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/25'
                          : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#4a494b]'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        wizardStep === 1 ? 'bg-white/20' : 'bg-gray-200 dark:bg-[#2b2a2c]'
                      }`}>
                        1
                      </div>
                      <span className="font-medium text-sm">Contact</span>
                    </button>
                    
                    <div className="w-8 h-0.5 bg-gray-200 dark:bg-[#3d3c3e]" />
                    
                    <button
                      type="button"
                      onClick={() => formData.contactName && formData.companyName && setWizardStep(2)}
                      disabled={!formData.contactName || !formData.companyName}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        wizardStep === 2
                          ? 'bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white shadow-lg shadow-[#EC4899]/25'
                          : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#4a494b] disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        wizardStep === 2 ? 'bg-white/20' : 'bg-gray-200 dark:bg-[#2b2a2c]'
                      }`}>
                        2
                      </div>
                      <span className="font-medium text-sm">Strategy</span>
                    </button>
                  </div>

                  {/* Contact Preview Card */}
                  {(formData.contactName || formData.companyName) && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/5 to-[#EC4899]/5 border border-[#8B5CF6]/20 dark:border-[#8B5CF6]/10"
                    >
                      <div className="flex items-center gap-4">
                        <ProfileAvatar
                          config={generateGenderedAvatarConfigByName(formData.contactName || 'Unknown')}
                          size={56}
                          className="rounded-2xl shadow-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate text-lg">
                            {formData.contactName || 'Contact Name'}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {formData.contactRole || 'Role'} @ {formData.companyName || 'Company'}
                          </p>
                        </div>
                        {formData.warmthLevel && (
                          <WarmthIndicator level={formData.warmthLevel as WarmthLevel} size="md" />
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 1: Contact Information */}
                  <AnimatePresence mode="wait">
                    {wizardStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                              Contact Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.contactName || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                              className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                              placeholder="John Doe"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                              Role/Title <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.contactRole || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, contactRole: e.target.value }))}
                              className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                              placeholder="Head of Engineering"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Company <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.companyName || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                            className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                            placeholder="Google, Spotify..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              value={formData.contactEmail || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                              className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                              placeholder="john@company.com"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                              LinkedIn
                            </label>
                            <input
                              type="url"
                              value={formData.contactLinkedIn || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, contactLinkedIn: e.target.value }))}
                              className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                              placeholder="linkedin.com/in/johndoe"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Outreach Strategy */}
                    {wizardStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-5"
                      >
                        {/* Relationship Goal */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Relationship Goal
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'networking', label: 'Networking', icon: '🤝', color: 'from-blue-500 to-indigo-500' },
                              { value: 'prospecting', label: 'Prospecting', icon: '🎯', color: 'from-purple-500 to-pink-500' },
                              { value: 'referral', label: 'Referral', icon: '⭐', color: 'from-amber-500 to-orange-500' },
                            ].map((goal) => (
                              <motion.button
                                key={goal.value}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setFormData(prev => ({ ...prev, relationshipGoal: goal.value as RelationshipGoal }))}
                                className={`p-4 rounded-2xl border-2 transition-all text-center ${
                                  formData.relationshipGoal === goal.value
                                    ? `bg-gradient-to-br ${goal.color} border-transparent text-white shadow-lg`
                                    : 'bg-white dark:bg-[#242325] border-gray-200 dark:border-[#3d3c3e] hover:border-[#8B5CF6]/50'
                                }`}
                              >
                                <span className="text-2xl block mb-1">{goal.icon}</span>
                                <span className="text-xs font-bold">{goal.label}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* Warmth Level */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Relationship Warmth
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'cold', label: 'Cold', icon: '❄️', color: 'from-slate-400 to-slate-500' },
                              { value: 'warm', label: 'Warm', icon: '🌤️', color: 'from-amber-400 to-orange-500' },
                              { value: 'hot', label: 'Hot', icon: '🔥', color: 'from-red-500 to-rose-600' },
                            ].map((warmth) => (
                              <motion.button
                                key={warmth.value}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setFormData(prev => ({ ...prev, warmthLevel: warmth.value as WarmthLevel }))}
                                className={`p-4 rounded-2xl border-2 transition-all text-center ${
                                  formData.warmthLevel === warmth.value
                                    ? `bg-gradient-to-br ${warmth.color} border-transparent text-white shadow-lg`
                                    : 'bg-white dark:bg-[#242325] border-gray-200 dark:border-[#3d3c3e] hover:border-[#8B5CF6]/50'
                                }`}
                              >
                                <span className="text-2xl block mb-1">{warmth.icon}</span>
                                <span className="text-xs font-bold">{warmth.label}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* Outreach Channel */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Outreach Channel
                          </label>
                          <div className="grid grid-cols-6 gap-2">
                            {[
                              { value: 'email', icon: '✉️' },
                              { value: 'linkedin', icon: '💼' },
                              { value: 'referral', icon: '🤝' },
                              { value: 'event', icon: '🎤' },
                              { value: 'cold_call', icon: '📞' },
                              { value: 'other', icon: '📋' },
                            ].map((channel) => (
                              <button
                                key={channel.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, outreachChannel: channel.value as OutreachChannel }))}
                                className={`p-3 rounded-xl border-2 transition-all text-center ${
                                  formData.outreachChannel === channel.value
                                    ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] shadow-sm'
                                    : 'bg-white dark:bg-[#242325] border-gray-200 dark:border-[#3d3c3e] hover:border-[#8B5CF6]/50'
                                }`}
                              >
                                <span className="text-xl">{channel.icon}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Contact Date */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Contact Date <span className="text-red-500">*</span>
                          </label>
                          <DatePicker
                            value={formData.appliedDate || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, appliedDate: value }))}
                            placeholder="Select date"
                            required
                            className="w-full"
                          />
                        </div>

                        {/* Initial Message */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Initial Message (optional)
                          </label>
                          <textarea
                            value={formData.messageSent || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, messageSent: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all resize-none"
                            placeholder="Draft or summary of your outreach message..."
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Jobs board: Form fields */}
              <AnimatePresence>
                {(eventType === 'application' && showFullForm && currentBoardType !== 'campaigns') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Main Fields - Jobs Board */}
                    <div className="space-y-4">
                      {/* Company & Position - 2 columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Company
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.companyName || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-gray-50/50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/10 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                            placeholder="Google, Spotify..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Position
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.position || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-gray-50/50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/10 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                            placeholder="Senior Frontend Engineer"
                          />
                        </div>
                      </div>

                      {/* Location & Date - 2 columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Location
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.location || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-gray-50/50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/10 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                            placeholder="Remote, Paris..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Applied date
                          </label>
                          <DatePicker
                            value={formData.appliedDate || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, appliedDate: value }))}
                            placeholder="Select date"
                            required
                            className="w-full"
                            buttonClassName="!bg-gray-50/50 dark:!bg-white/[0.03] !border !border-gray-200/60 dark:!border-white/[0.06] hover:!border-gray-300 dark:hover:!border-white/10 focus:!border-purple-400 dark:focus:!border-purple-500 focus:!ring-2 focus:!ring-purple-500/10 !rounded-xl !text-sm !text-gray-900 dark:!text-white !py-2.5 !shadow-none !transition-all"
                          />
                        </div>
                      </div>

                      {/* Job Description - full width */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Job description
                          </label>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            Used by AI for emails & interview prep
                          </span>
                        </div>
                        <textarea
                          value={formData.fullJobDescription || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullJobDescription: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50/50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/10 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all resize-none"
                          placeholder="Paste or type the full job description here..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Manual Entry Link for Application */}
              {!showFullForm && eventType === 'application' && currentBoardType !== 'campaigns' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center"
                >
                  <button
                    type="button"
                    onClick={() => setShowFullForm(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
                  >
                    <span>or enter manually</span>
                    <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </motion.div>
              )}
            </form>
          </div>

          {/* Footer - Matching JobApplicationsPage */}
          <div className="px-6 py-4 border-t border-gray-100/80 dark:border-[#3d3c3e]/50 bg-gray-50/50 dark:bg-[#252525]/50 flex justify-between items-center">
            {/* Left side */}
            <div>
              {eventType === 'application' && currentBoardType === 'campaigns' && wizardStep === 2 && (
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              
              {/* Campaigns Wizard: Next button on step 1 */}
              {eventType === 'application' && currentBoardType === 'campaigns' && wizardStep === 1 && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setWizardStep(2)}
                  disabled={!formData.contactName || !formData.companyName}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm shadow-sm shadow-purple-500/20 flex items-center gap-1.5"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
              
              {/* Campaigns Wizard: Add Contact on step 2 */}
              {eventType === 'application' && currentBoardType === 'campaigns' && wizardStep === 2 && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.companyName || !formData.contactName || !formData.appliedDate}
                  className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-400 hover:to-purple-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm shadow-sm shadow-pink-500/20 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Contact
                    </>
                  )}
                </motion.button>
              )}

              {/* Jobs board */}
              {eventType === 'application' && currentBoardType !== 'campaigns' && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.companyName || !formData.position || !formData.location || !formData.appliedDate}
                  className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Create
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

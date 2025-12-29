import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Loader2, Rocket } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Steps
import TargetingStep from './steps/TargetingStep';
import GmailConnectStep from './steps/GmailConnectStep';
import EmailGenerationModeStep from './steps/EmailGenerationModeStep';
import TemplateGenerationStep from './steps/TemplateGenerationStep';
import ABTestingStep from './steps/ABTestingStep';
import CVAttachmentStep from './steps/CVAttachmentStep';
import ReviewStep from './steps/ReviewStep';

// Types
export type EmailTone = 'casual' | 'professional' | 'bold';
export type EmailLength = 'short' | 'medium' | 'detailed';
export type Seniority = 'entry' | 'senior' | 'manager' | 'director' | 'vp' | 'c_suite';
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1001-5000' | '5001+';
export type GenerationMode = 'template' | 'abtest' | 'auto';

export interface CampaignData {
  // Campaign name
  name: string;

  // Step 1: Targeting (Apollo-ready)
  personTitles: string[];           // ["Software Engineer", "Tech Lead"]
  personLocations: string[];        // ["Paris, France", "Remote"]
  seniorities: Seniority[];         // ["senior", "manager"]
  companySizes: CompanySize[];      // ["51-200", "201-500"]
  industries: string[];             // ["technology", "finance"]
  excludedCompanies: string[];      // Company names to exclude
  targetCompanies: string[];        // Priority companies (blended, not strict filter)
  expandTitles: boolean;            // Include similar job titles (synonyms)

  // Step 2: Gmail
  gmailConnected: boolean;
  gmailEmail?: string;

  // Step 3: Email Preferences (AI generates per-contact later)
  emailTone: EmailTone;
  emailLength: EmailLength;
  keyPoints?: string;
  language: 'en' | 'fr';

  // Step 4: Generation Mode
  emailGenerationMode?: GenerationMode;

  // For template mode
  selectedTemplate?: {
    id: string;
    subject: string;
    body: string;
  };

  // For A/B testing mode
  abTestConfig?: {
    hooks: string[];
    bodies: string[];
    ctas: string[];
  };

  // Outreach goal (for A/B testing context)
  outreachGoal?: 'job' | 'internship' | 'networking';

  // CV Attachment
  attachCV?: boolean;
  cvAttachment?: {
    id: string;
    name: string;
    url: string;
    source: 'main' | 'resume-builder';
  };
}

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated?: (campaignId: string) => void;
}

type Step = 'targeting' | 'gmail' | 'mode' | 'template' | 'abtest' | 'cvAttachment' | 'review';

export default function NewCampaignModal({ isOpen, onClose, onCampaignCreated }: NewCampaignModalProps) {
  const { currentUser } = useAuth();

  const STEP_CONFIG = {
    targeting: {
      title: 'Targeting',
      subtitle: 'Define your target audience',
      number: 1
    },
    gmail: {
      title: 'Gmail',
      subtitle: 'Connect your email account',
      number: 2
    },
    mode: {
      title: 'Email Mode',
      subtitle: 'Choose how emails are generated',
      number: 3
    },
    template: {
      title: 'Template',
      subtitle: 'Create your email template',
      number: 4
    },
    abtest: {
      title: 'A/B Testing',
      subtitle: 'Create email variants',
      number: 4
    },
    cvAttachment: {
      title: 'CV Attachment',
      subtitle: 'Attach your resume',
      number: 5
    },
    review: {
      title: 'Review',
      subtitle: 'Confirm and launch',
      number: 6
    }
  };
  const [currentStep, setCurrentStep] = useState<Step>('targeting');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);
  const [estimatedProspects, setEstimatedProspects] = useState(0);

  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    personTitles: [],
    personLocations: [],
    seniorities: [],
    companySizes: [],
    industries: [],
    excludedCompanies: [],
    targetCompanies: [],
    expandTitles: true, // Default to enabled for better search results
    gmailConnected: false,
    gmailEmail: '',
    emailTone: 'casual',
    emailLength: 'short',
    keyPoints: '',
    language: 'en',
    emailGenerationMode: undefined,
    selectedTemplate: undefined,
    abTestConfig: { hooks: [''], bodies: [''], ctas: [''] },
    outreachGoal: undefined, // Now required, set in step 1
    attachCV: false,
    cvAttachment: undefined
  });

  // Reset all state when modal opens (so new campaigns start fresh)
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('targeting');
      setIsSubmitting(false);
      setCampaignId(null);
      setNameError(false);
      setEstimatedProspects(0);
      setCampaignData({
        name: '',
        personTitles: [],
        personLocations: [],
        seniorities: [],
        companySizes: [],
        industries: [],
        excludedCompanies: [],
        targetCompanies: [],
        expandTitles: true,
        gmailConnected: false,
        gmailEmail: '',
        emailTone: 'casual',
        emailLength: 'short',
        keyPoints: '',
        language: 'en',
        emailGenerationMode: undefined,
        selectedTemplate: undefined,
        abTestConfig: { hooks: [''], bodies: [''], ctas: [''] },
        outreachGoal: undefined,
        attachCV: false,
        cvAttachment: undefined
      });
    }
  }, [isOpen]);

  // outreachGoal is now set in step 1 (Targeting), no need for auto-setting

  // Get dynamic steps based on generation mode
  const getSteps = (): Step[] => {
    const baseSteps: Step[] = ['targeting', 'gmail', 'mode'];

    if (campaignData.emailGenerationMode === 'template') {
      return [...baseSteps, 'template', 'cvAttachment', 'review'];
    } else if (campaignData.emailGenerationMode === 'abtest') {
      return [...baseSteps, 'abtest', 'cvAttachment', 'review'];
    } else if (campaignData.emailGenerationMode === 'auto') {
      return [...baseSteps, 'cvAttachment', 'review'];
    }

    return baseSteps;
  };

  const steps = getSteps();
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Update campaign data
  const updateCampaignData = useCallback((updates: Partial<CampaignData>) => {
    setCampaignData(prev => ({ ...prev, ...updates }));
  }, []);

  // Validation per step
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'targeting':
        if (!campaignData.outreachGoal) {
          notify.error('This field is required');
          return false;
        }
        if (campaignData.personTitles.length === 0) {
          notify.error('This field is required');
          return false;
        }
        if (campaignData.personLocations.length === 0) {
          notify.error('This field is required');
          return false;
        }
        return true;

      case 'gmail':
        if (!campaignData.gmailConnected) {
          notify.error('Connect Gmail to send emails');
          return false;
        }
        return true;

      case 'mode':
        if (!campaignData.emailGenerationMode) {
          notify.error('This field is required');
          return false;
        }
        return true;

      case 'template':
        if (!campaignData.selectedTemplate) {
          notify.error('This field is required');
          return false;
        }
        return true;

      case 'abtest':
        const config = campaignData.abTestConfig;
        if (!config ||
          !config.hooks.some(h => h.trim()) ||
          !config.bodies.some(b => b.trim()) ||
          !config.ctas.some(c => c.trim())) {
          notify.error('This field is required');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // Navigation
  const handleNext = () => {
    if (!validateCurrentStep()) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      handleLaunchCampaign();
    }
  };

  const handleBack = () => {
    if (currentStepIndex === 0) {
      onClose();
    } else {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  // Launch campaign
  const handleLaunchCampaign = async () => {
    if (!currentUser) return;

    // Validate campaign name
    if (!campaignData.name.trim()) {
      setNameError(true);
      notify.error('This field is required');
      return;
    }
    setNameError(false);

    setIsSubmitting(true);
    try {
      const campaignDoc: any = {
        userId: currentUser.uid,
        name: campaignData.name.trim() || null,
        status: 'pending', // Pending until Apollo fetches contacts
        targeting: {
          personTitles: campaignData.personTitles,
          personLocations: campaignData.personLocations,
          seniorities: campaignData.seniorities,
          companySizes: campaignData.companySizes,
          industries: campaignData.industries,
          excludedCompanies: campaignData.excludedCompanies,
          targetCompanies: campaignData.targetCompanies,
          expandTitles: campaignData.expandTitles
        },
        gmail: {
          email: campaignData.gmailEmail,
          connected: campaignData.gmailConnected
        },
        emailPreferences: {
          tone: campaignData.emailTone,
          length: campaignData.emailLength,
          keyPoints: campaignData.keyPoints || null,
          language: campaignData.language
        },
        emailGenerationMode: campaignData.emailGenerationMode || 'auto',
        outreachGoal: campaignData.outreachGoal || 'job', // Used by AI for email generation
        stats: {
          contactsFound: 0,
          emailsGenerated: 0,
          emailsSent: 0,
          opened: 0,
          replied: 0,
          bounced: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add template if in template mode
      if (campaignData.emailGenerationMode === 'template' && campaignData.selectedTemplate) {
        campaignDoc.template = {
          subject: campaignData.selectedTemplate.subject,
          body: campaignData.selectedTemplate.body
        };
      }

      // Add A/B test config if in abtest mode
      if (campaignData.emailGenerationMode === 'abtest' && campaignData.abTestConfig) {
        campaignDoc.abTestVariants = {
          hooks: campaignData.abTestConfig.hooks.filter(h => h.trim()),
          bodies: campaignData.abTestConfig.bodies.filter(b => b.trim()),
          ctas: campaignData.abTestConfig.ctas.filter(c => c.trim())
        };
      }

      // Add CV attachment if enabled
      if (campaignData.attachCV && campaignData.cvAttachment) {
        campaignDoc.attachCV = true;
        campaignDoc.cvAttachment = {
          id: campaignData.cvAttachment.id,
          name: campaignData.cvAttachment.name,
          url: campaignData.cvAttachment.url,
          source: campaignData.cvAttachment.source
        };
      }

      const docRef = await addDoc(collection(db, 'campaigns'), campaignDoc);

      notify.success('Campaign launched successfully!');
      onCampaignCreated?.(docRef.id);
      onClose();
    } catch (error) {
      console.error('Error creating campaign:', error);
      notify.error('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if we can proceed to next step
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'targeting':
        return !!campaignData.outreachGoal && campaignData.personTitles.length > 0 && campaignData.personLocations.length > 0;
      case 'gmail':
        return campaignData.gmailConnected;
      case 'mode':
        return !!campaignData.emailGenerationMode;
      case 'template':
        return !!campaignData.selectedTemplate;
      case 'abtest':
        const config = campaignData.abTestConfig;
        return !!(config &&
          config.hooks.some(h => h.trim()) &&
          config.bodies.some(b => b.trim()) &&
          config.ctas.some(c => c.trim()));
      case 'cvAttachment':
        // CV attachment is optional, always valid
        return true;
      case 'review':
        // Review step is always valid, user can launch
        return true;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-md" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative 
            w-full h-full 
            sm:h-auto sm:max-h-[92vh] sm:rounded-2xl
            md:max-w-5xl
            bg-white dark:bg-[#2b2a2c] 
            sm:border border-gray-200 dark:border-white/[0.08] 
            shadow-2xl shadow-black/20 dark:shadow-black/50 
            flex flex-col"
        >
          {/* Header */}
          <div className="flex-shrink-0 px-8 py-6 border-b border-gray-100 dark:border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Back button */}
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 rounded-lg text-gray-400 dark:text-white/40 
                    hover:text-gray-600 dark:hover:text-white 
                    hover:bg-gray-100 dark:hover:bg-white/[0.06] 
                    transition-colors duration-150"
                >
                  {currentStepIndex === 0 ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <ArrowLeft className="w-5 h-5" />
                  )}
                </button>

                {/* Title with editable name */}
                <div className="flex-1 min-w-0">
                  <div className={`
                    relative rounded-lg transition-all duration-200
                    ${nameError
                      ? 'ring-2 ring-red-500 dark:ring-red-400 bg-red-50/50 dark:bg-red-500/[0.08] -mx-2 px-2 py-1'
                      : ''
                    }
                  `}>
                    <input
                      type="text"
                      value={campaignData.name}
                      onChange={(e) => {
                        updateCampaignData({ name: e.target.value });
                        if (nameError) setNameError(false);
                      }}
                      placeholder="Untitled Campaign"
                      className={`
                        w-full text-[14px] font-medium tracking-tight 
                        bg-transparent border-none outline-none focus:ring-0 p-0
                        ${nameError
                          ? 'text-red-600 dark:text-red-400 placeholder-red-400 dark:placeholder-red-400/60'
                          : 'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30'
                        }
                      `}
                    />
                    {nameError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] text-red-500 dark:text-red-400 mt-0.5"
                      >
                        This field is required
                      </motion.p>
                    )}
                  </div>
                  {!nameError && (
                    <p className="text-[12px] text-gray-500 dark:text-white/40 mt-0.5">
                      {STEP_CONFIG[currentStep].subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {steps.map((step, idx) => (
                  <div
                    key={step}
                    className={`h-2 rounded-full transition-all duration-300 ${idx < currentStepIndex
                      ? 'w-2 bg-[#b7e219]'
                      : idx === currentStepIndex
                        ? 'w-6 bg-[#b7e219]'
                        : 'w-2 bg-gray-200 dark:bg-white/20'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-[2px] bg-gray-100 dark:bg-white/[0.06] flex-shrink-0">
            <motion.div
              className="h-full bg-[#b7e219]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ overflowX: 'visible' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="p-8"
              >
                {currentStep === 'targeting' && (
                  <TargetingStep
                    data={campaignData}
                    onUpdate={updateCampaignData}
                    onEstimatedProspectsChange={setEstimatedProspects}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                {currentStep === 'gmail' && (
                  <GmailConnectStep
                    data={campaignData}
                    onUpdate={updateCampaignData}
                  />
                )}
                {currentStep === 'mode' && (
                  <EmailGenerationModeStep
                    data={campaignData}
                    onUpdate={updateCampaignData}
                  />
                )}
                {currentStep === 'template' && (
                  <TemplateGenerationStep
                    data={campaignData}
                    onUpdate={updateCampaignData}
                    campaignId={campaignId}
                  />
                )}
                {currentStep === 'abtest' && (
                  <ABTestingStep
                    data={campaignData}
                    onUpdate={updateCampaignData}
                  />
                )}
                {currentStep === 'cvAttachment' && (
                  <CVAttachmentStep
                    data={campaignData}
                    onUpdate={updateCampaignData}
                  />
                )}
                {currentStep === 'review' && (
                  <ReviewStep
                    data={campaignData}
                    estimatedProspects={estimatedProspects}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-8 py-5 border-t border-gray-100 dark:border-white/[0.08] 
            bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              {/* Step info */}
              <span className="text-[11px] text-gray-400 dark:text-white/30 font-medium uppercase tracking-wide">
                Step {currentStepIndex + 1} of {steps.length}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-[13px] font-medium text-gray-500 dark:text-white/60 
                    hover:text-gray-700 dark:hover:text-white 
                    transition-colors duration-150"
                >
                  {currentStepIndex === 0 ? 'Cancel' : 'Back'}
                </button>

                <button
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-[12px] font-semibold
                    transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                    ${currentStepIndex === steps.length - 1
                      ? 'bg-[#b7e219] text-gray-900 hover:bg-[#a5cb17] border border-[#9fc015] shadow-sm'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/15 border border-gray-200 dark:border-white/10'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : currentStepIndex === steps.length - 1 ? (
                    <>
                      <Rocket className="w-4 h-4" />
                      <span>Launch Campaign</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


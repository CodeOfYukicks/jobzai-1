import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Loader2, Rocket } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Steps
import TargetingStep from './steps/TargetingStep';
import GmailConnectStep from './steps/GmailConnectStep';
import EmailPreferencesStep from './steps/EmailPreferencesStep';

// Types
export type EmailTone = 'casual' | 'professional' | 'bold';
export type EmailLength = 'short' | 'medium' | 'detailed';
export type Seniority = 'entry' | 'senior' | 'manager' | 'director' | 'vp' | 'c_suite';
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1001-5000' | '5001+';

export interface CampaignData {
  // Step 1: Targeting (Apollo-ready)
  personTitles: string[];           // ["Software Engineer", "Tech Lead"]
  personLocations: string[];        // ["Paris, France", "Remote"]
  seniorities: Seniority[];         // ["senior", "manager"]
  companySizes: CompanySize[];      // ["51-200", "201-500"]
  industries: string[];             // ["technology", "finance"]
  excludedCompanies: string[];      // Company names to exclude
  
  // Step 2: Gmail
  gmailConnected: boolean;
  gmailEmail?: string;
  
  // Step 3: Email Preferences (AI generates per-contact later)
  emailTone: EmailTone;
  emailLength: EmailLength;
  keyPoints?: string;
  language: 'en' | 'fr';
}

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated?: (campaignId: string) => void;
}

type Step = 'targeting' | 'gmail' | 'preferences';
const STEPS: Step[] = ['targeting', 'gmail', 'preferences'];

const STEP_CONFIG = {
  targeting: {
    title: 'Targeting',
    subtitle: 'Define your ideal opportunities',
    number: 1
  },
  gmail: {
    title: 'Connect Gmail',
    subtitle: 'Authorize email sending',
    number: 2
  },
  preferences: {
    title: 'Email Style',
    subtitle: 'Set your outreach preferences',
    number: 3
  }
};

export default function NewCampaignModal({ isOpen, onClose, onCampaignCreated }: NewCampaignModalProps) {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('targeting');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [campaignData, setCampaignData] = useState<CampaignData>({
    personTitles: [],
    personLocations: [],
    seniorities: [],
    companySizes: [],
    industries: [],
    excludedCompanies: [],
    gmailConnected: false,
    gmailEmail: '',
    emailTone: 'casual',
    emailLength: 'short',
    keyPoints: '',
    language: 'en'
  });

  // Progress calculation
  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Update campaign data
  const updateCampaignData = useCallback((updates: Partial<CampaignData>) => {
    setCampaignData(prev => ({ ...prev, ...updates }));
  }, []);

  // Validation per step
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'targeting':
        if (campaignData.personTitles.length === 0) {
          toast.error('Please add at least one job title');
          return false;
        }
        if (campaignData.personLocations.length === 0) {
          toast.error('Please select at least one location');
          return false;
        }
        return true;
      
      case 'gmail':
        if (!campaignData.gmailConnected) {
          toast.error('Please connect your Gmail account');
          return false;
        }
        return true;
      
      case 'preferences':
        // Email preferences are always valid (have defaults)
        return true;
      
      default:
        return true;
    }
  };

  // Navigation
  const handleNext = () => {
    if (!validateCurrentStep()) return;
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    } else {
      handleLaunchCampaign();
    }
  };

  const handleBack = () => {
    if (currentStepIndex === 0) {
      onClose();
    } else {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  };

  // Launch campaign
  const handleLaunchCampaign = async () => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    try {
      const campaignDoc = {
        userId: currentUser.uid,
        status: 'pending', // Pending until Apollo fetches contacts
        targeting: {
          personTitles: campaignData.personTitles,
          personLocations: campaignData.personLocations,
          seniorities: campaignData.seniorities,
          companySizes: campaignData.companySizes,
          industries: campaignData.industries,
          excludedCompanies: campaignData.excludedCompanies
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

      const docRef = await addDoc(collection(db, 'campaigns'), campaignDoc);
      
      toast.success('Campaign launched successfully!');
      onCampaignCreated?.(docRef.id);
      onClose();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if we can proceed to next step
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'targeting':
        return campaignData.personTitles.length > 0 && campaignData.personLocations.length > 0;
      case 'gmail':
        return campaignData.gmailConnected;
      case 'preferences':
        return true; // Preferences have defaults, always valid
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
        <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[90vh] 
            bg-white dark:bg-[#0a0a0a] 
            rounded-xl border border-gray-200 dark:border-white/10 
            shadow-2xl shadow-black/20 dark:shadow-black/50 
            flex flex-col"
        >
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-5 border-b border-gray-100 dark:border-white/[0.08]">
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
                
                {/* Title */}
                <div>
                  <h2 className="text-[15px] font-medium text-gray-900 dark:text-white tracking-tight">
                    New Campaign
                  </h2>
                  <p className="text-[13px] text-gray-500 dark:text-white/40 mt-0.5">
                    {STEP_CONFIG[currentStep].subtitle}
                  </p>
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {STEPS.map((step, idx) => (
                  <div
                    key={step}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx < currentStepIndex
                        ? 'w-2 bg-gray-900 dark:bg-white'
                        : idx === currentStepIndex
                        ? 'w-6 bg-gray-900 dark:bg-white'
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
              className="h-full bg-gray-900 dark:bg-white"
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
                className="p-6"
              >
                {currentStep === 'targeting' && (
                  <TargetingStep
                    data={campaignData}
                    onUpdate={updateCampaignData}
                  />
                )}
                {currentStep === 'gmail' && (
                  <GmailConnectStep
                    data={campaignData}
                    onUpdate={updateCampaignData}
                  />
                )}
                {currentStep === 'preferences' && (
                  <EmailPreferencesStep
                    data={campaignData}
                    onUpdate={updateCampaignData}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-white/[0.08] 
            bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              {/* Step info */}
              <span className="text-[13px] text-gray-400 dark:text-white/30 font-medium">
                Step {currentStepIndex + 1} of {STEPS.length}
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
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium
                    transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                    ${currentStepIndex === STEPS.length - 1
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-white/90'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/15 border border-gray-200 dark:border-white/10'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Launching...</span>
                    </>
                  ) : currentStepIndex === STEPS.length - 1 ? (
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


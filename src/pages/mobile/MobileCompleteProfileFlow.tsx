import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { saveAvatarConfig } from '../../components/assistant/avatar/avatarConfig';

import MobileOnboardingLayout from '../../components/layouts/MobileOnboardingLayout';
import MobileNameStep from '../../components/ProfileCompletion/steps/mobile/MobileNameStep';
import MobileGenderStep from '../../components/ProfileCompletion/steps/mobile/MobileGenderStep';
import MobileContractTypeStep from '../../components/ProfileCompletion/steps/mobile/MobileContractTypeStep';
import MobileLocationStep from '../../components/ProfileCompletion/steps/mobile/MobileLocationStep';
import MobileCVUploadStep from '../../components/ProfileCompletion/steps/mobile/MobileCVUploadStep';
import MobileMotivationStep from '../../components/ProfileCompletion/steps/mobile/MobileMotivationStep';
import MobileAvatarSetupStep from '../../components/ProfileCompletion/steps/mobile/MobileAvatarSetupStep';
import MobileSubscriptionStep from '../../components/ProfileCompletion/steps/mobile/MobileSubscriptionStep';

const STEPS = ['name', 'gender', 'contract', 'location', 'cv', 'motivation', 'avatars', 'subscription'] as const;
type Step = typeof STEPS[number];

const stepLabels: Record<Step, string> = {
    name: 'Profile setup',
    gender: 'Profile setup',
    contract: 'Preferences',
    location: 'Preferences',
    cv: 'Your CV',
    motivation: 'About you',
    avatars: 'Your avatar',
    subscription: 'Choose plan',
};

export default function MobileCompleteProfileFlow() {
    const navigate = useNavigate();
    const { currentUser, completeProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState<Step>('name');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subscriptionSubmit, setSubscriptionSubmit] = useState<(() => Promise<void>) | null>(null);
    const [subscriptionProcessing, setSubscriptionProcessing] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        gender: '',
        contractType: '',
        city: '',
        country: '',
        cvUrl: '',
        cvName: '',
        motivation: '',
        profileAvatarConfig: null as any,
        assistantAvatarConfig: null as any,
        profileAvatarType: 'avatar' as const,
        plan: 'free',
    });

    const currentStepIndex = STEPS.indexOf(currentStep);
    const canProceed = useCallback(() => {
        switch (currentStep) {
            case 'name':
                return formData.firstName.trim() !== '' && formData.lastName.trim() !== '';
            case 'gender':
                return formData.gender !== '';
            case 'contract':
                return formData.contractType !== '';
            case 'location':
                return formData.city.trim() !== '' && formData.country.trim() !== '';
            case 'cv':
                return formData.cvUrl !== ''; // Require CV upload
            case 'motivation':
                return formData.motivation.trim() !== '' && formData.motivation !== "I'm looking for opportunities in...";
            case 'avatars':
                return formData.profileAvatarConfig !== null;
            case 'subscription':
                return true;
            default:
                return false;
        }
    }, [currentStep, formData]);

    const saveStepData = async (data: Partial<typeof formData>) => {
        if (!currentUser) return;
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const cleanData = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            );
            if (Object.keys(cleanData).length > 0) {
                await updateDoc(userRef, {
                    ...cleanData,
                    lastUpdated: new Date()
                });
            }
        } catch (error) {
            console.error('Error saving step data:', error);
        }
    };

    const handleNext = async () => {
        // Save current step data first
        await saveStepData(formData);

        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStep(STEPS[currentStepIndex + 1]);
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStep(STEPS[currentStepIndex - 1]);
        }
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            // Save avatar configs
            if (currentUser && formData.assistantAvatarConfig) {
                await saveAvatarConfig(currentUser.uid, formData.assistantAvatarConfig);
            }

            await completeProfile({
                firstName: formData.firstName,
                lastName: formData.lastName,
                gender: formData.gender,
                contractType: formData.contractType,
                city: formData.city,
                country: formData.country,
                cvUrl: formData.cvUrl,
                cvName: formData.cvName,
                motivation: formData.motivation,
                profileAvatarConfig: formData.profileAvatarConfig,
                profileAvatarType: formData.profileAvatarType,
            });

            navigate('/hub');
        } catch (error) {
            console.error('Error completing profile:', error);
            notify.error('Failed to complete profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkipCV = () => {
        setFormData(prev => ({ ...prev, cvUrl: '', cvName: '' }));
        setCurrentStep('motivation');
    };

    const updateFormData = useCallback((updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    }, []);

    // Get next button label and action
    const getNextConfig = () => {
        if (currentStep === 'subscription') {
            return {
                label: 'Get Started',
                action: subscriptionSubmit || (() => { }),
                hide: false,
                processing: subscriptionProcessing
            };
        }
        return { label: 'Continue', action: handleNext, hide: false, processing: false };
    };

    const { label: nextLabel, action: nextAction, hide: hideButton, processing: isProcessingSubscription } = getNextConfig();

    return (
        <MobileOnboardingLayout
            currentStep={currentStepIndex + 1}
            totalSteps={STEPS.length}
            contextLabel={stepLabels[currentStep]}
            onBack={currentStepIndex > 0 ? handleBack : undefined}
            onNext={nextAction}
            canProceed={canProceed()}
            nextLabel={nextLabel}
            isSubmitting={isSubmitting || isProcessingSubscription}
            showBackButton={currentStepIndex > 0}
            hideNextButton={hideButton}
        >
            {currentStep === 'name' && (
                <MobileNameStep
                    firstName={formData.firstName}
                    lastName={formData.lastName}
                    onDataChange={(data) => updateFormData(data)}
                />
            )}

            {currentStep === 'gender' && (
                <MobileGenderStep
                    value={formData.gender}
                    onDataChange={(data) => updateFormData(data)}
                />
            )}

            {currentStep === 'contract' && (
                <MobileContractTypeStep
                    value={formData.contractType}
                    onDataChange={(data) => updateFormData(data)}
                />
            )}

            {currentStep === 'location' && (
                <MobileLocationStep
                    value={formData.city && formData.country ? `${formData.city}, ${formData.country}` : ''}
                    onDataChange={(data) => updateFormData(data)}
                />
            )}

            {currentStep === 'cv' && (
                <MobileCVUploadStep
                    cvUrl={formData.cvUrl}
                    cvName={formData.cvName}
                    onDataChange={(data) => updateFormData(data)}
                    onSkip={handleSkipCV}
                />
            )}

            {currentStep === 'motivation' && (
                <MobileMotivationStep
                    value={formData.motivation}
                    onDataChange={(data) => updateFormData(data)}
                />
            )}

            {currentStep === 'avatars' && (
                <MobileAvatarSetupStep
                    onDataChange={(data) => updateFormData(data)}
                />
            )}

            {currentStep === 'subscription' && (
                <MobileSubscriptionStep
                    onComplete={handleComplete}
                    profileData={formData}
                    onSubmitReady={(submitFn, isProcessing) => {
                        setSubscriptionSubmit(() => submitFn);
                        setSubscriptionProcessing(isProcessing);
                    }}
                />
            )}
        </MobileOnboardingLayout>
    );
}

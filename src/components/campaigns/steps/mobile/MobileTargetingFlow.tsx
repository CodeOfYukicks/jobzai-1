import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { CampaignData, Seniority } from '../../NewCampaignModal';
import { previewApolloSearch, type ApolloPreviewResult } from '../../../../lib/apolloService';
import { mapExperienceToSeniority } from '../TargetingStep';

// Sub-screens
import MobileGoalScreen from './MobileGoalScreen';
import MobileRolesScreen from './MobileRolesScreen';
import MobileLocationScreen from './MobileLocationScreen';
import MobileRefineScreen from './MobileRefineScreen';

interface MobileTargetingFlowProps {
    data: CampaignData;
    onUpdate: (updates: Partial<CampaignData>) => void;
    onEstimatedProspectsChange?: (count: number) => void;
    onNext?: () => void;
    onBack?: () => void;
}

type SubStep = 'goal' | 'roles' | 'location' | 'refine';

const STEPS: SubStep[] = ['goal', 'roles', 'location', 'refine'];

export default function MobileTargetingFlow({
    data,
    onUpdate,
    onEstimatedProspectsChange,
    onNext,
    onBack
}: MobileTargetingFlowProps) {
    const { currentUser } = useAuth();
    const [currentSubStep, setCurrentSubStep] = useState<SubStep>('goal');
    const [direction, setDirection] = useState(0); // 1 for forward, -1 for backward

    // Data fetching states
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [previewResult, setPreviewResult] = useState<ApolloPreviewResult | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load user profile for suggestions
    useEffect(() => {
        const loadProfile = async () => {
            if (!currentUser) return;
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const profile = userDoc.data();
                    const titles = profile.targetPosition ? [profile.targetPosition] : [];
                    setSuggestions(titles);
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        };
        loadProfile();
    }, [currentUser]);

    // Handle preview fetching (debounced)
    useEffect(() => {
        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);

        if (data.personTitles.length === 0 || data.personLocations.length === 0) {
            setPreviewResult(null);
            return;
        }

        previewTimeoutRef.current = setTimeout(async () => {
            setIsLoadingPreview(true);
            try {
                const result = await previewApolloSearch({
                    personTitles: data.personTitles,
                    personLocations: data.personLocations,
                    seniorities: data.seniorities,
                    companySizes: data.companySizes,
                    industries: data.industries,
                    targetCompanies: data.targetCompanies,
                });
                setPreviewResult(result);
                if (result.totalAvailable !== undefined) {
                    onEstimatedProspectsChange?.(result.totalAvailable);
                }
            } catch (error) {
                console.error('Preview error:', error);
            } finally {
                setIsLoadingPreview(false);
            }
        }, 800);

        return () => {
            if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
        };
    }, [
        data.personTitles,
        data.personLocations,
        data.seniorities,
        data.companySizes,
        data.industries,
        data.targetCompanies
    ]);

    // Navigation handlers
    const handleNextStep = () => {
        const currentIndex = STEPS.indexOf(currentSubStep);
        if (currentIndex < STEPS.length - 1) {
            setDirection(1);
            setCurrentSubStep(STEPS[currentIndex + 1]);
        } else {
            // Final step -> call parent onNext
            onNext?.();
        }
    };

    const handlePrevStep = () => {
        const currentIndex = STEPS.indexOf(currentSubStep);
        if (currentIndex > 0) {
            setDirection(-1);
            setCurrentSubStep(STEPS[currentIndex - 1]);
        } else {
            // First step -> call parent onBack
            onBack?.();
        }
    };

    // Validation
    const canProceed = () => {
        switch (currentSubStep) {
            case 'goal': return !!data.outreachGoal;
            case 'roles': return data.personTitles.length > 0;
            case 'location': return data.personLocations.length > 0;
            case 'refine': return true;
            default: return false;
        }
    };

    // Animation variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };

    return (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-[#1a1a1a] flex flex-col safe-top safe-bottom">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                <button
                    onClick={handlePrevStep}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                    {currentSubStep === 'goal' ? <X className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                </button>

                {/* Progress Dots */}
                <div className="flex gap-1.5">
                    {STEPS.map((step) => (
                        <div
                            key={step}
                            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${step === currentSubStep
                                ? 'bg-gray-900 dark:bg-white'
                                : 'bg-gray-200 dark:bg-white/20'
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNextStep}
                    disabled={!canProceed()}
                    className={`text-[15px] font-semibold transition-colors ${canProceed()
                        ? 'text-[#b7e219]'
                        : 'text-gray-300 dark:text-white/20'
                        }`}
                >
                    {currentSubStep === 'refine' ? 'Done' : 'Next'}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={currentSubStep}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute inset-0 p-5 overflow-y-auto"
                    >
                        {currentSubStep === 'goal' && (
                            <MobileGoalScreen
                                data={data}
                                onUpdate={onUpdate}
                                onNext={handleNextStep}
                            />
                        )}
                        {currentSubStep === 'roles' && (
                            <MobileRolesScreen
                                data={data}
                                onUpdate={onUpdate}
                                suggestions={suggestions}
                                estimatedProspects={previewResult?.totalAvailable ?? null}
                                isLoadingPreview={isLoadingPreview}
                            />
                        )}
                        {currentSubStep === 'location' && (
                            <MobileLocationScreen
                                data={data}
                                onUpdate={onUpdate}
                                estimatedProspects={previewResult?.totalAvailable ?? null}
                                isLoadingPreview={isLoadingPreview}
                            />
                        )}
                        {currentSubStep === 'refine' && (
                            <MobileRefineScreen
                                data={data}
                                onUpdate={onUpdate}
                                estimatedProspects={previewResult?.totalAvailable ?? null}
                                isLoadingPreview={isLoadingPreview}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

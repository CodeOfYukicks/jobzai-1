import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface MobileStepWrapperProps {
    children: ReactNode;
    title?: string;
    stepCurrent?: number;
    stepTotal?: number;
    onBack: () => void;
    onNext: () => void;
    canProceed: boolean;
    nextLabel?: string;
    isSubmitting?: boolean;
}

export default function MobileStepWrapper({
    children,
    title,
    stepCurrent,
    stepTotal,
    onBack,
    onNext,
    canProceed,
    nextLabel = 'Next',
    isSubmitting = false
}: MobileStepWrapperProps) {
    return (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-[#1a1a1a] flex flex-col safe-top safe-bottom">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
                </button>

                {/* Title/Progress */}
                <div className="flex flex-col items-center">
                    {title && (
                        <span className="text-[15px] font-semibold text-gray-900 dark:text-white">
                            {title}
                        </span>
                    )}
                    {stepCurrent && stepTotal && (
                        <span className="text-[10px] text-gray-400 dark:text-white/40 font-medium uppercase tracking-wide">
                            Step {stepCurrent} of {stepTotal}
                        </span>
                    )}
                </div>

                <button
                    onClick={onNext}
                    disabled={!canProceed || isSubmitting}
                    className={`text-[15px] font-semibold transition-colors ${canProceed && !isSubmitting
                        ? 'text-[#b7e219]'
                        : 'text-gray-300 dark:text-white/20'
                        }`}
                >
                    {isSubmitting ? '...' : nextLabel}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
                {children}
            </div>
        </div>
    );
}

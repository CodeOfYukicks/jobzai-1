import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreditConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    featureName: string;
    creditCost: number;
    userCredits: number;
    remainingQuota: number;
    planLimit: number;
    isLoading?: boolean;
}

export function CreditConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    featureName,
    creditCost,
    userCredits,
    isLoading = false,
}: CreditConfirmModalProps) {
    const hasEnoughCredits = userCredits >= creditCost;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
                        onClick={onClose}
                    >
                        {/* Modal - Centered */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm mx-4"
                        >
                            <div className="bg-[#1a1a1b] rounded-2xl border border-white/10 overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                                    <h3 className="text-base font-semibold text-white">
                                        Use Credits?
                                    </h3>
                                    <button
                                        onClick={onClose}
                                        className="p-1 text-gray-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="px-5 py-5">
                                    <p className="text-sm text-gray-400 mb-5">
                                        You've used all your free {featureName.toLowerCase()} sessions this month.
                                    </p>

                                    {/* Cost Display */}
                                    <div className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-xl mb-5">
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-[#635bff]" />
                                            <span className="text-white font-medium">{creditCost} credits</span>
                                        </div>
                                        <span className={`text-sm ${hasEnoughCredits ? 'text-gray-400' : 'text-red-400'}`}>
                                            Balance: {userCredits}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={onConfirm}
                                            disabled={!hasEnoughCredits || isLoading}
                                            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${hasEnoughCredits && !isLoading
                                                    ? 'bg-[#b7e219] hover:bg-[#c5eb2d] text-gray-900'
                                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {isLoading ? 'Starting...' : `Use ${creditCost} Credits`}
                                        </button>

                                        <Link
                                            to="/billing"
                                            onClick={onClose}
                                            className="block w-full py-3 rounded-xl text-sm font-medium text-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                        >
                                            Get more credits
                                        </Link>
                                    </div>

                                    {/* Not enough credits warning */}
                                    {!hasEnoughCredits && (
                                        <p className="text-xs text-red-400 text-center mt-3">
                                            You need {creditCost - userCredits} more credits
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default CreditConfirmModal;

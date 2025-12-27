import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { JobApplication } from '../../types/job';

// Status progression for jobs
const JOB_STATUSES = [
    { key: 'wishlist', label: 'Wishlist', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { key: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { key: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    { key: 'pending_decision', label: 'Pending', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    { key: 'offer', label: 'Offer', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

// Status progression for campaigns
const CAMPAIGN_STATUSES = [
    { key: 'targets', label: 'Targets', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    { key: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { key: 'follow_up', label: 'Follow-up', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { key: 'replied', label: 'Replied', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    { key: 'meeting', label: 'Meeting', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { key: 'opportunity', label: 'Opportunity', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { key: 'no_response', label: 'No Response', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
];

interface MobileStatusSelectProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (status: string) => void;
    application: JobApplication | null;
    isCampaign?: boolean;
    isUpdating?: boolean;
}

export default function MobileStatusSelect({
    isOpen,
    onClose,
    onSelect,
    application,
    isCampaign = false,
    isUpdating = false,
}: MobileStatusSelectProps) {
    if (!application) return null;

    const statuses = isCampaign ? CAMPAIGN_STATUSES : JOB_STATUSES;
    const currentStatus = application.status;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="fixed left-4 right-4 bottom-[100px] z-[101] max-w-sm mx-auto"
                    >
                        <div className="bg-white dark:bg-[#2b2a2c] rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-[#3d3c3e]/50">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3d3c3e]">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                    Move to Stage
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                    {application.position || application.contactName} • {application.companyName}
                                </p>
                            </div>

                            {/* Status Options */}
                            <div className="max-h-[300px] overflow-y-auto py-2">
                                {statuses.map((status, index) => {
                                    const isSelected = currentStatus === status.key;
                                    const isDisabled = isUpdating && !isSelected;

                                    return (
                                        <button
                                            key={status.key}
                                            onClick={() => {
                                                if (!isSelected && !isUpdating) {
                                                    onSelect(status.key);
                                                }
                                            }}
                                            disabled={isDisabled}
                                            className={`w-full flex items-center gap-3 px-5 py-3 transition-all ${isSelected
                                                    ? 'bg-[#635BFF]/10'
                                                    : 'hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50'
                                                } ${isDisabled ? 'opacity-50' : ''}`}
                                        >
                                            {/* Status indicator */}
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${status.color}`}>
                                                <span className="text-xs font-bold">{index + 1}</span>
                                            </div>

                                            {/* Label */}
                                            <span className={`flex-1 text-left text-sm font-medium ${isSelected
                                                    ? 'text-[#635BFF]'
                                                    : 'text-gray-700 dark:text-gray-200'
                                                }`}>
                                                {status.label}
                                            </span>

                                            {/* Check or Arrow */}
                                            {isSelected ? (
                                                <div className="w-6 h-6 rounded-full bg-[#635BFF] flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            ) : (
                                                <ArrowRight className="w-5 h-5 text-gray-400" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Cancel Button */}
                            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-[#3d3c3e]">
                                <button
                                    onClick={onClose}
                                    disabled={isUpdating}
                                    className="w-full py-3 rounded-xl bg-gray-100 dark:bg-[#3d3c3e] text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#4a494b] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

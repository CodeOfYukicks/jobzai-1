import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle } from 'lucide-react';
import { JobApplication } from '../../types/job';

interface MobileDeleteConfirmProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    application: JobApplication | null;
    isDeleting?: boolean;
}

export default function MobileDeleteConfirm({
    isOpen,
    onClose,
    onConfirm,
    application,
    isDeleting = false,
}: MobileDeleteConfirmProps) {
    if (!application) return null;

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

                    {/* Modal Wrapper */}
                    <div className="fixed inset-0 z-[101] flex flex-col items-center justify-end md:justify-center pointer-events-none px-4 pb-[100px] md:pb-0">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                            className="pointer-events-auto w-full max-w-sm"
                        >
                            <div className="bg-white dark:bg-[#2b2a2c] rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-[#3d3c3e]/50">
                                {/* Header */}
                                <div className="flex flex-col items-center px-6 pt-6 pb-4">
                                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                                        <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                                        Delete Application?
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 leading-relaxed">
                                        Are you sure you want to delete <span className="font-medium text-gray-700 dark:text-gray-300">{application.position || 'this application'}</span> at <span className="font-medium text-gray-700 dark:text-gray-300">{application.companyName}</span>?
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-3 text-xs text-amber-600 dark:text-amber-400">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        <span>This action cannot be undone</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 p-4 border-t border-gray-100 dark:border-[#3d3c3e]">
                                    <button
                                        onClick={onClose}
                                        disabled={isDeleting}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-[#3d3c3e] text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#4a494b] active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        disabled={isDeleting}
                                        className="flex-1 py-3 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            'Delete'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

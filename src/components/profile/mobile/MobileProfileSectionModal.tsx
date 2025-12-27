import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface MobileProfileSectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

/**
 * Full-screen modal for section editing on mobile
 * - iOS-style slide-up presentation
 * - Sticky header with title and close button
 * - Scrollable content area
 */
export default function MobileProfileSectionModal({
    isOpen,
    onClose,
    title,
    children,
}: MobileProfileSectionModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 top-4 bg-white dark:bg-[#242325] rounded-t-3xl z-50 flex flex-col overflow-hidden"
                        style={{ maxHeight: 'calc(100dvh - 16px)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#3d3c3e] flex-shrink-0">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {title}
                            </h2>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-[#4a4a4c] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                            {children}
                        </div>

                        {/* Safe area padding for iOS */}
                        <div className="flex-shrink-0" style={{ height: 'env(safe-area-inset-bottom)' }} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

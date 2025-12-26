import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface MobileBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export default function MobileBottomSheet({
    isOpen,
    onClose,
    title,
    children
}: MobileBottomSheetProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#242325] rounded-t-2xl max-h-[85vh] overflow-hidden safe-area-bottom"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100 dark:border-[#3d3c3e]">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                    {title}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Menu Item Component
interface BottomSheetMenuItemProps {
    icon: ReactNode;
    label: string;
    description?: string;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'danger';
    badge?: string;
}

export function BottomSheetMenuItem({
    icon,
    label,
    description,
    onClick,
    variant = 'default',
    badge
}: BottomSheetMenuItemProps) {
    const variantStyles = {
        default: 'text-gray-900 dark:text-white',
        primary: 'text-[#635BFF] dark:text-[#a5a0ff]',
        danger: 'text-red-600 dark:text-red-400'
    };

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#2b2a2c] active:bg-gray-100 dark:active:bg-[#3d3c3e] transition-colors"
        >
            <div className={`flex-shrink-0 ${variantStyles[variant]}`}>
                {icon}
            </div>
            <div className="flex-1 text-left">
                <div className={`text-[15px] font-medium ${variantStyles[variant]}`}>
                    {label}
                </div>
                {description && (
                    <div className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {description}
                    </div>
                )}
            </div>
            {badge && (
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#635BFF]/10 text-[#635BFF] dark:bg-[#635BFF]/20 dark:text-[#a5a0ff]">
                    {badge}
                </span>
            )}
        </button>
    );
}

// Divider Component
export function BottomSheetDivider() {
    return <div className="h-px bg-gray-100 dark:bg-[#3d3c3e] my-1" />;
}

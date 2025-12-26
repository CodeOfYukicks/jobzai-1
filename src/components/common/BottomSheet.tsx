import { ReactNode, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
    /** Whether the bottom sheet is open */
    isOpen: boolean;
    /** Callback when the sheet should close */
    onClose: () => void;
    /** Content to render inside the sheet */
    children: ReactNode;
    /** Optional title for the sheet header */
    title?: string;
    /** Optional subtitle for additional context */
    subtitle?: string;
    /** Height of the sheet as percentage of viewport (default: 50) */
    height?: number;
    /** Whether to show the drag handle (default: true) */
    showDragHandle?: boolean;
    /** Whether to show the close button (default: true) */
    showCloseButton?: boolean;
    /** Additional class name for the sheet content */
    className?: string;
    /** Callback when sheet starts dragging */
    onDragStart?: () => void;
    /** Callback when sheet finishes dragging */
    onDragEnd?: () => void;
}

/**
 * A native app-style bottom sheet component with drag-to-close gesture.
 * Designed for mobile-first UX, perfect for filters, menus, and modals.
 * 
 * Features:
 * - Smooth spring animations
 * - Drag-to-close gesture (swipe down)
 * - Backdrop blur overlay
 * - Accessible (ESC key, click outside)
 * - iOS-safe area aware
 */
export default function BottomSheet({
    isOpen,
    onClose,
    children,
    title,
    subtitle,
    height = 50,
    showDragHandle = true,
    showCloseButton = true,
    className = '',
    onDragStart,
    onDragEnd,
}: BottomSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);

    // Transform y position to backdrop opacity
    const backdropOpacity = useTransform(y, [0, 300], [1, 0]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            // Prevent body scroll when sheet is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Handle drag end
    const handleDragEnd = useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            onDragEnd?.();

            // If dragged more than 100px down or with velocity, close
            if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
            }
        },
        [onClose, onDragEnd]
    );

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
                        style={{ opacity: backdropOpacity }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        ref={sheetRef}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 400,
                        }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragStart={onDragStart}
                        onDragEnd={handleDragEnd}
                        style={{ y }}
                        className={`fixed bottom-0 left-0 right-0 z-[101] 
              bg-white dark:bg-[#242325] 
              rounded-t-2xl shadow-2xl
              max-h-[90vh] overflow-hidden
              safe-bottom
              ${className}`}
                    >
                        {/* Drag Handle */}
                        {showDragHandle && (
                            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none">
                                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                            </div>
                        )}

                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100 dark:border-[#3d3c3e]">
                                <div>
                                    {title && (
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {title}
                                        </h2>
                                    )}
                                    {subtitle && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] 
                      text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 
                      transition-colors"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div
                            className="overflow-y-auto overscroll-contain"
                            style={{ maxHeight: `calc(${height}vh - 60px)` }}
                        >
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * Preset for filter bottom sheets
 */
export function FilterBottomSheet({
    isOpen,
    onClose,
    onApply,
    onReset,
    children,
    hasActiveFilters = false,
}: {
    isOpen: boolean;
    onClose: () => void;
    onApply?: () => void;
    onReset?: () => void;
    children: ReactNode;
    hasActiveFilters?: boolean;
}) {
    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title="Filters"
            height={60}
        >
            <div className="px-5 py-4">
                {children}
            </div>

            {/* Action buttons */}
            <div className="sticky bottom-0 px-5 py-4 bg-white dark:bg-[#242325] border-t border-gray-100 dark:border-[#3d3c3e] safe-bottom">
                <div className="flex gap-3">
                    {onReset && (
                        <button
                            onClick={onReset}
                            disabled={!hasActiveFilters}
                            className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 
                bg-gray-100 dark:bg-[#3d3c3e] rounded-xl
                hover:bg-gray-200 dark:hover:bg-[#4a494b]
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors"
                        >
                            Reset
                        </button>
                    )}
                    <button
                        onClick={() => {
                            onApply?.();
                            onClose();
                        }}
                        className="flex-1 px-4 py-3 text-sm font-semibold text-white 
              bg-gradient-to-r from-[#635BFF] to-[#7c75ff] 
              dark:from-[#635BFF] dark:to-[#5249e6]
              hover:from-[#5249e6] hover:to-[#635BFF]
              rounded-xl shadow-lg shadow-[#635BFF]/20
              transition-all"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </BottomSheet>
    );
}

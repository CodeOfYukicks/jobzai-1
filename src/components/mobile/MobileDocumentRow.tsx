import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import {
    FileText, StickyNote, Palette, File, ChevronRight,
    Trash2, Copy, MoreHorizontal
} from 'lucide-react';

type DocumentType = 'note' | 'resume' | 'whiteboard' | 'pdf';

interface MobileDocumentRowProps {
    id: string;
    title: string;
    type: DocumentType;
    date: Date | null;
    onClick: () => void;
    onDelete: () => void;
    onDuplicate?: () => void;
    onLongPress: () => void;
}

// Get icon based on document type
function getDocumentIcon(type: DocumentType) {
    switch (type) {
        case 'note':
            return <StickyNote className="w-5 h-5" />;
        case 'resume':
            return <FileText className="w-5 h-5" />;
        case 'whiteboard':
            return <Palette className="w-5 h-5" />;
        case 'pdf':
            return <File className="w-5 h-5" />;
    }
}

// Get type label
function getTypeLabel(type: DocumentType) {
    switch (type) {
        case 'note':
            return 'Note';
        case 'resume':
            return 'Resume';
        case 'whiteboard':
            return 'Board';
        case 'pdf':
            return 'PDF';
    }
}

// Format relative date
function formatRelativeDate(date: Date | null): string {
    if (!date) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 500;

export default function MobileDocumentRow({
    id,
    title,
    type,
    date,
    onClick,
    onDelete,
    onDuplicate,
    onLongPress
}: MobileDocumentRowProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const x = useMotionValue(0);

    // Background colors based on swipe direction
    const leftBgOpacity = useTransform(x, [-SWIPE_THRESHOLD * 2, -SWIPE_THRESHOLD, 0], [1, 0.8, 0]);
    const rightBgOpacity = useTransform(x, [0, SWIPE_THRESHOLD, SWIPE_THRESHOLD * 2], [0, 0.8, 1]);

    // Icon scale based on swipe distance
    const leftIconScale = useTransform(x, [-SWIPE_THRESHOLD * 2, -SWIPE_THRESHOLD, 0], [1.2, 1, 0.5]);
    const rightIconScale = useTransform(x, [0, SWIPE_THRESHOLD, SWIPE_THRESHOLD * 2], [0.5, 1, 1.2]);

    const handleDragStart = () => {
        setIsDragging(true);
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false);

        const shouldDelete = info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD;
        const shouldDuplicate = (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY_THRESHOLD) && onDuplicate;

        if (shouldDelete) {
            setIsDeleting(true);
            // Animate out then delete
            setTimeout(() => {
                onDelete();
            }, 200);
        } else if (shouldDuplicate) {
            onDuplicate?.();
        }
    };

    const handlePointerDown = () => {
        longPressTimer.current = setTimeout(() => {
            if (!isDragging) {
                onLongPress();
            }
        }, 500);
    };

    const handlePointerUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleTap = () => {
        if (!isDragging) {
            onClick();
        }
    };

    return (
        <AnimatePresence>
            {!isDeleting && (
                <div className="relative overflow-hidden">
                    {/* Delete background (swipe left) */}
                    <motion.div
                        className="absolute inset-y-0 right-0 w-full flex items-center justify-end pr-6 bg-red-500"
                        style={{ opacity: leftBgOpacity }}
                    >
                        <motion.div style={{ scale: leftIconScale }}>
                            <Trash2 className="w-6 h-6 text-white" />
                        </motion.div>
                    </motion.div>

                    {/* Duplicate background (swipe right) */}
                    {onDuplicate && (
                        <motion.div
                            className="absolute inset-y-0 left-0 w-full flex items-center justify-start pl-6 bg-[#635BFF]"
                            style={{ opacity: rightBgOpacity }}
                        >
                            <motion.div style={{ scale: rightIconScale }}>
                                <Copy className="w-6 h-6 text-white" />
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Main row content */}
                    <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={{ left: 0.4, right: onDuplicate ? 0.4 : 0 }}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onClick={handleTap}
                        style={{ x }}
                        exit={{ x: -400, opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        className="relative flex items-center gap-4 px-4 py-3.5 
              bg-white dark:bg-[#242325] 
              border-b border-gray-100 dark:border-[#2d2c2e]
              active:bg-gray-50 dark:active:bg-[#2b2a2c]
              cursor-pointer select-none touch-pan-y"
                    >
                        {/* Icon */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl 
              bg-gray-100 dark:bg-[#2d2c2e] 
              flex items-center justify-center
              text-gray-500 dark:text-gray-400"
                        >
                            {getDocumentIcon(type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-medium text-gray-900 dark:text-white truncate leading-tight">
                                {title || 'Untitled'}
                            </h3>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                                {getTypeLabel(type)} {date && `• ${formatRelativeDate(date)}`}
                            </p>
                        </div>

                        {/* Chevron */}
                        <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-300 dark:text-gray-600" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Context Menu Sheet for long press actions
interface MobileDocumentContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
    documentTitle: string;
    onRename: () => void;
    onMove: () => void;
    onTag: () => void;
    onDelete: () => void;
}

export function MobileDocumentContextMenu({
    isOpen,
    onClose,
    documentTitle,
    onRename,
    onMove,
    onTag,
    onDelete
}: MobileDocumentContextMenuProps) {
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
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Menu */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#242325] rounded-t-2xl overflow-hidden safe-bottom"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>

                        {/* Title */}
                        <div className="px-5 pb-3 border-b border-gray-100 dark:border-[#3d3c3e]">
                            <p className="text-[13px] text-gray-500 dark:text-gray-400">Actions for</p>
                            <h3 className="text-[15px] font-medium text-gray-900 dark:text-white truncate">
                                {documentTitle}
                            </h3>
                        </div>

                        {/* Actions */}
                        <div className="py-2">
                            <button
                                onClick={() => { onRename(); onClose(); }}
                                className="w-full flex items-center gap-4 px-5 py-3.5 text-left
                  active:bg-gray-50 dark:active:bg-[#2b2a2c] transition-colors"
                            >
                                <MoreHorizontal className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                <span className="text-[15px] text-gray-900 dark:text-white">Rename</span>
                            </button>

                            <button
                                onClick={() => { onMove(); onClose(); }}
                                className="w-full flex items-center gap-4 px-5 py-3.5 text-left
                  active:bg-gray-50 dark:active:bg-[#2b2a2c] transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                <span className="text-[15px] text-gray-900 dark:text-white">Move to Folder</span>
                            </button>

                            <button
                                onClick={() => { onTag(); onClose(); }}
                                className="w-full flex items-center gap-4 px-5 py-3.5 text-left
                  active:bg-gray-50 dark:active:bg-[#2b2a2c] transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="text-[15px] text-gray-900 dark:text-white">Add Tag</span>
                            </button>

                            <div className="h-px bg-gray-100 dark:bg-[#3d3c3e] my-1" />

                            <button
                                onClick={() => { onDelete(); onClose(); }}
                                className="w-full flex items-center gap-4 px-5 py-3.5 text-left
                  active:bg-red-50 dark:active:bg-red-900/20 transition-colors"
                            >
                                <Trash2 className="w-5 h-5 text-red-500" />
                                <span className="text-[15px] text-red-500">Delete</span>
                            </button>
                        </div>

                        {/* Cancel button */}
                        <div className="px-4 pb-4 pt-2">
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl bg-gray-100 dark:bg-[#2d2c2e] 
                  text-[15px] font-medium text-gray-900 dark:text-white
                  active:bg-gray-200 dark:active:bg-[#3d3c3e] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

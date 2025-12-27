import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion';
import {
    ChevronRight,
    Archive,
    Trash2,
    Clock,
    MapPin,
    Calendar
} from 'lucide-react';
import { JobApplication } from '../../types/job';
import { CompanyLogo } from '../common/CompanyLogo';
import { ProfileAvatar, generateGenderedAvatarConfigByName } from '../profile/avatar';

// Status progression order for swipe right
const STATUS_PROGRESSION: Record<string, string> = {
    wishlist: 'applied',
    applied: 'interview',
    interview: 'offer',
    // offer is the final positive state
};

// Status labels for display
const STATUS_LABELS: Record<string, string> = {
    wishlist: 'Wishlist',
    applied: 'Applied',
    interview: 'Interview',
    offer: 'Offer',
    rejected: 'Rejected',
    pending_decision: 'Pending',
    archived: 'Archived',
};

// Status colors for pills
const STATUS_COLORS: Record<string, string> = {
    offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    wishlist: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    pending_decision: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

interface MobileApplicationCardProps {
    app: JobApplication;
    onTap: () => void;
    onStatusChange: () => void;  // Opens status selection modal
    onArchive: () => Promise<void>;
    onDelete: () => void;  // Opens delete confirmation modal
    onLongPress: () => void;
    isGestureLocked: boolean;
    onGestureLockChange: (locked: boolean) => void;
    isCampaign?: boolean;
}

// Swipe thresholds
const SWIPE_RIGHT_THRESHOLD = 80;
const SWIPE_LEFT_ARCHIVE_THRESHOLD = -60;
const SWIPE_LEFT_DELETE_THRESHOLD = -140;

// Haptic feedback helper
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if ('vibrate' in navigator) {
        const patterns = { light: 10, medium: 20, heavy: 40 };
        navigator.vibrate(patterns[type]);
    }
};

export default function MobileApplicationCard({
    app,
    onTap,
    onStatusChange,
    onArchive,
    onDelete,
    onLongPress,
    isGestureLocked,
    onGestureLockChange,
    isCampaign = false,
}: MobileApplicationCardProps) {
    const [isPressed, setIsPressed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    // Motion values for swipe
    const x = useMotionValue(0);

    // Transform motion values for action reveals
    const rightActionOpacity = useTransform(x, [0, SWIPE_RIGHT_THRESHOLD], [0, 1]);
    const rightActionScale = useTransform(x, [0, SWIPE_RIGHT_THRESHOLD], [0.5, 1]);

    const leftActionOpacity = useTransform(x, [SWIPE_LEFT_ARCHIVE_THRESHOLD, 0], [1, 0]);
    const deleteActionOpacity = useTransform(x, [SWIPE_LEFT_DELETE_THRESHOLD, SWIPE_LEFT_ARCHIVE_THRESHOLD], [1, 0]);

    // Background color based on swipe direction
    const backgroundColor = useTransform(
        x,
        [SWIPE_LEFT_DELETE_THRESHOLD, SWIPE_LEFT_ARCHIVE_THRESHOLD, 0, SWIPE_RIGHT_THRESHOLD],
        ['#EF4444', '#F59E0B', 'transparent', '#10B981']
    );

    // Get next status for swipe right
    const nextStatus = STATUS_PROGRESSION[app.status];
    const canSwipeRight = !!nextStatus;

    // Format date
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'No date';
        }
    };

    // Handle drag start
    const handleDragStart = useCallback(() => {
        if (isGestureLocked) return;
        setIsDragging(true);
        onGestureLockChange(true);
        // Clear any pending long press
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, [isGestureLocked, onGestureLockChange]);

    // Handle drag end
    const handleDragEnd = useCallback(async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false);
        onGestureLockChange(false);

        const offset = info.offset.x;

        // Swipe right - open status selection modal
        if (offset > SWIPE_RIGHT_THRESHOLD && canSwipeRight) {
            triggerHaptic('medium');
            onStatusChange();
            return;
        }

        // Swipe left - archive
        if (offset < SWIPE_LEFT_ARCHIVE_THRESHOLD && offset > SWIPE_LEFT_DELETE_THRESHOLD) {
            triggerHaptic('light');
            await onArchive();
            return;
        }

        // Swipe far left - delete
        if (offset < SWIPE_LEFT_DELETE_THRESHOLD) {
            triggerHaptic('heavy');
            onDelete();
            return;
        }
    }, [canSwipeRight, onStatusChange, onArchive, onDelete, onGestureLockChange]);

    // Handle touch start for long press
    const handleTouchStart = useCallback(() => {
        if (isGestureLocked) return;
        setIsPressed(true);
        longPressTimer.current = setTimeout(() => {
            triggerHaptic('medium');
            onLongPress();
        }, 500);
    }, [isGestureLocked, onLongPress]);

    // Handle touch end
    const handleTouchEnd = useCallback(() => {
        setIsPressed(false);
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    // Handle tap
    const handleTap = useCallback(() => {
        if (!isDragging) {
            onTap();
        }
    }, [isDragging, onTap]);

    // Determine display name and subtitle
    const displayName = isCampaign
        ? (app.contactName || app.position || 'Untitled')
        : (app.position || 'Untitled');

    const subtitle = isCampaign
        ? `${app.contactRole || ''} ${app.companyName ? `@ ${app.companyName}` : ''}`.trim() || app.companyName
        : `${app.companyName}${app.location ? ` • ${app.location}` : ''}`;

    return (
        <div className="relative overflow-hidden rounded-[20px]">
            {/* Action Backgrounds */}
            <motion.div
                className="absolute inset-0 flex items-center justify-between px-6 rounded-[20px]"
                style={{ backgroundColor }}
            >
                {/* Right swipe action (left side of card) */}
                {canSwipeRight && (
                    <motion.div
                        className="flex items-center gap-2 text-white"
                        style={{ opacity: rightActionOpacity, scale: rightActionScale }}
                    >
                        <ChevronRight className="w-6 h-6" />
                        <span className="text-sm font-semibold">
                            Move to {STATUS_LABELS[nextStatus] || nextStatus}
                        </span>
                    </motion.div>
                )}

                {/* Left swipe actions (right side of card) */}
                <div className="ml-auto flex items-center gap-4">
                    <motion.div
                        className="flex items-center gap-1 text-white"
                        style={{ opacity: leftActionOpacity }}
                    >
                        <Archive className="w-5 h-5" />
                        <span className="text-xs font-medium">Archive</span>
                    </motion.div>
                    <motion.div
                        className="flex items-center gap-1 text-white"
                        style={{ opacity: deleteActionOpacity }}
                    >
                        <Trash2 className="w-5 h-5" />
                        <span className="text-xs font-medium">Delete</span>
                    </motion.div>
                </div>
            </motion.div>

            {/* Main Card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTap={handleTap}
                style={{ x }}
                whileTap={{ scale: isPressed ? 0.98 : 1 }}
                className={`
          relative z-10
          bg-white dark:bg-[#2b2a2c] 
          rounded-[20px] 
          border border-gray-200/60 dark:border-[#3d3c3e]/60
          shadow-lg shadow-black/5 dark:shadow-black/20
          min-h-[140px] p-5
          cursor-grab active:cursor-grabbing
          transition-shadow duration-200
          ${isDragging ? 'shadow-xl' : ''}
        `}
            >
                <div className="flex items-start gap-4">
                    {/* Avatar/Logo */}
                    {isCampaign && app.contactName ? (
                        <ProfileAvatar
                            config={generateGenderedAvatarConfigByName(app.contactName)}
                            size={56}
                            className="rounded-2xl shadow-sm flex-shrink-0"
                        />
                    ) : (
                        <CompanyLogo
                            companyName={app.companyName || ''}
                            size="lg"
                            className="rounded-2xl flex-shrink-0 w-14 h-14"
                        />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight line-clamp-2">
                            {displayName}
                        </h3>

                        {/* Subtitle */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {subtitle}
                        </p>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-3">
                            {/* Date */}
                            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatDate(app.appliedDate)}</span>
                            </div>

                            {/* Location (if not campaign) */}
                            {!isCampaign && app.location && (
                                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[80px]">{app.location}</span>
                                </div>
                            )}

                            {/* Status Pill */}
                            <span className={`
                ml-auto px-2.5 py-1 rounded-full text-[11px] font-semibold
                ${STATUS_COLORS[app.status] || STATUS_COLORS.archived}
              `}>
                                {STATUS_LABELS[app.status] || app.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Swipe hint indicator */}
                {canSwipeRight && !isDragging && (
                    <motion.div
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600"
                        initial={{ opacity: 0.5, x: 0 }}
                        animate={{ opacity: [0.5, 0.8, 0.5], x: [0, 4, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

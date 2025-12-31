import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { Trash2, Plus } from 'lucide-react';

interface SwipeableRowProps {
    children: React.ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    leftActionColor?: string;
    rightActionColor?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    leftLabel?: string;
    rightLabel?: string;
    className?: string;
    threshold?: number;
    enabled?: boolean;
    /** Change this key to force reset the swipe position (e.g., when delete modal is cancelled) */
    resetKey?: number | string;
}

export default function SwipeableRow({
    children,
    onSwipeLeft,
    onSwipeRight,
    leftActionColor = 'bg-red-500',
    rightActionColor = 'bg-violet-500',
    leftIcon = <Trash2 className="w-5 h-5 text-white" />,
    rightIcon = <Plus className="w-5 h-5 text-white" />,
    leftLabel = 'Remove',
    rightLabel = 'Add',
    className = '',
    threshold = 0.3, // 30% of width
    enabled = true,
    resetKey
}: SwipeableRowProps) {
    const x = useMotionValue(0);
    const controls = useAnimation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }
    }, []);

    // Reset position when resetKey changes (used to reset after modal cancel)
    useEffect(() => {
        if (resetKey !== undefined) {
            controls.start({ x: 0, transition: { duration: 0.2 } });
        }
    }, [resetKey, controls]);

    // Background opacity/scale transforms
    const leftOpacity = useTransform(x, [-50, -100], [0, 1]);
    const rightOpacity = useTransform(x, [50, 100], [0, 1]);

    const leftScale = useTransform(x, [-50, -100], [0.8, 1]);
    const rightScale = useTransform(x, [50, 100], [0.8, 1]);

    // Background color logic
    // We'll use two absolute divs for background colors to handle the transition smoothly

    const handleDragEnd = async (_: any, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;
        const width = containerWidth || 300; // Fallback width
        const swipeThreshold = width * threshold;

        if (offset < -swipeThreshold || velocity < -500) {
            // Swiped Left
            if (onSwipeLeft) {
                // Animate off screen
                await controls.start({ x: -width, transition: { duration: 0.2 } });
                onSwipeLeft();
                // Reset position (parent should handle removal, or we reset if action is cancelled/undoable)
                // For now, we assume the parent might remove it, but if not, we should reset:
                // controls.start({ x: 0 }); 
                // Actually, let's wait for parent to re-render or we reset if it persists.
                // Better UX: snap back immediately if it's a "trigger" action, or stay if it's a "reveal" action.
                // The spec says "After action: Show undo toast". This usually implies the row disappears.
                // However, for "Add to board", it shouldn't disappear.

                // If it's delete (left), we might want it to stay gone visually until React removes it.
                // If it's add (right), we want it to snap back.
            } else {
                controls.start({ x: 0 });
            }
        } else if (offset > swipeThreshold || velocity > 500) {
            // Swiped Right
            if (onSwipeRight) {
                // For "Add", we usually want to snap back after triggering
                onSwipeRight();
                controls.start({ x: 0 });
            } else {
                controls.start({ x: 0 });
            }
        } else {
            // Reset
            controls.start({ x: 0 });
        }
    };

    if (!enabled) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
            {/* Background Actions */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                {/* Right Swipe Action (Left side background) - usually for "Add" (Swipe Right) */}
                <div className={`absolute inset-y-0 left-0 w-full flex items-center justify-start pl-6 ${rightActionColor}`}
                    style={{ opacity: x.get() > 0 ? 1 : 0 }}>
                    <motion.div style={{ opacity: rightOpacity, scale: rightScale }} className="flex items-center gap-2">
                        {rightIcon}
                        <span className="text-white font-medium text-sm">{rightLabel}</span>
                    </motion.div>
                </div>

                {/* Left Swipe Action (Right side background) - usually for "Delete" (Swipe Left) */}
                <div className={`absolute inset-y-0 right-0 w-full flex items-center justify-end pr-6 ${leftActionColor}`}
                    style={{ opacity: x.get() < 0 ? 1 : 0 }}>
                    <motion.div style={{ opacity: leftOpacity, scale: leftScale }} className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{leftLabel}</span>
                        {leftIcon}
                    </motion.div>
                </div>
            </div>

            {/* Foreground Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x, touchAction: 'pan-y' }} // Allow vertical scroll
                className="relative bg-white dark:bg-[#1a1a1a] z-10"
            >
                {children}
            </motion.div>
        </div>
    );
}

import { motion } from 'framer-motion';

interface CircularMiniProgressProps {
    /** Current value (e.g., 13) */
    value: number;
    /** Maximum value (e.g., 10) */
    max: number;
    /** Size in pixels (default: 36) */
    size?: number;
    /** Stroke width (default: 3) */
    strokeWidth?: number;
    /** Show the value inside */
    showValue?: boolean;
    /** Whether the user is over quota */
    isOverQuota?: boolean;
    /** Label to show (optional) */
    label?: string;
    /** Credit cost when over quota */
    creditCost?: number;
    /** Additional class names */
    className?: string;
}

/**
 * A compact circular progress indicator for mobile UX
 * Shows quota usage in a minimal, native-app style
 */
export default function CircularMiniProgress({
    value,
    max,
    size = 36,
    strokeWidth = 3,
    showValue = true,
    isOverQuota,
    label,
    creditCost,
    className = '',
}: CircularMiniProgressProps) {
    const percentage = Math.min((value / max) * 100, 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = circumference - (percentage / 100) * circumference;

    // Determine if over quota
    const overQuota = isOverQuota ?? value > max;

    // Color based on usage
    const getColor = () => {
        if (overQuota) return { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }; // Red
        if (percentage >= 80) return { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }; // Amber
        return { stroke: '#635BFF', bg: 'rgba(99, 91, 255, 0.1)' }; // Brand purple
    };

    const colors = getColor();

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Circular Progress */}
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="transform -rotate-90"
                >
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-gray-200 dark:text-gray-700"
                    />
                    {/* Progress circle */}
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke={colors.stroke}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: progress }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </svg>

                {/* Center value */}
                {showValue && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span
                            className="font-bold leading-none"
                            style={{
                                fontSize: size * 0.28,
                                color: colors.stroke,
                            }}
                        >
                            {value}
                        </span>
                    </div>
                )}
            </div>

            {/* Label and info */}
            <div className="flex flex-col">
                {label && (
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {label}
                    </span>
                )}
                <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                        {value}/{max}
                    </span>
                    {overQuota && creditCost && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                            {creditCost}c
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Ultra-compact version - just the circle with value inside
 */
export function CircularMiniProgressCompact({
    value,
    max,
    size = 32,
    strokeWidth = 2.5,
    className = '',
}: Pick<CircularMiniProgressProps, 'value' | 'max' | 'size' | 'strokeWidth' | 'className'>) {
    const percentage = Math.min((value / max) * 100, 100);
    const overQuota = value > max;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = circumference - (percentage / 100) * circumference;

    const getColor = () => {
        if (overQuota) return '#ef4444';
        if (percentage >= 80) return '#f59e0b';
        return '#635BFF';
    };

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-gray-200 dark:text-gray-700"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: progress }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span
                    className="font-bold leading-none"
                    style={{ fontSize: size * 0.32, color: getColor() }}
                >
                    {value}
                </span>
            </div>
        </div>
    );
}

import React from 'react';
import { motion } from 'framer-motion';
import { getCompanyDomain, getClearbitUrl, getGoogleFaviconUrl } from '../../../utils/logo';

interface InterviewPrepMobileHeaderProps {
    companyName: string;
    position: string;
    status?: 'scheduled' | 'completed' | 'cancelled';
    scrollY: number;
}

const getStatusConfig = (status?: string) => {
    switch (status) {
        case 'scheduled':
            return { label: 'Scheduled', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' };
        case 'completed':
            return { label: 'Completed', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' };
        case 'cancelled':
            return { label: 'Cancelled', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' };
        default:
            return { label: 'Preparing', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
    }
};

const getInitials = (name: string): string => {
    return name
        .split(' ')
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();
};

/**
 * Mobile header that collapses on scroll
 * Expanded: Company logo, name, role, status badge (~100px)
 * Collapsed: Compact title only (~56px)
 */
export default function InterviewPrepMobileHeader({
    companyName,
    position,
    status,
    scrollY,
}: InterviewPrepMobileHeaderProps) {
    const isCollapsed = scrollY >= 60;
    const statusConfig = getStatusConfig(status);

    // Logo state
    const [logoError, setLogoError] = React.useState(false);
    const [useFallback, setUseFallback] = React.useState(false);

    const domain = getCompanyDomain(companyName);
    const clearbitUrl = getClearbitUrl(domain);
    const googleUrl = getGoogleFaviconUrl(domain);

    const handleLogoError = () => {
        if (!useFallback) {
            setUseFallback(true);
        } else {
            setLogoError(true);
        }
    };

    return (
        <motion.header
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="sticky top-0 z-50 bg-white/95 dark:bg-[#1a191b]/95 backdrop-blur-xl border-b border-gray-100/80 dark:border-[#3d3c3e]/50"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <motion.div
                animate={{
                    height: isCollapsed ? 56 : 96,
                    paddingTop: isCollapsed ? 12 : 16,
                    paddingBottom: isCollapsed ? 12 : 16,
                }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="px-4"
            >
                {/* Collapsed state: Compact single line */}
                <motion.div
                    animate={{
                        opacity: isCollapsed ? 1 : 0,
                        y: isCollapsed ? 0 : -10,
                    }}
                    transition={{ duration: 0.15 }}
                    className={`absolute inset-x-0 px-4 flex items-center h-8 ${isCollapsed ? '' : 'pointer-events-none'}`}
                    style={{ top: 'calc(env(safe-area-inset-top) + 14px)' }}
                >
                    <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white truncate">
                        {companyName} · {position}
                    </h1>
                </motion.div>

                {/* Expanded state: Full header */}
                <motion.div
                    animate={{
                        opacity: isCollapsed ? 0 : 1,
                        y: isCollapsed ? 10 : 0,
                    }}
                    transition={{ duration: 0.15 }}
                    className={`flex items-start gap-3 ${isCollapsed ? 'pointer-events-none' : ''}`}
                >
                    {/* Company Logo */}
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#2b2a2c] flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200/50 dark:border-[#3d3c3e]/50">
                        {!logoError ? (
                            <img
                                src={useFallback ? googleUrl : clearbitUrl}
                                alt={companyName}
                                className="w-8 h-8 object-contain"
                                onError={handleLogoError}
                            />
                        ) : (
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                {getInitials(companyName)}
                            </span>
                        )}
                    </div>

                    {/* Title + Status */}
                    <div className="flex-1 min-w-0 pt-0.5">
                        <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white truncate leading-tight">
                            {companyName}
                        </h1>
                        <p className="text-[15px] text-gray-600 dark:text-gray-400 truncate leading-tight mt-0.5">
                            {position}
                        </p>
                        <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                                {statusConfig.label}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </motion.header>
    );
}

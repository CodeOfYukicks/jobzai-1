import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, HelpCircle, Briefcase, BookOpen } from 'lucide-react';

type TabId = 'overview' | 'questions' | 'skills' | 'resources';

interface InterviewPrepMobileTabsProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'questions', label: 'Questions', icon: HelpCircle },
    { id: 'skills', label: 'Skills', icon: Briefcase },
    { id: 'resources', label: 'Resources', icon: BookOpen },
];

/**
 * Mobile-native tabs with lightweight styling
 * - Smaller typography (13px)
 * - Pill-style with subtle backgrounds
 * - Horizontal scroll if needed
 */
export default function InterviewPrepMobileTabs({
    activeTab,
    onTabChange,
}: InterviewPrepMobileTabsProps) {
    return (
        <div className="sticky top-[calc(env(safe-area-inset-top)+56px)] z-40 bg-white/95 dark:bg-[#1a191b]/95 backdrop-blur-xl border-b border-gray-100/50 dark:border-[#3d3c3e]/30">
            <div className="px-4 py-2">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`
                  relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium
                  whitespace-nowrap transition-all duration-200 min-h-[36px]
                  ${isActive
                                        ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20 text-[#635BFF] dark:text-[#a5a0ff]'
                                        : 'text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-[#2b2a2c]'
                                    }
                `}
                            >
                                <tab.icon className="w-4 h-4" strokeWidth={2} />
                                <span>{tab.label}</span>

                                {/* Active indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="mobileTabIndicator"
                                        className="absolute inset-0 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20 -z-10"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

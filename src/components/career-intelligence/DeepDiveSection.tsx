import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Users, MessageSquare, Calendar } from 'lucide-react';

type DeepDiveType = 'network' | 'interview' | 'timeline';

interface DeepDiveItem {
    type: DeepDiveType;
    title: string;
    preview: string;
    content?: React.ReactNode;
}

interface DeepDiveSectionProps {
    items: DeepDiveItem[];
}

const typeConfig: Record<DeepDiveType, { icon: typeof Users; label: string }> = {
    'network': { icon: Users, label: 'Network Strategy' },
    'interview': { icon: MessageSquare, label: 'Interview Readiness' },
    'timeline': { icon: Calendar, label: 'Long-Term Timeline' }
};

export default function DeepDiveSection({ items }: DeepDiveSectionProps) {
    const [expandedItem, setExpandedItem] = useState<DeepDiveType | null>(null);

    const handleToggle = (type: DeepDiveType) => {
        setExpandedItem(prev => prev === type ? null : type);
    };

    return (
        <div className="space-y-3">
            {/* Section Header */}
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 px-1">
                Deep Dives
            </h3>

            {items.map(item => {
                const config = typeConfig[item.type];
                const Icon = config.icon;
                const isExpanded = expandedItem === item.type;

                return (
                    <motion.div
                        key={item.type}
                        layout
                        className="rounded-lg bg-white dark:bg-[#1a1a1b] border border-gray-200 dark:border-[#2a2a2b] overflow-hidden"
                    >
                        {/* Header (always visible) */}
                        <button
                            onClick={() => handleToggle(item.type)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-[#222223] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#2a2a2b] flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {item.preview}
                                    </p>
                                </div>
                            </div>

                            <motion.div
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </motion.div>
                        </button>

                        {/* Expanded Content */}
                        <AnimatePresence>
                            {isExpanded && item.content && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-[#2a2a2b]">
                                        {item.content}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}

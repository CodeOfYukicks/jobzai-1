import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

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

export default function DeepDiveSection({ items }: DeepDiveSectionProps) {
    const [expandedItem, setExpandedItem] = useState<DeepDiveType | null>(null);

    const handleToggle = (type: DeepDiveType) => {
        setExpandedItem(prev => prev === type ? null : type);
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="py-8"
        >
            {/* Section Header */}
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-5">
                Explore Further
            </h3>

            {/* Items */}
            <div className="divide-y divide-gray-100 dark:divide-[#222223]">
                {items.map(item => {
                    const isExpanded = expandedItem === item.type;

                    return (
                        <div key={item.type}>
                            {/* Header Row */}
                            <button
                                onClick={() => handleToggle(item.type)}
                                className="w-full flex items-center justify-between py-4 text-left group"
                            >
                                <div className="flex-1 min-w-0">
                                    <span className="text-[15px] font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {item.title}
                                    </span>
                                    {!isExpanded && (
                                        <span className="text-sm text-gray-400 dark:text-gray-500 ml-3">
                                            {item.preview}
                                        </span>
                                    )}
                                </div>

                                <motion.div
                                    animate={{ rotate: isExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="ml-4"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                                </motion.div>
                            </button>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {isExpanded && item.content && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pb-5 pl-0 pr-8">
                                            {item.content}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </motion.section>
    );
}

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FilterAccordionProps {
    title: string;
    icon: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
    count?: number;
}

export function FilterAccordion({
    title,
    icon,
    defaultOpen = true,
    children,
    count
}: FilterAccordionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors px-1 rounded-lg"
            >
                <div className="flex items-center gap-3">
                    <div className="text-gray-500 dark:text-gray-400">
                        {icon}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    {count !== undefined && count > 0 && (
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                            ({count})
                        </span>
                    )}
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pb-4 space-y-2">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

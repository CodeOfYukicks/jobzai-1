import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface ExploreItem {
    title: string;
    preview: string;
    path: string;
}

interface ExploreFurtherListProps {
    items: ExploreItem[];
}

export default function ExploreFurtherList({ items }: ExploreFurtherListProps) {
    const navigate = useNavigate();

    if (items.length === 0) return null;

    return (
        <section className="px-5 py-4 pb-8">
            {/* Section Header */}
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-3">
                Explore Further
            </h3>

            {/* Simple List Rows */}
            <div className="divide-y divide-gray-100 dark:divide-[#222223]">
                {items.slice(0, 3).map((item, index) => (
                    <motion.button
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center justify-between py-3.5 text-left group"
                    >
                        <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-medium text-gray-700 dark:text-gray-200 group-active:text-indigo-600 dark:group-active:text-indigo-400 transition-colors">
                                {item.title}
                            </span>
                            <span className="text-[13px] text-gray-400 dark:text-gray-500 ml-2">
                                {item.preview}
                            </span>
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 ml-2" />
                    </motion.button>
                ))}
            </div>
        </section>
    );
}

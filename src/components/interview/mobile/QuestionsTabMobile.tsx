import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bookmark, BookmarkCheck, Play, Filter, HelpCircle } from 'lucide-react';

interface QuestionEntry {
    id: number;
    text: string;
    tags: ('technical' | 'behavioral' | 'company-specific' | 'role-specific')[];
    suggestedApproach?: string | null;
    rawValue: string;
}

interface QuestionsTabMobileProps {
    questions: QuestionEntry[];
    savedQuestions: string[];
    onToggleSave: (rawValue: string) => void;
    onPractice: () => void;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'technical', label: 'Technical' },
    { id: 'behavioral', label: 'Behavioral' },
    { id: 'company-specific', label: 'Company' },
    { id: 'role-specific', label: 'Role' },
];

const TAG_COLORS: Record<string, string> = {
    'technical': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'behavioral': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'company-specific': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    'role-specific': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
};

/**
 * Mobile Questions tab
 * - List-based questions (lightweight rows)
 * - Filter via pill buttons
 * - Primary CTA: "Practice Questions"
 * - Expandable question details on tap
 */
export default function QuestionsTabMobile({
    questions,
    savedQuestions,
    onToggleSave,
    onPractice,
    activeFilter,
    onFilterChange,
}: QuestionsTabMobileProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const filteredQuestions = activeFilter === 'all'
        ? questions
        : questions.filter(q => q.tags.includes(activeFilter as any));

    return (
        <div className="pb-8">
            {/* Filters */}
            <div className="px-4 py-3 sticky top-[calc(env(safe-area-inset-top)+56px+52px)] z-30 bg-white/95 dark:bg-[#1a191b]/95 backdrop-blur-xl">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => onFilterChange(filter.id)}
                            className={`
                px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap
                transition-all duration-200
                ${activeFilter === filter.id
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                    : 'bg-gray-100 dark:bg-[#2b2a2c] text-gray-600 dark:text-gray-400'
                                }
              `}
                        >
                            {filter.label}
                            {filter.id !== 'all' && (
                                <span className="ml-1 opacity-60">
                                    {questions.filter(q => q.tags.includes(filter.id as any)).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Questions List */}
            <div className="px-4 space-y-2 mt-2">
                {filteredQuestions.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <HelpCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-[15px] text-gray-500 dark:text-gray-400">
                            No questions in this category
                        </p>
                    </motion.div>
                ) : (
                    filteredQuestions.map((question, index) => {
                        const isExpanded = expandedId === question.id;
                        const isSaved = savedQuestions.includes(question.rawValue);

                        return (
                            <motion.div
                                key={question.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="bg-white dark:bg-[#242325] rounded-xl border border-gray-100 dark:border-[#3d3c3e] overflow-hidden"
                            >
                                {/* Question Row */}
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : question.id)}
                                    className="w-full p-4 text-left flex items-start gap-3"
                                >
                                    <span className="text-[13px] font-semibold text-[#635BFF] min-w-[24px]">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] text-gray-900 dark:text-white leading-relaxed">
                                            {question.text}
                                        </p>
                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {question.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${TAG_COLORS[tag] || 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-400'}`}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <ChevronDown
                                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && question.suggestedApproach && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="border-t border-gray-100 dark:border-[#3d3c3e]"
                                        >
                                            <div className="p-4 bg-gray-50/50 dark:bg-[#1a191b]/50">
                                                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                                    Suggested Approach
                                                </p>
                                                <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {question.suggestedApproach}
                                                </p>

                                                {/* Action buttons */}
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onToggleSave(question.rawValue);
                                                        }}
                                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${isSaved
                                                            ? 'bg-[#635BFF]/10 text-[#635BFF]'
                                                            : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-400'
                                                            }`}
                                                    >
                                                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                                        {isSaved ? 'Saved' : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}

                {/* Primary CTA - Integrated into page flow */}
                {filteredQuestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="pt-4 pb-4"
                    >
                        <button
                            onClick={onPractice}
                            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl
                                bg-[#635BFF] hover:bg-[#5850E6] active:scale-[0.98]
                                text-white font-semibold text-[16px]
                                shadow-lg shadow-[#635BFF]/20
                                transition-all duration-200"
                        >
                            <Play className="w-5 h-5" />
                            Practice Questions
                        </button>
                        <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                            {filteredQuestions.length} questions ready to practice
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

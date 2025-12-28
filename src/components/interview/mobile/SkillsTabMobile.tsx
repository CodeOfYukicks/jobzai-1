import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Circle, TrendingUp, Award } from 'lucide-react';

interface SkillGap {
    skill: string;
    rating: number;
    gap: number;
}

interface SkillsTabMobileProps {
    skills: string[];
    skillRatings: Record<string, number>;
    skillGaps: SkillGap[];
    onRateSkill: (skill: string, rating: number) => void;
    onImproveSkills: () => void;
}

/**
 * Mobile Skills tab
 * - Expandable skill cards
 * - One skill focus at a time
 * - Primary CTA: "Improve Skills"
 */
export default function SkillsTabMobile({
    skills,
    skillRatings,
    skillGaps,
    onRateSkill,
    onImproveSkills,
}: SkillsTabMobileProps) {
    const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

    // Combine skills with their ratings
    const skillsWithRatings = skills.map(skill => ({
        skill,
        rating: skillRatings[skill] || 0,
        isGap: skillGaps.some(g => g.skill === skill),
    }));

    // Sort: gaps first, then by rating
    const sortedSkills = [...skillsWithRatings].sort((a, b) => {
        if (a.isGap && !b.isGap) return -1;
        if (!a.isGap && b.isGap) return 1;
        return a.rating - b.rating;
    });

    const confidenceLabels = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

    if (skills.length === 0) {
        return (
            <div className="px-4 pb-32">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                >
                    <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
                        No skills to assess yet
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">
                        Analyze a job posting to see required skills
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="px-4 pb-32 space-y-3">
            {/* Progress Summary */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#242325] rounded-xl p-4 border border-gray-100 dark:border-[#3d3c3e]"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                            Skills Assessment
                        </h3>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {Object.keys(skillRatings).length} of {skills.length} rated
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {skillGaps.length > 0 && (
                            <span className="px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[11px] font-medium">
                                {skillGaps.length} gaps
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Skills List */}
            {sortedSkills.map((item, index) => {
                const isExpanded = expandedSkill === item.skill;

                return (
                    <motion.div
                        key={item.skill}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`bg-white dark:bg-[#242325] rounded-xl border overflow-hidden ${item.isGap
                            ? 'border-amber-200 dark:border-amber-800/50'
                            : 'border-gray-100 dark:border-[#3d3c3e]'
                            }`}
                    >
                        {/* Skill Header */}
                        <button
                            onClick={() => setExpandedSkill(isExpanded ? null : item.skill)}
                            className="w-full p-4 text-left flex items-center gap-3"
                        >
                            {/* Rating indicator */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.rating >= 4
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : item.rating >= 2
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                    : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-400'
                                }`}>
                                {item.rating > 0 ? (
                                    <span className="text-[15px] font-bold">{item.rating}</span>
                                ) : (
                                    <Circle className="w-5 h-5" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-medium text-gray-900 dark:text-white truncate">
                                    {item.skill}
                                </p>
                                {item.rating > 0 && (
                                    <p className="text-[12px] text-gray-500 dark:text-gray-400">
                                        {confidenceLabels[item.rating - 1]}
                                    </p>
                                )}
                            </div>

                            {item.isGap && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 mr-2">
                                    Focus area
                                </span>
                            )}

                            <ChevronDown
                                className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Expanded: Rating selector */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="border-t border-gray-100 dark:border-[#3d3c3e]"
                                >
                                    <div className="p-4 bg-gray-50/50 dark:bg-[#1a191b]/50">
                                        <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3">
                                            Rate your confidence level
                                        </p>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((rating) => (
                                                <button
                                                    key={rating}
                                                    onClick={() => onRateSkill(item.skill, rating)}
                                                    className={`
                            flex-1 h-12 rounded-lg font-semibold text-[15px] transition-all
                            ${item.rating >= rating
                                                            ? item.rating === rating
                                                                ? 'bg-[#635BFF] text-white shadow-md scale-105'
                                                                : 'bg-[#635BFF]/70 text-white'
                                                            : 'bg-gray-200 dark:bg-[#3d3c3e] text-gray-500 dark:text-gray-400'
                                                        }
                          `}
                                                >
                                                    {rating}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                                            <span>Novice</span>
                                            <span>Expert</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}

            {/* Primary CTA - Fixed at bottom */}
            {skillGaps.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="fixed bottom-20 left-4 right-4 z-30"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                    <button
                        onClick={onImproveSkills}
                        className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl
              bg-[#635BFF] hover:bg-[#5850E6] active:scale-[0.98]
              text-white font-semibold text-[16px]
              shadow-lg shadow-[#635BFF]/25
              transition-all duration-200"
                    >
                        <TrendingUp className="w-5 h-5" />
                        Improve Skills
                    </button>
                </motion.div>
            )}
        </div>
    );
}

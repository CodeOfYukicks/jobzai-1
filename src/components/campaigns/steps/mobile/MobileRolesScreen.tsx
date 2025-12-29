import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, X, Sparkles, Search } from 'lucide-react';
import { CampaignData } from '../../NewCampaignModal';

import MobileProspectsCard from './MobileProspectsCard';

interface MobileRolesScreenProps {
    data: CampaignData;
    onUpdate: (updates: Partial<CampaignData>) => void;
    suggestions: string[];
    estimatedProspects: number | null;
    isLoadingPreview: boolean;
}

export default function MobileRolesScreen({
    data,
    onUpdate,
    suggestions,
    estimatedProspects,
    isLoadingPreview
}: MobileRolesScreenProps) {
    const [inputValue, setInputValue] = useState('');

    const handleAdd = () => {
        if (inputValue.trim() && !data.personTitles.includes(inputValue.trim())) {
            onUpdate({ personTitles: [...data.personTitles, inputValue.trim()] });
            setInputValue('');
        }
    };

    const handleRemove = (title: string) => {
        onUpdate({ personTitles: data.personTitles.filter(t => t !== title) });
    };

    const handleSuggestionClick = (title: string) => {
        if (!data.personTitles.includes(title)) {
            onUpdate({ personTitles: [...data.personTitles, title] });
        }
    };

    const availableSuggestions = suggestions.filter(s => !data.personTitles.includes(s));

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-[24px] font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
                    Who do you want to reach?
                </h2>
                <p className="text-[15px] text-gray-500 dark:text-white/40 leading-relaxed">
                    Add specific job titles or roles. You can add multiple titles to reach more people.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-20">
                {/* Input */}
                <div className="relative mb-6">
                    <div className="absolute left-3.5 top-3.5 text-gray-400 dark:text-white/30">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="e.g. Software Engineer"
                        className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-white/[0.06] 
              border border-gray-200 dark:border-white/[0.08] rounded-xl
              text-[16px] text-gray-900 dark:text-white 
              placeholder:text-gray-400 dark:placeholder:text-white/30
              focus:outline-none focus:ring-2 focus:ring-[#b7e219]/50 focus:border-[#b7e219]"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!inputValue.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-gray-900 dark:bg-white text-white dark:text-black 
              rounded-lg disabled:opacity-0 transition-all duration-200"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Selected Chips */}
                {data.personTitles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <AnimatePresence mode="popLayout">
                            {data.personTitles.map(title => (
                                <motion.span
                                    key={title}
                                    layout
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 
                    bg-gray-900 dark:bg-white text-white dark:text-black rounded-full
                    text-[14px] font-medium shadow-sm"
                                >
                                    {title}
                                    <button
                                        onClick={() => handleRemove(title)}
                                        className="p-0.5 hover:bg-white/20 dark:hover:bg-black/10 rounded-full transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </motion.span>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* AI Suggestions */}
                {availableSuggestions.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-violet-500" />
                            <span className="text-[13px] font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wide">
                                Based on your profile
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {availableSuggestions.map(title => (
                                <button
                                    key={title}
                                    onClick={() => handleSuggestionClick(title)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 
                    bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-lg
                    text-[14px] font-medium text-violet-700 dark:text-violet-300
                    active:scale-95 transition-all duration-200"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Expand Titles Toggle */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-gray-400 dark:text-white/40" />
                            <span className="text-[15px] font-medium text-gray-900 dark:text-white">
                                Include similar titles
                            </span>
                        </div>
                        <button
                            onClick={() => onUpdate({ expandTitles: !data.expandTitles })}
                            className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${data.expandTitles ? 'bg-[#b7e219]' : 'bg-gray-200 dark:bg-white/20'
                                }`}
                        >
                            <motion.div
                                className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
                                animate={{ x: data.expandTitles ? 20 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-white/40 leading-relaxed">
                        We'll also search for related roles (e.g. "Developer" for "Software Engineer")
                    </p>
                </div>

                <MobileProspectsCard
                    count={estimatedProspects}
                    isLoading={isLoadingPreview}
                    showExplanation={true}
                />
            </div>
        </div>
    );
}

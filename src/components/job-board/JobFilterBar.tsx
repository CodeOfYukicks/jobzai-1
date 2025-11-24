import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Sparkles } from 'lucide-react';
import { FilterState } from '../../types/job-board';
import { PremiumSearchBar } from './PremiumSearchBar';

interface JobFilterBarProps {
    searchInput: string;
    onSearchChange: (value: string) => void;
    onSearch: () => void;
    filters: FilterState;
    toggleArrayFilter: (category: keyof FilterState, value: string) => void;
    clearFilters: () => void;
    onOpenMoreFilters: () => void;
    mode: 'explore' | 'matches';
    setMode: (m: 'explore' | 'matches') => void;
    isCollapsed?: boolean;
}

export function JobFilterBar({
    searchInput,
    onSearchChange,
    onSearch,
    filters,
    toggleArrayFilter,
    clearFilters,
    onOpenMoreFilters,
    mode,
    setMode,
    isCollapsed = false
}: JobFilterBarProps) {
    const activeFiltersCount =
        filters.employmentType.length +
        filters.workLocation.length +
        filters.experienceLevel.length +
        filters.industries.length +
        filters.technologies.length +
        filters.skills.length +
        (filters.datePosted !== 'any' ? 1 : 0);

    const removeFilter = (category: keyof FilterState, value: string) => {
        if (category === 'datePosted') {
            // Reset date filter to 'any'
            toggleArrayFilter('datePosted', 'any');
        } else {
            toggleArrayFilter(category, value);
        }
    };

    return (
        <div 
            className={`
                search-header-container
                ${isCollapsed ? 'search-header-collapsed' : 'search-header-expanded'}
                bg-gradient-to-b from-gray-50/80 to-white dark:from-gray-950/80 dark:to-gray-900 
                backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-30
            `}
            style={{
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
        >
            <div className="max-w-full px-4 sm:px-6">
                {/* Mode Switcher - Premium Style - Inline when collapsed */}
                <AnimatePresence mode="wait">
                    {!isCollapsed ? (
                        <motion.div
                            key="mode-switcher-top"
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="flex justify-center mb-6"
                        >
                            <motion.div 
                                className="inline-flex bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-1 rounded-2xl border border-gray-200/50 dark:border-gray-800/50"
                                style={{
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                }}
                            >
                                <button
                                    onClick={() => setMode('explore')}
                                    className={`
                                        relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                                        ${mode === 'explore'
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }
                                    `}
                                >
                                    {mode === 'explore' && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Explore
                                    </span>
                                </button>
                                <button
                                    onClick={() => setMode('matches')}
                                    className={`
                                        relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                                        ${mode === 'matches'
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }
                                    `}
                                >
                                    {mode === 'matches' && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">For You</span>
                                </button>
                            </motion.div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                {/* Search Bar Container with Mode Switcher Inline when Collapsed */}
                <div className={`flex items-center gap-3 ${isCollapsed ? 'mb-3' : 'mb-5'}`}>
                    {/* Inline Mode Switcher (Collapsed State) */}
                    {isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.25, delay: 0.1 }}
                            className="hidden sm:flex flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-1 rounded-xl border border-gray-200/50 dark:border-gray-800/50"
                            style={{
                                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                            }}
                        >
                            <button
                                onClick={() => setMode('explore')}
                                className={`
                                    relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                                    ${mode === 'explore'
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }
                                `}
                            >
                                {mode === 'explore' && (
                                    <motion.div
                                        layoutId="activeTabInline"
                                        className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3" />
                                    Explore
                                </span>
                            </button>
                            <button
                                onClick={() => setMode('matches')}
                                className={`
                                    relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                                    ${mode === 'matches'
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }
                                `}
                            >
                                {mode === 'matches' && (
                                    <motion.div
                                        layoutId="activeTabInline"
                                        className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                    />
                                )}
                                <span className="relative z-10">For You</span>
                            </button>
                        </motion.div>
                    )}

                    {/* Premium Search Bar */}
                    <div className="flex-1">
                        <PremiumSearchBar
                            searchInput={searchInput}
                            onSearchChange={onSearchChange}
                            onSearch={onSearch}
                            filters={filters}
                            onRemoveFilter={removeFilter}
                            onClearFilters={clearFilters}
                            isCollapsed={isCollapsed}
                        />
                    </div>
                </div>

                {/* Quick Filters Row */}
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar"
                        >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenMoreFilters}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all
                            ${activeFiltersCount > 0
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 shadow-sm'
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'
                            }
                        `}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                            >
                                {activeFiltersCount}
                            </motion.span>
                        )}
                    </motion.button>

                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-700" />

                    {/* Quick Filter Pills */}
                    <FilterPill
                        label="Remote"
                        active={filters.workLocation.includes('remote')}
                        onClick={() => toggleArrayFilter('workLocation', 'remote')}
                    />
                    <FilterPill
                        label="Full-time"
                        active={filters.employmentType.includes('full-time')}
                        onClick={() => toggleArrayFilter('employmentType', 'full-time')}
                    />
                    <FilterPill
                        label="Contract"
                        active={filters.employmentType.includes('contract')}
                        onClick={() => toggleArrayFilter('employmentType', 'contract')}
                    />
                    <FilterPill
                        label="Internship"
                        active={filters.employmentType.includes('internship')}
                        onClick={() => toggleArrayFilter('employmentType', 'internship')}
                    />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Collapsed State - Show filter count badge */}
                {isCollapsed && activeFiltersCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="flex justify-center mt-2"
                    >
                        <button
                            onClick={onOpenMoreFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-full text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                        >
                            <Filter className="w-3 h-3" />
                            {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} active
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function FilterPill({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`
                px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shadow-sm
                ${active
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
            `}
        >
            {label}
        </motion.button>
    );
}

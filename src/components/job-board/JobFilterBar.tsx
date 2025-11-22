import React from 'react';
import { Search, MapPin, Filter } from 'lucide-react';
import { FilterState } from '../../types/job-board';

interface JobFilterBarProps {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    locationQuery: string;
    setLocationQuery: (l: string) => void;
    filters: FilterState;
    toggleArrayFilter: (category: keyof FilterState, value: string) => void;
    clearFilters: () => void;
    onOpenMoreFilters: () => void;
    mode: 'explore' | 'matches';
    setMode: (m: 'explore' | 'matches') => void;
}

export function JobFilterBar({
    searchQuery,
    setSearchQuery,
    locationQuery,
    setLocationQuery,
    filters,
    toggleArrayFilter,
    clearFilters,
    onOpenMoreFilters,
    mode,
    setMode
}: JobFilterBarProps) {
    const activeFiltersCount =
        filters.employmentType.length +
        filters.workLocation.length +
        filters.experienceLevel.length +
        filters.industries.length +
        filters.technologies.length +
        (filters.datePosted !== 'any' ? 1 : 0);

    return (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
            <div className="max-w-full px-6 py-4">
                {/* Search Inputs Row */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    {/* Mode Switcher */}
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex shrink-0 self-start md:self-auto h-[50px]">
                        <button
                            onClick={() => setMode('explore')}
                            className={`px-4 rounded-lg text-sm font-medium transition-all h-full ${mode === 'explore'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Explore
                        </button>
                        <button
                            onClick={() => setMode('matches')}
                            className={`px-4 rounded-lg text-sm font-medium transition-all h-full ${mode === 'matches'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            For You
                        </button>
                    </div>

                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="Job title, keyword, or company"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="City, state, or remote"
                            value={locationQuery}
                            onChange={(e) => setLocationQuery(e.target.value)}
                        />
                    </div>
                    <button
                        className="hidden md:block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Search
                    </button>
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                    <button
                        onClick={onOpenMoreFilters}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all
              ${activeFiltersCount > 0
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }
            `}
                    >
                        <Filter className="w-4 h-4" />
                        All Filters
                        {activeFiltersCount > 0 && (
                            <span className="ml-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

                    {/* Quick Filters (Pills) */}
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
                        label="Freelance"
                        active={filters.employmentType.includes('contract')}
                        onClick={() => toggleArrayFilter('employmentType', 'contract')}
                    />
                    <FilterPill
                        label="Internship"
                        active={filters.employmentType.includes('internship')}
                        onClick={() => toggleArrayFilter('employmentType', 'internship')}
                    />

                    {activeFiltersCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors whitespace-nowrap"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function FilterPill({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`
        px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all
        ${active
                    ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
      `}
        >
            {label}
        </button>
    );
}

import React from 'react';
import { X, Briefcase, MapPin, Clock, Building2, Code, Calendar, Search, Star } from 'lucide-react';
import { FilterAccordion } from '../filters/FilterAccordion';
import { FilterCheckbox } from '../filters/FilterCheckbox';
import { FilterRadioGroup } from '../filters/FilterRadioGroup';
import { FilterState } from '../../types/job-board';

interface JobFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    toggleArrayFilter: (category: keyof FilterState, value: string) => void;
    setDatePostedFilter: (value: any) => void;
    techSearch: string;
    setTechSearch: (v: string) => void;
    filteredTechs: string[];
    skillSearch: string;
    setSkillSearch: (v: string) => void;
    filteredSkills: string[];
}

export function JobFiltersModal({
    isOpen,
    onClose,
    filters,
    toggleArrayFilter,
    setDatePostedFilter,
    techSearch,
    setTechSearch,
    filteredTechs,
    skillSearch,
    setSkillSearch,
    filteredSkills
}: JobFiltersModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#242325] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-200 dark:border-[#3d3c3e] flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Filters</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-1 custom-scrollbar">
                    <FilterAccordion title="Employment Type" icon={<Briefcase className="w-4 h-4" />} defaultOpen>
                        <FilterCheckbox label="Full-time" checked={filters.employmentType.includes('full-time')} onChange={() => toggleArrayFilter('employmentType', 'full-time')} />
                        <FilterCheckbox label="Part-time" checked={filters.employmentType.includes('part-time')} onChange={() => toggleArrayFilter('employmentType', 'part-time')} />
                        <FilterCheckbox label="Contract" checked={filters.employmentType.includes('contract')} onChange={() => toggleArrayFilter('employmentType', 'contract')} />
                        <FilterCheckbox label="Internship" checked={filters.employmentType.includes('internship')} onChange={() => toggleArrayFilter('employmentType', 'internship')} />
                    </FilterAccordion>

                    <FilterAccordion title="Work Location" icon={<MapPin className="w-4 h-4" />} defaultOpen>
                        <FilterCheckbox label="Remote" checked={filters.workLocation.includes('remote')} onChange={() => toggleArrayFilter('workLocation', 'remote')} />
                        <FilterCheckbox label="On-site" checked={filters.workLocation.includes('on-site')} onChange={() => toggleArrayFilter('workLocation', 'on-site')} />
                        <FilterCheckbox label="Hybrid" checked={filters.workLocation.includes('hybrid')} onChange={() => toggleArrayFilter('workLocation', 'hybrid')} />
                    </FilterAccordion>

                    <FilterAccordion title="Experience Level" icon={<Clock className="w-4 h-4" />} defaultOpen>
                        <FilterCheckbox label="Internship" checked={filters.experienceLevel.includes('internship')} onChange={() => toggleArrayFilter('experienceLevel', 'internship')} />
                        <FilterCheckbox label="Entry Level" checked={filters.experienceLevel.includes('entry')} onChange={() => toggleArrayFilter('experienceLevel', 'entry')} />
                        <FilterCheckbox label="Mid Level" checked={filters.experienceLevel.includes('mid')} onChange={() => toggleArrayFilter('experienceLevel', 'mid')} />
                        <FilterCheckbox label="Senior Level" checked={filters.experienceLevel.includes('senior')} onChange={() => toggleArrayFilter('experienceLevel', 'senior')} />
                        <FilterCheckbox label="Lead / Principal" checked={filters.experienceLevel.includes('lead')} onChange={() => toggleArrayFilter('experienceLevel', 'lead')} />
                    </FilterAccordion>

                    <FilterAccordion title="Industries" icon={<Building2 className="w-4 h-4" />}>
                        {['Tech', 'Finance', 'Healthcare', 'E-commerce', 'Education', 'Media', 'Marketing', 'Consulting'].map(ind => (
                            <FilterCheckbox
                                key={ind}
                                label={ind}
                                checked={filters.industries.includes(ind.toLowerCase())}
                                onChange={() => toggleArrayFilter('industries', ind.toLowerCase())}
                            />
                        ))}
                    </FilterAccordion>

                    <FilterAccordion title="Technologies" icon={<Code className="w-4 h-4" />}>
                        <div className="px-2 mb-2 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tech..."
                                value={techSearch}
                                onChange={(e) => setTechSearch(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 dark:border-[#3d3c3e] rounded-md bg-gray-50 dark:bg-[#2b2a2c] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {filteredTechs.map(tech => (
                                <FilterCheckbox
                                    key={tech}
                                    label={tech}
                                    checked={filters.technologies.includes(tech.toLowerCase())}
                                    onChange={() => toggleArrayFilter('technologies', tech.toLowerCase())}
                                />
                            ))}
                        </div>
                    </FilterAccordion>

                    <FilterAccordion title="Skills" icon={<Star className="w-4 h-4" />}>
                        <div className="px-2 mb-2 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search skills..."
                                value={skillSearch}
                                onChange={(e) => setSkillSearch(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 dark:border-[#3d3c3e] rounded-md bg-gray-50 dark:bg-[#2b2a2c] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {filteredSkills.map(skill => (
                                <FilterCheckbox
                                    key={skill}
                                    label={skill}
                                    checked={filters.skills.includes(skill.toLowerCase())}
                                    onChange={() => toggleArrayFilter('skills', skill.toLowerCase())}
                                />
                            ))}
                        </div>
                    </FilterAccordion>

                    <FilterAccordion title="Date Posted" icon={<Calendar className="w-4 h-4" />}>
                        <FilterRadioGroup
                            name="datePosted"
                            value={filters.datePosted}
                            onChange={(value) => setDatePostedFilter(value as any)}
                            options={[
                                { value: 'any', label: 'Any time' },
                                { value: 'past24h', label: 'Past 24 hours' },
                                { value: 'pastWeek', label: 'Past week' },
                                { value: 'pastMonth', label: 'Past month' },
                            ]}
                        />
                    </FilterAccordion>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-[#3d3c3e] flex justify-end gap-3 bg-gray-50 dark:bg-[#242325]/50 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        Show Results
                    </button>
                </div>
            </div>
        </div>
    );
}

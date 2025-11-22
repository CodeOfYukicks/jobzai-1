import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { CompanyLogo } from '../common/CompanyLogo';
import { Job } from '../../types/job-board';

interface JobCardProps {
    job: Job;
    isSelected: boolean;
    onClick: () => void;
}

export function JobCard({ job, isSelected, onClick }: JobCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
                group cursor-pointer p-4 rounded-xl transition-all duration-200
                ${isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500 dark:border-indigo-400'
                    : 'bg-white dark:bg-gray-900 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md'
                }
            `}
        >
            <div className="flex gap-4">
                {/* Large Square Logo */}
                <div className="shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center p-1 shadow-sm">
                        <CompanyLogo companyName={job.company} size="xl" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Job Title */}
                    <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {job.title}
                    </h3>

                    {/* Company Name */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">
                        {job.company}
                    </p>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                        </span>
                        {job.published && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {job.published}
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                        {job.type && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                {job.type}
                            </span>
                        )}
                        {job.remote === 'remote' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Remote
                            </span>
                        )}
                        {job.seniority && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                                {job.seniority}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

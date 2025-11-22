import React from 'react';

export function JobSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm animate-pulse mb-3">
            <div className="flex gap-4">
                {/* Logo Skeleton */}
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />

                <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Title Skeleton */}
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />

                    {/* Company Skeleton */}
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />

                    {/* Metadata Skeleton */}
                    <div className="flex items-center gap-3 pt-1">
                        <div className="h-3.5 w-24 bg-gray-50 dark:bg-gray-800/50 rounded" />
                        <div className="h-3.5 w-20 bg-gray-50 dark:bg-gray-800/50 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}

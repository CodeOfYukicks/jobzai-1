'use client';
import React from 'react';
import type { Job } from '../../../types/job';

type Props = {
	job: Job;
	onShowDetails?: (job: Job) => void;
	onSave?: (job: Job) => void;
	onOpen?: (job: Job) => void;
};

function timeAgo(date?: Date): string | null {
	if (!date) return null;
	const diffMs = Date.now() - date.getTime();
	const mins = Math.floor(diffMs / 60000);
	if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
	const days = Math.floor(hours / 24);
	return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function CompanyLogo({ name, logoUrl }: { name?: string; logoUrl?: string }) {
	if (logoUrl) {
		return (
			<img
				src={logoUrl}
				alt={name || 'Company'}
				className="h-12 w-12 rounded-lg object-cover shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
				loading="lazy"
			/>
		);
	}
	const letter = (name || 'C').charAt(0).toUpperCase();
	return (
		<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700">
			{letter}
		</div>
	);
}

export default function JobCard({ job, onShowDetails, onSave, onOpen }: Props) {
	const postedStr = timeAgo(job.postedAt || job.updatedAt);
	return (
		<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900" onClick={() => onOpen?.(job)}>
			<div className="flex items-start gap-3">
				<CompanyLogo name={job.company} logoUrl={job.companyLogo} />
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">{job.title}</h3>
							<div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-gray-600 dark:text-gray-300">
								{job.company && <span className="truncate">{job.company}</span>}
								{job.company && job.location && <span className="text-gray-400">·</span>}
								{job.location && (
									<span className="inline-flex items-center gap-1">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
											<path fillRule="evenodd" d="M10 2a6 6 0 00-6 6c0 4.418 6 10 6 10s6-5.582 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z" clipRule="evenodd" />
										</svg>
										{job.location}
									</span>
								)}
							</div>
						</div>
						<div className="flex shrink-0 flex-col items-end gap-1">
							<span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
								{job.ats}
							</span>
							{postedStr && <span className="text-xs text-gray-500 dark:text-gray-400">{postedStr}</span>}
						</div>
					</div>

					{Array.isArray(job.skills) && job.skills.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-2">
							{job.skills.slice(0, 10).map((s) => (
								<span key={s} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
									{s}
								</span>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
				<button
					type="button"
					onClick={() => onShowDetails?.(job)}
					className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
				>
					Show details
				</button>
				<button
					type="button"
					onClick={() => onSave?.(job)}
					className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
				>
					Save
				</button>
				<a
					className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
					href={job.applyUrl}
					target="_blank"
					rel="noreferrer"
				>
					Apply
				</a>
			</div>
		</div>
	);
}




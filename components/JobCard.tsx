'use client';
import React from 'react';

export interface Job {
	id: string;
	title: string;
	company: string;
	logoUrl?: string;
	location: string;
	tags: string[];
	published: string; // e.g., "il y a 4 jours"
	applyUrl?: string;
}

type Props = {
	job: Job;
	onShowDetails?: (job: Job) => void;
	onSave?: (job: Job) => void;
	onApply?: (job: Job) => void;
	rightExtra?: React.ReactNode;
	onExplain?: (job: Job) => void;
};

function CompanyLogo({ src, alt }: { src?: string; alt: string }) {
	if (!src) {
		return (
			<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-sm font-semibold text-gray-600 ring-1 ring-gray-200">
				{(alt || 'C').substring(0, 1).toUpperCase()}
			</div>
		);
	}
	return (
		<img
			src={src}
			alt={alt}
			className="h-12 w-12 rounded-xl object-cover ring-1 ring-gray-200"
			loading="lazy"
		/>
	);
}

export default function JobCard({ job, onShowDetails, onSave, onApply, rightExtra, onExplain }: Props) {
	return (
		<div className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
				<div className="sm:mt-1">
					<CompanyLogo src={job.logoUrl} alt={job.company} />
				</div>
				<div className="flex-1">
					<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{job.title}</h3>
							<p className="text-gray-700 dark:text-gray-300">{job.company}</p>
							<div className="mt-2 flex flex-wrap gap-2">
								{job.tags.map((t) => (
									<span key={t} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
										{t}
									</span>
								))}
							</div>
						</div>
						<div className="flex items-center gap-2">
							{rightExtra ? (
								<span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-700 ring-1 ring-purple-100 dark:bg-purple-900/30 dark:text-purple-200 dark:ring-purple-900/50">
									{rightExtra}
								</span>
							) : null}
							<div className="text-xs font-medium text-gray-500 dark:text-gray-400">{job.published}</div>
						</div>
					</div>
					<div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{job.location}</div>
				</div>
			</div>

			<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
				{onExplain && (
					<button
						type="button"
						onClick={() => onExplain?.(job)}
						className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
					>
						Explain match
					</button>
				)}
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
				<button
					type="button"
					onClick={() => onApply?.(job)}
					className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2 text-sm text-white shadow-sm hover:shadow-md"
				>
					Apply
				</button>
			</div>
		</div>
	);
}



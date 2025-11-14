'use client';
import React, { useState } from 'react';

type Props = {
	onSearch?: (query: { title: string; location: string }) => void;
};

export default function JobSearchBar({ onSearch }: Props) {
	const [title, setTitle] = useState('');
	const [location, setLocation] = useState('');

	return (
		<div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm ring-1 ring-gray-100 backdrop-blur supports-[backdrop-filter]:backdrop-blur dark:border-gray-700 dark:bg-gray-900/60 dark:ring-gray-800">
			<div className="flex flex-col gap-3 md:flex-row">
				<div className="flex-1">
					<label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Job title</label>
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="e.g. Frontend Developer"
						className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 transition focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400"
					/>
				</div>
				<div className="flex-1">
					<label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</label>
					<input
						type="text"
						value={location}
						onChange={(e) => setLocation(e.target.value)}
						placeholder="e.g. Paris, Remote"
						className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 transition focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400"
					/>
				</div>
				<div className="flex items-end">
					<button
						type="button"
						onClick={() => onSearch?.({ title, location })}
						className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-white shadow-sm transition hover:shadow-md md:w-auto"
					>
						Search
					</button>
				</div>
			</div>
		</div>
	);
}



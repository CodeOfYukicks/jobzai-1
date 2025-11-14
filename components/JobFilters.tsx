'use client';
import React, { useMemo, useState } from 'react';
import FilterModal, { FilterOption } from './FilterModal';

type SelectedState = Record<string, number>; // key -> count selected

export default function JobFilters() {
	const [openKey, setOpenKey] = useState<string | null>(null);
	const [selectedCounts, setSelectedCounts] = useState<SelectedState>({});

	const initialOptions = useMemo(() => {
		return {
			mode: [
				{ id: 'remote', label: 'Télétravail' },
				{ id: 'hybrid', label: 'Hybride' },
				{ id: 'onsite', label: 'Sur site' },
			] as FilterOption[],
			skills: [
				{ id: 'react', label: 'React' },
				{ id: 'typescript', label: 'TypeScript' },
				{ id: 'node', label: 'Node.js' },
				{ id: 'python', label: 'Python' },
			] as FilterOption[],
			level: [
				{ id: 'junior', label: 'Junior' },
				{ id: 'mid', label: 'Intermédiaire' },
				{ id: 'senior', label: 'Senior' },
				{ id: 'lead', label: 'Lead' },
			] as FilterOption[],
			sort: [
				{ id: 'relevant', label: 'Pertinence' },
				{ id: 'recent', label: 'Plus récentes' },
			] as FilterOption[],
		};
	}, []);

	const [options, setOptions] = useState<Record<string, FilterOption[]>>(initialOptions);

	function open(key: string) {
		setOpenKey(key);
	}

	function onApply(key: string, opts: FilterOption[]) {
		setOptions((prev) => ({ ...prev, [key]: opts }));
		setSelectedCounts((prev) => ({
			...prev,
			[key]: opts.filter((o) => o.checked).length,
		}));
		setOpenKey(null);
	}

	const items = [
		{ key: 'mode', label: 'Work mode' },
		{ key: 'skills', label: 'Skills' },
		{ key: 'level', label: 'Experience level' },
		{ key: 'sort', label: 'Sort by' },
	];

	return (
		<div className="relative">
			<div className="flex gap-3 overflow-x-auto pb-1">
				{items.map((it) => {
					const count = selectedCounts[it.key] || 0;
					return (
						<button
							type="button"
							key={it.key}
							onClick={() => open(it.key)}
							className="inline-flex items-center rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-sm text-gray-800 shadow-sm ring-1 ring-gray-100 hover:bg-white"
						>
							<span>{it.label}</span>
							{count > 0 && (
								<span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-1 text-xs font-semibold text-white">
									{count}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{items.map((it) => (
				<FilterModal
					key={it.key}
					open={openKey === it.key}
					title={it.label}
					options={options[it.key]}
					onClose={() => setOpenKey(null)}
					onApply={(opts) => onApply(it.key, opts)}
				/>
			))}
		</div>
	);
}



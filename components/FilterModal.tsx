'use client';
import React, { useEffect, useState } from 'react';

export interface FilterOption {
	id: string;
	label: string;
	checked?: boolean;
}

type Props = {
	open: boolean;
	title: string;
	options: FilterOption[];
	onClose: () => void;
	onApply: (options: FilterOption[]) => void;
};

export default function FilterModal({ open, title, options, onClose, onApply }: Props) {
	const [local, setLocal] = useState<FilterOption[]>(options);

	useEffect(() => {
		setLocal(options);
	}, [options, open]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/40" onClick={onClose} />
			<div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
				<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
				<div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
					{local.map((opt) => (
						<label key={opt.id} className="flex items-center gap-3">
							<input
								type="checkbox"
								className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
								checked={!!opt.checked}
								onChange={(e) =>
									setLocal((prev) =>
										prev.map((o) => (o.id === opt.id ? { ...o, checked: e.target.checked } : o))
									)
								}
							/>
							<span className="text-sm text-gray-800 dark:text-gray-200">{opt.label}</span>
						</label>
					))}
				</div>
				<div className="mt-6 flex items-center justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						className="rounded-md border border-gray-300 px-3 py-2 text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => onApply(local)}
						className="rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2 text-white shadow-sm hover:shadow-md"
					>
						Show results
					</button>
				</div>
			</div>
		</div>
	);
}



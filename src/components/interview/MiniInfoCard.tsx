import React from 'react';
import { Calendar, Timer } from 'lucide-react';

export interface MiniInfoCardProps {
	date?: string | null;
	time?: string | null;
	type?: string | null;
	className?: string;
}

function computeCountdown(target?: Date | null) {
	if (!target) return { isPast: false, days: 0, hours: 0 };
	const now = new Date();
	const diffMs = target.getTime() - now.getTime();
	const isPast = diffMs < 0;
	const abs = Math.abs(diffMs);
	const days = Math.floor(abs / (1000 * 60 * 60 * 24));
	const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	return { isPast, days, hours };
}

export function MiniInfoCard({ date, time, type, className = '' }: MiniInfoCardProps) {
	const target = date ? new Date(`${date}T${time || '09:00'}`) : null;
	const { isPast, days, hours } = computeCountdown(target);
	const label = isPast ? 'Interview passed' : 'Next interview in';

	return (
		<div
			className={[
				'rounded-2xl p-8',
				'bg-white dark:bg-[#1E1F22]',
				'shadow-sm dark:shadow-none',
				'border border-gray-100 dark:border-[#2A2A2E]',
				'flex flex-col justify-between gap-6',
				'transition-all duration-200',
				'hover:shadow-md dark:hover:border-[#353539]',
				className
			].join(' ')}
		>
			<div className="flex flex-col gap-4">
				<div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
					{label}
				</div>
				<div className="flex items-center gap-3">
					<div className="h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 ring-1 ring-indigo-100 dark:ring-indigo-900/50">
						<Timer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
					</div>
					<div className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
						{days}d {hours}h
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-3">
				<div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-[#2A2A2E] to-transparent" />
				<div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
					<Calendar className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500 dark:text-gray-500" />
					<div className="leading-relaxed">
						<div className="font-medium text-gray-700 dark:text-gray-300">
							{type ? `${type.charAt(0).toUpperCase() + type.slice(1)} Interview` : 'Interview'}
						</div>
						<div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
							{date ? new Date(date).toLocaleDateString(undefined, { 
								weekday: 'short',
								day: 'numeric', 
								month: 'short', 
								year: 'numeric' 
							}) : '—'}
							{time ? ` • ${time}` : ''}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default MiniInfoCard;



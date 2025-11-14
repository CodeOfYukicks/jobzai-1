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
				'rounded-xl p-6',
				'bg-white dark:bg-[#1E1F22]',
				'shadow-sm dark:shadow-none',
				'border border-gray-200 dark:border-[#2A2A2E]',
				'flex flex-col justify-between',
				className
			].join(' ')}
		>
			<div className="flex flex-col gap-1.5">
				<div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
				<div className="flex items-center gap-2">
					<div className="h-7 w-7 rounded-lg flex items-center justify-center bg-[#F3F4F6] dark:bg-[#26262B]">
						<Timer className="w-3.5 h-3.5 text-[#4F46E5]" />
					</div>
					<div className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
						{days} days {hours} hours
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-1.5">
				<div className="h-px bg-gray-200 dark:bg-[#2A2A2E]" />
				<div className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-400">
					<Calendar className="w-3.5 h-3.5" />
					<div className="truncate">
						{type ? `${type.charAt(0).toUpperCase() + type.slice(1)}` : 'Interview'} •{' '}
						{date ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
						{time ? ` at ${time}` : ''}
					</div>
				</div>
			</div>
		</div>
	);
}

export default MiniInfoCard;



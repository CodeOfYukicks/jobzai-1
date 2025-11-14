import React, { useEffect, useRef, useState } from 'react';
import { CalendarCheck, CheckCircle, XCircle } from 'lucide-react';
import { StepChip } from '../application/StepChip';
import { getCompanyDomain, getClearbitUrl, getGoogleFaviconUrl } from '../../utils/logo';

type InterviewType = 'technical' | 'hr' | 'manager' | 'final' | 'other';
type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';

export interface HeaderCardProps {
	companyName: string;
	position: string;
	location?: string;
	interviewType?: InterviewType;
	status?: InterviewStatus;
	className?: string;
}

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function StatusChip({ status }: { status: InterviewStatus }) {
	const map: Record<InterviewStatus, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
		scheduled: {
			label: 'Scheduled',
			bg: 'bg-[#E8F1FD]',
			text: 'text-[#2563EB]',
			border: 'border-[#D7E6FB]',
			icon: <CalendarCheck className="w-3.5 h-3.5" />
		},
		completed: {
			label: 'Completed',
			bg: 'bg-[#DCFCE7]',
			text: 'text-[#16A34A]',
			border: 'border-[#BBF7D0]',
			icon: <CheckCircle className="w-3.5 h-3.5" />
		},
		cancelled: {
			label: 'Cancelled',
			bg: 'bg-[#FFE4E8]',
			text: 'text-[#F43F5E]',
			border: 'border-[#FECDD3]',
			icon: <XCircle className="w-3.5 h-3.5" />
		}
	};
	const s = map[status];
	return (
		<span className={['inline-flex items-center gap-1.5 rounded-full border text-[11px] font-medium px-2.5 py-1 transition-colors', s.bg, s.text, s.border].join(' ')}>
			{s.icon}
			{s.label}
		</span>
	);
}

export function HeaderCard({
	companyName,
	position,
	location,
	interviewType,
	status,
	className = ''
}: HeaderCardProps) {
	const [isDark, setIsDark] = useState(false);
	useEffect(() => {
		const root = document.documentElement;
		const check = () => setIsDark(root.classList.contains('dark'));
		check();
		const observer = new MutationObserver(check);
		observer.observe(root, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	}, []);

	const companyDomain = getCompanyDomain(companyName);
	const initialLogo = companyDomain ? getClearbitUrl(companyDomain) : null;
	const [logoSrc, setLogoSrc] = useState<string | null>(initialLogo);
	const triedGoogle = useRef(false);
	function handleLogoError() {
		if (companyDomain && !triedGoogle.current) {
			triedGoogle.current = true;
			setLogoSrc(getGoogleFaviconUrl(companyDomain));
		} else {
			setLogoSrc(null);
		}
	}

	return (
		<div className={['w-full py-4 border-b', 'bg-transparent', 'border-gray-200 dark:border-[#2A2A2E]', className].join(' ')}>
			<div className="flex items-start justify-between">
				<div className="flex items-start gap-4 min-w-0">
					<div className="h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-[#1E1F22] dark:bg-[#2A2A2E]">
						{logoSrc ? (
							<img src={logoSrc} alt={`${companyName} logo`} onError={handleLogoError} className="h-8 w-8 rounded-full object-cover" />
						) : (
							<span className="text-sm font-semibold text-[#374151] dark:text-gray-200">{getInitials(companyName)}</span>
						)}
					</div>
					<div className="min-w-0">
						<div className="text-gray-900 dark:text-gray-100 font-semibold text-[17px] leading-tight tracking-[-0.01em]">
							{position}
						</div>
						<div className="text-[14px] font-medium text-gray-600 dark:text-gray-400 leading-snug mt-1">
							{companyName}{location ? ` • ${location}` : ''}
						</div>
						{interviewType && (
							<div className="mt-2">
								<StepChip type={interviewType} muted={false} />
							</div>
						)}
					</div>
				</div>
				<div className="flex items-center">
					{status && <StatusChip status={status} />}
				</div>
			</div>
		</div>
	);
}

export default HeaderCard;



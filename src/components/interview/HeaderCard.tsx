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
		<div className={['w-full py-12', 'bg-transparent', className].join(' ')}>
			<div className="flex flex-col items-center justify-center text-center space-y-6">
				{/* Logo centré - grande taille */}
				<div className="h-20 w-20 rounded-full flex items-center justify-center bg-white dark:bg-[#2A2A2E] shadow-sm border border-gray-100 dark:border-[#2A2A2E]">
					{logoSrc ? (
						<img src={logoSrc} alt={`${companyName} logo`} onError={handleLogoError} className="h-16 w-16 rounded-full object-cover" />
					) : (
						<span className="text-2xl font-semibold text-[#374151] dark:text-gray-200">{getInitials(companyName)}</span>
					)}
				</div>

				{/* Titre du poste - grande taille, centré */}
				<div className="space-y-3">
					<div className="text-gray-900 dark:text-gray-100 font-semibold text-3xl leading-tight tracking-[-0.02em] max-w-2xl">
						{position}
					</div>
					
					{/* Nom entreprise • Localisation - centré */}
					<div className="text-base font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
						{companyName}{location ? ` • ${location}` : ''}
					</div>
				</div>

				{/* Badges centrés */}
				<div className="flex flex-wrap items-center justify-center gap-3">
					{interviewType && (
						<StepChip type={interviewType} muted={false} />
					)}
					{status && <StatusChip status={status} />}
				</div>
			</div>
		</div>
	);
}

export default HeaderCard;



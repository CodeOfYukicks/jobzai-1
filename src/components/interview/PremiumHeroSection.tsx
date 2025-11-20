import React, { useEffect, useRef, useState } from 'react';
import { CalendarCheck, CheckCircle, XCircle, Calendar, Timer } from 'lucide-react';
import { StepChip } from '../application/StepChip';
import { getCompanyDomain, getClearbitUrl, getGoogleFaviconUrl } from '../../utils/logo';

type InterviewType = 'technical' | 'hr' | 'manager' | 'final' | 'other';
type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';

export interface PremiumHeroSectionProps {
  companyName: string;
  position: string;
  location?: string;
  interviewType?: InterviewType;
  status?: InterviewStatus;
  date?: string | null;
  time?: string | null;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

function StatusChip({ status }: { status: InterviewStatus }) {
  const map: Record<
    InterviewStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    scheduled: {
      label: 'Scheduled',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <CalendarCheck className="w-3.5 h-3.5" />,
    },
    completed: {
      label: 'Completed',
      bg: 'bg-green-50 dark:bg-green-950/30',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      icon: <CheckCircle className="w-3.5 h-3.5" />,
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-red-50 dark:bg-red-950/30',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  };
  const s = map[status];
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border text-xs font-medium px-3 py-1.5 transition-colors',
        s.bg,
        s.text,
        s.border,
      ].join(' ')}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

export function PremiumHeroSection({
  companyName,
  position,
  location,
  interviewType,
  status,
  date,
  time,
  className = '',
}: PremiumHeroSectionProps) {
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

  const target = date ? new Date(`${date}T${time || '09:00'}`) : null;
  const { isPast, days, hours } = computeCountdown(target);
  const countdownLabel = isPast ? 'Interview passed' : 'Next interview in';

  return (
    <div className={['w-full py-12 px-6', className].join(' ')}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          
          {/* Left: Company & Position */}
          <div className="flex items-start gap-6 flex-1 min-w-0">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center bg-white dark:bg-[#1E1F22] shadow-sm border border-gray-100 dark:border-[#2A2A2E] overflow-hidden">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={`${companyName} logo`}
                    onError={handleLogoError}
                    className="h-16 w-16 object-contain p-2"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                    {getInitials(companyName)}
                  </span>
                )}
              </div>
            </div>

            {/* Company Name & Position */}
            <div className="flex-1 min-w-0">
              <h1 className="text-gray-900 dark:text-gray-50 font-bold text-4xl leading-tight tracking-[-0.02em] mb-2">
                {position}
              </h1>
              <div className="flex items-center gap-2 text-lg font-medium text-gray-600 dark:text-gray-400">
                <span>{companyName}</span>
                {location && (
                  <>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-gray-500 dark:text-gray-400">{location}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Interview Info */}
          <div className="flex-shrink-0">
            <div className="text-right space-y-3">
              {/* Countdown */}
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {countdownLabel}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Timer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                    {days}d {hours}h
                  </div>
                </div>
              </div>

              {/* Date & Type */}
              <div className="flex items-center justify-end gap-3 flex-wrap">
                {date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {new Date(date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {time ? ` • ${time}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center justify-end gap-2 flex-wrap">
                {interviewType && <StepChip type={interviewType} muted={false} />}
                {status && <StatusChip status={status} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PremiumHeroSection;

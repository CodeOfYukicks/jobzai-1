import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
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
  if (!target) return { isPast: false, days: 0, hours: 0, minutes: 0 };
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const abs = Math.abs(diffMs);
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
  return { isPast, days, hours, minutes };
}

// Minimal Tag - Notion Style
function MinimalTag({ 
  children, 
  accent = false 
}: { 
  children: React.ReactNode; 
  accent?: boolean;
}) {
  return (
    <span 
      className={`
        inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium
        transition-colors duration-200
        ${accent 
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' 
          : 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
        }
      `}
    >
      {children}
    </span>
  );
}

function getInterviewTypeLabel(type: InterviewType): string {
  const labels: Record<InterviewType, string> = {
    technical: 'Technical',
    hr: 'HR Interview',
    manager: 'Manager Round',
    final: 'Final Round',
    other: 'Interview',
  };
  return labels[type] || type;
}

function getStatusLabel(status: InterviewStatus): string {
  const labels: Record<InterviewStatus, string> = {
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
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
  
  // Format date compactly
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }) : null;

  return (
    <div className={`w-full py-12 px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
          
          {/* Left Section: Logo + Content */}
          <div className="flex items-start gap-8 flex-1 min-w-0">
            
            {/* Logo Container - Glassmorphism */}
            <div className="flex-shrink-0 mt-2">
              <div className="relative group">
                <div 
                  className="
                    h-20 w-20 rounded-2xl 
                    backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 
                    ring-1 ring-slate-200/50 dark:ring-slate-700/50
                    flex items-center justify-center
                    transition-all duration-300 
                    group-hover:ring-slate-300 dark:group-hover:ring-slate-600
                    group-hover:shadow-lg group-hover:shadow-slate-200/50 dark:group-hover:shadow-slate-900/50
                  "
                >
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={`${companyName} logo`}
                      onError={handleLogoError}
                      className="h-12 w-12 object-contain"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-slate-400 dark:text-slate-500 tracking-tight">
                      {getInitials(companyName)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              
              {/* Breadcrumb - Minimal uppercase */}
              <div className="mb-3">
                <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-slate-500 dark:text-slate-400">
                  {companyName}
                  {location && (
                    <>
                      <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
                      {location}
                    </>
                  )}
                </span>
              </div>

              {/* Main Title - Display Serif */}
              <h1 
                className="
                  font-display text-[2.75rem] md:text-[3.25rem] lg:text-[3.5rem]
                  font-normal leading-[1.1] tracking-[-0.02em]
                  text-slate-900 dark:text-white
                  mb-5
                  line-clamp-2
                "
              >
                {position}
              </h1>

              {/* Tags Row - Minimal */}
              <div className="flex items-center flex-wrap gap-2">
                {status && (
                  <MinimalTag accent={status === 'scheduled'}>
                    {getStatusLabel(status)}
                  </MinimalTag>
                )}
                {interviewType && (
                  <MinimalTag>
                    {getInterviewTypeLabel(interviewType)}
                  </MinimalTag>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Countdown Block */}
          <div className="flex-shrink-0 lg:text-right">
            {!isPast && (date || time) ? (
              <div className="inline-flex flex-col items-end">
                {/* Countdown Numbers */}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl md:text-5xl font-light tabular-nums text-slate-900 dark:text-white tracking-tight">
                    {days}
                  </span>
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500 mr-3">d</span>
                  <span className="text-4xl md:text-5xl font-light tabular-nums text-slate-900 dark:text-white tracking-tight">
                    {hours}
                  </span>
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500">h</span>
                </div>
                
                {/* "left" label */}
                <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500 mb-4">
                  remaining
                </span>

                {/* Date & Time */}
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  {formattedDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                  )}
                  {time && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {time}
                    </span>
                  )}
                </div>
              </div>
            ) : isPast ? (
              <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PremiumHeroSection;

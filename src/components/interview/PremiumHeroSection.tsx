import React, { useEffect, useRef, useState } from 'react';
import { CalendarCheck, CheckCircle, XCircle, Calendar, Timer, MapPin, Building2, Clock, Briefcase, User, Users, FileCheck } from 'lucide-react';
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

// Unified Tag Component for visual consistency
function HeroTag({ 
  children, 
  variant = 'default',
  className = ''
}: { 
  children: React.ReactNode; 
  variant?: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'gray' | 'indigo' | 'default';
  className?: string;
}) {
  const baseStyles = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border shadow-sm backdrop-blur-sm transition-all h-8";
  
  const variants = {
    default: "bg-gray-50/80 border-gray-200 text-gray-700 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300",
    blue: "bg-blue-50/80 border-blue-200/60 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300",
    green: "bg-emerald-50/80 border-emerald-200/60 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300",
    red: "bg-red-50/80 border-red-200/60 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300",
    purple: "bg-purple-50/80 border-purple-200/60 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-300",
    amber: "bg-amber-50/80 border-amber-200/60 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300",
    indigo: "bg-indigo-50/80 border-indigo-200/60 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-300",
    gray: "bg-gray-50/80 border-gray-200/60 text-gray-700 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

function StatusTag({ status }: { status: InterviewStatus }) {
  const config = {
    scheduled: { label: 'Scheduled', icon: CalendarCheck, variant: 'blue' as const },
    completed: { label: 'Completed', icon: CheckCircle, variant: 'green' as const },
    cancelled: { label: 'Cancelled', icon: XCircle, variant: 'gray' as const },
  };
  const { label, icon: Icon, variant } = config[status];
  
  return (
    <HeroTag variant={variant}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </HeroTag>
  );
}

function TypeTag({ type }: { type: InterviewType }) {
  const config = {
    technical: { label: 'Technical', icon: CodeIcon, variant: 'purple' as const },
    hr: { label: 'HR', icon: Users, variant: 'blue' as const },
    manager: { label: 'Manager', icon: Briefcase, variant: 'amber' as const },
    final: { label: 'Final', icon: FileCheck, variant: 'green' as const },
    other: { label: 'Other', icon: Calendar, variant: 'gray' as const },
  };
  
  // Fallback for icon if not defined above
  const { label, icon: Icon, variant } = config[type] || { label: type, icon: Calendar, variant: 'gray' };

  return (
    <HeroTag variant={variant}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </HeroTag>
  );
}

// Helper icon component
const CodeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
);

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
  
  // Format date nicely
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }) : null;

  return (
    <div className={['w-full pt-8 pb-6 px-8', className].join(' ')}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          
          {/* Left: Identity */}
          <div className="flex items-start gap-6 flex-1 min-w-0">
            {/* Large Transparent Logo */}
            <div className="flex-shrink-0 relative group mt-8">
              <div className="h-24 w-24 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={`${companyName} logo`}
                    onError={handleLogoError}
                    className="h-full w-full object-contain drop-shadow-sm"
                  />
                ) : (
                  <div className="h-full w-full rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-400 dark:text-gray-500">
                    {getInitials(companyName)}
                  </span>
                  </div>
                )}
              </div>
            </div>

            {/* Text Info */}
            <div className="flex-1 min-w-0 pt-1">
              {/* Breadcrumb-like top line */}
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-default">
                  <Building2 className="w-3.5 h-3.5" />
                  {companyName}
                </span>
                {location && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <span className="flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-default">
                      <MapPin className="w-3.5 h-3.5" />
                      {location}
                    </span>
                  </>
                )}
              </div>

              {/* Main Heading */}
              <h1 className="text-gray-900 dark:text-white font-bold text-4xl sm:text-5xl leading-tight tracking-tight mb-4">
                {position}
              </h1>

              {/* Unified Tags Row */}
              <div className="flex items-center flex-wrap gap-3">
                {status && <StatusTag status={status} />}
                {interviewType && <TypeTag type={interviewType} />}
                
                {/* Countdown Tag - Using same visual style */}
                <HeroTag variant={isPast ? 'gray' : 'indigo'}>
                  {isPast ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Timer className="w-3.5 h-3.5" />
                      <span>{days}d {hours}h left</span>
                    </>
                  )}
                </HeroTag>
              </div>
            </div>
          </div>

          {/* Right: Time & Context */}
          <div className="flex-shrink-0 mt-6 lg:mt-0 w-full lg:w-auto pl-24 lg:pl-0 border-t lg:border-t-0 pt-6 lg:pt-0 border-gray-100 dark:border-gray-800">
            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 lg:gap-2">
              
              {/* Date Display */}
              {formattedDate && (
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium text-base">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  {formattedDate}
                </div>
              )}

              {/* Time Display */}
              {time && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  {time}
                  </div>
                )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PremiumHeroSection;

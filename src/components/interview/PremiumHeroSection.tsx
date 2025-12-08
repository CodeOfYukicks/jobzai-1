import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Building2 } from 'lucide-react';
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

// Premium minimal tags with Jobzai violet accent
type TagVariant = 'default' | 'success' | 'violet' | 'warning' | 'error';

function PremiumTag({ 
  children, 
  variant = 'default'
}: { 
  children: React.ReactNode; 
  variant?: TagVariant;
}) {
  const variants: Record<TagVariant, string> = {
    default: 'bg-slate-100 text-slate-600 dark:bg-[#2b2a2c] dark:text-slate-400',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    violet: 'bg-jobzai-50 text-jobzai-600 dark:bg-jobzai-950/50 dark:text-jobzai-400',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    error: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
  };

  return (
    <motion.span 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
        transition-all duration-200 hover:scale-105
        ${variants[variant]}
      `}
    >
      {children}
    </motion.span>
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
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={`w-full py-8 px-6 lg:px-8 ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
          
          {/* Left Section: Logo + Content */}
          <div className="flex items-start gap-6 flex-1 min-w-0">
            
            {/* Logo Container - Premium glassmorphism */}
            <motion.div 
              className="flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="relative group">
                <div 
                  className="
                    h-16 w-16 rounded-2xl 
                    backdrop-blur-xl bg-white/90 dark:bg-[#2b2a2c]/90 
                    ring-1 ring-slate-200/50 dark:ring-[#3d3c3e]/50
                    flex items-center justify-center
                    transition-all duration-300 
                    group-hover:ring-jobzai-300/50 dark:group-hover:ring-jobzai-600/50
                    group-hover:shadow-lg group-hover:shadow-jobzai-500/10
                    overflow-hidden
                  "
                >
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={`${companyName} logo`}
                      onError={handleLogoError}
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-slate-500 dark:text-slate-400 tracking-tight">
                      {getInitials(companyName)}
                    </span>
                  )}
                </div>
                {/* Subtle glow on hover */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-jobzai-500/0 to-jobzai-light/0 group-hover:from-jobzai-500/10 group-hover:to-jobzai-light/10 blur-xl transition-all duration-500 -z-10" />
              </div>
            </motion.div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              
              {/* Breadcrumb - Elegant uppercase */}
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" />
                  {companyName}
                </span>
                {location && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-[11px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {location}
                    </span>
                  </>
                )}
              </div>

              {/* Main Title - Bold, modern sans-serif */}
              <h1 
                className="
                  text-2xl md:text-3xl lg:text-[2.5rem]
                  font-bold leading-[1.15] tracking-[-0.02em]
                  text-slate-900 dark:text-white
                  mb-4
                  line-clamp-2
                "
              >
                {position}
              </h1>

              {/* Tags Row - Premium pills */}
              <div className="flex items-center flex-wrap gap-2">
                {status && (
                  <PremiumTag variant={status === 'scheduled' ? 'success' : status === 'completed' ? 'violet' : 'error'}>
                    {getStatusLabel(status)}
                  </PremiumTag>
                )}
                {interviewType && (
                  <PremiumTag variant="default">
                    {getInterviewTypeLabel(interviewType)}
                  </PremiumTag>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Countdown Block - Premium card */}
          <div className="flex-shrink-0">
            {!isPast && (date || time) ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="
                  inline-flex flex-col items-end
                  bg-white/80 dark:bg-[#2b2a2c]/80
                  backdrop-blur-xl
                  rounded-2xl
                  px-5 py-4
                  border border-slate-200/60 dark:border-[#3d3c3e]/60
                  shadow-premium-soft
                "
              >
                {/* Countdown Numbers - Tabular */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl md:text-4xl font-bold tabular-nums text-slate-900 dark:text-white tracking-tight">
                    {days}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-2">d</span>
                  <span className="text-3xl md:text-4xl font-bold tabular-nums text-slate-900 dark:text-white tracking-tight">
                    {hours}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">h</span>
                </div>
                
                {/* "remaining" label */}
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500 mb-3">
                  remaining
                </span>

                {/* Date & Time - Compact */}
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {formattedDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-jobzai-500" />
                      {formattedDate}
                    </span>
                  )}
                  {time && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-jobzai-500" />
                      {time}
                    </span>
                  )}
                </div>
              </motion.div>
            ) : isPast ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="
                  inline-flex items-center gap-2 
                  px-4 py-2 rounded-xl
                  bg-emerald-50 dark:bg-emerald-950/30
                  text-emerald-700 dark:text-emerald-400
                "
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium">Interview Completed</span>
              </motion.div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default PremiumHeroSection;

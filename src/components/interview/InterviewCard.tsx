import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Trash2, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { Interview, JobApplication } from '../../types/job';
import { StepChip } from '../application/StepChip';
import { getCompanyDomain, getClearbitUrl, getGoogleFaviconUrl } from '../../utils/logo';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function InterviewCard({
  application,
  interview,
  isPast = false,
  linkToPrepare,
  onEdit,
  onDelete,
  onMarkCompleted,
  onMarkCancelled,
}: {
  application: JobApplication;
  interview: Interview;
  isPast?: boolean;
  linkToPrepare: string;
  onEdit: () => void;
  onDelete: () => void;
  onMarkCompleted: () => void;
  onMarkCancelled: () => void;
}) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const check = () => setIsDark(root.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const companyDomain = getCompanyDomain(application.companyName);
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

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (e.target instanceof Node && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  return (
    <div
      className={[
        'group relative w-full h-full cursor-pointer select-none',
        'rounded-[20px] md:rounded-[16px] border',
        'bg-white dark:bg-[#1E1F22] hover:bg-white dark:hover:bg-[#232428] transition-all duration-200',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]',
        'dark:shadow-none',
        'flex flex-col',
      ].join(' ')}
      style={{ borderColor: isDark ? '#2A2A2E' : '#E5E7EB' }}
      role="region"
      aria-label="Interview card"
    >
      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-[#1E1F22] dark:bg-[#2A2A2E]">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={`${application.companyName} logo`}
                  onError={handleLogoError}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-[#374151] dark:text-gray-200">{getInitials(application.companyName)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 pr-2 md:pr-4 lg:pr-6 xl:pr-8 2xl:pr-10 group-hover:pr-10 transition-[padding] duration-150 ease-out">
              <div
                className="text-gray-900 dark:text-gray-100 font-semibold text-[17px] leading-tight tracking-[-0.01em] mb-[6px]"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {application.position}
              </div>
              <div
                className="text-[14px] font-medium text-gray-600 dark:text-gray-400 leading-snug mb-[10px]"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {application.companyName}{application.location ? ` • ${application.location}` : ''}
              </div>
            </div>
          </div>

          {/* Right side: type chip + action menu */}
          <div className="absolute top-3 right-3" ref={menuRef}>
            <div className="flex items-center gap-2">
              <StepChip type={interview.type} className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Open actions"
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[#9CA3AF] dark:text-gray-400 opacity-0 invisible transition-opacity hover:text-[#6B7280] dark:hover:text-gray-200 group-hover:opacity-100 group-hover:visible pointer-events-none group-hover:pointer-events-auto"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {menuOpen && (
              <div
                role="menu"
                className="absolute top-9 right-0 z-20 w-44 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2E] bg-white dark:bg-[#1E1F22] shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onEdit(); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[13px] rounded-md hover:bg-[#F3F4F6] dark:hover:bg-[#2A2A2E] text-[#111827] dark:text-gray-100"
                >
                  <Edit3 className="h-4 w-4 text-[#9CA3AF] dark:text-gray-400" />
                  Edit
                </button>
                <button
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[13px] rounded-md hover:bg-[#FEE2E2] dark:hover:bg-red-900/30 text-[#111827] dark:text-gray-100"
                >
                  <Trash2 className="h-4 w-4 text-[#9CA3AF] dark:text-gray-400" />
                  Delete
                </button>
                <button
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onMarkCompleted(); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[13px] rounded-md hover:bg-[#ECFDF5] dark:hover:bg-green-900/30 text-[#111827] dark:text-gray-100"
                >
                  <CheckCircle className="h-4 w-4 text-[#10B981]" />
                  Mark as Completed
                </button>
                <button
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onMarkCancelled(); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[13px] rounded-md hover:bg-[#FEE2E2] dark:hover:bg-red-900/30 text-[#111827] dark:text-gray-100"
                >
                  <XCircle className="h-4 w-4 text-[#EF4444]" />
                  Mark as Cancelled
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Body: date/time/location */}
        <div className="mt-3 space-y-3 flex-1">
          <div className="text-[13px] text-gray-600 dark:text-gray-400">
            <span className="font-medium">Date: </span>
            {new Date(interview.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="text-[13px] text-gray-600 dark:text-gray-400">
            <span className="font-medium">Time: </span>
            {interview.time || 'Time not specified'}
          </div>
          {interview.location && (
            <div className="text-[13px] text-gray-600 dark:text-gray-400">
              <span className="font-medium">Location: </span>
              {interview.location}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-px bg-gray-200 dark:bg-[#2A2A2E] my-3 mt-auto" />
        {linkToPrepare ? (
          <Link
            to={linkToPrepare}
            className="inline-flex items-center justify-center text-[13px] font-medium text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors rounded-md px-3 py-2 w-full"
          >
            {isPast ? 'View Details' : 'Prepare for Interview'}
          </Link>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center text-[13px] font-medium text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors rounded-md px-3 py-2 w-full"
          >
            {isPast ? 'View Details' : 'Prepare for Interview'}
          </button>
        )}
      </div>
    </div>
  );
}

export default InterviewCard;





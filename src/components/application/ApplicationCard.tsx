import React, { useEffect, useRef, useState } from 'react';
import { Edit3, Trash2, MoreHorizontal } from 'lucide-react';
import { JobApplication } from '../../types/job';
import { StepChip } from './StepChip';
import { ProgressBar } from './ProgressBar';
import { getCompanyDomain, getClearbitUrl, getGoogleFaviconUrl } from '../../utils/logo';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getStatusBorderColor(status: JobApplication['status']): string {
  switch (status) {
    case 'applied': return '#E8F1FD';
    case 'interview': return '#FFF5CC';
    case 'pending_decision': return '#F3F4F6';
    case 'offer': return '#E2FBE2';
    case 'rejected': return '#FDE2E4';
    case 'archived':
    default: return '#F3F4F6';
  }
}

export function ApplicationCard({
  app, onEdit, onDelete, onClick, isDragging = false,
}: {
  app: JobApplication;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
  isDragging?: boolean;
}) {
  const interviewTypes =
    app.interviews?.map((i) => i.type).filter((v, i, a) => a.indexOf(v) === i) || [];
  const hasInterviews = (app.interviews?.length || 0) > 0;

  const hue = ((Array.from(app.companyName).reduce((a, c) => a + c.charCodeAt(0), 0) % 12) * 30) % 360;
  const ringColor = `ring-[hsl(${hue}deg_80%_85%)]`;
  const bgTint = 'bg-[#F9FAFB] dark:bg-[#2A2A2E]';
  const lightBorderColor = getStatusBorderColor(app.status);

  // Detect dark mode to neutralize the status border for premium dark appearance
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const check = () => setIsDark(root.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const companyDomain = getCompanyDomain(app.companyName);
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
      onClick={onClick}
      className={[
        'group relative w-full cursor-pointer select-none',
        'rounded-[20px] md:rounded-[16px] border',
        'bg-white dark:bg-[#1E1F22] hover:bg-white dark:hover:bg-[#232428] transition-all duration-200',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]',
        'dark:shadow-none',
        isDragging ? 'ring-2 ring-[#2563EB] ring-offset-0' : '',
      ].join(' ')}
      style={{ borderColor: isDark ? '#2A2A2E' : lightBorderColor }}
      role="button"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-[#1E1F22] dark:bg-[#2A2A2E]">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={`${app.companyName} logo`}
                  onError={handleLogoError}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-[#374151] dark:text-gray-200">{getInitials(app.companyName)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 pr-2 md:pr-4 lg:pr-6 xl:pr-8 2xl:pr-10 group-hover:pr-10 transition-[padding] duration-150 ease-out">
              <div
                className="text-gray-900 dark:text-gray-100 font-semibold text-[17px] leading-tight tracking-[-0.01em] mb-[6px]"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {app.position}
              </div>
              <div
                className="text-[14px] font-medium text-gray-600 dark:text-gray-400 leading-snug mb-[10px]"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {app.companyName}{app.location ? ` • ${app.location}` : ''}
              </div>
            </div>
          </div>
          {/* Kebab menu trigger - absolute, hidden by default, visible on hover */}
          <div className="absolute top-3 right-3" ref={menuRef}>
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
            {menuOpen && (
              <div
                role="menu"
                className="absolute top-9 right-0 z-20 w-36 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2E] bg-white dark:bg-[#1E1F22] shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
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
              </div>
            )}
          </div>
        </div>

        {/* Steps */}
        {(hasInterviews) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {interviewTypes.slice(0, 4).map((t) => <StepChip key={t} type={t} />)}
            {interviewTypes.length > 4 && (
              <span className="text-[10px] text-[#6B7280] dark:text-gray-400 px-2 py-0.5 rounded-full border border-[#E5E7EB] dark:border-[#2A2A2E] bg-[#F9FAFB] dark:bg-[#232428]">
                +{interviewTypes.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Progress */}
        {/* showProgress is not defined, assuming it should be removed or handled */}
        {/* {showProgress && (
          <div className="mt-3">
            <ProgressBar status={app.status} />
          </div>
        )} */}

        {/* Footer */}
        <div className="h-px bg-gray-200 dark:bg-[#2A2A2E] my-3" />
        <div className="text-[12px] text-gray-600 dark:text-gray-500">Applied on {app.appliedDate}</div>
      </div>
    </div>
  );
}



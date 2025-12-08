import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Calendar, Clock, MapPin, Eye, Edit3, Trash2 } from 'lucide-react';
import { Interview, JobApplication } from '../../types/job';
import { CompanyLogo } from '../common/CompanyLogo';

// Helper function to get type badge styles
const getTypeBadgeStyles = (type: string) => {
  switch (type) {
    case 'technical':
      return {
        bg: 'bg-purple-50 dark:bg-purple-500/10',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-500/20',
      };
    case 'hr':
      return {
        bg: 'bg-pink-50 dark:bg-pink-500/10',
        text: 'text-pink-700 dark:text-pink-400',
        border: 'border-pink-200 dark:border-pink-500/20',
      };
    case 'manager':
      return {
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-500/20',
      };
    case 'final':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-500/20',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-500/10',
        text: 'text-gray-700 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-500/20',
      };
  }
};

// Helper function to format type label
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    technical: 'Technical',
    hr: 'HR',
    manager: 'Manager',
    final: 'Final',
    other: 'Other',
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

// Helper function to format date
const formatDateString = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

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
  const typeStyles = getTypeBadgeStyles(interview.type);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-xl p-5 
        border border-gray-200/60 dark:border-[#3d3c3e]/50
        hover:border-gray-300/80 dark:hover:border-gray-600/60
        shadow-sm hover:shadow-md
        cursor-pointer transition-all duration-200
        h-full flex flex-col"
      onClick={() => {
        if (linkToPrepare) {
          navigate(linkToPrepare);
        }
      }}
    >
      <div className="relative flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-start gap-3 flex-shrink-0">
          {/* Company Logo */}
          <CompanyLogo
            companyName={application.companyName}
            size="lg"
            className="rounded-lg border border-gray-100 dark:border-[#3d3c3e] flex-shrink-0"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                  {application.position}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                  <span className="truncate">{application.companyName}</span>
                </p>
              </div>

              {/* Type Badge */}
              <span className={`flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium
                ${typeStyles.bg} ${typeStyles.text}
                transition-colors duration-200`}
              >
                {getTypeLabel(interview.type)}
              </span>
            </div>
          </div>
        </div>

        {/* Interview Details - compact */}
        <div className="mt-3 space-y-1.5 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
            <span>{formatDateString(interview.date)}</span>
          </div>
          {interview.time && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              <span>{interview.time}</span>
            </div>
          )}
          {interview.location && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              <span className="truncate">{interview.location}</span>
            </div>
          )}
        </div>

        {/* Spacer to push footer to bottom */}
        <div className="flex-1"></div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-[#3d3c3e]/50 flex-shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {isPast ? 'Past interview' : 'Upcoming'}
          </span>

          {/* Quick actions - appear on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {linkToPrepare && (
              <Link
                to={linkToPrepare}
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                  dark:hover:text-gray-300 dark:hover:bg-[#3d3c3e]
                  transition-colors"
                aria-label="View details"
              >
                <Eye className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                onEdit(); 
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                dark:hover:text-gray-300 dark:hover:bg-[#3d3c3e]
                transition-colors"
              aria-label="Edit"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                onDelete(); 
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 
                dark:hover:text-red-400 dark:hover:bg-red-500/10
                transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default InterviewCard;





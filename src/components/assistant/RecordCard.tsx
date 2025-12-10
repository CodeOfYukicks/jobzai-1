import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Building2, 
  Calendar, 
  FileText, 
  FileCheck,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useAssistant } from '../../contexts/AssistantContext';

export type RecordType = 'application' | 'job' | 'interview' | 'note' | 'cv';

export interface RecordCardData {
  type: RecordType;
  id: string;
  title: string;
  subtitle?: string;
}

interface RecordCardProps {
  data: RecordCardData;
}

// Type-specific configuration
const RECORD_CONFIG: Record<RecordType, {
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  hoverBg: string;
  label: string;
  getRoute: (id: string) => string;
}> = {
  application: {
    icon: Briefcase,
    gradient: 'from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-200/60 dark:border-violet-500/30',
    bgColor: 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
    hoverBg: 'hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-900/50 dark:hover:to-purple-900/50',
    label: 'Application',
    getRoute: (id) => `/applications?highlight=${id}`,
  },
  job: {
    icon: Building2,
    gradient: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200/60 dark:border-blue-500/30',
    bgColor: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40',
    hoverBg: 'hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/50 dark:hover:to-cyan-900/50',
    label: 'Job',
    getRoute: (id) => `/jobs?selected=${id}`,
  },
  interview: {
    icon: Calendar,
    gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200/60 dark:border-emerald-500/30',
    bgColor: 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40',
    hoverBg: 'hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/50 dark:hover:to-teal-900/50',
    label: 'Interview',
    getRoute: (id) => `/upcoming-interviews?id=${id}`,
  },
  note: {
    icon: FileText,
    gradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200/60 dark:border-amber-500/30',
    bgColor: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
    hoverBg: 'hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/50 dark:hover:to-orange-900/50',
    label: 'Note',
    getRoute: (id) => `/notes/${id}`,
  },
  cv: {
    icon: FileCheck,
    gradient: 'from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-200/60 dark:border-indigo-500/30',
    bgColor: 'bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40',
    hoverBg: 'hover:from-indigo-100 hover:to-violet-100 dark:hover:from-indigo-900/50 dark:hover:to-violet-900/50',
    label: 'CV Analysis',
    getRoute: (id) => `/cv-analysis?id=${id}`,
  },
};

export default function RecordCard({ data }: RecordCardProps) {
  const navigate = useNavigate();
  const { closeAssistant } = useAssistant();
  const config = RECORD_CONFIG[data.type];
  const Icon = config.icon;

  const handleClick = () => {
    const route = config.getRoute(data.id);
    closeAssistant();
    navigate(route);
  };

  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className={`
        w-full max-w-full my-1.5 p-2.5 rounded-xl
        ${config.bgColor}
        border ${config.borderColor}
        ${config.hoverBg}
        transition-all duration-200 ease-out
        group cursor-pointer
        text-left
        shadow-sm hover:shadow
        overflow-hidden
      `}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Icon - compact */}
        <div className={`
          flex-shrink-0 h-8 w-8 rounded-lg
          bg-white/80 dark:bg-white/10
          flex items-center justify-center
          shadow-sm
        `}>
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
        </div>

        {/* Content - with proper overflow handling */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Type label */}
          <span className={`text-[9px] font-semibold uppercase tracking-wider ${config.iconColor} opacity-80`}>
            {config.label}
          </span>
          
          {/* Title */}
          <h4 className="text-[13px] font-semibold text-gray-900 dark:text-white truncate leading-tight">
            {data.title}
          </h4>
          
          {/* Subtitle */}
          {data.subtitle && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate leading-tight">
              {data.subtitle}
            </p>
          )}
        </div>

        {/* Arrow indicator - compact */}
        <div className={`
          flex-shrink-0 h-6 w-6 rounded-md
          flex items-center justify-center
          bg-white/50 dark:bg-white/5
          group-hover:bg-white dark:group-hover:bg-white/10
          transition-all duration-200
        `}>
          <ArrowRight className={`h-3.5 w-3.5 ${config.iconColor} group-hover:translate-x-0.5 transition-transform`} />
        </div>
      </div>
    </motion.button>
  );
}

// Compact inline version for use within text
export function RecordCardInline({ data }: RecordCardProps) {
  const navigate = useNavigate();
  const { closeAssistant } = useAssistant();
  const config = RECORD_CONFIG[data.type];
  const Icon = config.icon;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const route = config.getRoute(data.id);
    closeAssistant();
    navigate(route);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md
        ${config.bgColor}
        border ${config.borderColor}
        hover:opacity-90 active:scale-[0.98]
        transition-all duration-150
        text-xs font-medium
        max-w-full
      `}
    >
      <Icon className={`h-3 w-3 flex-shrink-0 ${config.iconColor}`} />
      <span className="text-gray-800 dark:text-gray-200 truncate">
        {data.title}
      </span>
      <ExternalLink className="h-2.5 w-2.5 flex-shrink-0 text-gray-400" />
    </button>
  );
}


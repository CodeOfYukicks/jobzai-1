import { motion } from 'framer-motion';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Globe,
  Building2,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';

interface JobApplicationData {
  id: string;
  companyName: string;
  position: string;
  location?: string;
  status: string;
  appliedDate: string;
  salary?: string;
  workType?: string;
  platform?: string;
  url?: string;
}

interface MentionCardJobApplicationProps {
  data: JobApplicationData;
  onClick?: () => void;
  compact?: boolean;
  selected?: boolean;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  applied: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  interview: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  offer: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  rejected: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  archived: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' },
  pending_decision: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  wishlist: { bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

export default function MentionCardJobApplication({ data, onClick, compact = false, selected = false }: MentionCardJobApplicationProps) {
  const status = statusConfig[data.status] || statusConfig.applied;

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 select-none
        bg-white dark:bg-[#202020]
        border transition-all duration-200 ease-in-out
        ${selected 
          ? 'border-blue-500 ring-2 ring-blue-500/20 dark:ring-blue-500/10' 
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
        }
        rounded-xl overflow-hidden
        ${compact ? 'p-2' : 'p-3 pr-4'}
        shadow-sm hover:shadow-md
      `}
    >
      {/* Left: Icon Box */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <Building2 className="w-5 h-5" />
      </div>

      {/* Middle: Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {data.companyName}
          </h3>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}>
            <span className={`w-1 h-1 rounded-full ${status.dot}`} />
            <span className="capitalize">{data.status.replace('_', ' ')}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="truncate font-medium">{data.position}</span>
          {data.location && (
            <span className="flex items-center gap-1 truncate opacity-80">
              <MapPin className="w-3 h-3" />
              {data.location}
            </span>
          )}
          <span className="flex items-center gap-1 truncate opacity-80">
            <Calendar className="w-3 h-3" />
            {formatDate(data.appliedDate)}
          </span>
        </div>
      </div>

      {/* Right: Extras & Actions */}
      <div className="flex items-center gap-3">
        {data.salary && !compact && (
          <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
            <DollarSign className="w-3 h-3" />
            {data.salary}
          </div>
        )}
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export type { JobApplicationData };

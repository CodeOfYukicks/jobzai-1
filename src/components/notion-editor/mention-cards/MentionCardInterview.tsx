import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock,
  MapPin,
  Users,
  Video,
  Phone,
  Briefcase,
  User,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface InterviewData {
  id: string;
  applicationId: string;
  companyName: string;
  position: string;
  date: string;
  time: string;
  type: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  interviewers?: string[];
}

interface MentionCardInterviewProps {
  data: InterviewData;
  onClick?: () => void;
  compact?: boolean;
  selected?: boolean;
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  technical: { icon: <Video className="w-3 h-3" />, label: 'Tech' },
  hr: { icon: <User className="w-3 h-3" />, label: 'HR' },
  manager: { icon: <Briefcase className="w-3 h-3" />, label: 'Manager' },
  final: { icon: <Users className="w-3 h-3" />, label: 'Final' },
  other: { icon: <Phone className="w-3 h-3" />, label: 'Other' },
};

const statusConfig: Record<string, { color: string; dot: string }> = {
  scheduled: { color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  completed: { color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  cancelled: { color: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

export default function MentionCardInterview({ data, onClick, compact = false, selected = false }: MentionCardInterviewProps) {
  const type = typeConfig[data.type] || typeConfig.other;
  const status = statusConfig[data.status] || statusConfig.scheduled;

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 select-none
        bg-white dark:bg-[#202020]
        border transition-all duration-200 ease-in-out
        ${selected 
          ? 'border-amber-500 ring-2 ring-amber-500/20 dark:ring-amber-500/10' 
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
        }
        rounded-xl overflow-hidden
        ${compact ? 'p-2' : 'p-3 pr-4'}
        shadow-sm hover:shadow-md
      `}
    >
      {/* Left: Date Box */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex flex-col items-center justify-center text-amber-600 dark:text-amber-400">
        <span className="text-xs font-bold">{data.date ? new Date(data.date).getDate() : '--'}</span>
        <span className="text-[8px] font-medium uppercase opacity-80">
          {data.date ? new Date(data.date).toLocaleDateString('en-US', { month: 'short' }) : ''}
        </span>
      </div>

      {/* Middle: Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {data.position}
          </h3>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400">
            {type.icon}
            <span>{type.label}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1 truncate opacity-80">
            <Clock className="w-3 h-3" />
            {data.time}
          </span>
          <span className={`flex items-center gap-1 truncate opacity-80 font-medium ${status.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <span className="capitalize">{data.status}</span>
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export type { InterviewData };

import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock,
  Palette,
  Tag,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ResumeData {
  id: string;
  name: string;
  template?: string;
  updatedAt?: string;
  tags?: string[];
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    title?: string;
  };
}

interface MentionCardResumeProps {
  data: ResumeData;
  onClick?: () => void;
  compact?: boolean;
  selected?: boolean;
}

const formatDate = (dateValue: any) => {
  try {
    if (!dateValue) return '';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export default function MentionCardResume({ data, onClick, compact = false, selected = false }: MentionCardResumeProps) {
  return (
    <motion.div
      layout
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 select-none
        bg-white dark:bg-[#202020]
        border transition-all duration-200 ease-in-out
        ${selected 
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:ring-emerald-500/10' 
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
        }
        rounded-xl overflow-hidden
        ${compact ? 'p-2' : 'p-3 pr-4'}
        shadow-sm hover:shadow-md
      `}
    >
      {/* Left: Icon Box */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
        <FileText className="w-5 h-5" />
      </div>

      {/* Middle: Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {data.name}
          </h3>
          {data.tags && data.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {data.tags.slice(0, 2).map((tag, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  {tag}
                </span>
              ))}
              {data.tags.length > 2 && (
                <span className="text-[10px] text-gray-400">+{data.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1 truncate opacity-80">
            <Clock className="w-3 h-3" />
            Updated {formatDate(data.updatedAt)}
          </span>
          {data.template && (
            <span className="flex items-center gap-1 truncate opacity-80">
              <Palette className="w-3 h-3" />
              {data.template.replace(/-/g, ' ')}
            </span>
          )}
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

export type { ResumeData };

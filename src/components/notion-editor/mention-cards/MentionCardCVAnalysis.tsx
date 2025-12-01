import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Building2,
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface CVAnalysisData {
  id: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  date?: string;
  keyFindings?: string[];
  skillsMatch?: {
    matching?: { name: string }[];
    missing?: { name: string }[];
  };
  categoryScores?: {
    skills: number;
    experience: number;
    education: number;
    industryFit: number;
  };
}

interface MentionCardCVAnalysisProps {
  data: CVAnalysisData;
  onClick?: () => void;
  compact?: boolean;
  selected?: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' };
  if (score >= 60) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' };
  return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20' };
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

export default function MentionCardCVAnalysis({ data, onClick, compact = false, selected = false }: MentionCardCVAnalysisProps) {
  const scoreColors = getScoreColor(data.matchScore);
  const matchingSkills = data.skillsMatch?.matching?.slice(0, 2) || [];

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 select-none
        bg-white dark:bg-[#202020]
        border transition-all duration-200 ease-in-out
        ${selected 
          ? 'border-purple-500 ring-2 ring-purple-500/20 dark:ring-purple-500/10' 
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
        }
        rounded-xl overflow-hidden
        ${compact ? 'p-2' : 'p-3 pr-4'}
        shadow-sm hover:shadow-md
      `}
    >
      {/* Left: Score Box */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${scoreColors.bg} ${scoreColors.border} border flex flex-col items-center justify-center`}>
        <span className={`text-xs font-bold ${scoreColors.text}`}>{data.matchScore}</span>
        <span className={`text-[8px] font-medium uppercase opacity-70 ${scoreColors.text}`}>Match</span>
      </div>

      {/* Middle: Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {data.jobTitle}
          </h3>
          {matchingSkills.length > 0 && (
            <div className="flex items-center gap-1 opacity-60">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {matchingSkills.length} matched
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1 truncate opacity-80">
            <Building2 className="w-3 h-3" />
            {data.company}
          </span>
          {data.date && (
            <span className="flex items-center gap-1 truncate opacity-80">
              <BarChart3 className="w-3 h-3" />
              {formatDate(data.date)}
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

export type { CVAnalysisData };

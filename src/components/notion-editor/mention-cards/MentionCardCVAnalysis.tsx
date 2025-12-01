import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Building2,
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { CompanyLogo } from '../../common/CompanyLogo';

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
      {/* Left: Company Logo */}
      <div className="flex-shrink-0">
        <CompanyLogo 
          companyName={data.company} 
          size="lg" 
          className="rounded-lg shadow-sm border border-gray-100 dark:border-gray-700" 
        />
      </div>

      {/* Middle: Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {data.jobTitle}
          </h3>
          {/* Score Badge */}
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${scoreColors.bg} ${scoreColors.border} ${scoreColors.text}`}>
            <span className="text-[10px] font-bold">{data.matchScore}% Match</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {matchingSkills.length > 0 && (
            <span className="flex items-center gap-1 truncate opacity-80">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              {matchingSkills.length} skills matched
            </span>
          )}
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

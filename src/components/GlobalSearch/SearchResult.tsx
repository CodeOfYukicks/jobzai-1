import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  FileText,
  BarChart3,
  Calendar,
  UserCircle,
  LayoutDashboard,
  Send,
  Mic,
  FileSearch,
  Mail,
  User,
  Settings,
  CreditCard,
  ArrowRight,
  Clock,
  StickyNote,
  Palette,
  FileIcon,
} from 'lucide-react';
import { GlobalSearchResult, getTypeLabel, getTypeColor } from '../../lib/globalSearchService';

interface SearchResultProps {
  result: GlobalSearchResult;
  isSelected: boolean;
  query: string;
  onClick: () => void;
  onMouseEnter: () => void;
}

// Icon mapping
const getIcon = (iconName?: string, type?: string) => {
  const iconClass = "w-4 h-4";
  
  switch (iconName || type) {
    case 'briefcase':
    case 'job-application':
      return <Briefcase className={iconClass} />;
    case 'file-text':
    case 'resume':
      return <FileText className={iconClass} />;
    case 'bar-chart-3':
    case 'cv-analysis':
      return <BarChart3 className={iconClass} />;
    case 'calendar':
    case 'interview':
      return <Calendar className={iconClass} />;
    case 'user-circle':
    case 'campaign':
      return <UserCircle className={iconClass} />;
    case 'layout-dashboard':
      return <LayoutDashboard className={iconClass} />;
    case 'kanban':
      return <Briefcase className={iconClass} />;
    case 'send':
      return <Send className={iconClass} />;
    case 'mic':
      return <Mic className={iconClass} />;
    case 'file-search':
      return <FileSearch className={iconClass} />;
    case 'mail':
      return <Mail className={iconClass} />;
    case 'user':
      return <User className={iconClass} />;
    case 'settings':
      return <Settings className={iconClass} />;
    case 'credit-card':
      return <CreditCard className={iconClass} />;
    case 'sticky-note':
    case 'note':
      return <StickyNote className={iconClass} />;
    case 'palette':
    case 'whiteboard':
      return <Palette className={iconClass} />;
    case 'file-pdf':
    case 'document':
      return <FileIcon className={iconClass} />;
    default:
      return <FileText className={iconClass} />;
  }
};

// Highlight matching text
const HighlightedText = memo(({ text, query }: { text: string; query: string }) => {
  if (!query || !text) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-[#635BFF]/20 text-[#635BFF] dark:bg-[#635BFF]/30 dark:text-[#a5a0ff] rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
});

HighlightedText.displayName = 'HighlightedText';

// Status badge component
const StatusBadge = memo(({ status }: { status?: string }) => {
  if (!status) return null;
  
  const statusColors: Record<string, string> = {
    applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    interview: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    wishlist: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    pending_decision: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };
  
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${colorClass}`}>
      {label}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Score badge for CV analyses
const ScoreBadge = memo(({ score }: { score?: number }) => {
  if (score === undefined) return null;
  
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (s >= 60) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };
  
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${getScoreColor(score)}`}>
      {score}%
    </span>
  );
});

ScoreBadge.displayName = 'ScoreBadge';

function SearchResultComponent({ result, isSelected, query, onClick, onMouseEnter }: SearchResultProps) {
  const typeColor = useMemo(() => getTypeColor(result.type), [result.type]);
  const typeLabel = useMemo(() => getTypeLabel(result.type), [result.type]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        group flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg mx-2
        transition-all duration-150
        ${isSelected 
          ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20' 
          : 'hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50'
        }
      `}
    >
      {/* Icon */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
        transition-colors duration-150
        ${isSelected ? 'bg-[#635BFF] text-white' : typeColor}
      `}>
        {getIcon(result.icon, result.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`
            text-sm font-medium truncate
            ${isSelected ? 'text-[#635BFF] dark:text-[#a5a0ff]' : 'text-gray-900 dark:text-gray-100'}
          `}>
            <HighlightedText text={result.title} query={query} />
          </span>
          <StatusBadge status={result.status} />
          <ScoreBadge score={result.score} />
        </div>
        
        {result.subtitle && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              <HighlightedText text={result.subtitle} query={query} />
            </span>
            {result.date && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <Clock className="w-3 h-3" />
                  {result.date}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Type label & arrow */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`
          text-[10px] font-medium uppercase tracking-wide
          ${isSelected ? 'text-[#635BFF] dark:text-[#a5a0ff]' : 'text-gray-400 dark:text-gray-500'}
        `}>
          {typeLabel}
        </span>
        <ArrowRight className={`
          w-3.5 h-3.5 transition-all duration-150
          ${isSelected 
            ? 'text-[#635BFF] dark:text-[#a5a0ff] translate-x-0 opacity-100' 
            : 'text-gray-300 dark:text-gray-600 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
          }
        `} />
      </div>
    </motion.div>
  );
}

export const SearchResult = memo(SearchResultComponent);
export default SearchResult;


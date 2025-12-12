import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  ChevronDown, 
  RefreshCw, 
  FolderKanban,
  Check
} from 'lucide-react';
import { PeriodFilter } from '../../hooks/useDashboardData';
import { KanbanBoard } from '../../types/job';

interface DashboardFiltersProps {
  periodFilter: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  boardFilter: string | null;
  onBoardChange: (boardId: string | null) => void;
  boards: KanbanBoard[];
  onRefresh: () => void;
  isRefreshing: boolean;
  lastRefresh: Date | null;
}

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
  { value: 'all', label: 'All time' },
];

export function DashboardFilters({
  periodFilter,
  onPeriodChange,
  boardFilter,
  onBoardChange,
  boards,
  onRefresh,
  isRefreshing,
  lastRefresh,
}: DashboardFiltersProps) {
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  
  const periodRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setIsPeriodOpen(false);
      }
      if (boardRef.current && !boardRef.current.contains(event.target as Node)) {
        setIsBoardOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const currentPeriod = PERIOD_OPTIONS.find(p => p.value === periodFilter);
  const currentBoard = boards.find(b => b.id === boardFilter);
  
  const formatLastRefresh = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };
  
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Period Filter */}
      <div ref={periodRef} className="relative">
        <button
          onClick={() => setIsPeriodOpen(!isPeriodOpen)}
          className="flex items-center gap-2 px-3 py-2 
            bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-lg
            text-sm font-medium text-foreground
            hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors duration-200"
        >
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{currentPeriod?.label || 'All time'}</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 
            ${isPeriodOpen ? 'rotate-180' : ''}`} 
          />
        </button>
        
        <AnimatePresence>
          {isPeriodOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1 w-40 
                bg-white dark:bg-[#1f1f23] border border-gray-200/60 dark:border-white/[0.08] rounded-xl shadow-lg
                py-1 overflow-hidden"
            >
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onPeriodChange(option.value);
                    setIsPeriodOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm
                    transition-colors duration-150
                    ${periodFilter === option.value 
                      ? 'bg-jobzai-50 dark:bg-jobzai-950/30 text-jobzai-600 dark:text-jobzai-400' 
                      : 'text-foreground hover:bg-muted/50'
                    }`}
                >
                  <span>{option.label}</span>
                  {periodFilter === option.value && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Board Filter */}
      {boards.length > 0 && (
        <div ref={boardRef} className="relative">
          <button
            onClick={() => setIsBoardOpen(!isBoardOpen)}
            className="flex items-center gap-2 px-3 py-2 
              bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-lg
              text-sm font-medium text-foreground
              hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors duration-200"
          >
            <FolderKanban className="w-4 h-4 text-muted-foreground" />
            <span>{currentBoard?.name || 'All Boards'}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 
              ${isBoardOpen ? 'rotate-180' : ''}`} 
            />
          </button>
          
          <AnimatePresence>
            {isBoardOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 mt-1 w-48 
                  bg-white dark:bg-[#1f1f23] border border-gray-200/60 dark:border-white/[0.08] rounded-xl shadow-lg
                  py-1 overflow-hidden"
              >
                <button
                  onClick={() => {
                    onBoardChange(null);
                    setIsBoardOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm
                    transition-colors duration-150
                    ${!boardFilter 
                      ? 'bg-jobzai-50 dark:bg-jobzai-950/30 text-jobzai-600 dark:text-jobzai-400' 
                      : 'text-foreground hover:bg-muted/50'
                    }`}
                >
                  <span>All Boards</span>
                  {!boardFilter && <Check className="w-4 h-4" />}
                </button>
                
                <div className="h-px bg-border my-1" />
                
                {boards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => {
                      onBoardChange(board.id);
                      setIsBoardOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm
                      transition-colors duration-150
                      ${boardFilter === board.id 
                        ? 'bg-jobzai-50 dark:bg-jobzai-950/30 text-jobzai-600 dark:text-jobzai-400' 
                        : 'text-foreground hover:bg-muted/50'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {board.icon && <span>{board.icon}</span>}
                      <span className="truncate">{board.name}</span>
                    </div>
                    {boardFilter === board.id && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Refresh Button */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Updated {formatLastRefresh(lastRefresh)}
        </span>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 
            bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-lg
            text-sm font-medium text-foreground
            hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-50
            transition-all duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>
  );
}

export default DashboardFilters;


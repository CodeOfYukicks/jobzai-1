import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  ChevronDown, 
  RefreshCw, 
  FolderKanban,
  Zap,
  Check
} from 'lucide-react';
import { PeriodFilter } from '../../hooks/useDashboardData';
import { KanbanBoard } from '../../types/job';

interface Campaign {
  id: string;
  name?: string;
}

interface DashboardFiltersProps {
  periodFilter: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  boardFilter: string | null;
  onBoardChange: (boardId: string | null) => void;
  boards: KanbanBoard[];
  campaignFilter: string | null;
  onCampaignChange: (campaignId: string | null) => void;
  campaigns: Campaign[];
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
  campaignFilter,
  onCampaignChange,
  campaigns,
  onRefresh,
  isRefreshing,
  lastRefresh,
}: DashboardFiltersProps) {
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  
  const periodRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const campaignRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setIsPeriodOpen(false);
      }
      if (boardRef.current && !boardRef.current.contains(event.target as Node)) {
        setIsBoardOpen(false);
      }
      if (campaignRef.current && !campaignRef.current.contains(event.target as Node)) {
        setIsCampaignOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const currentPeriod = PERIOD_OPTIONS.find(p => p.value === periodFilter);
  const currentBoard = boards.find(b => b.id === boardFilter);
  const currentCampaign = campaigns.find(c => c.id === campaignFilter);
  
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
    <div className="flex items-center gap-2 flex-wrap">
      {/* Period Filter */}
      <div ref={periodRef} className="relative">
        <button
          onClick={() => setIsPeriodOpen(!isPeriodOpen)}
          className="flex items-center gap-2 px-3 py-2 
            bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-lg
            text-[13px] font-medium text-gray-700 dark:text-gray-200
            hover:border-gray-300 dark:hover:border-[#4a494b] transition-all duration-200"
        >
          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
          <span>{currentPeriod?.label || 'All time'}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 
            ${isPeriodOpen ? 'rotate-180' : ''}`} 
          />
        </button>
        
        <AnimatePresence>
          {isPeriodOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1.5 w-36 
                bg-white dark:bg-[#333234] border border-gray-200/60 dark:border-[#3d3c3e] rounded-xl shadow-lg shadow-black/5 dark:shadow-black/30
                py-1 overflow-hidden"
            >
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onPeriodChange(option.value);
                    setIsPeriodOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[13px]
                    transition-colors duration-150
                    ${periodFilter === option.value 
                      ? 'bg-gray-50 dark:bg-[#3d3c3e] text-gray-900 dark:text-gray-100 font-medium' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/70'
                    }`}
                >
                  <span>{option.label}</span>
                  {periodFilter === option.value && (
                    <Check className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
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
              bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-lg
              text-[13px] font-medium text-gray-700 dark:text-gray-200
              hover:border-gray-300 dark:hover:border-[#4a494b] transition-all duration-200"
          >
            <FolderKanban className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
            <span>{currentBoard?.name || 'All Boards'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 
              ${isBoardOpen ? 'rotate-180' : ''}`} 
            />
          </button>
          
          <AnimatePresence>
            {isBoardOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 mt-1.5 w-44 
                  bg-white dark:bg-[#333234] border border-gray-200/60 dark:border-[#3d3c3e] rounded-xl shadow-lg shadow-black/5 dark:shadow-black/30
                  py-1 overflow-hidden"
              >
                <button
                  onClick={() => {
                    onBoardChange(null);
                    setIsBoardOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[13px]
                    transition-colors duration-150
                    ${!boardFilter 
                      ? 'bg-gray-50 dark:bg-[#3d3c3e] text-gray-900 dark:text-gray-100 font-medium' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/70'
                    }`}
                >
                  <span>All Boards</span>
                  {!boardFilter && <Check className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />}
                </button>
                
                <div className="h-px bg-gray-100 dark:bg-[#3d3c3e]/40 my-1" />
                
                {boards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => {
                      onBoardChange(board.id);
                      setIsBoardOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[13px]
                      transition-colors duration-150
                      ${boardFilter === board.id 
                        ? 'bg-gray-50 dark:bg-[#3d3c3e] text-gray-900 dark:text-gray-100 font-medium' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/70'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {board.icon && <span className="text-sm">{board.icon}</span>}
                      <span className="truncate">{board.name}</span>
                    </div>
                    {boardFilter === board.id && <Check className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Campaign Filter */}
      {campaigns.length > 0 && (
        <div ref={campaignRef} className="relative">
          <button
            onClick={() => setIsCampaignOpen(!isCampaignOpen)}
            className="flex items-center gap-2 px-3 py-2 
              bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-lg
              text-[13px] font-medium text-gray-700 dark:text-gray-200
              hover:border-gray-300 dark:hover:border-[#4a494b] transition-all duration-200"
          >
            <Zap className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
            <span>{currentCampaign?.name || 'All Campaigns'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 
              ${isCampaignOpen ? 'rotate-180' : ''}`} 
            />
          </button>
          
          <AnimatePresence>
            {isCampaignOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 mt-1.5 w-44 
                  bg-white dark:bg-[#333234] border border-gray-200/60 dark:border-[#3d3c3e] rounded-xl shadow-lg shadow-black/5 dark:shadow-black/30
                  py-1 overflow-hidden"
              >
                <button
                  onClick={() => {
                    onCampaignChange(null);
                    setIsCampaignOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[13px]
                    transition-colors duration-150
                    ${!campaignFilter 
                      ? 'bg-gray-50 dark:bg-[#3d3c3e] text-gray-900 dark:text-gray-100 font-medium' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/70'
                    }`}
                >
                  <span>All Campaigns</span>
                  {!campaignFilter && <Check className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />}
                </button>
                
                <div className="h-px bg-gray-100 dark:bg-[#3d3c3e]/40 my-1" />
                
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => {
                      onCampaignChange(campaign.id);
                      setIsCampaignOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[13px]
                      transition-colors duration-150
                      ${campaignFilter === campaign.id 
                        ? 'bg-gray-50 dark:bg-[#3d3c3e] text-gray-900 dark:text-gray-100 font-medium' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/70'
                      }`}
                  >
                    <span className="truncate">{campaign.name || `Campaign ${campaign.id.slice(0, 8)}`}</span>
                    {campaignFilter === campaign.id && <Check className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Refresh Button */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline tabular-nums">
          {formatLastRefresh(lastRefresh)}
        </span>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-2.5 py-2 
            text-gray-500 dark:text-gray-400
            hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/70 
            rounded-lg disabled:opacity-50
            transition-all duration-200"
        >
          <RefreshCw className={`w-4 h-4 stroke-[1.5] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-[13px] font-medium">Refresh</span>
        </button>
      </div>
    </div>
  );
}

export default DashboardFilters;

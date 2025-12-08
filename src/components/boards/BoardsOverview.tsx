import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Copy,
  ArrowUpRight,
  Briefcase,
  Send
} from 'lucide-react';
import { KanbanBoard, JobApplication, BOARD_COLORS, BOARD_TYPE_COLUMNS, JOB_COLUMN_LABELS, CAMPAIGN_COLUMN_LABELS } from '../../types/job';

interface BoardsOverviewProps {
  boards: KanbanBoard[];
  applications: JobApplication[];
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: () => void;
  onEditBoard: (board: KanbanBoard) => void;
  onDeleteBoard: (board: KanbanBoard) => void;
  onDuplicateBoard: (board: KanbanBoard) => void;
}

interface BoardStats {
  total: number;
  [key: string]: number;
}

export default function BoardsOverview({
  boards,
  applications,
  onSelectBoard,
  onCreateBoard,
  onEditBoard,
  onDeleteBoard,
  onDuplicateBoard,
}: BoardsOverviewProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getBoardStats = (board: KanbanBoard): BoardStats => {
    const boardApps = applications.filter(app => {
      const defaultBoard = boards.find(b => b.isDefault);
      if (!app.boardId) {
        return defaultBoard?.id === board.id;
      }
      return app.boardId === board.id;
    });

    const boardType = board.boardType || 'jobs';
    const columns = BOARD_TYPE_COLUMNS[boardType];
    
    const stats: BoardStats = { total: boardApps.length };
    columns.forEach(col => {
      stats[col] = boardApps.filter(a => a.status === col).length;
    });
    
    return stats;
  };

  const getBoardColor = (board: KanbanBoard) => {
    return board.color || BOARD_COLORS[0];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {/* Compact Premium Boards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {boards.map((board, index) => {
          const stats = getBoardStats(board);
          const boardType = board.boardType || 'jobs';
          const columnLabels = boardType === 'jobs' ? JOB_COLUMN_LABELS : CAMPAIGN_COLUMN_LABELS;
          const color = getBoardColor(board);
          const isHovered = hoveredId === board.id;

          return (
            <motion.div
              key={board.id}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.05,
                type: "spring",
                stiffness: 120,
                damping: 18
              }}
              onMouseEnter={() => setHoveredId(board.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectBoard(board.id)}
              className="group relative cursor-pointer"
            >
              {/* Subtle glow effect on hover */}
              <div 
                className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur-lg"
                style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)` }}
              />
              
              {/* Main Card - Compact */}
              <div className="relative h-full bg-white/90 dark:bg-[#2b2a2c]/80 backdrop-blur-md rounded-2xl border border-gray-200/80 dark:border-[#3d3c3e]/60 shadow-sm hover:shadow-xl dark:shadow-black/20 hover:border-gray-300 dark:hover:border-[#4a494b] transition-all duration-300">
                
                {/* Compact Cover Section */}
                <div className="relative h-16 overflow-hidden rounded-t-2xl">
                  {board.coverPhoto ? (
                    <>
                      <motion.img 
                        src={board.coverPhoto} 
                        alt={`${board.name} cover`}
                        className="w-full h-full object-cover"
                        animate={{ scale: isHovered ? 1.05 : 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </>
                  ) : (
                    <div 
                      className="w-full h-full"
                      style={{ 
                        background: `linear-gradient(135deg, ${color}25 0%, ${color}08 100%)`,
                      }}
                    />
                  )}
                </div>

                {/* Menu Button - Outside cover to avoid clipping */}
                <div className="absolute top-2 right-2 z-30">
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered || openMenuId === board.id ? 1 : 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === board.id ? null : board.id);
                    }}
                    className="p-1.5 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-white" />
                  </motion.button>

                  <AnimatePresence>
                    {openMenuId === board.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-200 dark:border-[#3d3c3e] shadow-xl z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-1">
                          <button
                            onClick={() => {
                              onEditBoard(board);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 opacity-60" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              onDuplicateBoard(board);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5 opacity-60" />
                            Duplicate
                          </button>
                          {!board.isDefault && (
                            <>
                              <div className="my-1 h-px bg-gray-200 dark:bg-[#3d3c3e]" />
                              <button
                                onClick={() => {
                                  onDeleteBoard(board);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 opacity-60" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Floating Icon - Outside cover to avoid clipping */}
                <motion.div 
                  className="absolute top-12 left-3 z-20 w-9 h-9 rounded-xl flex items-center justify-center text-base shadow-md ring-2 ring-white dark:ring-[#242325]"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
                  animate={{ y: isHovered ? -2 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span>{board.icon || '📋'}</span>
                </motion.div>

                {/* Content - Compact */}
                <div className="px-3 pt-6 pb-3">
                  {/* Title Row */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate flex-1">
                      {board.name}
                    </h3>
                    {/* Type Badge - Minimal */}
                    <span className={`flex-shrink-0 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                      boardType === 'campaigns'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {boardType === 'campaigns' ? (
                        <Send className="w-2 h-2" />
                      ) : (
                        <Briefcase className="w-2 h-2" />
                      )}
                    </span>
                    {board.isDefault && (
                      <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                        Default
                      </span>
                    )}
                  </div>

                  {/* Stats Row - Inline Compact */}
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{stats.total}</span>
                    <span>total</span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    {(boardType === 'jobs' ? [
                      { key: 'interview', label: 'interviews' },
                      { key: 'offer', label: 'offers' },
                    ] : [
                      { key: 'replied', label: 'replied' },
                      { key: 'opportunity', label: 'opportunities' },
                    ]).map((stat, i) => (
                      <span key={stat.key} className="flex items-center gap-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{stats[stat.key] || 0}</span>
                        <span>{stat.label}</span>
                        {i === 0 && <span className="text-gray-300 dark:text-gray-600 ml-1">•</span>}
                      </span>
                    ))}
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="flex gap-0.5 h-1 rounded-full overflow-hidden bg-gray-100 dark:bg-[#2b2a2c]">
                    {(boardType === 'jobs' ? [
                      { key: 'wishlist', color: '#8B5CF6' },
                      { key: 'applied', color: '#3B82F6' },
                      { key: 'interview', color: '#6366F1' },
                      { key: 'offer', color: '#10B981' },
                      { key: 'rejected', color: '#EF4444' },
                    ] : [
                      { key: 'targets', color: '#8B5CF6' },
                      { key: 'contacted', color: '#3B82F6' },
                      { key: 'replied', color: '#06B6D4' },
                      { key: 'meeting', color: '#6366F1' },
                      { key: 'opportunity', color: '#10B981' },
                    ]).map((segment) => {
                      const count = stats[segment.key] || 0;
                      const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                      if (percentage === 0) return null;
                      return (
                        <div
                          key={segment.key}
                          className="h-full rounded-full"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: segment.color,
                            minWidth: count > 0 ? '4px' : 0
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Hover Arrow */}
                  <motion.div
                    className="absolute bottom-3 right-3"
                    animate={{ 
                      x: isHovered ? 0 : -5,
                      opacity: isHovered ? 1 : 0 
                    }}
                    transition={{ duration: 0.15 }}
                  >
                    <ArrowUpRight className="w-4 h-4" style={{ color }} />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Create New Board Card - Compact */}
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            delay: boards.length * 0.05,
            type: "spring",
            stiffness: 120,
            damping: 18
          }}
          onClick={onCreateBoard}
          className="group relative h-full min-h-[140px]"
        >
          <div className="h-full bg-gray-50 dark:bg-[#2b2a2c]/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#3d3c3e] hover:border-[#635BFF] dark:hover:border-[#635BFF] hover:bg-[#635BFF]/5 dark:hover:bg-[#635BFF]/10 transition-all duration-300 flex flex-col items-center justify-center p-4">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-[#3d3c3e] flex items-center justify-center mb-2 group-hover:bg-[#635BFF]/20 transition-all duration-200"
              whileHover={{ scale: 1.05, rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <Plus className="w-5 h-5 text-gray-400 group-hover:text-[#635BFF] transition-colors duration-200" />
            </motion.div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-[#635BFF] transition-colors duration-200">
              New Board
            </span>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}

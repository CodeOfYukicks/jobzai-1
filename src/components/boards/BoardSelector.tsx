import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Plus, 
  LayoutGrid, 
  Check,
  Folder
} from 'lucide-react';
import { KanbanBoard, BOARD_COLORS } from '../../types/job';

interface BoardSelectorProps {
  boards: KanbanBoard[];
  currentBoardId: string | null;
  onSelectBoard: (boardId: string | null) => void;
  onCreateBoard: () => void;
  onViewAllBoards: () => void;
}

export default function BoardSelector({
  boards,
  currentBoardId,
  onSelectBoard,
  onCreateBoard,
  onViewAllBoards,
}: BoardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentBoard = boards.find(b => b.id === currentBoardId) || boards.find(b => b.isDefault);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBoardColor = (board: KanbanBoard) => {
    return board.color || BOARD_COLORS[0];
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] hover:border-[#635BFF]/50 dark:hover:border-[#635BFF]/50 transition-all shadow-sm hover:shadow-md group"
      >
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: currentBoard ? getBoardColor(currentBoard) : BOARD_COLORS[0] }}
        />
        <span className="font-medium text-gray-800 dark:text-gray-200 max-w-[150px] truncate">
          {currentBoard?.icon && <span className="mr-1.5">{currentBoard.icon}</span>}
          {currentBoard?.name || 'All Applications'}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-200 dark:border-[#3d3c3e] shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-gray-100 dark:border-[#3d3c3e]">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Your Boards
              </p>
            </div>

            {/* Board List */}
            <div className="max-h-[280px] overflow-y-auto py-1">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => {
                    onSelectBoard(board.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60 transition-colors ${
                    currentBoardId === board.id ? 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10' : ''
                  }`}
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getBoardColor(board) }}
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {board.icon && <span className="mr-1.5">{board.icon}</span>}
                      {board.name}
                    </p>
                    {board.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {board.description}
                      </p>
                    )}
                  </div>
                  {currentBoardId === board.id && (
                    <Check className="w-4 h-4 text-[#635BFF] flex-shrink-0" />
                  )}
                  {board.isDefault && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#3d3c3e] text-gray-500 dark:text-gray-400 flex-shrink-0">
                      Default
                    </span>
                  )}
                </button>
              ))}

              {boards.length === 0 && (
                <div className="px-3 py-6 text-center">
                  <Folder className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No boards yet</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 dark:border-[#3d3c3e] p-1.5">
              <button
                onClick={() => {
                  onViewAllBoards();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60 transition-colors text-gray-600 dark:text-gray-300"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm font-medium">View All Boards</span>
              </button>
              <button
                onClick={() => {
                  onCreateBoard();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#635BFF]/10 transition-colors text-[#635BFF]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Create New Board</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


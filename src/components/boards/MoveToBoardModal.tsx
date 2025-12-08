import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowRight,
  Loader2,
  Folder
} from 'lucide-react';
import { KanbanBoard, BOARD_COLORS } from '../../types/job';

interface MoveToBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (boardId: string) => Promise<void>;
  boards: KanbanBoard[];
  currentBoardId: string | null;
  applicationName: string;
}

export default function MoveToBoardModal({
  isOpen,
  onClose,
  onMove,
  boards,
  currentBoardId,
  applicationName,
}: MoveToBoardModalProps) {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = async () => {
    if (!selectedBoardId || selectedBoardId === currentBoardId) return;

    setIsMoving(true);
    try {
      await onMove(selectedBoardId);
      onClose();
    } catch (error) {
      console.error('Error moving application:', error);
    } finally {
      setIsMoving(false);
    }
  };

  const currentBoard = boards.find(b => b.id === currentBoardId);
  const otherBoards = boards.filter(b => b.id !== currentBoardId);

  const getBoardColor = (board: KanbanBoard) => {
    return board.color || BOARD_COLORS[0];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Move to Board
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[280px]">
                {applicationName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Current Board */}
            {currentBoard && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Current Board
                </p>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: getBoardColor(currentBoard) }}
                  >
                    {currentBoard.icon || currentBoard.name.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {currentBoard.name}
                  </span>
                </div>
              </div>
            )}

            {/* Arrow */}
            <div className="flex justify-center my-2">
              <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
            </div>

            {/* Destination Boards */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Move to
              </p>
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {otherBoards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => setSelectedBoardId(board.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      selectedBoardId === board.id
                        ? 'border-[#635BFF] bg-[#635BFF]/5'
                        : 'border-transparent bg-gray-50 dark:bg-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: getBoardColor(board) }}
                    >
                      {board.icon || board.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        {board.name}
                      </p>
                      {board.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {board.description}
                        </p>
                      )}
                    </div>
                    {board.isDefault && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                        Default
                      </span>
                    )}
                  </button>
                ))}

                {otherBoards.length === 0 && (
                  <div className="text-center py-8">
                    <Folder className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No other boards available
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Create a new board first
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              disabled={!selectedBoardId || selectedBoardId === currentBoardId || isMoving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#635BFF] to-[#7c75ff] text-white font-medium hover:from-[#5850e6] hover:to-[#6b64e6] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isMoving && <Loader2 className="w-4 h-4 animate-spin" />}
              Move Application
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


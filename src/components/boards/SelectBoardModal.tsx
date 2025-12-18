import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Loader2,
  Folder,
  Briefcase,
  Heart
} from 'lucide-react';
import { KanbanBoard, BOARD_COLORS } from '../../types/job';

interface SelectBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (boardId: string) => void;
  boards: KanbanBoard[];
  jobTitle: string;
  companyName: string;
  isLoading?: boolean;
}

export default function SelectBoardModal({
  isOpen,
  onClose,
  onSelect,
  boards,
  jobTitle,
  companyName,
  isLoading = false,
}: SelectBoardModalProps) {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedBoardId) return;
    onSelect(selectedBoardId);
  };

  const getBoardColor = (board: KanbanBoard) => {
    return board.color || BOARD_COLORS[0];
  };

  // Reset selection when modal opens
  const handleClose = () => {
    setSelectedBoardId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#2b2a2c] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#3d3c3e]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add to Wishlist
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[250px]">
                  {jobTitle} at {companyName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select which board you'd like to add this job to:
            </p>

            {/* Board List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => setSelectedBoardId(board.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    selectedBoardId === board.id
                      ? 'border-[#635BFF] bg-[#635BFF]/5'
                      : 'border-transparent bg-gray-50 dark:bg-[#3d3c3e]/50 hover:border-gray-200 dark:hover:border-[#4a494b]'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: getBoardColor(board) }}
                  >
                    {board.icon || <Briefcase className="w-5 h-5" />}
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
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#4a494b] text-gray-500 dark:text-gray-400">
                      Default
                    </span>
                  )}
                </button>
              ))}

              {boards.length === 0 && (
                <div className="text-center py-8">
                  <Folder className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No boards available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#2b2a2c]/50">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedBoardId || isLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Heart className="w-4 h-4" />
              Add to Wishlist
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}









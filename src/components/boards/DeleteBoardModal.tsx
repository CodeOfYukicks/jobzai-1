import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trash2,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Check,
  ArrowRight
} from 'lucide-react';
import { KanbanBoard } from '../../types/job';

interface DeleteBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (targetBoardId?: string) => Promise<void>;
  board: KanbanBoard | null;
  boards: KanbanBoard[];
}

export default function DeleteBoardModal({
  isOpen,
  onClose,
  onDelete,
  board,
  boards,
}: DeleteBoardModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [transferApplications, setTransferApplications] = useState(false);
  const [selectedTargetBoardId, setSelectedTargetBoardId] = useState<string | null>(null);
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the board type (default to 'jobs' for backwards compatibility)
  const currentBoardType = board?.boardType || 'jobs';

  // Get compatible boards (same type, not the current board)
  const compatibleBoards = boards.filter(b => 
    b.id !== board?.id && 
    (b.boardType || 'jobs') === currentBoardType
  );

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTransferApplications(false);
      setSelectedTargetBoardId(null);
      setShowBoardDropdown(false);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBoardDropdown(false);
      }
    };

    if (showBoardDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBoardDropdown]);

  // Get selected board for display
  const selectedTargetBoard = selectedTargetBoardId 
    ? boards.find(b => b.id === selectedTargetBoardId) 
    : null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // If transfer is enabled and a board is selected, pass the target board ID
      // Otherwise, applications will be deleted with the board
      const targetId = transferApplications && selectedTargetBoardId 
        ? selectedTargetBoardId 
        : undefined;
      await onDelete(targetId);
      onClose();
    } catch (error) {
      console.error('Error deleting board:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !board) return null;

  const boardTypeLabel = currentBoardType === 'jobs' ? 'Job Applications' : 'Outreach Campaigns';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isDeleting) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white dark:bg-[#1a191b] rounded-2xl shadow-2xl w-full max-w-md overflow-visible border border-gray-200/20 dark:border-white/5"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
          }}
        >
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-gray-100/50 dark:border-white/5">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Board
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  This action cannot be undone
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4 overflow-visible">
            {/* Board Preview */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/[0.04] flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: board.color || '#635BFF' }}
              >
                {board.icon || '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {board.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {boardTypeLabel}
                </p>
              </div>
            </div>

            {/* Warning Message - Default behavior */}
            {!transferApplications && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                <div className="flex items-start gap-2">
                  <Trash2 className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300">
                    All applications in this board will be <span className="font-semibold">permanently deleted</span>.
                  </p>
                </div>
              </div>
            )}

            {/* Transfer Question */}
            {compatibleBoards.length > 0 && (
              <div className="space-y-3 overflow-visible">
                <label 
                  className="flex items-start gap-3 cursor-pointer group"
                  onClick={() => {
                    setTransferApplications(!transferApplications);
                    if (transferApplications) {
                      setSelectedTargetBoardId(null);
                    }
                  }}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
                    transferApplications 
                      ? 'bg-[#635BFF] border-[#635BFF]' 
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-[#635BFF]/50'
                  }`}>
                    {transferApplications && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Transfer applications to another board instead?
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Move them to another {currentBoardType === 'jobs' ? 'job applications' : 'outreach campaigns'} board
                    </p>
                  </div>
                </label>

                {/* Board Selector */}
                <AnimatePresence>
                  {transferApplications && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-visible"
                    >
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowBoardDropdown(!showBoardDropdown);
                          }}
                          className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                        >
                          {selectedTargetBoard ? (
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                                style={{ backgroundColor: selectedTargetBoard.color || '#635BFF' }}
                              >
                                {selectedTargetBoard.icon || '📋'}
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {selectedTargetBoard.name}
                                </p>
                                {selectedTargetBoard.isDefault && (
                                  <p className="text-xs text-gray-500">Default board</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Select a board...
                            </span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showBoardDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown */}
                        {showBoardDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#242325] shadow-xl z-50 max-h-48 overflow-y-auto">
                            {compatibleBoards.map((targetBoard) => (
                              <button
                                key={targetBoard.id}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedTargetBoardId(targetBoard.id);
                                  setShowBoardDropdown(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors ${
                                  selectedTargetBoardId === targetBoard.id ? 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10' : ''
                                }`}
                              >
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                                  style={{ backgroundColor: targetBoard.color || '#635BFF' }}
                                >
                                  {targetBoard.icon || '📋'}
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {targetBoard.name}
                                  </p>
                                  {targetBoard.isDefault && (
                                    <p className="text-xs text-gray-500">Default board</p>
                                  )}
                                </div>
                                {selectedTargetBoardId === targetBoard.id && (
                                  <Check className="w-4 h-4 text-[#635BFF]" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Transfer Info Message - Only when board is selected */}
                      {selectedTargetBoard && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50"
                        >
                          <div className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-green-700 dark:text-green-300">
                              Applications will be moved to <span className="font-semibold">"{selectedTargetBoard.name}"</span>
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100/50 dark:border-white/[0.04] bg-gray-50/30 dark:bg-white/[0.01]">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#4a494b] text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors hover:bg-gray-50 dark:hover:bg-[#3a393b] disabled:opacity-50"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDelete}
              disabled={isDeleting || (transferApplications && !selectedTargetBoardId)}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Board
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


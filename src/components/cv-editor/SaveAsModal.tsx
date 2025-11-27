import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FolderOpen, FileText, Loader2, Check } from 'lucide-react';

export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  createdAt: any;
  updatedAt: any;
}

interface SaveAsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, folderId: string | null) => Promise<void>;
  defaultName: string;
  folders: Folder[];
  isSaving: boolean;
}

export default function SaveAsModal({
  isOpen,
  onClose,
  onSave,
  defaultName,
  folders,
  isSaving
}: SaveAsModalProps) {
  const [name, setName] = useState(defaultName);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setSelectedFolderId(null);
      // Focus input after a short delay to allow animation
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, defaultName]);

  const handleSave = async () => {
    if (!name.trim() || isSaving) return;
    await onSave(name.trim(), selectedFolderId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && !isSaving) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isSaving && onClose()}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Save className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Save to Library
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Save this tailored CV to your resume library
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSaving}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-5">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resume Name
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., Software Engineer @ Google"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                    rounded-xl focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500
                    text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                    transition-all text-sm"
                  disabled={isSaving}
                />
              </div>

              {/* Folder Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Save to Folder
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 p-2">
                  {/* Uncategorized Option */}
                  <button
                    onClick={() => setSelectedFolderId(null)}
                    disabled={isSaving}
                    className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-left
                      ${selectedFolderId === null
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                      disabled:opacity-50`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <span className="flex-1 text-sm font-medium">Uncategorized</span>
                    {selectedFolderId === null && (
                      <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    )}
                  </button>

                  {/* Folder Options */}
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      disabled={isSaving}
                      className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-left
                        ${selectedFolderId === folder.id
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }
                        disabled:opacity-50`}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${folder.color}20` }}
                      >
                        {folder.icon}
                      </div>
                      <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>
                      {selectedFolderId === folder.id && (
                        <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </button>
                  ))}

                  {folders.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">
                      No folders yet. Create folders in the Resume Builder.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors
                  disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || isSaving}
                className="px-5 py-2.5 text-sm font-semibold text-white 
                  bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700
                  rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save to Library
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


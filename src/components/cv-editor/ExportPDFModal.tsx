import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FolderOpen, FileText, Loader2, Check, Upload, HardDrive } from 'lucide-react';

export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  createdAt: any;
  updatedAt: any;
}

type ExportMode = 'download' | 'library';

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => Promise<void>;
  onSaveToLibrary: (fileName: string, folderId: string | null) => Promise<void>;
  defaultFileName: string;
  folders: Folder[];
  isExporting: boolean;
}

export default function ExportPDFModal({
  isOpen,
  onClose,
  onDownload,
  onSaveToLibrary,
  defaultFileName,
  folders,
  isExporting
}: ExportPDFModalProps) {
  const [exportMode, setExportMode] = useState<ExportMode>('download');
  const [fileName, setFileName] = useState(defaultFileName);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExportMode('download');
      setFileName(defaultFileName);
      setSelectedFolderId(null);
    }
  }, [isOpen, defaultFileName]);

  // Focus input when switching to library mode
  useEffect(() => {
    if (exportMode === 'library' && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [exportMode]);

  const handleExport = async () => {
    if (isExporting) return;
    
    if (exportMode === 'download') {
      await onDownload();
    } else {
      if (!fileName.trim()) return;
      await onSaveToLibrary(fileName.trim(), selectedFolderId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isExporting) {
      if (exportMode === 'download' || fileName.trim()) {
        handleExport();
      }
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
          onClick={() => !isExporting && onClose()}
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
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Export PDF
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose where to save your CV
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isExporting}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-5">
              {/* Export Mode Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExportMode('download')}
                  disabled={isExporting}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left group
                    ${exportMode === 'download'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                      ${exportMode === 'download'
                        ? 'bg-blue-100 dark:bg-blue-800/50'
                        : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <HardDrive className={`w-5 h-5 transition-colors
                        ${exportMode === 'download'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold transition-colors
                        ${exportMode === 'download'
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Download
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Save to your device
                      </p>
                    </div>
                  </div>
                  {exportMode === 'download' && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setExportMode('library')}
                  disabled={isExporting}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left group
                    ${exportMode === 'library'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                      ${exportMode === 'library'
                        ? 'bg-purple-100 dark:bg-purple-800/50'
                        : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <Upload className={`w-5 h-5 transition-colors
                        ${exportMode === 'library'
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-500 dark:text-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold transition-colors
                        ${exportMode === 'library'
                          ? 'text-purple-700 dark:text-purple-300'
                          : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Save to Library
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Add to your documents
                      </p>
                    </div>
                  </div>
                  {exportMode === 'library' && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </div>

              {/* Library Options - Only show when library mode selected */}
              <AnimatePresence mode="wait">
                {exportMode === 'library' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* File Name Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        File Name
                      </label>
                      <input
                        ref={inputRef}
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., My_CV_2024.pdf"
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                          rounded-xl focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500
                          text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                          transition-all text-sm"
                        disabled={isExporting}
                      />
                    </div>

                    {/* Folder Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Save to Folder
                      </label>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 p-2">
                        {/* Uncategorized Option */}
                        <button
                          onClick={() => setSelectedFolderId(null)}
                          disabled={isExporting}
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
                            disabled={isExporting}
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors
                  disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={(exportMode === 'library' && !fileName.trim()) || isExporting}
                className={`px-5 py-2.5 text-sm font-semibold text-white 
                  rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2 shadow-lg hover:shadow-xl
                  ${exportMode === 'download'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-blue-500/30'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25 hover:shadow-purple-500/30'
                  }`}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {exportMode === 'download' ? 'Generating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    {exportMode === 'download' ? (
                      <>
                        <Download className="w-4 h-4" />
                        Download PDF
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Save to Library
                      </>
                    )}
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





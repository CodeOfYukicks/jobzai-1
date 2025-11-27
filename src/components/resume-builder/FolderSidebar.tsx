import { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FolderPlus, Edit2, Trash2, MoreHorizontal, Layers } from 'lucide-react';
import { Folder } from './FolderCard';

// Selected folder type: 'all' for all resumes, null for uncategorized, string for specific folder
export type SelectedFolderType = 'all' | string | null;

interface FolderSidebarProps {
  folders: Folder[];
  selectedFolderId: SelectedFolderType;
  onSelectFolder: (folderId: SelectedFolderType) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folderId: string) => void;
  onNewFolder: () => void;
  onDropResume: (resumeId: string, folderId: string | null) => void;
  folderCounts: Record<string, number>;
  uncategorizedCount: number;
  totalCount: number;
}

const COLOR_PALETTE = [
  { name: 'Purple', value: '#8B5CF6', light: '#F3E8FF', dark: '#6D28D9' },
  { name: 'Blue', value: '#3B82F6', light: '#DBEAFE', dark: '#2563EB' },
  { name: 'Green', value: '#10B981', light: '#D1FAE5', dark: '#059669' },
  { name: 'Orange', value: '#F59E0B', light: '#FEF3C7', dark: '#D97706' },
  { name: 'Pink', value: '#EC4899', light: '#FCE7F3', dark: '#DB2777' },
  { name: 'Indigo', value: '#6366F1', light: '#E0E7FF', dark: '#4F46E5' },
  { name: 'Teal', value: '#14B8A6', light: '#CCFBF1', dark: '#0D9488' },
  { name: 'Red', value: '#EF4444', light: '#FEE2E2', dark: '#DC2626' },
];

// All Resumes Item - List style
const AllResumesItem = memo(({ 
  isActive, 
  count, 
  onClick 
}: { 
  isActive: boolean; 
  count: number; 
  onClick: () => void;
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-all duration-200 group relative
        ${isActive 
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
    >
      <div className={`w-5 h-5 flex items-center justify-center`}>
        <Layers className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`} />
      </div>
      <span className="flex-1 text-left text-sm font-medium truncate">
        All Resumes
      </span>
      <span className={`text-xs font-medium ${
        isActive
          ? 'text-blue-600/70 dark:text-blue-400/70'
          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
      }`}>
        {count}
      </span>
    </motion.button>
  );
});

AllResumesItem.displayName = 'AllResumesItem';

// Folder Item with native drag/drop - List style
const FolderItem = memo(({ 
  folder, 
  isActive, 
  count, 
  onClick,
  onEdit,
  onDelete,
  onDrop
}: { 
  folder: Folder; 
  isActive: boolean; 
  count: number; 
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDrop: (resumeId: string) => void;
}) => {
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const colorData = COLOR_PALETTE.find(c => c.value === folder.color) || COLOR_PALETTE[0];

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuOpen(true);
  };

  // Native drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're actually leaving the card (not entering a child)
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setIsDraggingOver(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    
    const resumeId = e.dataTransfer.getData('application/x-resume-id') || e.dataTransfer.getData('text/plain');
    if (resumeId) {
      onDrop(resumeId);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenuOpen(false);
    if (contextMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenuOpen]);

  return (
    <>
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-all duration-200 cursor-pointer group relative
          ${isActive && !isDraggingOver
            ? `bg-[${colorData.light}]/40 text-gray-900 dark:text-white dark:bg-[${colorData.dark}]/20` 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
          ${isDraggingOver 
            ? 'ring-2 ring-inset ring-purple-500/50 bg-purple-50 dark:bg-purple-900/20' 
            : ''
          }
        `}
        style={{
            backgroundColor: isActive && !isDraggingOver ? `${colorData.light}50` : undefined
        }}
      >
        <div className="flex items-center justify-center w-5 h-5 text-lg select-none">
          {folder.icon}
        </div>

        <span className="flex-1 text-left text-sm font-medium truncate">
          {folder.name}
        </span>

        {/* Count or Drop indicator */}
        <AnimatePresence mode="wait">
          {isDraggingOver ? (
            <motion.span
              key="drop-indicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-bold text-purple-600 dark:text-purple-400"
            >
              Drop
            </motion.span>
          ) : (
            <motion.div 
                key="actions"
                className="flex items-center gap-2"
            >
                <span className={`text-xs font-medium ${
                    isActive
                    ? 'text-gray-600 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                }`}>
                    {count}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e);
                    }}
                    className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-700 ${contextMenuOpen ? 'opacity-100' : ''}`}
                >
                    <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
                </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl
              border border-gray-200 dark:border-gray-700 py-1 min-w-[140px]"
            style={{
              left: cardRef.current ? cardRef.current.getBoundingClientRect().right : 0,
              top: cardRef.current ? cardRef.current.getBoundingClientRect().top : 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuOpen(false);
                onEdit();
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300
                hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuOpen(false);
                setIsDeleteDialogOpen(true);
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Dialog */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDeleteDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-100 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 text-center">
                Delete "{folder.name}"?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 text-center">
                Resumes will be moved to Uncategorized.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                    bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                    rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setIsDeleteDialogOpen(false);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 
                    rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

FolderItem.displayName = 'FolderItem';

// Uncategorized Item with native drag/drop - List style
const UncategorizedItem = memo(({ 
  isActive, 
  count, 
  onClick,
  onDrop
}: { 
  isActive: boolean; 
  count: number; 
  onClick: () => void;
  onDrop: (resumeId: string) => void;
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);

  // Native drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setIsDraggingOver(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    
    const resumeId = e.dataTransfer.getData('application/x-resume-id') || e.dataTransfer.getData('text/plain');
    if (resumeId) {
      onDrop(resumeId);
    }
  };

  return (
    <motion.button
      ref={cardRef}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-all duration-200 group relative
        ${isActive && !isDraggingOver
          ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
        ${isDraggingOver 
          ? 'ring-2 ring-inset ring-gray-400/50 bg-gray-50 dark:bg-gray-800' 
          : ''
        }
      `}
    >
      <div className={`w-5 h-5 flex items-center justify-center`}>
        <FileText className={`w-4 h-4 ${
          isActive || isDraggingOver
            ? 'text-gray-700 dark:text-gray-300' 
            : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
        }`} />
      </div>
      
      <span className="flex-1 text-left text-sm font-medium truncate">
        Uncategorized
      </span>
      
      {/* Count or Drop indicator */}
      <AnimatePresence mode="wait">
        {isDraggingOver ? (
          <motion.span
            key="drop-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs font-bold text-gray-600 dark:text-gray-300"
          >
            Drop
          </motion.span>
        ) : (
          <motion.span 
            key="count"
            className={`text-xs font-medium ${
              isActive
                ? 'text-gray-600 dark:text-gray-300'
                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
            }`}
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

UncategorizedItem.displayName = 'UncategorizedItem';

// Main Sidebar Component
const FolderSidebar = memo(({
  folders,
  selectedFolderId,
  onSelectFolder,
  onEditFolder,
  onDeleteFolder,
  onNewFolder,
  onDropResume,
  folderCounts,
  uncategorizedCount,
  totalCount
}: FolderSidebarProps) => {
  return (
    <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 
      bg-white dark:bg-gray-800 flex flex-col h-full">
      
      {/* Header */}
      <div className="px-4 py-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Library
        </h3>
        <button
            onClick={onNewFolder}
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
            title="New Folder"
        >
            <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {/* All Resumes */}
        <AllResumesItem
          isActive={selectedFolderId === 'all'}
          count={totalCount}
          onClick={() => onSelectFolder('all')}
        />

        <UncategorizedItem
          isActive={selectedFolderId === null}
          count={uncategorizedCount}
          onClick={() => onSelectFolder(null)}
          onDrop={(resumeId) => onDropResume(resumeId, null)}
        />

        {/* Folders Header */}
        {folders.length > 0 && (
            <div className="mt-6 mb-2 px-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Folders
                </span>
            </div>
        )}

        {/* Folders */}
        <div className="space-y-0.5">
          {folders.map(folder => (
            <FolderItem
              key={folder.id}
              folder={folder}
              isActive={selectedFolderId === folder.id}
              count={folderCounts[folder.id] || 0}
              onClick={() => onSelectFolder(folder.id)}
              onEdit={() => onEditFolder(folder)}
              onDelete={() => onDeleteFolder(folder.id)}
              onDrop={(resumeId) => onDropResume(resumeId, folder.id)}
            />
          ))}
        </div>

        {folders.length === 0 && (
             <div className="px-4 py-8 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    No folders yet
                </p>
                <button
                    onClick={onNewFolder}
                    className="mt-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                >
                    Create one
                </button>
             </div>
        )}
      </div>
      
      {/* Footer Stats or Info could go here */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 flex justify-between">
         <span>Storage</span>
         <span>{totalCount} items</span>
      </div>
    </div>
  );
});

FolderSidebar.displayName = 'FolderSidebar';

export default FolderSidebar;

import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FolderPlus, FileStack, Files, Check } from 'lucide-react';
import { Folder as FolderType } from '../resume-builder/FolderCard';

type SelectedFolderType = 'all' | null | string;

interface MobileLibrarySheetProps {
    isOpen: boolean;
    onClose: () => void;
    folders: FolderType[];
    selectedFolderId: SelectedFolderType;
    onSelectFolder: (folderId: SelectedFolderType) => void;
    onCreateFolder: () => void;
    totalCount: number;
    uncategorizedCount: number;
    folderCounts: Record<string, number>;
}

export default function MobileLibrarySheet({
    isOpen,
    onClose,
    folders,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    totalCount,
    uncategorizedCount,
    folderCounts
}: MobileLibrarySheetProps) {
    const handleSelect = (folderId: SelectedFolderType) => {
        onSelectFolder(folderId);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#242325] rounded-t-2xl overflow-hidden max-h-[70vh] safe-bottom"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>

                        {/* Header */}
                        <div className="px-5 pb-3 border-b border-gray-100 dark:border-[#3d3c3e]">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Library
                            </h2>
                        </div>

                        {/* Options */}
                        <div className="overflow-y-auto max-h-[calc(70vh-140px)]">
                            {/* All Documents */}
                            <LibraryOption
                                icon={<FileStack className="w-5 h-5" />}
                                title="All Documents"
                                count={totalCount}
                                isSelected={selectedFolderId === 'all'}
                                onClick={() => handleSelect('all')}
                            />

                            {/* Uncategorized */}
                            <LibraryOption
                                icon={<Files className="w-5 h-5" />}
                                title="Uncategorized"
                                count={uncategorizedCount}
                                isSelected={selectedFolderId === null}
                                onClick={() => handleSelect(null)}
                            />

                            {/* Divider */}
                            {folders.length > 0 && (
                                <div className="h-px bg-gray-100 dark:bg-[#3d3c3e] mx-5 my-2" />
                            )}

                            {/* Folders */}
                            {folders.map(folder => (
                                <LibraryOption
                                    key={folder.id}
                                    icon={
                                        <span className="text-lg" role="img" aria-label={folder.name}>
                                            {folder.icon || '📁'}
                                        </span>
                                    }
                                    title={folder.name}
                                    count={folderCounts[folder.id] || 0}
                                    isSelected={selectedFolderId === folder.id}
                                    onClick={() => handleSelect(folder.id)}
                                    color={folder.color}
                                />
                            ))}

                            {/* Create Folder */}
                            <button
                                onClick={() => { onCreateFolder(); onClose(); }}
                                className="w-full flex items-center gap-4 px-5 py-3.5 text-left
                  active:bg-gray-50 dark:active:bg-[#2b2a2c] transition-colors"
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl 
                  bg-gray-100 dark:bg-[#2d2c2e]
                  flex items-center justify-center
                  text-gray-500 dark:text-gray-400"
                                >
                                    <FolderPlus className="w-5 h-5" />
                                </div>
                                <span className="text-[15px] font-medium text-[#635BFF] dark:text-[#a5a0ff]">
                                    Create Folder
                                </span>
                            </button>
                        </div>

                        {/* Cancel */}
                        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-[#3d3c3e]">
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl bg-gray-100 dark:bg-[#2d2c2e] 
                  text-[15px] font-medium text-gray-900 dark:text-white
                  active:bg-gray-200 dark:active:bg-[#3d3c3e] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

interface LibraryOptionProps {
    icon: React.ReactNode;
    title: string;
    count: number;
    isSelected: boolean;
    onClick: () => void;
    color?: string;
}

function LibraryOption({ icon, title, count, isSelected, onClick, color }: LibraryOptionProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors
        ${isSelected
                    ? 'bg-[#635BFF]/5 dark:bg-[#635BFF]/10'
                    : 'active:bg-gray-50 dark:active:bg-[#2b2a2c]'
                }`}
        >
            <div
                className="flex-shrink-0 w-10 h-10 rounded-xl 
          bg-gray-100 dark:bg-[#2d2c2e]
          flex items-center justify-center
          text-gray-500 dark:text-gray-400"
                style={color ? { backgroundColor: `${color}20` } : undefined}
            >
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-[15px] font-medium text-gray-900 dark:text-white">
                    {title}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[13px] text-gray-400 dark:text-gray-500">
                    {count}
                </span>
                {isSelected && (
                    <Check className="w-5 h-5 text-[#635BFF] dark:text-[#a5a0ff]" />
                )}
            </div>
        </button>
    );
}

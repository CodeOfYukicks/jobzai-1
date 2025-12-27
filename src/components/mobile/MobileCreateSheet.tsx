import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, FileText, Palette, Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

interface MobileCreateSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateNote: () => void;
    onCreateResume: () => void;
    onCreateBoard: () => void;
    isCreatingNote?: boolean;
    isCreatingBoard?: boolean;
}

export default function MobileCreateSheet({
    isOpen,
    onClose,
    onCreateNote,
    onCreateResume,
    onCreateBoard,
    isCreatingNote = false,
    isCreatingBoard = false
}: MobileCreateSheetProps) {
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
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#242325] rounded-t-2xl overflow-hidden safe-bottom"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>

                        {/* Header */}
                        <div className="px-5 pb-4 border-b border-gray-100 dark:border-[#3d3c3e]">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Create New
                            </h2>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                                Choose what to create
                            </p>
                        </div>

                        {/* Options */}
                        <div className="py-2">
                            <CreateOption
                                icon={<StickyNote className="w-6 h-6" />}
                                title="Note"
                                description="Write and organize your thoughts"
                                onClick={() => { onCreateNote(); onClose(); }}
                                isLoading={isCreatingNote}
                            />

                            <CreateOption
                                icon={<FileText className="w-6 h-6" />}
                                title="Resume"
                                description="Build a professional CV"
                                onClick={onCreateResume}
                            />

                            <CreateOption
                                icon={<Palette className="w-6 h-6" />}
                                title="Board"
                                description="Visual whiteboard for ideas"
                                onClick={() => { onCreateBoard(); onClose(); }}
                                isLoading={isCreatingBoard}
                            />
                        </div>

                        {/* Cancel */}
                        <div className="px-4 pb-4 pt-2">
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

interface CreateOptionProps {
    icon: ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    isLoading?: boolean;
}

function CreateOption({ icon, title, description, onClick, isLoading }: CreateOptionProps) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className="w-full flex items-center gap-4 px-5 py-4 text-left
        active:bg-gray-50 dark:active:bg-[#2b2a2c] transition-colors
        disabled:opacity-60"
        >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl 
        bg-[#635BFF]/10 dark:bg-[#635BFF]/20
        flex items-center justify-center
        text-[#635BFF] dark:text-[#a5a0ff]"
            >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-medium text-gray-900 dark:text-white">
                    {title}
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {description}
                </p>
            </div>
        </button>
    );
}

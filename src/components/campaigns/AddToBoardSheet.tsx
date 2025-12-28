import React, { useState } from 'react';
import BottomSheet from '../common/BottomSheet';
import { KanbanBoard } from '../../types/job';
import { Plus, Layout, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface AddToBoardSheetProps {
    isOpen: boolean;
    onClose: () => void;
    boards: KanbanBoard[];
    onSelectBoard: (boardId: string) => void;
    onCreateBoard?: () => void;
}

export default function AddToBoardSheet({
    isOpen,
    onClose,
    boards,
    onSelectBoard,
    onCreateBoard
}: AddToBoardSheetProps) {
    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title="Add to Board"
            subtitle="Select a campaign board to track this contact"
            height={50}
        >
            <div className="px-4 pb-6">
                <div className="flex flex-col gap-2">
                    {boards.map((board) => (
                        <button
                            key={board.id}
                            onClick={() => onSelectBoard(board.id)}
                            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/[0.05] active:bg-gray-100 dark:active:bg-white/[0.1] border border-gray-100 dark:border-white/[0.05] rounded-xl transition-colors text-left group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5">
                                <Layout className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {board.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {board.columns?.length || 0} stages
                                </p>
                            </div>
                            <div className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-white/20 flex items-center justify-center group-active:border-violet-500 group-active:bg-violet-500 transition-colors">
                                <Check className="w-3.5 h-3.5 text-white opacity-0 group-active:opacity-100" />
                            </div>
                        </button>
                    ))}

                    {onCreateBoard && (
                        <button
                            onClick={onCreateBoard}
                            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors text-left mt-2"
                        >
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                <Plus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">
                                Create new board
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </BottomSheet>
    );
}

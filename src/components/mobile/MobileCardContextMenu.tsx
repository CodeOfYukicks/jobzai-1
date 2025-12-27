import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Edit3,
    StickyNote,
    BellRing,
    Archive,
    Trash2,
    X
} from 'lucide-react';
import { JobApplication } from '../../types/job';

interface MobileCardContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
    application: JobApplication | null;
    onEdit: () => void;
    onAddNote: () => void;
    onSetReminder: () => void;
    onArchive: () => void;
    onDelete: () => void;
}

export default function MobileCardContextMenu({
    isOpen,
    onClose,
    application,
    onEdit,
    onAddNote,
    onSetReminder,
    onArchive,
    onDelete,
}: MobileCardContextMenuProps) {
    if (!application) return null;

    const menuItems = [
        {
            icon: Edit3,
            label: 'Edit Application',
            action: onEdit,
            color: 'text-gray-700 dark:text-gray-200',
            bgColor: 'hover:bg-gray-100 dark:hover:bg-[#3d3c3e]',
        },
        {
            icon: StickyNote,
            label: 'Add Note',
            action: onAddNote,
            color: 'text-gray-700 dark:text-gray-200',
            bgColor: 'hover:bg-gray-100 dark:hover:bg-[#3d3c3e]',
        },
        {
            icon: BellRing,
            label: 'Set Reminder',
            action: onSetReminder,
            color: 'text-gray-700 dark:text-gray-200',
            bgColor: 'hover:bg-gray-100 dark:hover:bg-[#3d3c3e]',
        },
        {
            icon: Archive,
            label: 'Archive',
            action: onArchive,
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
        },
        {
            icon: Trash2,
            label: 'Delete',
            action: onDelete,
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'hover:bg-red-50 dark:hover:bg-red-900/20',
            destructive: true,
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
                    />

                    {/* Menu Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="fixed left-4 right-4 bottom-[100px] z-[101] max-w-sm mx-auto"
                    >
                        <div className="bg-white dark:bg-[#2b2a2c] rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-[#3d3c3e]/50">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#3d3c3e]">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {application.position || application.contactName || 'Application'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {application.companyName}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 -mr-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Menu Items */}
                            <div className="py-1">
                                {menuItems.map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <React.Fragment key={item.label}>
                                            {item.destructive && (
                                                <div className="my-1 mx-3 border-t border-gray-100 dark:border-[#3d3c3e]" />
                                            )}
                                            <button
                                                onClick={() => {
                                                    item.action();
                                                    onClose();
                                                }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 ${item.bgColor} transition-colors active:scale-[0.98]`}
                                            >
                                                <Icon className={`w-5 h-5 ${item.color}`} />
                                                <span className={`text-sm font-medium ${item.color}`}>
                                                    {item.label}
                                                </span>
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            {/* Cancel Button */}
                            <div className="px-3 pb-3 pt-1">
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 rounded-xl bg-gray-100 dark:bg-[#3d3c3e] text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#4a494b] active:scale-[0.98] transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

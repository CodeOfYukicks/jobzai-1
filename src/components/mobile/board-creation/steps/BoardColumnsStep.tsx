import { useState } from 'react';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardType, CustomColumn, BOARD_COLORS, BOARD_TYPE_COLUMNS, JOB_COLUMN_LABELS, CAMPAIGN_COLUMN_LABELS } from '../../../../types/job';

interface BoardColumnsStepProps {
    boardType: BoardType;
    customColumns: CustomColumn[];
    onAddColumn: (name: string) => void;
    onRemoveColumn: (id: string) => void;
    onNext: () => void;
}

export default function BoardColumnsStep({
    boardType,
    customColumns,
    onAddColumn,
    onRemoveColumn,
    onNext
}: BoardColumnsStepProps) {
    const [newColumnName, setNewColumnName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const standardColumns = BOARD_TYPE_COLUMNS[boardType];
    const columnLabels = boardType === 'jobs' ? JOB_COLUMN_LABELS : CAMPAIGN_COLUMN_LABELS;

    const handleAdd = () => {
        if (newColumnName.trim()) {
            onAddColumn(newColumnName.trim());
            setNewColumnName('');
            setIsAdding(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Configure Columns</h2>
                    <p className="text-gray-500 dark:text-gray-400">Review the default columns and add any custom stages you need.</p>
                </div>

                {/* Default Columns */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                        Default Columns
                    </h3>
                    <div className="bg-gray-50 dark:bg-[#2b2a2c] rounded-xl border border-gray-200 dark:border-[#3d3c3e] overflow-hidden">
                        {standardColumns.map((col, index) => (
                            <div
                                key={col}
                                className={`flex items-center gap-3 p-4 ${index !== standardColumns.length - 1 ? 'border-b border-gray-200 dark:border-[#3d3c3e]' : ''
                                    }`}
                            >
                                <div className="w-2 h-8 rounded-full bg-gray-200 dark:bg-[#3d3c3e]" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">{columnLabels[col]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Custom Columns */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                            Custom Columns
                        </h3>
                        {!isAdding && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="text-sm font-medium text-[#635BFF] flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Column
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {customColumns.map((col) => (
                            <motion.div
                                key={col.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-3 p-4 bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-200 dark:border-[#3d3c3e]"
                            >
                                <div
                                    className="w-2 h-8 rounded-full"
                                    style={{ backgroundColor: col.color || BOARD_COLORS[0] }}
                                />
                                <span className="flex-1 font-medium text-gray-900 dark:text-white">{col.name}</span>
                                <button
                                    onClick={() => onRemoveColumn(col.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}

                        {isAdding && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={newColumnName}
                                    onChange={(e) => setNewColumnName(e.target.value)}
                                    placeholder="Column Name"
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#2b2a2c] text-gray-900 dark:text-white focus:border-[#635BFF] outline-none"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                                <button
                                    onClick={handleAdd}
                                    disabled={!newColumnName.trim()}
                                    className="px-4 py-3 bg-[#635BFF] text-white rounded-xl font-medium disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {customColumns.length === 0 && !isAdding && (
                        <div className="text-center py-8 px-4 border-2 border-dashed border-gray-200 dark:border-[#3d3c3e] rounded-xl">
                            <p className="text-sm text-gray-500 dark:text-gray-400">No custom columns added yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Bottom CTA */}
            <div className="p-4 bg-white dark:bg-[#1a191b] border-t border-gray-200 dark:border-[#3d3c3e] safe-area-bottom">
                <button
                    onClick={onNext}
                    className="w-full py-3.5 px-4 bg-[#635BFF] hover:bg-[#534be0] active:bg-[#4640c0] text-white rounded-xl font-semibold text-base shadow-lg shadow-[#635BFF]/20 transition-all flex items-center justify-center gap-2"
                >
                    <span>Next Step</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

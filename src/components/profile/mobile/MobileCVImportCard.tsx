import { motion } from 'framer-motion';
import { FileUp, Loader2, Sparkles } from 'lucide-react';

interface MobileCVImportCardProps {
    onImport: () => void;
    isImporting: boolean;
    hasCv: boolean;
}

/**
 * Secondary CV import card for mobile
 * - Minimal visual weight
 * - Import action button
 * - Loading state
 */
export default function MobileCVImportCard({
    onImport,
    isImporting,
    hasCv,
}: MobileCVImportCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#3d3c3e] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <FileUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {hasCv ? 'Update from CV' : 'Import from CV'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Auto-fill your profile
                    </p>
                </div>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onImport}
                    disabled={isImporting}
                    className="px-4 py-2 text-sm font-semibold text-[#635BFF] bg-[#635BFF]/10 rounded-full active:bg-[#635BFF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isImporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Import
                        </span>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
}

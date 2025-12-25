import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteBlogPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    postTitle: string;
}

export default function DeleteBlogPostModal({
    isOpen,
    onClose,
    onConfirm,
    postTitle,
}: DeleteBlogPostModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('Error deleting post:', error);
        } finally {
            setIsDeleting(false);
        }
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            {/* Header */}
                            <div className="p-6 pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                            <AlertTriangle className="w-6 h-6 text-red-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">
                                                Delete Article
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                This action cannot be undone
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        disabled={isDeleting}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-6 pb-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-sm text-gray-600">
                                        Are you sure you want to delete{' '}
                                        <span className="font-semibold text-gray-900">
                                            "{postTitle}"
                                        </span>
                                        ?
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        This will permanently remove the article and all associated data.
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-6 pt-2 flex gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Delete Article
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

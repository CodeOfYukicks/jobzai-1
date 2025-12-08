import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Trash2, Clock, Check, Eye } from 'lucide-react';
import { GeneratedEmail } from '../../types/job';
import { useState } from 'react';
import { toast } from '@/contexts/ToastContext';

interface GeneratedHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  emails: GeneratedEmail[];
  toolName: string;
  onLoad: (email: GeneratedEmail) => void;
  onDelete?: (emailId: string) => void;
}

export const GeneratedHistoryModal = ({
  isOpen,
  onClose,
  emails,
  toolName,
  onLoad,
  onDelete,
}: GeneratedHistoryModalProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#2b2a2c] rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#3d3c3e]">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {toolName} History
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {emails.length} {emails.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {emails.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No generated items yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {emails.map((email, index) => (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative p-4 rounded-lg border border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#2b2a2c]/50 hover:border-purple-300 dark:hover:border-purple-600 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(email.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(email.content, email.id)}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                          title="Copy"
                        >
                          {copiedId === email.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        {onDelete && (
                          <button
                            onClick={() => onDelete(email.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="space-y-2">
                      {expandedId === email.id ? (
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {email.content}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {truncateText(email.content)}
                        </p>
                      )}
                      
                      {email.content.length > 150 && (
                        <button
                          onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                          className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                        >
                          {expandedId === email.id ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>

                    {/* Load button */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#3d3c3e]">
                      <button
                        onClick={() => {
                          onLoad(email);
                          onClose();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Load this version</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};



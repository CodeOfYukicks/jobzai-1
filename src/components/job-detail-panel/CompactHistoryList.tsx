import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, ChevronRight } from 'lucide-react';
import { GeneratedEmail } from '../../types/job';
import { useState } from 'react';

interface CompactHistoryListProps {
  emails: GeneratedEmail[];
  onLoad: (email: GeneratedEmail) => void;
  onDelete?: (emailId: string) => void;
}

export const CompactHistoryList = ({ emails, onLoad, onDelete }: CompactHistoryListProps) => {
  const [showAll, setShowAll] = useState(false);
  const displayedEmails = showAll ? emails : emails.slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return hours === 0 ? 'Just now' : `${hours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  if (emails.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Recent History
      </h4>
      
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayedEmails.map((email, index) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <button
                onClick={() => onLoad(email)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600 transition-all text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {formatDate(email.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {truncateText(email.content)}
                  </p>
                </div>
                
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-shrink-0" />
              </button>
              
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(email.id);
                  }}
                  className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {emails.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          {showAll ? 'Show less' : `View all ${emails.length} items`}
        </button>
      )}
    </motion.div>
  );
};



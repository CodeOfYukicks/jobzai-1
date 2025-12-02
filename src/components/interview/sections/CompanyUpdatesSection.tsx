import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ExternalLink, ChevronDown, Loader2, Plus, Newspaper } from 'lucide-react';
import { Interview, NewsItem } from '../../../types/interview';

interface CompanyUpdatesSectionProps {
  interview: Interview;
  newsItems: NewsItem[];
  isNewsLoading: boolean;
  newsError: string | null;
  showAllNewsItems: boolean;
  setShowAllNewsItems: (show: boolean) => void;
  fetchCompanyNews: () => Promise<void>;
  createNoteFromNews: (news: NewsItem) => void;
}

const CompanyUpdatesSection = memo(function CompanyUpdatesSection({
  interview,
  newsItems,
  isNewsLoading,
  newsError,
  showAllNewsItems,
  setShowAllNewsItems,
  fetchCompanyNews,
  createNoteFromNews,
}: CompanyUpdatesSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!interview?.preparation) return null;

  const visibleNews = showAllNewsItems ? newsItems : newsItems.slice(0, 3);
  const hasMore = newsItems.length > 3;

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/60 dark:ring-slate-800/60 overflow-hidden transition-all hover:shadow-premium-soft"
    >
      
      {/* Collapsible Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400 dark:text-slate-500">
            Recent Updates
          </span>
          {newsItems.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-jobzai-100 dark:bg-jobzai-950/50 text-xs font-bold text-jobzai-600 dark:text-jobzai-400">
              {newsItems.length}
            </span>
          )}
          {isNewsLoading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-jobzai-500" />
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fetchCompanyNews();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg text-slate-400 hover:text-jobzai-600 hover:bg-jobzai-50 dark:text-slate-500 dark:hover:text-jobzai-400 dark:hover:bg-jobzai-950/30 transition-colors"
            title="Refresh news"
          >
            <RefreshCw className={`w-4 h-4 ${isNewsLoading ? 'animate-spin' : ''}`} />
          </motion.button>
          
          {/* Collapse indicator */}
          <ChevronDown 
            className={`w-4 h-4 text-slate-300 dark:text-slate-600 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} 
          />
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-8 pb-6 overflow-hidden"
          >
            {newsError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 ring-1 ring-rose-200/50 dark:ring-rose-800/30 text-sm text-rose-600 dark:text-rose-400">
                {newsError}
              </div>
            )}

            {newsItems.length === 0 && !isNewsLoading ? (
              <div className="py-10 text-center border-t border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Newspaper className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  No recent updates found
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Click refresh to check for news
                </p>
              </div>
            ) : (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                {/* News List */}
                <div className="space-y-1">
                  {visibleNews.map((news, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex items-start gap-4 px-4 py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all"
                    >
                      {/* Sentiment dot */}
                      <div className="flex-shrink-0 mt-2">
                        <div 
                          className={`
                            w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900
                            ${news.sentiment === 'positive' 
                              ? 'bg-emerald-500 ring-emerald-200 dark:ring-emerald-800' 
                              : news.sentiment === 'negative' 
                              ? 'bg-rose-500 ring-rose-200 dark:ring-rose-800' 
                              : 'bg-slate-400 ring-slate-200 dark:bg-slate-500 dark:ring-slate-700'
                            }
                          `} 
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                            {news.title}
                          </h4>
                          <span className="flex-shrink-0 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {news.date}
                          </span>
                        </div>
                        
                        {news.summary && (
                          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                            {news.summary}
                          </p>
                        )}

                        {/* Actions - appear on hover */}
                        <div className="mt-2.5 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            type="button"
                            onClick={() => createNoteFromNews(news)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-jobzai-600 hover:text-jobzai-700 bg-jobzai-50 hover:bg-jobzai-100 dark:text-jobzai-400 dark:hover:text-jobzai-300 dark:bg-jobzai-950/50 dark:hover:bg-jobzai-950/80 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Save
                          </motion.button>
                          {news.url && (
                            <a
                              href={news.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                            >
                              Read
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {news.source && (
                            <span className="text-[10px] text-slate-300 dark:text-slate-600">
                              via {news.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Show more */}
                {hasMore && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <motion.button
                      type="button"
                      onClick={() => setShowAllNewsItems(!showAllNewsItems)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-jobzai-600 hover:text-jobzai-700 dark:text-jobzai-400 dark:hover:text-jobzai-300 transition-colors"
                    >
                      {showAllNewsItems ? 'Show less' : `View all ${newsItems.length} updates`}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllNewsItems ? 'rotate-180' : ''}`} />
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
});

export default CompanyUpdatesSection;

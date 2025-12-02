import { memo, useState } from 'react';
import { RefreshCw, ExternalLink, ChevronDown, Loader2, Plus } from 'lucide-react';
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
    <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors">
      
      {/* Collapsible Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500">
            Recent Updates
          </span>
          {newsItems.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
              {newsItems.length}
            </span>
          )}
          {isNewsLoading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fetchCompanyNews();
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            title="Refresh news"
          >
            <RefreshCw className={`w-4 h-4 ${isNewsLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Collapse indicator */}
          <ChevronDown 
            className={`w-4 h-4 text-slate-300 dark:text-slate-600 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} 
          />
        </div>
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-8 pb-6">
          {newsError && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
              {newsError}
            </div>
          )}

          {newsItems.length === 0 && !isNewsLoading ? (
            <div className="py-8 text-center border-t border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No recent updates found
              </p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                Click refresh to check for news
              </p>
            </div>
          ) : (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              {/* News List */}
              <div className="space-y-1">
                {visibleNews.map((news, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-4 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Sentiment dot */}
                    <div className="flex-shrink-0 mt-2">
                      <div 
                        className={`
                          w-2 h-2 rounded-full
                          ${news.sentiment === 'positive' ? 'bg-emerald-500' :
                            news.sentiment === 'negative' ? 'bg-red-500' :
                            'bg-slate-300 dark:bg-slate-600'}
                        `} 
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                          {news.title}
                        </h4>
                        <span className="flex-shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {news.date}
                        </span>
                      </div>
                      
                      {news.summary && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                          {news.summary}
                        </p>
                      )}

                      {/* Actions - appear on hover */}
                      <div className="mt-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => createNoteFromNews(news)}
                          className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Save
                        </button>
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
                  </div>
                ))}
              </div>

              {/* Show more */}
              {hasMore && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllNewsItems(!showAllNewsItems)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                  >
                    {showAllNewsItems ? 'Show less' : `View all ${newsItems.length} updates`}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllNewsItems ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
});

export default CompanyUpdatesSection;

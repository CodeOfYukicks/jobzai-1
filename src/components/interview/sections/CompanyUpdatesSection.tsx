import { memo } from 'react';
import { RefreshCw, Newspaper, MessageSquare, ExternalLink, ChevronDown, ArrowRight, Loader2, TrendingUp } from 'lucide-react';
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
  if (!interview?.preparation) return null;

  return (
    <article className="group rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-inset ring-blue-100 dark:ring-blue-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Company Updates
            </h2>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Recent news and market signals
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start">
          {isNewsLoading && (
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Refreshing...</span>
            </div>
          )}
          {newsError && (
            <div className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
              {newsError}
            </div>
          )}
          <button
            type="button"
            onClick={() => fetchCompanyNews()}
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm hover:shadow"
          >
            <RefreshCw className={`h-4 w-4 ${isNewsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>
      
      <div className="space-y-4">
        {newsItems.length === 0 && !isNewsLoading && !newsError && (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
            <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Newspaper className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              No recent updates found
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Try refreshing to check for the latest news
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {(showAllNewsItems ? newsItems : newsItems.slice(0, 3)).map((news, i) => (
            <div
              key={i}
              className="group/news relative overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 p-5 transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:border-blue-100 dark:hover:border-blue-500/20"
            >
              <div className="flex items-start gap-4">
                 {/* Sentiment Indicator */}
                <div className={`flex-shrink-0 mt-1.5 w-2 h-2 rounded-full ${
                  news.sentiment === 'positive' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                  news.sentiment === 'negative' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                  'bg-gray-400'
                }`} />
                
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white leading-snug group-hover/news:text-blue-600 dark:group-hover/news:text-blue-400 transition-colors">
                      {news.title}
                    </h4>
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {news.date}
                    </span>
                  </div>
                  
                  {news.summary && (
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-2">
                      {news.summary}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {news.source && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-medium text-gray-600 dark:text-gray-300">
                          <Newspaper className="h-3 w-3" />
                          {news.source}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover/news:opacity-100 transition-opacity duration-200">
                      <button
                        type="button"
                        onClick={() => createNoteFromNews(news)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Save Point
                      </button>
                      {news.url && (
                        <a
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
                        >
                          Read <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {newsItems.length > 3 && (
          <div className="pt-4 text-center border-t border-gray-100 dark:border-gray-800 mt-4">
            <button
              type="button"
              onClick={() => setShowAllNewsItems(!showAllNewsItems)}
              className="group inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              {showAllNewsItems ? 'Show less' : `View all ${newsItems.length} updates`}
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAllNewsItems ? 'rotate-180' : ''} group-hover:translate-y-0.5`} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
});

export default CompanyUpdatesSection;

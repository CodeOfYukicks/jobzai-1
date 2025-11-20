import { memo } from 'react';
import { RefreshCw, Newspaper, MessageSquare, ExternalLink, ChevronDown, ArrowRight, Loader2 } from 'lucide-react';
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
    <article className="group relative overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.92)] px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-neutral-900/70 dark:ring-white/5">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">Company Updates</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Recent news and announcements about the company</p>
        </div>
        <div className="flex items-center gap-2">
          {isNewsLoading && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading…</span>
            </div>
          )}
          {newsError && (
            <div className="text-xs text-red-600 dark:text-red-400">{newsError}</div>
          )}
          <button
            type="button"
            onClick={() => {
              fetchCompanyNews();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-black/[0.12] hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:border-white/20 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </header>
      
      <div className="space-y-3">
        {newsItems.length === 0 && !isNewsLoading && !newsError && (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-neutral-500 dark:text-neutral-400">
            <Newspaper className="mb-2 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
            <p>No company updates yet. Try refreshing or running the analysis again.</p>
          </div>
        )}

        {(showAllNewsItems ? newsItems : newsItems.slice(0, 3)).map((news, i) => (
          <div
            key={i}
            className="rounded-[12px] border border-black/[0.04] bg-white/80 px-4 py-3.5 text-sm leading-relaxed hover:border-purple-200/50 hover:bg-white dark:border-white/5 dark:bg-white/5 dark:hover:border-purple-800/50 dark:hover:bg-white/10 transition-all"
          >
            <div className="flex items-start gap-3">
              <span
                className={[
                  'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full',
                  news.sentiment === 'positive'
                    ? 'bg-emerald-500'
                    : news.sentiment === 'negative'
                      ? 'bg-red-500'
                      : 'bg-neutral-500',
                ].join(' ')}
              />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {news.title}
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>{news.date}</span>
                  {news.source && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Newspaper className="h-3 w-3" />
                        {news.source}
                      </span>
                    </>
                  )}
                </div>
                {news.summary && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {news.summary}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => createNoteFromNews(news)}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800/60 transition-colors"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Talking points
                  </button>
                  {news.url && (
                    <a
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:bg-black/[0.04] dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Read more
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {newsItems.length > 3 && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowAllNewsItems(!showAllNewsItems)}
              className="inline-flex items-center justify-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200 transition-colors"
            >
              {showAllNewsItems ? (
                <>
                  <ChevronDown className="h-3 w-3 rotate-180" />
                  Show less
                </>
              ) : (
                <>
                  View all {newsItems.length} updates
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </article>
  );
});

export default CompanyUpdatesSection;



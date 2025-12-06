/**
 * DailyMotivation Component
 * Displays a daily motivational quote with lime green card design
 * Fetches from Quotable API with localStorage caching
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface QuoteData {
  content: string;
  author: string;
  dateKey: string;
}

// Fallback quotes (mix of career and general motivation)
const FALLBACK_QUOTES: Omit<QuoteData, 'dateKey'>[] = [
  { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { content: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { content: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { content: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { content: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { content: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { content: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { content: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { content: "Dream bigger. Do bigger.", author: "Unknown" },
  { content: "Your limitation—it's only your imagination.", author: "Unknown" },
  { content: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { content: "Great things never come from comfort zones.", author: "Unknown" },
  { content: "Fortune favors the bold.", author: "Virgil" },
];

const STORAGE_KEY = 'dailyMotivation';

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getRandomFallbackQuote(): Omit<QuoteData, 'dateKey'> {
  // Use date as seed for consistent daily quote from fallbacks
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % FALLBACK_QUOTES.length;
  return FALLBACK_QUOTES[index];
}

export default function DailyMotivation() {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuote = useCallback(async (forceRefresh = false) => {
    const todayKey = getTodayKey();
    
    // Check localStorage first (unless forcing refresh)
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed: QuoteData = JSON.parse(cached);
          if (parsed.dateKey === todayKey) {
            setQuote(parsed);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }

    try {
      setIsRefreshing(forceRefresh);
      
      // Fetch from Quotable API
      const response = await fetch('https://api.quotable.io/random?maxLength=120');
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      const newQuote: QuoteData = {
        content: data.content,
        author: data.author,
        dateKey: todayKey,
      };
      
      // Cache in localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newQuote));
      } catch (e) {
        // Ignore localStorage errors
      }
      
      setQuote(newQuote);
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      // Use fallback quote
      const fallback = getRandomFallbackQuote();
      const fallbackQuote: QuoteData = {
        ...fallback,
        dateKey: todayKey,
      };
      setQuote(fallbackQuote);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchQuote(true);
    }
  };

  // Loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#B7E219] rounded-2xl h-full min-h-[220px] flex items-center justify-center"
      >
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#7F9B1D]" />
          <span className="text-sm text-[#7F9B1D] font-medium">
            Loading inspiration...
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative h-full"
    >
      {/* Main card */}
      <div 
        onClick={handleRefresh}
        className="group relative bg-[#B7E219] rounded-2xl h-full min-h-[220px] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-[#B7E219]/30"
      >
        {/* Header */}
        <div className="uppercase font-bold text-[#7F9B1D] px-6 pt-5 pb-2 text-xs tracking-wide leading-tight">
          Quote of the day
        </div>

        {/* Quote SVG icon */}
        <div className="text-[#DFF886] px-6 -mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 330 307" className="w-14 h-14">
            <path 
              fill="currentColor" 
              d="M302.258 176.221C320.678 176.221 329.889 185.432 329.889 203.853V278.764C329.889 297.185 320.678 306.395 302.258 306.395H231.031C212.61 306.395 203.399 297.185 203.399 278.764V203.853C203.399 160.871 207.902 123.415 216.908 91.4858C226.323 59.1472 244.539 30.902 271.556 6.75027C280.562 -1.02739 288.135 -2.05076 294.275 3.68014L321.906 29.4692C328.047 35.2001 326.614 42.1591 317.608 50.3461C303.69 62.6266 292.228 80.4334 283.223 103.766C274.626 126.69 270.328 150.842 270.328 176.221H302.258ZM99.629 176.221C118.05 176.221 127.26 185.432 127.26 203.853V278.764C127.26 297.185 118.05 306.395 99.629 306.395H28.402C9.98126 306.395 0.770874 297.185 0.770874 278.764V203.853C0.770874 160.871 5.27373 123.415 14.2794 91.4858C23.6945 59.1472 41.9106 30.902 68.9277 6.75027C77.9335 -1.02739 85.5064 -2.05076 91.6467 3.68014L119.278 29.4692C125.418 35.2001 123.985 42.1591 114.98 50.3461C101.062 62.6266 89.6 80.4334 80.5942 103.766C71.9979 126.69 67.6997 150.842 67.6997 176.221H99.629Z" 
            />
          </svg>
        </div>

        {/* Quote content */}
        <AnimatePresence mode="wait">
          {quote && (
            <motion.div
              key={quote.content}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="absolute top-16 left-0 right-0 px-6 pt-8"
            >
              <p className="text-base font-black text-[#465512] leading-snug line-clamp-4">
                {quote.content}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Author - appears on hover */}
        {quote && (
          <div className="absolute bottom-4 left-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <p className="font-bold text-[#7F9B1D] text-sm flex items-center gap-2">
              <span>— {quote.author}</span>
              <svg 
                className="w-4 h-4 text-[#809B1D]/50 inline-block" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <path d="M0 0H24V24H0z" fill="none" />
                <path d="M16.5 3C19.538 3 22 5.5 22 9c0 7-7.5 11-10 12.5C9.5 20 2 16 2 9c0-3.5 2.5-6 5.5-6C9.36 3 11 4 12 5c1-1 2.64-2 4.5-2z" />
              </svg>
            </p>
            <p className="text-[11px] text-[#7F9B1D]/70 mt-0.5">
              Tap to refresh
            </p>
          </div>
        )}

        {/* Refresh indicator */}
        {isRefreshing && (
          <div className="absolute inset-0 bg-[#B7E219]/80 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#7F9B1D]" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * DailyMotivation Component
 * Displays a daily motivational quote with lime green card design
 * 
 * Features:
 * - Attempts to fetch from Quotable API
 * - Falls back to 184 curated quotes if API fails
 * - Caches API failures for 24 hours to prevent console errors
 * - Daily quote caching with localStorage
 * - Click to refresh for new quote
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface QuoteData {
  content: string;
  author: string;
  dateKey: string;
}

// Fallback quotes - extensive collection organized by theme
const FALLBACK_QUOTES: Omit<QuoteData, 'dateKey'>[] = [
  // ═══════════════════════════════════════════════════════════
  // CAREER & WORK
  // ═══════════════════════════════════════════════════════════
  { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { content: "Choose a job you love, and you will never have to work a day in your life.", author: "Confucius" },
  { content: "Your work is going to fill a large part of your life. The only way to be truly satisfied is to do great work.", author: "Steve Jobs" },
  { content: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { content: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { content: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { content: "Your career is like a garden. It can hold a huge variety of things if you put the work in.", author: "Jennifer Aniston" },
  { content: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { content: "Build your own dreams, or someone else will hire you to build theirs.", author: "Farrah Gray" },
  { content: "Don't let yesterday take up too much of today.", author: "Will Rogers" },

  // ═══════════════════════════════════════════════════════════
  // SUCCESS & ACHIEVEMENT
  // ═══════════════════════════════════════════════════════════
  { content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { content: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { content: "Don't be afraid of failure. This is the way to succeed.", author: "LeBron James" },
  { content: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { content: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
  { content: "The road to success and the road to failure are almost exactly the same.", author: "Colin R. Davis" },
  { content: "Try not to become a person of success, but rather a person of value.", author: "Albert Einstein" },
  { content: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { content: "Success is not how high you have climbed, but how you make a positive difference.", author: "Roy T. Bennett" },
  { content: "There are no secrets to success. It is the result of preparation, hard work, and learning.", author: "Colin Powell" },

  // ═══════════════════════════════════════════════════════════
  // MOTIVATION & DRIVE
  // ═══════════════════════════════════════════════════════════
  { content: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
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
  { content: "What you get by achieving your goals is not as important as what you become.", author: "Zig Ziglar" },
  { content: "If you want to achieve greatness, stop asking for permission.", author: "Unknown" },

  // ═══════════════════════════════════════════════════════════
  // PERSISTENCE & RESILIENCE
  // ═══════════════════════════════════════════════════════════
  { content: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { content: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
  { content: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { content: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { content: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { content: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { content: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger" },
  { content: "The only way to guarantee failure is to quit.", author: "John C. Maxwell" },
  { content: "A river cuts through rock not because of its power, but because of its persistence.", author: "Jim Watkins" },
  { content: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },

  // ═══════════════════════════════════════════════════════════
  // MINDSET & ATTITUDE
  // ═══════════════════════════════════════════════════════════
  { content: "Whether you think you can or think you can't, you're right.", author: "Henry Ford" },
  { content: "The mind is everything. What you think you become.", author: "Buddha" },
  { content: "Your attitude determines your direction.", author: "Unknown" },
  { content: "Change your thoughts and you change your world.", author: "Norman Vincent Peale" },
  { content: "Positive thinking will let you do everything better than negative thinking will.", author: "Zig Ziglar" },
  { content: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { content: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { content: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll" },
  { content: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { content: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },

  // ═══════════════════════════════════════════════════════════
  // ACTION & INITIATIVE
  // ═══════════════════════════════════════════════════════════
  { content: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { content: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { content: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { content: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { content: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { content: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { content: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { content: "Don't wait for opportunity. Create it.", author: "Unknown" },
  { content: "Small steps in the right direction can turn out to be the biggest step of your life.", author: "Unknown" },
  { content: "The beginning is always today.", author: "Mary Shelley" },

  // ═══════════════════════════════════════════════════════════
  // LEARNING & GROWTH
  // ═══════════════════════════════════════════════════════════
  { content: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { content: "Education is not the learning of facts, but the training of the mind to think.", author: "Albert Einstein" },
  { content: "Anyone who stops learning is old, whether at twenty or eighty.", author: "Henry Ford" },
  { content: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { content: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins" },
  { content: "Mistakes are the portals of discovery.", author: "James Joyce" },
  { content: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
  { content: "I am always doing that which I cannot do, in order that I may learn how to do it.", author: "Pablo Picasso" },
  { content: "Develop a passion for learning. If you do, you will never cease to grow.", author: "Anthony J. D'Angelo" },
  { content: "Growth is never by mere chance; it is the result of forces working together.", author: "James Cash Penney" },

  // ═══════════════════════════════════════════════════════════
  // COURAGE & RISK
  // ═══════════════════════════════════════════════════════════
  { content: "Courage is not the absence of fear, but rather the judgment that something else is more important.", author: "Ambrose Redmoon" },
  { content: "You gain strength, courage and confidence by every experience in which you really stop to look fear in the face.", author: "Eleanor Roosevelt" },
  { content: "Life shrinks or expands in proportion to one's courage.", author: "Anaïs Nin" },
  { content: "Only those who will risk going too far can possibly find out how far one can go.", author: "T.S. Eliot" },
  { content: "Take risks: if you win, you will be happy; if you lose, you will be wise.", author: "Unknown" },
  { content: "Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did.", author: "Mark Twain" },
  { content: "Security is mostly a superstition. Life is either a daring adventure or nothing.", author: "Helen Keller" },
  { content: "If you're not failing, you're not trying hard enough.", author: "Unknown" },
  { content: "Feel the fear and do it anyway.", author: "Susan Jeffers" },
  { content: "Be brave enough to be bad at something new.", author: "Unknown" },

  // ═══════════════════════════════════════════════════════════
  // CREATIVITY & INNOVATION
  // ═══════════════════════════════════════════════════════════
  { content: "Creativity is intelligence having fun.", author: "Albert Einstein" },
  { content: "The people who are crazy enough to think they can change the world are the ones who do.", author: "Steve Jobs" },
  { content: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { content: "Don't be satisfied with stories, how things have gone with others. Unfold your own myth.", author: "Rumi" },
  { content: "The desire to create is one of the deepest yearnings of the human soul.", author: "Dieter F. Uchtdorf" },
  { content: "Every artist was first an amateur.", author: "Ralph Waldo Emerson" },
  { content: "Imagination is the beginning of creation.", author: "George Bernard Shaw" },
  { content: "You can't use up creativity. The more you use, the more you have.", author: "Maya Angelou" },
  { content: "Think left and think right and think low and think high.", author: "Dr. Seuss" },
  { content: "Have no fear of perfection—you'll never reach it.", author: "Salvador Dalí" },

  // ═══════════════════════════════════════════════════════════
  // LEADERSHIP & INFLUENCE
  // ═══════════════════════════════════════════════════════════
  { content: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell" },
  { content: "The greatest leader is not necessarily one who does the greatest things.", author: "Ronald Reagan" },
  { content: "Lead from the heart, not the head.", author: "Princess Diana" },
  { content: "Before you are a leader, success is all about growing yourself. When you become a leader, success is about growing others.", author: "Jack Welch" },
  { content: "Leadership is not about being in charge. It's about taking care of those in your charge.", author: "Simon Sinek" },
  { content: "The task of leadership is not to put greatness into people, but to elicit it.", author: "John Buchan" },
  { content: "Management is about arranging. Leadership is about inspiring.", author: "Simon Sinek" },
  { content: "If your actions inspire others to dream more, learn more, do more, you are a leader.", author: "John Quincy Adams" },
  { content: "Great leaders don't set out to be a leader. They set out to make a difference.", author: "Unknown" },
  { content: "The quality of a leader is reflected in the standards they set for themselves.", author: "Ray Kroc" },

  // ═══════════════════════════════════════════════════════════
  // PURPOSE & PASSION
  // ═══════════════════════════════════════════════════════════
  { content: "The purpose of life is not to be happy. It is to be useful, to be honorable, to make some difference.", author: "Ralph Waldo Emerson" },
  { content: "Passion is energy. Feel the power that comes from focusing on what excites you.", author: "Oprah Winfrey" },
  { content: "Follow your passion, be prepared to work hard and sacrifice, and above all don't let anyone limit your dreams.", author: "Donovan Bailey" },
  { content: "Nothing great in the world has ever been accomplished without passion.", author: "Georg Wilhelm Friedrich Hegel" },
  { content: "The only way to find true satisfaction is to pursue something with passion.", author: "Unknown" },
  { content: "Your purpose in life is to find your purpose and give your whole heart and soul to it.", author: "Buddha" },
  { content: "When you do what you love, you'll never work a day in your life.", author: "Marc Anthony" },
  { content: "Passion is the genesis of genius.", author: "Tony Robbins" },
  { content: "Find what makes your heart sing and create your own music.", author: "Mac Anderson" },
  { content: "Don't ask what the world needs. Ask what makes you come alive and go do it.", author: "Howard Thurman" },

  // ═══════════════════════════════════════════════════════════
  // SELF-BELIEF & CONFIDENCE
  // ═══════════════════════════════════════════════════════════
  { content: "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.", author: "Christian D. Larson" },
  { content: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { content: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { content: "Trust yourself. You know more than you think you do.", author: "Benjamin Spock" },
  { content: "No one can make you feel inferior without your consent.", author: "Eleanor Roosevelt" },
  { content: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha" },
  { content: "With confidence, you have won before you have started.", author: "Marcus Garvey" },
  { content: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
  { content: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
  { content: "Self-confidence is the first requisite to great undertakings.", author: "Samuel Johnson" },

  // ═══════════════════════════════════════════════════════════
  // WISDOM & REFLECTION
  // ═══════════════════════════════════════════════════════════
  { content: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { content: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { content: "Yesterday is history, tomorrow is a mystery, today is a gift. That's why we call it the present.", author: "Alice Morse Earle" },
  { content: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
  { content: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { content: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { content: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { content: "The unexamined life is not worth living.", author: "Socrates" },
  { content: "Time you enjoy wasting is not wasted time.", author: "Marthe Troly-Curtin" },
  { content: "The best revenge is massive success.", author: "Frank Sinatra" },
];

const STORAGE_KEY = 'dailyMotivation';
const API_FAILURE_KEY = 'dailyMotivation_apiFailure';
const API_RETRY_DELAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function shouldSkipAPI(): boolean {
  try {
    const lastFailure = localStorage.getItem(API_FAILURE_KEY);
    if (lastFailure) {
      const failureTime = parseInt(lastFailure, 10);
      const now = Date.now();
      // Skip API if it failed within the last 24 hours
      return now - failureTime < API_RETRY_DELAY;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return false;
}

function markAPIFailure(): void {
  try {
    localStorage.setItem(API_FAILURE_KEY, Date.now().toString());
  } catch (e) {
    // Ignore localStorage errors
  }
}

function getRandomFallbackQuote(forceRandom = false): Omit<QuoteData, 'dateKey'> {
  if (forceRandom) {
    // On refresh choose any fallback so the click feels responsive even if the API fails
    const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
    return FALLBACK_QUOTES[randomIndex];
  }

  // Default: deterministic per day so the initial quote stays stable
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % FALLBACK_QUOTES.length;
  return FALLBACK_QUOTES[index];
}

export default function DailyMotivation({ compact = false }: { compact?: boolean }) {
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

    setIsRefreshing(forceRefresh);

    // Skip API if it recently failed to avoid console errors
    const skipAPI = shouldSkipAPI();

    if (!skipAPI) {
      try {
        // Fetch from Quotable API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('https://api.quotable.io/random?maxLength=120', {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

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
        setLoading(false);
        setIsRefreshing(false);
        return;
      } catch (error) {
        // Mark API as failed to prevent future attempts for 24 hours
        markAPIFailure();
      }
    }

    // Use fallback quote (either because API was skipped or failed)
    const fallback = getRandomFallbackQuote(forceRefresh);
    const fallbackQuote: QuoteData = {
      ...fallback,
      dateKey: todayKey,
    };
    setQuote(fallbackQuote);
    setLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleRefresh = () => {
    if (!isRefreshing && !loading) {
      fetchQuote(true);
    }
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRefresh();
    }
  };

  // Loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`bg-[#B7E219] rounded-2xl h-full ${compact ? '' : 'min-h-[220px]'} flex items-center justify-center`}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#7F9B1D]" />
          {!compact && (
            <span className="text-sm text-[#7F9B1D] font-medium">
              Loading inspiration...
            </span>
          )}
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
        onKeyDown={handleCardKeyDown}
        role="button"
        tabIndex={0}
        className={`group relative bg-[#B7E219] rounded-2xl h-full ${compact ? '' : 'min-h-[220px]'} overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-[#B7E219]/30`}
      >
        {/* Header */}
        <div className={`uppercase font-bold text-[#7F9B1D] ${compact ? 'px-4 pt-4 pb-1 text-[10px]' : 'px-6 pt-5 pb-2 text-xs'} tracking-wide leading-tight`}>
          Quote of the day
        </div>

        {/* Quote SVG icon */}
        <div className={`text-[#DFF886] ${compact ? 'px-4 -mt-0.5' : 'px-6 -mt-1'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 330 307" className={compact ? "w-8 h-8" : "w-14 h-14"}>
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
              className={`absolute left-0 right-0 ${compact ? 'top-12 px-4 pt-2' : 'top-16 px-6 pt-8'}`}
            >
              <p className={`font-black text-[#465512] leading-snug ${compact ? 'text-xs line-clamp-5' : 'text-base line-clamp-4'}`}>
                {quote.content}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Author - appears on hover */}
        {quote && (
          <div className={`absolute left-0 right-0 ${compact ? 'bottom-3 px-4' : 'bottom-4 px-6'} ${compact ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-500`}>
            <p className={`font-bold text-[#7F9B1D] ${compact ? 'text-[10px]' : 'text-sm'} flex items-center gap-2`}>
              <span className="truncate">— {quote.author}</span>
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

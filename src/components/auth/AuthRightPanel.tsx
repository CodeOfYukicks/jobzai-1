import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, TrendingUp, Sparkles, Clock, BarChart3 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface AuthRightPanelProps {
    variant: 'signup' | 'login';
}

interface FeatureCard {
    icon: React.ElementType;
    headline: string;
    subline: string;
    isHero?: boolean;
}

interface StatCard {
    icon: React.ElementType;
    text: string;
    value: string | number;
    isLive?: boolean;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Custom hook for slowly incrementing a number to create a "live" feel
 * Increments every 3-5 seconds with randomized interval
 */
function useIncrementingNumber(baseValue: number, minInterval = 3000, maxInterval = 5000): number {
    const [count, setCount] = useState(baseValue);

    useEffect(() => {
        const scheduleNext = () => {
            const delay = minInterval + Math.random() * (maxInterval - minInterval);
            return setTimeout(() => {
                setCount(c => c + 1);
                timeoutId = scheduleNext();
            }, delay);
        };

        let timeoutId = scheduleNext();
        return () => clearTimeout(timeoutId);
    }, [minInterval, maxInterval]);

    return count;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Cinematic film grain overlay
 * Uses SVG noise filter with very subtle opacity for premium feel
 */
function FilmGrain() {
    return (
        <>
            {/* SVG Filter Definition */}
            <svg className="absolute w-0 h-0">
                <defs>
                    <filter id="grain">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.8"
                            numOctaves="4"
                            stitchTiles="stitch"
                        />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                </defs>
            </svg>

            {/* Animated grain overlay */}
            <motion.div
                animate={{
                    x: [0, -5, 3, -2, 4, 0],
                    y: [0, 3, -4, 2, -3, 0],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute inset-0 pointer-events-none opacity-[0.035]"
                style={{
                    filter: 'url(#grain)',
                    width: '120%',
                    height: '120%',
                    top: '-10%',
                    left: '-10%',
                }}
            />
        </>
    );
}

/**
 * Soft radial glow behind the headline
 */
function HeadlineGlow() {
    return (
        <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none"
            style={{
                background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
            }}
        />
    );
}

/**
 * Glassmorphism feature card with optional hero styling
 */
function FeatureCardComponent({ card, index }: { card: FeatureCard; index: number }) {
    const Icon = card.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
            className={`
        relative rounded-2xl px-5 py-4 
        ${card.isHero
                    ? 'bg-white/[0.07] border border-white/[0.15] shadow-lg shadow-purple-500/5'
                    : 'bg-white/[0.04] border border-white/[0.08]'
                }
        backdrop-blur-xl
        transition-all duration-300
        hover:bg-white/[0.06] hover:border-white/[0.12]
      `}
        >
            <div className="flex items-start gap-4">
                <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
          ${card.isHero
                        ? 'bg-purple-500/25 shadow-inner shadow-purple-400/20'
                        : 'bg-purple-500/15'
                    }
        `}>
                    <Icon className={`w-5 h-5 ${card.isHero ? 'text-purple-200' : 'text-purple-300/90'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm mb-0.5 ${card.isHero ? 'text-white' : 'text-white/90'}`}>
                        {card.headline}
                    </p>
                    <p className="text-white/50 text-xs leading-relaxed">
                        {card.subline}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Stat card for login panel with live counter support
 */
function StatCardComponent({ stat, index }: { stat: StatCard; index: number }) {
    const Icon = stat.icon;
    const liveValue = useIncrementingNumber(
        typeof stat.value === 'number' ? stat.value : parseInt(stat.value) || 0
    );

    const displayValue = stat.isLive ? liveValue : stat.value;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
            className="
        flex items-center justify-between 
        bg-white/[0.04] backdrop-blur-xl 
        rounded-2xl px-5 py-4 
        border border-white/[0.08]
        transition-all duration-300
        hover:bg-white/[0.06] hover:border-white/[0.12]
      "
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-300/90" />
                </div>
                <span className="text-white/70 text-sm">{stat.text}</span>
            </div>
            <span
                className="text-white font-semibold text-lg tabular-nums"
                style={{ fontVariantNumeric: 'tabular-nums' }}
            >
                {displayValue}
            </span>
        </motion.div>
    );
}

/**
 * Social proof section with overlapping avatars and active indicator
 */
function SocialProof({ applicationCount }: { applicationCount: number }) {
    const avatarNames = ['Felix', 'Aneka', 'Leo', 'Sara', 'Max'];
    const activeIndex = 2; // Leo will appear "active"

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="flex items-center gap-5"
        >
            {/* Overlapping Avatars */}
            <div className="flex -space-x-3">
                {avatarNames.map((name, i) => (
                    <div
                        key={name}
                        className="relative"
                        style={{ zIndex: avatarNames.length - i }}
                    >
                        <img
                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${name}&backgroundColor=c0aede,b6e3f4,ffd5dc,d1f4d1,ffdfba`}
                            alt={name}
                            className={`
                w-10 h-10 rounded-full bg-white
                border-2 border-[#1a1a2e]
                ${i === activeIndex ? 'ring-2 ring-purple-400/50 ring-offset-2 ring-offset-[#1a1a2e]' : ''}
              `}
                        />
                        {/* Active indicator glow */}
                        {i === activeIndex && (
                            <div className="absolute inset-0 rounded-full bg-purple-400/20 blur-sm animate-pulse" />
                        )}
                    </div>
                ))}
            </div>

            {/* Text */}
            <div>
                <p className="text-white font-semibold text-sm">
                    Join <span className="text-purple-200">20,000+</span> job seekers
                </p>
                <p className="text-white/50 text-xs">
                    who found their competitive edge
                </p>
            </div>
        </motion.div>
    );
}

// ============================================================================
// CONTENT CONFIGURATIONS
// ============================================================================

const signupContent = {
    headline: {
        main: 'Stop the endless',
        accent: 'job search grind.',
    },
    subline: (count: number) => (
        <>
            While you're reading this, Cubbbe users have already sent{' '}
            <span className="text-white font-medium tabular-nums">{count}</span> applications.
        </>
    ),
    features: [
        {
            icon: Target,
            headline: 'While you wait, others are moving',
            subline: '847 applications sent in the last hour by people just like you.',
            isHero: true,
        },
        {
            icon: Zap,
            headline: 'Reclaim your evenings',
            subline: 'While you rest, AI sends applications tailored to your dream roles.',
        },
        {
            icon: TrendingUp,
            headline: 'Walk into interviews prepared',
            subline: '3x higher response rate when every message is written for you.',
        },
    ] as FeatureCard[],
};

const loginContent = {
    headline: {
        main: 'Your applications',
        accent: 'are waiting.',
    },
    subline: 'Pick up where you left off. Your AI-powered job search continues.',
    stats: [
        { icon: Sparkles, text: 'New matches since your last visit', value: 12, isLive: true },
        { icon: Clock, text: 'Applications sent this week', value: 47, isLive: true },
        { icon: BarChart3, text: 'Response rate', value: '89%', isLive: false },
    ] as StatCard[],
    quote: '"Consistency is key. Keep applying, you\'re closer than you think."',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AuthRightPanel({ variant }: AuthRightPanelProps) {
    // Live incrementing counter for "applications sent"
    const applicationCount = useIncrementingNumber(247, 3500, 5500);

    const isSignup = variant === 'signup';
    const content = isSignup ? signupContent : loginContent;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex w-[55%] flex-col items-center justify-center p-12 relative overflow-hidden"
        >
            {/* SVG Background */}
            <img
                src="/images/hero-bg.svg"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Film grain overlay */}
            <FilmGrain />

            {/* Ambient glow effects - slower, more subtle */}
            <motion.div
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.15, 0.2, 0.15],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.12, 0.16, 0.12],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-700/12 rounded-full blur-[130px]"
            />

            {/* Main Content */}
            <div className="relative z-10 max-w-lg w-full">
                {/* Headline Section */}
                <motion.div
                    initial={{ y: 25, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-10 relative"
                >
                    {/* Glow behind headline */}
                    <HeadlineGlow />

                    <h2 className="text-4xl lg:text-[2.75rem] font-bold text-white leading-[1.15] mb-4 relative">
                        {content.headline.main}
                        <br />
                        <span className="text-purple-200/90">
                            {content.headline.accent}
                        </span>
                    </h2>
                    <p className="text-white/60 text-lg leading-relaxed">
                        {isSignup
                            ? signupContent.subline(applicationCount)
                            : loginContent.subline
                        }
                    </p>
                </motion.div>

                {/* Cards Section */}
                <div className="space-y-3 mb-10">
                    {isSignup
                        ? signupContent.features.map((card, index) => (
                            <FeatureCardComponent key={index} card={card} index={index} />
                        ))
                        : loginContent.stats.map((stat, index) => (
                            <StatCardComponent key={index} stat={stat} index={index} />
                        ))
                    }
                </div>

                {/* Footer Section */}
                {isSignup ? (
                    <SocialProof applicationCount={applicationCount} />
                ) : (
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.9 }}
                        className="text-white/40 text-sm italic"
                    >
                        {loginContent.quote}
                    </motion.p>
                )}
            </div>
        </motion.div>
    );
}

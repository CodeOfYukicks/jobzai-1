import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// Feature data for the showcase
const showcaseFeatures = [
    {
        id: 'application-tracking',
        label: 'Application Tracking',
        headline: "Know exactly what's working.",
        subheadline: 'Track applications, monitor responses, and optimize your job search strategy with real-time insights.',
        videoPath: 'images/jobapplication.mp4',
    },
    {
        id: 'interview-prep',
        label: 'Interview Prep',
        headline: 'Practice with AI. Show up confident.',
        subheadline: 'Get role-specific questions, instant feedback, and structured preparation that actually works.',
        videoPath: 'images/interviewprep.mp4',
    },
    {
        id: 'mock-interview',
        label: 'Mock Interview',
        headline: "Train like it's the real thing.",
        subheadline: 'Live AI interviews with adaptive questions. Build muscle memory for high-stakes conversations.',
        videoPath: 'images/mockinterview.mp4',
    },
];

// Main Component with Horizontal Tabs
export default function ProductShowcaseSection() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const touchStartX = useRef<number>(0);
    const touchEndX = useRef<number>(0);

    const activeFeature = showcaseFeatures[activeIndex];

    // Load all video URLs from Firebase Storage
    useEffect(() => {
        const loadVideos = async () => {
            const storage = getStorage();
            const urls: Record<string, string> = {};

            for (const feature of showcaseFeatures) {
                try {
                    const videoStorageRef = ref(storage, feature.videoPath);
                    const url = await getDownloadURL(videoStorageRef);
                    urls[feature.id] = url;
                } catch (error) {
                    console.log(`Video not found: ${feature.videoPath}`, error);
                }
            }

            setVideoUrls(urls);
            setLoadingVideos(false);
        };

        loadVideos();
    }, []);

    // Reset video when active feature changes
    useEffect(() => {
        if (videoRef.current && videoUrls[activeFeature.id]) {
            videoRef.current.load();
            setIsPlaying(false);
        }
    }, [activeIndex, videoUrls, activeFeature.id]);

    // Handle play/pause
    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    // Auto-play on hover
    const handleMouseEnter = () => {
        setIsHovered(true);
        if (videoRef.current && !isPlaying) {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    // Touch swipe handlers for mobile
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback(() => {
        const swipeThreshold = 50;
        const diff = touchStartX.current - touchEndX.current;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - go to next
                setActiveIndex((prev) => Math.min(prev + 1, showcaseFeatures.length - 1));
            } else {
                // Swipe right - go to previous
                setActiveIndex((prev) => Math.max(prev - 1, 0));
            }
        }
    }, []);

    return (
        <section className="relative py-12 md:py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                {/* Dark rounded container */}
                <div
                    className="rounded-3xl md:rounded-[40px] px-4 md:px-8 lg:px-12 pt-12 md:pt-16 pb-12 md:pb-16"
                    style={{
                        background: 'linear-gradient(180deg, #0a0a0a 0%, #141414 100%)',
                    }}
                >
                    {/* Content Container */}
                    <div className="relative z-10">
                        {/* Simplified Tab Navigation - Scrollable on mobile */}
                        <div className="flex justify-center mb-8 md:mb-16 -mx-4 px-4 md:mx-0 md:px-0">
                            <div className="inline-flex items-center gap-4 md:gap-12 overflow-x-auto scrollbar-hide pb-2">
                                {showcaseFeatures.map((feature, index) => (
                                    <button
                                        key={feature.id}
                                        onClick={() => setActiveIndex(index)}
                                        className="relative py-2 group flex-shrink-0"
                                    >
                                        <span className={`text-xs md:text-base font-medium transition-colors duration-300 whitespace-nowrap ${activeIndex === index
                                            ? 'text-white'
                                            : 'text-white/40 hover:text-white/70'
                                            }`}>
                                            {feature.label}
                                        </span>
                                        {/* Animated Underline */}
                                        {activeIndex === index && (
                                            <motion.div
                                                layoutId="activeTabUnderline"
                                                className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-white rounded-full"
                                                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Feature Content with Animation */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeFeature.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                                className="flex flex-col items-center text-center touch-pan-y"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                {/* Headline */}
                                <h3
                                    className="text-2xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-6 leading-[1.1] tracking-tight px-2"
                                    style={{ fontFamily: 'Outfit, Inter, system-ui, sans-serif' }}
                                >
                                    {activeFeature.headline}
                                </h3>

                                {/* Subheadline */}
                                <p className="text-sm md:text-lg text-white/60 max-w-2xl mb-6 md:mb-14 leading-relaxed px-2">
                                    {activeFeature.subheadline}
                                </p>

                                {/* Video Container */}
                                <motion.div
                                    className="relative w-full max-w-5xl mx-auto cursor-pointer"
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={handlePlayPause}
                                    whileHover={{ scale: 1.005 }}
                                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                                >
                                    {/* Video Frame */}
                                    <div
                                        className="relative overflow-hidden transition-all duration-500"
                                        style={{
                                            boxShadow: isHovered
                                                ? '0 40px 80px -20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                                                : '0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                                            borderRadius: '24px',
                                        }}
                                    >
                                        {/* Loading State */}
                                        {loadingVideos && (
                                            <div className="aspect-video flex items-center justify-center bg-zinc-900">
                                                <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
                                            </div>
                                        )}

                                        {/* Video */}
                                        {!loadingVideos && videoUrls[activeFeature.id] && (
                                            <div className="relative aspect-video bg-zinc-900">
                                                <video
                                                    ref={videoRef}
                                                    loop
                                                    muted
                                                    playsInline
                                                    className="w-full h-full object-contain"
                                                    style={{ backgroundColor: '#0a0a0a' }}
                                                >
                                                    <source src={videoUrls[activeFeature.id]} type="video/mp4" />
                                                </video>

                                                {/* Play Button Overlay */}
                                                <motion.div
                                                    className="absolute inset-0 flex items-center justify-center"
                                                    initial={{ opacity: 1 }}
                                                    animate={{ opacity: isPlaying ? 0 : 1 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <motion.div
                                                        className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center backdrop-blur-sm"
                                                        style={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                            border: '1px solid rgba(255, 255, 255, 0.15)'
                                                        }}
                                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                                                    >
                                                        <Play className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" fill="white" />
                                                    </motion.div>
                                                </motion.div>
                                            </div>
                                        )}

                                        {/* Fallback when no video */}
                                        {!loadingVideos && !videoUrls[activeFeature.id] && (
                                            <div className="aspect-video flex items-center justify-center bg-zinc-900">
                                                <div className="text-center">
                                                    <div
                                                        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                                                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                                    >
                                                        <Play className="w-8 h-8 text-zinc-600" />
                                                    </div>
                                                    <p className="text-zinc-600 text-sm">Video coming soon</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Dots */}
                        <div className="flex justify-center gap-2 mt-8 md:mt-10">
                            {showcaseFeatures.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveIndex(index)}
                                    className="p-1"
                                    aria-label={`Go to ${showcaseFeatures[index].label}`}
                                >
                                    <motion.div
                                        className="w-2 h-2 rounded-full transition-colors duration-300"
                                        style={{
                                            backgroundColor: activeIndex === index
                                                ? 'rgba(255, 255, 255, 0.9)'
                                                : 'rgba(255, 255, 255, 0.2)',
                                        }}
                                        whileHover={{ scale: 1.5 }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

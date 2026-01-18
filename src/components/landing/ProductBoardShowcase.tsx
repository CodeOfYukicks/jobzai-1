import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { Icon } from '@iconify/react';

// Tab configuration with Iconify icons and vibrant background colors
const tabs = [
    {
        id: 'job-board',
        label: 'Job Board',
        iconName: 'solar:case-bold',
        screenshotPath: 'images/showcase/job-board.png',
        accentColor: '#9500FF', // Violet Ray
        bgColor: '#9500FF',
    },
    {
        id: 'campaigns',
        label: 'Campaigns',
        iconName: 'solar:rocket-bold',
        screenshotPath: 'images/showcase/campaigns.png',
        accentColor: '#B4E600', // Chartreuse
        bgColor: '#B4E600',
    },
    {
        id: 'application-tracking',
        label: 'Application Tracking',
        iconName: 'solar:chart-square-bold',
        screenshotPath: 'images/showcase/application-tracking.png',
        accentColor: '#2962FF', // Electric Sapphire
        bgColor: '#2962FF',
    },
    {
        id: 'job-tailored-resume',
        label: 'Job Tailored Resume',
        iconName: 'solar:document-bold',
        screenshotPath: 'images/showcase/job-tailored-resume.png',
        accentColor: '#FF8C00', // Dark Orange
        bgColor: '#FF8C00',
    },
    {
        id: 'ai-assistant',
        label: 'AI Assistant',
        iconName: 'solar:magic-stick-3-bold',
        screenshotPath: 'images/showcase/ai-assistant.png',
        accentColor: '#FF0059', // Hot Fuchsia
        bgColor: '#FF0059',
    },
    {
        id: 'interview-preparation',
        label: 'Interview Preparation',
        iconName: 'solar:notes-bold',
        screenshotPath: 'images/showcase/interview-preparation.png',
        accentColor: '#0FFFDB', // Aquamarine
        bgColor: '#0FFFDB',
    },
    {
        id: 'ai-mock-interview',
        label: 'AI Mock Interview',
        iconName: 'solar:videocamera-record-bold',
        screenshotPath: 'images/showcase/ai-mock-interview.png',
        accentColor: '#0AD2FF', // Sky Aqua
        bgColor: '#0AD2FF',
    },
    {
        id: 'ai-cover-letter',
        label: 'AI Cover Letter',
        iconName: 'solar:star-shine-bold',
        screenshotPath: 'images/showcase/ai-cover-letter.png',
        accentColor: '#9500FF', // Violet Ray
        bgColor: '#9500FF',
    },
];

export default function ProductBoardShowcase() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [screenshotUrls, setScreenshotUrls] = useState<Record<string, string>>({});
    const [loadingScreenshots, setLoadingScreenshots] = useState(true);
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number>(0);
    const touchEndX = useRef<number>(0);

    const activeTab = tabs[activeIndex];

    // Load all screenshot URLs from Firebase Storage
    useEffect(() => {
        const loadScreenshots = async () => {
            const storage = getStorage();
            const urls: Record<string, string> = {};

            for (const tab of tabs) {
                try {
                    const screenshotRef = ref(storage, tab.screenshotPath);
                    const url = await getDownloadURL(screenshotRef);
                    urls[tab.id] = url;
                } catch (error) {
                    console.log(`Screenshot not found: ${tab.screenshotPath}`, error);
                }
            }

            setScreenshotUrls(urls);
            setLoadingScreenshots(false);
        };

        loadScreenshots();
    }, []);

    // Scroll active tab into view
    useEffect(() => {
        if (tabsContainerRef.current) {
            const container = tabsContainerRef.current;
            const activeButton = container.children[activeIndex] as HTMLElement;
            if (activeButton) {
                const containerRect = container.getBoundingClientRect();
                const buttonRect = activeButton.getBoundingClientRect();
                const scrollLeft = buttonRect.left - containerRect.left + container.scrollLeft - (containerRect.width / 2) + (buttonRect.width / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [activeIndex]);

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
                setActiveIndex((prev) => Math.min(prev + 1, tabs.length - 1));
            } else {
                // Swipe right - go to previous
                setActiveIndex((prev) => Math.max(prev - 1, 0));
            }
        }
    }, []);

    return (
        <section className="relative py-8 md:py-12 bg-white overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                {/* Light container */}
                <div className="px-2 md:px-4 lg:px-8 pt-2 md:pt-4 pb-6 md:pb-8 overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="relative mb-6 md:mb-8">
                        {/* Fade gradients for scroll indication */}
                        <div className="absolute left-0 top-0 bottom-0 w-6 md:w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-6 md:w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                        {/* Scrollable tabs container */}
                        <div
                            ref={tabsContainerRef}
                            className="flex items-center justify-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-6 md:px-12 py-2"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {tabs.map((tab, index) => {
                                const isActive = activeIndex === index;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveIndex(index)}
                                        className={`
                                            relative flex items-center gap-1.5 md:gap-2 px-3.5 md:px-4 py-2 md:py-2.5 rounded-full
                                            text-[11px] md:text-[13px] font-medium whitespace-nowrap
                                            transition-all duration-200 flex-shrink-0
                                            ${isActive
                                                ? 'bg-white shadow-sm'
                                                : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
                                            }
                                        `}
                                        style={isActive ? {
                                            border: `1.5px solid ${tab.accentColor}`,
                                        } : {
                                            border: '1.5px solid transparent',
                                        }}
                                    >
                                        <Icon
                                            icon={tab.iconName}
                                            className="w-[14px] h-[14px] md:w-4 md:h-4"
                                            style={{ color: isActive ? tab.accentColor : 'currentColor' }}
                                        />
                                        <span className={isActive ? 'text-gray-800' : ''}>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Screenshot Content Area */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                            className="relative touch-pan-y"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            {/* Screenshot Container with soft colored border */}
                            <div
                                className="relative overflow-hidden rounded-[20px] md:rounded-[28px] bg-white"
                                style={{
                                    border: `3px solid ${activeTab.bgColor}`,
                                    boxShadow: `0 4px 24px -4px ${activeTab.bgColor}20`,
                                }}
                            >
                                {/* Screenshot area */}
                                <div className="relative aspect-[16/9] md:aspect-[16/8] bg-gray-50">
                                    {loadingScreenshots ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white">
                                            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                                        </div>
                                    ) : screenshotUrls[activeTab.id] ? (
                                        <motion.img
                                            src={screenshotUrls[activeTab.id]}
                                            alt={`${activeTab.label} screenshot`}
                                            className="w-full h-full object-cover object-top"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.25 }}
                                        />
                                    ) : (
                                        // Placeholder when no screenshot
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
                                            <Icon
                                                icon={activeTab.iconName}
                                                className="w-10 h-10 md:w-12 md:h-12 mb-3"
                                                style={{ color: activeTab.accentColor }}
                                            />
                                            <p className="text-sm font-medium text-gray-700">{activeTab.label}</p>
                                            <p className="text-xs text-gray-400 mt-1">Screenshot coming soon</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Dots */}
                    <div className="flex justify-center gap-1.5 mt-6 md:mt-8">
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveIndex(index)}
                                className="p-1.5"
                                aria-label={`Go to ${tab.label}`}
                            >
                                <motion.div
                                    className="w-2 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        backgroundColor: activeIndex === index
                                            ? tab.accentColor
                                            : 'rgba(0, 0, 0, 0.15)',
                                        boxShadow: activeIndex === index
                                            ? `0 0 8px ${tab.accentColor}`
                                            : 'none',
                                    }}
                                    whileHover={{ scale: 1.5 }}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Swipe hint for mobile */}
                    <p className="text-center text-gray-400 text-xs mt-4 md:hidden">
                        Swipe to explore features
                    </p>
                </div>
            </div>

            {/* CSS for hiding scrollbar */}
            <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </section>
    );
}

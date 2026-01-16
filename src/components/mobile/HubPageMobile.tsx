/**
 * HubPageMobile - Premium, Minimal, Mobile-Native Hub
 * Inspired by Apple Fitness / Linear / Arc
 * 
 * Design principles:
 * - One primary focus per screen
 * - Remove anything that doesn't help user act NOW
 * - Use spacing and typography instead of borders
 * - Calm dark background, subtle accent for CTA only
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    LayoutGrid,
    Briefcase,
    FileSearch,
    Mic,
    Calendar,
    ChevronRight,
    Clock,
    MapPin,
    Sparkles,
    Bell,
    CheckCircle2,
    Mail,
    RefreshCw,
    Trophy,
    SquareKanban,
    X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useOnboarding, TOUR_STEPS } from '../../contexts/OnboardingContext';
import { WelcomeTourModal } from '../onboarding';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { loadThemeFromStorage } from '../../lib/theme';
import MobileNavigation from './MobileNavigation';
import PageTransition from '../PageTransition';
import type { AppNotification } from '../../services/notificationCenterService';

// Primary actions - clear, actionable CTAs
const PRIMARY_ACTIONS = [
    {
        id: 'jobs',
        label: 'Browse Jobs',
        desc: 'Find opportunities that match you',
        href: '/jobs',
        icon: LayoutGrid,
        color: '#635BFF',
        isPrimary: true
    },
    {
        id: 'analyze',
        label: 'Analyze my CV',
        desc: 'Get AI-powered feedback',
        href: '/cv-analysis',
        icon: FileSearch,
        color: '#EC4899'
    },
    {
        id: 'create',
        label: 'Create my CV',
        desc: 'Build a professional resume',
        href: '/resume-builder?action=create',
        icon: Briefcase,
        color: '#10B981'
    },
    {
        id: 'interview',
        label: 'Practice Interview',
        desc: 'Prepare with AI mock sessions',
        href: '/mock-interview',
        icon: Mic,
        color: '#EF4444'
    },
    {
        id: 'track',
        label: 'Track Applications',
        desc: 'Monitor your job applications',
        href: '/applications',
        icon: Calendar,
        color: '#F59E0B'
    },
];

// Get time-based greeting
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

// Interface for upcoming interview
interface UpcomingInterview {
    id: string;
    company: string;
    position: string;
    date: Date;
    location?: string;
}

// Notification icon helper
const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
        case 'task_complete': return CheckCircle2;
        case 'email_reply':
        case 'campaign_reply': return Mail;
        case 'interview_reminder': return Calendar;
        case 'status_change': return RefreshCw;
        case 'achievement': return Trophy;
        case 'card_added': return SquareKanban;
        default: return Bell;
    }
};

const getNotificationColor = (type: AppNotification['type']) => {
    switch (type) {
        case 'task_complete': return '#8B5CF6';
        case 'email_reply': return '#10B981';
        case 'campaign_reply': return '#06B6D4';
        case 'interview_reminder': return '#3B82F6';
        case 'status_change': return '#F59E0B';
        case 'achievement': return '#EF4444';
        case 'card_added': return '#6366F1';
        default: return '#6B7280';
    }
};

const formatTimeAgo = (date: Date | { toDate: () => Date } | any): string => {
    try {
        const now = new Date();
        const notificationDate = date?.toDate ? date.toDate() : new Date(date);
        const diffMs = now.getTime() - notificationDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d`;
        return notificationDate.toLocaleDateString();
    } catch {
        return '';
    }
};

export default function HubPageMobile() {
    const { currentUser, userData } = useAuth();
    const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    const firstName = userData?.name?.split(' ')[0] || 'there';
    const { startTour, canShowTourButton, isTourActive } = useOnboarding();

    // Check if user is new (within last 24h)
    const isNewUser = new Date(userData?.createdAt || '').getTime() > Date.now() - 24 * 60 * 60 * 1000;

    // State
    const [savedJobs, setSavedJobs] = useState(0);
    const [upcomingInterview, setUpcomingInterview] = useState<UpcomingInterview | null>(null);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [transition, setTransition] = useState({
        isOpen: false,
        color: '',
        path: '',
        clickPosition: null as { x: number; y: number } | null
    });

    // Load logo
    useEffect(() => {
        const loadLogo = async () => {
            try {
                const storage = getStorage();
                const savedTheme = loadThemeFromStorage();
                const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const dark = savedTheme === 'dark' || (savedTheme === 'system' && systemIsDark);
                setIsDarkMode(dark);

                const logoRef = ref(storage, dark ? 'images/logo-only-dark.png' : 'images/logo-only.png');
                const url = await getDownloadURL(logoRef);
                setLogoUrl(url);
            } catch (error) {
                console.error('Error loading logo:', error);
            }
        };
        loadLogo();
    }, []);

    // Fetch saved jobs count
    useEffect(() => {
        if (!currentUser?.uid) return;
        const q = query(
            collection(db, `users/${currentUser.uid}/savedJobs`)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setSavedJobs(snapshot.size);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Fetch upcoming interview (within 48h)
    useEffect(() => {
        if (!currentUser?.uid) return;
        const now = new Date();
        const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const q = query(
            collection(db, `users/${currentUser.uid}/interviews`),
            where('status', '==', 'scheduled'),
            where('date', '>=', now),
            where('date', '<=', in48h),
            orderBy('date', 'asc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                setUpcomingInterview({
                    id: doc.id,
                    company: data.company || 'Interview',
                    position: data.position || '',
                    date: data.date?.toDate() || new Date(),
                    location: data.location
                });
            } else {
                setUpcomingInterview(null);
            }
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Determine primary focus action
    const getPrimaryFocus = () => {
        if (upcomingInterview) {
            const timeUntil = upcomingInterview.date.getTime() - Date.now();
            const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
            return {
                title: 'Prepare for your interview',
                subtitle: `${upcomingInterview.company}${upcomingInterview.position ? ` • ${upcomingInterview.position}` : ''}`,
                time: hoursUntil <= 2 ? 'Starting soon' : `In ${hoursUntil}h`,
                href: '/mock-interview',
                color: '#EF4444',
                cta: 'Practice now',
                gradient: 'from-red-500/10 to-orange-500/5'
            };
        }

        if (savedJobs > 0) {
            return {
                title: `Apply to ${Math.min(savedJobs, 3)} saved job${savedJobs > 1 ? 's' : ''}`,
                subtitle: 'High-match roles waiting for you',
                time: '~15 min',
                href: '/jobs',
                color: '#635BFF',
                cta: 'Start applying',
                gradient: 'from-indigo-500/10 to-purple-500/5'
            };
        }

        return {
            title: 'Find your next opportunity',
            subtitle: 'Discover roles that match your profile',
            time: '~5 min',
            href: '/jobs',
            color: '#635BFF',
            cta: 'Browse jobs',
            gradient: 'from-indigo-500/10 to-blue-500/5'
        };
    };

    const primaryFocus = getPrimaryFocus();

    // Handle navigation with transition
    const handleNavigate = (e: React.MouseEvent, href: string, color: string) => {
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const clickPosition = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        setTransition({
            isOpen: true,
            color,
            path: href,
            clickPosition
        });

        setTimeout(() => {
            navigate(href);
        }, 700);
    };

    // Handle notification click
    const handleNotificationClick = useCallback((notification: AppNotification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    }, [markAsRead, navigate]);

    // Get recent notifications (max 5)
    const recentNotifications = notifications.slice(0, 5);

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#333234] relative">
            <PageTransition
                {...transition}
                onAnimationComplete={() => { }}
            />

            {/* Welcome Tour Modal for new users */}
            <WelcomeTourModal />

            <motion.div
                animate={{ opacity: transition.isOpen ? 0 : 1 }}
                className="flex flex-col min-h-screen"
            >
                {/* Minimal Top Bar - Logo only */}
                <header className="flex items-center justify-center py-4 px-5">
                    {logoUrl ? (
                        <motion.img
                            src={logoUrl}
                            alt="Logo"
                            className="h-7 w-auto"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        />
                    ) : (
                        <div className="h-7 w-7 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" />
                    )}
                </header>

                {/* Main Content */}
                <main className="flex-1 px-5 pb-32 overflow-y-auto">
                    {/* Greeting Section - Desktop Style */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 mb-8"
                    >
                        <h1 className="text-[32px] font-bold leading-tight tracking-tight">
                            <span className="text-gray-900 dark:text-white">Hey </span>
                            <span className="text-[#635BFF] dark:text-[#a5a0ff]">{firstName}</span>
                            <span className="text-gray-900 dark:text-white"> 👋</span>
                        </h1>

                        {/* Tour prompt (visible for 24h after completion) */}
                        {canShowTourButton && !isTourActive && (
                            <motion.button
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                onClick={() => {
                                    startTour();
                                    if (TOUR_STEPS.length > 0) {
                                        navigate(TOUR_STEPS[0].path);
                                    }
                                }}
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium
                                    bg-gray-900 dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/15
                                    text-white
                                    transition-colors duration-150"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                                Take a quick tour
                            </motion.button>
                        )}
                    </motion.div>

                    {/* Quick Actions - Ultra Minimal Premium */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-10"
                    >
                        {/* Section Label */}
                        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                            Quick Actions
                        </p>

                        {/* Clean Action List */}
                        <div className="space-y-2">
                            {PRIMARY_ACTIONS.map((action, index) => (
                                <motion.button
                                    key={action.id}
                                    onClick={(e) => handleNavigate(e, action.href, action.color)}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.12 + index * 0.03 }}
                                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl 
                                        bg-white dark:bg-[#2b2a2c] 
                                        border border-gray-100 dark:border-[#3d3c3e]
                                        active:bg-gray-50 dark:active:bg-[#3d3c3e]
                                        transition-colors duration-150"
                                >
                                    {/* Simple Icon */}
                                    <action.icon
                                        className="w-5 h-5 text-gray-900 dark:text-white"
                                        strokeWidth={1.5}
                                    />

                                    {/* Label Only */}
                                    <span className="flex-1 text-left text-[15px] font-medium text-gray-900 dark:text-white">
                                        {action.label}
                                    </span>

                                    {/* Minimal Arrow */}
                                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Notifications Section */}
                    {recentNotifications.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Activity
                                    </h3>
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-[#635BFF]/10 dark:bg-[#635BFF]/20 
                                            text-[10px] font-bold text-[#635BFF] dark:text-[#a5a0ff]">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs font-medium text-gray-400 dark:text-gray-500 
                                            active:text-[#635BFF] transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Notification List */}
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {recentNotifications.map((notification, index) => {
                                        const Icon = getNotificationIcon(notification.type);
                                        const color = getNotificationColor(notification.type);

                                        return (
                                            <motion.div
                                                key={notification.id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -50 }}
                                                transition={{ delay: index * 0.03 }}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`group relative flex items-start gap-3 p-4 rounded-2xl cursor-pointer
                                                    ${notification.read
                                                        ? 'bg-gray-50 dark:bg-white/[0.03]'
                                                        : 'bg-white dark:bg-white/[0.06] shadow-sm border border-gray-100 dark:border-white/[0.06]'
                                                    }
                                                    active:scale-[0.98] transition-all duration-200`}
                                            >
                                                {/* Icon */}
                                                <div
                                                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                                                    style={{ backgroundColor: `${color}15` }}
                                                >
                                                    <Icon className="w-5 h-5" style={{ color }} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className={`text-[13px] font-semibold leading-tight ${notification.read
                                                            ? 'text-gray-600 dark:text-gray-400'
                                                            : 'text-gray-900 dark:text-white'
                                                            }`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="flex-shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                                                            {formatTimeAgo(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className={`mt-0.5 text-[12px] leading-relaxed line-clamp-2 ${notification.read
                                                        ? 'text-gray-400 dark:text-gray-500'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                        {notification.message}
                                                    </p>
                                                </div>

                                                {/* Unread indicator */}
                                                {!notification.read && (
                                                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#635BFF]" />
                                                )}

                                                {/* Swipe to delete indicator (visual only) */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-active:opacity-100
                                                        bg-gray-100 dark:bg-white/10 transition-opacity"
                                                >
                                                    <X className="w-3 h-3 text-gray-400" />
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}

                    {/* Optional Widget - Upcoming Interview (only if within 48h and not already in focus) */}
                    {upcomingInterview && !getPrimaryFocus().title.includes('interview') && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-8"
                        >
                            <button
                                onClick={(e) => handleNavigate(e, '/upcoming-interviews', '#3B82F6')}
                                className="w-full text-left active:scale-[0.98] transition-transform duration-200"
                            >
                                <div className="rounded-2xl bg-white dark:bg-[#1a1a1a] p-5 
                                    border border-gray-100 dark:border-gray-800/50"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 
                                            flex items-center justify-center flex-shrink-0"
                                        >
                                            <Calendar className="w-5 h-5 text-blue-500" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-blue-500 uppercase tracking-wide mb-1">
                                                Upcoming Interview
                                            </p>
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                                {upcomingInterview.company}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {upcomingInterview.date.toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </span>
                                                {upcomingInterview.location && (
                                                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                                        <MapPin className="w-3 h-3" />
                                                        {upcomingInterview.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-1" />
                                    </div>
                                </div>
                            </button>
                        </motion.div>
                    )}
                </main>
            </motion.div>

            {/* Mobile Bottom Navigation */}
            <MobileNavigation />
        </div>
    );
}

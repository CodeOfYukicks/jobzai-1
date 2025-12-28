/**
 * HubPageMobile - Mobile-native Hub layout
 * Inspired by Apple Fitness, Notion mobile, Linear mobile
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    LayoutGrid,
    Briefcase,
    FileSearch,
    Mic,
    ChevronRight,
    Sparkles,
    Target,
    CheckCircle2,
    Circle,
    Flame,
    Plus,
    X,
    Cloud,
    Clock,
    StickyNote,
    Heart,
    CircleDot,
    Eye,
    Quote,
    Settings2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMissions } from '../../contexts/MissionsContext';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import MobileTopBar from './MobileTopBar';
import MobileNavigation from './MobileNavigation';
import PageTransition from '../PageTransition';
import WeatherCard from '../hub/WeatherCard';
import TimeWidget from '../hub/TimeWidget';
import NoteWidget from '../hub/NoteWidget';
import HamsterWidget from '../hub/HamsterWidget';
import PressButtonWidget from '../hub/PressButtonWidget';
import EyeButtonWidget from '../hub/EyeButtonWidget';
import DailyMotivation from '../hub/DailyMotivation';

// Widget types for mobile
type MobileWidgetType = 'weather' | 'time' | 'note' | 'hamster' | 'pressButton' | 'eyeButton' | 'quote';

interface MobileWidget {
    id: string;
    type: MobileWidgetType;
}

// Widget catalog for mobile
const MOBILE_WIDGET_CATALOG: {
    type: MobileWidgetType;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
}[] = [
        { type: 'weather', name: 'Weather', description: 'Local conditions', icon: Cloud, color: '#22272B' },
        { type: 'time', name: 'Clock', description: 'Retro digital watch', icon: Clock, color: '#dddf8f' },
        { type: 'quote', name: 'Quote', description: 'Daily inspiration', icon: Quote, color: '#B7E219' },
        { type: 'note', name: 'Quick Note', description: 'Write notes', icon: StickyNote, color: '#D97706' },
        { type: 'hamster', name: 'Hamster', description: 'Motivational pet', icon: Heart, color: '#F97316' },
        { type: 'pressButton', name: 'Press Me', description: 'Satisfying button', icon: CircleDot, color: '#FF5A78' },
        { type: 'eyeButton', name: 'Eye Tracker', description: 'Following eyes', icon: Eye, color: '#3B82F6' },
    ];

// Default widgets for mobile
const DEFAULT_MOBILE_WIDGETS: MobileWidget[] = [
    { id: 'weather-1', type: 'weather' },
    { id: 'time-1', type: 'time' },
];

const STORAGE_KEY = 'mobileHubWidgetConfig';

// Quick actions configuration
const QUICK_ACTIONS = [
    { id: 'jobs', name: 'Job Board', href: '/jobs', icon: LayoutGrid, color: '#635BFF' },
    { id: 'applications', name: 'Applications', href: '/applications', icon: Briefcase, color: '#F59E0B' },
    { id: 'cv', name: 'Resume Lab', href: '/cv-analysis', icon: FileSearch, color: '#EC4899' },
    { id: 'interview', name: 'Mock Interview', href: '/mock-interview', icon: Mic, color: '#EF4444' },
];

// Widget content renderer
function WidgetContent({ type }: { type: MobileWidgetType }) {
    switch (type) {
        case 'weather': return <WeatherCard />;
        case 'time': return <TimeWidget />;
        case 'quote': return <DailyMotivation compact={true} />;
        case 'note': return <NoteWidget />;
        case 'hamster': return <HamsterWidget />;
        case 'pressButton': return <PressButtonWidget />;
        case 'eyeButton': return <EyeButtonWidget />;
        default: return null;
    }
}

export default function HubPageMobile() {
    const { currentUser, userData } = useAuth();
    const { missions, stats } = useMissions();
    const navigate = useNavigate();
    const firstName = userData?.name?.split(' ')[0] || 'there';

    const [totalApplications, setTotalApplications] = useState(0);
    const [transition, setTransition] = useState({
        isOpen: false,
        color: '',
        path: '',
        clickPosition: null as { x: number; y: number } | null
    });

    // Widget state
    const [widgets, setWidgets] = useState<MobileWidget[]>(DEFAULT_MOBILE_WIDGETS);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Load saved widget configuration
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setWidgets(parsed);
                }
            }
        } catch (e) {
            console.error('Error loading mobile widget config:', e);
        }
    }, []);

    // Save configuration
    const saveConfig = useCallback((newWidgets: MobileWidget[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
        } catch (e) {
            console.error('Error saving mobile widget config:', e);
        }
    }, []);

    // Add widget
    const addWidget = (type: MobileWidgetType) => {
        if (widgets.some(w => w.type === type)) return;
        const newWidget: MobileWidget = {
            id: `${type}-${Date.now()}`,
            type,
        };
        const newWidgets = [...widgets, newWidget];
        setWidgets(newWidgets);
        saveConfig(newWidgets);
        setIsGalleryOpen(false);
    };

    // Remove widget
    const removeWidget = (id: string) => {
        const newWidgets = widgets.filter(w => w.id !== id);
        setWidgets(newWidgets);
        saveConfig(newWidgets);
    };

    // Get available widgets (not already added)
    const availableWidgets = MOBILE_WIDGET_CATALOG.filter(
        catalog => !widgets.some(w => w.type === catalog.type)
    );

    // Fetch applications count
    useEffect(() => {
        if (!currentUser?.uid) return;
        const applicationsQuery = query(
            collection(db, `users/${currentUser.uid}/jobApplications`)
        );
        const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
            setTotalApplications(snapshot.size);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Calculate missions progress
    const completedMissions = missions.filter(m => m.status === 'completed').length;
    const totalMissions = missions.length;

    // Get next incomplete mission for Today's Focus
    const nextMission = missions.find(m => m.status !== 'completed');

    // Handle navigation with transition
    const handleNavigate = (e: React.MouseEvent, item: { href: string; color: string }) => {
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const clickPosition = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        setTransition({
            isOpen: true,
            color: item.color,
            path: item.href,
            clickPosition
        });

        setTimeout(() => {
            navigate(item.href);
        }, 700);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#1a1a1a] dark:to-[#1a1a1a] relative">
            {/* Page Transition */}
            <PageTransition
                {...transition}
                onAnimationComplete={() => { }}
            />

            <motion.div
                animate={{ opacity: transition.isOpen ? 0 : 1 }}
                className="flex flex-col min-h-screen"
            >
                {/* Mobile Top Bar */}
                <MobileTopBar title="Hub" />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
                    {/* Header with Greeting + Contextual Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Hey {firstName} 👋
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            You have {totalApplications} active application{totalApplications !== 1 ? 's' : ''}
                        </p>
                    </motion.div>

                    {/* Next Step Card - Premium, Subtle, Human */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6"
                    >
                        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#2b2a2c] p-5 border border-gray-100 dark:border-[#3d3c3e] shadow-sm">
                            {/* Subtle accent indicator */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#635BFF] opacity-80" />

                            <div className="relative flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Next step
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight mb-1">
                                        {nextMission ? nextMission.title : 'Apply to a role you saved'}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {nextMission ? nextMission.description : '2 roles waiting for you'}
                                    </p>
                                </div>

                                <div className="flex justify-end mt-1">
                                    <button
                                        onClick={(e) => handleNavigate(e, { href: '/jobs', color: '#635BFF' })}
                                        className="flex items-center gap-1.5 text-sm font-medium text-[#635BFF] hover:text-[#534bc9] active:opacity-70 transition-colors"
                                    >
                                        Start
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Missions Section - Compact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mb-6"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-[#635BFF]" />
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Daily Missions
                                </h3>
                            </div>
                            {stats && stats.currentStreak > 0 && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-500/20">
                                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                        {stats.currentStreak}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-100 dark:border-[#3d3c3e] overflow-hidden">
                            {missions.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No missions today
                                </div>
                            ) : (
                                <>
                                    {missions.slice(0, 3).map((mission, index) => {
                                        const isComplete = mission.status === 'completed';
                                        const progress = Math.min((mission.current / mission.target) * 100, 100);

                                        return (
                                            <div
                                                key={mission.id}
                                                className={`flex items-center gap-3 p-3.5 ${index < Math.min(missions.length - 1, 2) ? 'border-b border-gray-100 dark:border-[#3d3c3e]' : ''
                                                    }`}
                                            >
                                                {/* Status Icon */}
                                                {isComplete ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                                )}

                                                {/* Mission Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-medium ${isComplete
                                                        ? 'text-gray-400 dark:text-gray-500 line-through'
                                                        : 'text-gray-900 dark:text-white'
                                                        }`}>
                                                        {mission.title}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-[#635BFF]'}`}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${progress}%` }}
                                                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-semibold text-gray-400 tabular-nums">
                                                            {mission.current}/{mission.target}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Progress Summary */}
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-[#242325]">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                                        <span className="text-xs font-bold text-[#635BFF]">
                                            {completedMissions}/{totalMissions} complete
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6"
                    >
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Quick Actions
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            {QUICK_ACTIONS.map((action, index) => (
                                <motion.button
                                    key={action.id}
                                    onClick={(e) => handleNavigate(e, action)}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.25 + index * 0.05 }}
                                    className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white dark:bg-[#2b2a2c]
                    border border-gray-100 dark:border-[#3d3c3e]
                    active:scale-[0.97] transition-transform"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${action.color}15` }}
                                    >
                                        <action.icon className="w-6 h-6" style={{ color: action.color }} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                                        {action.name}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Widgets Section - Enhanced */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="mb-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Widgets
                            </h3>
                            <div className="flex items-center gap-2">
                                {isEditMode && widgets.length > 0 && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={() => setIsEditMode(false)}
                                        className="flex items-center justify-center w-7 h-7 rounded-full bg-[#635BFF] text-white"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                    </motion.button>
                                )}
                                {!isEditMode && widgets.length > 0 && (
                                    <button
                                        onClick={() => setIsEditMode(true)}
                                        className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                    >
                                        <Settings2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsGalleryOpen(true)}
                                    className="flex items-center justify-center w-7 h-7 rounded-full bg-[#635BFF]/10 text-[#635BFF]"
                                >
                                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Widget Carousel */}
                        {widgets.length === 0 ? (
                            <button
                                onClick={() => setIsGalleryOpen(true)}
                                className="w-full py-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700
                  flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500
                  active:bg-gray-50 dark:active:bg-gray-800/50 transition-colors"
                            >
                                <Plus className="w-6 h-6" />
                                <span className="text-sm font-medium">Add widgets</span>
                            </button>
                        ) : (
                            <div className="flex gap-3 overflow-x-auto py-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                                {widgets.map((widget) => (
                                    <div
                                        key={widget.id}
                                        className="snap-start flex-shrink-0 w-[160px] h-[160px] relative"
                                    >
                                        {/* Remove button in edit mode */}
                                        <AnimatePresence>
                                            {isEditMode && (
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    onClick={() => removeWidget(widget.id)}
                                                    className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-red-500 text-white
                            flex items-center justify-center shadow-lg"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                        <div className={`w-full h-full ${isEditMode ? 'pointer-events-none' : ''}`}>
                                            <WidgetContent type={widget.type} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </main>
            </motion.div>

            {/* Mobile Bottom Navigation */}
            <MobileNavigation />

            {/* Widget Gallery Sheet */}
            <AnimatePresence>
                {isGalleryOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-black/50 z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsGalleryOpen(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1a1a1a] rounded-t-3xl overflow-hidden"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                        >
                            {/* Handle */}
                            <div className="flex justify-center py-3">
                                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Add Widget
                                </h2>
                                <button
                                    onClick={() => setIsGalleryOpen(false)}
                                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                                >
                                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Widget Grid */}
                            <div className="px-5 pb-8 max-h-[60vh] overflow-y-auto">
                                {availableWidgets.length === 0 ? (
                                    <div className="py-8 text-center text-gray-400 dark:text-gray-500">
                                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                        <p className="text-sm font-medium">All widgets added!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {availableWidgets.map((widget) => {
                                            const Icon = widget.icon;
                                            return (
                                                <button
                                                    key={widget.type}
                                                    onClick={() => addWidget(widget.type)}
                                                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-[#2b2a2c]
                            border border-gray-100 dark:border-[#3d3c3e]
                            active:scale-[0.97] transition-transform"
                                                >
                                                    <div
                                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                        style={{ backgroundColor: `${widget.color}20` }}
                                                    >
                                                        <Icon className="w-6 h-6" style={{ color: widget.color }} />
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {widget.name}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                                            {widget.description}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

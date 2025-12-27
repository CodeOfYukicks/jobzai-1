import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Coins, ChevronRight, LogOut,
  Calendar, Briefcase, LayoutGrid, ScrollText, FileSearch,
  Clock, Mic, FileEdit, User, Lightbulb, LayoutDashboard,
  ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../hooks/useUserStats';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import type { Activity } from '../types/stats';
import PageTransition from '../components/PageTransition';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import EditableWidgetGrid from '../components/hub/EditableWidgetGrid';
import { loadThemeFromStorage } from '../lib/theme';
import MobileNavigation from '../components/mobile/MobileNavigation';
import MobileTopBar from '../components/mobile/MobileTopBar';

// Navigation groups matching sidebar structure
const navigationGroups = {
  apply: [
    { name: 'Job Board', desc: 'Browse and search job listings', href: '/jobs', icon: LayoutGrid, color: '#635BFF' },
    { name: 'Campaigns', desc: 'Manage your job search campaigns', href: '/campaigns', icon: ScrollText, color: '#8B5CF6' },
    { name: 'Resume Lab', desc: 'Analyze and optimize your CV', href: '/cv-analysis', icon: FileSearch, color: '#EC4899' },
  ],
  track: [
    { name: 'Application Tracking', desc: 'Monitor your job applications', href: '/applications', icon: Briefcase, color: '#F59E0B' },
    { name: 'Calendar', desc: 'View your schedule and interviews', href: '/calendar', icon: Calendar, color: '#10B981' },
  ],
  prepare: [
    { name: 'Interview Hub', desc: 'Prepare for upcoming interviews', href: '/upcoming-interviews', icon: Clock, color: '#3B82F6' },
    { name: 'Mock Interview', desc: 'Practice with AI simulations', href: '/mock-interview', icon: Mic, color: '#EF4444' },
    { name: 'Document Manager', desc: 'Manage your resumes and documents', href: '/resume-builder', icon: FileEdit, color: '#14B8A6' },
  ],
  improve: [
    { name: 'Professional Profile', desc: 'Build your professional identity', href: '/professional-profile', icon: User, color: '#8B5CF6' },
    { name: 'Recommendations', desc: 'Get personalized job suggestions', href: '/recommendations', icon: Lightbulb, color: '#F59E0B' },
    { name: 'Dashboard', desc: 'View analytics and insights', href: '/dashboard', icon: LayoutDashboard, color: '#10B981' },
  ],
};

export default function HubPage() {
  const { currentUser, userData } = useAuth();
  const { stats } = useUserStats();
  const [activities, setActivities] = useState<Activity[]>([]);
  const firstName = userData?.name?.split(' ')[0] || 'there';
  const navigate = useNavigate();
  const isNewUser = new Date(userData?.createdAt || '').getTime() > Date.now() - 24 * 60 * 60 * 1000;
  const [transition, setTransition] = useState({
    isOpen: false,
    color: '',
    path: '',
    clickPosition: null as { x: number; y: number } | null
  });
  const [totalApplications, setTotalApplications] = useState(0);
  const [activeInterviews, setActiveInterviews] = useState(0);
  const [logoUrlLight, setLogoUrlLight] = useState<string>('');
  const [logoUrlDark, setLogoUrlDark] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [successRate, setSuccessRate] = useState(0);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Load logos (light and dark)
  useEffect(() => {
    const loadLogos = async () => {
      try {
        const storage = getStorage();

        // Logo pour le mode clair
        const logoLightRef = ref(storage, 'images/logo-only.png');
        const lightUrl = await getDownloadURL(logoLightRef);
        setLogoUrlLight(lightUrl);

        // Logo pour le mode sombre
        const logoDarkRef = ref(storage, 'images/logo-only-dark.png');
        const darkUrl = await getDownloadURL(logoDarkRef);
        setLogoUrlDark(darkUrl);
      } catch (error) {
        console.error('Error loading logos:', error);
      }
    };

    loadLogos();
  }, []);

  // Initialize and track dark mode
  useEffect(() => {
    const updateThemeState = () => {
      const savedTheme = loadThemeFromStorage();
      const currentIsDark = document.documentElement.classList.contains('dark');

      if (savedTheme === 'system') {
        const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemIsDark);
      } else {
        const shouldBeDark = savedTheme === 'dark';
        setIsDarkMode(shouldBeDark);
      }
    };

    // Set initial state
    const savedTheme = loadThemeFromStorage();
    if (savedTheme === 'system') {
      const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemIsDark);
    } else {
      setIsDarkMode(savedTheme === 'dark');
    }

    // Listen to system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const savedTheme = loadThemeFromStorage();
      if (savedTheme === 'system') {
        updateThemeState();
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    // Listen to localStorage changes (when theme is changed in Settings or elsewhere)
    const handleStorageChange = () => {
      updateThemeState();
    };

    // Custom event for same-tab updates
    window.addEventListener('themechange', handleStorageChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener('themechange', handleStorageChange);
    };
  }, []);

  const handleCardClick = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    setTransition({
      isOpen: true,
      color: item.color || '#635BFF',
      path: item.href,
      clickPosition
    });

    const isMobile = window.innerWidth <= 768;
    setTimeout(() => {
      navigate(item.href);
    }, isMobile ? 700 : 900);
  };

  // Fetch activities
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, `users/${currentUser.uid}/activities`),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newActivities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as Activity[];
      setActivities(newActivities);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch applications and success rate
  useEffect(() => {
    if (!currentUser?.uid) return;
    const applicationsQuery = query(
      collection(db, `users/${currentUser.uid}/jobApplications`)
    );
    const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
      const applications = snapshot.docs.map(doc => doc.data());
      const total = applications.length;
      const successful = applications.filter(app => app.status === 'offer').length;
      setTotalApplications(total);
      const rate = total > 0 ? (successful / total) * 100 : 0;
      setSuccessRate(rate);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch interviews
  useEffect(() => {
    if (!currentUser?.uid) return;
    const interviewsQuery = query(
      collection(db, `users/${currentUser.uid}/interviews`),
      where('status', '==', 'scheduled')
    );
    const unsubscribe = onSnapshot(interviewsQuery, (snapshot) => {
      setActiveInterviews(snapshot.size);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#333234] dark:to-[#2b2a2c] relative pb-24 md:pb-0">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <PageTransition
        {...transition}
        onAnimationComplete={() => { }}
      />

      <motion.div
        animate={{ opacity: transition.isOpen ? 0 : 1 }}
        className="h-full"
      >
        {/* Mobile Top Bar */}
        <MobileTopBar title="Hub" />

        {/* Header - Slim & Premium (Desktop only) */}
        <header className="hidden md:block bg-white/70 dark:bg-[#242325]/70 backdrop-blur-xl border-b border-gray-100/80 dark:border-[#3d3c3e]/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 items-center h-12 lg:h-14">
              {/* Left - Credits */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#635BFF]/8 to-transparent dark:from-[#635BFF]/15 dark:to-transparent px-3 py-1.5 rounded-full w-fit border border-[#635BFF]/10 dark:border-[#635BFF]/20"
              >
                <Coins className="w-3.5 h-3.5 text-[#635BFF]" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userData?.credits ?? 0}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">cr</span>
              </motion.div>

              {/* Center - Logo */}
              <Link to="/" className="flex items-center justify-center hover:scale-105 transition-transform duration-200">
                {(isDarkMode ? logoUrlDark : logoUrlLight) ? (
                  <motion.img
                    src={isDarkMode ? logoUrlDark : logoUrlLight}
                    alt="Logo"
                    className="h-8 w-auto"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                ) : (
                  <div className="h-8 w-8 bg-gray-100 dark:bg-[#3d3c3e] animate-pulse rounded-full" />
                )}
              </Link>

              {/* Right - Sign Out */}
              <div className="flex justify-end">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 dark:text-gray-500 
                    hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-[#3d3c3e]/80 transition-all duration-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:py-14 pb-6">
          {/* Welcome - Mobile: Compact, Desktop: Full Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 md:mb-12"
          >
            {/* Mobile: Simple 2-line greeting */}
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold md:font-extrabold tracking-tight">
              <span className="text-gray-900 dark:text-gray-100">
                {isNewUser ? 'Welcome, ' : 'Hey '}
              </span>
              <span className="text-[#635BFF] dark:text-[#a5a0ff]">
                {firstName}
              </span>
              <span className="text-gray-900 dark:text-gray-100"> 👋</span>
            </h1>
            {/* Desktop only: Subtitle */}
            <p className="hidden md:block text-gray-500 dark:text-gray-400 text-base md:text-lg max-w-xl mt-2">
              {isNewUser ? "Let's start your job search journey together." : "Here's what's happening today."}
            </p>
          </motion.div>

          {/* Stats Row - Mobile: Horizontal Scroll, Desktop: Grid */}
          <div className="mb-6 md:mb-12 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="snap-start flex-shrink-0 min-w-[130px] md:min-w-0 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 relative overflow-hidden 
                  border border-gray-200/50 dark:border-white/10"
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-0.5">Applications</div>
                <div className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">{totalApplications}</div>
                <Briefcase className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-8 md:w-10 h-8 md:h-10 text-gray-200 dark:text-white/10" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="snap-start flex-shrink-0 min-w-[130px] md:min-w-0 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 relative overflow-hidden 
                  border border-gray-200/50 dark:border-white/10"
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-0.5">Success Rate</div>
                <div className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">{successRate.toFixed(0)}%</div>
                <LineChart className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-8 md:w-10 h-8 md:h-10 text-gray-200 dark:text-white/10" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="snap-start flex-shrink-0 min-w-[130px] md:min-w-0 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 relative overflow-hidden 
                  border border-gray-200/50 dark:border-white/10"
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-0.5">Interviews</div>
                <div className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white">{activeInterviews}</div>
                <Calendar className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-8 md:w-10 h-8 md:h-10 text-gray-200 dark:text-white/10" />
              </motion.div>
            </div>
          </div>

          {/* Quick Actions - Desktop only */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="hidden md:block mb-8 md:mb-12"
          >
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { name: 'Browse Jobs', href: '/jobs', icon: LayoutGrid, color: '#635BFF' },
                { name: 'My Applications', href: '/applications', icon: Briefcase, color: '#F59E0B' },
                { name: 'Resume Lab', href: '/cv-analysis', icon: FileSearch, color: '#EC4899' },
                { name: 'Mock Interview', href: '/mock-interview', icon: Mic, color: '#EF4444' },
              ].map((action, index) => (
                <motion.button
                  key={action.name}
                  onClick={(e) => handleCardClick(e, action)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full 
                    bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e]
                    hover:border-transparent hover:shadow-lg
                    transition-all duration-300 whitespace-nowrap flex-shrink-0"
                  style={{ ['--action-color' as any]: action.color }}
                >
                  <div
                    className="p-1.5 rounded-lg transition-colors duration-300"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <action.icon className="w-4 h-4" style={{ color: action.color }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                    {action.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 
                    opacity-0 group-hover:opacity-100 -ml-1 transition-all duration-300" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Editable Widgets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="relative mb-8 md:mb-16"
          >
            <EditableWidgetGrid />
          </motion.div>

          {/* Navigation Grid - Mobile: Collapsible, Desktop: Always visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-[#2b2a2c] rounded-2xl border border-gray-200 dark:border-[#3d3c3e] overflow-hidden"
          >
            {/* Mobile: Collapsible header */}
            <button
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="md:hidden w-full flex items-center justify-between p-4"
            >
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Features</h2>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showAllFeatures ? 'rotate-180' : ''}`} />
            </button>

            {/* Desktop: Always visible header */}
            <div className="hidden md:block p-6 pb-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-5">All Features</h2>
            </div>

            {/* Content - Mobile: Animated collapse, Desktop: Always visible */}
            <motion.div
              initial={false}
              animate={{
                height: showAllFeatures ? 'auto' : 0,
                opacity: showAllFeatures ? 1 : 0
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:!h-auto md:!opacity-100 overflow-hidden"
            >
              <div className="p-4 pt-0 md:p-6 md:pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                  {[...navigationGroups.apply, ...navigationGroups.track, ...navigationGroups.prepare, ...navigationGroups.improve].map((item, index) => (
                    <motion.button
                      key={item.name}
                      onClick={(e) => handleCardClick(e, item)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + index * 0.02 }}
                      className="group flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-xl 
                        bg-gray-50 dark:bg-[#3d3c3e]/50
                        hover:bg-gray-100 dark:hover:bg-[#3d3c3e]
                        transition-all duration-200 text-left"
                    >
                      <div
                        className="p-1.5 md:p-2 rounded-lg transition-transform duration-200 group-hover:scale-110"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <item.icon className="w-3.5 md:w-4 h-3.5 md:h-4" style={{ color: item.color }} />
                      </div>
                      <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {item.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </motion.div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
} 

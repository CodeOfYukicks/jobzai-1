import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Briefcase, Calendar, Coins,
  ChevronRight, LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding, TOUR_STEPS } from '../contexts/OnboardingContext';
import { WelcomeTourModal } from '../components/onboarding';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import PageTransition from '../components/PageTransition';
import EditableWidgetGrid from '../components/hub/EditableWidgetGrid';
import { trackStartTrial } from '../lib/trackingEvents';
import HubPageMobile from '../components/mobile/HubPageMobile';
import { useIsMobile } from '../hooks/useIsMobile';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { loadThemeFromStorage } from '../lib/theme';
import {
  FileText,
  MagnifyingGlass,
  Microphone,
  Kanban,
  Compass,
  LightbulbFilament,
} from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

// ─── Feature Cards Configuration ───────────────────────────────────────────
const featureCards: {
  title: string;
  description: string;
  href: string;
  icon: PhosphorIcon;
  color1: string;
  color2: string;
}[] = [
    {
      title: 'Create a CV',
      description: 'Build a professional resume from scratch',
      href: '/resume-builder/new',
      icon: FileText,
      color1: '#1E3A5F',
      color2: '#2A5298',
    },
    {
      title: 'Compare CV to a Job',
      description: 'Analyze how your CV matches a job posting',
      href: '/cv-analysis',
      icon: MagnifyingGlass,
      color1: '#0D7377',
      color2: '#14919B',
    },
    {
      title: 'Prepare an Interview',
      description: 'Get ready with AI-powered mock interviews',
      href: '/mock-interview',
      icon: Microphone,
      color1: '#C8442E',
      color2: '#E2703A',
    },
    {
      title: 'Track Applications',
      description: 'Monitor all your job applications in one place',
      href: '/applications',
      icon: Kanban,
      color1: '#1B7A4E',
      color2: '#2D9B6E',
    },
    {
      title: 'Browse Jobs',
      description: 'Discover job opportunities that match your profile',
      href: '/jobs',
      icon: Compass,
      color1: '#5B2C8E',
      color2: '#7B4FBF',
    },
    {
      title: 'Career Intelligence',
      description: 'Get personalized insights and recommendations',
      href: '/recommendations',
      icon: LightbulbFilament,
      color1: '#2C3E7B',
      color2: '#4A69BD',
    },
  ];

export default function HubPage() {
  const { currentUser, userData } = useAuth();
  const firstName = userData?.name?.split(' ')[0] || 'there';
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { startTour, canShowTourButton, isTourActive } = useOnboarding();

  const isNewUser = new Date(userData?.createdAt || '').getTime() > Date.now() - 24 * 60 * 60 * 1000;
  const [transition, setTransition] = useState({
    isOpen: false,
    color: '',
    path: '',
    clickPosition: null as { x: number; y: number } | null
  });
  const [totalApplications, setTotalApplications] = useState(0);
  const [activeInterviews, setActiveInterviews] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [logoUrlLight, setLogoUrlLight] = useState<string>('');
  const [logoUrlDark, setLogoUrlDark] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Track StartTrial for new users
  useEffect(() => {
    if (isNewUser && !sessionStorage.getItem('startTrialTracked')) {
      trackStartTrial();
      sessionStorage.setItem('startTrialTracked', 'true');
    }
  }, [isNewUser]);

  // Load logos
  useEffect(() => {
    const loadLogos = async () => {
      try {
        const storage = getStorage();
        const logoLightRef = ref(storage, 'images/logo-only.png');
        const lightUrl = await getDownloadURL(logoLightRef);
        setLogoUrlLight(lightUrl);
        const logoDarkRef = ref(storage, 'images/logo-only-dark.png');
        const darkUrl = await getDownloadURL(logoDarkRef);
        setLogoUrlDark(darkUrl);
      } catch (error) {
        console.error('Error loading logos:', error);
      }
    };
    loadLogos();
  }, []);

  // Theme tracking
  useEffect(() => {
    const updateThemeState = () => {
      const savedTheme = loadThemeFromStorage();
      if (savedTheme === 'system') {
        setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        setIsDarkMode(savedTheme === 'dark');
      }
    };
    updateThemeState();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (loadThemeFromStorage() === 'system') updateThemeState();
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    window.addEventListener('themechange', updateThemeState);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener('themechange', updateThemeState);
    };
  }, []);

  const handleCardClick = (e: React.MouseEvent, item: { href: string }) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTransition({
      isOpen: true,
      color: '#635BFF',
      path: item.href,
      clickPosition: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    });
    setTimeout(() => navigate(item.href), 900);
  };

  // Fetch applications and success rate
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = onSnapshot(
      query(collection(db, `users/${currentUser.uid}/jobApplications`)),
      (snapshot) => {
        const applications = snapshot.docs.map(doc => doc.data());
        const total = applications.length;
        const successful = applications.filter(app => app.status === 'offer').length;
        setTotalApplications(total);
        setSuccessRate(total > 0 ? (successful / total) * 100 : 0);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch interviews
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = onSnapshot(
      query(collection(db, `users/${currentUser.uid}/interviews`), where('status', '==', 'scheduled')),
      (snapshot) => setActiveInterviews(snapshot.size)
    );
    return () => unsubscribe();
  }, [currentUser]);

  // Mobile layout
  if (isMobile) {
    return <HubPageMobile />;
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // ─── Desktop Layout (standalone, no AuthLayout) ──────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#333234] dark:to-[#2b2a2c] relative">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <WelcomeTourModal />
      <PageTransition {...transition} onAnimationComplete={() => { }} />

      <motion.div animate={{ opacity: transition.isOpen ? 0 : 1 }} className="h-full relative">

        {/* ─── Slim Header ──────────────────────────────────────── */}
        <header className="bg-white/70 dark:bg-[#242325]/70 backdrop-blur-xl border-b border-gray-100/80 dark:border-[#3d3c3e]/50 sticky top-0 z-50">
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

        {/* ─── Main Content ─────────────────────────────────────── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

          {/* ─── Greeting ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
              <span className="text-gray-900 dark:text-gray-100">
                {isNewUser ? 'Welcome, ' : 'Hey '}
              </span>
              <span className="text-[#635BFF] dark:text-[#a5a0ff]">{firstName}</span>
              <span className="text-gray-900 dark:text-gray-100"> 👋</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mt-2">
              {isNewUser ? "Let's start your job search journey together." : "Here's what's happening today."}
            </p>

            {canShowTourButton && !isTourActive && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
                <button
                  onClick={() => { startTour(); if (TOUR_STEPS.length > 0) navigate(TOUR_STEPS[0].path); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                    bg-[#1a1a1c] hover:bg-[#252528] dark:bg-white/10 dark:hover:bg-white/15
                    text-white border border-[#2a2a2c] dark:border-white/20 transition-colors duration-150"
                >
                  <ChevronRight className="w-4 h-4" />
                  Take a quick tour
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* ─── KPI Stats Row ─────────────────────────────────── */}
          <div className="mb-10">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Applications', value: totalApplications, icon: Briefcase },
                { label: 'Success Rate', value: `${successRate.toFixed(0)}%`, icon: LineChart },
                { label: 'Interviews', value: activeInterviews, icon: Calendar },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-5 relative overflow-hidden 
                    border border-gray-200/50 dark:border-white/10"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-0.5">
                    {stat.label}
                  </div>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <stat.icon className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 text-gray-200 dark:text-white/10" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* ─── Feature Cards Grid (3x2) ──────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mb-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featureCards.map((card, index) => {
                const CardIcon = card.icon;
                return (
                  <motion.button
                    key={card.title}
                    onClick={(e) => handleCardClick(e, card)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.06 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative overflow-hidden text-left cursor-pointer
                      transition-shadow duration-300 ease-out
                      hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)]
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF] focus-visible:ring-offset-2"
                    style={{
                      background: `linear-gradient(135deg, ${card.color1}, ${card.color2})`,
                      borderRadius: 16,
                      minHeight: 180,
                      padding: 24,
                    }}
                  >
                    {/* Decorative icon — large, top-right, ghosted */}
                    <div className="absolute pointer-events-none" style={{ top: -10, right: -10 }}>
                      <CardIcon size={130} weight="duotone" color="white" style={{ opacity: 0.15 }} />
                    </div>

                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-between" style={{ minHeight: 132 }}>
                      {/* Functional icon — small, top-left */}
                      <div>
                        <CardIcon size={28} weight="duotone" color="white" />
                      </div>

                      {/* Text — bottom-left */}
                      <div>
                        <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.2rem', marginBottom: 4 }}>
                          {card.title}
                        </h3>
                        <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 400, fontSize: '0.85rem', lineHeight: 1.4 }}>
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* ─── Editable Widgets ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="relative"
          >
            <EditableWidgetGrid />
          </motion.div>

        </main>
      </motion.div>
    </div>
  );
}

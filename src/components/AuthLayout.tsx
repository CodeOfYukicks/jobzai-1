import { ReactNode, useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScrollText, Lightbulb, Settings, CreditCard, User, LogOut, Plus, FileSearch, LayoutGrid, Briefcase, Calendar, Clock, ChevronLeft, ChevronRight, Search, FileEdit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import '../styles/navigation.css';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import MobileNavigation from './mobile/MobileNavigation';
import ThemeSwitch from './ThemeSwitch';
import SidebarLink from './SidebarLink';
import { loadThemeFromStorage, applyTheme, type Theme } from '../lib/theme';

interface AuthLayoutProps {
  children: ReactNode;
}

// Interface for Interview type
interface Interview {
  id: string;
  date: string;
  time: string;
  type: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
}

// Interface for JobApplication type
interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  interviews?: Interview[];
}

// Interface for UpcomingInterview type that includes application info
interface UpcomingInterview {
  interview: Interview;
  applicationId: string;
  companyName: string;
  position: string;
}

// Définir les groupes de navigation
const navigationGroups = {
  apply: {
    main: [
      { name: 'Job Board', href: '/jobs', icon: LayoutGrid },
      { name: 'Campaigns', href: '/campaigns', icon: ScrollText },
      { name: 'Resume Lab', href: '/cv-analysis', icon: FileSearch },
      { name: 'Resume Builder', href: '/resume-builder', icon: FileEdit },
    ],
  },
  track: [
    { name: 'Application Tracking', href: '/applications', icon: Briefcase },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
  ],
  prepare: [
    { name: 'Interview Hub', href: '/upcoming-interviews', icon: Clock },
  ],
  improve: [
    { name: 'Professional Profile', href: '/professional-profile', icon: User },
    { name: 'Recommendations', href: '/recommendations', icon: Lightbulb },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ],
};

// Ajouter cette fonction pour calculer le pourcentage
const calculateProfileCompletion = (data: any) => {
  if (!data) return 0;
  
  const requiredFields = [
    // Personal Information
    'firstName',
    'lastName',
    'email',
    'gender',
    'location',
    'contractType',
    
    // Location & Mobility
    'willingToRelocate',
    'workPreference',
    'travelPreference',
    
    // Experience & Expertise
    'yearsOfExperience',
    'currentPosition',
    'skills',
    'tools',
    
    // Documents & Links
    'cvUrl',
    'linkedinUrl',
    
    // Professional Objectives
    'targetPosition',
    'targetSectors',
    'salaryExpectations',
    
    // Preferences & Priorities
    'workLifeBalance',
    'companyCulture',
    'preferredCompanySize'
  ];

  let completedFields = 0;

  requiredFields.forEach(field => {
    const value = data[field];
    if (Array.isArray(value)) {
      if (value.length > 0) completedFields++;
    } else if (typeof value === 'object' && value !== null) {
      if (Object.values(value).some(v => v !== '')) completedFields++;
    } else if (value) {
      completedFields++;
    }
  });

  return Math.round((completedFields / requiredFields.length) * 100);
};

function getFirstName(email: string | null | undefined): string {
  if (!email) return 'User';
  
  // Si l'email contient un point, on prend la première partie avant le point
  const username = email.split('@')[0];
  const nameParts = username.split('.');
  
  // Capitalize first letter and lowercase the rest
  return nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [credits, setCredits] = useState(0);
  const { currentUser, logout } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(
    location.pathname.startsWith('/cv-optimizer/') || 
    location.pathname === '/applications' || 
    location.pathname === '/jobs' ||
    location.pathname === '/upcoming-interviews' ||
    location.pathname === '/calendar' ||
    location.pathname.startsWith('/interview-prep/') ||
    location.pathname.startsWith('/ats-analysis/') ||
    location.pathname === '/resume-builder' ||
    (location.pathname.startsWith('/resume-builder/') && location.pathname.endsWith('/cv-editor')) ||
    location.pathname.startsWith('/notes/')
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
  const [isHoveringCollapsedSidebar, setIsHoveringCollapsedSidebar] = useState(false);

  useEffect(() => {
    // Auto-collapse sidebar on CV Optimizer edit pages, Applications page, Jobs page, Upcoming Interviews page, Calendar page, Interview Prep pages, Resume Builder, Resume Builder editor, and Notes for full-width editing
    if (location.pathname.startsWith('/cv-optimizer/') || 
        location.pathname === '/applications' || 
        location.pathname === '/jobs' ||
        location.pathname === '/upcoming-interviews' ||
        location.pathname === '/calendar' ||
        location.pathname.startsWith('/interview-prep/') ||
        location.pathname.startsWith('/ats-analysis/') ||
        location.pathname === '/resume-builder' ||
        (location.pathname.startsWith('/resume-builder/') && location.pathname.endsWith('/cv-editor')) ||
        location.pathname.startsWith('/notes/')) {
      setIsCollapsed(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = onSnapshot(
        doc(db, 'users', currentUser.uid),
        (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setCredits(userData.credits || 0);
            setProfileCompletion(calculateProfileCompletion(userData));
            setProfilePhoto(userData.profilePhoto || '');
          }
        }
      );
      return () => unsubscribe();
    }
  }, [currentUser]);

  // Charger le logo depuis Firebase Storage
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const storage = getStorage();
        const logoRef = ref(storage, 'images/logo-only.png');
        const url = await getDownloadURL(logoRef);
        setLogoUrl(url);
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };

    loadLogo();
  }, []);

  // Track scroll to add elevation to mobile header
  useEffect(() => {
    const onScroll = () => {
      setHasScrolled(window.scrollY > 4);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Resolve current route title for mobile header
  const getCurrentRouteTitle = (pathname: string): string => {
    // Flatten all navigation items including the nested apply structure
    const allItems = [
      ...navigationGroups.apply.main,
      ...navigationGroups.track,
      ...navigationGroups.prepare,
      ...navigationGroups.improve,
    ];
    const exact = allItems.find(item => item.href === pathname);
    if (exact) return exact.name;
    const starts = allItems.find(item => pathname.startsWith(item.href) && item.href !== '/');
    if (starts) return starts.name;
    if (pathname === '/' || pathname === '/dashboard') return 'Dashboard';
    return 'Jobzai';
  };
  const currentTitle = useMemo(() => getCurrentRouteTitle(location.pathname), [location.pathname]);
  const canGoBack = typeof window !== 'undefined' ? window.history.length > 1 : false;

  // Initialize theme using centralized theme system
  useEffect(() => {
    const updateThemeState = () => {
      const savedTheme = loadThemeFromStorage();
      
      if (savedTheme === 'system') {
        const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemIsDark);
      } else {
        setIsDarkMode(savedTheme === 'dark');
      }
    };
    
    updateThemeState();
    
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

  const handleThemeToggle = (checked: boolean) => {
    // Toggle between light and dark (ignore system mode for toggle)
    const currentTheme = loadThemeFromStorage();
    const newTheme: Theme = (currentTheme === 'dark' || isDarkMode) ? 'light' : 'dark';
    
    setIsDarkMode(newTheme === 'dark');
    applyTheme(newTheme);
    
    // Dispatch custom event to update other components
    window.dispatchEvent(new Event('themechange'));
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const userFirstName = getFirstName(currentUser?.email);
  const userInitial = userFirstName.charAt(0).toUpperCase();

  // Check if we need full height for certain pages (h-screen with internal scroll)
  // Note: Only /ats-analysis/:id/cv-editor needs full height, not /ats-analysis/:id
  const needsFullHeight = location.pathname === '/applications' || 
    location.pathname === '/jobs' || 
    location.pathname === '/upcoming-interviews' || 
    location.pathname === '/calendar' || 
    location.pathname.startsWith('/interview-prep/') || 
    location.pathname === '/resume-builder' ||
    (location.pathname.startsWith('/ats-analysis/') && location.pathname.endsWith('/cv-editor')) ||
    (location.pathname.startsWith('/resume-builder/') && location.pathname.endsWith('/cv-editor')) ||
    location.pathname.startsWith('/notes/');

  // Check if we need full width (no max-width constraint) - includes all ats-analysis pages, cv-analysis, professional-profile, and notes
  const needsFullWidth = needsFullHeight || 
    location.pathname.startsWith('/ats-analysis/') ||
    location.pathname === '/cv-analysis' ||
    location.pathname.startsWith('/resume-builder') ||
    location.pathname === '/professional-profile' ||
    location.pathname.startsWith('/notes/');

  return (
    <div className={`${needsFullHeight ? 'h-screen' : 'min-h-screen'} bg-gray-50 dark:bg-gray-900 flex flex-col overflow-x-hidden`}>
      {/* Sidebar desktop */}
      <div className={`hidden md:fixed md:inset-y-0 md:flex z-50 md:pl-3 lg:pl-4 md:py-3 transition-all duration-300 ${isCollapsed ? 'md:w-20 lg:w-20' : 'md:w-72 lg:w-80'}`}>
        <div 
          className="relative flex flex-col h-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl"
          onMouseEnter={() => setIsHoveringCollapsedSidebar(true)}
          onMouseLeave={() => setIsHoveringCollapsedSidebar(false)}
        >
          {/* Logo avec bouton collapse */}
          <div className="relative flex h-12 shrink-0 items-center justify-center border-b border-gray-200 dark:border-gray-700">
            {/* Logo centré */}
            <Link 
              to="/"
              className="flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className={`${isCollapsed ? 'h-8 w-8' : 'h-8 w-auto'}`} />
              ) : (
                <div className={`${isCollapsed ? 'h-8 w-8' : 'h-8 w-28'} bg-gray-100 animate-pulse rounded`} />
              )}
            </Link>
            
            {/* Bouton collapse - positionné à droite - désactivé sur /applications, /jobs, /upcoming-interviews, /calendar, /interview-prep, /ats-analysis, /resume-builder, resume-builder editor et notes */}
            {location.pathname !== '/applications' && location.pathname !== '/jobs' && location.pathname !== '/upcoming-interviews' && location.pathname !== '/calendar' && !location.pathname.startsWith('/interview-prep/') && !location.pathname.startsWith('/ats-analysis/') && location.pathname !== '/resume-builder' && !(location.pathname.startsWith('/resume-builder/') && location.pathname.endsWith('/cv-editor')) && !location.pathname.startsWith('/notes/') && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`absolute right-3 group flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                  text-gray-400 dark:text-gray-500 
                  hover:text-gray-600 dark:hover:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-700/50
                  active:scale-95`}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                ) : (
                  <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                )}
              </button>
            )}

            {/* Bouton collapse pour /applications, /jobs, /upcoming-interviews, /calendar, /interview-prep, /ats-analysis, /resume-builder, resume-builder editor et notes - visible quand expanded */}
            {(location.pathname === '/applications' || location.pathname === '/jobs' || location.pathname === '/upcoming-interviews' || location.pathname === '/calendar' || location.pathname.startsWith('/interview-prep/') || location.pathname.startsWith('/ats-analysis/') || location.pathname === '/resume-builder' || (location.pathname.startsWith('/resume-builder/') && location.pathname.endsWith('/cv-editor')) || location.pathname.startsWith('/notes/')) && !isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className={`absolute right-3 group flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                  text-gray-400 dark:text-gray-500 
                  hover:text-gray-600 dark:hover:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-700/50
                  active:scale-95`}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </button>
            )}
          </div>

          {/* Bouton flottant d'expansion - apparaît au hover sur sidebar compacte pour /applications, /jobs, /upcoming-interviews, /calendar, /interview-prep, /ats-analysis, /resume-builder, resume-builder editor et notes */}
          <AnimatePresence>
            {isCollapsed && 
             isHoveringCollapsedSidebar && 
             (location.pathname === '/applications' || location.pathname === '/jobs' || location.pathname === '/upcoming-interviews' || location.pathname === '/calendar' || location.pathname.startsWith('/interview-prep/') || location.pathname.startsWith('/ats-analysis/') || location.pathname === '/resume-builder' || (location.pathname.startsWith('/resume-builder/') && location.pathname.endsWith('/cv-editor')) || location.pathname.startsWith('/notes/')) && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsCollapsed(false)}
                className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-20
                  w-8 h-8 rounded-full 
                  bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
                  border-2 border-purple-500/20 dark:border-purple-400/20
                  shadow-lg hover:shadow-xl
                  flex items-center justify-center
                  hover:scale-110 active:scale-95
                  transition-all duration-200"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Navigation principale - flex-1 pour prendre l'espace disponible */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <nav className="p-2 space-y-2">
              {/* APPLY Section */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    APPLY
                  </p>
                )}
                
                {/* Jobs */}
                {navigationGroups.apply.main.map((item) => (
                  <SidebarLink
                    key={item.name}
                    name={item.name}
                    href={item.href}
                    icon={item.icon}
                    isCollapsed={isCollapsed}
                    isHovered={isHovered}
                    onMouseEnter={setIsHovered}
                    onMouseLeave={() => setIsHovered(null)}
                  />
                ))}
              </div>

              {/* TRACK Section */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    TRACK
                  </p>
                )}
                {navigationGroups.track.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                    className={`group flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-[13px] font-medium rounded-xl 
                      transition-all duration-200 relative overflow-hidden
                      ${location.pathname === item.href
                        ? 'bg-gradient-to-r from-purple-600/10 to-indigo-600/10 text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {/* Hover Effect */}
                    {isHovered === item.name && (
                      <motion.div
                        layoutId="hoverEffect"
                        className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    
                    <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 flex-1'}`}>
                      <item.icon className={`h-5 w-5 transition-colors
                        ${location.pathname === item.href 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`} 
                      />
                      {!isCollapsed && (
                        <span className="flex-1">{item.name}</span>
                      )}
                    </div>

                    {location.pathname === item.href && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 
                          bg-gradient-to-b from-purple-600 to-indigo-600 rounded-r-full"
                      />
                    )}
                  </Link>
                ))}
              </div>

              {/* PREPARE Section */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    PREPARE
                  </p>
                )}
                {navigationGroups.prepare.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                    className={`group flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-[13px] font-medium rounded-xl 
                      transition-all duration-200 relative overflow-hidden
                      ${location.pathname === item.href
                        ? 'bg-gradient-to-r from-purple-600/10 to-indigo-600/10 text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {/* Hover Effect */}
                    {isHovered === item.name && (
                      <motion.div
                        layoutId="hoverEffect"
                        className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    
                    <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 flex-1'}`}>
                      <item.icon className={`h-5 w-5 transition-colors
                        ${location.pathname === item.href 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`} 
                      />
                      {!isCollapsed && (
                        <span className="flex-1">{item.name}</span>
                      )}
                    </div>

                    {location.pathname === item.href && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 
                          bg-gradient-to-b from-purple-600 to-indigo-600 rounded-r-full"
                      />
                    )}
                  </Link>
                ))}
              </div>

              {/* IMPROVE Section */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    IMPROVE
                  </p>
                )}
                {navigationGroups.improve.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                    className={`group flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-[13px] font-medium rounded-xl 
                      transition-all duration-200 relative overflow-hidden
                      ${location.pathname === item.href
                        ? 'bg-gradient-to-r from-purple-600/10 to-indigo-600/10 text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {/* Hover Effect */}
                    {isHovered === item.name && (
                      <motion.div
                        layoutId="hoverEffect"
                        className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    
                    <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 flex-1'}`}>
                      <item.icon className={`h-5 w-5 transition-colors
                        ${location.pathname === item.href 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`} 
                      />
                      {!isCollapsed && (
                        <span className="flex-1">{item.name}</span>
                      )}
                    </div>

                    {location.pathname === item.href && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 
                          bg-gradient-to-b from-purple-600 to-indigo-600 rounded-r-full"
                      />
                    )}
                  </Link>
                ))}
              </div>

              {/* Profile Completion Alert si < 90% */}
              {!isCollapsed && profileCompletion < 90 && (
                <div className="mt-2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 
                      dark:from-amber-900/20 dark:to-amber-800/20 p-2.5"
                  >
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-amber-900 dark:text-amber-100">
                          Profile Completion
                        </span>
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-100">
                          {profileCompletion}%
                        </span>
                      </div>

                      {/* Barre de progression */}
                      <div className="h-1 bg-amber-200/50 dark:bg-amber-700/30 rounded-full overflow-hidden mb-2">
                        <motion.div 
                          className="h-full bg-amber-500 dark:bg-amber-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${profileCompletion}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>

                      <Link
                        to="/professional-profile"
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-900 
                          dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-300 
                          transition-colors"
                      >
                        Complete Profile
                        <svg 
                          className="w-3 h-3" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 5l7 7-7 7" 
                          />
                        </svg>
                      </Link>
                    </div>
                  </motion.div>
                </div>
              )}
            </nav>
          </div>

          {/* Section du bas - flex-shrink-0 pour taille fixe */}
          <div className="flex-shrink-0">
            {/* Credits Card - Premium Design */}
            {!isCollapsed ? (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 p-3.5 shadow-premium-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-0.5"
                >
                  {/* Mesh gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
                  
                  {/* Cercles décoratifs animés avec glow */}
                  <motion.div
                    className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/15 blur-xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.15, 0.25, 0.15],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-indigo-400/10 blur-2xl"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  />
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/5 blur-md" />
                  
                  {/* Effet de brillance animé */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "linear",
                    }}
                    style={{ transform: 'skewX(-20deg)' }}
                  />
                  
                  <div className="relative z-10">
                    {/* Montant des crédits - Typographie premium */}
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <motion.span
                        key={credits}
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="text-2xl font-bold text-white tracking-tight"
                      >
                        {credits.toLocaleString()}
                      </motion.span>
                      <span className="text-[10px] font-medium text-white/80 tracking-wider uppercase">
                        credits
                      </span>
                    </div>

                    {/* Barre de progression premium avec glow */}
                    <div className="relative h-0.5 bg-white/15 rounded-full overflow-hidden mb-2.5 backdrop-blur-sm">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 blur-sm"
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <motion.div
                        className="h-full bg-gradient-to-r from-white/60 to-white/90 rounded-full shadow-lg shadow-white/50"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((credits / 500) * 100, 100)}%` }}
                        transition={{
                          duration: 0.8,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      />
                    </div>

                    {/* Bouton Add More Credits - Glassmorphism premium */}
                    <Link
                      to="/billing"
                      className="group/button relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg
                        backdrop-blur-md bg-white/10 border border-white/20
                        hover:bg-white/20 hover:border-white/30
                        active:scale-[0.98]
                        transition-all duration-300 ease-out
                        overflow-hidden"
                    >
                      {/* Effet de brillance au hover */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '200%' }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        style={{ transform: 'skewX(-20deg)' }}
                      />
                      
                      <div className="relative flex items-center justify-center w-4 h-4 rounded-full bg-white/20 
                        group-hover/button:bg-white/30 group-hover/button:scale-110
                        transition-all duration-300">
                        <Plus className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-[10px] font-semibold text-white/95 tracking-wide">
                        Add More Credits
                      </span>
                    </Link>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link
                    to="/billing"
                    className="group relative flex items-center justify-center w-full p-2.5 rounded-lg
                      bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700
                      hover:from-purple-500 hover:via-purple-600 hover:to-indigo-600
                      shadow-lg hover:shadow-xl hover:shadow-purple-500/30
                      hover:-translate-y-0.5 active:translate-y-0
                      transition-all duration-300 ease-out
                      overflow-hidden"
                    title={`${credits.toLocaleString()} credits`}
                  >
                    {/* Effet de brillance au hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '200%' }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      style={{ transform: 'skewX(-20deg)' }}
                    />
                    
                    <CreditCard className="relative z-10 h-4 w-4 text-white group-hover:scale-110 transition-transform duration-300" />
                    
                    {/* Badge avec nombre de crédits au hover */}
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="absolute -top-1 -right-1 z-20 px-1.5 py-0.5 rounded-full
                        bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm
                        border border-white/50
                        shadow-lg"
                    >
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        {credits > 999 ? `${(credits / 1000).toFixed(1)}k` : credits}
                      </span>
                    </motion.div>
                  </Link>
                </motion.div>
              </div>
            )}

            {/* User Profile */}
            <div className={`${isCollapsed ? 'p-2' : 'p-2'} border-t border-gray-200 dark:border-gray-700`}>
              <div className="relative z-20">
                <div className={`${!isCollapsed ? 'flex items-center justify-between gap-2.5' : ''}`}>
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={`w-full group ${isCollapsed ? 'p-2 justify-center' : 'p-2'} rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 
                      transition-all duration-200 flex items-center ${isCollapsed ? 'flex-col' : ''} ${!isCollapsed ? 'flex-1' : ''}`}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-2.5'}`}>
                      <div className="relative">
                        <div className={`${isCollapsed ? 'h-9 w-9' : 'h-9 w-9'} rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 
                          flex items-center justify-center shadow-lg shadow-purple-600/20 overflow-hidden`}>
                          {profilePhoto ? (
                            <img 
                              src={profilePhoto} 
                              alt={userFirstName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm font-medium">
                              {userInitial}
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 
                          border-2 border-white dark:border-gray-800" />
                      </div>
                      {!isCollapsed && (
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">
                            {userFirstName}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {currentUser?.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                  {!isCollapsed && (
                    <ThemeSwitch
                      checked={isDarkMode}
                      onChange={handleThemeToggle}
                      size={12}
                      widthEm={4.8}
                    />
                  )}
                </div>

                {/* Menu déroulant */}
                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute bottom-full ${isCollapsed ? 'left-0 w-48' : 'left-0 w-full'} mb-2 bg-white dark:bg-gray-800 
                        rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50`}
                    >
                      <div className="py-1">
                        <Link
                          to="/settings"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 
                            hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                        <Link
                          to="/billing"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 
                            hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <CreditCard className="h-4 w-4" />
                          Billing
                        </Link>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 
                            hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Top App Bar */}
      <div
        className={`sticky top-0 z-30 md:hidden transition-shadow ${
          hasScrolled ? 'shadow-sm' : ''
        } bg-white/75 dark:bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60`}
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}
      >
        <div className="flex items-center justify-between h-[56px] px-4">
          <div className="flex items-center gap-2">
            <button
              aria-label="Go back"
              onClick={() => (canGoBack ? navigate(-1) : navigate('/'))}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              {logoUrl && <img src={logoUrl} alt="Logo" className="h-7 w-auto opacity-90" />}
              <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                {currentTitle}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              aria-label="Search"
              className="inline-flex items-center justify-center h-9 w-9 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              aria-label="Open profile"
              className="inline-flex items-center justify-center h-9 w-9 rounded-full overflow-hidden ring-1 ring-gray-200/70 dark:ring-gray-700/60 bg-gray-100/50 dark:bg-gray-800/60 active:scale-95 transition"
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt={userFirstName} className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col flex-1 min-h-0 transition-all duration-300 overflow-x-hidden ${isCollapsed ? 'md:pl-24 lg:pl-24' : 'md:pl-[19rem] lg:pl-[21rem]'}`}>
        <main className="flex-1 min-h-0 flex flex-col">
          <div className={`${needsFullHeight ? 'h-full flex flex-col flex-1 min-h-0 pt-2 md:pt-0 pb-0' : 'pt-6 md:py-6 pb-6'}`}>
            {needsFullWidth ? (
              // Mode pleine largeur pour Applications, Jobs, Professional Profile, Upcoming Interviews, Calendar, Interview Prep et ATS Analysis
              <div className={needsFullHeight ? "h-full flex flex-col flex-1 min-h-0 overflow-hidden" : ""}>{children}</div>
            ) : (
              // Mode normal avec max-width pour les autres pages
              <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Wrapper pour le contenu principal avec fond blanc */}
                <div className="md:bg-white md:dark:bg-gray-800 md:rounded-xl md:shadow-sm overflow-hidden">
                  {children}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MobileNavigation disabled for now - will revisit responsive mode later */}
      {/* {location.pathname !== '/applications' && <MobileNavigation />} */}
      
    </div>
  );
}

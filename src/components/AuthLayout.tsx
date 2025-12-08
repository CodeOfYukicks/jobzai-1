import { ReactNode, useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScrollText, Lightbulb, User, Plus, FileSearch, LayoutGrid, Briefcase, Calendar, Clock, ChevronLeft, ChevronRight, Search, FileEdit, Mic, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from '@/contexts/ToastContext';
import '../styles/navigation.css';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import SidebarLink from './SidebarLink';
import TopBar from './TopBar';
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
      { name: 'AutoPilot', href: '/campaigns', icon: ScrollText },
      { name: 'Campaigns', href: '/campaigns-auto', icon: Target },
      { name: 'Resume Lab', href: '/cv-analysis', icon: FileSearch },
    ],
  },
  track: [
    { name: 'Application Tracking', href: '/applications', icon: Briefcase },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
  ],
  prepare: [
    { name: 'Interview Hub', href: '/upcoming-interviews', icon: Clock },
    { name: 'Mock Interview', href: '/mock-interview', icon: Mic },
    { name: 'Document Manager', href: '/resume-builder', icon: FileEdit },
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

// Top bar height constant
const TOP_BAR_HEIGHT = 48; // h-12 = 48px

export default function AuthLayout({ children }: AuthLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState<'free' | 'standard' | 'premium'>('free');
  const { currentUser, logout } = useAuth();
  const [logoUrlLight, setLogoUrlLight] = useState<string>('');
  const [logoUrlDark, setLogoUrlDark] = useState<string>('');
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(
    location.pathname.startsWith('/cv-optimizer/') || 
    location.pathname === '/applications' || 
    location.pathname === '/jobs' ||
    location.pathname === '/upcoming-interviews' ||
    location.pathname === '/mock-interview' ||
    location.pathname === '/calendar' ||
    location.pathname === '/campaigns-auto' ||
    location.pathname.startsWith('/interview-prep/') ||
    location.pathname.startsWith('/ats-analysis/') ||
    location.pathname === '/resume-builder' ||
    (location.pathname.startsWith('/resume-builder/') && location.pathname.endsWith('/cv-editor')) ||
    location.pathname.startsWith('/notes/')
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);

  useEffect(() => {
    // Auto-collapse sidebar on CV Optimizer edit pages, Applications page, Jobs page, Upcoming Interviews page, Mock Interview page, Calendar page, Interview Prep pages, Resume Builder, Resume Builder editor, Campaigns Auto, and Notes for full-width editing
    if (location.pathname.startsWith('/cv-optimizer/') || 
        location.pathname === '/applications' || 
        location.pathname === '/jobs' ||
        location.pathname === '/upcoming-interviews' ||
        location.pathname === '/mock-interview' ||
        location.pathname === '/calendar' ||
        location.pathname === '/campaigns-auto' ||
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
            setUserPlan(userData.plan || 'free');
            setProfileCompletion(calculateProfileCompletion(userData));
            setProfilePhoto(userData.profilePhoto || '');
          }
        }
      );
      return () => unsubscribe();
    }
  }, [currentUser]);

  // Charger les logos (light et dark) depuis Firebase Storage
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
      const currentIsDark = document.documentElement.classList.contains('dark');
      
      // Only apply theme if it's different from current state to avoid unnecessary changes
      // This prevents overriding the theme set by AuthContext
      if (savedTheme === 'system') {
        const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (currentIsDark !== systemIsDark) {
          applyTheme(savedTheme);
        }
        setIsDarkMode(systemIsDark);
      } else {
        const shouldBeDark = savedTheme === 'dark';
        if (currentIsDark !== shouldBeDark) {
          applyTheme(savedTheme);
        }
        setIsDarkMode(shouldBeDark);
      }
    };
    
    // Don't update immediately - let AuthContext load theme first
    // Only update state for UI display
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

  const handleThemeToggle = async (checked: boolean) => {
    // Toggle between light and dark (ignore system mode for toggle)
    const currentTheme = loadThemeFromStorage();
    const newTheme: Theme = (currentTheme === 'dark' || isDarkMode) ? 'light' : 'dark';
    
    setIsDarkMode(newTheme === 'dark');
    applyTheme(newTheme);
    
    // Save to Firestore if user is logged in
    if (currentUser?.uid) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        await updateDoc(doc(db, 'users', currentUser.uid), {
          theme: newTheme,
          settingsUpdatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving theme to Firestore:', error);
        // Don't show error to user, localStorage is enough for persistence
      }
    }
    
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
    location.pathname === '/mock-interview' ||
    location.pathname === '/calendar' || 
    location.pathname === '/campaigns-auto' ||
    location.pathname.startsWith('/interview-prep/') || 
    location.pathname === '/resume-builder' ||
    location.pathname === '/cv-analysis' ||
    location.pathname === '/recommendations' ||
    (location.pathname.startsWith('/ats-analysis/') && location.pathname.endsWith('/cv-editor')) ||
    (location.pathname.startsWith('/resume-builder/') && location.pathname.endsWith('/cv-editor')) ||
    location.pathname.startsWith('/notes/');

  // Check if we are in "Builder Mode" (flush sidebar, no floating)
  const isBuilderMode = location.pathname.startsWith('/resume-builder') || 
    location.pathname.startsWith('/notes/');

  // Check if we need full width (no max-width constraint) - includes all ats-analysis pages, cv-analysis, professional-profile, campaigns-auto, and notes
  const needsFullWidth = needsFullHeight || 
    location.pathname.startsWith('/ats-analysis/') ||
    location.pathname === '/cv-analysis' ||
    location.pathname.startsWith('/resume-builder') ||
    location.pathname === '/professional-profile' ||
    location.pathname === '/campaigns' ||
    location.pathname === '/campaigns-auto' ||
    location.pathname === '/recommendations' ||
    location.pathname.startsWith('/notes/');

  // Pages that should not be wrapped in a white card so they inherit the layout background
  const isPlainBackground = location.pathname === '/recommendations' || location.pathname === '/recommendations-legacy';

  // Sidebar width values
  const sidebarExpandedWidth = 256; // 16rem = 256px
  const sidebarCollapsedWidth = 72; // ~4.5rem
  
  // Effective display state: expand on hover even if collapsed
  const isEffectivelyExpanded = !isCollapsed || isHoveringSidebar;
  const currentSidebarWidth = isCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth;
  const displaySidebarWidth = isEffectivelyExpanded ? sidebarExpandedWidth : sidebarCollapsedWidth;

  return (
    <div className={`${needsFullHeight ? 'h-screen' : 'min-h-screen'} bg-gray-50 dark:bg-[#333234] flex flex-col overflow-x-hidden`}>
      {/* Top Bar - Desktop only */}
      <div className="hidden md:block">
        <TopBar
          profilePhoto={profilePhoto}
          userInitial={userInitial}
          userFirstName={userFirstName}
          userEmail={currentUser?.email || ''}
          isDarkMode={isDarkMode}
          onThemeToggle={handleThemeToggle}
          sidebarWidth={currentSidebarWidth}
          profileCompletion={profileCompletion}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Sidebar desktop - Full height, in front of top bar */}
      <aside 
        className={`hidden md:fixed md:flex md:flex-col z-50 bg-white dark:bg-[#2b2a2c] border-r border-gray-200 dark:border-[#3d3c3e] ${isCollapsed && isHoveringSidebar ? 'shadow-xl' : ''}`}
        style={{ 
          top: 0,
          left: 0,
          bottom: 0,
          width: displaySidebarWidth
        }}
        onMouseEnter={() => setIsHoveringSidebar(true)}
        onMouseLeave={() => setIsHoveringSidebar(false)}
      >
        {/* Logo and collapse button at top of sidebar */}
        <div className="relative flex h-12 shrink-0 items-center justify-between px-3 border-b border-gray-100 dark:border-[#3d3c3e]/50">
          {/* Logo */}
            <Link 
              to="/"
            className={`flex items-center ${!isEffectivelyExpanded ? 'justify-center w-full' : ''} hover:opacity-80 transition-opacity`}
            >
              {(isDarkMode ? logoUrlDark : logoUrlLight) ? (
                <img 
                  src={isDarkMode ? logoUrlDark : logoUrlLight} 
                alt="Jobzai" 
                className="h-7 w-auto"
                />
              ) : (
              <div className="h-7 w-7 bg-gray-100 dark:bg-[#3d3c3e] animate-pulse rounded" />
              )}
            </Link>
          {/* Bouton collapse - disabled on certain pages */}
            {location.pathname !== '/applications' && location.pathname !== '/jobs' && location.pathname !== '/upcoming-interviews' && location.pathname !== '/mock-interview' && location.pathname !== '/calendar' && location.pathname !== '/campaigns-auto' && !location.pathname.startsWith('/interview-prep/') && !location.pathname.startsWith('/ats-analysis/') && location.pathname !== '/resume-builder' && !(location.pathname.startsWith('/resume-builder/') && location.pathname.endsWith('/cv-editor')) && !location.pathname.startsWith('/notes/') && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
              className={`group flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200
                  text-gray-400 dark:text-gray-500 
                  hover:text-gray-600 dark:hover:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/50
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

          {/* Bouton collapse for locked pages - visible when expanded */}
            {(location.pathname === '/applications' || location.pathname === '/jobs' || location.pathname === '/upcoming-interviews' || location.pathname === '/mock-interview' || location.pathname === '/calendar' || location.pathname === '/campaigns-auto' || location.pathname.startsWith('/interview-prep/') || location.pathname.startsWith('/ats-analysis/') || location.pathname === '/resume-builder' || (location.pathname.startsWith('/resume-builder/') && location.pathname.endsWith('/cv-editor')) || location.pathname.startsWith('/notes/')) && !isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
              className={`group flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200
                  text-gray-400 dark:text-gray-500 
                  hover:text-gray-600 dark:hover:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/50
                  active:scale-95`}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </button>
            )}
          </div>

          {/* Navigation principale - flex-1 pour prendre l'espace disponible */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
          <nav className="p-2 space-y-1">
              {/* APPLY Section */}
            <div className="space-y-0.5">
              {isEffectivelyExpanded ? (
                <p className="px-3 pt-3 pb-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.08em]">
                    Apply
                  </p>
              ) : (
                <div className="flex justify-center py-2">
                  <div className="w-5 h-[1.5px] rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
              )}
                
                {navigationGroups.apply.main.map((item) => (
                  <SidebarLink
                    key={item.name}
                    name={item.name}
                    href={item.href}
                    icon={item.icon}
                  isCollapsed={!isEffectivelyExpanded}
                    isHovered={isHovered}
                    onMouseEnter={setIsHovered}
                    onMouseLeave={() => setIsHovered(null)}
                  />
                ))}
              </div>

              {/* TRACK Section */}
            <div className="space-y-0.5">
              {isEffectivelyExpanded ? (
                <p className="px-3 pt-4 pb-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.08em]">
                    Track
                  </p>
              ) : (
                <div className="flex justify-center py-2 mt-1">
                  <div className="w-5 h-[1.5px] rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
              )}
                {navigationGroups.track.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                  className={`group flex items-center ${!isEffectivelyExpanded ? 'justify-center px-2' : 'px-3'} py-2 text-[13px] font-medium rounded-lg 
                      transition-all duration-200 relative overflow-hidden
                      ${location.pathname === item.href
                      ? 'bg-[#635BFF]/8 text-[#635BFF] dark:text-[#a5a0ff]'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50'
                      }`}
                  title={!isEffectivelyExpanded ? item.name : undefined}
                >
                  <div className={`relative flex items-center ${!isEffectivelyExpanded ? 'justify-center' : 'gap-2.5 flex-1'}`}>
                    <item.icon className={`h-[18px] w-[18px] transition-colors
                        ${location.pathname === item.href 
                          ? 'text-[#635BFF] dark:text-[#a5a0ff]' 
                          : 'text-gray-400 group-hover:text-[#635BFF] dark:group-hover:text-[#a5a0ff]'}`} 
                      />
                    {isEffectivelyExpanded && (
                        <span className="flex-1">{item.name}</span>
                      )}
                    </div>

                    {location.pathname === item.href && (
                      <motion.div
                        layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 
                        bg-[#635BFF] dark:bg-[#a5a0ff] rounded-r-full"
                      />
                    )}
                  </Link>
                ))}
              </div>

              {/* PREPARE Section */}
            <div className="space-y-0.5">
              {isEffectivelyExpanded ? (
                <p className="px-3 pt-4 pb-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.08em]">
                    Prepare
                  </p>
              ) : (
                <div className="flex justify-center py-2 mt-1">
                  <div className="w-5 h-[1.5px] rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
              )}
                {navigationGroups.prepare.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                  className={`group flex items-center ${!isEffectivelyExpanded ? 'justify-center px-2' : 'px-3'} py-2 text-[13px] font-medium rounded-lg 
                      transition-all duration-200 relative overflow-hidden
                      ${location.pathname === item.href
                      ? 'bg-[#635BFF]/8 text-[#635BFF] dark:text-[#a5a0ff]'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50'
                      }`}
                  title={!isEffectivelyExpanded ? item.name : undefined}
                >
                  <div className={`relative flex items-center ${!isEffectivelyExpanded ? 'justify-center' : 'gap-2.5 flex-1'}`}>
                    <item.icon className={`h-[18px] w-[18px] transition-colors
                        ${location.pathname === item.href 
                          ? 'text-[#635BFF] dark:text-[#a5a0ff]' 
                          : 'text-gray-400 group-hover:text-[#635BFF] dark:group-hover:text-[#a5a0ff]'}`} 
                      />
                    {isEffectivelyExpanded && (
                        <span className="flex-1">{item.name}</span>
                      )}
                    </div>

                    {location.pathname === item.href && (
                      <motion.div
                        layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 
                        bg-[#635BFF] dark:bg-[#a5a0ff] rounded-r-full"
                      />
                    )}
                  </Link>
                ))}
              </div>

              {/* IMPROVE Section */}
            <div className="space-y-0.5">
              {isEffectivelyExpanded ? (
                <p className="px-3 pt-4 pb-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.08em]">
                    Improve
                  </p>
              ) : (
                <div className="flex justify-center py-2 mt-1">
                  <div className="w-5 h-[1.5px] rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
              )}
                {navigationGroups.improve.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                  className={`group flex items-center ${!isEffectivelyExpanded ? 'justify-center px-2' : 'px-3'} py-2 text-[13px] font-medium rounded-lg 
                      transition-all duration-200 relative overflow-hidden
                      ${location.pathname === item.href
                      ? 'bg-[#635BFF]/8 text-[#635BFF] dark:text-[#a5a0ff]'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50'
                      }`}
                  title={!isEffectivelyExpanded ? item.name : undefined}
                >
                  <div className={`relative flex items-center ${!isEffectivelyExpanded ? 'justify-center' : 'gap-2.5 flex-1'}`}>
                    <item.icon className={`h-[18px] w-[18px] transition-colors
                        ${location.pathname === item.href 
                          ? 'text-[#635BFF] dark:text-[#a5a0ff]' 
                          : 'text-gray-400 group-hover:text-[#635BFF] dark:group-hover:text-[#a5a0ff]'}`} 
                      />
                    {isEffectivelyExpanded && (
                        <span className="flex-1">{item.name}</span>
                      )}
                    </div>

                    {location.pathname === item.href && (
                      <motion.div
                        layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 
                        bg-[#635BFF] dark:bg-[#a5a0ff] rounded-r-full"
                      />
                    )}
                  </Link>
                ))}
              </div>

            </nav>
          </div>

          {/* Section du bas - flex-shrink-0 pour taille fixe */}
          <div className="flex-shrink-0">
            {/* Plan & Credits Card - Ultra Premium Minimalist Design */}
          {isEffectivelyExpanded ? (
            <div className="p-3 border-t border-gray-100 dark:border-[#3d3c3e]/50">
                <div className="space-y-2">
                  {/* Plan Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        userPlan === 'premium' ? 'bg-amber-400' :
                        userPlan === 'standard' ? 'bg-[#635BFF]' : 'bg-gray-400'
                      }`} />
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {userPlan === 'premium' ? 'Premium' : userPlan === 'standard' ? 'Standard' : 'Free'}
                      </span>
                    </div>
                    {userPlan !== 'premium' && (
                      <Link
                        to="/billing"
                        className="text-[10px] font-medium text-[#635BFF] dark:text-[#a5a0ff] hover:underline underline-offset-2"
                      >
                        Upgrade
                      </Link>
                    )}
                  </div>

                  {/* Credits Display */}
                  <Link 
                    to="/billing"
                    className="group block p-3 rounded-xl bg-gray-50 dark:bg-[#3d3c3e]/30 
                      hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/50 
                      transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                            {credits >= 999999 ? '∞' : credits.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                            credits
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg 
                        bg-[#635BFF]/10 dark:bg-[#635BFF]/20
                        group-hover:bg-[#635BFF] transition-colors duration-200">
                        <Plus className="h-3.5 w-3.5 text-[#635BFF] dark:text-[#a5a0ff] 
                          group-hover:text-white transition-colors duration-200" />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            ) : (
            <div className="p-2 border-t border-gray-100 dark:border-[#3d3c3e]/50">
                  <Link
                    to="/billing"
                className="group relative flex flex-col items-center justify-center w-full p-2 rounded-lg
                      hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/30
                  transition-all duration-200"
                    title={`${userPlan === 'premium' ? 'Premium' : userPlan === 'standard' ? 'Standard' : 'Free'} • ${credits.toLocaleString()} credits`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mb-1 ${
                      userPlan === 'premium' ? 'bg-amber-400' :
                      userPlan === 'standard' ? 'bg-[#635BFF]' : 'bg-gray-400'
                    }`} />
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 tabular-nums">
                      {credits >= 999999 ? '∞' : credits}
                    </span>
                  </Link>
              </div>
            )}

                        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <div
        className={`sticky top-0 z-30 md:hidden transition-shadow ${
          hasScrolled ? 'shadow-sm' : ''
        } bg-white/75 dark:bg-[#2b2a2c]/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md border-b border-gray-200/60 dark:border-[#3d3c3e]/60`}
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}
      >
        <div className="flex items-center justify-between h-[56px] px-4">
          <div className="flex items-center gap-2">
            <button
              aria-label="Go back"
              onClick={() => (canGoBack ? navigate(-1) : navigate('/'))}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] active:scale-95 transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              {(isDarkMode ? logoUrlDark : logoUrlLight) && (
                <img 
                  src={isDarkMode ? logoUrlDark : logoUrlLight} 
                  alt="Logo" 
                  className="h-7 w-auto opacity-90 transition-opacity duration-300" 
                />
              )}
              <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                {currentTitle}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              aria-label="Search"
              className="inline-flex items-center justify-center h-9 w-9 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] active:scale-95 transition"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              aria-label="Open profile"
              className="inline-flex items-center justify-center h-9 w-9 rounded-full overflow-hidden ring-1 ring-gray-200/70 dark:ring-[#3d3c3e]/60 bg-gray-100/50 dark:bg-[#3d3c3e]/60 active:scale-95 transition"
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
      <div 
        className={`flex flex-col flex-1 min-h-0 overflow-x-hidden ${isBuilderMode ? 'bg-white dark:bg-[#2b2a2c]' : ''}`}
      >
        {/* Desktop: spacer for fixed top bar */}
        <div 
          className="hidden md:block flex-shrink-0"
          style={{ height: TOP_BAR_HEIGHT }}
        />
        
        <main 
          className={`flex-1 min-h-0 flex flex-col ${
            isCollapsed ? 'md:ml-[72px]' : 'md:ml-[256px]'
          }`}
        >
          <div className={`${needsFullHeight ? 'h-full flex flex-col flex-1 min-h-0 pt-2 md:pt-0 pb-0' : 'pt-6 md:py-6 pb-6'}`}>
            {needsFullWidth ? (
              // Full width mode for Applications, Jobs, Professional Profile, etc.
              <div className={needsFullHeight ? "h-full flex flex-col flex-1 min-h-0 overflow-hidden" : ""}>{children}</div>
            ) : (
              // Normal mode with max-width for other pages
              <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                {isPlainBackground ? (
                  children
                ) : (
                  /* Wrapper for main content with white background */
                  <div className="md:bg-white md:dark:bg-[#2b2a2c] md:rounded-xl md:shadow-sm overflow-hidden">
                    {children}
                  </div>
                )}
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

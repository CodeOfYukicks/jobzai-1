import { ReactNode, useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { LayoutDashboard, ScrollText, Lightbulb, Settings, CreditCard, User, Menu, X, LogOut, Plus, FileSearch, LayoutGrid, Briefcase, MessageSquare, Calendar, Clock, ArrowRightIcon, HelpCircleIcon, ChevronLeft, ChevronRight, FileText, Search, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import '../styles/navigation.css';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import MobileNavigation from './mobile/MobileNavigation';
import ThemeSwitch from './ThemeSwitch';

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
  apply: [
    { name: 'Jobs', href: '/jobs', icon: LayoutGrid },
    { name: 'Resume Lab', href: '/cv-optimizer', icon: ScrollText },
    { name: 'ATS Check', href: '/cv-analysis', icon: FileSearch },
    { name: 'Campaigns', href: '/campaigns', icon: ScrollText },
  ],
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
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(location.pathname.startsWith('/cv-optimizer/'));
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);

  useEffect(() => {
    // Auto-collapse sidebar on CV Optimizer edit pages for full-width editing
    if (location.pathname.startsWith('/cv-optimizer/')) {
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
    const groups = Object.values(navigationGroups).flat();
    const exact = groups.find(item => item.href === pathname);
    if (exact) return exact.name;
    const starts = groups.find(item => pathname.startsWith(item.href) && item.href !== '/');
    if (starts) return starts.name;
    if (pathname === '/' || pathname === '/dashboard') return 'Dashboard';
    return 'Jobzai';
  };
  const currentTitle = useMemo(() => getCurrentRouteTitle(location.pathname), [location.pathname]);
  const canGoBack = typeof window !== 'undefined' ? window.history.length > 1 : false;

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const root = document.documentElement;
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldUseDark = stored ? stored === 'dark' : prefersDark;
      setIsDarkMode(shouldUseDark);
      root.classList.toggle('dark', shouldUseDark);
    } catch {
      // no-op
    }
  }, []);

  const handleThemeToggle = (checked: boolean) => {
    try {
      setIsDarkMode(checked);
      const root = document.documentElement;
      root.classList.toggle('dark', checked);
      localStorage.setItem('theme', checked ? 'dark' : 'light');
    } catch {
      // no-op
    }
  };

  // Fetch upcoming interviews
  useEffect(() => {
    if (!currentUser) return;

    const fetchUpcomingInterviews = async () => {
      try {
        setIsLoadingInterviews(true);
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        
        const interviews: UpcomingInterview[] = [];
        
        applicationsSnapshot.forEach((doc) => {
          const application = { id: doc.id, ...doc.data() } as JobApplication;
          
          if (application.interviews && application.interviews.length > 0) {
            application.interviews.forEach(interview => {
              // Only include scheduled interviews
              if (interview.status === 'scheduled') {
                const interviewDate = new Date(`${interview.date}T${interview.time || '00:00'}`);
                
                // Only include future interviews
                if (interviewDate > new Date()) {
                  interviews.push({
                    interview,
                    applicationId: application.id,
                    companyName: application.companyName,
                    position: application.position,
                  });
                }
              }
            });
          }
        });
        
        // Sort interviews by date (earliest first)
        interviews.sort((a, b) => {
          const dateA = new Date(`${a.interview.date}T${a.interview.time || '00:00'}`);
          const dateB = new Date(`${b.interview.date}T${b.interview.time || '00:00'}`);
          return dateA.getTime() - dateB.getTime();
        });
        
        setUpcomingInterviews(interviews);
        setIsLoadingInterviews(false);
      } catch (error) {
        console.error('Error fetching upcoming interviews:', error);
        setIsLoadingInterviews(false);
      }
    };

    fetchUpcomingInterviews();
  }, [currentUser]);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar desktop */}
      <div className={`hidden md:fixed md:inset-y-0 md:flex z-50 md:pl-3 lg:pl-4 md:py-4 transition-all duration-300 ${isCollapsed ? 'md:w-20 lg:w-20' : 'md:w-72 lg:w-80'}`}>
        <div className="relative flex flex-col h-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          {/* Logo avec bouton collapse */}
          <div className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-200 dark:border-gray-700">
            {/* Logo centré */}
            <Link 
              to="/"
              className="flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className={`${isCollapsed ? 'h-7 w-7' : 'h-7 w-auto'}`} />
              ) : (
                <div className={`${isCollapsed ? 'h-7 w-7' : 'h-7 w-28'} bg-gray-100 animate-pulse rounded`} />
              )}
            </Link>
            
            {/* Bouton collapse - positionné à droite */}
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
          </div>

          {/* Navigation principale - flex-1 pour prendre l'espace disponible */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <nav className="p-3 space-y-4">
              {/* APPLY Section */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    APPLY
                  </p>
                )}
                {navigationGroups.apply.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                    className={`group flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm font-medium rounded-xl 
                      transition-all duration-200 relative overflow-hidden
                      ${location.pathname === item.href || (item.href === '/cv-optimizer' && location.pathname.startsWith('/cv-optimizer'))
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
                    
                    <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 flex-1'}`}>
                      <item.icon className={`h-5 w-5 transition-colors
                        ${location.pathname === item.href || (item.href === '/cv-optimizer' && location.pathname.startsWith('/cv-optimizer'))
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`} 
                      />
                      {!isCollapsed && (
                        <span className="flex-1 flex items-center gap-2">
                          <span>{item.name}</span>
                        </span>
                      )}
                    </div>

                    {(location.pathname === item.href || (item.href === '/cv-optimizer' && location.pathname.startsWith('/cv-optimizer'))) && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 
                          bg-gradient-to-b from-purple-600 to-indigo-600 rounded-r-full"
                      />
                    )}
                  </Link>
                ))}
              </div>

              {/* TRACK Section */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    TRACK
                  </p>
                )}
                {navigationGroups.track.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                    className={`group flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm font-medium rounded-xl 
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
                    
                    <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 flex-1'}`}>
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
                  <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    PREPARE
                  </p>
                )}
                {navigationGroups.prepare.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                    className={`group flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm font-medium rounded-xl 
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
                    
                    <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 flex-1'}`}>
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
                  <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    IMPROVE
                  </p>
                )}
                {navigationGroups.improve.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                    className={`group flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm font-medium rounded-xl 
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
                    
                    <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 flex-1'}`}>
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
                <div className="mt-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 
                      dark:from-amber-900/20 dark:to-amber-800/20 p-3.5"
                  >
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          Profile Completion
                        </span>
                        <span className="text-sm font-bold text-amber-900 dark:text-amber-100">
                          {profileCompletion}%
                        </span>
                      </div>

                      {/* Barre de progression */}
                      <div className="h-1.5 bg-amber-200/50 dark:bg-amber-700/30 rounded-full overflow-hidden mb-2.5">
                        <motion.div 
                          className="h-full bg-amber-500 dark:bg-amber-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${profileCompletion}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>

                      <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mb-2.5 leading-relaxed">
                        Complete your profile to get personalized recommendations.
                      </p>

                      <Link
                        to="/professional-profile"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 
                          dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-300 
                          transition-colors"
                      >
                        Complete Profile
                        <svg 
                          className="w-3.5 h-3.5" 
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
            {/* Credits Card - Version améliorée */}
            {!isCollapsed ? (
              <div className="p-2.5 border-t border-gray-200 dark:border-gray-700">
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 p-3">
                  {/* Cercles décoratifs en arrière-plan */}
                  <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/10" />
                  <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
                  
                  <div className="relative">
                    {/* Montant des crédits */}
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold text-white">{credits}</span>
                      <span className="text-xs text-white/70">credits</span>
                    </div>

                    {/* Barre de progression stylisée */}
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-2">
                      <motion.div 
                        className="h-full bg-white/40 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(credits / 500) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>

                    {/* Bouton Add More Credits */}
                    <Link
                      to="/billing"
                      className="inline-flex items-center gap-1 text-xs text-white/90 hover:text-white
                        transition-colors group"
                    >
                      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-white/20 
                        group-hover:bg-white/30 transition-colors">
                        <Plus className="h-3 w-3" />
                      </div>
                      <span>Add More Credits</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <Link
                  to="/billing"
                  className="flex items-center justify-center w-full p-2 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity"
                  title={`${credits} credits`}
                >
                  <CreditCard className="h-5 w-5 text-white" />
                </Link>
              </div>
            )}

            {/* User Profile */}
            <div className={`${isCollapsed ? 'p-2' : 'p-3'} border-t border-gray-200 dark:border-gray-700`}>
              <div className="relative">
                <div className={`${!isCollapsed ? 'flex items-center justify-between gap-3' : ''}`}>
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={`w-full group ${isCollapsed ? 'p-2 justify-center' : 'p-2.5'} rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 
                      transition-all duration-200 flex items-center ${isCollapsed ? 'flex-col' : ''} ${!isCollapsed ? 'flex-1' : ''}`}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-3'}`}>
                      <div className="relative">
                        <div className={`${isCollapsed ? 'h-10 w-10' : 'h-10 w-10'} rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 
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
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {userFirstName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
                        rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden`}
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
              {logoUrl && <img src={logoUrl} alt="Logo" className="h-5 w-auto opacity-90" />}
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
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? 'md:pl-24 lg:pl-24' : 'md:pl-[19rem] lg:pl-[21rem]'}`}>
        <main className="flex-1">
          <div className="pt-2 md:py-6 pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-6">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              {/* Wrapper pour le contenu principal avec fond blanc */}
              <div className="md:bg-white md:dark:bg-gray-800 md:rounded-xl md:shadow-sm overflow-hidden">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Nouvelle navigation mobile */}
      <MobileNavigation />
      
    </div>
  );
}

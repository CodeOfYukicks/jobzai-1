import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { LayoutDashboard, ScrollText, Mail, Lightbulb, Settings, CreditCard, User, Menu, X, LogOut, Plus, FileSearch, LayoutGrid, Briefcase, MessageSquare, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import '../styles/navigation.css';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import MobileNavigation from './mobile/MobileNavigation';
import { QuickSettingsButton } from './settings/QuickSettingsButton';
import { QuickSettingsPanel } from './settings/QuickSettingsPanel';

interface AuthLayoutProps {
  children: ReactNode;
}

// Définir les groupes de navigation
const navigationGroups = {
  main: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Template Studio', href: '/email-templates', icon: Mail },
    { name: 'Campaigns', href: '/campaigns', icon: ScrollText },
    { name: 'Recommendations', href: '/recommendations', icon: Lightbulb },
    { name: 'Professional Profile', href: '/professional-profile', icon: User },
    { name: 'Resume Lab', href: '/cv-analysis', icon: FileSearch },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = onSnapshot(
        doc(db, 'users', currentUser.uid),
        (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setCredits(userData.credits || 0);
            setProfileCompletion(calculateProfileCompletion(userData));
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
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-72 lg:w-80">
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 shadow-xl">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center justify-center px-6 border-b border-gray-200">
            <Link 
              to="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
              ) : (
                <div className="h-8 w-32 bg-gray-100 animate-pulse rounded" />
              )}
            </Link>
          </div>

          {/* Navigation principale - flex-1 pour prendre l'espace disponible */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <nav className="p-3">
              <div className="space-y-1">
                <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Main
                </p>
                {navigationGroups.main.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                    className={`group flex items-center px-2 sm:px-4 py-2 sm:py-3 text-sm font-medium rounded-xl 
                      transition-all duration-200 relative overflow-hidden
                      ${location.pathname === item.href
                        ? 'bg-gradient-to-r from-purple-600/10 to-indigo-600/10 text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
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
                    
                    <div className="relative flex items-center gap-3">
                      <item.icon className={`h-5 w-5 transition-colors
                        ${location.pathname === item.href 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`} 
                      />
                      <span>{item.name}</span>
                    </div>

                    {location.pathname === item.href && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 
                          bg-gradient-to-b from-purple-600 to-indigo-600 rounded-r-full"
                      />
                    )}
                  </Link>
                ))}

                {/* Nouveau lien pour les candidatures */}
                <NavLink
                  to="/applications"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors duration-200 ${
                      isActive
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <Briefcase className="h-5 w-5" />
                  <span>Applications</span>
                </NavLink>
              </div>

              {/* Profile Completion Alert si < 90% */}
              {profileCompletion < 90 && (
                <div className="mt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 
                      dark:from-amber-900/20 dark:to-amber-800/20 p-4"
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
                      <div className="h-1.5 bg-amber-200/50 dark:bg-amber-700/30 rounded-full overflow-hidden mb-3">
                        <motion.div 
                          className="h-full bg-amber-500 dark:bg-amber-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${profileCompletion}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>

                      <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mb-3">
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
            {/* Credits Card - Version améliorée */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 p-4">
                {/* Cercles décoratifs en arrière-plan */}
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
                
                <div className="relative">
                  {/* Montant des crédits */}
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-bold text-white">{credits}</span>
                    <span className="text-sm text-white/70">credits</span>
                  </div>

                  {/* Barre de progression stylisée */}
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-3">
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
                    className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white
                      transition-colors group"
                  >
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 
                      group-hover:bg-white/30 transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                    <span>Add More Credits</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="w-full group p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 
                    transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 
                        flex items-center justify-center shadow-lg shadow-purple-600/20">
                        <span className="text-white font-medium">
                          {userInitial}
                        </span>
                      </div>
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 
                        border-2 border-white dark:border-gray-800" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {userFirstName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {currentUser?.email}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Menu déroulant */}
                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-gray-800 
                        rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <div className="py-1">
                        <Link
                          to="/settings"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 
                            hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                        <Link
                          to="/billing"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 
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
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 
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

      {/* Header mobile modifié */}
      <div className="sticky top-0 z-10 md:hidden bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-center h-16 px-4">
          {logoUrl && (
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-6 w-auto"
              />
            </Link>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-72 lg:pl-80 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6 pb-20 md:pb-6">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              {/* Wrapper pour le contenu principal avec fond blanc */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border 
                border-gray-200/50 dark:border-gray-700/30">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Nouvelle navigation mobile */}
      <MobileNavigation />

      {/* Quick Settings Button - Visible uniquement sur mobile */}
      <div className="md:hidden">
        <QuickSettingsButton 
          onClick={() => setIsSettingsOpen(true)}
          hasUpdates={credits > 0}
        />
      </div>
      
      <QuickSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        credits={credits}
        user={{
          name: userFirstName,
          email: currentUser?.email || '',
        }}
        onSignOut={handleSignOut}
      />
    </div>
  );
}

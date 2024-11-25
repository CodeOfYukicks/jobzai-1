import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScrollText, Mail, Lightbulb, Settings, CreditCard, User, Menu, X, LogOut, Plus } from 'lucide-react';
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
  ],
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

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = onSnapshot(
        doc(db, 'users', currentUser.uid),
        (doc) => {
          if (doc.exists()) {
            setCredits(doc.data().credits || 0);
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
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-gray-800 
          shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50">
          {/* Logo */}
          <div className="flex h-20 shrink-0 items-center justify-center px-6">
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

          {/* Navigation principale */}
          <nav className="flex-1 space-y-8 px-4 py-6">
            {/* Section Main */}
            <div className="space-y-2">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Main
              </p>
              {navigationGroups.main.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onMouseEnter={() => setIsHovered(item.name)}
                  onMouseLeave={() => setIsHovered(null)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl 
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
            </div>

            {/* Section Settings */}
            <div className="space-y-2">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Settings
              </p>
              <Link
                to="/settings"
                className={`nav-item group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  location.pathname === '/settings'
                    ? 'bg-[#8D75E6]/15 text-[#8D75E6] shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#8D75E6]'
                }`}
              >
                <Settings className="nav-icon mr-3 h-5 w-5" />
                Settings
              </Link>
              <Link
                to="/billing"
                className={`nav-item group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  location.pathname === '/billing'
                    ? 'bg-[#8D75E6]/15 text-[#8D75E6] shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#8D75E6]'
                }`}
              >
                <CreditCard className="nav-icon mr-3 h-5 w-5" />
                Billing
              </Link>
            </div>

            {/* Credits Card */}
            <div className="px-3">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br 
                from-purple-600 to-indigo-600 p-5 text-white">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Pattern de fond */}
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                    </pattern>
                    <rect width="100" height="100" fill="url(#grid)"/>
                  </svg>
                </div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-white/80">Available Credits</p>
                    <CreditCard className="h-5 w-5 text-white/70" />
                  </div>
                  <p className="text-3xl font-bold">{credits}</p>
                  <div className="mt-4">
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${(credits / 500) * 100}%` }}
                      />
                    </div>
                    <Link
                      to="/billing"
                      className="mt-3 text-sm text-white/80 hover:text-white flex items-center gap-1
                        transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add More Credits
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="group p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 
              transition-all duration-200">
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
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {userFirstName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentUser?.email}
                  </p>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 
                    hover:bg-gray-100 dark:hover:bg-gray-600
                    transition-all duration-200"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                </button>
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
      <div className="md:pl-72 flex flex-col flex-1">
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

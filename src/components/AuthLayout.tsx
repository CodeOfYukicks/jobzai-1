import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScrollText, Mail, Lightbulb, Settings, CreditCard, User, Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import '../styles/navigation.css';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { ThemeToggle } from './ui/theme-toggle';

interface AuthLayoutProps {
  children: ReactNode;
}

// Définir les groupes de navigation
const navigationGroups = {
  main: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Email Templates', href: '/email-templates', icon: Mail },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState(0);
  const { currentUser, logout } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string>('');

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
        const logoRef = ref(storage, 'images/logo-dark.png');
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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          {/* Logo en haut */}
          <div className="flex h-16 shrink-0 items-center justify-center px-6 border-b border-gray-200">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-8 w-auto"
              />
            ) : (
              <div className="h-8 w-32 bg-gray-100 animate-pulse rounded" />
            )}
          </div>

          {/* Navigation principale */}
          <nav className="flex-1 space-y-8 px-4 py-4">
            {/* Section Main */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Main
              </p>
              {navigationGroups.main.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  role="menuitem"
                  aria-current={location.pathname === item.href ? 'page' : undefined}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === item.href
                      ? 'bg-[#8D75E6]/10 text-[#8D75E6] shadow-sm border-l-4 border-[#8D75E6] pl-3'
                      : 'text-gray-600 hover:bg-[#8D75E6]/5 hover:text-[#8D75E6] hover:pl-5'
                  }`}
                >
                  <item.icon className={`
                    mr-3 h-5 w-5 transition-all duration-200
                    ${location.pathname === item.href ? 'text-[#8D75E6]' : 'text-gray-400 group-hover:text-[#8D75E6]'}
                  `} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Section utilisateur, settings, billing et crédits en bas */}
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Settings et Billing */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Settings
              </p>
              <div className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <Settings className="nav-icon mr-3 h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Theme</span>
                </div>
                <ThemeToggle forceShow={true} />
              </div>
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

            {/* Credits card */}
            <div className="px-3 py-3 bg-gradient-to-r from-[#8D75E6]/10 to-transparent rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Credits</p>
                  <p className="text-lg font-bold text-[#8D75E6]">{credits}</p>
                </div>
                <button className="text-sm text-[#8D75E6] hover:underline">
                  + Add More
                </button>
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#8D75E6] rounded-full transition-all duration-500"
                  style={{ width: `${(credits / 500) * 100}%` }}
                />
              </div>
            </div>

            {/* User profile et sign out */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between group p-2 rounded-lg hover:bg-[#8D75E6]/5 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#8D75E6] to-[#9F8BE8] flex items-center justify-center">
                      <span className="text-white font-medium">
                        {userInitial}
                      </span>
                    </div>
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Welcome back,
                    </p>
                    <p className="text-sm text-gray-600">
                      {userFirstName}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#8D75E6]/10"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5 text-gray-400 hover:text-[#8D75E6]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header mobile */}
      <div className="sticky top-0 z-10 md:hidden bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Menu à gauche */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-500 hover:text-gray-600"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo centré */}
          {logoUrl && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-6 w-auto"
              />
            </div>
          )}

          {/* Espace vide à droite pour équilibrer */}
          <div className="w-5" />
        </div>
      </div>

      {/* Mobile menu avec animations améliorées */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay avec flou */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu latéral */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-xl"
            >
              <div className="h-full flex flex-col">
                {/* En-tête du menu */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border-b border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-[#8D75E6] flex items-center justify-center">
                        <span className="text-white font-medium">
                          {userInitial}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{userFirstName}</p>
                        <p className="text-xs text-gray-500">{currentUser?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-200"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </motion.div>

                {/* Navigation avec sections */}
                <div className="flex-1 overflow-y-auto py-4 px-3">
                  <div className="space-y-8">
                    {/* Section principale */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Main
                      </p>
                      {navigationGroups.main.map((item, index) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 + 0.1 }}
                        >
                          <Link
                            to={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`nav-item group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                              location.pathname === item.href
                                ? 'bg-[#8D75E6]/15 text-[#8D75E6] shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-[#8D75E6]'
                            }`}
                          >
                            <item.icon className="nav-icon mr-3 h-5 w-5" />
                            {item.name}
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Settings et Billing */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Settings
                      </p>
                      <div className="space-y-1">
                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-600">
                          <div className="flex items-center gap-3">
                            <Settings className="h-5 w-5" />
                            Theme
                          </div>
                          <ThemeToggle forceShow={true} />
                        </div>

                        {/* Settings */}
                        <Link
                          to="/settings"
                          className={`flex items-center gap-3 px-3 py-2 text-sm text-gray-600 ${
                            location.pathname === '/settings' ? 'bg-[#F4F1FF] text-[#8D75E6]' : ''
                          }`}
                        >
                          <Settings className="h-5 w-5" />
                          Settings
                        </Link>

                        {/* Billing */}
                        <Link
                          to="/billing"
                          className={`flex items-center gap-3 px-3 py-2 text-sm text-gray-600 ${
                            location.pathname === '/billing' ? 'bg-[#F4F1FF] text-[#8D75E6]' : ''
                          }`}
                        >
                          <CreditCard className="h-5 w-5" />
                          Billing
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Footer avec crédits et déconnexion */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-gray-200 p-4 space-y-4"
                >
                  <div className="px-3 py-3 bg-gradient-to-r from-[#8D75E6]/10 to-transparent rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Credits</p>
                        <p className="text-lg font-bold text-[#8D75E6]">{credits}</p>
                      </div>
                      <button className="text-sm text-[#8D75E6] hover:underline">
                        + Add More
                      </button>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#8D75E6] rounded-full transition-all duration-500"
                        style={{ width: `${(credits / 500) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

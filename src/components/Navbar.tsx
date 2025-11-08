import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Menu, 
  X, 
  User, 
  LogOut,
  LayoutDashboard,
  Mail,
  ScrollText,
  Lightbulb,
  Settings,
  CreditCard,
  Home,
  HelpCircle,
  LogIn,
  UserPlus,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import FirebaseImage from './FirebaseImage';
import { applyTheme, loadThemeFromStorage, type Theme } from '../lib/theme';

const publicNavigation = [
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'How It Works', href: '#how-it-works' }
];

const authenticatedNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Email Templates', href: '/email-templates', icon: Mail },
  { name: 'Campaigns', href: '/campaigns', icon: ScrollText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, logout } = useAuth();
  const [credits, setCredits] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<Theme>(loadThemeFromStorage());
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = loadThemeFromStorage();
    if (savedTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return savedTheme === 'dark';
  });

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Listen to theme changes and update UI
  useEffect(() => {
    const updateThemeState = () => {
      const savedTheme = loadThemeFromStorage();
      setTheme(savedTheme);
      
      if (savedTheme === 'system') {
        const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(systemIsDark);
      } else {
        setIsDark(savedTheme === 'dark');
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

  const handleThemeToggle = () => {
    // Toggle between light and dark (ignore system mode for toggle)
    const currentTheme = loadThemeFromStorage();
    const newTheme: Theme = (currentTheme === 'dark' || isDark) ? 'light' : 'dark';
    
    setTheme(newTheme);
    setIsDark(newTheme === 'dark');
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

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'pt-4' : 'pt-8'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a 
              href="/"
              onClick={handleLogoClick}
              className="flex items-center space-x-2"
            >
              <FirebaseImage 
                path="images/logo.png" 
                alt="Jobz AI Logo"
                className="h-8 w-auto"
              />
            </a>
          </div>
          
          {/* Desktop Navigation */}
          {!currentUser && (
            <div className="hidden md:flex items-center justify-center">
              <motion.div 
                className="bg-[#6F58B8]/60 backdrop-blur-sm rounded-lg flex items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {publicNavigation.map((item) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    className="px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6F58B8]/80"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.name}
                  </motion.a>
                ))}
                <motion.button 
                  className="px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6F58B8]/80 rounded-r-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </div>
          )}

          {/* Authenticated Navigation */}
          {currentUser && (
            <div className="hidden md:flex items-center space-x-8">
              {authenticatedNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-white/90 hover:text-white font-medium transition-colors flex items-center space-x-2"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Desktop Right Side Actions */}
          {!currentUser && (
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className="text-white/90 hover:text-white font-medium transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="bg-white text-[#8D75E6] px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:transform hover:scale-105 hover:bg-white/90"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 rounded-lg hover:bg-white/10"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile avec overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay sombre */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-20 left-0 right-0 bg-[#8D75E6]/95 dark:bg-[#2A2831]/95 backdrop-blur-md md:hidden shadow-lg"
            >
              <div className="px-6 py-8 space-y-6">
                {/* Navigation Section */}
                <div className="space-y-1">
                  <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">
                    Navigation
                  </h3>
                  <a
                    href="#features"
                    className="flex items-center space-x-3 py-3 px-4 text-white rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Home className="h-5 w-5" />
                    <span>Features</span>
                  </a>
                  <a
                    href="#pricing"
                    className="flex items-center space-x-3 py-3 px-4 text-white rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Pricing</span>
                  </a>
                  <a
                    href="#how-it-works"
                    className="flex items-center space-x-3 py-3 px-4 text-white rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <HelpCircle className="h-5 w-5" />
                    <span>How it Works</span>
                  </a>
                </div>

                {/* Settings Section - Only show theme toggle when logged in */}
                {currentUser && (
                  <div className="space-y-1">
                    <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">
                      Settings
                    </h3>
                    <div className="flex items-center justify-between py-3 px-4 text-white rounded-lg hover:bg-white/10 transition-colors">
                      <div className="flex items-center space-x-3">
                        {isDark ? (
                          <Moon className="h-5 w-5" />
                        ) : (
                          <Sun className="h-5 w-5" />
                        )}
                        <span>Theme</span>
                      </div>
                      <motion.button
                        onClick={handleThemeToggle}
                        className="relative w-12 h-6 rounded-full bg-white/20 border border-white/30 p-0.5 transition-all duration-300"
                        whileTap={{ scale: 0.95 }}
                        aria-label="Toggle theme"
                      >
                        <motion.div
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md"
                          initial={false}
                          animate={{
                            x: isDark ? 24 : 2,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                          }}
                        >
                          {isDark ? (
                            <Moon className="w-3 h-3 text-[#8D75E6]" />
                          ) : (
                            <Sun className="w-3 h-3 text-[#8D75E6]" />
                          )}
                        </motion.div>
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Auth Section */}
                <div className="space-y-1 pt-4 border-t border-white/10">
                  <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">
                    Account
                  </h3>
                  <Link
                    to="/login"
                    className="flex items-center space-x-3 py-3 px-4 text-white rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Sign in</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center space-x-3 py-3 px-4 bg-white text-[#8D75E6] rounded-lg hover:bg-white/90 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Sign up</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

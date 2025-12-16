import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LayoutDashboard,
  Mail,
  ScrollText,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import FirebaseImage from './FirebaseImage';

const publicNavigation = [
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
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
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  // Sur la landing page, toujours afficher le menu public
  const isLandingPage = location.pathname === '/';
  const showPublicMenu = !currentUser || isLandingPage;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 -ml-2">
            <a 
              href="/"
              onClick={handleLogoClick}
              className="flex items-center"
            >
              <FirebaseImage 
                path="images/logo-only.png" 
                alt="Jobz.ai"
                className="h-12 w-auto"
              />
            </a>
          </div>
          
          {/* Desktop Navigation - Public menu sur landing page ou si pas connecté */}
          {showPublicMenu && (
            <div className="hidden md:flex items-center gap-8">
              {publicNavigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    scrolled || isLandingPage
                      ? 'text-gray-600 hover:text-gray-900' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {item.name}
                </a>
              ))}
            </div>
          )}

          {/* Authenticated Navigation - Seulement si connecté ET pas sur landing page */}
          {currentUser && !isLandingPage && (
            <div className="hidden md:flex items-center space-x-8">
              {authenticatedNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center space-x-2"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Desktop Right Side Actions - Public menu sur landing page ou si pas connecté */}
          {showPublicMenu && (
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/login"
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  scrolled || isLandingPage
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#0275de] rounded-lg transition-colors duration-200 hover:bg-[#0266c7]"
              >
                Get started free
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                scrolled || isLandingPage 
                  ? 'text-gray-600 hover:bg-gray-100' 
                  : 'text-white hover:bg-white/10'
              }`}
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
              className="absolute top-16 left-0 right-0 bg-white md:hidden shadow-lg border-t border-gray-100"
            >
              <div className="px-6 py-6 space-y-4">
                {/* Navigation Section */}
                <div className="space-y-1">
                  {publicNavigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="flex items-center py-3 px-4 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>

                {/* Auth Section - Toujours afficher sur landing page ou si pas connecté */}
                {showPublicMenu && (
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <Link
                      to="/login"
                      className="flex items-center justify-center py-3 px-5 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/signup"
                      className="flex items-center justify-center py-3 px-5 text-white bg-[#0275de] rounded-lg hover:bg-[#0266c7] transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Get started free
                    </Link>
                  </div>
                )}

                {/* Authenticated Navigation Mobile - Seulement si connecté ET pas sur landing page */}
                {currentUser && !isLandingPage && (
                  <div className="space-y-1 pt-4 border-t border-gray-100">
                    {authenticatedNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="flex items-center space-x-3 py-3 px-4 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

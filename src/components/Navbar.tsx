import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LayoutDashboard,
  Mail,
  ScrollText,
  Settings,
  ChevronDown,
  Sparkles,
  Send,
  Briefcase,
  Target,
  MessageSquare,
  BarChart3,
  Zap,
  Brain,
  FileText,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import FirebaseImage from './FirebaseImage';

const publicNavigation = [
  {
    name: 'Products',
    items: [
      { name: 'Auto Apply', description: 'Mass spontaneous applications', href: '#auto-apply', icon: Send },
      { name: 'Job Tracker', description: 'Track all your applications', href: '#tracker', icon: Target },
      { name: 'AI Assistant', description: 'Your personal career copilot', href: '#ai', icon: Sparkles },
    ]
  },
  { name: 'Job Board', href: '#jobs' },
  { name: 'Interview Prep', href: '#interview' },
  { name: 'Career Intelligence', href: '#insights' },
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      <div className="w-full px-4 sm:px-6">
        <div className="relative flex items-center justify-between h-14">
          {/* Logo - Left */}
          <div className="flex-shrink-0">
            <a 
              href="/"
              onClick={handleLogoClick}
              className="flex items-center"
            >
              <FirebaseImage 
                path="images/logo-only.png" 
                alt="Jobz.ai"
                className="h-10 w-auto"
              />
            </a>
          </div>
          
          {/* Desktop Navigation - Centered */}
          {showPublicMenu && (
            <div className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2" ref={dropdownRef}>
              {publicNavigation.map((item) => (
                'items' in item ? (
                  // Dropdown menu
                  <div key={item.name} className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                        scrolled || isLandingPage
                          ? 'text-gray-600 hover:text-gray-900' 
                          : 'text-white/90 hover:text-white'
                      }`}
                    >
                      {item.name}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === item.name ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {openDropdown === item.name && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden"
                        >
                          {item.items.map((subItem) => (
                            <a
                              key={subItem.name}
                              href={subItem.href}
                              onClick={() => setOpenDropdown(null)}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                                <subItem.icon className="w-4.5 h-4.5 text-gray-700" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{subItem.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{subItem.description}</div>
                              </div>
                            </a>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  // Regular link
                  <a
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      scrolled || isLandingPage
                        ? 'text-gray-600 hover:text-gray-900' 
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </a>
                )
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
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  scrolled || isLandingPage
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-1.5 text-sm font-medium text-white bg-[#7066fd] rounded-md transition-colors duration-200 hover:bg-[#5b52e0]"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-1.5 rounded-md transition-colors ${
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
              className="absolute top-14 left-0 right-0 bg-white md:hidden shadow-lg border-t border-gray-100"
            >
              <div className="px-6 py-6 space-y-4">
                {/* Navigation Section */}
                <div className="space-y-1">
                  {publicNavigation.map((item) => (
                    'items' in item ? (
                      // Dropdown section in mobile
                      <div key={item.name} className="space-y-1">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {item.name}
                        </div>
                        {item.items.map((subItem) => (
                          <a
                            key={subItem.name}
                            href={subItem.href}
                            className="flex items-center gap-3 py-3 px-4 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <subItem.icon className="w-5 h-5 text-gray-500" />
                            <span className="font-medium">{subItem.name}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <a
                        key={item.name}
                        href={item.href}
                        className="flex items-center py-3 px-4 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </a>
                    )
                  ))}
                </div>

                {/* Auth Section - Toujours afficher sur landing page ou si pas connecté */}
                {showPublicMenu && (
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <Link
                      to="/login"
                      className="flex items-center justify-center py-2.5 px-4 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="flex items-center justify-center py-2.5 px-4 text-white bg-[#7066fd] rounded-md hover:bg-[#5b52e0] transition-colors font-medium text-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Get Started
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

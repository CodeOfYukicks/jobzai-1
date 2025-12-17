import { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import FirebaseImage from './FirebaseImage';

// Products dropdown content - 3 columns structure
const productFeatures = {
  features: [
    { name: 'Auto Apply', description: 'Mass spontaneous applications', href: '#auto-apply', icon: Send },
    { name: 'Job Tracker', description: 'Track all your applications', href: '#tracker', icon: Target },
    { name: 'AI Assistant', description: 'Your personal career copilot', href: '#ai', icon: Sparkles },
  ],
  more: [
    { name: 'Job Board', description: 'Find your next opportunity', href: '#jobs', icon: Briefcase },
    { name: 'Interview Prep', description: 'Practice with AI mock interviews', href: '#interview', icon: MessageSquare },
    { name: 'Career Intelligence', description: 'Data-driven career insights', href: '#insights', icon: BarChart3 },
  ]
};

const publicNavigation = [
  { name: 'Products', hasDropdown: true },
  { name: 'AI', href: '#ai' },
  { name: 'Job Board', href: '#jobs' },
  { name: 'Interview Prep', href: '#interview' },
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
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hover handlers with delay
  const handleMouseEnter = useCallback((name: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setOpenDropdown(name);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
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
                'hasDropdown' in item ? (
                  // Dropdown trigger
                  <button
                    key={item.name}
                    onMouseEnter={() => handleMouseEnter(item.name)}
                    onMouseLeave={handleMouseLeave}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                      scrolled || isLandingPage
                        ? 'text-gray-900 hover:text-gray-600'
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    {item.name}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === item.name ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  // Regular link
                  <a
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      scrolled || isLandingPage
                        ? 'text-gray-900 hover:text-gray-600' 
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
                    ? 'text-gray-900 hover:text-gray-600'
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

      {/* Products Dropdown - Notion Style (Full Width) */}
      <AnimatePresence>
        {openDropdown === 'Products' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="hidden md:block absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-sm"
            style={{ zIndex: 40 }}
            onMouseEnter={() => handleMouseEnter('Products')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="px-10 py-8">
              <div className="flex">
                {/* Column 1 - Features */}
                <div className="flex-1 pr-16">
                  <div className="text-xs font-medium text-gray-400 mb-4">Features</div>
                  <div className="space-y-4">
                    {productFeatures.features.map((feature) => (
                      <a
                        key={feature.name}
                        href={feature.href}
                        className="block group"
                      >
                        <div className="text-sm font-medium text-gray-900 group-hover:text-[#7066fd] transition-colors">{feature.name}</div>
                        <div className="text-sm text-gray-500">{feature.description}</div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Column 2 - Explore */}
                <div className="flex-1 pr-16">
                  <div className="text-xs font-medium text-gray-400 mb-4">Explore</div>
                  <div className="space-y-4">
                    {productFeatures.more.map((feature) => (
                      <a
                        key={feature.name}
                        href={feature.href}
                        className="block group"
                      >
                        <div className="text-sm font-medium text-gray-900 group-hover:text-[#7066fd] transition-colors">{feature.name}</div>
                        <div className="text-sm text-gray-500">{feature.description}</div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Column 3 - Get Started */}
                <div className="w-[280px] pl-8 border-l border-gray-200">
                  <div className="text-xs font-medium text-gray-400 mb-4">Get started</div>
                  <p className="text-sm text-gray-600 mb-4">
                    Land your dream job faster with AI-powered tools.
                  </p>
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#7066fd] rounded-md hover:bg-[#5b52e0] transition-colors"
                  >
                    Get Started
                  </Link>
                  {/* Illustration */}
                  <div className="mt-6">
                    <svg className="w-32 h-24 text-gray-200" viewBox="0 0 128 96" fill="none">
                      <rect x="10" y="20" width="40" height="50" rx="4" stroke="currentColor" strokeWidth="2"/>
                      <rect x="20" y="30" width="20" height="4" rx="1" fill="currentColor"/>
                      <rect x="20" y="40" width="15" height="4" rx="1" fill="currentColor"/>
                      <circle cx="90" cy="45" r="25" stroke="currentColor" strokeWidth="2"/>
                      <path d="M80 45 L88 53 L100 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  {/* Features Section */}
                  <div className="space-y-1">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Features
                    </div>
                    {productFeatures.features.map((feature) => (
                      <a
                        key={feature.name}
                        href={feature.href}
                        className="flex items-center gap-3 py-3 px-4 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <feature.icon className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">{feature.name}</span>
                      </a>
                    ))}
                  </div>
                  
                  {/* Explore Section */}
                  <div className="space-y-1 pt-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Explore
                    </div>
                    {productFeatures.more.map((feature) => (
                      <a
                        key={feature.name}
                        href={feature.href}
                        className="flex items-center gap-3 py-3 px-4 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <feature.icon className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">{feature.name}</span>
                      </a>
                    ))}
                  </div>

                  {/* Pricing */}
                  <a
                    href="#pricing"
                    className="flex items-center py-3 px-4 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Pricing
                  </a>
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

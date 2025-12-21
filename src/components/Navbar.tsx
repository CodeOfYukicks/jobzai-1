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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import FirebaseImage from './FirebaseImage';

// Products dropdown content - 4 columns structure (matching AuthLayout)
const productFeatures = {
  apply: [
    { name: 'Job Board', description: 'Find your next opportunity', href: '#jobs' },
    { name: 'AutoPilot', description: 'Mass auto-apply in minutes', href: '#autopilot' },
    { name: 'Campaigns', description: 'Targeted outreach campaigns', href: '#campaigns' },
    { name: 'Resume Lab', description: 'AI-powered CV optimization', href: '#resume-lab' },
  ],
  track: [
    { name: 'Application Tracker', description: 'Track all applications', href: '#tracker' },
    { name: 'Calendar', description: 'Schedule & plan interviews', href: '#calendar' },
  ],
  prepare: [
    { name: 'Interview Hub', description: 'Prepare for upcoming interviews', href: '#interview-hub' },
    { name: 'Mock Interview', description: 'Practice with AI interviewer', href: '#mock-interview' },
    { name: 'Document Manager', description: 'Manage all your resumes', href: '#documents' },
  ],
  improve: [
    { name: 'Professional Profile', description: 'Build your personal brand', href: '#profile' },
    { name: 'Recommendations', description: 'AI-powered suggestions', href: '#recommendations' },
    { name: 'Dashboard', description: 'Overview & analytics', href: '#dashboard' },
  ],
};

const publicNavigation = [
  { name: 'Products', hasDropdown: true },
  { name: 'AI', href: '#ai' },
  { name: 'Blog', href: '/blog' },
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
    <nav className={`fixed top-2 left-0 right-0 z-50 transition-all duration-300 ${scrolled
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
                alt="Cubbbe"
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
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors ${scrolled || isLandingPage
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
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${scrolled || isLandingPage
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
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${scrolled || isLandingPage
                  ? 'text-gray-900 hover:text-gray-600'
                  : 'text-white/90 hover:text-white'
                  }`}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2 text-sm font-medium text-white bg-[#635bff] rounded-md transition-colors duration-200 hover:bg-[#5147e5]"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-1.5 rounded-md transition-colors ${scrolled || isLandingPage
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
            className="hidden md:block absolute top-16 left-0 right-0 bg-white border-b border-gray-200"
            style={{ zIndex: 40 }}
            onMouseEnter={() => handleMouseEnter('Products')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1400px] mx-auto px-8 py-10">
              <div className="flex gap-16">
                {/* Column 1 - Apply */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">Apply</div>
                  <div className="space-y-5">
                    {productFeatures.apply.map((item) => (
                      <a key={item.name} href={item.href} className="block group">
                        <div className="text-[15px] font-semibold text-gray-900 group-hover:text-[#7066fd] transition-colors">{item.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{item.description}</div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Column 2 - Track */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">Track</div>
                  <div className="space-y-5">
                    {productFeatures.track.map((item) => (
                      <a key={item.name} href={item.href} className="block group">
                        <div className="text-[15px] font-semibold text-gray-900 group-hover:text-[#7066fd] transition-colors">{item.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{item.description}</div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Column 3 - Prepare */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">Prepare</div>
                  <div className="space-y-5">
                    {productFeatures.prepare.map((item) => (
                      <a key={item.name} href={item.href} className="block group">
                        <div className="text-[15px] font-semibold text-gray-900 group-hover:text-[#7066fd] transition-colors">{item.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{item.description}</div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Column 4 - Improve */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">Improve</div>
                  <div className="space-y-5">
                    {productFeatures.improve.map((item) => (
                      <a key={item.name} href={item.href} className="block group">
                        <div className="text-[15px] font-semibold text-gray-900 group-hover:text-[#7066fd] transition-colors">{item.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{item.description}</div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Column 5 - CTA Box with Avatars */}
                <div className="w-[260px] flex-shrink-0">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Join 10,000+ job seekers
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Land your dream job faster with AI-powered tools.
                    </p>
                    <Link
                      to="/signup"
                      className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-[#7066fd] rounded-lg hover:bg-[#5b52e0] transition-colors"
                    >
                      Get Started
                    </Link>
                    {/* DiceBear Avatars */}
                    <div className="mt-5 flex items-center justify-center">
                      <div className="flex -space-x-2">
                        <img
                          src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=b6e3f4"
                          alt=""
                          className="w-8 h-8 rounded-full ring-2 ring-white"
                        />
                        <img
                          src="https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=c0aede"
                          alt=""
                          className="w-8 h-8 rounded-full ring-2 ring-white"
                        />
                        <img
                          src="https://api.dicebear.com/7.x/notionists/svg?seed=Leo&backgroundColor=ffd5dc"
                          alt=""
                          className="w-8 h-8 rounded-full ring-2 ring-white"
                        />
                        <img
                          src="https://api.dicebear.com/7.x/notionists/svg?seed=Sara&backgroundColor=d1f4d1"
                          alt=""
                          className="w-8 h-8 rounded-full ring-2 ring-white"
                        />
                        <div className="w-8 h-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                          +5k
                        </div>
                      </div>
                    </div>
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
              className="absolute top-16 left-0 right-0 bg-white md:hidden shadow-lg border-t border-gray-100"
            >
              <div className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Navigation Section */}
                <div className="space-y-4">
                  {/* Apply Section */}
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Apply
                    </div>
                    {productFeatures.apply.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="block py-2.5 px-4 text-gray-900 font-medium hover:text-[#7066fd] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>

                  {/* Track Section */}
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Track
                    </div>
                    {productFeatures.track.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="block py-2.5 px-4 text-gray-900 font-medium hover:text-[#7066fd] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>

                  {/* Prepare Section */}
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Prepare
                    </div>
                    {productFeatures.prepare.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="block py-2.5 px-4 text-gray-900 font-medium hover:text-[#7066fd] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>

                  {/* Improve Section */}
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Improve
                    </div>
                    {productFeatures.improve.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="block py-2.5 px-4 text-gray-900 font-medium hover:text-[#7066fd] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="pt-2 border-t border-gray-100">
                    <a
                      href="#pricing"
                      className="block py-2.5 px-4 text-gray-900 font-medium hover:text-[#7066fd] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Pricing
                    </a>
                  </div>
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

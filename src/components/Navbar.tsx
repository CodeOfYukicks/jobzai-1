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

  // Sur la landing page et le blog, toujours afficher le menu public
  const isPublicPage = location.pathname === '/' || location.pathname === '/blog';
  const showPublicMenu = !currentUser || isPublicPage;

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
                path={location.pathname.startsWith('/blog') ? "images/logo_blog.png" : "images/logo-only.png"}
                alt="Cubbbe"
                className={location.pathname.startsWith('/blog') ? "h-14 w-auto" : "h-10 w-auto"}
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
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors ${scrolled || isPublicPage
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
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${scrolled || isPublicPage
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

          {/* Authenticated Navigation - Seulement si connecté ET pas sur landing page ou blog */}
          {currentUser && !isPublicPage && (
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
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${scrolled || isPublicPage
                  ? 'text-gray-900 hover:text-gray-600'
                  : 'text-white/90 hover:text-white'
                  }`}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2 text-sm font-medium text-gray-900 bg-[#ffc300] rounded-md transition-colors duration-200 hover:bg-[#e6b000]"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-1.5 rounded-md transition-colors ${scrolled || isPublicPage
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

      {/* Menu mobile premium - Fullscreen minimaliste */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden flex flex-col"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Header avec logo et bouton fermer */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 h-14 border-b border-gray-100 bg-white">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  if (currentUser) {
                    navigate('/dashboard');
                  } else {
                    navigate('/');
                  }
                }}
                className="flex items-center"
              >
                <FirebaseImage
                  path="images/logo-only.png"
                  alt="Cubbbe"
                  className="h-10 w-auto"
                />
              </a>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation centrale - prend l'espace restant */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 bg-white">
              <nav className="flex flex-col items-center space-y-8">
                {[
                  { name: 'How it Works', href: '#features' },
                  { name: 'Pricing', href: '#pricing' },
                  { name: 'Blog', href: '/blog' },
                ].map((item, index) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                    className="text-3xl font-medium text-gray-900 hover:text-[#7066fd] transition-colors tracking-tight"
                    onClick={(e) => {
                      if (item.href.startsWith('#')) {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        const element = document.querySelector(item.href);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      } else {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                  >
                    {item.name}
                  </motion.a>
                ))}
              </nav>
            </div>

            {/* Footer avec CTA */}
            <div className="flex-shrink-0 px-6 pb-6 pt-4 bg-white" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Link
                  to="/signup"
                  className="flex items-center justify-center w-full py-4 text-white bg-[#7066fd] rounded-2xl hover:bg-[#5b52e0] transition-all duration-200 font-semibold text-lg shadow-lg shadow-[#7066fd]/25"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="flex items-center justify-center w-full py-3 mt-3 text-gray-600 hover:text-gray-900 transition-colors font-medium text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Already have an account? Log in
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

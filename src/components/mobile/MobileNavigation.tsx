import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ScrollText, Mail, Lightbulb, Clock, Briefcase, FileSearch } from 'lucide-react';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileSearch, label: 'Resume Lab', path: '/cv-analysis' },
  { icon: Clock, label: 'Interviews', path: '/upcoming-interviews' },
  { icon: Briefcase, label: 'Applications', path: '/applications' },
  { icon: Mail, label: 'Templates', path: '/email-templates' },
  { icon: ScrollText, label: 'Campaigns', path: '/campaigns' },
  { icon: Lightbulb, label: 'Ideas', path: '/recommendations' },
];

export default function MobileNavigation() {
  const location = useLocation();
  
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 md:hidden"
      style={{
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <nav className="h-full max-w-md mx-auto px-6 flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <motion.div
              key={item.path}
              className="relative flex flex-col items-center"
              whileTap={{ scale: 0.9 }}
            >
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-1 w-12 h-1 bg-[#8D75E6] rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              <Link 
                to={item.path}
                className="flex flex-col items-center pt-1"
              >
                <item.icon 
                  className={`w-6 h-6 mb-1 transition-colors ${
                    isActive ? 'text-[#8D75E6]' : 'text-gray-400'
                  }`}
                />
                <span 
                  className={`text-xs transition-colors ${
                    isActive ? 'text-[#8D75E6] font-medium' : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </motion.div>
  );
} 
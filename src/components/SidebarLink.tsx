import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SidebarLinkProps {
  name: string;
  href: string;
  icon: LucideIcon;
  isCollapsed: boolean;
  isHovered: string | null;
  onMouseEnter: (name: string) => void;
  onMouseLeave: () => void;
  isSubmenuItem?: boolean;
}

export default function SidebarLink({
  name,
  href,
  icon: Icon,
  isCollapsed,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  isSubmenuItem = false,
}: SidebarLinkProps) {
  const location = useLocation();

  const isActive =
    location.pathname === href ||
    (href === '/cv-optimizer' && location.pathname.startsWith('/cv-optimizer'));

  const baseClasses = `group flex items-center ${
    isCollapsed ? 'justify-center px-2' : isSubmenuItem ? 'px-3' : 'px-3'
  } py-2 text-[13px] font-medium rounded-xl 
    transition-all duration-200 relative overflow-hidden
    ${isActive
      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
    }`;

  return (
    <Link
      to={href}
      onMouseEnter={() => onMouseEnter(name)}
      onMouseLeave={onMouseLeave}
      className={baseClasses}
      title={isCollapsed ? name : undefined}
    >
      {/* Hover Effect */}
      {isHovered === name && (
        <motion.div
          layoutId="hoverEffect"
          className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      <div
        className={`relative flex items-center ${
          isCollapsed ? 'justify-center' : 'gap-2.5 flex-1'
        }`}
      >
        <Icon
          className={`h-5 w-5 transition-colors
            ${isActive
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
            }`}
        />
        {!isCollapsed && (
          <span className="flex-1 flex items-center gap-2">
            <span>{name}</span>
          </span>
        )}
      </div>

      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 
            bg-gradient-to-b from-purple-600 to-indigo-600 rounded-r-full"
        />
      )}
    </Link>
  );
}


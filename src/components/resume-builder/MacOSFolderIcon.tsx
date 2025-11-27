import { memo } from 'react';
import { motion } from 'framer-motion';

interface MacOSFolderIconProps {
  color: string;
  size?: number;
  className?: string;
  isOpen?: boolean;
}

const MacOSFolderIcon = memo(({ color, size = 40, className = '', isOpen = false }: MacOSFolderIconProps) => {
  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      initial={false}
      animate={{ scale: isOpen ? 1.05 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Definitions */}
        <defs>
          {/* Main folder gradient */}
          <linearGradient id={`folder-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
          
          {/* Darker shade for back */}
          <linearGradient id={`folder-back-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
          
          {/* Shadow filter */}
          <filter id={`folder-shadow-${color}`} x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={color} floodOpacity="0.35" />
          </filter>
        </defs>
        
        {/* Back part of folder (visible when open) */}
        <motion.path
          d="M8 18C8 14.6863 10.6863 12 14 12H22L26 16H50C53.3137 16 56 18.6863 56 22V48C56 51.3137 53.3137 54 50 54H14C10.6863 54 8 51.3137 8 48V18Z"
          fill={`url(#folder-back-${color})`}
          initial={false}
          animate={{ 
            y: isOpen ? -2 : 0,
            opacity: isOpen ? 1 : 0.5
          }}
          transition={{ duration: 0.2 }}
        />
        
        {/* Main folder body (front) */}
        <motion.path
          d="M8 20C8 16.6863 10.6863 14 14 14H24L28 18H50C53.3137 18 56 20.6863 56 24V50C56 53.3137 53.3137 56 50 56H14C10.6863 56 8 53.3137 8 50V20Z"
          fill={`url(#folder-gradient-${color})`}
          filter={`url(#folder-shadow-${color})`}
          initial={false}
          animate={{ 
            y: isOpen ? 4 : 0,
            rotateX: isOpen ? -15 : 0
          }}
          transition={{ duration: 0.2 }}
          style={{ transformOrigin: 'center bottom' }}
        />
        
        {/* Tab on folder */}
        <motion.path
          d="M8 20C8 16.6863 10.6863 14 14 14H24L28 18H14C10.6863 18 8 20.6863 8 24V20Z"
          fill={color}
          fillOpacity="0.9"
          initial={false}
          animate={{ 
            y: isOpen ? 4 : 0 
          }}
          transition={{ duration: 0.2 }}
        />
        
        {/* Highlight strip */}
        <motion.rect
          x="12"
          y="22"
          width="40"
          height="4"
          rx="1"
          fill="white"
          fillOpacity="0.25"
          initial={false}
          animate={{ 
            y: isOpen ? 4 : 0,
            opacity: isOpen ? 0.15 : 0.25
          }}
          transition={{ duration: 0.2 }}
        />
        
        {/* Document peeking out when open */}
        {isOpen && (
          <motion.g
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <rect
              x="20"
              y="8"
              width="24"
              height="14"
              rx="2"
              fill="white"
              stroke={color}
              strokeWidth="0.5"
              strokeOpacity="0.3"
            />
            <line x1="24" y1="12" x2="40" y2="12" stroke={color} strokeWidth="1" strokeOpacity="0.2" />
            <line x1="24" y1="16" x2="36" y2="16" stroke={color} strokeWidth="1" strokeOpacity="0.2" />
          </motion.g>
        )}
      </svg>
    </motion.div>
  );
});

MacOSFolderIcon.displayName = 'MacOSFolderIcon';

export default MacOSFolderIcon;

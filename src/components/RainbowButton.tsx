import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface RainbowButtonProps {
  to: string;
  children: ReactNode;
  className?: string;
}

export default function RainbowButton({ to, children, className = '' }: RainbowButtonProps) {
  return (
    <div className="relative group">
      <Link
        to={to}
        className={`relative z-10 btn-primary group-hover:translate-y-[-2px] transition-transform duration-200 ${className}`}
      >
        {children}
      </Link>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileTap={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-gradient-to-r from-violet-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 rounded-lg"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 opacity-0 group-hover:opacity-100 animate-rainbow-shift rounded-lg" />
    </div>
  );
}
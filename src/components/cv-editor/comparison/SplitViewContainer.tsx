/**
 * SplitViewContainer Component
 * Premium split view with synchronized scrolling and connecting lines
 */

import { useRef, useCallback, useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface SplitViewContainerProps {
  beforeContent: ReactNode;
  afterContent: ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  showConnectingLines?: boolean;
  className?: string;
}

export default function SplitViewContainer({
  beforeContent,
  afterContent,
  beforeLabel = 'Before',
  afterLabel = 'After',
  showConnectingLines = false,
  className = '',
}: SplitViewContainerProps) {
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync scroll between the two panels
  const handleScroll = useCallback((source: 'before' | 'after') => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    
    const sourceRef = source === 'before' ? beforeRef : afterRef;
    const targetRef = source === 'before' ? afterRef : beforeRef;
    
    if (sourceRef.current && targetRef.current) {
      const scrollPercentage = sourceRef.current.scrollTop / 
        (sourceRef.current.scrollHeight - sourceRef.current.clientHeight);
      
      targetRef.current.scrollTop = scrollPercentage * 
        (targetRef.current.scrollHeight - targetRef.current.clientHeight);
    }
    
    requestAnimationFrame(() => setIsSyncing(false));
  }, [isSyncing]);

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {/* Before Panel */}
      <div className="flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white/20" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
              {beforeLabel}
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
        </div>
        
        {/* Content */}
        <motion.div
          ref={beforeRef}
          onScroll={() => handleScroll('before')}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex-1 overflow-y-auto rounded-xl custom-scrollbar"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="p-4">
            {beforeContent}
          </div>
        </motion.div>
      </div>

      {/* After Panel */}
      <div className="flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {afterLabel}
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
        </div>
        
        {/* Content */}
        <motion.div
          ref={afterRef}
          onScroll={() => handleScroll('after')}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex-1 overflow-y-auto rounded-xl custom-scrollbar"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.03) 0%, rgba(16,185,129,0.01) 100%)',
            border: '1px solid rgba(16,185,129,0.15)',
          }}
        >
          <div className="p-4">
            {afterContent}
          </div>
        </motion.div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}

/**
 * Single line item for split view with visual connector
 */
interface SplitLineItemProps {
  beforeText: string | null;
  afterText: string | null;
  isModified?: boolean;
  isAdded?: boolean;
  isRemoved?: boolean;
  index: number;
}

export function SplitLineItem({
  beforeText,
  afterText,
  isModified = false,
  isAdded = false,
  isRemoved = false,
  index,
}: SplitLineItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="grid grid-cols-2 gap-4 group"
    >
      {/* Before */}
      <div className={`relative p-3 rounded-lg text-sm leading-relaxed transition-colors ${
        isRemoved 
          ? 'bg-red-500/5 border border-red-500/20' 
          : isModified
            ? 'bg-white/[0.02] border border-white/5'
            : 'bg-transparent border border-transparent'
      }`}>
        {beforeText ? (
          <span className={isRemoved ? 'text-red-400 line-through' : 'text-white/60'}>
            {beforeText}
          </span>
        ) : (
          <span className="text-white/20 italic text-xs">— empty —</span>
        )}
        
        {/* Line number gutter */}
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 
                         text-[10px] font-mono text-white/20">
          {index + 1}
        </span>
      </div>

      {/* After */}
      <div className={`relative p-3 rounded-lg text-sm leading-relaxed transition-colors ${
        isAdded 
          ? 'bg-emerald-500/5 border border-emerald-500/20' 
          : isModified
            ? 'bg-emerald-500/[0.03] border border-emerald-500/10'
            : 'bg-transparent border border-transparent'
      }`}>
        {afterText ? (
          <span className={isAdded || isModified ? 'text-emerald-400' : 'text-white/60'}>
            {afterText}
          </span>
        ) : (
          <span className="text-white/20 italic text-xs">— removed —</span>
        )}
        
        {/* Connector line on hover */}
        {isModified && (
          <motion.div
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
            className="absolute left-0 top-1/2 -translate-x-full w-4 h-px 
                       bg-gradient-to-r from-transparent to-emerald-500/50 origin-right"
          />
        )}
      </div>
    </motion.div>
  );
}

/**
 * Bullet point comparison for split view
 */
interface SplitBulletProps {
  before: string | null;
  after: string | null;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  index: number;
}

export function SplitBullet({ before, after, status, index }: SplitBulletProps) {
  const getBulletStyles = () => {
    switch (status) {
      case 'added':
        return {
          before: 'opacity-30',
          after: 'text-emerald-400',
          bulletBefore: 'bg-white/20',
          bulletAfter: 'bg-emerald-500',
        };
      case 'removed':
        return {
          before: 'text-red-400 line-through',
          after: 'opacity-30',
          bulletBefore: 'bg-red-500',
          bulletAfter: 'bg-white/20',
        };
      case 'modified':
        return {
          before: 'text-white/50',
          after: 'text-emerald-400',
          bulletBefore: 'bg-amber-500',
          bulletAfter: 'bg-emerald-500',
        };
      default:
        return {
          before: 'text-white/50',
          after: 'text-white/50',
          bulletBefore: 'bg-white/30',
          bulletAfter: 'bg-white/30',
        };
    }
  };

  const styles = getBulletStyles();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="grid grid-cols-2 gap-4"
    >
      {/* Before bullet */}
      <div className={`flex items-start gap-2 text-sm ${styles.before}`}>
        <span className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.bulletBefore}`} />
        <span className="leading-relaxed">
          {before || <span className="italic text-white/20 text-xs">—</span>}
        </span>
      </div>

      {/* After bullet */}
      <div className={`flex items-start gap-2 text-sm ${styles.after}`}>
        <span className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.bulletAfter}`} />
        <span className="leading-relaxed">
          {after || <span className="italic text-white/20 text-xs">—</span>}
        </span>
      </div>
    </motion.div>
  );
}




import { motion } from 'framer-motion';
import { Briefcase, Video, Users, Building, Trophy, Clock, Heart } from 'lucide-react';
import { CalendarEvent } from './types';
import { CompanyLogo } from '../common/CompanyLogo';
import moment from 'moment';

interface EventPillProps {
  event: CalendarEvent;
  onClick?: () => void;
  compact?: boolean;
  variant?: 'month' | 'week' | 'day';
}

export const EventPill = ({ event, onClick, compact = false, variant = 'month' }: EventPillProps) => {
  const getEventColors = () => {
    if (event.type === 'application') {
      return {
        bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
        border: 'border-blue-400/30',
        icon: <Briefcase className="w-3.5 h-3.5" />,
        badge: 'Applied',
        badgeBg: 'bg-blue-400/20',
      };
    }

    if (event.type === 'wishlist') {
      return {
        bg: 'bg-gradient-to-br from-pink-500 to-rose-500',
        border: 'border-pink-400/30',
        icon: <Heart className="w-3.5 h-3.5" />,
        badge: 'Wishlist',
        badgeBg: 'bg-pink-400/20',
      };
    }

    // Interview type colors
    const interview = event.resource?.interview;
    const interviewType = interview?.type || 'technical';

    switch (interviewType) {
      case 'technical':
        return {
          bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
          border: 'border-emerald-400/30',
          icon: <Video className="w-3.5 h-3.5" />,
          badge: 'Technical',
          badgeBg: 'bg-emerald-400/20',
        };
      case 'hr':
        return {
          bg: 'bg-gradient-to-br from-pink-500 to-rose-600',
          border: 'border-pink-400/30',
          icon: <Users className="w-3.5 h-3.5" />,
          badge: 'HR',
          badgeBg: 'bg-pink-400/20',
        };
      case 'manager':
        return {
          bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
          border: 'border-amber-400/30',
          icon: <Building className="w-3.5 h-3.5" />,
          badge: 'Manager',
          badgeBg: 'bg-amber-400/20',
        };
      case 'final':
        return {
          bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
          border: 'border-green-400/30',
          icon: <Trophy className="w-3.5 h-3.5" />,
          badge: 'Final',
          badgeBg: 'bg-green-400/20',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
          border: 'border-purple-400/30',
          icon: <Video className="w-3.5 h-3.5" />,
          badge: 'Interview',
          badgeBg: 'bg-purple-400/20',
        };
    }
  };

  const { bg, border, icon, badge, badgeBg } = getEventColors();
  const app = (event.type === 'application' || event.type === 'wishlist') ? event.resource : (event.resource?.application || event.resource);
  const companyName = app?.companyName || 'Company';
  const position = app?.position || 'Position';
  const showTime = !event.allDay && variant !== 'month';
  const time = showTime ? moment(event.start).format('HH:mm') : null;

  // Version pour month view (compacte avec logo) - Optimized density
  if (variant === 'month') {
    return (
      <div
        onClick={onClick}
        className={`
          ${bg}
          rounded-md
          border border-white/30
          px-1.5 py-0.5
          text-white
          cursor-pointer
          transition-all duration-150
          hover:shadow-md hover:shadow-black/25
          hover:scale-[1.02]
          overflow-hidden
          group
          min-h-[22px]
        `}
        style={{ 
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <CompanyLogo 
            companyName={companyName} 
            size="sm" 
            className="flex-shrink-0 ring-1 ring-white/30"
          />
          <div className="flex-1 min-w-0 flex items-center gap-1">
            <div className="font-semibold text-[10.5px] truncate leading-tight">
              {companyName}
            </div>
            <span className="text-white/60 text-[10px]">•</span>
            <div className="text-[9.5px] opacity-80 truncate leading-tight">
              {position.length > 20 ? position.substring(0, 20) + '...' : position}
            </div>
          </div>
          <div className={`${badgeBg} px-1.5 py-0.5 rounded text-[7.5px] font-semibold flex-shrink-0 backdrop-blur-sm uppercase tracking-wide`}>
            {badge}
          </div>
        </div>
      </div>
    );
  }

  // Version pour week/day view (plus détaillée)
  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`
        ${bg}
        rounded-lg
        border border-white/20
        p-2.5
        text-white
        cursor-pointer
        transition-all duration-200
        hover:shadow-lg hover:shadow-black/20
        overflow-hidden
        h-full
        flex flex-col
      `}
    >
      <div className="flex items-start gap-2 mb-2">
        <CompanyLogo 
          companyName={companyName} 
          size="md" 
          className="flex-shrink-0 ring-1 ring-white/20"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate leading-tight">
            {companyName}
          </div>
          {time && (
            <div className="flex items-center gap-1 text-xs opacity-90 mt-1">
              <Clock className="w-3 h-3" />
              {time}
            </div>
          )}
        </div>
        {icon}
      </div>
      <div className="text-xs opacity-90 truncate mb-2">
        {position}
      </div>
      <div className={`${badgeBg} px-2 py-1 rounded text-xs font-medium backdrop-blur-sm w-fit`}>
        {badge}
      </div>
    </motion.div>
  );
};


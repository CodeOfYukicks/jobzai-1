import { motion } from 'framer-motion';
import { Briefcase, Video, Users, Building, Trophy, Clock, Heart, MapPin } from 'lucide-react';
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
        // Apple-like blue gradient
        bgGradient: 'linear-gradient(135deg, #007AFF 0%, #0055D4 100%)',
        lightBg: 'rgba(0, 122, 255, 0.12)',
        accentColor: '#007AFF',
        icon: <Briefcase className="w-3 h-3" />,
        badge: 'Applied',
      };
    }

    if (event.type === 'wishlist') {
      return {
        bgGradient: 'linear-gradient(135deg, #FF2D55 0%, #D91A40 100%)',
        lightBg: 'rgba(255, 45, 85, 0.12)',
        accentColor: '#FF2D55',
        icon: <Heart className="w-3 h-3" />,
        badge: 'Wishlist',
      };
    }

    // Interview type colors - Apple palette
    const interview = event.resource?.interview;
    const interviewType = interview?.type || 'technical';

    switch (interviewType) {
      case 'technical':
        return {
          bgGradient: 'linear-gradient(135deg, #30D158 0%, #248A3D 100%)',
          lightBg: 'rgba(48, 209, 88, 0.12)',
          accentColor: '#30D158',
          icon: <Video className="w-3 h-3" />,
          badge: 'Technical',
        };
      case 'hr':
        return {
          bgGradient: 'linear-gradient(135deg, #BF5AF2 0%, #8944AB 100%)',
          lightBg: 'rgba(191, 90, 242, 0.12)',
          accentColor: '#BF5AF2',
          icon: <Users className="w-3 h-3" />,
          badge: 'HR',
        };
      case 'manager':
        return {
          bgGradient: 'linear-gradient(135deg, #FF9F0A 0%, #C77700 100%)',
          lightBg: 'rgba(255, 159, 10, 0.12)',
          accentColor: '#FF9F0A',
          icon: <Building className="w-3 h-3" />,
          badge: 'Manager',
        };
      case 'final':
        return {
          bgGradient: 'linear-gradient(135deg, #34C759 0%, #248A3D 100%)',
          lightBg: 'rgba(52, 199, 89, 0.12)',
          accentColor: '#34C759',
          icon: <Trophy className="w-3 h-3" />,
          badge: 'Final',
        };
      default:
        return {
          bgGradient: 'linear-gradient(135deg, #5856D6 0%, #3634A3 100%)',
          lightBg: 'rgba(88, 86, 214, 0.12)',
          accentColor: '#5856D6',
          icon: <Video className="w-3 h-3" />,
          badge: 'Interview',
        };
    }
  };

  const { bgGradient, lightBg, accentColor, icon, badge } = getEventColors();
  const app = (event.type === 'application' || event.type === 'wishlist') ? event.resource : (event.resource?.application || event.resource);
  const companyName = app?.companyName || 'Company';
  const position = app?.position || 'Position';
  const location = app?.location;
  const showTime = !event.allDay && variant !== 'month';
  const time = showTime ? moment(event.start).format('h:mm A') : null;

  // Compact Apple-style month view card - Readable & fits cells
  if (variant === 'month') {
    return (
      <div
        onClick={onClick}
        className="event-pill-apple group flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer overflow-hidden"
        style={{ 
          background: bgGradient,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.15s ease-out',
          minHeight: '22px',
        }}
      >
        {/* Small Company Logo */}
        <CompanyLogo 
          companyName={companyName} 
          size="sm" 
          className="flex-shrink-0 rounded"
        />
        
        {/* Company Name - Truncated */}
        <span className="text-[11px] font-medium text-white truncate flex-1 min-w-0">
          {companyName}
        </span>
        
        {/* Compact Badge */}
        <span 
          className="flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white/90"
          style={{ background: 'rgba(255, 255, 255, 0.2)' }}
        >
          {badge}
        </span>
      </div>
    );
  }

  // Week/day view card - More detailed
  return (
    <div
      onClick={onClick}
      className="event-pill-apple-expanded group h-full flex flex-col p-2.5 rounded-lg cursor-pointer overflow-hidden"
      style={{
        background: bgGradient,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.15s ease-out',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <CompanyLogo 
          companyName={companyName} 
          size="md" 
          className="flex-shrink-0 rounded"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-xs text-white truncate">
            {companyName}
          </h4>
          {time && (
            <div className="flex items-center gap-1 text-white/70 mt-0.5">
              <Clock className="w-2.5 h-2.5" />
              <span className="text-[10px]">{time}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Position */}
      <p className="text-[10px] text-white/75 truncate mb-1.5">
        {position}
      </p>
      
      {/* Badge */}
      <div className="mt-auto">
        <span 
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white/90"
          style={{ background: 'rgba(255, 255, 255, 0.18)' }}
        >
          {icon}
          {badge}
        </span>
      </div>
    </div>
  );
};


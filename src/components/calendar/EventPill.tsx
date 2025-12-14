import { motion } from 'framer-motion';
import { Briefcase, Video, Users, Building, Trophy, Clock, Heart, MapPin, ExternalLink } from 'lucide-react';
import { CalendarEvent } from './types';
import { CompanyLogo } from '../common/CompanyLogo';
import moment from 'moment';

// Google Calendar icon component
const GoogleCalendarIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface EventPillProps {
  event: CalendarEvent;
  onClick?: () => void;
  compact?: boolean;
  variant?: 'month' | 'week' | 'day';
}

export const EventPill = ({ event, onClick, compact = false, variant = 'month' }: EventPillProps) => {
  const getEventColors = () => {
    // Google Calendar events - distinctive Google style
    if (event.type === 'google') {
      return {
        bgGradient: 'linear-gradient(135deg, #4285F4 0%, #1a73e8 100%)',
        lightBg: 'rgba(66, 133, 244, 0.12)',
        accentColor: '#4285F4',
        icon: <GoogleCalendarIcon className="w-3 h-3" />,
        badge: 'Google',
        isGoogle: true,
      };
    }

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

  const colors = getEventColors();
  const { bgGradient, lightBg, accentColor, icon, badge } = colors;
  const isGoogleEvent = 'isGoogle' in colors && colors.isGoogle;
  
  // For Google events, use event title; for others, use company/position
  const app = (event.type === 'application' || event.type === 'wishlist') ? event.resource : (event.resource?.application || event.resource);
  const companyName = isGoogleEvent ? event.title : (app?.companyName || 'Company');
  const position = isGoogleEvent ? (event.resource?.location || '') : (app?.position || 'Position');
  const location = isGoogleEvent ? event.resource?.location : app?.location;
  const showTime = !event.allDay && variant !== 'month';
  const time = showTime ? moment(event.start).format('h:mm A') : null;
  const googleLink = event.resource?.htmlLink;

  // Compact Apple-style month view card - Readable & fits cells
  if (variant === 'month') {
    return (
      <div
        onClick={onClick}
        className="event-pill-apple group flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer overflow-hidden"
        style={{ 
          background: bgGradient,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          border: isGoogleEvent ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.15s ease-out',
          minHeight: '22px',
        }}
      >
        {/* Google icon or Company Logo */}
        {isGoogleEvent ? (
          <div className="flex-shrink-0 w-4 h-4 rounded bg-white flex items-center justify-center">
            <GoogleCalendarIcon className="w-3 h-3" />
          </div>
        ) : (
          <CompanyLogo 
            companyName={companyName} 
            size="sm" 
            className="flex-shrink-0 rounded"
          />
        )}
        
        {/* Event Title / Company Name - Truncated */}
        <span className="text-[11px] font-medium text-white truncate flex-1 min-w-0">
          {companyName}
        </span>
        
        {/* Compact Badge with Google logo for Google events */}
        <span 
          className="flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white/90 flex items-center gap-1"
          style={{ background: isGoogleEvent ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.2)' }}
        >
          {isGoogleEvent && <GoogleCalendarIcon className="w-2.5 h-2.5" />}
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
        border: isGoogleEvent ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.15s ease-out',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        {isGoogleEvent ? (
          <div className="flex-shrink-0 w-6 h-6 rounded bg-white flex items-center justify-center shadow-sm">
            <GoogleCalendarIcon className="w-4 h-4" />
          </div>
        ) : (
          <CompanyLogo 
            companyName={companyName} 
            size="md" 
            className="flex-shrink-0 rounded"
          />
        )}
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
        {/* External link for Google events */}
        {isGoogleEvent && googleLink && (
          <a 
            href={googleLink} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
            title="Open in Google Calendar"
          >
            <ExternalLink className="w-3 h-3 text-white/70" />
          </a>
        )}
      </div>
      
      {/* Position / Location for Google events */}
      {position && (
        <p className="text-[10px] text-white/75 truncate mb-1.5">
          {isGoogleEvent && location && <MapPin className="w-2.5 h-2.5 inline mr-1" />}
          {position}
        </p>
      )}
      
      {/* Badge */}
      <div className="mt-auto flex items-center gap-2">
        <span 
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white/90"
          style={{ background: isGoogleEvent ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.18)' }}
        >
          {icon}
          {badge}
        </span>
        {isGoogleEvent && (
          <span className="text-[8px] text-white/60">
            synced
          </span>
        )}
      </div>
    </div>
  );
};


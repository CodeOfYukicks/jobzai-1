import { Briefcase, Video, Users, Building, Trophy, Clock, Heart, MapPin, ExternalLink } from 'lucide-react';
import { CalendarEvent } from './types';
import { CompanyLogo } from '../common/CompanyLogo';
import { ProfileAvatar, generateGenderedAvatarConfigByName } from '../profile/avatar';
import moment from 'moment';

// Get display label for campaign status
const getCampaignStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    targets: 'Target',
    contacted: 'Contacted',
    follow_up: 'Follow-up',
    replied: 'Replied',
    meeting: 'Meeting',
    opportunity: 'Opportunity',
    no_response: 'No Response',
    closed: 'Closed',
  };
  return labels[status] || 'Outreach';
};

// Get colors for campaign status - refined palette
const getCampaignColors = (status: string) => {
  switch (status) {
    case 'targets':
      return {
        // Gris slate - neutral starting point
        bgGradient: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
        lightBg: 'rgba(100, 116, 139, 0.12)',
        accentColor: '#64748B',
      };
    case 'contacted':
      return {
        // Cyan doux - outreach initiated
        bgGradient: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)',
        lightBg: 'rgba(34, 211, 238, 0.12)',
        accentColor: '#22D3EE',
      };
    case 'follow_up':
      return {
        // Orange doux - needs attention
        bgGradient: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
        lightBg: 'rgba(251, 146, 60, 0.12)',
        accentColor: '#FB923C',
      };
    case 'replied':
      return {
        // Vert menthe - positive response
        bgGradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
        lightBg: 'rgba(52, 211, 153, 0.12)',
        accentColor: '#34D399',
      };
    case 'meeting':
      return {
        // Violet vif - scheduled meeting
        bgGradient: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
        lightBg: 'rgba(167, 139, 250, 0.12)',
        accentColor: '#A78BFA',
      };
    case 'opportunity':
      return {
        // Or - hot lead
        bgGradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
        lightBg: 'rgba(251, 191, 36, 0.12)',
        accentColor: '#FBBF24',
      };
    case 'no_response':
      return {
        // Rouge doux - no response
        bgGradient: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
        lightBg: 'rgba(248, 113, 113, 0.12)',
        accentColor: '#F87171',
      };
    case 'closed':
      return {
        // Vert foncé - deal closed
        bgGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        lightBg: 'rgba(5, 150, 105, 0.12)',
        accentColor: '#059669',
      };
    default:
      return {
        // Cyan par défaut - outreach
        bgGradient: 'linear-gradient(135deg, #67E8F9 0%, #22D3EE 100%)',
        lightBg: 'rgba(103, 232, 249, 0.12)',
        accentColor: '#67E8F9',
      };
  }
};

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

export const EventPill = ({ event, onClick, variant = 'month' }: EventPillProps) => {
  const getEventColors = () => {
    // Google Calendar events - softer Google style
    if (event.type === 'google') {
      return {
        bgGradient: 'linear-gradient(135deg, #5A9CF4 0%, #4A8CE8 100%)',
        lightBg: 'rgba(90, 156, 244, 0.12)',
        accentColor: '#5A9CF4',
        icon: <GoogleCalendarIcon className="w-3 h-3" />,
        badge: 'Google',
        isGoogle: true,
      };
    }

    if (event.type === 'application') {
      return {
        // Softer blue gradient - refined
        bgGradient: 'linear-gradient(135deg, #5B8DEF 0%, #4A7BD9 100%)',
        lightBg: 'rgba(91, 141, 239, 0.12)',
        accentColor: '#5B8DEF',
        icon: <Briefcase className="w-3 h-3" />,
        badge: 'Applied',
      };
    }

    if (event.type === 'wishlist') {
      return {
        // Rose poudré - softer pink
        bgGradient: 'linear-gradient(135deg, #E8668F 0%, #D64D77 100%)',
        lightBg: 'rgba(232, 102, 143, 0.12)',
        accentColor: '#E8668F',
        icon: <Heart className="w-3 h-3" />,
        badge: 'Wishlist',
      };
    }

    // Interview type colors - desaturated refined palette
    const interview = event.resource?.interview;
    const interviewType = interview?.type || 'technical';

    switch (interviewType) {
      case 'technical':
        return {
          // Vert sage - softer green
          bgGradient: 'linear-gradient(135deg, #4FBF8A 0%, #3DA876 100%)',
          lightBg: 'rgba(79, 191, 138, 0.12)',
          accentColor: '#4FBF8A',
          icon: <Video className="w-3 h-3" />,
          badge: 'Technical',
        };
      case 'hr':
        return {
          // Violet lavande - softer purple
          bgGradient: 'linear-gradient(135deg, #A886E0 0%, #8F6DD4 100%)',
          lightBg: 'rgba(168, 134, 224, 0.12)',
          accentColor: '#A886E0',
          icon: <Users className="w-3 h-3" />,
          badge: 'HR',
        };
      case 'manager':
        return {
          // Ambre doux - softer amber
          bgGradient: 'linear-gradient(135deg, #E5A54A 0%, #D89438 100%)',
          lightBg: 'rgba(229, 165, 74, 0.12)',
          accentColor: '#E5A54A',
          icon: <Building className="w-3 h-3" />,
          badge: 'Manager',
        };
      case 'final':
        return {
          // Vert emeraude - softer emerald
          bgGradient: 'linear-gradient(135deg, #5AC78B 0%, #48B578 100%)',
          lightBg: 'rgba(90, 199, 139, 0.12)',
          accentColor: '#5AC78B',
          icon: <Trophy className="w-3 h-3" />,
          badge: 'Final',
        };
      default:
        return {
          // Softer indigo
          bgGradient: 'linear-gradient(135deg, #7B79E0 0%, #6563C9 100%)',
          lightBg: 'rgba(123, 121, 224, 0.12)',
          accentColor: '#7B79E0',
          icon: <Video className="w-3 h-3" />,
          badge: 'Interview',
        };
    }
  };

  const colors = getEventColors();
  const { bgGradient, badge } = colors;
  const isGoogleEvent = 'isGoogle' in colors && colors.isGoogle;
  
  // For Google events, use event title; for others, use company/position
  const app = (event.type === 'application' || event.type === 'wishlist') ? event.resource : (event.resource?.application || event.resource);
  const companyName = isGoogleEvent ? event.title : (app?.companyName || 'Company');
  const position = isGoogleEvent ? (event.resource?.location || '') : (app?.position || 'Position');
  const location = isGoogleEvent ? event.resource?.location : app?.location;
  const showTime = !event.allDay && variant !== 'month';
  const time = showTime ? moment(event.start).format('h:mm A') : null;
  const googleLink = event.resource?.htmlLink;
  
  // Detect if this is a campaign/outreach event (person-based)
  const boardType = event.resource?.boardType || 'jobs';
  const isCampaign = boardType === 'campaigns';
  const contactName = event.resource?.contactName;
  const campaignStatus = event.resource?.status;
  
  // Get campaign-specific colors if it's a campaign
  const campaignColors = isCampaign ? getCampaignColors(campaignStatus) : null;
  
  // Use campaign gradient if available, otherwise use default
  const displayGradient = campaignColors?.bgGradient || bgGradient;
  
  // Display name: for campaigns show contact name, otherwise company name
  const displayName = isCampaign && contactName ? contactName : companyName;
  
  // Badge label: for campaigns use the status label, otherwise use the default badge
  const displayBadge = isCampaign ? getCampaignStatusLabel(campaignStatus) : badge;

  // Compact premium month view card - Minimal with badge label
  if (variant === 'month') {
    return (
      <div
        onClick={onClick}
        className="event-pill-apple group flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer overflow-hidden"
        style={{ 
          background: displayGradient,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '22px',
        }}
      >
        {/* Avatar for campaigns, Google icon, or Company Logo - compact 18px */}
        {isGoogleEvent ? (
          <div className="flex-shrink-0 w-[18px] h-[18px] rounded bg-white/95 flex items-center justify-center">
            <GoogleCalendarIcon className="w-2.5 h-2.5" />
          </div>
        ) : isCampaign && contactName ? (
          <ProfileAvatar
            config={generateGenderedAvatarConfigByName(contactName)}
            size={18}
            className="flex-shrink-0 rounded"
          />
        ) : (
          <CompanyLogo 
            companyName={companyName} 
            size="sm" 
            className="flex-shrink-0 !w-[18px] !h-[18px] rounded"
          />
        )}
        
        {/* Event Title / Name - Truncated */}
        <span className="text-[10px] font-medium text-white/95 truncate flex-1 min-w-0 tracking-tight">
          {displayName}
        </span>
        
        {/* Badge label - minimal style */}
        <span 
          className="flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase text-white/80 tracking-wide"
          style={{ background: 'rgba(255, 255, 255, 0.15)' }}
        >
          {displayBadge}
        </span>
      </div>
    );
  }

  // Week/day view card - Premium detailed view with better spacing
  return (
    <div
      onClick={onClick}
      className="event-pill-apple-expanded group h-full flex flex-col p-3 rounded-xl cursor-pointer overflow-hidden"
      style={{
        background: displayGradient,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Header with badge */}
      <div className="flex items-start gap-2.5 mb-2">
        {isGoogleEvent ? (
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/95 flex items-center justify-center shadow-sm">
            <GoogleCalendarIcon className="w-4 h-4" />
          </div>
        ) : isCampaign && contactName ? (
          <ProfileAvatar
            config={generateGenderedAvatarConfigByName(contactName)}
            size={28}
            className="flex-shrink-0 rounded-lg shadow-sm"
          />
        ) : (
          <CompanyLogo 
            companyName={companyName} 
            size="md" 
            className="flex-shrink-0 rounded-lg shadow-sm"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-semibold text-[13px] text-white/95 truncate tracking-tight">
              {displayName}
            </h4>
          </div>
          {/* Type badge - small pill style */}
          <span 
            className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase text-white/80 tracking-wide"
            style={{ background: 'rgba(255, 255, 255, 0.15)' }}
          >
            {displayBadge}
          </span>
        </div>
        {/* External link for Google events */}
        {isGoogleEvent && googleLink && (
          <a 
            href={googleLink} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 p-1.5 rounded-md hover:bg-white/15 transition-colors"
            title="Open in Google Calendar"
          >
            <ExternalLink className="w-3 h-3 text-white/60" />
          </a>
        )}
      </div>
      
      {/* Position / Location / Company for campaigns */}
      {(position || (isCampaign && companyName)) && (
        <p className="text-[11px] text-white/70 truncate mb-2 leading-relaxed">
          {isGoogleEvent && location && <MapPin className="w-2.5 h-2.5 inline mr-1 opacity-70" />}
          {isCampaign ? companyName : position}
        </p>
      )}
      
      {/* Time info - refined */}
      {time && (
        <div className="mt-auto flex items-center gap-1.5 text-white/65">
          <Clock className="w-3 h-3" />
          <span className="text-[10px] font-medium">{time}</span>
          {isGoogleEvent && (
            <>
              <span className="text-white/30 mx-1">·</span>
              <span className="text-[9px] text-white/50">synced</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};


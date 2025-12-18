import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  Building, 
  MapPin, 
  User, 
  FileText, 
  ExternalLink,
  Calendar,
  Download,
  Edit2,
  Video,
  Users,
  Trophy,
  Briefcase,
  Mail,
  Timer,
  CheckCircle2,
  Circle,
  AlertCircle,
  Layout,
  Heart,
  Link2,
  Linkedin,
  Send,
  MessageSquare,
  Phone
} from 'lucide-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { CalendarEvent } from '../types';
import { CompanyLogo } from '../../common/CompanyLogo';
import { ProfileAvatar, generateGenderedAvatarConfigByName } from '../../profile/avatar';

// Google Calendar icon component
const GoogleCalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export const EventModal = ({ event, onClose }: EventModalProps) => {
  const navigate = useNavigate();

  if (!event) return null;

  const isInterview = event.type === 'interview';
  const isGoogleEvent = event.type === 'google';
  const isWishlist = event.type === 'wishlist';
  const resource = event.resource || {};
  const application = isInterview ? (resource.application || resource) : resource;
  const interview = isInterview ? resource.interview : null;

  // Check if this is a campaign/outreach event
  const isCampaign = resource?.boardType === 'campaigns';

  // For Google events, use event title and resource properties
  const companyName = isGoogleEvent ? event.title : (application?.companyName || 'Company');
  const position = isGoogleEvent ? '' : (application?.position || 'Position');
  const googleLink = resource?.htmlLink;
  const googleDescription = resource?.description;
  const googleLocation = resource?.location;
  
  // Campaign/Outreach specific data
  const contactName = application?.contactName || '';
  const contactRole = application?.contactRole || application?.position || '';
  const contactEmail = application?.contactEmail || '';
  const contactPhone = application?.contactPhone || '';
  const contactLinkedIn = application?.contactLinkedIn || '';
  const outreachChannel = application?.outreachChannel || 'email';
  const warmthLevel = application?.warmthLevel || 'cold';
  const relationshipGoal = application?.relationshipGoal || 'networking';
  
  // Board info
  const boardName = resource?.boardName;
  const boardIcon = resource?.boardIcon;
  const boardColor = resource?.boardColor;

  // Generate .ics file for calendar
  const generateICSFile = () => {
    if (!isInterview || !interview) return;
    
    const startTime = moment(event.start).format('YYYYMMDDTHHmmss');
    const endTime = moment(event.end).format('YYYYMMDDTHHmmss');
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview with ${companyName}
DTSTART:${startTime}
DTEND:${endTime}
DESCRIPTION:Interview for ${position} position.${interview.notes ? '\\n\\n' + interview.notes : ''}
LOCATION:${interview.location || 'Remote/TBD'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `interview-${companyName}-${moment(event.start).format('YYYY-MM-DD')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNavigateToPrep = () => {
    if (isInterview && application?.id && interview?.id) {
      navigate(`/interview-prep/${application.id}/${interview.id}`);
    }
  };

  const handleNavigateToApplication = () => {
    if (application?.id) {
      // Include boardId to navigate to the correct board first
      const params = new URLSearchParams();
      params.set('highlight', application.id);
      if (resource?.boardId) {
        params.set('board', resource.boardId);
      }
      navigate(`/applications?${params.toString()}`);
    }
  };

  // Get colors based on event type
  const getEventColors = () => {
    // Google Calendar events
    if (isGoogleEvent) {
      return {
        gradient: 'from-[#4285F4]/15 to-[#1a73e8]/10',
        border: 'border-[#4285F4]/30',
        badge: 'bg-[#4285F4]/10 text-[#4285F4] dark:text-[#8ab4f8] border-[#4285F4]/20',
        icon: <GoogleCalendarIcon className="w-5 h-5" />,
        iconBg: 'bg-white dark:bg-gray-800',
        iconColor: 'text-[#4285F4]',
        isGoogle: true
      };
    }

    // Wishlist events
    if (isWishlist) {
      return {
        gradient: 'from-pink-500/10 to-rose-600/5',
        border: 'border-pink-500/20',
        badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
        icon: <Heart className="w-5 h-5" />,
        iconBg: 'bg-pink-500/10',
        iconColor: 'text-pink-600 dark:text-pink-400'
      };
    }

    // Campaign/Outreach events
    if (isCampaign) {
      return {
        gradient: 'from-violet-500/10 to-purple-600/5',
        border: 'border-violet-500/20',
        badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
        icon: <Send className="w-5 h-5" />,
        iconBg: 'bg-violet-500/10',
        iconColor: 'text-violet-600 dark:text-violet-400'
      };
    }

    if (event.type === 'application') {
      return {
        gradient: 'from-blue-500/10 to-blue-600/5',
        border: 'border-blue-500/20',
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: <Briefcase className="w-5 h-5" />,
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-600 dark:text-blue-400'
      };
    }

    const interviewType = interview?.type || 'technical';
    switch (interviewType) {
      case 'technical':
        return {
          gradient: 'from-emerald-500/10 to-teal-600/5',
          border: 'border-emerald-500/20',
          badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          icon: <Video className="w-5 h-5" />,
          iconBg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'hr':
        return {
          gradient: 'from-pink-500/10 to-rose-600/5',
          border: 'border-pink-500/20',
          badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
          icon: <Users className="w-5 h-5" />,
          iconBg: 'bg-pink-500/10',
          iconColor: 'text-pink-600 dark:text-pink-400'
        };
      case 'manager':
        return {
          gradient: 'from-amber-500/10 to-orange-600/5',
          border: 'border-amber-500/20',
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          icon: <Building className="w-5 h-5" />,
          iconBg: 'bg-amber-500/10',
          iconColor: 'text-amber-600 dark:text-amber-400'
        };
      case 'final':
        return {
          gradient: 'from-green-500/10 to-emerald-600/5',
          border: 'border-green-500/20',
          badge: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
          icon: <Trophy className="w-5 h-5" />,
          iconBg: 'bg-green-500/10',
          iconColor: 'text-green-600 dark:text-green-400'
        };
      default:
        return {
          gradient: 'from-purple-500/10 to-indigo-600/5',
          border: 'border-purple-500/20',
          badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          icon: <Video className="w-5 h-5" />,
          iconBg: 'bg-purple-500/10',
          iconColor: 'text-purple-600 dark:text-purple-400'
        };
    }
  };

  const colors = getEventColors();

  // Get status info
  const getStatusInfo = () => {
    if (isInterview && interview) {
      switch (interview.status) {
        case 'scheduled':
          return {
            icon: <Clock className="w-4 h-4" />,
            text: 'Scheduled',
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500/10'
          };
        case 'completed':
          return {
            icon: <CheckCircle2 className="w-4 h-4" />,
            text: 'Completed',
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-500/10'
          };
        case 'cancelled':
          return {
            icon: <AlertCircle className="w-4 h-4" />,
            text: 'Cancelled',
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-500/10'
          };
        default:
          return null;
      }
    }
    
    if (application?.status) {
      const statusMap: any = {
        'applied': { icon: <Circle className="w-4 h-4" />, text: 'Applied', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
        'interview': { icon: <Video className="w-4 h-4" />, text: 'Interview', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
        'offer': { icon: <Trophy className="w-4 h-4" />, text: 'Offer', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
        'rejected': { icon: <AlertCircle className="w-4 h-4" />, text: 'Rejected', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
      };
      return statusMap[application.status] || null;
    }
    
    return null;
  };

  const statusInfo = getStatusInfo();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ 
            duration: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#242325] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/20 dark:border-[#3d3c3e]/20"
        >
          {/* Header */}
          <div className="relative">
            {/* Close Button - Top right */}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {isCampaign && contactName ? (
              /* Campaign/Outreach Layout - Person-centric */
              <div className="p-6 pb-5">
                {/* Person Info - Centered hero section */}
                <div className="flex flex-col items-center text-center mb-5">
                  <ProfileAvatar
                    config={generateGenderedAvatarConfigByName(contactName)}
                    size={72}
                    className="rounded-2xl shadow-xl ring-4 ring-violet-100 dark:ring-violet-900/30 mb-4"
                  />
                  <h3 className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">
                    {contactName}
                  </h3>
                  {contactRole && (
                    <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
                      {contactRole}
                    </p>
                  )}
                    </div>

                {/* Company Card */}
                {companyName && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] mb-4">
                    <CompanyLogo 
                      companyName={companyName} 
                      size="md"
                      className="rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Company</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{companyName}</p>
                </div>
                  </div>
                )}

                {/* Tags row */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {/* Warmth Level Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    warmthLevel === 'hot' 
                      ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-600 dark:text-orange-400'
                      : warmthLevel === 'warm'
                        ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400'
                  }`}>
                    {warmthLevel === 'hot' ? '🔥' : warmthLevel === 'warm' ? '☀️' : '❄️'}
                    {warmthLevel.charAt(0).toUpperCase() + warmthLevel.slice(1)}
                  </span>
                  
                  {/* Channel Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400">
                    {outreachChannel === 'linkedin' ? <Linkedin className="w-3.5 h-3.5" /> : 
                     outreachChannel === 'email' ? <Mail className="w-3.5 h-3.5" /> : 
                     <MessageSquare className="w-3.5 h-3.5" />}
                    {outreachChannel.charAt(0).toUpperCase() + outreachChannel.slice(1)}
                  </span>

                  {/* Board Badge */}
                  {boardName && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <span 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: boardColor || '#8B5CF6' }}
                      />
                      {boardName}
                    </span>
                  )}
                </div>
              </div>
            ) : isInterview ? (
              /* Interview Layout - Interview-centric */
              <div className="p-6 pb-5">
                {/* Company centered hero */}
                <div className="flex flex-col items-center text-center mb-5">
                  <CompanyLogo 
                    companyName={companyName} 
                    size="xl"
                    className="rounded-2xl shadow-xl ring-4 ring-emerald-100 dark:ring-emerald-900/30 mb-4"
                  />
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${colors.badge}`}>
                      {colors.icon}
                      {interview?.type.charAt(0).toUpperCase() + interview?.type.slice(1)} Interview
                    </span>
                    {interview?.status && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                        interview.status === 'scheduled' 
                          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : interview.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}>
                        {interview.status === 'scheduled' ? '📅' : interview.status === 'completed' ? '✅' : '❌'}
                        {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">
                    {companyName}
                  </h3>
                  {position && (
                    <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
                      {position}
                    </p>
                  )}
                </div>

                {/* Date/Time Card - Prominent for interviews */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 mb-4">
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                    <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {moment(event.start).format('dddd, MMMM D, YYYY')}
                    </p>
                    {!event.allDay && (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        {moment(event.start).format('h:mm A')} – {moment(event.end).format('h:mm A')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Board Badge */}
                {boardName && (
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400">
                      <span 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: boardColor || '#6B7280' }}
                      />
                      {boardName}
                      </span>
                  </div>
                )}
              </div>
            ) : (event.type === 'application' || isWishlist) && !isGoogleEvent ? (
              /* Job Application / Wishlist Layout */
              <div className="p-6 pb-5">
                {/* Company centered hero */}
                <div className="flex flex-col items-center text-center mb-5">
                  <CompanyLogo 
                    companyName={companyName} 
                    size="xl"
                    className={`rounded-2xl shadow-xl ring-4 ${isWishlist ? 'ring-pink-100 dark:ring-pink-900/30' : 'ring-blue-100 dark:ring-blue-900/30'} mb-4`}
                  />
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${colors.badge}`}>
                      {colors.icon}
                      {isWishlist ? 'Wishlist' : 'Application'}
                    </span>
                    {statusInfo && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.text}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">
                    {companyName}
                  </h3>
                  {position && (
                    <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
                      {position}
                    </p>
                  )}
                </div>

                {/* Info Cards Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Date Card */}
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                    <div className={`p-2 rounded-lg ${isWishlist ? 'bg-pink-100 dark:bg-pink-500/20' : 'bg-blue-100 dark:bg-blue-500/20'}`}>
                      <Clock className={`w-4 h-4 ${isWishlist ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{isWishlist ? 'Added' : 'Applied'}</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{moment(event.start).format('MMM D, YYYY')}</p>
                    </div>
                  </div>

                  {/* Location Card */}
                  {application?.location && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                        <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Location</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{application.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Board Badge */}
                {boardName && (
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${isWishlist ? 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                        <span 
                          className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: boardColor || (isWishlist ? '#EC4899' : '#3B82F6') }}
                        />
                        {boardName}
                      </span>
                  </div>
                    )}
                  </div>
            ) : (
              /* Google Calendar Layout */
              <div className="p-6 pb-5">
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="w-[72px] h-[72px] rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-xl ring-4 ring-blue-50 dark:ring-blue-900/20 mb-4">
                    <GoogleCalendarIcon className="w-10 h-10" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#4285F4]/10 text-[#4285F4]">
                      <GoogleCalendarIcon className="w-3.5 h-3.5" />
                      Google Calendar
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Synced
                    </span>
                  </div>
                  <h3 className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">
                    {companyName}
                  </h3>
                </div>

                {/* Date/Time Card */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#4285F4]/5 dark:bg-[#4285F4]/10 border border-[#4285F4]/20 mb-4">
                  <div className="p-3 rounded-xl bg-[#4285F4]/10">
                    <Clock className="w-5 h-5 text-[#4285F4]" />
              </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {moment(event.start).format('dddd, MMMM D, YYYY')}
                    </p>
                    {!event.allDay && (
                      <p className="text-sm text-[#4285F4] font-medium">
                        {moment(event.start).format('h:mm A')} – {moment(event.end).format('h:mm A')}
                      </p>
                    )}
            </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-6 pb-4 space-y-3 overflow-y-auto max-h-[calc(90vh-320px)]">
            
            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-800 -mx-6 mb-4" />

            {/* ========== CAMPAIGN CONTENT ========== */}
            {isCampaign && (
              <>
                {/* Date Card for campaigns */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
            >
                  <div className="p-2.5 rounded-lg bg-violet-100 dark:bg-violet-500/20">
                    <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {moment(event.start).format('dddd, MMMM D, YYYY')}
                </p>
                  </div>
                </motion.div>

                {/* Contact Details - Grid layout */}
                {(contactEmail || contactPhone || contactLinkedIn) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-2"
                  >
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
                      Contact
                    </p>
                    <div className="grid gap-2">
                      {contactEmail && (
                        <a 
                          href={`mailto:${contactEmail}`}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-all group"
                        >
                          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/20">
                            <Mail className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{contactEmail}</span>
                        </a>
                      )}
                      {contactPhone && (
                        <a 
                          href={`tel:${contactPhone}`}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-all group"
                        >
                          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/20">
                            <Phone className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{contactPhone}</span>
                        </a>
                      )}
                      {contactLinkedIn && (
                        <a 
                          href={contactLinkedIn.startsWith('http') ? contactLinkedIn : `https://${contactLinkedIn}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/5 transition-all group"
                        >
                          <div className="p-2 rounded-lg bg-[#0A66C2]/10">
                            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                          </div>
                          <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#0A66C2] transition-colors">LinkedIn Profile</span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0A66C2] transition-colors" />
                        </a>
                )}
              </div>
            </motion.div>
                )}

                {/* Relationship Goal */}
                {relationshipGoal && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
              >
                    <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-500/20">
                      <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Goal</p>
                      <p className="text-sm text-gray-900 dark:text-white font-semibold capitalize">{relationshipGoal.replace(/_/g, ' ')}</p>
                </div>
              </motion.div>
                )}
              </>
            )}

            {/* ========== INTERVIEW CONTENT ========== */}
            {isInterview && (
              <>
                {/* Location */}
                {interview?.location && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
              >
                    <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Location</p>
                      <p className="text-sm text-gray-900 dark:text-white font-semibold">{interview.location}</p>
                    </div>
                  </motion.div>
                )}

                {/* Interviewer Contact */}
                {(interview?.contactName || interview?.contactEmail) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-2"
                  >
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
                      Interviewer
                    </p>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                      <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                        <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        {interview.contactName && (
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{interview.contactName}</p>
                  )}
                  {interview.contactEmail && (
                    <a 
                      href={`mailto:${interview.contactEmail}`}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {interview.contactEmail}
                    </a>
                  )}
                </div>
                </div>
              </motion.div>
            )}

                {/* Interview Notes */}
                {interview?.notes && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
              >
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                      Notes
                </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{interview.notes}</p>
              </motion.div>
                )}
              </>
            )}

            {/* ========== APPLICATION / WISHLIST CONTENT ========== */}
            {(event.type === 'application' || isWishlist) && !isGoogleEvent && !isCampaign && !isInterview && (
              <>
                {/* Job URL */}
                {application?.url && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
              >
                <a
                      href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all group"
                >
                      <div className={`p-2.5 rounded-lg ${isWishlist ? 'bg-pink-100 dark:bg-pink-500/20' : 'bg-blue-100 dark:bg-blue-500/20'}`}>
                        <ExternalLink className={`w-4 h-4 ${isWishlist ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Job Posting</p>
                        <p className={`text-sm font-medium truncate ${isWishlist ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`}>{application.url}</p>
                  </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </a>
              </motion.div>
            )}

                {/* Salary */}
                {application?.salary && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
                  >
                    <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-500/20">
                      <Briefcase className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Salary</p>
                      <p className="text-sm text-gray-900 dark:text-white font-semibold">{application.salary}</p>
                    </div>
                  </motion.div>
                )}

                {/* Contact Info */}
                {(application?.contactName || application?.contactEmail) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
                      Contact
                    </p>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                      <div className={`p-2.5 rounded-lg ${isWishlist ? 'bg-pink-100 dark:bg-pink-500/20' : 'bg-blue-100 dark:bg-blue-500/20'}`}>
                        <User className={`w-4 h-4 ${isWishlist ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`} />
                      </div>
                      <div className="flex-1">
                        {application.contactName && (
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{application.contactName}</p>
                        )}
                        {application.contactEmail && (
                          <a 
                            href={`mailto:${application.contactEmail}`}
                            className={`text-xs hover:underline ${isWishlist ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`}
                          >
                            {application.contactEmail}
                          </a>
                        )}
                  </div>
                  </div>
              </motion.div>
            )}

            {/* Notes */}
                {application?.notes && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
              >
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Notes
                </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{application.notes}</p>
                  </motion.div>
                )}
              </>
            )}

            {/* ========== GOOGLE CALENDAR CONTENT ========== */}
            {isGoogleEvent && (
              <>
                {/* Google Location */}
                {googleLocation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
                  >
                    <div className="p-2.5 rounded-lg bg-[#EA4335]/10">
                      <MapPin className="w-4 h-4 text-[#EA4335]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Location</p>
                      <p className="text-sm text-gray-900 dark:text-white font-semibold">{googleLocation}</p>
                    </div>
                  </motion.div>
                )}

                {/* Google Description */}
                {googleDescription && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
                  >
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Description
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{googleDescription}</p>
                  </motion.div>
                )}

                {/* Google Link */}
                {googleLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <a
                      href={googleLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#4285F4]/5 dark:bg-[#4285F4]/10 border border-[#4285F4]/20 hover:bg-[#4285F4]/10 transition-all group"
                    >
                      <div className="p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <Link2 className="w-4 h-4 text-[#4285F4]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#4285F4]">View in Google Calendar</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#4285F4] group-hover:translate-x-0.5 transition-transform" />
                    </a>
              </motion.div>
                )}
              </>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20">
            <div className="flex items-center justify-between gap-3">
              {/* Left side - Close button */}
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Close
              </button>

              {/* Right side - Action buttons */}
              <div className="flex items-center gap-2">
                {/* Quick Actions for Interviews */}
                {isInterview && interview?.status === 'scheduled' && (
                  <>
                    <button
                      onClick={generateICSFile}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>

                    {application?.id && interview?.id && (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleNavigateToPrep}
                        className="px-5 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-all flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Prepare Interview
                      </motion.button>
                    )}
                  </>
                )}

                {/* Action for Google Events */}
                {isGoogleEvent && googleLink && (
                  <motion.a
                    href={googleLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="px-5 py-2 text-sm font-semibold text-white bg-[#4285F4] hover:bg-[#3367D6] rounded-lg transition-all flex items-center gap-2"
                  >
                    <GoogleCalendarIcon className="w-4 h-4" />
                    Open in Google
                    <ExternalLink className="w-3.5 h-3.5" />
                  </motion.a>
                )}

                {/* Action for Campaigns */}
                {!isInterview && !isGoogleEvent && isCampaign && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleNavigateToApplication}
                    className="px-5 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-all flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    View Outreach
                  </motion.button>
                )}

                {/* Action for Applications */}
                {!isInterview && !isGoogleEvent && !isCampaign && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleNavigateToApplication}
                    className="px-5 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-all flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    View Application
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

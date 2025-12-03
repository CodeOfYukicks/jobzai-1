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
  AlertCircle
} from 'lucide-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { CalendarEvent } from '../types';
import { CompanyLogo } from '../../common/CompanyLogo';

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export const EventModal = ({ event, onClose }: EventModalProps) => {
  const navigate = useNavigate();

  if (!event) return null;

  const isInterview = event.type === 'interview';
  const resource = event.resource || {};
  const application = isInterview ? (resource.application || resource) : resource;
  const interview = isInterview ? resource.interview : null;

  const companyName = application?.companyName || 'Company';
  const position = application?.position || 'Position';

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
      navigate(`/applications?highlight=${application.id}`);
    }
  };

  // Get colors based on event type
  const getEventColors = () => {
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
          className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/20 dark:border-gray-700/20"
        >
          {/* Header - Google Style */}
          <div className="relative">
            {/* Subtle top accent bar */}
            <div className={`h-1.5 bg-gradient-to-r ${colors.gradient.replace('/10', '/40').replace('/5', '/30')}`} />
            
            <div className="p-6 pb-4">
              <div className="flex items-start gap-4">
                {/* Company Logo - Simple without overlay icon */}
                <div className="flex-shrink-0">
                  <CompanyLogo 
                    companyName={companyName} 
                    size="lg"
                    className="ring-2 ring-gray-100 dark:ring-gray-800 shadow-sm"
                  />
                </div>

                {/* Title and Meta */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-2xl text-gray-900 dark:text-white tracking-tight mb-0.5">
                    {companyName}
                  </h3>
                  <p className="text-base text-gray-600 dark:text-gray-400 mb-3">
                    {position}
                  </p>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Type Badge with icon */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colors.badge}`}>
                      <div className="w-3.5 h-3.5">
                        {colors.icon}
                      </div>
                      {isInterview ? `${interview?.type.charAt(0).toUpperCase() + interview?.type.slice(1)} Interview` : 'Application'}
                    </span>
                    
                    {/* Status Badge */}
                    {statusInfo && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Close Button - Google Style */}
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.05)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Content - Google Style */}
          <div className="p-6 pt-4 space-y-1 overflow-y-auto max-h-[calc(90vh-280px)]">
            {/* Date and Time */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-4 px-4 py-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-default"
            >
              <div className={`p-2.5 rounded-full ${colors.iconBg}`}>
                <Clock className={`w-5 h-5 ${colors.iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {moment(event.start).format('dddd, MMMM D, YYYY')}
                </p>
                {!event.allDay && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5" />
                    {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      ({moment.duration(moment(event.end).diff(moment(event.start))).asMinutes()} min)
                    </span>
                  </p>
                )}
              </div>
            </motion.div>

            {/* Location (for interviews) */}
            {isInterview && interview?.location && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-start gap-4 px-4 py-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-default"
              >
                <div className={`p-2.5 rounded-full ${colors.iconBg}`}>
                  <MapPin className={`w-5 h-5 ${colors.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Location</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{interview.location}</p>
                </div>
              </motion.div>
            )}

            {/* Contact (for interviews) */}
            {isInterview && (interview?.contactName || interview?.contactEmail) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-4 px-4 py-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-default"
              >
                <div className={`p-2.5 rounded-full ${colors.iconBg}`}>
                  <User className={`w-5 h-5 ${colors.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Interviewer</p>
                  {interview.contactName && (
                    <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                      {interview.contactName}
                    </p>
                  )}
                  {interview.contactEmail && (
                    <a 
                      href={`mailto:${interview.contactEmail}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors inline-flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {interview.contactEmail}
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            {/* Job URL (for applications) */}
            {!isInterview && application?.url && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer"
                >
                  <div className={`p-2.5 rounded-full ${colors.iconBg} group-hover:scale-110 transition-transform`}>
                    <ExternalLink className={`w-5 h-5 ${colors.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Job Posting</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate group-hover:underline">{application.url}</p>
                  </div>
                </a>
              </motion.div>
            )}

            {/* Notes */}
            {((isInterview && interview?.notes) || (!isInterview && application?.notes)) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/30"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-wide">
                  <FileText className="w-3.5 h-3.5" />
                  Notes
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {isInterview ? interview?.notes : application?.notes}
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer with Actions - Google Style */}
          <div className="px-6 py-4 border-t border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-center justify-between gap-3">
              {/* Left side - Close button (Google text button style) */}
              <motion.button
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-full transition-all"
              >
                Close
              </motion.button>

              {/* Right side - Action buttons */}
              <div className="flex items-center gap-2">
                {/* Quick Actions for Interviews */}
                {isInterview && interview?.status === 'scheduled' && (
                  <>
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={generateICSFile}
                      className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-full transition-all flex items-center gap-2 border border-gray-300/30 dark:border-gray-600/30"
                    >
                      <Download className="w-4 h-4" />
                      Add to Calendar
                    </motion.button>

                    {application?.id && interview?.id && (
                      <motion.button
                        whileHover={{ 
                          scale: 1.02,
                          boxShadow: '0 8px 24px rgba(147, 51, 234, 0.35)'
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNavigateToPrep}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full transition-all flex items-center gap-2 shadow-md"
                      >
                        <FileText className="w-4 h-4" />
                        Prepare for Interview
                      </motion.button>
                    )}
                  </>
                )}

                {/* Action for Applications */}
                {!isInterview && (
                  <motion.button
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: '0 8px 24px rgba(26, 115, 232, 0.35)'
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToApplication}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full transition-all flex items-center gap-2 shadow-md"
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

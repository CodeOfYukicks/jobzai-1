import { format, parseISO, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Circle,
  Video,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Interview, JobApplication } from '../../types/job';
import { motion } from 'framer-motion';

// Helper function to safely parse dates from Firestore
const parseDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();

  // If it's already a Date object
  if (dateValue instanceof Date) return dateValue;

  // If it's a Firestore Timestamp
  if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // If it's a timestamp number
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }

  // If it's an ISO string
  if (typeof dateValue === 'string') {
    const parsed = parseISO(dateValue);
    return isValid(parsed) ? parsed : new Date();
  }

  return new Date();
};

const interviewTypeConfig = {
  technical: { label: 'Technical', color: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' },
  hr: { label: 'HR', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' },
  manager: { label: 'Manager', color: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800' },
  final: { label: 'Final', color: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
  other: { label: 'Other', color: 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
};

const statusConfig = {
  scheduled: { icon: Circle, color: 'text-blue-500', label: 'Scheduled', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Completed', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  cancelled: { icon: XCircle, color: 'text-red-500', label: 'Cancelled', bg: 'bg-red-50 dark:bg-red-900/20' },
};

interface InterviewCardProps {
  interview: Interview;
  jobApplication?: JobApplication;
}

export const InterviewCard = ({ interview, jobApplication }: InterviewCardProps) => {
  const navigate = useNavigate();
  const typeConfig = interviewTypeConfig[interview.type];
  const statusConf = statusConfig[interview.status];
  const date = parseDate(interview.date);

  const handlePrepareInterview = () => {
    if (!jobApplication?.id) return;

    navigate(`/interview-prep/${jobApplication.id}/${interview.id}`, {
      state: {
        interviewId: interview.id,
        companyName: jobApplication?.companyName || '',
        position: jobApplication?.position || '',
        interviewDate: interview.date,
        interviewTime: interview.time,
        jobUrl: jobApplication?.url,
        jobDescription: jobApplication?.fullJobDescription || jobApplication?.description,
      }
    });
  };

  const isVideoCall = interview.location?.toLowerCase().match(/zoom|meet|teams|skype|webex/);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Left Side - Date Visual */}
        <div className="sm:w-32 bg-gray-50 dark:bg-gray-800/50 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-6 gap-1 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 transition-colors">
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {format(date, 'MMM')}
          </span>
          <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            {format(date, 'd')}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {format(date, 'EEEE')}
          </span>
        </div>

        {/* Right Side - Content */}
        <div className="flex-1 p-5 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
                {interview.status !== 'scheduled' && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1 ${statusConf.bg} ${statusConf.color}`}>
                    {statusConf.label}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Interview
              </h3>
            </div>

            {/* Options / Status Indicator */}
            <div className="flex items-center gap-2">
              {interview.status === 'scheduled' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Upcoming
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mb-5">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <span className="font-medium">{interview.time}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                {isVideoCall ? (
                  <Video className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <span className="font-medium truncate">{interview.location || 'No location set'}</span>
            </div>

            {interview.interviewers && interview.interviewers.length > 0 && (
              <div className="col-span-1 sm:col-span-2 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {interview.interviewers.map((interviewer, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300">
                      {interviewer}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {interview.notes && (
            <div className="mb-5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                  {interview.notes}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {interview.status === 'scheduled' && (
              <motion.button
                onClick={handlePrepareInterview}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 relative overflow-hidden group bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-gray-900/20 dark:shadow-white/10 group-hover:shadow-2xl group-hover:shadow-gray-900/40 dark:group-hover:shadow-gray-800/40"
              >
                {/* Subtle brightness overlay on hover */}
                <motion.div 
                  className="absolute inset-0 bg-white/5 dark:bg-gray-900/5"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Premium shimmer effect */}
                <motion.div 
                  className="absolute inset-0"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                >
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 dark:via-gray-100/10 to-transparent skew-x-12" />
                </motion.div>
                
                {/* Content */}
                <span className="relative z-10 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    whileHover={{ rotate: [0, 15, -15, 0], scale: 1.15 }}
                  >
                    <Sparkles className="w-4 h-4 transition-transform duration-300" />
                  </motion.div>
                  <span className="group-hover:font-semibold transition-all duration-300">Prepare with AI</span>
                </span>
              </motion.button>
            )}

            {interview.status === 'completed' && (
              <button
                onClick={handlePrepareInterview}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                View Notes
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

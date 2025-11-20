import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Building, MapPin, User, Info, FileText } from 'lucide-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { CalendarEvent } from '../types';

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export const EventModal = ({ event, onClose }: EventModalProps) => {
  const navigate = useNavigate();

  if (!event) return null;

  const isInterview = event.type === 'interview';
  const resource = event.resource || {};
  const application = isInterview ? resource.application : resource;
  const interview = isInterview ? resource.interview : null;

  const handleNavigateToPrep = () => {
    if (isInterview && application?.id && interview?.id) {
      navigate(`/interview-prep/${application.id}/${interview.id}`);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-xl text-gray-900 dark:text-white tracking-tight">
                  {event.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {moment(event.start).format('dddd, MMMM D, YYYY')}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Date and Time */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {moment(event.start).format('dddd, MMMM D, YYYY')}
                </p>
                {!event.allDay && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                  </p>
                )}
              </div>
            </div>

            {/* Company */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Building className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {application?.companyName || 'Company'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {application?.position || 'Position'}
                </p>
              </div>
            </div>

            {/* Location (for interviews) */}
            {isInterview && interview?.location && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{interview.location}</p>
                </div>
              </div>
            )}

            {/* Contact (for interviews) */}
            {isInterview && interview?.contactName && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Contact</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {interview.contactName}
                    {interview.contactEmail && ` • ${interview.contactEmail}`}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {((isInterview && interview?.notes) || application?.notes) && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Notes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {isInterview ? interview?.notes : application?.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-between gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </motion.button>

            {isInterview && application?.id && interview?.id && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNavigateToPrep}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Prepare for Interview
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


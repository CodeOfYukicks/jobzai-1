import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink,
  Briefcase,
  FileText,
  BarChart3,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Globe,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Mail,
  Phone,
  Link as LinkIcon
} from 'lucide-react';
import type { MentionEmbedType, MentionEmbedData } from './extensions/MentionEmbed';

interface MentionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MentionEmbedData | null;
}

const typeConfig: Record<MentionEmbedType, { 
  icon: React.ReactNode; 
  label: string;
  gradient: string;
  route: (id: string, extra?: any) => string;
}> = {
  'job-application': {
    icon: <Briefcase className="w-6 h-6" />,
    label: 'Job Application',
    gradient: 'from-blue-500 to-indigo-600',
    route: (id) => `/applications?highlight=${id}`,
  },
  'resume': {
    icon: <FileText className="w-6 h-6" />,
    label: 'Resume',
    gradient: 'from-emerald-500 to-teal-600',
    route: (id) => `/resume-builder/${id}/cv-editor`,
  },
  'cv-analysis': {
    icon: <BarChart3 className="w-6 h-6" />,
    label: 'CV Analysis',
    gradient: 'from-purple-500 to-pink-600',
    route: (id) => `/cv-analysis?highlight=${id}`,
  },
  'interview': {
    icon: <Calendar className="w-6 h-6" />,
    label: 'Interview',
    gradient: 'from-amber-500 to-orange-600',
    route: (id, extra) => `/interviews?application=${extra?.applicationId || ''}&interview=${id}`,
  },
};

// Status styling
const getStatusStyles = (status?: string, type?: MentionEmbedType) => {
  if (!status) return { bg: '', text: '', dot: '' };
  
  const statusLower = status.toLowerCase();
  
  if (type === 'job-application') {
    switch (statusLower) {
      case 'applied': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' };
      case 'interview': return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' };
      case 'offer': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' };
      case 'rejected': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' };
      case 'archived': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500' };
      case 'wishlist': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' };
      default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500' };
    }
  }
  
  if (type === 'interview') {
    switch (statusLower) {
      case 'scheduled': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' };
      case 'completed': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' };
      case 'cancelled': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' };
      default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500' };
    }
  }
  
  return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500' };
};

// Score color
const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
};

export default function MentionDetailModal({ isOpen, onClose, data }: MentionDetailModalProps) {
  const navigate = useNavigate();

  // Listen for custom event to open modal
  useEffect(() => {
    const handleMentionClick = (event: CustomEvent<{ type: MentionEmbedType; id: string; data: MentionEmbedData }>) => {
      // This would be handled by parent component
    };

    window.addEventListener('mention-embed-click' as any, handleMentionClick);
    return () => window.removeEventListener('mention-embed-click' as any, handleMentionClick);
  }, []);

  const handleNavigate = useCallback(() => {
    if (!data) return;
    const config = typeConfig[data.type];
    const route = config.route(data.id, data.extra);
    navigate(route);
    onClose();
  }, [data, navigate, onClose]);

  if (!data) return null;

  const config = typeConfig[data.type];
  const statusStyles = getStatusStyles(data.status, data.type);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
          >
            {/* Header with gradient */}
            <div className={`relative h-24 bg-gradient-to-br ${config.gradient}`}>
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10" 
                style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
              />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="absolute -bottom-6 left-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-xl ring-4 ring-white dark:ring-gray-900`}>
                  {config.icon}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="pt-10 pb-6 px-6">
              {/* Type & Status */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {config.label}
                </span>
                {data.status && (
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles.bg} ${statusStyles.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`} />
                    {data.status}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {data.title}
              </h2>

              {/* Subtitle */}
              {data.subtitle && (
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {data.subtitle}
                </p>
              )}

              {/* Date */}
              {data.date && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {data.date}
                </p>
              )}

              {/* Score for CV Analysis */}
              {data.type === 'cv-analysis' && data.score !== undefined && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Match Score</span>
                    <span className={`text-3xl font-bold ${getScoreColor(data.score)}`}>
                      {data.score}%
                    </span>
                  </div>
                  {data.extra?.categoryScores && (
                    <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      {Object.entries(data.extra.categoryScores).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className={`text-sm font-semibold ${getScoreColor(value as number)}`}>
                            {value as number}%
                          </div>
                          <div className="text-[10px] text-gray-500 capitalize">
                            {key}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Extra info based on type */}
              {data.extra && (
                <div className="mt-4 space-y-3">
                  {/* Job Application extras */}
                  {data.type === 'job-application' && (
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                      {data.extra.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{data.extra.location}</span>
                        </div>
                      )}
                      {data.extra.salary && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">{data.extra.salary}</span>
                        </div>
                      )}
                      {data.extra.workType && (
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium capitalize">
                          {data.extra.workType}
                        </span>
                      )}
                      {data.extra.platform && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Globe className="w-4 h-4" />
                          <span>via {data.extra.platform}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interview extras */}
                  {data.type === 'interview' && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {data.date}
                          </span>
                        </div>
                        {data.extra?.time && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {data.extra.time}
                            </span>
                          </div>
                        )}
                      </div>
                      {data.extra?.interviewType && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="capitalize">{data.extra.interviewType} Interview</span>
                          {data.extra.location && (
                            <>
                              <span>•</span>
                              <span>{data.extra.location}</span>
                            </>
                          )}
                        </div>
                      )}
                      {data.extra?.interviewers && data.extra.interviewers.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{data.extra.interviewers.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CV Analysis extras - Key Findings */}
                  {data.type === 'cv-analysis' && data.extra?.keyFindings && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Key Findings
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(data.extra.keyFindings as string[]).slice(0, 5).map((finding, i) => (
                          <span 
                            key={i} 
                            className="px-2.5 py-1 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          >
                            {finding.length > 40 ? finding.slice(0, 40) + '...' : finding}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resume extras */}
                  {data.type === 'resume' && data.extra?.template && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Template: <span className="font-medium">{data.extra.template.replace(/-/g, ' ')}</span></span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleNavigate}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r ${config.gradient} text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`}
                >
                  <span>Open {config.label}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


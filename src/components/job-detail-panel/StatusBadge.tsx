import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { UserProfile } from '../../types/profile';

interface StatusBadgeProps {
  profile: UserProfile | null;
  loading: boolean;
}

export const StatusBadge = ({ profile, loading }: StatusBadgeProps) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e]"
      >
        <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Loading profile...
        </span>
      </motion.div>
    );
  }

  const hasBasicProfile = profile && (profile.firstName || profile.email);
  const hasDetailedProfile = profile && (
    profile.professionalSummary || 
    (profile.workExperience && profile.workExperience.length > 0) ||
    (profile.skills && profile.skills.length > 0)
  );

  let status: 'ready' | 'incomplete' | 'required';
  let icon: React.ReactNode;
  let text: string;
  let dotColor: string;
  let bgColor: string;
  let borderColor: string;
  let textColor: string;

  if (!hasBasicProfile) {
    status = 'required';
    icon = <XCircle className="w-3.5 h-3.5" />;
    text = 'Profile Required';
    dotColor = 'bg-red-500';
    bgColor = 'bg-red-50 dark:bg-red-900/10';
    borderColor = 'border-red-200 dark:border-red-800';
    textColor = 'text-red-700 dark:text-red-400';
  } else if (!hasDetailedProfile) {
    status = 'incomplete';
    icon = <AlertCircle className="w-3.5 h-3.5" />;
    text = 'Profile Incomplete';
    dotColor = 'bg-yellow-500';
    bgColor = 'bg-yellow-50 dark:bg-yellow-900/10';
    borderColor = 'border-yellow-200 dark:border-yellow-800';
    textColor = 'text-yellow-700 dark:text-yellow-400';
  } else {
    status = 'ready';
    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
    text = 'Profile Ready';
    dotColor = 'bg-green-500';
    bgColor = 'bg-green-50 dark:bg-green-900/10';
    borderColor = 'border-green-200 dark:border-green-800';
    textColor = 'text-green-700 dark:text-green-400';
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${bgColor} ${borderColor} ${textColor} group cursor-help relative`}
      title={
        status === 'required' 
          ? 'Please complete your profile to use AI features'
          : status === 'incomplete'
          ? 'Add more details to your profile for better results'
          : 'Your profile is ready for AI generation'
      }
    >
      <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
      <span className="text-xs font-medium">{text}</span>
      {icon}
    </motion.div>
  );
};

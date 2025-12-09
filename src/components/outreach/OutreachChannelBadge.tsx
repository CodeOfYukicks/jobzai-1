import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Linkedin, 
  Users, 
  Calendar, 
  Phone, 
  MessageSquare,
  Twitter,
  User,
} from 'lucide-react';
import { OutreachChannel, OUTREACH_CHANNEL_CONFIG } from '../../types/job';

interface OutreachChannelBadgeProps {
  channel: OutreachChannel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
}

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1.5',
  lg: 'text-sm px-2.5 py-1.5 gap-2',
};

const iconSizes = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

const ChannelIcon = ({ channel, size }: { channel: OutreachChannel; size: 'sm' | 'md' | 'lg' }) => {
  const className = iconSizes[size];
  const config = OUTREACH_CHANNEL_CONFIG[channel];
  
  const iconMap: Record<string, React.ReactNode> = {
    Mail: <Mail className={className} />,
    Linkedin: <Linkedin className={className} />,
    Users: <Users className={className} />,
    Calendar: <Calendar className={className} />,
    Phone: <Phone className={className} />,
    Twitter: <Twitter className={className} />,
    User: <User className={className} />,
    MessageSquare: <MessageSquare className={className} />,
  };
  
  return iconMap[config.icon] || <MessageSquare className={className} />;
};

const variantClasses = {
  default: {
    email: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    linkedin: 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/30',
    referral: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    event: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    cold_call: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    twitter: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
    phone: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    in_person: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    other: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  },
  outline: {
    email: 'bg-transparent text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700',
    linkedin: 'bg-transparent text-[#0A66C2] border-[#0A66C2]/50',
    referral: 'bg-transparent text-green-600 dark:text-green-400 border-green-300 dark:border-green-700',
    event: 'bg-transparent text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700',
    cold_call: 'bg-transparent text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700',
    twitter: 'bg-transparent text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700',
    phone: 'bg-transparent text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
    in_person: 'bg-transparent text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700',
    other: 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600',
  },
  ghost: {
    email: 'bg-transparent text-blue-600 dark:text-blue-400 border-transparent',
    linkedin: 'bg-transparent text-[#0A66C2] border-transparent',
    referral: 'bg-transparent text-green-600 dark:text-green-400 border-transparent',
    event: 'bg-transparent text-purple-600 dark:text-purple-400 border-transparent',
    cold_call: 'bg-transparent text-orange-600 dark:text-orange-400 border-transparent',
    twitter: 'bg-transparent text-sky-600 dark:text-sky-400 border-transparent',
    phone: 'bg-transparent text-emerald-600 dark:text-emerald-400 border-transparent',
    in_person: 'bg-transparent text-indigo-600 dark:text-indigo-400 border-transparent',
    other: 'bg-transparent text-gray-600 dark:text-gray-400 border-transparent',
  },
};

export function OutreachChannelBadge({ 
  channel, 
  size = 'md',
  showLabel = true,
  variant = 'default',
}: OutreachChannelBadgeProps) {
  const config = OUTREACH_CHANNEL_CONFIG[channel];
  const colorClasses = variantClasses[variant][channel];
  
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center rounded-full font-medium
        border transition-colors
        ${colorClasses}
      `}
    >
      <ChannelIcon channel={channel} size={size} />
      {showLabel && <span>{config.label}</span>}
    </motion.span>
  );
}

// Selector variant for forms
interface OutreachChannelSelectorProps {
  value: OutreachChannel;
  onChange: (channel: OutreachChannel) => void;
  channels?: OutreachChannel[];
}

export function OutreachChannelSelector({
  value,
  onChange,
  channels = ['email', 'linkedin', 'referral', 'event', 'cold_call', 'phone', 'in_person', 'other'],
}: OutreachChannelSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {channels.map((channel) => {
        const isActive = channel === value;
        const config = OUTREACH_CHANNEL_CONFIG[channel];
        const colorClasses = variantClasses.default[channel];
        
        return (
          <motion.button
            key={channel}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(channel)}
            className={`
              text-xs px-3 py-2 rounded-lg font-medium
              inline-flex items-center gap-2
              border-2 transition-all duration-200
              ${isActive 
                ? `${colorClasses} shadow-sm` 
                : 'bg-gray-50 dark:bg-[#2b2a2c] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#3d3c3e] hover:border-gray-300 dark:hover:border-[#4a494b]'
              }
            `}
          >
            <ChannelIcon channel={channel} size="md" />
            <span>{config.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default OutreachChannelBadge;


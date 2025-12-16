import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Linkedin, 
  Phone, 
  Globe, 
  ExternalLink,
  Building2,
  Copy,
  Check,
  Edit2,
  Save,
  X,
  Users,
  Target,
  UserPlus,
  Flame,
  Sun,
  Snowflake,
  Calendar,
  Clock,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { JobApplication, WarmthLevel, RelationshipGoal, WARMTH_LEVEL_LABELS, WARMTH_LEVEL_COLORS, RELATIONSHIP_GOAL_LABELS, RELATIONSHIP_GOAL_COLORS, OUTREACH_CHANNEL_CONFIG, OutreachChannel } from '../../types/job';
import { CompanyLogo } from '../common/CompanyLogo';
import { ProfileAvatar, generateGenderedAvatarConfigByName } from '../profile/avatar';

interface ContactTabProps {
  job: JobApplication;
  isEditing?: boolean;
  editedJob?: Partial<JobApplication>;
  onEdit?: (updates: Partial<JobApplication>) => void;
}


// Warmth icon component
const WarmthIcon = ({ level }: { level: WarmthLevel }) => {
  const className = "w-4 h-4";
  switch (level) {
    case 'cold': return <Snowflake className={`${className} text-slate-500`} />;
    case 'warm': return <Sun className={`${className} text-amber-500`} />;
    case 'hot': return <Flame className={`${className} text-red-500`} />;
  }
};

// Goal icon component
const GoalIcon = ({ goal }: { goal: RelationshipGoal }) => {
  const className = "w-4 h-4";
  switch (goal) {
    case 'networking': return <Users className={className} />;
    case 'prospecting': return <Target className={className} />;
    case 'referral': return <UserPlus className={className} />;
  }
};

// Safe date formatting
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return 'Not set';
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, 'MMM d, yyyy') : dateStr;
  } catch {
    return dateStr;
  }
};

export function ContactTab({ job, isEditing, editedJob, onEdit }: ContactTabProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const contactName = job.contactName || 'Unknown Contact';
  const channelConfig = job.outreachChannel ? OUTREACH_CHANNEL_CONFIG[job.outreachChannel] : null;
  const warmthColors = job.warmthLevel ? WARMTH_LEVEL_COLORS[job.warmthLevel] : null;
  const goalColors = job.relationshipGoal ? RELATIONSHIP_GOAL_COLORS[job.relationshipGoal] : null;
  
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const getValue = (field: keyof JobApplication) => {
    if (isEditing && editedJob && field in editedJob) {
      return editedJob[field];
    }
    return job[field];
  };
  
  return (
    <div className="space-y-6">
      {/* Contact Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#8B5CF6]/5 to-[#EC4899]/5 dark:from-[#8B5CF6]/10 dark:to-[#EC4899]/10 rounded-2xl p-6 border border-[#8B5CF6]/20 dark:border-[#8B5CF6]/10"
      >
        <div className="flex items-start gap-5">
          {/* Large Avatar */}
          <ProfileAvatar
            config={generateGenderedAvatarConfigByName(contactName)}
            size={80}
            className="rounded-2xl shadow-lg flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            {/* Name */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {isEditing ? (
                <input
                  type="text"
                  value={getValue('contactName') as string || ''}
                  onChange={(e) => onEdit?.({ contactName: e.target.value })}
                  className="w-full px-3 py-1 rounded-lg bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] text-xl font-bold"
                  placeholder="Contact Name"
                />
              ) : (
                contactName
              )}
            </h2>
            
            {/* Role */}
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {isEditing ? (
                <input
                  type="text"
                  value={getValue('contactRole') as string || ''}
                  onChange={(e) => onEdit?.({ contactRole: e.target.value })}
                  className="w-full px-3 py-1 rounded-lg bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] text-sm"
                  placeholder="Role/Title"
                />
              ) : (
                job.contactRole || 'No role specified'
              )}
            </p>
            
            {/* Company with logo */}
            <div className="flex items-center gap-2">
              <CompanyLogo companyName={job.companyName} size="md" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                @ {job.companyName}
              </span>
            </div>
          </div>
          
          {/* Badges */}
          <div className="flex flex-col gap-2 items-end">
            {/* Warmth Badge */}
            {job.warmthLevel && warmthColors && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${warmthColors.bg} ${warmthColors.text} border ${warmthColors.border}`}>
                <WarmthIcon level={job.warmthLevel} />
                {WARMTH_LEVEL_LABELS[job.warmthLevel]}
              </span>
            )}
            
            {/* Goal Badge */}
            {job.relationshipGoal && goalColors && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${goalColors.bg} ${goalColors.text} border ${goalColors.border}`}>
                <GoalIcon goal={job.relationshipGoal} />
                {RELATIONSHIP_GOAL_LABELS[job.relationshipGoal]}
              </span>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Contact Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">Email</p>
            {isEditing ? (
              <input
                type="email"
                value={getValue('contactEmail') as string || ''}
                onChange={(e) => onEdit?.({ contactEmail: e.target.value })}
                className="w-full px-2 py-1 mt-1 rounded-md bg-white dark:bg-[#2b2a2c] border border-blue-200 dark:border-blue-800 text-sm"
                placeholder="email@company.com"
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {job.contactEmail || 'Not provided'}
              </p>
            )}
          </div>
          {job.contactEmail && !isEditing && (
            <button
              onClick={() => handleCopy(job.contactEmail!, 'email')}
              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-colors"
            >
              {copiedField === 'email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </motion.div>
        
        {/* LinkedIn */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-[#0A66C2]/5 border border-[#0A66C2]/10"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#0A66C2] font-semibold uppercase tracking-wider">LinkedIn</p>
            {isEditing ? (
              <input
                type="url"
                value={getValue('contactLinkedIn') as string || ''}
                onChange={(e) => onEdit?.({ contactLinkedIn: e.target.value })}
                className="w-full px-2 py-1 mt-1 rounded-md bg-white dark:bg-[#2b2a2c] border border-[#0A66C2]/30 text-sm"
                placeholder="linkedin.com/in/..."
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {job.contactLinkedIn 
                  ? job.contactLinkedIn.replace('https://linkedin.com/in/', '').replace('https://www.linkedin.com/in/', '')
                  : 'Not provided'
                }
              </p>
            )}
          </div>
          {job.contactLinkedIn && !isEditing && (
            <a
              href={job.contactLinkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-[#0A66C2]/10 text-[#0A66C2] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </motion.div>
        
        {/* Phone */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20"
        >
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider">Phone</p>
            {isEditing ? (
              <input
                type="tel"
                value={getValue('contactPhone') as string || ''}
                onChange={(e) => onEdit?.({ contactPhone: e.target.value })}
                className="w-full px-2 py-1 mt-1 rounded-md bg-white dark:bg-[#2b2a2c] border border-green-200 dark:border-green-800 text-sm"
                placeholder="+1 234 567 890"
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-white">
                {job.contactPhone || 'Not provided'}
              </p>
            )}
          </div>
          {job.contactPhone && !isEditing && (
            <button
              onClick={() => handleCopy(job.contactPhone!, 'phone')}
              className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500 transition-colors"
            >
              {copiedField === 'phone' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </motion.div>
        
        {/* Company Website */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#3d3c3e]/50 border border-gray-100 dark:border-[#3d3c3e]"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center">
            <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Website</p>
            {isEditing ? (
              <input
                type="url"
                value={getValue('contactCompanyWebsite') as string || ''}
                onChange={(e) => onEdit?.({ contactCompanyWebsite: e.target.value })}
                className="w-full px-2 py-1 mt-1 rounded-md bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] text-sm"
                placeholder="https://company.com"
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {job.contactCompanyWebsite 
                  ? job.contactCompanyWebsite.replace('https://', '').replace('http://', '')
                  : 'Not provided'
                }
              </p>
            )}
          </div>
          {job.contactCompanyWebsite && !isEditing && (
            <a
              href={job.contactCompanyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-500 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </motion.div>
      </div>
      
      {/* Outreach Details */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-[#2b2a2c] rounded-2xl border border-gray-100 dark:border-[#3d3c3e] p-6 space-y-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-[#8B5CF6]" />
          Outreach Details
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Outreach Channel */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#242325]">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Channel</p>
            {channelConfig ? (
              <div className={`flex items-center gap-1.5 ${channelConfig.color}`}>
                <span className="font-semibold">{channelConfig.label}</span>
              </div>
            ) : (
              <span className="text-gray-900 dark:text-white font-medium">Not specified</span>
            )}
          </div>
          
          {/* First Contact Date */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#242325]">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">First Contact</p>
            <div className="flex items-center gap-1.5 text-gray-900 dark:text-white font-medium">
              <Calendar className="w-4 h-4 text-gray-400" />
              {formatDate(job.appliedDate)}
            </div>
          </div>
          
          {/* Last Contacted */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#242325]">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Last Contacted</p>
            <div className="flex items-center gap-1.5 text-gray-900 dark:text-white font-medium">
              <Clock className="w-4 h-4 text-gray-400" />
              {formatDate(job.lastContactedAt)}
            </div>
          </div>
          
          {/* Next Follow-up */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#242325]">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Next Follow-up</p>
            <div className={`flex items-center gap-1.5 font-medium ${job.nextFollowUpDate ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
              <Clock className={`w-4 h-4 ${job.nextFollowUpDate ? 'text-amber-500' : 'text-gray-400'}`} />
              {formatDate(job.nextFollowUpDate)}
            </div>
          </div>
        </div>
        
        {/* Initial Message */}
        {job.messageSent && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#3d3c3e]">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2">
              Initial Message
            </p>
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#8B5CF6]/5 to-[#EC4899]/5 dark:from-[#8B5CF6]/10 dark:to-[#EC4899]/10 border border-[#8B5CF6]/10">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {job.messageSent}
              </p>
            </div>
          </div>
        )}
        
        {/* Bio */}
        {job.contactBio && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#3d3c3e]">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2">
              About This Contact
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {job.contactBio}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default ContactTab;


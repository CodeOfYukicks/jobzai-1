import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Linkedin, 
  Phone, 
  Globe, 
  ExternalLink,
  Building2,
  MapPin,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { JobApplication, WarmthLevel } from '../../types/job';
import { WarmthIndicator } from './WarmthIndicator';
import { OutreachChannelBadge } from './OutreachChannelBadge';
import { CompanyLogo } from '../common/CompanyLogo';
import { ProfileAvatar, generateGenderedAvatarConfigByName } from '../profile/avatar';

interface OutreachContactHeaderProps {
  contact: JobApplication;
  onWarmthChange?: (level: WarmthLevel) => void;
  compact?: boolean;
}

export function OutreachContactHeader({ 
  contact, 
  onWarmthChange,
  compact = false,
}: OutreachContactHeaderProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const contactName = contact.contactName || 'Unknown Contact';
  
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Compact avatar */}
        <ProfileAvatar
          config={generateGenderedAvatarConfigByName(contactName)}
          size={40}
          className="rounded-full shadow-lg"
        />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {contactName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {contact.contactRole} @ {contact.companyName}
          </p>
        </div>
        
        {contact.warmthLevel && (
          <WarmthIndicator level={contact.warmthLevel} size="sm" showLabel={false} />
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Main header with avatar */}
      <div className="flex items-start gap-4">
        {/* Large avatar */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <ProfileAvatar
            config={generateGenderedAvatarConfigByName(contactName)}
            size={64}
            className="rounded-2xl shadow-lg"
          />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          {/* Name and warmth */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {contactName}
              </h2>
              {contact.contactRole && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {contact.contactRole}
                </p>
              )}
            </div>
            
            {/* Warmth indicator */}
            {contact.warmthLevel && (
              <WarmthIndicator 
                level={contact.warmthLevel} 
                size="md"
                interactive={!!onWarmthChange}
                onChange={onWarmthChange}
              />
            )}
          </div>
          
          {/* Company info */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#3d3c3e]">
              <CompanyLogo companyName={contact.companyName} size="sm" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {contact.companyName}
              </span>
            </div>
            
            {contact.outreachChannel && (
              <OutreachChannelBadge channel={contact.outreachChannel} size="md" />
            )}
          </div>
        </div>
      </div>
      
      {/* Contact details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Email */}
        {contact.contactEmail && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Email</p>
              <p className="text-sm text-gray-900 dark:text-white truncate">{contact.contactEmail}</p>
            </div>
            <button
              onClick={() => handleCopy(contact.contactEmail!, 'email')}
              className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-colors"
            >
              {copiedField === 'email' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </motion.div>
        )}
        
        {/* LinkedIn */}
        {contact.contactLinkedIn && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#0A66C2]/5 border border-[#0A66C2]/10"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center">
              <Linkedin className="w-4 h-4 text-[#0A66C2]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#0A66C2] font-medium">LinkedIn</p>
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {contact.contactLinkedIn.replace('https://linkedin.com/in/', '').replace('https://www.linkedin.com/in/', '')}
              </p>
            </div>
            <a
              href={contact.contactLinkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-[#0A66C2]/10 text-[#0A66C2] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        )}
        
        {/* Phone */}
        {contact.contactPhone && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20"
          >
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Phone</p>
              <p className="text-sm text-gray-900 dark:text-white">{contact.contactPhone}</p>
            </div>
            <button
              onClick={() => handleCopy(contact.contactPhone!, 'phone')}
              className="p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500 transition-colors"
            >
              {copiedField === 'phone' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </motion.div>
        )}
        
        {/* Company Website */}
        {contact.contactCompanyWebsite && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#3d3c3e]/50 border border-gray-100 dark:border-[#3d3c3e]"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center">
              <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Website</p>
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {contact.contactCompanyWebsite.replace('https://', '').replace('http://', '')}
              </p>
            </div>
            <a
              href={contact.contactCompanyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-500 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        )}
      </div>
      
      {/* Bio/Notes */}
      {contact.contactBio && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-100 dark:border-purple-900/20"
        >
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">About</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {contact.contactBio}
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default OutreachContactHeader;


import { motion } from 'framer-motion';
import { 
  Mail, 
  MailOpen, 
  MessageSquare, 
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CampaignSummary {
  id: string;
  name: string;
  contactsFound: number;
  emailsSent: number;
  opened: number;
  replied: number;
}

interface CampaignCardProps {
  campaign: CampaignSummary;
  className?: string;
}

export function CampaignCard({ campaign, className = '' }: CampaignCardProps) {
  const openRate = campaign.emailsSent > 0 
    ? ((campaign.opened / campaign.emailsSent) * 100).toFixed(0) 
    : '0';
  
  const replyRate = campaign.emailsSent > 0 
    ? ((campaign.replied / campaign.emailsSent) * 100).toFixed(0) 
    : '0';
  
  return (
    <Link
      to={`/campaigns-auto?id=${campaign.id}`}
      className={`block group ${className}`}
    >
      <motion.div
        whileHover={{ y: -1 }}
        className="p-4 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/40 transition-all duration-200"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Zap className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5] flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                {campaign.name}
              </h4>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
                {campaign.contactsFound} contacts
              </p>
            </div>
          </div>
          
          <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
        </div>
        
        {/* Stats row */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
            <div>
              <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{campaign.emailsSent}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sent</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MailOpen className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
            <div>
              <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{openRate}%</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Opened</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
            <div>
              <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{replyRate}%</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Replied</p>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// Campaigns List component
interface CampaignsListProps {
  campaigns: CampaignSummary[];
  maxItems?: number;
  className?: string;
}

export function CampaignsList({ campaigns, maxItems = 5, className = '' }: CampaignsListProps) {
  const displayedCampaigns = campaigns.slice(0, maxItems);
  
  if (displayedCampaigns.length === 0) {
    return (
      <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 ${className}`}>
        <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-5">Active Campaigns</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Zap className="w-6 h-6 text-gray-300 dark:text-gray-600 stroke-[1.5] mb-3" />
          <p className="text-[13px] text-gray-400 dark:text-gray-500">No active campaigns</p>
          <Link
            to="/campaigns-auto"
            className="text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mt-2 transition-colors"
          >
            Create your first campaign
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-[#4a494b] ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">Active Campaigns</h3>
        {campaigns.length > maxItems && (
          <Link
            to="/campaigns-auto"
            className="text-[12px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      
      <div className="space-y-0">
        {displayedCampaigns.map((campaign, index) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
          >
            <CampaignCard campaign={campaign} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Recent Replies component
interface RecentReply {
  id: string;
  contactName: string;
  company: string;
  repliedAt: Date;
}

interface RecentRepliesProps {
  replies: RecentReply[];
  maxItems?: number;
  className?: string;
}

export function RecentReplies({ replies, maxItems = 5, className = '' }: RecentRepliesProps) {
  const displayedReplies = replies.slice(0, maxItems);
  
  if (displayedReplies.length === 0) {
    return (
      <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 ${className}`}>
        <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-5">Recent Replies</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="w-6 h-6 text-gray-300 dark:text-gray-600 stroke-[1.5] mb-3" />
          <p className="text-[13px] text-gray-400 dark:text-gray-500">No replies yet</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-[#4a494b] ${className}`}>
      <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-5">Recent Replies</h3>
      
      <div className="space-y-1">
        {displayedReplies.map((reply, index) => (
          <motion.div
            key={reply.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className="flex items-center gap-3 p-3 -mx-1 rounded-xl hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/40 transition-colors group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-emerald-500 stroke-[1.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">
                {reply.contactName}
              </p>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                {reply.company}
              </p>
            </div>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">
              {reply.repliedAt.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default CampaignCard;

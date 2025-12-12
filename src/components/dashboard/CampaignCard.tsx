import { motion } from 'framer-motion';
import { 
  Users, 
  Mail, 
  MailOpen, 
  Reply, 
  ChevronRight,
  Zap,
  TrendingUp
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
    ? ((campaign.opened / campaign.emailsSent) * 100).toFixed(1) 
    : '0';
  
  const replyRate = campaign.emailsSent > 0 
    ? ((campaign.replied / campaign.emailsSent) * 100).toFixed(1) 
    : '0';
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-4 hover:border-jobzai-300 dark:hover:border-jobzai-700 transition-all duration-200 ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-jobzai-100 dark:bg-jobzai-950/40">
            <Zap className="w-4 h-4 text-jobzai-600 dark:text-jobzai-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{campaign.name}</h4>
            <p className="text-xs text-muted-foreground">{campaign.contactsFound} contacts</p>
          </div>
        </div>
        
        <Link
          to={`/campaigns-auto?id=${campaign.id}`}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-blue-500" />
          <div>
            <p className="text-sm font-semibold text-foreground tabular-nums">{campaign.emailsSent}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <MailOpen className="w-3.5 h-3.5 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-foreground tabular-nums">{openRate}%</p>
            <p className="text-xs text-muted-foreground">Opened</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Reply className="w-3.5 h-3.5 text-green-500" />
          <div>
            <p className="text-sm font-semibold text-foreground tabular-nums">{replyRate}%</p>
            <p className="text-xs text-muted-foreground">Replied</p>
          </div>
        </div>
      </div>
    </motion.div>
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
      <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Active Campaigns</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-sm text-muted-foreground">No active campaigns</p>
          <Link
            to="/campaigns-auto"
            className="text-xs font-medium text-jobzai-600 dark:text-jobzai-400 hover:text-jobzai-700 mt-2"
          >
            Create your first campaign
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Active Campaigns</h3>
        {campaigns.length > maxItems && (
          <Link
            to="/campaigns-auto"
            className="text-xs font-medium text-jobzai-600 dark:text-jobzai-400 hover:text-jobzai-700 flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      
      <div className="space-y-3">
        {displayedCampaigns.map((campaign, index) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
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
      <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent Replies</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-3">
            <Reply className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-sm text-muted-foreground">No replies yet</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent Replies</h3>
      
      <div className="space-y-3">
        {displayedReplies.map((reply, index) => (
          <motion.div
            key={reply.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30"
          >
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <Reply className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {reply.contactName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {reply.company}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {reply.repliedAt.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default CampaignCard;


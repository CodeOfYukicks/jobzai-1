import React from 'react';
import { Trash2, Calendar, MapPin, Users, FolderInput, Mail, Linkedin, Phone, Send, User, MessageSquare, Clock, Flame, Sun, Snowflake } from 'lucide-react';
import { JobApplication, BoardType, WARMTH_LEVEL_COLORS, WARMTH_LEVEL_LABELS, OUTREACH_CHANNEL_CONFIG, WarmthLevel } from '../../types/job';
import { StepChip } from './StepChip';
import { CompanyLogo } from '../common/CompanyLogo';
import { ProfileAvatar, generateGenderedAvatarConfigByName } from '../profile/avatar';

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

function formatShortDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return dateString;
  }
}


// Warmth icon component
const WarmthIcon = ({ level }: { level: WarmthLevel }) => {
  const className = "w-3 h-3";
  switch (level) {
    case 'cold': return <Snowflake className={`${className} text-slate-500`} />;
    case 'warm': return <Sun className={`${className} text-amber-500`} />;
    case 'hot': return <Flame className={`${className} text-red-500`} />;
  }
};

// Channel icon component
const ChannelIcon = ({ channel }: { channel: string }) => {
  const className = "w-3 h-3";
  switch (channel) {
    case 'email': return <Mail className={className} />;
    case 'linkedin': return <Linkedin className={className} />;
    case 'phone':
    case 'cold_call': return <Phone className={className} />;
    case 'referral': return <Users className={className} />;
    case 'event': return <Calendar className={className} />;
    case 'in_person': return <User className={className} />;
    default: return <Send className={className} />;
  }
};

// Outreach channel icons and labels (legacy support)
const OUTREACH_CHANNELS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  email: { icon: <Mail className="w-3 h-3" />, label: 'Email', color: 'text-blue-500' },
  linkedin: { icon: <Linkedin className="w-3 h-3" />, label: 'LinkedIn', color: 'text-[#0A66C2]' },
  referral: { icon: <Users className="w-3 h-3" />, label: 'Referral', color: 'text-green-500' },
  event: { icon: <Calendar className="w-3 h-3" />, label: 'Event', color: 'text-purple-500' },
  cold_call: { icon: <Phone className="w-3 h-3" />, label: 'Call', color: 'text-orange-500' },
  other: { icon: <Send className="w-3 h-3" />, label: 'Other', color: 'text-gray-500' },
};

export function ApplicationCard({
  app, onDelete, onClick, onMoveToBoard, isDragging = false,
  isInactive = false,
  inactiveDays = 0,
  boardType = 'jobs',
}: {
  app: JobApplication;
  onDelete: () => void;
  onClick: () => void;
  onMoveToBoard?: () => void;
  isDragging?: boolean;
  isInactive?: boolean;
  inactiveDays?: number;
  boardType?: BoardType;
}) {
  // Campaign-specific card
  if (boardType === 'campaigns') {
    return (
      <CampaignCard
        app={app}
        onDelete={onDelete}
        onClick={onClick}
        onMoveToBoard={onMoveToBoard}
        isDragging={isDragging}
        isInactive={isInactive}
        inactiveDays={inactiveDays}
      />
    );
  }
  
  // Jobs card (original)
  return (
    <JobsCard
      app={app}
      onDelete={onDelete}
      onClick={onClick}
      onMoveToBoard={onMoveToBoard}
      isDragging={isDragging}
      isInactive={isInactive}
      inactiveDays={inactiveDays}
    />
  );
}

// ========================================
// CAMPAIGN CARD - Contact-centric design
// ========================================
function CampaignCard({
  app, onDelete, onClick, onMoveToBoard, isDragging = false,
  isInactive = false,
  inactiveDays = 0,
}: {
  app: JobApplication;
  onDelete: () => void;
  onClick: () => void;
  onMoveToBoard?: () => void;
  isDragging?: boolean;
  isInactive?: boolean;
  inactiveDays?: number;
}) {
  const contactName = app.contactName || 'Unknown Contact';
  const messageCount = app.conversationHistory?.length || 0;
  const meetingCount = app.meetings?.length || app.interviews?.length || 0;
  const channelConfig = app.outreachChannel ? OUTREACH_CHANNEL_CONFIG[app.outreachChannel] : null;
  const warmthColors = app.warmthLevel ? WARMTH_LEVEL_COLORS[app.warmthLevel] : null;
  
  return (
    <div
      onClick={onClick}
      className={[
        'group relative w-full cursor-pointer select-none',
        'rounded-xl border',
        'bg-white/90 dark:bg-[#2b2a2c]/80 backdrop-blur-md',
        'border-gray-200/60 dark:border-[#3d3c3e]/60',
        'hover:border-gray-300/80 dark:hover:border-[#4a494b]/80',
        'shadow-sm hover:shadow-lg dark:shadow-black/20',
        'transition-all duration-200',
        'h-full flex flex-col',
        isDragging ? 'ring-2 ring-[#635BFF] ring-offset-0 shadow-xl dark:shadow-[#635BFF]/20' : '',
      ].join(' ')}
      role="button"
    >
      <div className="p-4 flex flex-col flex-1 min-h-0">
        {/* Inactive Badge */}
        {isInactive && (
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
              {inactiveDays}d inactive
            </span>
          </div>
        )}

        {/* Warmth Badge */}
        {app.warmthLevel && warmthColors && (
          <div className="mb-3 flex-shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${warmthColors.bg} ${warmthColors.text} border ${warmthColors.border}`}>
              <WarmthIcon level={app.warmthLevel} />
              {WARMTH_LEVEL_LABELS[app.warmthLevel]}
            </span>
          </div>
        )}
        
        {/* Section 1: Header - Contact Name avec avatar */}
        <div className="flex items-start gap-3 mb-3 flex-shrink-0">
          {/* Contact Avatar */}
          <ProfileAvatar
            config={generateGenderedAvatarConfigByName(contactName)}
            size={48}
            className="rounded-lg shadow-md border border-gray-100 dark:border-[#3d3c3e] flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-medium text-gray-900 dark:text-white leading-tight"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {contactName}
            </h3>
            {app.contactRole && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {app.contactRole}
              </p>
            )}
          </div>
        </div>

        {/* Section 2: Métadonnées avec icônes */}
        <div className="flex flex-wrap items-center gap-3 mb-3 flex-shrink-0">
          {/* Last contact date */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(app.lastContactedAt || app.appliedDate)}</span>
          </div>

          {/* Channel */}
          {channelConfig && app.outreachChannel && (
            <div className="flex items-center gap-1.5">
              {app.outreachChannel === 'email' && <Mail className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />}
              {app.outreachChannel === 'linkedin' && <Linkedin className="w-4 h-4 text-[#0A66C2] flex-shrink-0" />}
              {(app.outreachChannel === 'phone' || app.outreachChannel === 'cold_call') && <Phone className="w-4 h-4 text-orange-500 dark:text-orange-400 flex-shrink-0" />}
              {app.outreachChannel === 'referral' && <Users className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />}
              {app.outreachChannel === 'event' && <Calendar className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />}
              {app.outreachChannel === 'in_person' && <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />}
              {!['email', 'linkedin', 'phone', 'cold_call', 'referral', 'event', 'in_person'].includes(app.outreachChannel) && <Send className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
              <span className="text-sm text-gray-500 dark:text-gray-400">{channelConfig.label}</span>
            </div>
          )}

          {/* Message count */}
          {messageCount > 0 && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {messageCount} {messageCount === 1 ? 'message' : 'messages'}
              </span>
            </div>
          )}

          {/* Meeting count */}
          {meetingCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {meetingCount} {meetingCount === 1 ? 'meeting' : 'meetings'}
              </span>
            </div>
          )}
        </div>

        {/* Section 3: Entreprise */}
        <div className="mb-3 flex-shrink-0">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-100/80 dark:bg-[#3d3c3e]/50 border border-gray-200 dark:border-[#3d3c3e]">
            <CompanyLogo companyName={app.companyName} size="md" />
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">{app.companyName}</span>
          </div>
        </div>

        {/* Section 4: Contact info pills */}
        {(app.contactEmail || app.contactLinkedIn) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3 flex-shrink-0">
            {app.contactEmail && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                <Mail className="w-2.5 h-2.5" />
                {app.contactEmail.length > 18 ? app.contactEmail.substring(0, 18) + '...' : app.contactEmail}
              </span>
            )}
            {app.contactLinkedIn && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] border border-[#0A66C2]/20">
                <Linkedin className="w-2.5 h-2.5" />
                LinkedIn
              </span>
            )}
          </div>
        )}
        
        {/* Spacer to push footer to bottom */}
        <div className="flex-1"></div>

        {/* Section 5: Footer avec actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#3d3c3e]/50 flex-shrink-0">
          {/* Follow-up reminder */}
          {app.nextFollowUpDate && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              Follow-up: {formatShortDate(app.nextFollowUpDate)}
            </span>
          )}
          {!app.nextFollowUpDate && <div />}
          
          {/* Actions visibles au hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onMoveToBoard && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToBoard();
                }}
                className="p-1.5 rounded-md hover:bg-[#635BFF]/10 text-gray-500 dark:text-gray-400 hover:text-[#635BFF] dark:hover:text-[#a5a0ff] transition-colors"
                aria-label="Move to another board"
                title="Move to board"
              >
                <FolderInput className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label="Delete contact"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// JOBS CARD - Original design
// ========================================
function JobsCard({
  app, onDelete, onClick, onMoveToBoard, isDragging = false,
  isInactive = false,
  inactiveDays = 0,
}: {
  app: JobApplication;
  onDelete: () => void;
  onClick: () => void;
  onMoveToBoard?: () => void;
  isDragging?: boolean;
  isInactive?: boolean;
  inactiveDays?: number;
}) {
  const interviewTypes =
    app.interviews?.map((i) => i.type).filter((v, i, a) => a.indexOf(v) === i) || [];
  const hasInterviews = (app.interviews?.length || 0) > 0;
  const interviewCount = app.interviews?.length || 0;

  return (
    <div
      onClick={onClick}
      className={[
        'group relative w-full cursor-pointer select-none',
        'rounded-xl border',
        'bg-white/90 dark:bg-[#2b2a2c]/80 backdrop-blur-md',
        'border-gray-200/60 dark:border-[#3d3c3e]/60',
        'hover:border-gray-300/80 dark:hover:border-[#4a494b]/80',
        'shadow-sm hover:shadow-lg dark:shadow-black/20',
        'transition-all duration-200',
        'h-full flex flex-col',
        isDragging ? 'ring-2 ring-[#635BFF] ring-offset-0 shadow-xl dark:shadow-[#635BFF]/20' : '',
      ].join(' ')}
      role="button"
    >
      <div className="p-4 flex flex-col flex-1 min-h-0">
        {/* Inactive Badge */}
        {isInactive && (
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
              {inactiveDays}d inactive
            </span>
          </div>
        )}

        {/* Section 1: Header - Position avec logo */}
        <div className="flex items-start gap-3 mb-3 flex-shrink-0">
          <CompanyLogo 
            companyName={app.companyName} 
            size="lg"
            className="rounded-lg border border-gray-100 dark:border-[#3d3c3e] flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-medium text-gray-900 dark:text-white leading-tight"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {app.position}
            </h3>
          </div>
        </div>

        {/* Section 2: Métadonnées avec icônes */}
        <div className="flex flex-wrap items-center gap-3 mb-3 flex-shrink-0">
          {/* Date */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(app.appliedDate)}</span>
          </div>

          {/* Location */}
          {app.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{app.location}</span>
            </div>
          )}

          {/* Interviews */}
          {hasInterviews && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {interviewCount} {interviewCount === 1 ? 'interview' : 'interviews'}
              </span>
            </div>
          )}
        </div>

        {/* Section 3: Entreprise */}
        <div className="mb-3 flex-shrink-0">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-100/80 dark:bg-[#3d3c3e]/50 border border-gray-200 dark:border-[#3d3c3e]">
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">{app.companyName}</span>
          </div>
        </div>

        {/* Section 4: Tags - interview types */}
        {hasInterviews && interviewTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3 flex-shrink-0">
            {interviewTypes.slice(0, 3).map((t) => <StepChip key={t} type={t} />)}
            {interviewTypes.length > 3 && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#3d3c3e]/40">
                +{interviewTypes.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Spacer to push footer to bottom */}
        <div className="flex-1"></div>

        {/* Section 5: Footer avec actions */}
        <div className="flex items-center justify-end pt-3 border-t border-gray-100 dark:border-[#3d3c3e]/50 flex-shrink-0">
          {/* Actions visibles au hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onMoveToBoard && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToBoard();
                }}
                className="p-1.5 rounded-md hover:bg-[#635BFF]/10 text-gray-500 dark:text-gray-400 hover:text-[#635BFF] dark:hover:text-[#a5a0ff] transition-colors"
                aria-label="Move to another board"
                title="Move to board"
              >
                <FolderInput className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label="Delete application"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

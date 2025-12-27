import { useNavigate } from 'react-router-dom';
import {
    Building,
    MapPin,
    Calendar,
    ExternalLink,
    Edit3,
    Mic,
    FileSearch
} from 'lucide-react';
import BottomSheet from '../common/BottomSheet';
import { JobApplication } from '../../types/job';
import { CompanyLogo } from '../common/CompanyLogo';
import { ProfileAvatar, generateGenderedAvatarConfigByName } from '../profile/avatar';

// Status labels and colors
const STATUS_LABELS: Record<string, string> = {
    wishlist: 'Wishlist',
    applied: 'Applied',
    interview: 'Interview',
    offer: 'Offer',
    rejected: 'Rejected',
    pending_decision: 'Pending',
    archived: 'Archived',
    // Campaign statuses
    targets: 'Targets',
    contacted: 'Contacted',
    follow_up: 'Follow-up',
    replied: 'Replied',
    meeting: 'Meeting',
    opportunity: 'Opportunity',
    no_response: 'No Response',
    closed: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
    offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    wishlist: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    pending_decision: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    opportunity: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    meeting: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    replied: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    targets: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    follow_up: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    no_response: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    closed: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

interface JobDetailsBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    application: JobApplication | null;
    onEdit?: () => void;
    isCampaign?: boolean;
}

export default function JobDetailsBottomSheet({
    isOpen,
    onClose,
    application,
    onEdit,
    isCampaign = false,
}: JobDetailsBottomSheetProps) {
    const navigate = useNavigate();

    if (!application) return null;

    // Format date
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return 'No date';
        }
    };

    // Navigate to Mock Interview page with job
    const handleMockInterview = () => {
        onClose();
        navigate('/mock-interview', { state: { selectedJobId: application.id } });
    };

    // Navigate to CV Analysis page
    const handleCVAnalysis = () => {
        onClose();
        navigate('/cv-analysis', { state: { selectedJobId: application.id } });
    };

    // Get display info based on type
    const displayTitle = isCampaign
        ? (application.contactName || application.position || 'Untitled Contact')
        : (application.position || 'Untitled Position');

    const displaySubtitle = isCampaign
        ? application.contactRole || 'Contact'
        : application.companyName;

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={displayTitle}
            subtitle={displaySubtitle}
            height={70}
            showCloseButton={true}
            showDragHandle={true}
        >
            <div className="px-5 pb-6 space-y-5">
                {/* Header with logo/avatar and status */}
                <div className="flex items-center gap-4 pt-2">
                    {isCampaign && application.contactName ? (
                        <ProfileAvatar
                            config={generateGenderedAvatarConfigByName(application.contactName)}
                            size={64}
                            className="rounded-2xl shadow-lg flex-shrink-0"
                        />
                    ) : (
                        <CompanyLogo
                            companyName={application.companyName || ''}
                            size="lg"
                            className="w-16 h-16 rounded-2xl flex-shrink-0 shadow-lg"
                        />
                    )}

                    <div className="flex-1 min-w-0">
                        {/* Status pill */}
                        <span className={`
                            inline-flex px-3 py-1.5 rounded-full text-xs font-semibold
                            ${STATUS_COLORS[application.status] || STATUS_COLORS.archived}
                        `}>
                            {STATUS_LABELS[application.status] || application.status}
                        </span>

                        {/* Interview count if any */}
                        {(application.interviews?.length || 0) > 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {application.interviews?.length} interview{application.interviews?.length !== 1 ? 's' : ''} scheduled
                            </p>
                        )}
                    </div>
                </div>

                {/* Details section */}
                <div className="space-y-3">
                    {/* Company (for non-campaigns) */}
                    {!isCampaign && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center">
                                <Building className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Company</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{application.companyName}</p>
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    {application.location && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Location</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{application.location}</p>
                            </div>
                        </div>
                    )}

                    {/* Applied Date */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                {isCampaign ? 'First Contact' : 'Applied'}
                            </p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDate(application.appliedDate)}
                            </p>
                        </div>
                    </div>

                    {/* Job URL */}
                    {application.url && (
                        <a
                            href={application.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <ExternalLink className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Job Posting</p>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                                    View original posting
                                </p>
                            </div>
                        </a>
                    )}
                </div>

                {/* Notes section */}
                {(application.notes || application.description) && (
                    <div className="pt-3 border-t border-gray-100 dark:border-[#3d3c3e]">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Notes
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4">
                            {application.notes || application.description}
                        </p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="pt-4 border-t border-gray-100 dark:border-[#3d3c3e]">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        Quick Actions
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Mock Interview - Direct navigation */}
                        {!isCampaign && (
                            <button
                                onClick={handleMockInterview}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-800/30 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                            >
                                <Mic className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Practice</span>
                            </button>
                        )}

                        {/* CV Analysis - Replace Reminder */}
                        {!isCampaign && (
                            <button
                                onClick={handleCVAnalysis}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/30 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                            >
                                <FileSearch className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">CV Match</span>
                            </button>
                        )}

                        {/* Edit */}
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200 dark:border-gray-700/30 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                            >
                                <Edit3 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Details</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </BottomSheet>
    );
}

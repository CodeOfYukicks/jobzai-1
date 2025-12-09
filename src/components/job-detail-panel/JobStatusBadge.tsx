import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Circle,
    Clock,
    XCircle,
    Archive,
    AlertCircle,
    TrendingUp,
    ChevronDown,
    Target,
    Mail,
    MessageSquare,
    Calendar,
    Sparkles,
    Ban
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { BoardType } from '../../types/job';

interface JobStatusBadgeProps {
    status: 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected' | 'archived' | 'pending_decision' | 'targets' | 'contacted' | 'follow_up' | 'replied' | 'meeting' | 'opportunity' | 'no_response' | 'closed';
    isEditing?: boolean;
    onChange?: (status: any) => void;
    boardType?: BoardType;
}

const jobStatusConfig = {
    wishlist: {
        label: 'Wishlist',
        icon: Circle,
        color: 'text-slate-600 dark:text-slate-400',
        bg: 'bg-slate-100 dark:bg-slate-800',
        border: 'border-slate-200 dark:border-slate-700'
    },
    applied: {
        label: 'Applied',
        icon: Circle,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/40',
        border: 'border-blue-200 dark:border-blue-800'
    },
    interview: {
        label: 'Interview',
        icon: TrendingUp,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-100 dark:bg-purple-900/40',
        border: 'border-purple-200 dark:border-purple-800'
    },
    offer: {
        label: 'Offer',
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/40',
        border: 'border-green-200 dark:border-green-800'
    },
    rejected: {
        label: 'Rejected',
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/40',
        border: 'border-red-200 dark:border-red-800'
    },
    archived: {
        label: 'Archived',
        icon: Archive,
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-100 dark:bg-[#2b2a2c]',
        border: 'border-gray-200 dark:border-[#3d3c3e]'
    },
    pending_decision: {
        label: 'Pending Decision',
        icon: AlertCircle,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-900/40',
        border: 'border-amber-200 dark:border-amber-800'
    },
};

const campaignStatusConfig = {
    targets: {
        label: 'Targets',
        icon: Target,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-100 dark:bg-purple-900/40',
        border: 'border-purple-200 dark:border-purple-800'
    },
    contacted: {
        label: 'Contacted',
        icon: Mail,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/40',
        border: 'border-blue-200 dark:border-blue-800'
    },
    follow_up: {
        label: 'Follow-up',
        icon: Clock,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-900/40',
        border: 'border-amber-200 dark:border-amber-800'
    },
    replied: {
        label: 'Replied',
        icon: MessageSquare,
        color: 'text-cyan-600 dark:text-cyan-400',
        bg: 'bg-cyan-100 dark:bg-cyan-900/40',
        border: 'border-cyan-200 dark:border-cyan-800'
    },
    meeting: {
        label: 'Meeting',
        icon: Calendar,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-100 dark:bg-indigo-900/40',
        border: 'border-indigo-200 dark:border-indigo-800'
    },
    opportunity: {
        label: 'Opportunity',
        icon: Sparkles,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/40',
        border: 'border-green-200 dark:border-green-800'
    },
    no_response: {
        label: 'No Response',
        icon: Ban,
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-100 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700'
    },
    closed: {
        label: 'Closed',
        icon: Archive,
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-100 dark:bg-[#2b2a2c]',
        border: 'border-gray-200 dark:border-[#3d3c3e]'
    },
};

const statusConfig = { ...jobStatusConfig, ...campaignStatusConfig };

export const JobStatusBadge = ({ status, isEditing, onChange, boardType = 'jobs' }: JobStatusBadgeProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Get the appropriate config based on board type
    const getConfig = () => {
        if (boardType === 'campaigns') {
            return campaignStatusConfig[status as keyof typeof campaignStatusConfig] || campaignStatusConfig.targets;
        }
        return jobStatusConfig[status as keyof typeof jobStatusConfig] || jobStatusConfig.applied;
    };
    
    const config = getConfig();
    const Icon = config.icon;
    
    // Get available statuses based on board type
    const getAvailableStatuses = () => {
        if (boardType === 'campaigns') {
            return Object.keys(campaignStatusConfig) as Array<keyof typeof campaignStatusConfig>;
        }
        return Object.keys(jobStatusConfig) as Array<keyof typeof jobStatusConfig>;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isEditing && onChange) {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} ${config.color} transition-all hover:opacity-80`}
                >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{config.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#2b2a2c] rounded-xl shadow-xl border border-gray-200 dark:border-[#3d3c3e] py-1 z-50 overflow-hidden"
                        >
                            {getAvailableStatuses().map((key) => {
                                const optionConfig = boardType === 'campaigns' 
                                    ? campaignStatusConfig[key]
                                    : jobStatusConfig[key];
                                const OptionIcon = optionConfig.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            onChange(key);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 transition-colors ${status === key ? 'bg-gray-50 dark:bg-[#3d3c3e]/50 font-medium' : 'text-gray-600 dark:text-gray-300'
                                            }`}
                                    >
                                        <OptionIcon className={`w-4 h-4 ${optionConfig.color}`} />
                                        <span>{optionConfig.label}</span>
                                        {status === key && <CheckCircle2 className="w-3 h-3 ml-auto text-blue-500" />}
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} ${config.color}`}>
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{config.label}</span>
        </div>
    );
};

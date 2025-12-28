import React from 'react';
import { Check, Plus, Zap, Briefcase, Users, Building2 } from 'lucide-react';
import BottomSheet from '../common/BottomSheet';

// Define a subset of Campaign interface for the selector
interface CampaignSummary {
    id: string;
    name?: string;
    status: string;
    stats?: {
        contactsFound: number;
    };
}

interface CampaignSelectorSheetProps {
    isOpen: boolean;
    onClose: () => void;
    campaigns: CampaignSummary[];
    activeCampaignId: string | null;
    onSelect: (campaignId: string) => void;
    onNewCampaign: () => void;
}

export default function CampaignSelectorSheet({
    isOpen,
    onClose,
    campaigns,
    activeCampaignId,
    onSelect,
    onNewCampaign
}: CampaignSelectorSheetProps) {

    const handleSelect = (id: string) => {
        onSelect(id);
        onClose();
    };

    const handleNew = () => {
        onClose();
        onNewCampaign();
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title="Campaigns"
            subtitle="Select a campaign to manage"
            height={85}
            showCloseButton={true}
        >
            <div className="flex flex-col pb-6">
                {/* New Campaign Action */}
                <div className="px-5 py-2">
                    <button
                        onClick={handleNew}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 
              text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-[#4a494b] transition-colors">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="font-medium">New Campaign</span>
                            <span className="text-xs text-gray-400">Create a new outreach campaign</span>
                        </div>
                    </button>
                </div>

                {/* Campaign List */}
                <div className="px-5 space-y-2">
                    {campaigns.map((campaign) => {
                        const isActive = campaign.id === activeCampaignId;
                        const contactCount = campaign.stats?.contactsFound || 0;

                        return (
                            <button
                                key={campaign.id}
                                onClick={() => handleSelect(campaign.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all
                  ${isActive
                                        ? 'bg-[#635BFF]/5 border-[#635BFF] dark:bg-[#635BFF]/10 dark:border-[#635BFF]'
                                        : 'bg-white dark:bg-[#242325] border-gray-100 dark:border-[#3d3c3e] hover:border-gray-200 dark:hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${isActive
                                            ? 'bg-[#635BFF] text-white'
                                            : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-500 dark:text-gray-400'
                                        }`}
                                    >
                                        <Zap className="w-5 h-5" fill={isActive ? "currentColor" : "none"} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className={`font-medium truncate max-w-full ${isActive ? 'text-[#635BFF] dark:text-[#a5a0ff]' : 'text-gray-900 dark:text-white'}`}>
                                            {campaign.name || 'Untitled Campaign'}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {contactCount} contacts
                                        </span>
                                    </div>
                                </div>

                                {/* Active Check */}
                                {isActive && (
                                    <div className="flex-shrink-0 ml-3 text-[#635BFF] dark:text-[#a5a0ff]">
                                        <Check className="w-5 h-5" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Bottom spacer for safe area */}
                <div className="h-8" />
            </div>
        </BottomSheet>
    );
}

import { motion } from 'framer-motion';
import { Target, Briefcase, MapPin, Users, Building2, Mail, Zap, Check, Star, PenLine } from 'lucide-react';
import { CampaignData, Seniority, CompanySize } from '../../NewCampaignModal';
import MobileStepWrapper from './MobileStepWrapper';

interface MobileReviewStepProps {
    data: CampaignData;
    estimatedProspects?: number;
    onUpdate: (updates: Partial<CampaignData>) => void;
    onBack: () => void;
    onLaunch: () => void;
}

const SENIORITY_LABELS: Record<Seniority, string> = {
    'entry': 'Entry',
    'senior': 'Senior',
    'manager': 'Manager',
    'director': 'Director',
    'vp': 'VP',
    'c_suite': 'C-Suite'
};

const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
    '1-10': '1-10',
    '11-50': '11-50',
    '51-200': '51-200',
    '201-500': '201-500',
    '501-1000': '501-1K',
    '1001-5000': '1K-5K',
    '5001+': '5K+'
};

export default function MobileReviewStep({ data, estimatedProspects = 0, onUpdate, onBack, onLaunch }: MobileReviewStepProps) {
    return (
        <MobileStepWrapper
            title="Review & Launch"
            stepCurrent={6}
            stepTotal={6}
            onBack={onBack}
            onNext={onLaunch}
            canProceed={true}
            nextLabel="Launch Campaign"
        >
            <div className="flex flex-col h-full space-y-4 pb-20">
                {/* Campaign Name Input */}
                <div className="bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <PenLine className="w-4 h-4 text-[#b7e219]" />
                        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                            Campaign Name
                        </h3>
                    </div>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        placeholder="e.g. Q1 Outreach - Software Engineers"
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3 text-[15px] font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#b7e219]/50 transition-all"
                    />
                    {!data.name && (
                        <p className="text-[11px] text-amber-500 mt-2 font-medium">
                            * Required to launch
                        </p>
                    )}
                </div>

                {/* Reach Card */}
                <div className="bg-gradient-to-br from-[#b7e219]/10 to-[#b7e219]/5 border border-[#b7e219]/20 rounded-2xl p-5">
                    <p className="text-[11px] font-bold text-[#b7e219] uppercase tracking-wider mb-1">
                        Estimated Reach
                    </p>
                    <div className="flex items-end gap-2 mb-3">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                            {estimatedProspects.toLocaleString()}
                        </span>
                        <span className="text-[14px] font-medium text-gray-500 dark:text-white/60 mb-1.5">
                            prospects
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#b7e219]/20 text-[#b7e219] text-[11px] font-bold">
                        <Target className="w-3.5 h-3.5" />
                        <span>{Math.min(100, estimatedProspects)} to contact</span>
                    </div>
                </div>

                {/* Targeting Summary */}
                <div className="bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-[15px]">
                        <Briefcase className="w-4 h-4" />
                        <h3>Targeting</h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-[11px] text-gray-500 dark:text-white/40 uppercase mb-2">Job Titles</p>
                            <div className="flex flex-wrap gap-1.5">
                                {data.personTitles.slice(0, 5).map(title => (
                                    <span key={title} className="px-2.5 py-1 rounded-full bg-white dark:bg-white/[0.06] border border-gray-100 dark:border-white/[0.06] text-[12px] font-medium text-gray-700 dark:text-white/80">
                                        {title}
                                    </span>
                                ))}
                                {data.personTitles.length > 5 && (
                                    <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[12px] text-gray-500">
                                        +{data.personTitles.length - 5}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-[11px] text-gray-500 dark:text-white/40 uppercase mb-1">Locations</p>
                                <p className="text-[13px] text-gray-900 dark:text-white font-medium">
                                    {data.personLocations.join(', ')}
                                </p>
                            </div>
                        </div>

                        {(data.seniorities.length > 0 || data.companySizes.length > 0) && (
                            <div className="flex flex-wrap gap-4 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                                {data.seniorities.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className="text-[13px] text-gray-700 dark:text-white/70">
                                            {data.seniorities.map(s => SENIORITY_LABELS[s]).join(', ')}
                                        </span>
                                    </div>
                                )}
                                {data.companySizes.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                        <span className="text-[13px] text-gray-700 dark:text-white/70">
                                            {data.companySizes.map(s => COMPANY_SIZE_LABELS[s]).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Settings */}
                <div className="bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-[15px]">
                        <Mail className="w-4 h-4" />
                        <h3>Email Settings</h3>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/[0.06]">
                            <span className="text-[13px] text-gray-500 dark:text-white/60">From</span>
                            <span className="text-[13px] font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                                {data.gmailEmail || 'Not connected'}
                            </span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/[0.06]">
                            <span className="text-[13px] text-gray-500 dark:text-white/60">Mode</span>
                            <div className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                                    {data.emailGenerationMode === 'template' ? 'Template' :
                                        data.emailGenerationMode === 'abtest' ? 'A/B Test' : 'Auto'}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-2">
                            <span className="text-[13px] text-gray-500 dark:text-white/60">CV Attached</span>
                            {data.attachCV && data.cvAttachment ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <Check className="w-3.5 h-3.5" />
                                    <span className="text-[13px] font-medium truncate max-w-[150px]">
                                        {data.cvAttachment.name}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-[13px] text-gray-400">No</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MobileStepWrapper>
    );
}

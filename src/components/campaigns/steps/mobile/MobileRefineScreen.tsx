import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Building2, Ban, Star, ChevronRight, Check, X,
    ChevronDown, Plus, Loader2
} from 'lucide-react';
import { CampaignData, Seniority, CompanySize } from '../../NewCampaignModal';
import BottomSheet from '../../../common/BottomSheet';
import MobileProspectsCard from './MobileProspectsCard';

interface MobileRefineScreenProps {
    data: CampaignData;
    onUpdate: (updates: Partial<CampaignData>) => void;
    estimatedProspects: number | null;
    isLoadingPreview: boolean;
}

// Options constants (duplicated from TargetingStep to avoid refactoring risk)
const SENIORITY_OPTIONS: { value: Seniority; label: string }[] = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'manager', label: 'Manager' },
    { value: 'director', label: 'Director' },
    { value: 'vp', label: 'VP' },
    { value: 'c_suite', label: 'C-Suite' }
];

const COMPANY_SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
    { value: '1-10', label: '1-10' },
    { value: '11-50', label: '11-50' },
    { value: '51-200', label: '51-200' },
    { value: '201-500', label: '201-500' },
    { value: '501-1000', label: '501-1000' },
    { value: '1001-5000', label: '1001-5000' },
    { value: '5001+', label: '5000+' }
];

const INDUSTRY_OPTIONS = [
    { key: 'technology', label: 'Technology' },
    { key: 'finance', label: 'Finance' },
    { key: 'healthcare', label: 'Healthcare' },
    { key: 'consulting', label: 'Consulting' },
    { key: 'retail', label: 'Retail' },
    { key: 'manufacturing', label: 'Manufacturing' },
    { key: 'education', label: 'Education' },
    { key: 'media', label: 'Media' },
    { key: 'realEstate', label: 'Real Estate' },
    { key: 'energy', label: 'Energy' },
    { key: 'telecom', label: 'Telecom' },
    { key: 'automotive', label: 'Automotive' }
];

export default function MobileRefineScreen({
    data,
    onUpdate,
    estimatedProspects,
    isLoadingPreview
}: MobileRefineScreenProps) {
    // Sheet states
    const [activeSheet, setActiveSheet] = useState<'seniority' | 'companySize' | 'industry' | null>(null);

    // Accordion states
    const [expandedSection, setExpandedSection] = useState<'exclude' | 'priority' | null>(null);

    // Input states
    const [excludeInput, setExcludeInput] = useState('');
    const [priorityInput, setPriorityInput] = useState('');

    // Handlers
    const toggleSeniority = (value: Seniority) => {
        if (data.seniorities.includes(value)) {
            onUpdate({ seniorities: data.seniorities.filter(s => s !== value) });
        } else {
            onUpdate({ seniorities: [...data.seniorities, value] });
        }
    };

    const toggleCompanySize = (value: CompanySize) => {
        if (data.companySizes.includes(value)) {
            onUpdate({ companySizes: data.companySizes.filter(s => s !== value) });
        } else {
            onUpdate({ companySizes: [...data.companySizes, value] });
        }
    };

    const toggleIndustry = (value: string) => {
        if (data.industries.includes(value)) {
            onUpdate({ industries: data.industries.filter(i => i !== value) });
        } else {
            onUpdate({ industries: [...data.industries, value] });
        }
    };

    const addExcludedCompany = () => {
        if (excludeInput.trim() && !data.excludedCompanies.includes(excludeInput.trim())) {
            onUpdate({ excludedCompanies: [...data.excludedCompanies, excludeInput.trim()] });
            setExcludeInput('');
        }
    };

    const addPriorityCompany = () => {
        if (priorityInput.trim() && !data.targetCompanies.includes(priorityInput.trim())) {
            onUpdate({ targetCompanies: [...data.targetCompanies, priorityInput.trim()] });
            setPriorityInput('');
        }
    };

    const toggleSection = (section: 'exclude' | 'priority') => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div className="flex flex-col h-full pb-24">
            <div className="mb-6">
                <h2 className="text-[24px] font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
                    Refine your search
                </h2>
                <p className="text-[15px] text-gray-500 dark:text-white/40 leading-relaxed">
                    Optional filters to narrow down your audience.
                </p>
            </div>

            <div className="space-y-3">
                {/* Seniority Trigger */}
                <button
                    onClick={() => setActiveSheet('seniority')}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#2b2a2c] 
            border border-gray-100 dark:border-white/[0.06] rounded-xl shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[15px] font-medium text-gray-900 dark:text-white">Seniority</p>
                            <p className="text-[13px] text-gray-500 dark:text-white/40">
                                {data.seniorities.length > 0
                                    ? `${data.seniorities.length} selected`
                                    : 'Any level'}
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                {/* Company Size Trigger */}
                <button
                    onClick={() => setActiveSheet('companySize')}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#2b2a2c] 
            border border-gray-100 dark:border-white/[0.06] rounded-xl shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[15px] font-medium text-gray-900 dark:text-white">Company Size</p>
                            <p className="text-[13px] text-gray-500 dark:text-white/40">
                                {data.companySizes.length > 0
                                    ? `${data.companySizes.length} selected`
                                    : 'Any size'}
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                {/* Industry Trigger */}
                <button
                    onClick={() => setActiveSheet('industry')}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#2b2a2c] 
            border border-gray-100 dark:border-white/[0.06] rounded-xl shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[15px] font-medium text-gray-900 dark:text-white">Industries</p>
                            <p className="text-[13px] text-gray-500 dark:text-white/40">
                                {data.industries.length > 0
                                    ? `${data.industries.length} selected`
                                    : 'Any industry'}
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                {/* Exclude Companies Section */}
                <div className="bg-white dark:bg-[#2b2a2c] border border-gray-100 dark:border-white/[0.06] rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('exclude')}
                        className="w-full flex items-center justify-between p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                                <Ban className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-[15px] font-medium text-gray-900 dark:text-white">Exclude Companies</p>
                                {data.excludedCompanies.length > 0 && (
                                    <p className="text-[13px] text-gray-500 dark:text-white/40">
                                        {data.excludedCompanies.length} excluded
                                    </p>
                                )}
                            </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'exclude' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {expandedSection === 'exclude' && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-0 border-t border-gray-100 dark:border-white/[0.06]">
                                    <div className="flex flex-wrap gap-2 mb-3 mt-3">
                                        {data.excludedCompanies.map(company => (
                                            <span key={company} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-full text-[13px] font-medium">
                                                {company}
                                                <button onClick={() => onUpdate({ excludedCompanies: data.excludedCompanies.filter(c => c !== company) })}>
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={excludeInput}
                                            onChange={(e) => setExcludeInput(e.target.value)}
                                            placeholder="e.g. Google"
                                            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] rounded-lg text-[14px] outline-none"
                                        />
                                        <button
                                            onClick={addExcludedCompany}
                                            disabled={!excludeInput.trim()}
                                            className="px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg disabled:opacity-50"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Priority Companies Section */}
                <div className="bg-white dark:bg-[#2b2a2c] border border-gray-100 dark:border-white/[0.06] rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('priority')}
                        className="w-full flex items-center justify-between p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Star className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-[15px] font-medium text-gray-900 dark:text-white">Priority Companies</p>
                                {data.targetCompanies.length > 0 && (
                                    <p className="text-[13px] text-gray-500 dark:text-white/40">
                                        {data.targetCompanies.length} prioritized
                                    </p>
                                )}
                            </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'priority' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {expandedSection === 'priority' && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-0 border-t border-gray-100 dark:border-white/[0.06]">
                                    <div className="flex flex-wrap gap-2 mb-3 mt-3">
                                        {data.targetCompanies.map(company => (
                                            <span key={company} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full text-[13px] font-medium">
                                                {company}
                                                <button onClick={() => onUpdate({ targetCompanies: data.targetCompanies.filter(c => c !== company) })}>
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={priorityInput}
                                            onChange={(e) => setPriorityInput(e.target.value)}
                                            placeholder="e.g. OpenAI"
                                            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] rounded-lg text-[14px] outline-none"
                                        />
                                        <button
                                            onClick={addPriorityCompany}
                                            disabled={!priorityInput.trim()}
                                            className="px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg disabled:opacity-50"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Estimated Prospects Card */}
            <MobileProspectsCard
                count={estimatedProspects}
                isLoading={isLoadingPreview}
                showExplanation={true}
                showLowCountWarning={true}
            />

            {/* Bottom Sheets */}
            <BottomSheet
                isOpen={activeSheet === 'seniority'}
                onClose={() => setActiveSheet(null)}
                title="Seniority Level"
                height={50}
            >
                <div className="p-4 space-y-2">
                    {SENIORITY_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            onClick={() => toggleSeniority(option.value)}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors"
                        >
                            <span className="text-[15px] font-medium text-gray-900 dark:text-white">
                                {option.label}
                            </span>
                            {data.seniorities.includes(option.value) && (
                                <Check className="w-5 h-5 text-[#b7e219]" />
                            )}
                        </button>
                    ))}
                </div>
            </BottomSheet>

            <BottomSheet
                isOpen={activeSheet === 'companySize'}
                onClose={() => setActiveSheet(null)}
                title="Company Size"
                height={60}
            >
                <div className="p-4 space-y-2">
                    {COMPANY_SIZE_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            onClick={() => toggleCompanySize(option.value)}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors"
                        >
                            <span className="text-[15px] font-medium text-gray-900 dark:text-white">
                                {option.label}
                            </span>
                            {data.companySizes.includes(option.value) && (
                                <Check className="w-5 h-5 text-[#b7e219]" />
                            )}
                        </button>
                    ))}
                </div>
            </BottomSheet>

            <BottomSheet
                isOpen={activeSheet === 'industry'}
                onClose={() => setActiveSheet(null)}
                title="Industries"
                height={70}
            >
                <div className="p-4 space-y-2">
                    {INDUSTRY_OPTIONS.map(option => (
                        <button
                            key={option.key}
                            onClick={() => toggleIndustry(option.key)}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors"
                        >
                            <span className="text-[15px] font-medium text-gray-900 dark:text-white">
                                {option.label}
                            </span>
                            {data.industries.includes(option.key) && (
                                <Check className="w-5 h-5 text-[#b7e219]" />
                            )}
                        </button>
                    ))}
                </div>
            </BottomSheet>
        </div>
    );
}

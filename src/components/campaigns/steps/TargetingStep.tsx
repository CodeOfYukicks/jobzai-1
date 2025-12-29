import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, MapPin, Users, Building2, X, Plus,
  Sparkles, ChevronDown, Check, Loader2, Ban, Info,
  GraduationCap, UserPlus, Star, Lightbulb
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import type { CampaignData, Seniority, CompanySize } from '../NewCampaignModal';
import LocationAutocomplete from '../LocationAutocomplete';
import { previewApolloSearch, suggestAlternativeTitles, type ApolloPreviewResult, type TitleSuggestion } from '../../../lib/apolloService';

import { useIsMobile } from '../../../hooks/useIsMobile';
import MobileTargetingFlow from './mobile/MobileTargetingFlow';

interface TargetingStepProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
  onEstimatedProspectsChange?: (count: number) => void;
  onNext?: () => void;
  onBack?: () => void;
}

const COMPANY_SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '501-1000', label: '501-1000' },
  { value: '1001-5000', label: '1001-5000' },
  { value: '5001+', label: '5000+' }
];

// Location suggestions are now handled by LocationAutocomplete component

interface UserProfile {
  targetPosition?: string;
  city?: string;
  country?: string;
  skills?: string[];
  targetSectors?: string[];
  yearsOfExperience?: string;
}

// Map years of experience to seniority
export function mapExperienceToSeniority(years: string | undefined): Seniority[] {
  if (!years) return [];
  const yearsNum = parseInt(years);
  if (yearsNum <= 2) return ['entry'];
  if (yearsNum <= 5) return ['senior'];
  if (yearsNum <= 10) return ['senior', 'manager'];
  return ['manager', 'director'];
}

function DesktopTargetingStep({
  data,
  onUpdate,
  onEstimatedProspectsChange,
  onNext,
  onBack
}: TargetingStepProps) {
  const { currentUser } = useAuth();

  // Apollo-compatible options
  const SENIORITY_OPTIONS: { value: Seniority; label: string }[] = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'manager', label: 'Manager' },
    { value: 'director', label: 'Director' },
    { value: 'vp', label: 'VP' },
    { value: 'c_suite', label: 'C-Suite' }
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

  const OUTREACH_GOALS = [
    { id: 'job', label: 'Job Search', icon: Briefcase, description: 'Looking for job opportunities' },
    { id: 'internship', label: 'Internship', icon: GraduationCap, description: 'Seeking internship positions' },
    { id: 'networking', label: 'Networking', icon: UserPlus, description: 'Building professional connections' },
  ] as const;
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [suggestions, setSuggestions] = useState<{
    titles: string[];
    locations: string[];
    skills: string[];
    industries: string[];
    seniorities: Seniority[];
  }>({ titles: [], locations: [], skills: [], industries: [], seniorities: [] });

  // Input states
  const [titleInput, setTitleInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const [targetCompanyInput, setTargetCompanyInput] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showGoalTooltip, setShowGoalTooltip] = useState(false);
  const goalTooltipRef = useRef<HTMLDivElement>(null);

  // Preview state
  const [previewResult, setPreviewResult] = useState<ApolloPreviewResult | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, TitleSuggestion[]>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<Record<string, boolean>>({});

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (goalTooltipRef.current && !goalTooltipRef.current.contains(event.target as Node)) {
        setShowGoalTooltip(false);
      }
    };

    if (showGoalTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGoalTooltip]);

  // Debounced preview fetch
  useEffect(() => {
    // Clear existing timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    // Only preview if we have required fields
    if (data.personTitles.length === 0 || data.personLocations.length === 0) {
      setPreviewResult(null);
      return;
    }

    // Debounce the API call
    previewTimeoutRef.current = setTimeout(async () => {
      setIsLoadingPreview(true);
      try {
        const result = await previewApolloSearch({
          personTitles: data.personTitles,
          personLocations: data.personLocations,
          seniorities: data.seniorities,
          companySizes: data.companySizes,
          industries: data.industries,
          targetCompanies: data.targetCompanies,
        });
        setPreviewResult(result);
        // Report to parent for use in ReviewStep
        if (result.totalAvailable !== undefined) {
          onEstimatedProspectsChange?.(result.totalAvailable);
        }
      } catch (error) {
        console.error('Preview error:', error);
        setPreviewResult(null);
      } finally {
        setIsLoadingPreview(false);
      }
    }, 800); // 800ms debounce

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [data.personTitles, data.personLocations, data.seniorities, data.companySizes, data.industries, data.targetCompanies]);

  // Load user profile for smart suggestions
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;

          // Build suggestions from profile
          const newSuggestions = {
            titles: profile.targetPosition ? [profile.targetPosition] : [],
            locations: profile.city && profile.country
              ? [`${profile.city}, ${profile.country}`]
              : [],
            skills: profile.skills?.slice(0, 5) || [],
            industries: profile.targetSectors || [],
            seniorities: mapExperienceToSeniority(profile.yearsOfExperience)
          };

          setSuggestions(newSuggestions);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  // Add handlers
  const addTitle = (title: string) => {
    if (title.trim() && !data.personTitles.includes(title.trim())) {
      onUpdate({ personTitles: [...data.personTitles, title.trim()] });
    }
    setTitleInput('');
  };

  const removeTitle = (title: string) => {
    onUpdate({ personTitles: data.personTitles.filter(t => t !== title) });
  };

  const addLocation = (location: string) => {
    if (location.trim() && !data.personLocations.includes(location.trim())) {
      onUpdate({ personLocations: [...data.personLocations, location.trim()] });
    }
  };

  const removeLocation = (location: string) => {
    onUpdate({ personLocations: data.personLocations.filter(l => l !== location) });
  };

  const toggleSeniority = (seniority: Seniority) => {
    if (data.seniorities.includes(seniority)) {
      onUpdate({ seniorities: data.seniorities.filter(s => s !== seniority) });
    } else {
      onUpdate({ seniorities: [...data.seniorities, seniority] });
    }
  };

  const toggleCompanySize = (size: CompanySize) => {
    if (data.companySizes.includes(size)) {
      onUpdate({ companySizes: data.companySizes.filter(s => s !== size) });
    } else {
      onUpdate({ companySizes: [...data.companySizes, size] });
    }
  };

  const toggleIndustry = (industry: string) => {
    if (data.industries.includes(industry)) {
      onUpdate({ industries: data.industries.filter(i => i !== industry) });
    } else {
      onUpdate({ industries: [...data.industries, industry] });
    }
  };

  const addExcludedCompany = (company: string) => {
    if (company.trim() && !data.excludedCompanies.includes(company.trim())) {
      onUpdate({ excludedCompanies: [...data.excludedCompanies, company.trim()] });
    }
    setExcludeInput('');
  };

  const removeExcludedCompany = (company: string) => {
    onUpdate({ excludedCompanies: data.excludedCompanies.filter(c => c !== company) });
  };

  // Apply suggestion
  const applySuggestion = (type: 'title' | 'location' | 'industry' | 'seniority', value: string) => {
    switch (type) {
      case 'title':
        if (!data.personTitles.includes(value)) {
          onUpdate({ personTitles: [...data.personTitles, value] });
        }
        break;
      case 'location':
        if (!data.personLocations.includes(value)) {
          onUpdate({ personLocations: [...data.personLocations, value] });
        }
        break;
      case 'industry':
        if (!data.industries.includes(value)) {
          onUpdate({ industries: [...data.industries, value] });
        }
        break;
      case 'seniority':
        const sen = value as Seniority;
        if (!data.seniorities.includes(sen)) {
          onUpdate({ seniorities: [...data.seniorities, sen] });
        }
        break;
    }
  };

  // Filter available suggestions (not already selected)
  const availableSuggestions = {
    titles: suggestions.titles.filter(t => !data.personTitles.includes(t)),
    locations: suggestions.locations.filter(l => !data.personLocations.includes(l)),
    skills: suggestions.skills,
    industries: suggestions.industries.filter(i => !data.industries.includes(i)),
    seniorities: suggestions.seniorities.filter(s => !data.seniorities.includes(s))
  };

  const hasSuggestions = availableSuggestions.titles.length > 0 ||
    availableSuggestions.locations.length > 0 ||
    availableSuggestions.industries.length > 0 ||
    availableSuggestions.seniorities.length > 0 ||
    availableSuggestions.skills.length > 0;

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Define Your Target Audience
        </h3>
        <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
          Specify who you want to reach out to
        </p>
      </div>

      {/* Outreach Goal - Required, First Field */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="block text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
            Outreach Goal <span className="text-red-500">*</span>
          </label>
          {/* Info tooltip */}
          <div className="relative" ref={goalTooltipRef}>
            <button
              onClick={() => setShowGoalTooltip(!showGoalTooltip)}
              className="p-1 rounded-md text-gray-400 dark:text-gray-500 
                hover:text-gray-600 dark:hover:text-gray-300 
                hover:bg-gray-100 dark:hover:bg-white/[0.06]
                transition-all duration-200"
              title="What is this?"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
              {showGoalTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 z-50 w-72
                    bg-white dark:bg-[#1a1a1a] 
                    rounded-xl shadow-xl dark:shadow-2xl 
                    border border-gray-200 dark:border-white/[0.08]
                    p-4 backdrop-blur-xl"
                >
                  <p className="text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed">
                    The AI will tailor your outreach emails based on this goal.
                  </p>
                  <ul className="mt-3 space-y-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <Briefcase className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span><strong className="text-gray-700 dark:text-gray-300">Job Search</strong> - Focus on job opportunities and career advancement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <GraduationCap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span><strong className="text-gray-700 dark:text-gray-300">Internship</strong> - Emphasize learning experiences and skill development</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <UserPlus className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span><strong className="text-gray-700 dark:text-gray-300">Networking</strong> - Build professional connections and industry insights</span>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Goal Pills */}
        <div className="flex items-center gap-2">
          {OUTREACH_GOALS.map((goal) => {
            const Icon = goal.icon;
            const isSelected = data.outreachGoal === goal.id;

            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => onUpdate({ outreachGoal: goal.id })}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                  ${isSelected
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                    : 'bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200/80 dark:hover:bg-white/[0.08]'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{goal.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Smart Suggestions from Profile */}
      {hasSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-[13px] font-medium text-violet-900 dark:text-violet-200">
              Based on your profile
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.titles.map(title => (
              <button
                key={title}
                onClick={() => applySuggestion('title', title)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/10 
                  border border-violet-200 dark:border-violet-500/30 rounded-full
                  text-[12px] font-medium text-violet-700 dark:text-violet-300
                  hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
              >
                <Briefcase className="w-3 h-3" />
                {title}
                <Plus className="w-3 h-3" />
              </button>
            ))}
            {availableSuggestions.locations.map(loc => (
              <button
                key={loc}
                onClick={() => applySuggestion('location', loc)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/10 
                  border border-violet-200 dark:border-violet-500/30 rounded-full
                  text-[12px] font-medium text-violet-700 dark:text-violet-300
                  hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
              >
                <MapPin className="w-3 h-3" />
                {loc}
                <Plus className="w-3 h-3" />
              </button>
            ))}
            {availableSuggestions.industries.map(ind => (
              <button
                key={ind}
                onClick={() => applySuggestion('industry', ind)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/10 
                  border border-violet-200 dark:border-violet-500/30 rounded-full
                  text-[12px] font-medium text-violet-700 dark:text-violet-300
                  hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
              >
                <Building2 className="w-3 h-3" />
                {ind}
                <Plus className="w-3 h-3" />
              </button>
            ))}
            {availableSuggestions.seniorities.map(sen => (
              <button
                key={sen}
                onClick={() => applySuggestion('seniority', sen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/10 
                  border border-violet-200 dark:border-violet-500/30 rounded-full
                  text-[12px] font-medium text-violet-700 dark:text-violet-300
                  hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
              >
                <Users className="w-3 h-3" />
                {SENIORITY_OPTIONS.find(s => s.value === sen)?.label}
                <Plus className="w-3 h-3" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Job Titles */}
      <div className="space-y-2">
        <label className="block text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
          Job Titles <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.personTitles.map(title => (
            <span
              key={title}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 
                bg-gray-100 dark:bg-white/[0.08] rounded-full
                text-[13px] font-medium text-gray-700 dark:text-white"
            >
              {title}
              <button onClick={() => removeTitle(title)} className="hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTitle(titleInput))}
            placeholder="e.g., Software Engineer, Product Manager"
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] 
              border border-gray-200 dark:border-white/[0.08] rounded-lg
              text-[14px] text-gray-900 dark:text-white 
              placeholder:text-gray-400 dark:placeholder:text-white/30
              focus:outline-none focus:border-gray-300 dark:focus:border-white/20"
          />
          <button
            onClick={() => addTitle(titleInput)}
            disabled={!titleInput.trim()}
            className="px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black 
              rounded-lg text-[13px] font-medium disabled:opacity-40 
              hover:bg-gray-800 dark:hover:bg-white/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Expand Titles Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
            <span className="text-[12px] text-gray-600 dark:text-white/60">
              Include similar titles
            </span>
          </div>
          <button
            type="button"
            onClick={() => onUpdate({ expandTitles: !data.expandTitles })}
            className={`relative w-11 h-6 rounded-full transition-colors ${data.expandTitles
              ? 'bg-violet-500'
              : 'bg-gray-300 dark:bg-white/20'
              }`}
          >
            <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${data.expandTitles ? 'translate-x-5' : 'translate-x-0'
              }`} />
          </button>
        </div>
        {data.expandTitles && (
          <p className="text-[11px] text-violet-600 dark:text-violet-400">
            We'll also search for related titles like "Developer", "SWE" for "Software Engineer"
          </p>
        )}
      </div>

      {/* Locations */}
      <div className="space-y-2">
        <label className="block text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
          Locations <span className="text-red-500">*</span>
        </label>
        <LocationAutocomplete
          selectedLocations={data.personLocations}
          onAddLocation={addLocation}
          onRemoveLocation={removeLocation}
          placeholder="e.g., Paris, London, Remote"
        />
      </div>

      {/* Seniority */}
      <div className="space-y-2">
        <label className="block text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
          Seniority Level
        </label>
        <div className="flex flex-wrap gap-2">
          {SENIORITY_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => toggleSeniority(option.value)}
              className={`px-4 py-2 rounded-lg border text-[13px] font-medium transition-all
                ${data.seniorities.includes(option.value)
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white'
                  : 'bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-white/60 border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Company Size */}
      <div className="space-y-2">
        <label className="block text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
          Company Size
        </label>
        <div className="flex flex-wrap gap-2">
          {COMPANY_SIZE_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => toggleCompanySize(option.value)}
              className={`px-4 py-2 rounded-lg border text-[13px] font-medium transition-all
                ${data.companySizes.includes(option.value)
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white'
                  : 'bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-white/60 border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Industries */}
      <div className="space-y-2">
        <label className="block text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
          Industries
        </label>
        <div className="relative">
          <button
            onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
            className="w-full flex items-center justify-between px-4 py-2.5 
              bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] 
              rounded-lg text-[14px] text-left"
          >
            <span className={data.industries.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/30'}>
              {data.industries.length > 0
                ? `${data.industries.length} selected`
                : 'Select industries'}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showIndustryDropdown ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showIndustryDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 py-2 bg-white dark:bg-[#1a1a1a] 
                  border border-gray-200 dark:border-white/[0.1] rounded-xl shadow-xl max-h-60 overflow-y-auto"
              >
                {INDUSTRY_OPTIONS.map(industry => (
                  <button
                    key={industry.key}
                    onClick={() => toggleIndustry(industry.key)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-[14px] text-left
                      hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <span className={data.industries.includes(industry.key)
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-white/60'
                    }>
                      {industry.label}
                    </span>
                    {data.industries.includes(industry.key) && (
                      <Check className="w-4 h-4 text-gray-900 dark:text-white" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {data.industries.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.industries.map(ind => {
              const industryOption = INDUSTRY_OPTIONS.find(i => i.key === ind);
              return (
                <span
                  key={ind}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 
                    bg-gray-100 dark:bg-white/[0.08] rounded-full
                    text-[12px] font-medium text-gray-700 dark:text-white"
                >
                  {industryOption?.label || ind}
                  <button onClick={() => toggleIndustry(ind)} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Exclude Companies */}
      <div className="space-y-2">
        <label className="block text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium flex items-center gap-2">
          <Ban className="w-3.5 h-3.5" />
          Exclude Companies
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.excludedCompanies.map(company => (
            <span
              key={company}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 
                bg-red-50 dark:bg-red-500/10 rounded-full
                text-[12px] font-medium text-red-700 dark:text-red-400
                border border-red-200 dark:border-red-500/20"
            >
              {company}
              <button onClick={() => removeExcludedCompany(company)} className="hover:text-red-900 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={excludeInput}
            onChange={(e) => setExcludeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExcludedCompany(excludeInput))}
            placeholder="e.g., Google, Meta"
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] 
              border border-gray-200 dark:border-white/[0.08] rounded-lg
              text-[14px] text-gray-900 dark:text-white 
              placeholder:text-gray-400 dark:placeholder:text-white/30
              focus:outline-none focus:border-gray-300 dark:focus:border-white/20"
          />
          <button
            onClick={() => addExcludedCompany(excludeInput)}
            disabled={!excludeInput.trim()}
            className="px-4 py-2.5 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white 
              rounded-lg text-[13px] font-medium disabled:opacity-40 
              hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-white/30">
          These companies won't be included in your campaign
        </p>
      </div>

      {/* Target Companies (Priority Companies) */}
      <div className="space-y-2">
        <label className="block text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium flex items-center gap-2">
          <Star className="w-3.5 h-3.5" />
          Priority Companies
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.targetCompanies.map(company => (
            <span
              key={company}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 
                bg-blue-50 dark:bg-blue-500/10 rounded-full
                text-[12px] font-medium text-blue-700 dark:text-blue-400
                border border-blue-200 dark:border-blue-500/20"
            >
              {company}
              <button
                onClick={() => onUpdate({ targetCompanies: data.targetCompanies.filter(c => c !== company) })}
                className="hover:text-blue-900 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={targetCompanyInput}
            onChange={(e) => setTargetCompanyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (targetCompanyInput.trim() && !data.targetCompanies.includes(targetCompanyInput.trim())) {
                  onUpdate({ targetCompanies: [...data.targetCompanies, targetCompanyInput.trim()] });
                  setTargetCompanyInput('');
                }
              }
            }}
            placeholder="e.g., Google, Stripe, Notion"
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] 
              border border-gray-200 dark:border-white/[0.08] rounded-lg
              text-[14px] text-gray-900 dark:text-white 
              placeholder:text-gray-400 dark:placeholder:text-white/30
              focus:outline-none focus:border-gray-300 dark:focus:border-white/20"
          />
          <button
            onClick={() => {
              if (targetCompanyInput.trim() && !data.targetCompanies.includes(targetCompanyInput.trim())) {
                onUpdate({ targetCompanies: [...data.targetCompanies, targetCompanyInput.trim()] });
                setTargetCompanyInput('');
              }
            }}
            disabled={!targetCompanyInput.trim()}
            className="px-4 py-2.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 
              rounded-lg text-[13px] font-medium disabled:opacity-40 
              hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-white/30">
          These companies will be prioritized in your search (not strictly filtered)
        </p>
      </div>

      {/* Summary */}
      {(data.personTitles.length > 0 || data.personLocations.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]"
        >
          <p className="text-[12px] text-gray-400 dark:text-white/40 uppercase tracking-wider font-medium mb-2">
            Target Summary
          </p>
          <p className="text-[14px] text-gray-700 dark:text-white/70">
            {data.personTitles.length > 0 && (
              <>
                <span className="text-gray-900 dark:text-white font-medium">
                  {data.personTitles.join(', ')}
                </span>
              </>
            )}
            {data.personLocations.length > 0 && (
              <>
                <span className="text-gray-400 dark:text-white/40"> in </span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {data.personLocations.join(', ')}
                </span>
              </>
            )}
            {data.seniorities.length > 0 && (
              <>
                <span className="text-gray-400 dark:text-white/40"> · </span>
                <span className="text-gray-600 dark:text-white/60">
                  {data.seniorities.map(s => SENIORITY_OPTIONS.find(o => o.value === s)?.label).join(', ')}
                </span>
              </>
            )}
          </p>
        </motion.div>
      )}

      {/* Estimated Prospects Preview */}
      {(data.personTitles.length > 0 && data.personLocations.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${previewResult?.isLowVolume
            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
            : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${previewResult?.isLowVolume
                ? 'bg-amber-100 dark:bg-amber-500/20'
                : 'bg-emerald-100 dark:bg-emerald-500/20'
                }`}>
                <Users className={`w-4 h-4 ${previewResult?.isLowVolume
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
                  }`} />
              </div>
              <div>
                <p className="text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
                  Estimated Prospects
                </p>
                {isLoadingPreview ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-[13px] text-gray-500 dark:text-white/50">Calculating...</span>
                  </div>
                ) : previewResult ? (
                  <p className={`text-[18px] font-semibold ${previewResult.isLowVolume
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                    {previewResult.totalAvailable.toLocaleString()} prospects
                  </p>
                ) : null}
              </div>
            </div>
            {previewResult?.isLowVolume && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 max-w-[200px] text-right">
                Consider adding more job titles or locations to increase results
              </p>
            )}
          </div>

          {/* Priority Company Breakdown */}
          {previewResult?.priorityBreakdown && previewResult.priorityBreakdown.companies.length > 0 && (
            <div className="mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-500/20">
              <p className="text-[11px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
                <Star className="w-3 h-3" />
                Priority Companies Breakdown
              </p>
              <div className="space-y-2">
                {previewResult.priorityBreakdown.companies.map(({ company, count }) => (
                  <div key={company}>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-gray-600 dark:text-white/60">{company}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[12px] font-medium ${count > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-400 dark:text-white/30'}`}>
                          {count.toLocaleString()} {count > 0 ? '✓' : ''}
                        </span>
                        {/* AI Suggestions button for 0 results */}
                        {count === 0 && !aiSuggestions[company] && (
                          <button
                            onClick={async () => {
                              setLoadingSuggestions(prev => ({ ...prev, [company]: true }));
                              const result = await suggestAlternativeTitles(
                                data.personTitles,
                                company,
                                {
                                  personLocations: data.personLocations,
                                  seniorities: data.seniorities,
                                  companySizes: data.companySizes
                                }
                              );
                              setAiSuggestions(prev => ({ ...prev, [company]: result.suggestions }));
                              setLoadingSuggestions(prev => ({ ...prev, [company]: false }));
                            }}
                            disabled={loadingSuggestions[company]}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-[10px] font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                          >
                            {loadingSuggestions[company] ? (
                              <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Finding...</>
                            ) : (
                              <><Lightbulb className="w-2.5 h-2.5" /> Find alternatives</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* AI Suggestions for this company */}
                    {aiSuggestions[company] && aiSuggestions[company].length > 0 && (
                      <div className="mt-1.5 ml-3 pl-3 border-l-2 border-violet-200 dark:border-violet-500/30">
                        <p className="text-[10px] text-violet-600 dark:text-violet-400 mb-1 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          AI found similar titles at {company}:
                        </p>
                        <div className="space-y-0.5">
                          {aiSuggestions[company].map(({ title, count: sugCount }) => (
                            <div key={title} className="flex items-center justify-between">
                              <button
                                onClick={() => {
                                  // Add the suggested title to personTitles
                                  if (!data.personTitles.includes(title)) {
                                    onUpdate({ personTitles: [...data.personTitles, title] });
                                  }
                                }}
                                className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                {title}
                              </button>
                              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                {sugCount} ✓
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No alternatives found message */}
                    {aiSuggestions[company] && aiSuggestions[company].length === 0 && (
                      <p className="mt-1 ml-3 text-[10px] text-gray-400 dark:text-white/30 italic">
                        No matching alternatives found at {company}
                      </p>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-emerald-200/30 dark:border-emerald-500/10">
                  <span className="text-[12px] font-medium text-gray-700 dark:text-white/70">Total priority</span>
                  <span className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {previewResult.priorityBreakdown.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function TargetingStep(props: TargetingStepProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileTargetingFlow
        data={props.data}
        onUpdate={props.onUpdate}
        onEstimatedProspectsChange={props.onEstimatedProspectsChange}
        onNext={props.onNext}
        onBack={props.onBack}
      />
    );
  }

  return <DesktopTargetingStep {...props} />;
}

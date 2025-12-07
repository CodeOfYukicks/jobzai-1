import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, MapPin, Users, Building2, X, Plus, 
  Sparkles, ChevronDown, Check, Loader2, Ban
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import type { CampaignData, Seniority, CompanySize } from '../NewCampaignModal';

interface TargetingStepProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
}

// Apollo-compatible options
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
  'Technology',
  'Finance & Banking',
  'Healthcare',
  'Consulting',
  'Retail & E-commerce',
  'Manufacturing',
  'Education',
  'Media & Entertainment',
  'Real Estate',
  'Energy & Utilities',
  'Telecommunications',
  'Automotive'
];

const LOCATION_SUGGESTIONS = [
  'Remote',
  'Paris, France',
  'London, United Kingdom',
  'New York, USA',
  'San Francisco, USA',
  'Berlin, Germany',
  'Amsterdam, Netherlands',
  'Toronto, Canada',
  'Singapore',
  'Dubai, UAE'
];

interface UserProfile {
  targetPosition?: string;
  city?: string;
  country?: string;
  skills?: string[];
  targetSectors?: string[];
  yearsOfExperience?: string;
}

// Map years of experience to seniority
function mapExperienceToSeniority(years: string | undefined): Seniority[] {
  if (!years) return [];
  const yearsNum = parseInt(years);
  if (yearsNum <= 2) return ['entry'];
  if (yearsNum <= 5) return ['senior'];
  if (yearsNum <= 10) return ['senior', 'manager'];
  return ['manager', 'director'];
}

export default function TargetingStep({ data, onUpdate }: TargetingStepProps) {
  const { currentUser } = useAuth();
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
  const [locationInput, setLocationInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);

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
    setLocationInput('');
    setShowLocationDropdown(false);
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

  const filteredLocations = LOCATION_SUGGESTIONS.filter(loc =>
    loc.toLowerCase().includes(locationInput.toLowerCase()) &&
    !data.personLocations.includes(loc)
  );

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
          Who do you want to reach?
        </h3>
        <p className="text-[14px] text-gray-500 dark:text-white/50 leading-relaxed">
          Define your target audience for Apollo lead sourcing.
        </p>
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
      </div>

      {/* Locations */}
      <div className="space-y-2">
        <label className="block text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
          Locations <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.personLocations.map(loc => (
            <span
              key={loc}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 
                bg-gray-100 dark:bg-white/[0.08] rounded-full
                text-[13px] font-medium text-gray-700 dark:text-white"
            >
              <MapPin className="w-3 h-3" />
              {loc}
              <button onClick={() => removeLocation(loc)} className="hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onFocus={() => setShowLocationDropdown(true)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation(locationInput))}
            placeholder="e.g., Paris, France"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] 
              border border-gray-200 dark:border-white/[0.08] rounded-lg
              text-[14px] text-gray-900 dark:text-white 
              placeholder:text-gray-400 dark:placeholder:text-white/30
              focus:outline-none focus:border-gray-300 dark:focus:border-white/20"
          />
          <AnimatePresence>
            {showLocationDropdown && filteredLocations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 py-2 bg-white dark:bg-[#1a1a1a] 
                  border border-gray-200 dark:border-white/[0.1] rounded-xl shadow-xl max-h-48 overflow-y-auto"
              >
                {filteredLocations.map(loc => (
                  <button
                    key={loc}
                    onClick={() => addLocation(loc)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-left
                      text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.04] 
                      hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {loc}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
          Company Size (employees)
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
                    key={industry}
                    onClick={() => toggleIndustry(industry)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-[14px] text-left
                      hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <span className={data.industries.includes(industry) 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-600 dark:text-white/60'
                    }>
                      {industry}
                    </span>
                    {data.industries.includes(industry) && (
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
            {data.industries.map(ind => (
              <span
                key={ind}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 
                  bg-gray-100 dark:bg-white/[0.08] rounded-full
                  text-[12px] font-medium text-gray-700 dark:text-white"
              >
                {ind}
                <button onClick={() => toggleIndustry(ind)} className="hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
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
          These companies will be excluded from your search
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
    </div>
  );
}

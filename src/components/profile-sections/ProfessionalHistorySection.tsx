import { useState, useEffect, useRef } from 'react';
import { Briefcase, Plus, X, Calendar, Building2, MapPin, Edit2, Check, Search, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import MonthPicker from '../ui/MonthPicker';

interface SectionProps {
  onUpdate: (data: any) => void;
}

interface ProfessionalExperience {
  title: string;
  company: string;
  companyLogo?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  industry: string;
  contractType: string;
  location: string;
  responsibilities: string[];
  achievements: string[];
}

const ProfessionalHistorySection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    professionalHistory: [] as ProfessionalExperience[]
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [companySuggestions, setCompanySuggestions] = useState<Array<{ name: string; domain?: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState<{ [key: number]: boolean }>({});
  const [loadingLogo, setLoadingLogo] = useState<{ [key: number]: boolean }>({});
  const companyInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const suggestionsRef = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const logoFetchTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(showSuggestions).forEach(index => {
        const inputRef = companyInputRefs.current[parseInt(index)];
        const suggestionRef = suggestionsRef.current[parseInt(index)];
        if (
          showSuggestions[parseInt(index)] &&
          inputRef &&
          suggestionRef &&
          !inputRef.contains(event.target as Node) &&
          !suggestionRef.contains(event.target as Node)
        ) {
          setShowSuggestions(prev => ({ ...prev, [parseInt(index)]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Normaliser les données pour s'assurer que responsibilities et achievements sont des arrays
          const normalizedHistory = (userData.professionalHistory || []).map((exp: any) => ({
            ...exp,
            responsibilities: Array.isArray(exp.responsibilities) 
              ? exp.responsibilities 
              : (exp.responsibilities && typeof exp.responsibilities === 'string' ? [exp.responsibilities] : []),
            achievements: Array.isArray(exp.achievements) 
              ? exp.achievements 
              : (exp.achievements && typeof exp.achievements === 'string' ? [exp.achievements] : []),
            companyLogo: exp.companyLogo || ''
          }));
          
          setFormData({
            professionalHistory: normalizedHistory
          });
          onUpdate({
            professionalHistory: normalizedHistory
          });
        }
      } catch (error) {
        console.error('Error loading professional history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleChange = (field: string, value: any) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  // Fonction pour récupérer le logo d'une entreprise
  const fetchCompanyLogo = async (companyName: string, index: number): Promise<string | null> => {
    if (!companyName || companyName.trim().length < 2) return null;
    
    setLoadingLogo(prev => ({ ...prev, [index]: true }));
    try {
      // Utiliser Clearbit Logo API qui est gratuite
      // Format: https://logo.clearbit.com/{domain}
      
      // Nettoyer le nom de l'entreprise
      let cleanName = companyName.trim()
        .replace(/[^a-zA-Z0-9\s&.-]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();
      
      // Mappings spéciaux pour les entreprises connues
      const companyMappings: { [key: string]: string } = {
        'meta': 'meta.com',
        'facebook': 'facebook.com',
        'google': 'google.com',
        'microsoft': 'microsoft.com',
        'apple': 'apple.com',
        'amazon': 'amazon.com',
        'netflix': 'netflix.com',
        'tesla': 'tesla.com',
        'adobe': 'adobe.com',
        'salesforce': 'salesforce.com',
        'oracle': 'oracle.com',
        'ibm': 'ibm.com',
        'intel': 'intel.com',
        'nvidia': 'nvidia.com',
        'spotify': 'spotify.com',
        'uber': 'uber.com',
        'airbnb': 'airbnb.com',
        'linkedin': 'linkedin.com',
        'twitter': 'twitter.com',
        'x': 'x.com',
        'github': 'github.com',
        'stripe': 'stripe.com',
        'shopify': 'shopify.com',
        'atlassian': 'atlassian.com',
        'slack': 'slack.com',
        'zoom': 'zoom.us',
        'dropbox': 'dropbox.com',
        'paypal': 'paypal.com',
      };
      
      // Vérifier les mappings d'abord
      const mappedDomain = companyMappings[cleanName];
      if (mappedDomain) {
        const logoUrl = `https://logo.clearbit.com/${mappedDomain}`;
        try {
          const response = await fetch(logoUrl, { method: 'HEAD' });
          if (response.ok) {
            setLoadingLogo(prev => ({ ...prev, [index]: false }));
            return logoUrl;
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Essayer différents formats de domaine
      const words = cleanName.split(' ').filter(w => w.length > 0);
      const possibleDomains = [
        `${words.join('')}.com`,
        `${words[0]}.com`,
        `${words.join('-')}.com`,
        `${words.join('')}.io`,
        `${words[0]}.io`,
      ];
      
      // Tester chaque domaine
      for (const domain of possibleDomains) {
        const logoUrl = `https://logo.clearbit.com/${domain}`;
        try {
          const response = await fetch(logoUrl, { method: 'HEAD' });
          if (response.ok) {
            setLoadingLogo(prev => ({ ...prev, [index]: false }));
            return logoUrl;
          }
        } catch (e) {
          // Continue to next domain
        }
      }
      
      // Si aucun logo trouvé, retourner null
      setLoadingLogo(prev => ({ ...prev, [index]: false }));
      return null;
    } catch (error) {
      console.error('Error fetching company logo:', error);
      setLoadingLogo(prev => ({ ...prev, [index]: false }));
      return null;
    }
  };

  // Fonction pour rechercher des entreprises avec debounce
  const searchCompanies = (() => {
    let timeoutId: NodeJS.Timeout;
    return (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (!query || query.length < 2) {
          setCompanySuggestions([]);
          return;
        }

        try {
          // Liste étendue de suggestions (peut être remplacée par une vraie API comme Clearbit Autocomplete)
          const commonCompanies = [
            'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix', 'Tesla',
            'Adobe', 'Salesforce', 'Oracle', 'IBM', 'Intel', 'Nvidia', 'Spotify',
            'Uber', 'Airbnb', 'LinkedIn', 'Twitter', 'GitHub', 'Stripe', 'Shopify',
            'Atlassian', 'Slack', 'Zoom', 'Dropbox', 'PayPal', 'Visa', 'Mastercard',
            'Goldman Sachs', 'JPMorgan', 'Morgan Stanley', 'Bank of America', 'Wells Fargo',
            'Accenture', 'Deloitte', 'PwC', 'EY', 'KPMG', 'McKinsey', 'BCG', 'Bain',
            'Nike', 'Adidas', 'Coca-Cola', 'Pepsi', 'Starbucks', 'McDonald\'s',
            'Disney', 'Warner Bros', 'Sony', 'Nintendo', 'EA', 'Activision'
          ];

          const filtered = commonCompanies
            .filter(company => company.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5)
            .map(name => ({ name }));

          setCompanySuggestions(filtered);
        } catch (error) {
          console.error('Error searching companies:', error);
          setCompanySuggestions([]);
        }
      }, 300); // Debounce de 300ms
    };
  })();

  const addExperience = () => {
    const newExperience: ProfessionalExperience = {
      title: '',
      company: '',
      companyLogo: '',
      startDate: '',
      endDate: '',
      current: false,
      industry: '',
      contractType: '',
      location: '',
      responsibilities: [],
      achievements: []
    };
    const newHistory = [...formData.professionalHistory, newExperience];
    handleChange('professionalHistory', newHistory);
    // Ouvrir en mode édition pour la nouvelle expérience
    setEditingIndex(newHistory.length - 1);
  };

  const updateExperience = (index: number, field: keyof ProfessionalExperience, value: any) => {
    // Mise à jour immédiate et synchrone du state
    const updated = [...formData.professionalHistory];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, professionalHistory: updated }));
    handleChange('professionalHistory', updated);
    
    // Si on met à jour le nom de l'entreprise, récupérer le logo de manière asynchrone (non-bloquant)
    if (field === 'company') {
      // Annuler le timeout précédent s'il existe
      if (logoFetchTimeouts.current[index]) {
        clearTimeout(logoFetchTimeouts.current[index]);
      }
      
      if (value && value.trim().length > 0) {
        // Utiliser un debounce pour éviter trop de requêtes
        logoFetchTimeouts.current[index] = setTimeout(async () => {
          // Récupérer le logo de manière asynchrone
          const logo = await fetchCompanyLogo(value.trim(), index);
          if (logo) {
            // Vérifier que la valeur n'a pas changé entre-temps
            setFormData(currentFormData => {
              const currentValue = currentFormData.professionalHistory[index]?.company;
              if (currentValue === value.trim()) {
                const updatedWithLogo = [...currentFormData.professionalHistory];
                updatedWithLogo[index] = { ...updatedWithLogo[index], companyLogo: logo };
                handleChange('professionalHistory', updatedWithLogo);
                return { ...currentFormData, professionalHistory: updatedWithLogo };
              }
              return currentFormData;
            });
          }
        }, 1500); // Attendre 1.5 secondes après la dernière frappe
      } else {
        // Si le champ est vidé, supprimer le logo
        const updatedWithoutLogo = [...formData.professionalHistory];
        updatedWithoutLogo[index] = { ...updatedWithoutLogo[index], companyLogo: '' };
        setFormData(prev => ({ ...prev, professionalHistory: updatedWithoutLogo }));
        handleChange('professionalHistory', updatedWithoutLogo);
      }
    }
  };

  const handleCompanySelect = async (index: number, companyName: string) => {
    const updated = [...formData.professionalHistory];
    updated[index].company = companyName;
    
    // Récupérer le logo
    const logo = await fetchCompanyLogo(companyName, index);
    if (logo) {
      updated[index].companyLogo = logo;
    }
    
    handleChange('professionalHistory', updated);
    setShowSuggestions(prev => ({ ...prev, [index]: false }));
    setCompanySuggestions([]);
  };

  const toggleCurrentPosition = (index: number, isCurrent: boolean) => {
    const updated = [...formData.professionalHistory];
    updated[index] = { 
      ...updated[index], 
      current: isCurrent,
      endDate: isCurrent ? '' : updated[index].endDate
    };
    handleChange('professionalHistory', updated);
  };

  const handleSave = (index: number) => {
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const removeExperience = (index: number) => {
    handleChange('professionalHistory', formData.professionalHistory.filter((_, i) => i !== index));
  };

  const addResponsibility = (index: number) => {
    const updated = [...formData.professionalHistory];
    updated[index].responsibilities = [...updated[index].responsibilities, ''];
    handleChange('professionalHistory', updated);
  };

  const updateResponsibility = (expIndex: number, respIndex: number, value: string) => {
    const updated = [...formData.professionalHistory];
    updated[expIndex].responsibilities[respIndex] = value;
    handleChange('professionalHistory', updated);
  };

  const removeResponsibility = (expIndex: number, respIndex: number) => {
    const updated = [...formData.professionalHistory];
    updated[expIndex].responsibilities = updated[expIndex].responsibilities.filter((_, i) => i !== respIndex);
    handleChange('professionalHistory', updated);
  };

  const addAchievement = (index: number) => {
    const updated = [...formData.professionalHistory];
    updated[index].achievements = [...updated[index].achievements, ''];
    handleChange('professionalHistory', updated);
  };

  const updateAchievement = (expIndex: number, achIndex: number, value: string) => {
    const updated = [...formData.professionalHistory];
    updated[expIndex].achievements[achIndex] = value;
    handleChange('professionalHistory', updated);
  };

  const removeAchievement = (expIndex: number, achIndex: number) => {
    const updated = [...formData.professionalHistory];
    updated[expIndex].achievements = updated[expIndex].achievements.filter((_, i) => i !== achIndex);
    handleChange('professionalHistory', updated);
  };

  const industries = [
    'Technology / IT',
    'Finance / Banking',
    'Healthcare',
    'Consulting',
    'Manufacturing',
    'Retail / E-commerce',
    'Education',
    'Media / Entertainment',
    'Real Estate',
    'Energy',
    'Transportation',
    'Other'
  ];

  const contractTypes = [
    { id: 'full-time', label: 'Full Time' },
    { id: 'part-time', label: 'Part Time' },
    { id: 'contract', label: 'Contract' },
    { id: 'freelance', label: 'Freelance' },
    { id: 'internship', label: 'Internship' }
  ];

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="professional-history" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1"></div>
        <button
          onClick={addExperience}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </button>
      </div>

      <div className="space-y-4">
        {formData.professionalHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No professional experience added yet.</p>
            <p className="text-sm mt-1">Add your work history to get better recommendations.</p>
          </div>
        ) : (
          formData.professionalHistory.map((experience, index) => {
            const isEditing = editingIndex === index;
            
            return (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow relative">
              {isEditing ? (
                <>
                  {/* Header avec actions - Mode édition */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      Experience #{index + 1}
                    </h3>
                    <button
                      onClick={() => handleSave(index)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Boutons d'action - Positionnés en haut à droite, alignés avec le contenu */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => handleEdit(index)}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit experience"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {formData.professionalHistory.length > 1 && (
                      <button
                        onClick={() => removeExperience(index)}
                        className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
                        title="Remove experience"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
              )}

              {isEditing ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={experience.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="e.g., Senior Product Manager"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          ref={(el) => { companyInputRefs.current[index] = el; }}
                          type="text"
                          value={experience.company}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateExperience(index, 'company', value);
                            searchCompanies(value);
                            setShowSuggestions(prev => ({ ...prev, [index]: value.length > 0 }));
                          }}
                          onFocus={() => {
                            if (experience.company) {
                              searchCompanies(experience.company);
                              setShowSuggestions(prev => ({ ...prev, [index]: true }));
                            }
                          }}
                          className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          placeholder="e.g., Google"
                        />
                        {loadingLogo[index] && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                          </div>
                        )}
                        {!loadingLogo[index] && experience.company && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Search className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      {showSuggestions[index] && companySuggestions.length > 0 && (
                        <div 
                          ref={(el) => { suggestionsRef.current[index] = el; }}
                          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                          {companySuggestions.map((suggestion, sugIndex) => (
                            <button
                              key={sugIndex}
                              type="button"
                              onClick={() => handleCompanySelect(index, suggestion.name)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                            >
                              {suggestion.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <MonthPicker
                        value={experience.startDate}
                        onChange={(value) => updateExperience(index, 'startDate', value)}
                        placeholder="Sélectionner un mois"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                        End Date
                      </label>
                      <MonthPicker
                        value={experience.endDate}
                        onChange={(value) => updateExperience(index, 'endDate', value)}
                        disabled={experience.current}
                        placeholder="Sélectionner un mois"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={experience.current || false}
                          onChange={(e) => toggleCurrentPosition(index, e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <span>Current Position</span>
                      </label>
                    </div>
                  </div>

                  {/* Industry, Contract Type, Location */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                        Industry
                      </label>
                      <select
                        value={experience.industry}
                        onChange={(e) => updateExperience(index, 'industry', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      >
                        <option value="">Select industry</option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                        Contract Type
                      </label>
                      <select
                        value={experience.contractType}
                        onChange={(e) => updateExperience(index, 'contractType', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      >
                        <option value="">Select type</option>
                        {contractTypes.map((type) => (
                          <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                        Location
                      </label>
                      <input
                        type="text"
                        value={experience.location}
                        onChange={(e) => updateExperience(index, 'location', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="e.g., Paris, France"
                      />
                    </div>
                  </div>

                  {/* Responsibilities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                      Key Responsibilities
                    </label>
                    {experience.responsibilities.map((resp, respIndex) => (
                      <div key={respIndex} className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={resp}
                          onChange={(e) => updateResponsibility(index, respIndex, e.target.value)}
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          placeholder="e.g., Led product strategy for mobile apps"
                        />
                        <button
                          onClick={() => removeResponsibility(index, respIndex)}
                          className="text-red-500 hover:text-red-700 px-2"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addResponsibility(index)}
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Responsibility
                    </button>
                  </div>

                  {/* Achievements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                      Key Achievements (Optional - with metrics if possible)
                    </label>
                    {experience.achievements.map((ach, achIndex) => (
                      <div key={achIndex} className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={ach}
                          onChange={(e) => updateAchievement(index, achIndex, e.target.value)}
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          placeholder="e.g., Increased revenue by 30% in Q2"
                        />
                        <button
                          onClick={() => removeAchievement(index, achIndex)}
                          className="text-red-500 hover:text-red-700 px-2"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addAchievement(index)}
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Achievement
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mode Lecture - Design moderne et visuel */}
                  <div className="space-y-3">
                    {/* Header avec Logo et Info principale */}
                    <div className="flex items-start gap-3">
                      {/* Logo de l'entreprise - Plus compact */}
                      <div className="flex-shrink-0">
                        {experience.companyLogo ? (
                          <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-700 p-1.5 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center">
                            <img 
                              src={experience.companyLogo} 
                              alt={experience.company}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md flex items-center justify-center text-white font-bold text-sm">${experience.company?.charAt(0)?.toUpperCase() || '?'}</div>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                            {experience.company?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      
                      {/* Titre et Company */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                          {experience.title || '—'}
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1.5">
                          {experience.company || '—'}
                        </p>
                        
                        {/* Dates et Location - Compact */}
                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-600 dark:text-gray-400">
                          {experience.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {new Date(experience.startDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                {experience.current || experience.endDate ? ' - ' : ''}
                                {experience.current 
                                  ? 'Current' 
                                  : experience.endDate 
                                    ? new Date(experience.endDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                    : ''}
                              </span>
                            </div>
                          )}
                          {experience.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{experience.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tags pour Industry et Contract Type - Compact */}
                    {(experience.industry || experience.contractType || experience.current) && (
                      <div className="flex flex-wrap gap-1.5">
                        {experience.industry && (
                          <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-md text-xs font-medium">
                            {experience.industry}
                          </span>
                        )}
                        {experience.contractType && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium">
                            {contractTypes.find(t => t.id === experience.contractType)?.label || experience.contractType}
                          </span>
                        )}
                        {experience.current && (
                          <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md text-xs font-medium">
                            Current
                          </span>
                        )}
                      </div>
                    )}

                    {/* Responsibilities - Compact */}
                    {experience.responsibilities.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5 uppercase tracking-wide">
                          Responsibilities
                        </p>
                        <ul className="space-y-1">
                          {experience.responsibilities.map((resp, respIndex) => (
                            <li key={respIndex} className="flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                              <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                              <span className="flex-1">{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Achievements - Compact */}
                    {experience.achievements.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5 uppercase tracking-wide">
                          Achievements
                        </p>
                        <ul className="space-y-1">
                          {experience.achievements.map((ach, achIndex) => (
                            <li key={achIndex} className="flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                              <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                              <span className="flex-1">{ach}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )})
        )}
      </div>
    </section>
  );
};

export default ProfessionalHistorySection;


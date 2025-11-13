import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
import MonthPicker from '../../ui/MonthPicker';

interface ExperienceStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

const ExperienceStep = ({ data, onUpdate }: ExperienceStepProps) => {
  const [experiences, setExperiences] = useState(data.professionalHistory || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExperience, setNewExperience] = useState({
    title: '',
    company: '',
    companyLogo: '',
    startDate: '',
    endDate: '',
    current: false,
    industry: '',
    contractType: '',
    location: '',
    responsibilities: [] as string[],
    achievements: [] as string[]
  });
  const [loadingLogo, setLoadingLogo] = useState(false);
  const logoFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour récupérer le logo d'une entreprise
  const fetchCompanyLogo = async (companyName: string): Promise<string | null> => {
    if (!companyName || companyName.trim().length < 2) return null;
    
    try {
      let cleanName = companyName.trim()
        .replace(/[^a-zA-Z0-9\s&.-]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();
      
      const companyMappings: { [key: string]: string } = {
        'meta': 'meta.com', 'facebook': 'facebook.com', 'google': 'google.com',
        'microsoft': 'microsoft.com', 'apple': 'apple.com', 'amazon': 'amazon.com',
        'netflix': 'netflix.com', 'tesla': 'tesla.com', 'adobe': 'adobe.com',
        'salesforce': 'salesforce.com', 'oracle': 'oracle.com', 'ibm': 'ibm.com',
        'intel': 'intel.com', 'nvidia': 'nvidia.com', 'spotify': 'spotify.com',
        'uber': 'uber.com', 'airbnb': 'airbnb.com', 'linkedin': 'linkedin.com',
        'twitter': 'twitter.com', 'x': 'x.com', 'github': 'github.com',
        'stripe': 'stripe.com', 'shopify': 'shopify.com', 'atlassian': 'atlassian.com',
        'slack': 'slack.com', 'zoom': 'zoom.us', 'dropbox': 'dropbox.com',
        'paypal': 'paypal.com', 'danone': 'danone.com'
      };
      
      // Fonction helper pour vérifier un logo via le proxy
      const checkLogoViaProxy = async (domain: string): Promise<string | null> => {
        try {
          // Utiliser le proxy local en développement, ou directement en production
          const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const apiUrl = isDevelopment 
            ? `http://localhost:3000/api/company-logo?domain=${encodeURIComponent(domain)}`
            : `/api/company-logo?domain=${encodeURIComponent(domain)}`;
          
          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.logoUrl) {
              return data.logoUrl;
            }
          }
          return null;
        } catch (e) {
          console.warn(`Failed to fetch logo for ${domain}:`, e);
          return null;
        }
      };
      
      const mappedDomain = companyMappings[cleanName];
      if (mappedDomain) {
        const logoUrl = await checkLogoViaProxy(mappedDomain);
        if (logoUrl) return logoUrl;
      }
      
      const words = cleanName.split(' ').filter(w => w.length > 0);
      const possibleDomains = [
        `${words.join('')}.com`, `${words[0]}.com`, `${words.join('-')}.com`,
        `${words.join('')}.io`, `${words[0]}.io`
      ];
      
      for (const domain of possibleDomains) {
        const logoUrl = await checkLogoViaProxy(domain);
        if (logoUrl) return logoUrl;
      }
    } catch (error) {
      console.error('Error fetching company logo:', error);
    }
    return null;
  };

  useEffect(() => {
    // Normaliser les données pour s'assurer que responsibilities et achievements sont des arrays
    const normalizedHistory = (data.professionalHistory || []).map((exp: any) => ({
      ...exp,
      responsibilities: Array.isArray(exp.responsibilities) 
        ? exp.responsibilities 
        : (exp.responsibilities && typeof exp.responsibilities === 'string' ? [exp.responsibilities] : []),
      achievements: Array.isArray(exp.achievements) 
        ? exp.achievements 
        : (exp.achievements && typeof exp.achievements === 'string' ? [exp.achievements] : []),
      companyLogo: exp.companyLogo || ''
    }));
    setExperiences(normalizedHistory);
  }, [data]);

  // Nettoyer le timeout lors du démontage
  useEffect(() => {
    return () => {
      if (logoFetchTimeoutRef.current) {
        clearTimeout(logoFetchTimeoutRef.current);
      }
    };
  }, []);

  const addExperience = async () => {
    if (newExperience.title && newExperience.company && newExperience.startDate) {
      // Utiliser le logo déjà récupéré ou le récupérer si nécessaire
      let companyLogo = newExperience.companyLogo || '';
      if (!companyLogo && newExperience.company) {
        const logo = await fetchCompanyLogo(newExperience.company);
        if (logo) companyLogo = logo;
      }
      
      // S'assurer que responsibilities et achievements sont des arrays
      const experienceToAdd = {
        ...newExperience,
        companyLogo,
        responsibilities: Array.isArray(newExperience.responsibilities) 
          ? newExperience.responsibilities 
          : (newExperience.responsibilities ? [newExperience.responsibilities] : []),
        achievements: Array.isArray(newExperience.achievements) 
          ? newExperience.achievements 
          : (newExperience.achievements ? [newExperience.achievements] : [])
      };
      
      const updated = [...experiences, experienceToAdd];
      setExperiences(updated);
      onUpdate({ professionalHistory: updated });
      setNewExperience({
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
      });
      setShowAddForm(false);
    }
  };

  const removeExperience = (index: number) => {
    const updated = experiences.filter((_: any, i: number) => i !== index);
    setExperiences(updated);
    onUpdate({ professionalHistory: updated });
  };

  return (
    <div className="space-y-6">
      {/* Liste des expériences */}
      {!showAddForm && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {experiences.map((exp: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
              className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden isolate"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0">
                    {exp.companyLogo ? (
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-700 p-1.5 border-2 border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center">
                        <img 
                          src={exp.companyLogo} 
                          alt={exp.company}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">${exp.company?.charAt(0)?.toUpperCase() || '?'}</div>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                        {exp.company?.charAt(0)?.toUpperCase() || <Briefcase className="w-6 h-6" />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                      {exp.title}
                    </h3>
                    <p className="text-purple-600 dark:text-purple-400 font-semibold mb-2">
                      {exp.company}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'N/A'}
                    </p>
                    {exp.location && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        📍 {exp.location}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeExperience(index)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}

          {experiences.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No experience added</p>
            </div>
          )}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showAddForm ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-purple-300 dark:border-purple-700 max-w-2xl mx-auto"
        >
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
            Add Experience
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Position *
              </label>
              <input
                type="text"
                value={newExperience.title}
                onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                placeholder="e.g., Product Manager"
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Company *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newExperience.company}
                  onChange={(e) => {
                    const companyValue = e.target.value;
                    setNewExperience({ ...newExperience, company: companyValue });
                    
                    // Annuler le timeout précédent
                    if (logoFetchTimeoutRef.current) {
                      clearTimeout(logoFetchTimeoutRef.current);
                    }
                    
                    // Récupérer le logo après un délai (debounce)
                    if (companyValue && companyValue.trim().length > 0) {
                      setLoadingLogo(true);
                      logoFetchTimeoutRef.current = setTimeout(async () => {
                        const logo = await fetchCompanyLogo(companyValue.trim());
                        if (logo) {
                          setNewExperience(prev => ({ ...prev, companyLogo: logo }));
                        } else {
                          setNewExperience(prev => ({ ...prev, companyLogo: '' }));
                        }
                        setLoadingLogo(false);
                      }, 1500);
                    } else {
                      setNewExperience(prev => ({ ...prev, companyLogo: '' }));
                      setLoadingLogo(false);
                    }
                  }}
                  placeholder="e.g., Google"
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                />
                {loadingLogo && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Start Date *
                </label>
                <MonthPicker
                  value={newExperience.startDate}
                  onChange={(value) => setNewExperience({ ...newExperience, startDate: value })}
                  placeholder="Sélectionner un mois"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  End Date
                </label>
                <MonthPicker
                  value={newExperience.endDate}
                  onChange={(value) => setNewExperience({ ...newExperience, endDate: value })}
                  disabled={newExperience.current}
                  placeholder="Sélectionner un mois"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="current"
                checked={newExperience.current}
                onChange={(e) => setNewExperience({ ...newExperience, current: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="current" className="text-sm text-gray-700 dark:text-gray-200">
                Current Position
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <motion.button
                onClick={addExperience}
                whileHover={{ scale: 1.02 }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
              >
                Add
              </motion.button>
              <motion.button
                onClick={() => setShowAddForm(false)}
                whileHover={{ scale: 1.02 }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.button
          onClick={() => setShowAddForm(true)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          className="w-full max-w-2xl mx-auto p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-purple-500 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Experience</span>
        </motion.button>
      )}
    </div>
  );
};

export default ExperienceStep;


import { useState, useEffect } from 'react';
import { Briefcase, Plus, X, RotateCcw, Calculator } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface SectionProps {
  onUpdate: (data: any) => void;
}

// Fonction pour calculer les années d'expérience depuis professionalHistory
const calculateYearsOfExperience = (history: Array<{
  startDate: string;
  endDate: string;
  current: boolean;
}>): number => {
  if (!history || history.length === 0) return 0;
  
  let totalMonths = 0;
  const now = new Date();
  
  history.forEach(exp => {
    if (!exp.startDate) return;
    
    // Parse date in YYYY-MM format
    const startParts = exp.startDate.split('-');
    if (startParts.length !== 2) return;
    
    const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, 1);
    let end: Date;
    
    if (exp.current || !exp.endDate) {
      end = now;
    } else {
      const endParts = exp.endDate.split('-');
      if (endParts.length !== 2) return;
      end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, 1);
    }
    
    if (end >= start) {
      const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                    (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }
  });
  
  return Math.round(totalMonths / 12);
};

const ExperienceExpertiseSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [calculatedYears, setCalculatedYears] = useState<number | null>(null);
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  
  const [formData, setFormData] = useState({
    yearsOfExperience: '',
    skills: [] as string[],
    tools: [] as string[],
    certifications: [] as Array<{
      name: string;
      issuer: string;
      year: string;
    }>
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Calculer les années depuis professionalHistory
          const professionalHistory = userData.professionalHistory || [];
          const calculated = calculateYearsOfExperience(professionalHistory);
          setCalculatedYears(calculated);
          
          // Utiliser la valeur calculée si aucune valeur manuelle n'existe
          const yearsValue = userData.yearsOfExperience || (calculated > 0 ? calculated.toString() : '');
          const wasManuallyEdited = userData.yearsOfExperience && 
            userData.yearsOfExperience !== calculated.toString();
          
          const newFormData = {
            yearsOfExperience: yearsValue,
            skills: userData.skills || [],
            tools: userData.tools || [],
            certifications: userData.certifications || []
          };
          
          setFormData(newFormData);
          setIsManuallyEdited(wasManuallyEdited);
          onUpdate(newFormData);
        }
      } catch (error) {
        console.error('Error loading experience data:', error);
        toast.error('Failed to load experience data');
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
    
    // Marquer comme modifié manuellement si c'est yearsOfExperience
    if (field === 'yearsOfExperience') {
      setIsManuallyEdited(value !== calculatedYears?.toString() && value !== '');
    }
    
    onUpdate(newFormData);
  };
  
  const handleResetToCalculated = () => {
    if (calculatedYears !== null) {
      const newFormData = {
        ...formData,
        yearsOfExperience: calculatedYears.toString()
      };
      setFormData(newFormData);
      setIsManuallyEdited(false);
      onUpdate(newFormData);
      toast.success('Reset to calculated value');
    }
  };

  const [newSkill, setNewSkill] = useState('');
  const [newTool, setNewTool] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      handleChange('skills', [...formData.skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleAddTool = () => {
    if (newTool.trim() && !formData.tools.includes(newTool.trim())) {
      handleChange('tools', [...formData.tools, newTool.trim()]);
      setNewTool('');
    }
  };

  return (
    <section id="experience" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="space-y-6">
        {/* Years of Experience - Hybrid: Auto-calculated + Manual override */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Years of Experience
            </label>
            {isManuallyEdited && calculatedYears !== null && (
              <button
                onClick={handleResetToCalculated}
                className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                title="Reset to calculated value"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Use calculated ({calculatedYears} years)
              </button>
            )}
          </div>
          
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={formData.yearsOfExperience}
              onChange={(e) => handleChange('yearsOfExperience', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                isManuallyEdited && calculatedYears !== null && formData.yearsOfExperience !== calculatedYears.toString()
                  ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              } text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent`}
              placeholder={calculatedYears !== null ? `Calculated: ${calculatedYears} years` : 'Enter years of experience'}
            />
            {calculatedYears !== null && !isManuallyEdited && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Calculator className="w-4 h-4" />
                <span>Auto</span>
              </div>
            )}
          </div>
          
          <div className="mt-1.5 flex items-start gap-1.5">
            {calculatedYears !== null && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                {isManuallyEdited ? (
                  <span>
                    Calculated from your professional history: <span className="font-medium">{calculatedYears} years</span>
                  </span>
                ) : (
                  <span>
                    Automatically calculated from your professional history. You can edit this value manually if needed.
                  </span>
                )}
              </p>
            )}
            {calculatedYears === null && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter your years of experience. This will be calculated automatically once you add work experiences.
              </p>
            )}
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Skills
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Add a skill"
            />
            <button
              onClick={handleAddSkill}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full flex items-center gap-2"
              >
                {skill}
                <button
                  onClick={() => handleChange('skills', formData.skills.filter((_, i) => i !== index))}
                  className="hover:text-purple-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Tools & Technologies
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTool}
              onChange={(e) => setNewTool(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTool()}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Add a tool"
            />
            <button
              onClick={handleAddTool}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tools.map((tool, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full flex items-center gap-2"
              >
                {tool}
                <button
                  onClick={() => handleChange('tools', formData.tools.filter((_, i) => i !== index))}
                  className="hover:text-purple-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Certifications
            </label>
            <button
              onClick={() => handleChange('certifications', [...formData.certifications, { name: '', issuer: '', year: '' }])}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              + Add Certification
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.certifications.map((cert, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <input
                  type="text"
                  value={cert.name}
                  onChange={(e) => {
                    const newCerts = [...formData.certifications];
                    newCerts[index].name = e.target.value;
                    handleChange('certifications', newCerts);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Certification name"
                />
                <input
                  type="text"
                  value={cert.issuer}
                  onChange={(e) => {
                    const newCerts = [...formData.certifications];
                    newCerts[index].issuer = e.target.value;
                    handleChange('certifications', newCerts);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Issuing organization"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cert.year}
                    onChange={(e) => {
                      const newCerts = [...formData.certifications];
                      newCerts[index].year = e.target.value;
                      handleChange('certifications', newCerts);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Year"
                  />
                  {index > 0 && (
                    <button
                      onClick={() => {
                        const newCerts = formData.certifications.filter((_, i) => i !== index);
                        handleChange('certifications', newCerts);
                      }}
                      className="text-red-500 hover:text-red-600 px-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceExpertiseSection; 
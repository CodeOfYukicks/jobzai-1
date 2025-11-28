import { useState, useEffect } from 'react';
import { RotateCcw, Calculator, Award, Wrench, Sparkles } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PremiumInput, 
  PremiumTagInput, 
  PremiumAddButton,
  PremiumLabel,
  SectionDivider,
  FieldGroup
} from '../profile/ui';

interface SectionProps {
  onUpdate: (data: any) => void;
}

// Calculate years of experience from professional history
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
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }
    
    // Use onSnapshot to listen for real-time updates (e.g., from CV import)
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          
          const professionalHistory = userData.professionalHistory || [];
          const calculated = calculateYearsOfExperience(professionalHistory);
          setCalculatedYears(calculated);
          
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
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading experience data:', error);
        toast.error('Failed to load experience data');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleChange = (field: string, value: any) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    
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

  const handleAddCertification = () => {
    handleChange('certifications', [...formData.certifications, { name: '', issuer: '', year: '' }]);
  };

  const handleRemoveCertification = (index: number) => {
    handleChange('certifications', formData.certifications.filter((_, i) => i !== index));
  };

  const handleCertificationChange = (index: number, field: string, value: string) => {
    const newCerts = [...formData.certifications];
    newCerts[index] = { ...newCerts[index], [field]: value };
    handleChange('certifications', newCerts);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  return (
    <FieldGroup className="space-y-8">
      {/* Years of Experience */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <PremiumLabel>Years of Experience</PremiumLabel>
          {isManuallyEdited && calculatedYears !== null && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleResetToCalculated}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Use calculated ({calculatedYears} yrs)
            </motion.button>
          )}
        </div>
        
        <div className="relative">
          <PremiumInput
            type="number"
            min={0}
            max={50}
            value={formData.yearsOfExperience}
            onChange={(e) => handleChange('yearsOfExperience', e.target.value)}
            placeholder={calculatedYears !== null ? `Auto: ${calculatedYears} years` : 'Enter years'}
            className={isManuallyEdited && calculatedYears !== null 
              ? 'border-amber-200 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-900/10' 
              : ''
            }
          />
          {calculatedYears !== null && !isManuallyEdited && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Auto</span>
            </div>
          )}
        </div>
        
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {calculatedYears !== null 
            ? isManuallyEdited 
              ? `Calculated: ${calculatedYears} years from work history`
              : 'Calculated from your work history. Edit to override.'
            : 'Add work experience to auto-calculate.'
          }
        </p>
      </div>

      <SectionDivider />

      {/* Skills */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-gray-400" />
          <PremiumLabel className="mb-0">Skills</PremiumLabel>
        </div>
        <PremiumTagInput
          tags={formData.skills}
          onChange={(tags) => handleChange('skills', tags)}
          placeholder="Add skills (e.g., Leadership, Strategic Planning)"
          suggestions={[
            'Project Management', 'Leadership', 'Strategic Planning', 
            'Data Analysis', 'Communication', 'Problem Solving',
            'Team Building', 'Agile', 'Scrum', 'Negotiation'
          ]}
        />
      </div>

      {/* Tools & Technologies */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-4 h-4 text-gray-400" />
          <PremiumLabel className="mb-0">Tools & Technologies</PremiumLabel>
        </div>
        <PremiumTagInput
          tags={formData.tools}
          onChange={(tags) => handleChange('tools', tags)}
          placeholder="Add tools (e.g., Figma, Jira, Python)"
          suggestions={[
            'Python', 'JavaScript', 'React', 'Node.js', 'AWS',
            'Figma', 'Sketch', 'Jira', 'Notion', 'Slack',
            'SQL', 'Excel', 'Tableau', 'Google Analytics'
          ]}
        />
      </div>

      <SectionDivider />

      {/* Certifications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-gray-400" />
            <PremiumLabel className="mb-0">Certifications</PremiumLabel>
          </div>
          <PremiumAddButton onClick={handleAddCertification} label="Add" />
        </div>
        
        <AnimatePresence mode="popLayout">
          {formData.certifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-400 dark:text-gray-500"
            >
              <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No certifications added yet</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {formData.certifications.map((cert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                  className="group p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                      placeholder="Certification name"
                      className="px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200/80 dark:border-gray-600/50 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
                    />
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => handleCertificationChange(index, 'issuer', e.target.value)}
                      placeholder="Issuing organization"
                      className="px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200/80 dark:border-gray-600/50 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cert.year}
                        onChange={(e) => handleCertificationChange(index, 'year', e.target.value)}
                        placeholder="Year"
                        className="flex-1 px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200/80 dark:border-gray-600/50 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRemoveCertification(index)}
                        className="px-3 py-2.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </FieldGroup>
  );
};

export default ExperienceExpertiseSection;

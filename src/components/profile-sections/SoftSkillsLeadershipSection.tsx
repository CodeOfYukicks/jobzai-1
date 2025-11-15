import { useState, useEffect } from 'react';
import { Users, MessageSquare, Lightbulb, Target, Heart } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const SoftSkillsLeadershipSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    softSkills: [] as string[],
    managementExperience: {
      hasExperience: false,
      teamSize: '',
      teamType: ''
    },
    mentoringExperience: false,
    recruitingExperience: false
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            softSkills: userData.softSkills || [],
            managementExperience: userData.managementExperience || {
              hasExperience: false,
              teamSize: '',
              teamType: ''
            },
            mentoringExperience: userData.mentoringExperience || false,
            recruitingExperience: userData.recruitingExperience || false
          });
          onUpdate({
            softSkills: userData.softSkills || [],
            managementExperience: userData.managementExperience || {
              hasExperience: false,
              teamSize: '',
              teamType: ''
            },
            mentoringExperience: userData.mentoringExperience || false,
            recruitingExperience: userData.recruitingExperience || false
          });
        }
      } catch (error) {
        console.error('Error loading soft skills:', error);
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

  const softSkillsOptions = [
    { id: 'leadership', label: 'Leadership', icon: Users, description: 'Leading teams and projects' },
    { id: 'communication', label: 'Communication', icon: MessageSquare, description: 'Clear and effective communication' },
    { id: 'problem-solving', label: 'Problem Solving', icon: Lightbulb, description: 'Analytical and creative problem solving' },
    { id: 'collaboration', label: 'Collaboration', icon: Users, description: 'Working effectively in teams' },
    { id: 'adaptability', label: 'Adaptability', icon: Target, description: 'Adapting to change and uncertainty' },
    { id: 'empathy', label: 'Empathy', icon: Heart, description: 'Understanding and relating to others' },
    { id: 'time-management', label: 'Time Management', description: 'Prioritizing and managing time effectively' },
    { id: 'conflict-resolution', label: 'Conflict Resolution', description: 'Resolving disagreements constructively' },
    { id: 'negotiation', label: 'Negotiation', description: 'Negotiating agreements and deals' },
    { id: 'public-speaking', label: 'Public Speaking', description: 'Presenting to groups and audiences' }
  ];

  const teamSizes = [
    { id: '1-5', label: '1-5 people' },
    { id: '6-10', label: '6-10 people' },
    { id: '11-20', label: '11-20 people' },
    { id: '21-50', label: '21-50 people' },
    { id: '50+', label: '50+ people' }
  ];

  const teamTypes = [
    { id: 'engineering', label: 'Engineering / Technical' },
    { id: 'product', label: 'Product' },
    { id: 'design', label: 'Design' },
    { id: 'sales', label: 'Sales' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'cross-functional', label: 'Cross-functional' },
    { id: 'other', label: 'Other' }
  ];

  const toggleSoftSkill = (skillId: string) => {
    const current = formData.softSkills;
    const updated = current.includes(skillId)
      ? current.filter(id => id !== skillId)
      : [...current, skillId];
    handleChange('softSkills', updated);
  };

  const updateManagementExperience = (field: string, value: any) => {
    handleChange('managementExperience', {
      ...formData.managementExperience,
      [field]: value
    });
  };

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
    <section id="soft-skills-leadership" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Soft Skills & Leadership
        </h2>
      </div>

      <div className="space-y-6">
        {/* Soft Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Soft Skills (Select all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {softSkillsOptions.map((skill) => {
              const Icon = skill.icon || Users;
              return (
                <button
                  key={skill.id}
                  onClick={() => toggleSoftSkill(skill.id)}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-200 text-left
                    ${formData.softSkills.includes(skill.id)
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }
                  `}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 mt-0.5 ${formData.softSkills.includes(skill.id) ? 'text-purple-600' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-medium text-sm">{skill.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{skill.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Management Experience */}
        <div className="border-t dark:border-gray-700 pt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Management Experience
          </label>
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.managementExperience.hasExperience}
                onChange={(e) => updateManagementExperience('hasExperience', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span>I have management experience</span>
            </label>

            {formData.managementExperience.hasExperience && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Team Size
                  </label>
                  <select
                    value={formData.managementExperience.teamSize}
                    onChange={(e) => updateManagementExperience('teamSize', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    <option value="">Select team size</option>
                    {teamSizes.map((size) => (
                      <option key={size.id} value={size.id}>{size.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Team Type
                  </label>
                  <select
                    value={formData.managementExperience.teamType}
                    onChange={(e) => updateManagementExperience('teamType', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    <option value="">Select team type</option>
                    {teamTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mentoring & Recruiting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <input
              type="checkbox"
              checked={formData.mentoringExperience}
              onChange={(e) => handleChange('mentoringExperience', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div>
              <span className="font-medium">Mentoring / Coaching Experience</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Have you mentored or coached others?</p>
            </div>
          </label>

          <label className="flex items-center space-x-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <input
              type="checkbox"
              checked={formData.recruitingExperience}
              onChange={(e) => handleChange('recruitingExperience', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div>
              <span className="font-medium">Recruiting Experience</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Have you been involved in hiring?</p>
            </div>
          </label>
        </div>
      </div>
    </section>
  );
};

export default SoftSkillsLeadershipSection;







import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, GripVertical, Calendar, MapPin, Link,
  Wand2, TrendingUp, Target, Hash, FileText, Zap,
  ChevronDown, ChevronUp, X, Check, Award, Code, Globe, Loader2
} from 'lucide-react';
import { CVSection, CVExperience, CVEducation, CVSkill, CVCertification, CVProject, CVLanguage } from '../../types/cvEditor';
import { generateId, formatDate } from '../../lib/cvEditorUtils';
import { rewriteSection } from '../../lib/cvSectionAI';
import { toast } from 'sonner';
import DiffView from './DiffView';

interface SectionEditorProps {
  section: CVSection;
  data: any;
  onChange: (updates: any) => void;
  jobContext?: {
    jobTitle: string;
    company: string;
    jobDescription?: string;
    keywords: string[];
    strengths: string[];
    gaps: string[];
  };
  fullCV?: string;
}

// AI action buttons for each section
const AI_ACTIONS = [
  { id: 'improve', label: 'Improve with AI', icon: <Wand2 className="w-3.5 h-3.5" /> },
  { id: 'rewrite', label: 'Rewrite', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'suggest', label: 'Suggest', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'metrics', label: 'Add Metrics', icon: <Hash className="w-3.5 h-3.5" /> },
  { id: 'keywords', label: 'Keywords', icon: <Target className="w-3.5 h-3.5" /> },
  { id: 'shorten', label: 'Shorten', icon: <Zap className="w-3.5 h-3.5" /> }
];

export default function SectionEditor({ section, data, onChange, jobContext, fullCV }: SectionEditorProps) {
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [showDiff, setShowDiff] = useState(false);

  const handleAIAction = async (action: string) => {
    if (!jobContext) {
      toast.error('Job context not available. Please load from ATS analysis.');
      return;
    }

    setIsProcessingAI(true);
    setCurrentAction(action);
    
    try {
      // Get current content based on section type
      let currentContent = '';
      switch (section.type) {
        case 'summary':
          currentContent = data.summary || '';
          break;
        case 'experience':
          currentContent = data.experiences?.map((exp: CVExperience) => 
            `${exp.title} at ${exp.company}\n${exp.description}\n${exp.bullets.join('\n')}`
          ).join('\n\n') || '';
          break;
        case 'education':
          currentContent = data.education?.map((edu: CVEducation) => 
            `${edu.degree} ${edu.field ? `in ${edu.field}` : ''} at ${edu.institution}`
          ).join('\n') || '';
          break;
        case 'skills':
          currentContent = data.skills?.map((s: CVSkill) => s.name).join(', ') || '';
          break;
        case 'certifications':
          currentContent = data.certifications?.map((c: CVCertification) => 
            `${c.name} by ${c.issuer}`
          ).join('\n') || '';
          break;
        case 'projects':
          currentContent = data.projects?.map((p: CVProject) => 
            `${p.name}: ${p.description}`
          ).join('\n') || '';
          break;
        case 'languages':
          currentContent = data.languages?.map((l: CVLanguage) => 
            `${l.name} (${l.proficiency})`
          ).join(', ') || '';
          break;
        default:
          currentContent = '';
      }

      // Store original content for diff view
      setOriginalContent(currentContent);
      
      // Call the AI rewrite service
      const improvedContent = await rewriteSection({
        action: action as any,
        sectionType: section.type,
        currentContent,
        fullCV: fullCV || '',
        jobContext: {
          jobTitle: jobContext.jobTitle,
          company: jobContext.company,
          jobDescription: jobContext.jobDescription || '',
          keywords: jobContext.keywords,
          strengths: jobContext.strengths,
          gaps: jobContext.gaps
        }
      });

      setAiSuggestion(improvedContent);
      setShowDiff(true);
      toast.success('AI suggestion generated! Review and apply changes.');
    } catch (error) {
      console.error('AI action error:', error);
      toast.error('Failed to generate AI suggestion. Please try again.');
    } finally {
      setIsProcessingAI(false);
      setCurrentAction('');
    }
  };

  const renderAIActions = () => (
    <div className="flex flex-wrap gap-2 mt-3">
      {AI_ACTIONS.map(action => (
        <button
          key={action.id}
          onClick={() => handleAIAction(action.id)}
          disabled={isProcessingAI}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-300 dark:hover:border-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessingAI && currentAction === action.id ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            action.icon
          )}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );

  const renderAISuggestion = () => {
    if (!aiSuggestion) return null;

    const acceptSuggestion = () => {
      // Apply the suggestion based on section type
      switch (section.type) {
        case 'summary':
          onChange({ summary: aiSuggestion });
          break;
        case 'experience':
          // Parse and update experiences if needed
          // For now, we'll just update the first experience's description
          if (data.experiences?.length > 0) {
            const updatedExperiences = [...data.experiences];
            // Split the suggestion into paragraphs for bullets
            const lines = aiSuggestion.split('\n').filter(line => line.trim());
            updatedExperiences[0] = {
              ...updatedExperiences[0],
              description: lines[0] || updatedExperiences[0].description,
              bullets: lines.slice(1).map(line => line.replace(/^[•\-]\s*/, ''))
            };
            onChange({ experiences: updatedExperiences });
          }
          break;
        case 'skills':
          // Parse skills from comma-separated or newline-separated list
          const skills = aiSuggestion.split(/[,\n]/)
            .map(s => s.trim())
            .filter(s => s)
            .map(name => ({ id: generateId(), name, category: 'technical' }));
          onChange({ skills });
          break;
        // Add more cases as needed
        default:
          // For other sections, just update the content directly
          onChange({ [section.type]: aiSuggestion });
      }
      
      setAiSuggestion(null);
      setShowDiff(false);
      toast.success('AI suggestion applied!');
    };

    // Show diff view if enabled
    if (showDiff && originalContent && aiSuggestion) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3"
        >
          <DiffView
            original={originalContent}
            modified={aiSuggestion}
            sectionName={section.title}
            onAccept={acceptSuggestion}
            onReject={() => {
              setAiSuggestion(null);
              setShowDiff(false);
              setOriginalContent('');
            }}
          />
        </motion.div>
      );
    }

    // Regular suggestion view (fallback)
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                AI Suggestion
              </span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {aiSuggestion}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={acceptSuggestion}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              title="Accept suggestion"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setAiSuggestion(null);
                setShowDiff(false);
                setOriginalContent('');
              }}
              className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-lg transition-colors"
              title="Reject suggestion"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render different editors based on section type
  switch (section.type) {
    case 'personal':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={data.firstName || ''}
                onChange={(e) => onChange({ firstName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all overflow-hidden text-ellipsis"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={data.lastName || ''}
                onChange={(e) => onChange({ lastName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all overflow-hidden text-ellipsis"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Professional Title
            </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => onChange({ title: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all overflow-hidden text-ellipsis"
                placeholder="Senior Software Engineer"
              />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => onChange({ email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all overflow-hidden text-ellipsis"
                placeholder="john.doe@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={data.phone || ''}
                onChange={(e) => onChange({ phone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all overflow-hidden text-ellipsis"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
              <input
                type="text"
                value={data.location || ''}
                onChange={(e) => onChange({ location: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all overflow-hidden text-ellipsis"
                placeholder="San Francisco, CA"
              />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              LinkedIn
            </label>
              <input
                type="url"
                value={data.linkedin || ''}
                onChange={(e) => onChange({ linkedin: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all overflow-hidden text-ellipsis"
                placeholder="linkedin.com/in/johndoe"
              />
          </div>
        </div>
      );

    case 'summary':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Professional Summary
            </label>
            <textarea
              value={data.summary || ''}
              onChange={(e) => onChange({ summary: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Write a compelling summary that highlights your key strengths and career objectives..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {data.summary?.length || 0} characters
            </p>
          </div>
          {renderAIActions()}
          {renderAISuggestion()}
        </div>
      );

    case 'experience':
      return (
        <div className="space-y-4">
          {data.experiences?.map((exp: CVExperience, index: number) => (
            <ExperienceItem
              key={exp.id}
              experience={exp}
              onUpdate={(updates) => {
                const newExperiences = [...data.experiences];
                newExperiences[index] = { ...exp, ...updates };
                onChange({ experiences: newExperiences });
              }}
              onDelete={() => {
                const newExperiences = data.experiences.filter((e: CVExperience) => e.id !== exp.id);
                onChange({ experiences: newExperiences });
              }}
            />
          ))}
          
          <button
            onClick={() => {
              const newExperience: CVExperience = {
                id: generateId(),
                title: '',
                company: '',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                description: '',
                bullets: []
              };
              onChange({ experiences: [...(data.experiences || []), newExperience] });
            }}
            className="w-full py-2 px-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-dashed border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Experience</span>
          </button>

          {renderAIActions()}
          {renderAISuggestion()}
        </div>
      );

    case 'education':
      return (
        <div className="space-y-4">
          {data.education?.map((edu: CVEducation, index: number) => (
            <EducationItem
              key={edu.id}
              education={edu}
              onUpdate={(updates) => {
                const newEducation = [...data.education];
                newEducation[index] = { ...edu, ...updates };
                onChange({ education: newEducation });
              }}
              onDelete={() => {
                const newEducation = data.education.filter((e: CVEducation) => e.id !== edu.id);
                onChange({ education: newEducation });
              }}
            />
          ))}
          
          <button
            onClick={() => {
              const newEducation: CVEducation = {
                id: generateId(),
                degree: '',
                field: '',
                institution: '',
                location: '',
                endDate: '',
                gpa: '',
                honors: [],
                coursework: []
              };
              onChange({ education: [...(data.education || []), newEducation] });
            }}
            className="w-full py-2 px-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-dashed border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Education</span>
          </button>

          {renderAIActions()}
          {renderAISuggestion()}
        </div>
      );

    case 'skills':
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {data.skills?.map((skill: CVSkill) => (
              <SkillChip
                key={skill.id}
                skill={skill}
                onDelete={() => {
                  const newSkills = data.skills.filter((s: CVSkill) => s.id !== skill.id);
                  onChange({ skills: newSkills });
                }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a skill..."
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  if (input.value.trim()) {
                    const newSkill: CVSkill = {
                      id: generateId(),
                      name: input.value.trim(),
                      category: 'technical'
                    };
                    onChange({ skills: [...(data.skills || []), newSkill] });
                    input.value = '';
                  }
                }
              }}
            />
            <button
              onClick={() => {
                // TODO: Open skill suggestions
              }}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {renderAIActions()}
          {renderAISuggestion()}
        </div>
      );

    case 'certifications':
      return (
        <div className="space-y-4">
          {data.certifications?.map((cert: CVCertification, index: number) => (
            <CertificationItem
              key={cert.id}
              certification={cert}
              onUpdate={(updates) => {
                const newCertifications = [...data.certifications];
                newCertifications[index] = { ...cert, ...updates };
                onChange({ certifications: newCertifications });
              }}
              onDelete={() => {
                const newCertifications = data.certifications.filter((c: CVCertification) => c.id !== cert.id);
                onChange({ certifications: newCertifications });
              }}
            />
          ))}
          
          <button
            onClick={() => {
              const newCertification: CVCertification = {
                id: generateId(),
                name: '',
                issuer: '',
                date: '',
                expiryDate: '',
                credentialId: '',
                url: ''
              };
              onChange({ certifications: [...(data.certifications || []), newCertification] });
            }}
            className="w-full py-2 px-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-dashed border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Certification</span>
          </button>

          {renderAIActions()}
          {renderAISuggestion()}
        </div>
      );

    case 'projects':
      return (
        <div className="space-y-4">
          {data.projects?.map((project: CVProject, index: number) => (
            <ProjectItem
              key={project.id}
              project={project}
              onUpdate={(updates) => {
                const newProjects = [...data.projects];
                newProjects[index] = { ...project, ...updates };
                onChange({ projects: newProjects });
              }}
              onDelete={() => {
                const newProjects = data.projects.filter((p: CVProject) => p.id !== project.id);
                onChange({ projects: newProjects });
              }}
            />
          ))}
          
          <button
            onClick={() => {
              const newProject: CVProject = {
                id: generateId(),
                name: '',
                description: '',
                technologies: [],
                url: '',
                startDate: '',
                endDate: '',
                highlights: []
              };
              onChange({ projects: [...(data.projects || []), newProject] });
            }}
            className="w-full py-2 px-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-dashed border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Project</span>
          </button>

          {renderAIActions()}
          {renderAISuggestion()}
        </div>
      );

    case 'languages':
      return (
        <div className="space-y-4">
          {data.languages?.map((language: CVLanguage, index: number) => (
            <LanguageItem
              key={language.id}
              language={language}
              onUpdate={(updates) => {
                const newLanguages = [...data.languages];
                newLanguages[index] = { ...language, ...updates };
                onChange({ languages: newLanguages });
              }}
              onDelete={() => {
                const newLanguages = data.languages.filter((l: CVLanguage) => l.id !== language.id);
                onChange({ languages: newLanguages });
              }}
            />
          ))}
          
          <button
            onClick={() => {
              const newLanguage: CVLanguage = {
                id: generateId(),
                name: '',
                proficiency: 'intermediate'
              };
              onChange({ languages: [...(data.languages || []), newLanguage] });
            }}
            className="w-full py-2 px-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-dashed border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Language</span>
          </button>

          {renderAIActions()}
          {renderAISuggestion()}
        </div>
      );

    default:
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Section editor for "{section.type}" coming soon</p>
        </div>
      );
  }
}

// Sub-components for complex sections
function ExperienceItem({ 
  experience, 
  onUpdate, 
  onDelete 
}: { 
  experience: CVExperience; 
  onUpdate: (updates: Partial<CVExperience>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <input
              type="text"
              value={experience.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="flex-1 px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
              placeholder="Job Title"
            />
          </div>
          
          {expanded && (
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={experience.company}
                  onChange={(e) => onUpdate({ company: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Company"
                />
                <input
                  type="text"
                  value={experience.location || ''}
                  onChange={(e) => onUpdate({ location: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Location"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="month"
                  value={experience.startDate}
                  onChange={(e) => onUpdate({ startDate: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={experience.endDate}
                    onChange={(e) => onUpdate({ endDate: e.target.value })}
                    disabled={experience.current}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                  />
                  <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={experience.current}
                      onChange={(e) => onUpdate({ current: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Current
                  </label>
                </div>
              </div>

              <textarea
                value={experience.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Describe your role and responsibilities..."
              />

              {/* Bullet points */}
              <div className="space-y-2 max-w-full">
                {experience.bullets.map((bullet, index) => (
                  <div key={index} className="flex items-start gap-2 group">
                    <span className="text-gray-400 mt-2 flex-shrink-0">•</span>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const newBullets = [...experience.bullets];
                          newBullets[index] = e.target.value;
                          onUpdate({ bullets: newBullets });
                        }}
                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-0 border-b border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:border-purple-500 focus:ring-0 transition-all"
                        placeholder="Achievement or responsibility..."
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newBullets = experience.bullets.filter((_, i) => i !== index);
                        onUpdate({ bullets: newBullets });
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    onUpdate({ bullets: [...experience.bullets, ''] });
                  }}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                >
                  + Add bullet point
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete experience"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EducationItem({ 
  education, 
  onUpdate, 
  onDelete 
}: { 
  education: CVEducation; 
  onUpdate: (updates: Partial<CVEducation>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <input
              type="text"
              value={education.degree}
              onChange={(e) => onUpdate({ degree: e.target.value })}
              className="flex-1 px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
              placeholder="Degree"
            />
          </div>
          
          {expanded && (
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={education.field || ''}
                  onChange={(e) => onUpdate({ field: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Field of Study"
                />
                <input
                  type="text"
                  value={education.institution}
                  onChange={(e) => onUpdate({ institution: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Institution"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="month"
                  value={education.endDate}
                  onChange={(e) => onUpdate({ endDate: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Graduation Date"
                />
                <input
                  type="text"
                  value={education.gpa || ''}
                  onChange={(e) => onUpdate({ gpa: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="GPA (optional)"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete education"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SkillChip({ skill, onDelete }: { skill: CVSkill; onDelete: () => void }) {
  return (
    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm">
      <span>{skill.name}</span>
      <button
        onClick={onDelete}
        className="ml-1 p-0.5 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-full transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// Certification Item Component
function CertificationItem({ 
  certification, 
  onUpdate, 
  onDelete 
}: { 
  certification: CVCertification; 
  onUpdate: (updates: Partial<CVCertification>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <input
              type="text"
              value={certification.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="flex-1 px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
              placeholder="Certification Name"
            />
          </div>
          
          {expanded && (
            <div className="space-y-3 mt-3 pl-7">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={certification.issuer}
                  onChange={(e) => onUpdate({ issuer: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Issuing Organization"
                />
                <input
                  type="month"
                  value={certification.date}
                  onChange={(e) => onUpdate({ date: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Issue Date"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={certification.credentialId || ''}
                  onChange={(e) => onUpdate({ credentialId: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Credential ID (optional)"
                />
                <input
                  type="month"
                  value={certification.expiryDate || ''}
                  onChange={(e) => onUpdate({ expiryDate: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Expiry Date (optional)"
                />
              </div>

              <input
                type="url"
                value={certification.url || ''}
                onChange={(e) => onUpdate({ url: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Verification URL (optional)"
              />
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete certification"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Project Item Component
function ProjectItem({ 
  project, 
  onUpdate, 
  onDelete 
}: { 
  project: CVProject; 
  onUpdate: (updates: Partial<CVProject>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <Code className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <input
              type="text"
              value={project.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="flex-1 px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
              placeholder="Project Name"
            />
          </div>
          
          {expanded && (
            <div className="space-y-3 mt-3 pl-7">
              <textarea
                value={project.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Project description..."
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="month"
                  value={project.startDate || ''}
                  onChange={(e) => onUpdate({ startDate: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Start Date"
                />
                <input
                  type="month"
                  value={project.endDate || ''}
                  onChange={(e) => onUpdate({ endDate: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="End Date"
                />
              </div>

              <input
                type="url"
                value={project.url || ''}
                onChange={(e) => onUpdate({ url: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Project URL (optional)"
              />

              {/* Technologies */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Technologies
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {project.technologies.map((tech, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      {tech}
                      <button
                        onClick={() => {
                          const newTechs = project.technologies.filter((_, i) => i !== index);
                          onUpdate({ technologies: newTechs });
                        }}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add technology (press Enter)"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      if (input.value.trim()) {
                        onUpdate({ technologies: [...project.technologies, input.value.trim()] });
                        input.value = '';
                      }
                    }
                  }}
                />
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Key Highlights
                </label>
                {project.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-2 mb-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <input
                      type="text"
                      value={highlight}
                      onChange={(e) => {
                        const newHighlights = [...project.highlights];
                        newHighlights[index] = e.target.value;
                        onUpdate({ highlights: newHighlights });
                      }}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Highlight..."
                    />
                    <button
                      onClick={() => {
                        const newHighlights = project.highlights.filter((_, i) => i !== index);
                        onUpdate({ highlights: newHighlights });
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    onUpdate({ highlights: [...project.highlights, ''] });
                  }}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                >
                  + Add highlight
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete project"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Language Item Component
function LanguageItem({ 
  language, 
  onUpdate, 
  onDelete 
}: { 
  language: CVLanguage; 
  onUpdate: (updates: Partial<CVLanguage>) => void;
  onDelete: () => void;
}) {
  const proficiencyLevels: Array<CVLanguage['proficiency']> = ['basic', 'intermediate', 'advanced', 'fluent', 'native'];

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between gap-3">
        <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
        
        <input
          type="text"
          value={language.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Language"
        />
        
        <select
          value={language.proficiency}
          onChange={(e) => onUpdate({ proficiency: e.target.value as CVLanguage['proficiency'] })}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {proficiencyLevels.map(level => (
            <option key={level} value={level}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
        </select>

        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete language"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

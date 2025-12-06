import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Calendar, Edit3,
  Wand2, TrendingUp, Target, Hash, FileText, Zap,
  X, Check, Loader2, Sparkles
} from 'lucide-react';
import { CVSection, CVExperience, CVEducation, CVSkill, CVCertification, CVProject, CVLanguage } from '../../types/cvEditor';
import { generateId } from '../../lib/cvEditorUtils';
import { rewriteSection } from '../../lib/cvSectionAI';
import { toast } from '@/contexts/ToastContext';
import DiffView from './DiffView';
import {
  ExperienceInlineForm,
  EducationInlineForm,
  ProjectInlineForm,
  CertificationInlineForm,
  LanguageInlineForm
} from './inline-editors';
import AIEnhancePanel from './inline-editors/AIEnhancePanel';

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
  // External control for click-to-edit from preview
  externalEditItemId?: string | null;
  onExternalEditProcessed?: () => void;
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

export default function SectionEditor({ 
  section, 
  data, 
  onChange, 
  jobContext, 
  fullCV,
  externalEditItemId,
  onExternalEditProcessed
}: SectionEditorProps) {
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [showDiff, setShowDiff] = useState(false);
  
  // Inline editing state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Conversation history for AI interactions (per section type)
  const [conversationHistory, setConversationHistory] = useState<Record<string, string[]>>({});

  // Handle external edit request from preview click
  useEffect(() => {
    if (externalEditItemId) {
      setInlineEditingId(externalEditItemId);
      setIsAddingNew(false);
      onExternalEditProcessed?.();
    }
  }, [externalEditItemId, onExternalEditProcessed]);

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
    <div className="flex flex-wrap gap-2 mt-4">
      {AI_ACTIONS.map(action => (
        <button
          key={action.id}
          onClick={() => handleAIAction(action.id)}
          disabled={isProcessingAI}
          className="group flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-200 hover:shadow-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isProcessingAI && currentAction === action.id ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <span className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
              {action.icon}
            </span>
          )}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );

  const renderAISuggestion = () => {
    if (!aiSuggestion) return null;

    const acceptSuggestion = () => {
      switch (section.type) {
        case 'summary':
          onChange({ summary: aiSuggestion });
          break;
        case 'experience':
          if (data.experiences?.length > 0) {
            const updatedExperiences = [...data.experiences];
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
          const skills = aiSuggestion.split(/[,\n]/)
            .map(s => s.trim())
            .filter(s => s)
            .map(name => ({ id: generateId(), name, category: 'technical' }));
          onChange({ skills });
          break;
        default:
          onChange({ [section.type]: aiSuggestion });
      }
      
      setAiSuggestion(null);
      setShowDiff(false);
      toast.success('AI suggestion applied!');
    };

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

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/40 dark:to-gray-900/20 border border-gray-200/80 dark:border-gray-700/60 rounded-xl shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                AI Suggestion
              </span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {aiSuggestion}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={acceptSuggestion}
              className="p-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
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
              className="p-2.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200/80 dark:border-gray-700/60 rounded-lg transition-all duration-200"
              title="Reject suggestion"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Close inline form helper
  const closeInlineForm = () => {
    setInlineEditingId(null);
    setIsAddingNew(false);
  };

  // Render different editors based on section type
  switch (section.type) {
    case 'personal':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide uppercase">
                First Name
              </label>
              <input
                type="text"
                value={data.firstName || ''}
                onChange={(e) => onChange({ firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-normal focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide uppercase">
                Last Name
              </label>
              <input
                type="text"
                value={data.lastName || ''}
                onChange={(e) => onChange({ lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-normal focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide uppercase">
              Professional Title
            </label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-normal focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
              placeholder="Senior Software Engineer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide uppercase">
                Email
              </label>
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => onChange({ email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-normal focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
                placeholder="john.doe@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide uppercase">
                Phone
              </label>
              <input
                type="tel"
                value={data.phone || ''}
                onChange={(e) => onChange({ phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-normal focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide uppercase">
              Location
            </label>
            <input
              type="text"
              value={data.location || ''}
              onChange={(e) => onChange({ location: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-normal focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
              placeholder="San Francisco, CA"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide uppercase">
              LinkedIn
            </label>
            <input
              type="url"
              value={data.linkedin || ''}
              onChange={(e) => onChange({ linkedin: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-normal focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
              placeholder="linkedin.com/in/johndoe"
            />
          </div>
        </div>
      );

    case 'summary':
      return (
        <div className="space-y-4">
          {/* AI Enhancement Panel - Always show, works with or without job context */}
            <AIEnhancePanel
              sectionType="summary"
              currentContent={data.summary || ''}
              onApply={(enhancedContent) => {
                onChange({ summary: enhancedContent });
                // Don't reset history - keep it for iterative refinement
              }}
              jobContext={jobContext}
              fullCV={fullCV}
              conversationHistory={conversationHistory['summary'] || []}
              onAddToHistory={(message) => {
                setConversationHistory(prev => ({
                  ...prev,
                  summary: [...(prev.summary || []).slice(-3), message] // Keep last 3-4 messages
                }));
              }}
              onResetHistory={() => {
                setConversationHistory(prev => ({ ...prev, summary: [] }));
              }}
            />
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide uppercase">
              Professional Summary
            </label>
            <textarea
              value={data.summary || ''}
              onChange={(e) => onChange({ summary: e.target.value })}
              rows={4}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-normal focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200 resize-none"
              placeholder="Write a compelling summary that highlights your key strengths and career objectives..."
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {data.summary?.length || 0} characters
            </p>
          </div>
        </div>
      );

    case 'experience':
      return (
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {/* Show inline form for adding new experience */}
            {isAddingNew && (
              <motion.div
                key="add-new-experience"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ExperienceInlineForm
                  onSave={(experience) => {
                    onChange({ experiences: [...(data.experiences || []), experience] });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  jobContext={jobContext}
                  fullCV={fullCV}
                  conversationHistory={conversationHistory['new-experience'] || []}
                  onAddToHistory={(message) => {
                    setConversationHistory(prev => ({
                      ...prev,
                      'new-experience': [...(prev['new-experience'] || []).slice(-3), message]
                    }));
                  }}
                  onResetHistory={() => {
                    setConversationHistory(prev => ({ ...prev, 'new-experience': [] }));
                  }}
                />
              </motion.div>
            )}

            {/* Show inline form for editing existing experience */}
            {inlineEditingId && !isAddingNew && (
              <motion.div
                key={`edit-${inlineEditingId}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ExperienceInlineForm
                  initialData={data.experiences?.find((e: CVExperience) => e.id === inlineEditingId)}
                  onSave={(experience) => {
                    onChange({
                      experiences: data.experiences.map((e: CVExperience) =>
                        e.id === inlineEditingId ? experience : e
                      )
                    });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  onDelete={() => {
                    onChange({
                      experiences: data.experiences.filter((e: CVExperience) => e.id !== inlineEditingId)
                    });
                    closeInlineForm();
                    toast.success('Experience deleted');
                  }}
                  jobContext={jobContext}
                  fullCV={fullCV}
                  conversationHistory={conversationHistory[`experience-${inlineEditingId}`] || []}
                  onAddToHistory={(message) => {
                    setConversationHistory(prev => ({
                      ...prev,
                      [`experience-${inlineEditingId}`]: [...(prev[`experience-${inlineEditingId}`] || []).slice(-3), message]
                    }));
                  }}
                  onResetHistory={() => {
                    setConversationHistory(prev => ({ ...prev, [`experience-${inlineEditingId}`]: [] }));
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Experience list - hide when editing */}
          {!isAddingNew && !inlineEditingId && (
            <>
              {data.experiences?.map((exp: CVExperience) => (
                <div
                  key={exp.id}
                  className="group p-4 bg-white dark:bg-gray-800/40 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all duration-200 cursor-pointer border border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300/80 dark:hover:border-gray-600/80 shadow-sm hover:shadow-md"
                  onClick={() => setInlineEditingId(exp.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {exp.title || 'Untitled Position'}
                      </h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">
                        {exp.company} {exp.location && `• ${exp.location}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {exp.startDate || 'Start'} - {exp.current ? 'Present' : exp.endDate || 'End'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInlineEditingId(exp.id);
                        }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange({ experiences: data.experiences.filter((e: CVExperience) => e.id !== exp.id) });
                        }}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 bg-white dark:bg-gray-800 text-[#5249e6] dark:text-[#a5a0ff] border-2 border-dashed border-[#635BFF]/30 dark:border-[#a5a0ff]/50 rounded-xl hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Add Experience</span>
              </button>
            </>
          )}
        </div>
      );

    case 'education':
      return (
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isAddingNew && (
              <motion.div
                key="add-new-education"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EducationInlineForm
                  onSave={(education) => {
                    onChange({ education: [...(data.education || []), education] });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                />
              </motion.div>
            )}

            {inlineEditingId && !isAddingNew && (
              <motion.div
                key={`edit-${inlineEditingId}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EducationInlineForm
                  initialData={data.education?.find((e: CVEducation) => e.id === inlineEditingId)}
                  onSave={(education) => {
                    onChange({
                      education: data.education.map((e: CVEducation) =>
                        e.id === inlineEditingId ? education : e
                      )
                    });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  onDelete={() => {
                    onChange({
                      education: data.education.filter((e: CVEducation) => e.id !== inlineEditingId)
                    });
                    closeInlineForm();
                    toast.success('Education deleted');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!isAddingNew && !inlineEditingId && (
            <>
              {data.education?.map((edu: CVEducation) => (
                <div
                  key={edu.id}
                  className="group p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 transition-all cursor-pointer border border-gray-300 dark:border-gray-600 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] shadow-sm hover:shadow-md"
                  onClick={() => setInlineEditingId(edu.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {edu.degree || 'Untitled Degree'}
                      </h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">
                        {edu.institution} {edu.field && `• ${edu.field}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {edu.endDate || 'Graduation date'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInlineEditingId(edu.id);
                        }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange({ education: data.education.filter((e: CVEducation) => e.id !== edu.id) });
                        }}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 bg-white dark:bg-gray-800 text-[#5249e6] dark:text-[#a5a0ff] border-2 border-dashed border-[#635BFF]/30 dark:border-[#a5a0ff]/50 rounded-xl hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Add Education</span>
              </button>
            </>
          )}
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
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-[#635BFF] focus:border-[#635BFF]"
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
              className="px-3 py-2 bg-[#635BFF] text-white rounded-lg hover:bg-[#5249e6] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      );

    case 'certifications':
      return (
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isAddingNew && (
              <motion.div
                key="add-new-certification"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CertificationInlineForm
                  onSave={(certification) => {
                    onChange({ certifications: [...(data.certifications || []), certification] });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                />
              </motion.div>
            )}

            {inlineEditingId && !isAddingNew && (
              <motion.div
                key={`edit-${inlineEditingId}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CertificationInlineForm
                  initialData={data.certifications?.find((c: CVCertification) => c.id === inlineEditingId)}
                  onSave={(certification) => {
                    onChange({
                      certifications: data.certifications.map((c: CVCertification) =>
                        c.id === inlineEditingId ? certification : c
                      )
                    });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  onDelete={() => {
                    onChange({
                      certifications: data.certifications.filter((c: CVCertification) => c.id !== inlineEditingId)
                    });
                    closeInlineForm();
                    toast.success('Certification deleted');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!isAddingNew && !inlineEditingId && (
            <>
              {data.certifications?.map((cert: CVCertification) => (
                <div
                  key={cert.id}
                  className="group p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 transition-all cursor-pointer border border-gray-300 dark:border-gray-600 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] shadow-sm hover:shadow-md"
                  onClick={() => setInlineEditingId(cert.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {cert.name || 'Untitled Certification'}
                      </h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">
                        {cert.issuer || 'Issuer'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {cert.date || 'Issue date'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInlineEditingId(cert.id);
                        }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange({ certifications: data.certifications.filter((c: CVCertification) => c.id !== cert.id) });
                        }}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 bg-white dark:bg-gray-800 text-[#5249e6] dark:text-[#a5a0ff] border-2 border-dashed border-[#635BFF]/30 dark:border-[#a5a0ff]/50 rounded-xl hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Add Certification</span>
              </button>
            </>
          )}
        </div>
      );

    case 'projects':
      return (
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isAddingNew && (
              <motion.div
                key="add-new-project"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ProjectInlineForm
                  onSave={(project) => {
                    onChange({ projects: [...(data.projects || []), project] });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  jobContext={jobContext}
                  fullCV={fullCV}
                  conversationHistory={conversationHistory['new-project'] || []}
                  onAddToHistory={(message) => {
                    setConversationHistory(prev => ({
                      ...prev,
                      'new-project': [...(prev['new-project'] || []).slice(-3), message]
                    }));
                  }}
                  onResetHistory={() => {
                    setConversationHistory(prev => ({ ...prev, 'new-project': [] }));
                  }}
                />
              </motion.div>
            )}

            {inlineEditingId && !isAddingNew && (
              <motion.div
                key={`edit-${inlineEditingId}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ProjectInlineForm
                  initialData={data.projects?.find((p: CVProject) => p.id === inlineEditingId)}
                  onSave={(project) => {
                    onChange({
                      projects: data.projects.map((p: CVProject) =>
                        p.id === inlineEditingId ? project : p
                      )
                    });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  onDelete={() => {
                    onChange({
                      projects: data.projects.filter((p: CVProject) => p.id !== inlineEditingId)
                    });
                    closeInlineForm();
                    toast.success('Project deleted');
                  }}
                  jobContext={jobContext}
                  fullCV={fullCV}
                  conversationHistory={conversationHistory[`project-${inlineEditingId}`] || []}
                  onAddToHistory={(message) => {
                    setConversationHistory(prev => ({
                      ...prev,
                      [`project-${inlineEditingId}`]: [...(prev[`project-${inlineEditingId}`] || []).slice(-3), message]
                    }));
                  }}
                  onResetHistory={() => {
                    setConversationHistory(prev => ({ ...prev, [`project-${inlineEditingId}`]: [] }));
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!isAddingNew && !inlineEditingId && (
            <>
              {data.projects?.map((project: CVProject) => (
                <div
                  key={project.id}
                  className="group p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 transition-all cursor-pointer border border-gray-300 dark:border-gray-600 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] shadow-sm hover:shadow-md"
                  onClick={() => setInlineEditingId(project.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {project.name || 'Untitled Project'}
                      </h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2 font-medium">
                        {project.description || 'No description'}
                      </p>
                      {project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.technologies.slice(0, 3).map((tech, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 bg-[#635BFF]/10 dark:bg-[#5249e6]/30 text-[#635BFF] dark:text-[#a5a0ff] rounded">
                              {tech}
                            </span>
                          ))}
                          {project.technologies.length > 3 && (
                            <span className="text-xs px-2 py-0.5 text-gray-500">
                              +{project.technologies.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInlineEditingId(project.id);
                        }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange({ projects: data.projects.filter((p: CVProject) => p.id !== project.id) });
                        }}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 bg-white dark:bg-gray-800 text-[#5249e6] dark:text-[#a5a0ff] border-2 border-dashed border-[#635BFF]/30 dark:border-[#a5a0ff]/50 rounded-xl hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Add Project</span>
              </button>
            </>
          )}
        </div>
      );

    case 'languages':
      return (
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isAddingNew && (
              <motion.div
                key="add-new-language"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LanguageInlineForm
                  onSave={(language) => {
                    onChange({ languages: [...(data.languages || []), language] });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                />
              </motion.div>
            )}

            {inlineEditingId && !isAddingNew && (
              <motion.div
                key={`edit-${inlineEditingId}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LanguageInlineForm
                  initialData={data.languages?.find((l: CVLanguage) => l.id === inlineEditingId)}
                  onSave={(language) => {
                    onChange({
                      languages: data.languages.map((l: CVLanguage) =>
                        l.id === inlineEditingId ? language : l
                      )
                    });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  onDelete={() => {
                    onChange({
                      languages: data.languages.filter((l: CVLanguage) => l.id !== inlineEditingId)
                    });
                    closeInlineForm();
                    toast.success('Language deleted');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!isAddingNew && !inlineEditingId && (
            <>
              {data.languages?.map((language: CVLanguage) => (
                <div
                  key={language.id}
                  className="group p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 transition-all cursor-pointer border border-gray-300 dark:border-gray-600 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] shadow-sm hover:shadow-md"
                  onClick={() => setInlineEditingId(language.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {language.name || 'Untitled Language'}
                      </h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 capitalize font-medium">
                        {language.proficiency}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInlineEditingId(language.id);
                        }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange({ languages: data.languages.filter((l: CVLanguage) => l.id !== language.id) });
                        }}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 bg-white dark:bg-gray-800 text-[#5249e6] dark:text-[#a5a0ff] border-2 border-dashed border-[#635BFF]/30 dark:border-[#a5a0ff]/50 rounded-xl hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Add Language</span>
              </button>
            </>
          )}
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

// SkillChip component
function SkillChip({ skill, onDelete }: { skill: CVSkill; onDelete: () => void }) {
  return (
    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#635BFF]/5 dark:bg-[#5249e6]/20 text-[#635BFF] dark:text-[#a5a0ff] rounded-full text-sm">
      <span>{skill.name}</span>
      <button
        onClick={onDelete}
        className="ml-1 p-0.5 hover:bg-[#635BFF]/10 dark:hover:bg-[#5249e6]/30 rounded-full transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

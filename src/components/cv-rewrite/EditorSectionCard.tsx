import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, TrendingUp, Target, Minus, Plus, 
  CheckCircle, X, Loader2, ChevronDown, ChevronUp, Trash2, Sparkles 
} from 'lucide-react';
import { toast } from '@/contexts/ToastContext';

interface AIAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

const AI_ACTIONS: AIAction[] = [
  { id: 'rewrite', label: 'Rewrite', icon: <Wand2 className="w-3.5 h-3.5" />, prompt: 'rewrite_professional' },
  { id: 'improve', label: 'Improve Tone', icon: <TrendingUp className="w-3.5 h-3.5" />, prompt: 'improve_tone' },
  { id: 'metrics', label: 'Add Metrics', icon: <Target className="w-3.5 h-3.5" />, prompt: 'add_metrics' },
  { id: 'senior', label: 'Make Senior', icon: <Plus className="w-3.5 h-3.5" />, prompt: 'make_senior' },
  { id: 'keywords', label: 'Keywords', icon: <Target className="w-3.5 h-3.5" />, prompt: 'insert_keywords' },
  { id: 'shorten', label: 'Shorten', icon: <Minus className="w-3.5 h-3.5" />, prompt: 'shorten' },
];

interface CVSectionEntry {
  id: string;
  content: string;
}

interface EditorSectionCardProps {
  title: string;
  content: string;
  sectionType:
    | 'summary'
    | 'experience'
    | 'education'
    | 'skills'
    | 'certifications'
    | 'languages'
    | 'keywords'
    | 'hobbies';
  jobContext: {
    jobTitle: string;
    company: string;
    keywords: string[];
  };
  onChange: (newContent: string) => void;
  onAIAction?: (action: string, sectionType: string, currentContent: string) => Promise<string>;
  // NOUVEAU: props pour mode multi-entry
  entries?: CVSectionEntry[]; // Pour sections avec multiples entrées
  onEntryAdd?: () => void; // Callback pour ajouter une entrée
  onEntryDelete?: (id: string) => void; // Callback pour supprimer
  onEntryChange?: (id: string, content: string) => void; // Callback pour modifier
  headless?: boolean;
}

type ExperienceMeta = {
  title: string;
  company: string;
  period: string;
  body: string;
};

type EducationMeta = {
  degree: string;
  institution: string;
  period: string;
  description: string;
};

type CertificationMeta = {
  name: string;
  issuer: string;
  year: string;
  details: string;
};

type LanguageMeta = {
  language: string;
  level: string;
};

const LANGUAGE_LEVELS = ['Basic', 'Intermediate', 'Advanced', 'Fluent', 'Native'];

const getActionLabel = (actionId: string) => {
  const action = AI_ACTIONS.find(a => a.id === actionId);
  return action?.label || 'AI Toolkit';
};

const parseExperienceBlock = (block: string): ExperienceMeta => {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  let title = '';
  let company = '';
  let period = '';
  let bodyLines: string[] = [];

  if (lines.length > 0) {
    const header = lines[0].replace(/^###\s*/, '');
    const parts = header.split(' - ');
    title = (parts[0] || '').trim();
    // Préserver le format "Client (via Company)" dans company pour l'affichage dans l'éditeur
    company = parts.slice(1).join(' - ').trim();

    if (lines[1] && !lines[1].startsWith('-') && !lines[1].startsWith('###')) {
      period = lines[1];
      bodyLines = lines.slice(2);
    } else {
      bodyLines = lines.slice(1);
    }
  }

  return {
    title,
    company, // Contient "Client (via Company)" ou juste "Company"
    period,
    body: bodyLines.join('\n'),
  };
};

const buildExperienceBlock = (meta: ExperienceMeta): string => {
  const headerTitle = meta.title || 'Job Title';
  const headerCompany = meta.company ? ` - ${meta.company}` : '';
  const header = `### ${headerTitle}${headerCompany}`;
  const periodLine = meta.period ? `\n${meta.period}` : '';
  const body = meta.body ? `\n${meta.body}` : '';
  return `${header}${periodLine}${body}`.trim();
};

const parseEducationBlock = (block: string): EducationMeta => {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  const headerLine = lines.find(line => line.startsWith('###')) || lines[0] || '';
  const header = headerLine.replace(/^###\s*/, '');
  const headerParts = header.split(' - ');

  const degree = headerParts[0]?.trim() || '';
  const institution = headerParts.slice(1).join(' - ').trim();
  const period = lines.length > 1 ? lines[1] : '';
  const description = lines.slice(2).join('\n');

  return {
    degree,
    institution,
    period,
    description,
  };
};

const buildEducationBlock = (meta: EducationMeta): string => {
  const degree = meta.degree || 'Degree';
  const institution = meta.institution ? ` - ${meta.institution}` : '';
  const header = `### ${degree}${institution}`.trim();
  const periodLine = meta.period ? `\n${meta.period}` : '';
  const description = meta.description ? `\n${meta.description}` : '';
  return `${header}${periodLine}${description}`.trim();
};

const parseCertificationBlock = (block: string): CertificationMeta => {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  const headerLine = lines[0]?.replace(/^###\s*/, '') || '';
  const [name, ...issuerParts] = headerLine.split(' - ');
  const issuer = issuerParts.join(' - ').trim();
  const yearLine = lines[1] || '';
  const details = lines.slice(2).join('\n');

  return {
    name: name || '',
    issuer,
    year: yearLine,
    details,
  };
};

const buildCertificationBlock = (meta: CertificationMeta): string => {
  const name = meta.name || 'Certification';
  const issuer = meta.issuer ? ` - ${meta.issuer}` : '';
  const header = `### ${name}${issuer}`.trim();
  const yearLine = meta.year ? `\n${meta.year}` : '';
  const details = meta.details ? `\n${meta.details}` : '';
  return `${header}${yearLine}${details}`.trim();
};

const parseLanguageBlock = (block: string): LanguageMeta => {
  if (!block) {
    return { language: '', level: 'Fluent' };
  }
  const delimiter = block.includes('|') ? '|' : block.includes('-') ? '-' : ' ';
  const [languagePart, levelPart] = block.split(delimiter);
  const language = languagePart?.trim() || '';
  const level = (levelPart || '').trim() || 'Fluent';
  return {
    language,
    level,
  };
};

const buildLanguageBlock = (meta: LanguageMeta): string => {
  const language = meta.language || 'New language';
  const level = meta.level || 'Fluent';
  return `${language} | ${level}`.trim();
};

export default function EditorSectionCard({
  title,
  content,
  sectionType,
  jobContext,
  onChange,
  onAIAction,
  headless = false,
}: EditorSectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiActionContext, setAiActionContext] = useState<{ label: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [entryActionState, setEntryActionState] = useState<{ index: number; actionId: string } | null>(null);
  const [entrySuggestions, setEntrySuggestions] = useState<Record<number, { content: string; actionLabel: string }>>({});
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);
  const [openEntryMenu, setOpenEntryMenu] = useState<number | null>(null);
  const sectionMenuRef = useRef<HTMLDivElement | null>(null);
  const entryMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isExperience = sectionType === 'experience';
  const isEducation = sectionType === 'education';
  const isSkills = sectionType === 'skills';
  const isCertifications = sectionType === 'certifications';
  const isLanguages = sectionType === 'languages';
  const isHobbies = sectionType === 'hobbies';
  const supportsLocalActions = isExperience;
  const showSectionAIButton = !(
    isExperience ||
    isEducation ||
    isLanguages ||
    isCertifications
  );
  const addButtonLabel = isExperience
    ? 'Add Experience'
    : isEducation
      ? 'Add Education Entry'
      : isSkills
        ? 'Add Skill'
        : isCertifications
          ? 'Add Certification'
          : isLanguages
            ? 'Add Language'
            : null;
  
  const showAddButton = Boolean(addButtonLabel) && !isExperience && !isEducation;
  const hobbyTags = isHobbies
    ? editedContent
        .split(/[,;\n]/)
        .map(tag => tag.trim())
        .filter(Boolean)
    : [];
  const textPlaceholder = isHobbies
    ? 'Optional: interests, sports, activities'
    : `Enter your ${title.toLowerCase()} here...`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSectionMenuOpen &&
        sectionMenuRef.current &&
        !sectionMenuRef.current.contains(event.target as Node)
      ) {
        setIsSectionMenuOpen(false);
      }

      if (openEntryMenu !== null) {
        const activeMenu = entryMenuRefs.current[openEntryMenu];
        if (activeMenu && !activeMenu.contains(event.target as Node)) {
          setOpenEntryMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSectionMenuOpen, openEntryMenu]);

  useEffect(() => {
    if (!showSectionAIButton && isSectionMenuOpen) {
      setIsSectionMenuOpen(false);
    }
  }, [showSectionAIButton, isSectionMenuOpen]);

  const splitBlocks = (raw: string): string[] => {
    if (!raw.trim()) return [];
    if (isExperience || isEducation || isCertifications) {
      const parts = raw.split(/\n(?=###\s+)/).map(p => p.trim()).filter(Boolean);
      return parts.length ? parts : [raw.trim()];
    }
    if (isSkills) {
      return raw
        .split(/[,;\n]/)
        .map(s => s.trim())
        .filter(Boolean);
    }
    if (isLanguages) {
      return raw
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
    }
    return [raw];
  };

  const [blocks, setBlocks] = useState<string[]>(() => splitBlocks(content));

  useEffect(() => {
    setEditedContent(content);
    setBlocks(splitBlocks(content));
    setEntrySuggestions({});
    setAiSuggestion(null);
    setAiActionContext(null);
  }, [content, sectionType]);

  const handleAIAction = async (action: AIAction) => {
    if (!onAIAction) {
      toast.error('AI action not available');
      return;
    }

    setAiActionContext({ label: action.label });
    setIsGenerating(true);
    try {
      const result = await onAIAction(action.id, sectionType, editedContent);
      setAiSuggestion(result);
      toast.success(`${action.label} ready for review`);
    } catch (error) {
      console.error('AI action failed:', error);
      toast.error('Failed to generate suggestion');
      setAiActionContext(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEntryAIAction = async (index: number, action: AIAction) => {
    if (!onAIAction) {
      toast.error('AI action not available');
      return;
    }
    const blockContent = blocks[index];
    if (!blockContent) return;

    setEntryActionState({ index, actionId: action.id });
    try {
      const result = await onAIAction(action.id, sectionType, blockContent);
      setEntrySuggestions(prev => ({
        ...prev,
        [index]: {
          content: result,
          actionLabel: action.label,
        },
      }));
      toast.success(`${action.label} preview ready for ${title} #${index + 1}`);
    } catch (error) {
      console.error('AI entry action failed:', error);
      toast.error('Failed to update entry');
    } finally {
      setEntryActionState(null);
    }
  };

  const acceptSuggestion = () => {
    if (aiSuggestion) {
      setEditedContent(aiSuggestion);
      onChange(aiSuggestion);
      setAiSuggestion(null);
      setAiActionContext(null);
      toast.success('Changes applied!');
    }
  };

  const rejectSuggestion = () => {
    setAiSuggestion(null);
    setAiActionContext(null);
    toast.info('Suggestion discarded');
  };

  const acceptEntrySuggestion = (index: number) => {
    const suggestion = entrySuggestions[index];
    if (!suggestion) return;
    handleBlockChange(index, suggestion.content);
    setEntrySuggestions(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    toast.success('Entry updated with AI suggestion');
  };

  const discardEntrySuggestion = (index: number) => {
    setEntrySuggestions(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    toast.info('Suggestion discarded');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    onChange(e.target.value);
  };

  const updateBlocks = (newBlocks: string[]) => {
    setBlocks(newBlocks);
    let combined = newBlocks.join('\n\n');
    if (isSkills) {
      combined = newBlocks.join(', ');
    } else if (isLanguages) {
      combined = newBlocks.join('\n');
    }
    setEditedContent(combined);
    onChange(combined);
  };

  const handleBlockChange = (index: number, value: string) => {
    const updated = [...blocks];
    updated[index] = value;
    updateBlocks(updated);
  };

  const handleExperienceFieldChange = (index: number, updates: Partial<ExperienceMeta>) => {
    const current = blocks[index] || '';
    const meta = parseExperienceBlock(current);
    const merged: ExperienceMeta = { ...meta, ...updates };
    const rebuilt = buildExperienceBlock(merged);
    const updated = [...blocks];
    updated[index] = rebuilt;
    updateBlocks(updated);
  };

  const handleEducationFieldChange = (index: number, updates: Partial<EducationMeta>) => {
    const current = blocks[index] || '';
    const meta = parseEducationBlock(current);
    const merged: EducationMeta = { ...meta, ...updates };
    const rebuilt = buildEducationBlock(merged);
    const updated = [...blocks];
    updated[index] = rebuilt;
    updateBlocks(updated);
  };

  const handleLanguageFieldChange = (index: number, updates: Partial<LanguageMeta>) => {
    const current = blocks[index] || '';
    const meta = parseLanguageBlock(current);
    const merged: LanguageMeta = { ...meta, ...updates };
    const rebuilt = buildLanguageBlock(merged);
    const updated = [...blocks];
    updated[index] = rebuilt;
    updateBlocks(updated);
  };

  const handleCertificationFieldChange = (index: number, updates: Partial<CertificationMeta>) => {
    const current = blocks[index] || '';
    const meta = parseCertificationBlock(current);
    const merged: CertificationMeta = { ...meta, ...updates };
    const rebuilt = buildCertificationBlock(merged);
    const updated = [...blocks];
    updated[index] = rebuilt;
    updateBlocks(updated);
  };

  const handleAddBlock = () => {
    if (isExperience) {
      const templateMeta: ExperienceMeta = {
        title: '',
        company: '',
        period: '',
        body: '- Key achievement 1\n- Key achievement 2',
      };
      const template = buildExperienceBlock(templateMeta);
      updateBlocks([...blocks, template]);
    } else if (isEducation) {
      const template = buildEducationBlock({
        degree: '',
        institution: '',
        period: '',
        description: '- Dean’s list, GPA, honors',
      });
      updateBlocks([...blocks, template]);
    } else if (isSkills) {
      updateBlocks([...blocks, 'New skill']);
    } else if (isCertifications) {
      const template = buildCertificationBlock({
        name: '',
        issuer: '',
        year: '',
        details: '- Credential notes or specialization focus',
      });
      updateBlocks([...blocks, template]);
    } else if (isLanguages) {
      const template = buildLanguageBlock({
        language: '',
        level: 'Fluent',
      });
      updateBlocks([...blocks, template]);
    }
  };

  const handleRemoveBlock = (index: number) => {
    const updated = blocks.filter((_, i) => i !== index);
    updateBlocks(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`transition-all ${!headless ? 'bg-[#FAFAFA] dark:bg-[#1A1A1D] rounded-xl border border-gray-200/60 dark:border-gray-800 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6' : ''}`}
    >
      {/* Card Header */}
      {!headless && (
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-white dark:hover:bg-gray-700/60 rounded-lg transition-all"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                {title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {showAddButton && (
                <button
                  type="button"
                  onClick={handleAddBlock}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {addButtonLabel}
                </button>
              )}
              {showSectionAIButton && (
                <div className="relative" ref={sectionMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsSectionMenuOpen(prev => !prev)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#26262B] border border-gray-200/70 dark:border-gray-700/70 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-600 dark:hover:text-purple-300 transition-all shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>AI Toolkit</span>
                  </button>
                  <AnimatePresence>
                    {isSectionMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#111116] shadow-2xl shadow-purple-500/10 overflow-hidden z-10"
                      >
                        {AI_ACTIONS.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => {
                              setIsSectionMenuOpen(false);
                              handleAIAction(action);
                            }}
                            disabled={isGenerating}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-100 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50"
                          >
                            <span className="text-purple-500">{action.icon}</span>
                            <span>{action.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Card Content */}
      <AnimatePresence>
        {(isExpanded || headless) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              {/* AI Toolkit for Headless Mode */}
              {headless && showSectionAIButton && (
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                     {/* Spacer or helpful text */}
                  </div>
                  <div className="relative" ref={sectionMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsSectionMenuOpen(prev => !prev)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#26262B] border border-gray-200/70 dark:border-gray-700/70 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-600 dark:hover:text-purple-300 transition-all shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      <span>AI Toolkit</span>
                    </button>
                    <AnimatePresence>
                      {isSectionMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#111116] shadow-2xl shadow-purple-500/10 overflow-hidden z-50"
                        >
                          {AI_ACTIONS.map((action) => (
                            <button
                              key={action.id}
                              type="button"
                              onClick={() => {
                                setIsSectionMenuOpen(false);
                                handleAIAction(action);
                              }}
                              disabled={isGenerating}
                              className="w-full flex items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-100 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50"
                            >
                              <span className="text-purple-500">{action.icon}</span>
                              <span>{action.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* AI Suggestion Banner */}
              <AnimatePresence>
                {aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200/60 dark:border-purple-900/60 rounded-xl p-5"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3">
                          AI Suggestion
                        </p>
                        <div className="bg-white dark:bg-[#1A1A1D] rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-purple-100/60 dark:border-purple-900/60 leading-relaxed">
                          {aiSuggestion}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={acceptSuggestion}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-all shadow-sm hover:shadow-md"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept Changes
                      </button>
                      <button
                        onClick={rejectSuggestion}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                      >
                        <X className="w-4 h-4" />
                        Discard
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generating State */}
              {isGenerating && (
                <div className="mb-5 relative">
                  <div className="rounded-2xl border border-purple-300/40 dark:border-purple-900/60 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-[#14041F] dark:via-[#0A0A10] dark:to-[#12051C] px-5 py-4 shadow-[0_10px_40px_rgba(76,29,149,0.18)]">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 blur-xl bg-purple-400/40 animate-pulse rounded-full" />
                        <div className="relative w-10 h-10 rounded-full bg-white dark:bg-[#1A1A1F] border border-purple-200/60 dark:border-purple-800 flex items-center justify-center shadow-lg">
                          <Loader2 className="w-4 h-4 text-purple-600 dark:text-purple-300 animate-spin" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 tracking-wide">
                          Polishing with AI {aiActionContext?.label ? `(${aiActionContext.label})` : ''}
                        </p>
                        <p className="text-xs text-purple-900/70 dark:text-purple-200/70">
                          Your original content stays untouched until you confirm the changes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Editable Content */}
              <div className="relative">
                {/* Block-based editors for experience, education and skills */}
                {(isExperience || isEducation || isSkills || isCertifications || isLanguages) ? (
                  <div className="space-y-4">
                    {blocks.map((block, index) => {
                      const experienceMeta = isExperience ? parseExperienceBlock(block) : null;
                      const educationMeta = isEducation ? parseEducationBlock(block) : null;
                      const certificationMeta = isCertifications ? parseCertificationBlock(block) : null;
                      const languageMeta = isLanguages ? parseLanguageBlock(block) : null;
                      const entrySuggestion = entrySuggestions[index];
                      return (
                        <div
                          key={index}
                          className="group rounded-2xl border border-gray-200/70 dark:border-gray-800/80 bg-gradient-to-br from-white to-gray-50 dark:from-[#050507] dark:to-[#111118] px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.20)] transition-all relative overflow-hidden"
                        >
                          {entryActionState?.index === index && (
                            <div className="absolute inset-0 bg-white/90 dark:bg-black/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center px-6">
                              <Loader2 className="w-5 h-5 text-purple-600 dark:text-purple-300 animate-spin mb-3" />
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                Crafting {getActionLabel(entryActionState.actionId)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Entry #{index + 1} will only update once you approve the preview.
                              </p>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              {(isSkills ? 'Skill' : isEducation ? 'Education' : isLanguages ? 'Language' : 'Experience')} {blocks.length > 1 ? `#${index + 1}` : ''}
                            </span>

                            <div className="flex items-center gap-2">
                              {supportsLocalActions && (
                                <div
                                  className="relative"
                                  ref={el => {
                                    entryMenuRefs.current[index] = el;
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setOpenEntryMenu(openEntryMenu === index ? null : index)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 text-[11px] font-semibold text-gray-600 dark:text-gray-200 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-600 transition-all"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                    AI Toolkit
                                  </button>
                                  <AnimatePresence>
                                    {openEntryMenu === index && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -3 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -3 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-2 w-44 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0A0A10] shadow-xl overflow-hidden z-20"
                                      >
                                        {AI_ACTIONS.map((action) => {
                                          const isActive =
                                            entryActionState?.index === index && entryActionState?.actionId === action.id;
                                          return (
                                            <button
                                              key={action.id}
                                              type="button"
                                              onClick={() => {
                                                setOpenEntryMenu(null);
                                                handleEntryAIAction(index, action);
                                              }}
                                              disabled={isGenerating || isActive}
                                              className="w-full flex items-center gap-2 px-4 py-2 text-left text-[11px] font-semibold text-gray-700 dark:text-gray-100 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50"
                                            >
                                              {isActive ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                                              ) : (
                                                <span className="text-purple-500">{action.icon}</span>
                                              )}
                                              <span>{action.label}</span>
                                            </button>
                                          );
                                        })}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveBlock(index)}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {isSkills ? (
                            <input
                              type="text"
                              value={block}
                              onChange={(e) => handleBlockChange(index, e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                              placeholder="e.g. Salesforce, AI-first solutions, Enterprise sales"
                            />
                          ) : isExperience && experienceMeta ? (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                                    Job Title
                                  </label>
                                  <input
                                    type="text"
                                    value={experienceMeta.title}
                                    onChange={(e) => handleExperienceFieldChange(index, { title: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                    placeholder="e.g. Technology Associate Manager"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                                    Company
                                  </label>
                                  <input
                                    type="text"
                                    value={experienceMeta.company}
                                    onChange={(e) => handleExperienceFieldChange(index, { company: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                    placeholder="e.g. Accenture"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                                    Period
                                  </label>
                                  <input
                                    type="text"
                                    value={experienceMeta.period}
                                    onChange={(e) => handleExperienceFieldChange(index, { period: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                    placeholder="e.g. 2020 – Present"
                                  />
                                </div>
                              </div>
                              <textarea
                                value={experienceMeta.body}
                                onChange={(e) => handleExperienceFieldChange(index, { body: e.target.value })}
                                className="w-full p-4 rounded-xl bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                style={{ lineHeight: '1.6', minHeight: '140px' }}
                                placeholder="- Key achievement 1\n- Key achievement 2"
                              />
                            </>
                          ) : isEducation && educationMeta ? (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                                    Degree
                                  </label>
                                  <input
                                    type="text"
                                    value={educationMeta.degree}
                                    onChange={(e) => handleEducationFieldChange(index, { degree: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                    placeholder="e.g. MSc Computer Science"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                                    Institution
                                  </label>
                                  <input
                                    type="text"
                                    value={educationMeta.institution}
                                    onChange={(e) => handleEducationFieldChange(index, { institution: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                    placeholder="e.g. MIT"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-3 mb-3">
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                                    Period
                                  </label>
                                  <input
                                    type="text"
                                    value={educationMeta.period}
                                    onChange={(e) => handleEducationFieldChange(index, { period: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                    placeholder="e.g. 2017 – 2021"
                                  />
                                </div>
                              </div>
                              <textarea
                                value={educationMeta.description}
                                onChange={(e) => handleEducationFieldChange(index, { description: e.target.value })}
                                className="w-full p-4 rounded-xl bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                style={{ lineHeight: '1.6', minHeight: '120px' }}
                                placeholder="- Honors, awards, thesis, coursework"
                              />
                            </>
                          ) : isCertifications && certificationMeta ? (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                                    Certification
                                  </label>
                                  <input
                                    type="text"
                                    value={certificationMeta.name}
                                    onChange={(e) => handleCertificationFieldChange(index, { name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                    placeholder="e.g. AWS Solutions Architect"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                                    Issuer
                                  </label>
                                  <input
                                    type="text"
                                    value={certificationMeta.issuer}
                                    onChange={(e) => handleCertificationFieldChange(index, { issuer: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                    placeholder="e.g. Amazon Web Services"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                                    Year / Credential ID
                                  </label>
                                  <input
                                    type="text"
                                    value={certificationMeta.year}
                                    onChange={(e) => handleCertificationFieldChange(index, { year: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                    placeholder="e.g. 2024 · ID 12345"
                                  />
                                </div>
                              </div>
                              <textarea
                                value={certificationMeta.details}
                                onChange={(e) => handleCertificationFieldChange(index, { details: e.target.value })}
                                className="w-full p-4 rounded-xl bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                style={{ lineHeight: '1.6', minHeight: '120px' }}
                                placeholder="- Impact, specialization, or credential URL"
                              />
                            </>
                          ) : isLanguages && languageMeta ? (
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                              <div className="md:col-span-3">
                                <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                                  Language
                                </label>
                                <input
                                  type="text"
                                  value={languageMeta.language}
                                  onChange={(e) => handleLanguageFieldChange(index, { language: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                  placeholder="e.g. English"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                                  Level
                                </label>
                                <select
                                  value={languageMeta.level}
                                  onChange={(e) => handleLanguageFieldChange(index, { level: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                                >
                                  {LANGUAGE_LEVELS.map(level => (
                                    <option key={level} value={level}>
                                      {level}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ) : (
                            <textarea
                              value={block}
                              onChange={(e) => handleBlockChange(index, e.target.value)}
                              className="w-full p-4 rounded-xl bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                              style={{ lineHeight: '1.6', minHeight: isExperience ? '140px' : '120px' }}
                              placeholder={
                                isEducation
                                  ? '### Degree - Institution\nYear\n- Relevant detail'
                                  : isCertifications
                                    ? '### Certification - Issuer\nYear or ID\n- Credential details'
                                    : ''
                              }
                            />
                          )}
                          {entrySuggestion && (
                            <div className="mt-4 rounded-2xl border border-purple-200/70 dark:border-purple-900/70 bg-gradient-to-r from-purple-50/90 to-indigo-50/90 dark:from-purple-950/40 dark:to-indigo-950/40 p-4 relative z-10">
                              <div className="flex items-start gap-3 mb-3">
                                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-300 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-900 dark:text-purple-200 mb-2">
                                    {entrySuggestion.actionLabel} suggestion ready
                                  </p>
                                  <div className="bg-white dark:bg-[#0B0B0F] border border-purple-100/60 dark:border-purple-900/60 rounded-xl p-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                    {entrySuggestion.content}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => acceptEntrySuggestion(index)}
                                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all shadow-sm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Apply
                                </button>
                                <button
                                  onClick={() => discardEntrySuggestion(index)}
                                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-transparent border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                >
                                  <X className="w-4 h-4" />
                                  Keep original
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {blocks.length === 0 && (
                      <button
                        type="button"
                        onClick={handleAddBlock}
                        className="w-full border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl py-6 flex flex-col items-center justify-center text-xs text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-500 dark:hover:border-purple-500 dark:hover:text-purple-300 transition-all"
                      >
                        <Plus className="w-4 h-4 mb-1" />
                        {isSkills
                          ? 'Add your first skill'
                          : isEducation
                            ? 'Add your first education entry'
                            : isCertifications
                              ? 'Add your first certification'
                              : isLanguages
                                ? 'Add your first language'
                                : 'Add your first experience'}
                      </button>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={editedContent}
                    onChange={handleContentChange}
                    onFocus={() => setIsEditing(true)}
                    onBlur={() => setIsEditing(false)}
                    className={`w-full p-5 bg-white dark:bg-[#0A0A0B] border rounded-xl text-sm text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all ${
                      isEditing 
                        ? 'border-purple-300 dark:border-purple-700 shadow-sm' 
                        : 'border-gray-200/60 dark:border-gray-700/60'
                    }`}
                    style={{ 
                      lineHeight: '1.6',
                      minHeight: sectionType === 'summary' ? '100px' : '120px'
                    }}
                    placeholder={textPlaceholder}
                  />
                )}
                {isHobbies && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hobbyTags.length === 0 ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Separate interests with commas or line breaks to create tags.
                      </span>
                    ) : (
                      hobbyTags.map((tag, idx) => (
                        <span
                          key={`${tag}-${idx}`}
                          className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] font-semibold text-gray-600 dark:text-gray-200"
                        >
                          {tag}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Hints */}
              {sectionType === 'experience' && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 px-2">
                  <span className="text-purple-500">💡</span>
                  <span>Use strong action verbs and quantify achievements with metrics</span>
                </p>
              )}
              {sectionType === 'summary' && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 px-2">
                  <span className="text-purple-500">💡</span>
                  <span>Keep it concise (2-3 sentences) and tailored to {jobContext.jobTitle}</span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

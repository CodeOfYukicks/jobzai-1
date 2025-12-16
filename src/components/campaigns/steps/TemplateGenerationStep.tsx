import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Loader2, Edit2, Check, X, ChevronDown, Info, Mail, RefreshCw } from 'lucide-react';
import { CampaignData } from '../NewCampaignModal';
import { notify } from '@/lib/notify';
import { getAuth } from 'firebase/auth';
import MergeFieldPills from '../MergeFieldPills';

interface TemplateGenerationStepProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
  campaignId?: string;
}

interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
}

// Merge fields tooltip content
const MERGE_FIELDS = [
  { field: '{{firstName}}', desc: "Contact's first name" },
  { field: '{{lastName}}', desc: "Contact's last name" },
  { field: '{{company}}', desc: 'Company name' },
  { field: '{{position}}', desc: 'Job title/position' },
  { field: '{{location}}', desc: 'Location' },
];

export default function TemplateGenerationStep({ data, onUpdate }: TemplateGenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    data.selectedTemplate?.id || null
  );
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [showMergeFieldsTooltip, setShowMergeFieldsTooltip] = useState(false);
  
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowMergeFieldsTooltip(false);
      }
    };

    if (showMergeFieldsTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMergeFieldsTooltip]);

  // Insert merge field at cursor position
  const insertMergeFieldInSubject = (fieldName: string) => {
    const input = subjectInputRef.current;
    if (!input) {
      setEditedSubject(prev => prev + fieldName);
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const before = editedSubject.substring(0, start);
    const after = editedSubject.substring(end);

    const newText = before + fieldName + after;
    setEditedSubject(newText);

    setTimeout(() => {
      input.focus();
      const newPosition = start + fieldName.length;
      input.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertMergeFieldInBody = (fieldName: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) {
      setEditedBody(prev => prev + fieldName);
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const before = editedBody.substring(0, start);
    const after = editedBody.substring(end);

    const newText = before + fieldName + after;
    setEditedBody(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + fieldName.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Generate templates on mount if not already generated
  useEffect(() => {
    if (templates.length === 0 && !isGenerating) {
      handleGenerateTemplates();
    }
  }, []);

  // Auto-expand first template when loaded
  useEffect(() => {
    if (templates.length > 0 && !expandedTemplateId) {
      setExpandedTemplateId(templates[0].id);
    }
  }, [templates]);

  const handleGenerateTemplates = async () => {
    setIsGenerating(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      const response = await fetch(`${BACKEND_URL}/api/campaigns/generate-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tone: data.emailTone || 'casual',
          language: data.language || 'en',
          keyPoints: data.keyPoints || '',
          outreachGoal: data.outreachGoal || 'job',
          count: 3
        })
      });

      const result = await response.json();

      if (result.success && result.templates) {
        setTemplates(result.templates);
        // Auto-expand and select first template
        if (result.templates.length > 0) {
          setExpandedTemplateId(result.templates[0].id);
          handleSelectTemplate(result.templates[0]);
        }
        notify.success('Templates generated!');
      } else {
        notify.error(result.error || 'Failed to generate templates');
      }
    } catch (error) {
      console.error('Error generating templates:', error);
      notify.error('Failed to generate templates');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplateId(template.id);
    onUpdate({
      selectedTemplate: {
        id: template.id,
        subject: template.subject,
        body: template.body
      }
    });
  };

  const handleToggleExpand = (templateId: string) => {
    if (expandedTemplateId === templateId) {
      // Don't collapse if it's the only one or if editing
      if (!isEditing) {
        setExpandedTemplateId(null);
      }
    } else {
      setExpandedTemplateId(templateId);
      // Also select when expanding
      const template = templates.find(t => t.id === templateId);
      if (template) {
        handleSelectTemplate(template);
      }
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditedSubject(template.subject);
    setEditedBody(template.body);
    setIsEditing(true);
    setExpandedTemplateId(template.id);
  };

  const handleSaveEdit = () => {
    if (!selectedTemplateId) return;

    const updatedTemplate = {
      id: selectedTemplateId,
      subject: editedSubject,
      body: editedBody
    };

    // Update local templates
    setTemplates(prev => prev.map(t => 
      t.id === selectedTemplateId ? updatedTemplate : t
    ));

    // Update campaign data
    onUpdate({ selectedTemplate: updatedTemplate });
    
    setIsEditing(false);
    notify.success('Template updated!');
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Highlight merge fields in text - subtle violet styling
  const highlightMergeFields = (text: string) => {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, idx) => {
      if (part.match(/\{\{[^}]+\}\}/)) {
        return (
          <span 
            key={idx} 
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md
              bg-violet-500/10 dark:bg-violet-400/15
              text-violet-600 dark:text-violet-400
              border border-violet-200/50 dark:border-violet-500/20
              font-mono text-xs font-medium"
          >
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section - Compact */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Email Templates
            </h3>
            {/* Merge Fields Tooltip Trigger */}
            <div className="relative" ref={tooltipRef}>
              <button
                onClick={() => setShowMergeFieldsTooltip(!showMergeFieldsTooltip)}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 
                  hover:text-gray-600 dark:hover:text-gray-300 
                  hover:bg-gray-100 dark:hover:bg-white/[0.06]
                  transition-all duration-200"
                title="Available merge fields"
              >
                <Info className="w-4 h-4" />
              </button>
              
              {/* Merge Fields Tooltip */}
              <AnimatePresence>
                {showMergeFieldsTooltip && (
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
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Available Merge Fields
                    </p>
                    <div className="space-y-2">
                      {MERGE_FIELDS.map((item) => (
                        <div key={item.field} className="flex items-center justify-between gap-3">
                          <code className="px-2 py-1 rounded-md text-xs font-mono font-medium
                            bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-500/20">
                            {item.field}
                          </code>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="text-[13px] text-gray-500 dark:text-white/60 mt-1">
            AI-generated templates personalized for each contact
          </p>
        </div>

        {/* Regenerate Button */}
        {templates.length > 0 && !isEditing && (
          <button
            onClick={handleGenerateTemplates}
            disabled={isGenerating}
            className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-medium
              bg-gray-100 dark:bg-white/[0.06]
              text-gray-600 dark:text-gray-300
              border border-gray-200/80 dark:border-white/[0.08]
              hover:bg-gray-200/80 dark:hover:bg-white/[0.1]
              active:scale-[0.98]
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {isGenerating && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-14 h-14 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-white/[0.08]" />
            <div className="absolute inset-0 rounded-full border-2 border-gray-400 dark:border-gray-500 border-t-transparent animate-spin" />
            <Wand2 className="absolute inset-0 m-auto w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-[13px] text-gray-500 dark:text-white/60">
            Generating personalized templates...
          </p>
        </div>
      )}

      {/* Templates List */}
      {!isGenerating && templates.length > 0 && !isEditing && (
        <div className="space-y-3">
          {templates.map((template, index) => {
            const isSelected = selectedTemplateId === template.id;
            const isExpanded = expandedTemplateId === template.id;
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`
                  relative overflow-hidden transition-all duration-200
                  ${isSelected
                    ? 'border-l-[3px] border-l-[#b7e219] border-y border-r border-y-transparent border-r-transparent bg-white dark:bg-[#1f1f1f] shadow-lg shadow-black/[0.06] dark:shadow-black/30 ring-1 ring-black/[0.04] dark:ring-white/[0.06] rounded-xl'
                    : 'border border-gray-200/80 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-md rounded-xl'
                  }
                `}
              >
                {/* Accordion Header - Always Visible */}
                <button
                  onClick={() => handleToggleExpand(template.id)}
                  className="w-full flex items-center gap-4 p-4 text-left transition-colors duration-200"
                >
                  {/* Template Number - Always neutral */}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold flex-shrink-0
                    bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </div>

                  {/* Subject Preview */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium truncate transition-colors duration-200
                      ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}
                    `}>
                      {highlightMergeFields(template.subject)}
                    </p>
                    {!isExpanded && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate mt-0.5">
                        {template.body.substring(0, 80)}...
                      </p>
                    )}
                  </div>

                  {/* Selected Dot Indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="w-2.5 h-2.5 rounded-full bg-[#b7e219] shadow-sm flex-shrink-0"
                    />
                  )}

                  {/* Expand/Collapse Icon */}
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform duration-300
                      ${isExpanded ? 'rotate-180' : ''}
                    `} 
                  />
                </button>

                {/* Accordion Content - Collapsible */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        {/* Divider */}
                        <div className="h-px bg-gray-100 dark:bg-white/[0.06] mb-4" />

                        {/* Body Content */}
                        <div className="p-4 rounded-lg bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04]">
                          <p className="text-[12px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {highlightMergeFields(template.body)}
                          </p>
                        </div>

                        {/* Edit Button */}
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTemplate(template);
                            }}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                              bg-gray-100 dark:bg-white/[0.06]
                              text-gray-600 dark:text-gray-300
                              border border-gray-200/50 dark:border-white/[0.08]
                              hover:bg-gray-200/80 dark:hover:bg-white/[0.1]
                              active:scale-[0.98]
                              transition-all duration-200"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Mode */}
      <AnimatePresence>
        {isEditing && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Edit Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                Edit Template
              </h4>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 
                  hover:text-gray-600 dark:hover:text-gray-300 
                  hover:bg-gray-100 dark:hover:bg-white/[0.06]
                  transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subject Editor */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider mb-2">
                Subject Line
              </label>
              <MergeFieldPills onInsert={insertMergeFieldInSubject} />
              <input
                ref={subjectInputRef}
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                placeholder="Email subject..."
                className="w-full mt-2.5 px-3.5 py-2.5 text-[13px] bg-white dark:bg-[#1a1a1a] 
                  text-gray-900 dark:text-white
                  border border-gray-200 dark:border-white/[0.08]
                  rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/[0.1] focus:border-gray-300 dark:focus:border-white/[0.15]
                  placeholder-gray-400 dark:placeholder-white/30
                  transition-all duration-200"
              />
            </div>

            {/* Body Editor */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider mb-2">
                Email Body
              </label>
              <MergeFieldPills onInsert={insertMergeFieldInBody} />
              <textarea
                ref={bodyTextareaRef}
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={8}
                placeholder="Email content..."
                className="w-full mt-2.5 px-3.5 py-3 text-[13px] bg-white dark:bg-[#1a1a1a] 
                  text-gray-900 dark:text-white
                  border border-gray-200 dark:border-white/[0.08]
                  rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/[0.1] focus:border-gray-300 dark:focus:border-white/[0.15]
                  placeholder-gray-400 dark:placeholder-white/30
                  resize-none transition-all duration-200 leading-relaxed"
              />
            </div>

            {/* Actions - Refined proportions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSaveEdit}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg
                  bg-gray-900 dark:bg-white text-white dark:text-gray-900
                  hover:bg-gray-800 dark:hover:bg-gray-100
                  font-medium text-[12px] shadow-sm
                  transition-all duration-200 active:scale-[0.98]"
              >
                <Check className="w-3.5 h-3.5" />
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg text-[12px] font-medium
                  text-gray-500 dark:text-gray-400
                  hover:bg-gray-100 dark:hover:bg-white/[0.06] 
                  transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!isGenerating && templates.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-[14px] font-medium text-gray-900 dark:text-white mb-1.5">
            No templates yet
          </h4>
          <p className="text-[12px] text-gray-500 dark:text-white/60 mb-5 max-w-xs mx-auto">
            Generate AI-powered email templates personalized for your outreach
          </p>
          <button
            onClick={handleGenerateTemplates}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
              bg-gray-900 dark:bg-white text-white dark:text-gray-900
              hover:bg-gray-800 dark:hover:bg-gray-100
              font-medium text-[12px] shadow-sm
              transition-all duration-200"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Generate Templates
          </button>
        </div>
      )}
    </div>
  );
}

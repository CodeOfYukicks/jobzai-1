import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Loader2, Edit2, Check, X, Sparkles, Mail, Settings } from 'lucide-react';
import { CampaignData, EmailTone } from '../NewCampaignModal';
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

export default function TemplateGenerationStep({ data, onUpdate, campaignId }: TemplateGenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    data.selectedTemplate?.id || null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

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
          tone: data.emailTone,
          language: data.language,
          keyPoints: data.keyPoints || '',
          count: 3
        })
      });

      const result = await response.json();

      if (result.success && result.templates) {
        setTemplates(result.templates);
        notify.success('Templates generated successfully!');
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

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditedSubject(template.subject);
    setEditedBody(template.body);
    setIsEditing(true);
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

  // Highlight merge fields in text
  const highlightMergeFields = (text: string) => {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, idx) => {
      if (part.match(/\{\{[^}]+\}\}/)) {
        return (
          <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#b7e219]/20 text-[#b7e219] dark:text-[#b7e219] font-mono text-xs font-semibold">
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          AI-Generated Email Templates
        </h3>
        <p className="text-sm text-gray-500 dark:text-white/60">
          Configure preferences and select a template
        </p>
      </div>

      {/* Email Preferences Section */}
      <div className="p-5 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Email Preferences
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tone Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tone
            </label>
            <select
              value={data.emailTone}
              onChange={(e) => onUpdate({ emailTone: e.target.value as EmailTone })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.08]
                rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b7e219]/20 focus:border-[#b7e219]
                text-gray-900 dark:text-white"
            >
              <option value="casual">Casual & Friendly</option>
              <option value="professional">Professional & Warm</option>
              <option value="bold">Direct & Confident</option>
            </select>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select
              value={data.language}
              onChange={(e) => onUpdate({ language: e.target.value as 'en' | 'fr' })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.08]
                rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b7e219]/20 focus:border-[#b7e219]
                text-gray-900 dark:text-white"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        {/* Key Points */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Key Points (Optional)
          </label>
          <textarea
            value={data.keyPoints || ''}
            onChange={(e) => onUpdate({ keyPoints: e.target.value })}
            placeholder="Mention specific skills, achievements, or reasons for reaching out..."
            rows={2}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.08]
              rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b7e219]/20 focus:border-[#b7e219]
              text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40
              resize-none"
          />
        </div>
      </div>

      {/* Merge Fields Info */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Available merge fields:
            </p>
            <div className="flex flex-wrap gap-2">
              {['{' + '{firstName}' + '}', '{' + '{lastName}' + '}', '{' + '{company}' + '}', '{' + '{position}' + '}', '{' + '{location}' + '}'].map((field, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono text-xs font-semibold">
                  {field}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#b7e219] mb-4" />
          <p className="text-sm text-gray-500 dark:text-white/60">
            Generating personalized templates...
          </p>
        </div>
      )}

      {/* Templates Grid */}
      {!isGenerating && templates.length > 0 && !isEditing && (
        <div className="space-y-4">
          {templates.map((template, index) => {
            const isSelected = selectedTemplateId === template.id;
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`
                  relative p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  ${isSelected
                    ? 'border-[#b7e219] bg-[#b7e219]/5 dark:bg-[#b7e219]/10 shadow-lg'
                    : 'border-gray-200 dark:border-white/[0.08] hover:border-[#b7e219]/50 dark:hover:border-[#b7e219]/50 bg-white dark:bg-[#1a1a1a]'
                  }
                `}
                onClick={() => handleSelectTemplate(template)}
              >
                {/* Selected Checkmark */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#b7e219] flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-gray-900" strokeWidth={3} />
                  </motion.div>
                )}

                {/* Template Number */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold
                    ${isSelected
                      ? 'bg-[#b7e219] text-gray-900'
                      : 'bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {index + 1}
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-white/50">
                    Template {index + 1}
                  </span>
                </div>

                {/* Subject */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {highlightMergeFields(template.subject)}
                  </p>
                </div>

                {/* Body Preview */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider mb-1">
                    Body
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-4">
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
                    className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                      bg-gray-100 dark:bg-white/[0.08] text-gray-700 dark:text-gray-300
                      hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Template
                  </button>
                )}
              </motion.div>
            );
          })}

          {/* Regenerate Button */}
          <button
            onClick={handleGenerateTemplates}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              bg-white dark:bg-[#1a1a1a] border-2 border-dashed border-gray-300 dark:border-white/[0.12]
              text-gray-600 dark:text-gray-400 hover:border-[#b7e219] hover:text-[#b7e219]
              transition-all duration-200"
          >
            <Wand2 className="w-4 h-4" />
            <span className="text-sm font-medium">Regenerate Templates</span>
          </button>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {/* Subject Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject Line
            </label>
            <MergeFieldPills onInsert={insertMergeFieldInSubject} />
            <div className="relative mt-2">
              <input
                ref={subjectInputRef}
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                placeholder="Email subject..."
                className="w-full px-4 py-3 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.08]
                  rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b7e219]/20 focus:border-[#b7e219]
                  placeholder-gray-400 dark:placeholder-white/40"
                style={{
                  color: 'transparent',
                  caretColor: '#1f2937'
                }}
              />
              {/* Overlay with styled merge fields */}
              <div className="absolute inset-0 px-4 py-3 text-sm pointer-events-none rounded-lg overflow-hidden">
                <div className="text-gray-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
                  {editedSubject.split(/(\{\{[^}]+\}\})/g).map((part, idx) => {
                    if (part.match(/\{\{[^}]+\}\}/)) {
                      return (
                        <span 
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md
                            bg-[#b7e219]/15 dark:bg-[#b7e219]/25
                            text-[#b7e219] dark:text-[#b7e219]
                            border border-[#b7e219]/40
                            font-mono text-xs font-semibold
                            shadow-sm"
                        >
                          {part}
                        </span>
                      );
                    }
                    return <span key={idx}>{part || '\u00A0'}</span>;
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Body Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Body
            </label>
            <MergeFieldPills onInsert={insertMergeFieldInBody} />
            <div className="relative mt-2">
              <textarea
                ref={bodyTextareaRef}
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={12}
                placeholder="Email content..."
                className="w-full px-4 py-3 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.08]
                  rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b7e219]/20 focus:border-[#b7e219]
                  placeholder-gray-400 dark:placeholder-white/40
                  resize-none"
                style={{
                  lineHeight: '1.8',
                  color: 'transparent',
                  caretColor: '#1f2937'
                }}
              />
              {/* Overlay with styled merge fields */}
              <div 
                className="absolute inset-0 px-4 py-3 text-sm pointer-events-none rounded-lg overflow-hidden"
                style={{
                  lineHeight: '1.8'
                }}
              >
                <div className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                  {editedBody.split(/(\{\{[^}]+\}\})/g).map((part, idx) => {
                    if (part.match(/\{\{[^}]+\}\}/)) {
                      return (
                        <span 
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md
                            bg-[#b7e219]/15 dark:bg-[#b7e219]/25
                            text-[#b7e219] dark:text-[#b7e219]
                            border border-[#b7e219]/40
                            font-mono text-xs font-semibold
                            shadow-sm"
                        >
                          {part}
                        </span>
                      );
                    }
                    return <span key={idx}>{part || '\u00A0'}</span>;
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveEdit}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                bg-[#b7e219] text-gray-900 hover:bg-[#a5cb17] border border-[#9fc015]
                font-semibold transition-all duration-200"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400
                hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!isGenerating && templates.length === 0 && (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-white/60 mb-4">
            No templates generated yet
          </p>
          <button
            onClick={handleGenerateTemplates}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
              bg-[#b7e219] text-gray-900 hover:bg-[#a5cb17] border border-[#9fc015]
              font-semibold transition-all duration-200"
          >
            <Wand2 className="w-4 h-4" />
            Generate Templates
          </button>
        </div>
      )}
    </div>
  );
}


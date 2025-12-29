import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Loader2, Edit2, RefreshCw, ChevronRight, Check } from 'lucide-react';
import { CampaignData } from '../../NewCampaignModal';
import { notify } from '@/lib/notify';
import { getAuth } from 'firebase/auth';
import MobileTemplateEditor from './MobileTemplateEditor';
import MobileStepWrapper from './MobileStepWrapper';

interface MobileTemplateStepProps {
    data: CampaignData;
    onUpdate: (updates: Partial<CampaignData>) => void;
    campaignId?: string;
    onNext?: () => void;
    onBack?: () => void;
}

interface EmailTemplate {
    id: string;
    subject: string;
    body: string;
}

export default function MobileTemplateStep({ data, onUpdate, onNext, onBack }: MobileTemplateStepProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
        data.selectedTemplate?.id || null
    );
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    // Generate templates on mount if needed
    useEffect(() => {
        if (templates.length === 0 && !isGenerating && !data.selectedTemplate) {
            handleGenerateTemplates();
        } else if (data.selectedTemplate && templates.length === 0) {
            setTemplates([data.selectedTemplate]);
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
                if (result.templates.length > 0) {
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

    const handleSaveEdit = (subject: string, body: string) => {
        if (!editingTemplate) return;

        const updatedTemplate = {
            ...editingTemplate,
            subject,
            body
        };

        setTemplates(prev => prev.map(t =>
            t.id === editingTemplate.id ? updatedTemplate : t
        ));

        if (selectedTemplateId === editingTemplate.id) {
            onUpdate({ selectedTemplate: updatedTemplate });
        }

        setEditingTemplate(null);
        notify.success('Template updated');
    };

    // Highlight merge fields
    const highlightMergeFields = (text: string) => {
        const parts = text.split(/(\{\{[^}]+\}\})/g);
        return parts.map((part, idx) => {
            if (part.match(/\{\{[^}]+\}\}/)) {
                return (
                    <span
                        key={idx}
                        className="text-[#b7e219] font-medium"
                    >
                        {part}
                    </span>
                );
            }
            return <span key={idx}>{part}</span>;
        });
    };

    return (
        <MobileStepWrapper
            title="Review Templates"
            stepCurrent={4}
            stepTotal={6}
            onBack={onBack!}
            onNext={onNext!}
            canProceed={!!data.selectedTemplate}
            nextLabel="Next"
            isSubmitting={isGenerating}
        >
            <div className="flex flex-col h-full">
                {/* Header Text */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-[13px] text-gray-500 dark:text-white/40">
                            Swipe to choose the best email
                        </p>
                    </div>

                    {!isGenerating && templates.length > 0 && (
                        <button
                            onClick={handleGenerateTemplates}
                            className="p-2 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/60"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Loading State */}
                {isGenerating && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-white/[0.04]" />
                            <div className="absolute inset-0 rounded-full border-4 border-[#b7e219] border-t-transparent animate-spin" />
                            <Wand2 className="absolute inset-0 m-auto w-8 h-8 text-[#b7e219]" />
                        </div>
                        <p className="text-[16px] font-medium text-gray-900 dark:text-white mb-2">
                            Writing your emails...
                        </p>
                        <p className="text-[14px] text-gray-500 dark:text-white/40 text-center max-w-[200px]">
                            AI is crafting personalized templates based on your profile
                        </p>
                    </div>
                )}

                {/* Templates Carousel */}
                {!isGenerating && templates.length > 0 && (
                    <div className="flex-1 overflow-x-auto snap-x snap-mandatory flex gap-4 px-4 -mx-4 pb-4 no-scrollbar">
                        {templates.map((template) => {
                            const isSelected = selectedTemplateId === template.id;

                            return (
                                <div
                                    key={template.id}
                                    className={`snap-center flex-shrink-0 w-[85vw] flex flex-col
                    rounded-3xl border transition-all duration-300
                    ${isSelected
                                            ? 'bg-white dark:bg-[#1a1a1a] border-[#b7e219] ring-1 ring-[#b7e219] shadow-xl shadow-black/10'
                                            : 'bg-gray-50 dark:bg-white/[0.04] border-gray-100 dark:border-white/[0.06]'
                                        }
                  `}
                                    onClick={() => handleSelectTemplate(template)}
                                >
                                    {/* Card Header */}
                                    <div className="p-5 border-b border-gray-100 dark:border-white/[0.06] flex items-start justify-between gap-4">
                                        <div>
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-1 block">
                                                Subject
                                            </span>
                                            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug">
                                                {highlightMergeFields(template.subject)}
                                            </h3>
                                        </div>
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-[#b7e219] flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3.5 h-3.5 text-black" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="flex-1 p-5 overflow-y-auto max-h-[40vh]">
                                        <p className="text-[14px] leading-relaxed text-gray-600 dark:text-white/70 whitespace-pre-wrap">
                                            {highlightMergeFields(template.body)}
                                        </p>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="p-4 border-t border-gray-100 dark:border-white/[0.06]">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingTemplate(template);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                        bg-gray-100 dark:bg-white/[0.06] text-gray-900 dark:text-white
                        font-medium text-[14px] active:scale-[0.98] transition-transform"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            <span>Edit Template</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Editor Overlay */}
                <AnimatePresence>
                    {editingTemplate && (
                        <MobileTemplateEditor
                            initialSubject={editingTemplate.subject}
                            initialBody={editingTemplate.body}
                            onSave={handleSaveEdit}
                            onCancel={() => setEditingTemplate(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </MobileStepWrapper>
    );
}

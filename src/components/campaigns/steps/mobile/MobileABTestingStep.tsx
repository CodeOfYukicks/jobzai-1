import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, FileText, Target, Plus, Trash2, Edit2, ChevronRight, AlertCircle } from 'lucide-react';
import { CampaignData } from '../../NewCampaignModal';
import { notify } from '@/lib/notify';
import { getAuth } from 'firebase/auth';
import MobileStepWrapper from './MobileStepWrapper';
import MobileVariantEditor from './MobileVariantEditor';

interface MobileABTestingStepProps {
    data: CampaignData;
    onUpdate: (updates: Partial<CampaignData>) => void;
    onNext?: () => void;
    onBack?: () => void;
}

type SubStep = 'hooks' | 'bodies' | 'ctas';

interface SectionConfig {
    id: SubStep;
    icon: typeof MessageSquare;
    title: string;
    subtitle: string;
    placeholder: string;
    maxVariants: number;
    recommended: string;
}

const SUB_STEPS: SubStep[] = ['hooks', 'bodies', 'ctas'];

export default function MobileABTestingStep({ data, onUpdate, onNext, onBack }: MobileABTestingStepProps) {
    const [activeSubStep, setActiveSubStep] = useState<SubStep>('hooks');
    const [editingVariant, setEditingVariant] = useState<{ section: SubStep; index: number; value: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    const sections: SectionConfig[] = [
        {
            id: 'hooks',
            icon: MessageSquare,
            title: 'Hooks',
            subtitle: 'Opening lines',
            placeholder: 'e.g., I noticed your team is hiring...',
            maxVariants: 5,
            recommended: '3-5',
        },
        {
            id: 'bodies',
            icon: FileText,
            title: 'Bodies',
            subtitle: 'Main content',
            placeholder: 'e.g., With my background in...',
            maxVariants: 3,
            recommended: '2-3',
        },
        {
            id: 'ctas',
            icon: Target,
            title: 'CTAs',
            subtitle: 'Call to actions',
            placeholder: 'e.g., Would you be open to a quick call?',
            maxVariants: 3,
            recommended: '2-3',
        },
    ];

    // Initialize config if needed
    const abTestConfig = data.abTestConfig || { hooks: [''], bodies: [''], ctas: [''] };
    const activeSectionConfig = sections.find(s => s.id === activeSubStep)!;
    const activeVariants = abTestConfig[activeSubStep];

    const updateVariants = (section: SubStep, variants: string[]) => {
        onUpdate({
            abTestConfig: {
                ...abTestConfig,
                [section]: variants,
            }
        });
    };

    const handleAddVariant = () => {
        if (activeVariants.length >= activeSectionConfig.maxVariants) {
            notify.warning(`Max ${activeSectionConfig.maxVariants} variants allowed`);
            return;
        }
        // Open editor with empty string for new variant
        setEditingVariant({
            section: activeSubStep,
            index: activeVariants.length,
            value: ''
        });
    };

    const handleEditVariant = (index: number) => {
        setEditingVariant({
            section: activeSubStep,
            index,
            value: activeVariants[index]
        });
    };

    const handleSaveVariant = (value: string) => {
        if (!editingVariant) return;

        const currentVariants = [...abTestConfig[editingVariant.section]];

        if (editingVariant.index < currentVariants.length) {
            // Update existing
            currentVariants[editingVariant.index] = value;
        } else {
            // Add new
            currentVariants.push(value);
        }

        updateVariants(editingVariant.section, currentVariants);
        setEditingVariant(null);
    };

    const handleRemoveVariant = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeVariants.length <= 1) {
            notify.warning('At least one variant is required');
            return;
        }
        const newVariants = activeVariants.filter((_, i) => i !== index);
        updateVariants(activeSubStep, newVariants);
    };

    const handleGenerateVariant = async (): Promise<string> => {
        if (!editingVariant) return '';

        setIsGenerating(true);
        try {
            const auth = getAuth();
            const token = await auth.currentUser?.getIdToken();

            const section = editingVariant.section;
            const existingVariants = abTestConfig[section].filter(v => v.trim());

            const response = await fetch(`${BACKEND_URL}/api/campaigns/generate-variant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: section === 'hooks' ? 'hook' : section === 'bodies' ? 'body' : 'cta',
                    tone: data.emailTone || 'casual',
                    language: data.language || 'en',
                    outreachGoal: data.outreachGoal || 'job',
                    existingVariants
                })
            });

            const result = await response.json();

            if (result.success && result.variant) {
                return result.variant;
            } else {
                notify.error(result.error || 'Failed to generate');
                return '';
            }
        } catch (error) {
            console.error('Error generating variant:', error);
            notify.error('Failed to generate');
            return '';
        } finally {
            setIsGenerating(false);
        }
    };

    const canProceed =
        abTestConfig.hooks.some(h => h.trim()) &&
        abTestConfig.bodies.some(b => b.trim()) &&
        abTestConfig.ctas.some(c => c.trim());

    return (
        <MobileStepWrapper
            title="A/B Testing"
            stepCurrent={4}
            stepTotal={6}
            onBack={onBack!}
            onNext={onNext!}
            canProceed={canProceed}
            nextLabel="Next"
        >
            <div className="flex flex-col h-full">
                {/* Tabs */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                    {sections.map((section) => {
                        const isActive = activeSubStep === section.id;
                        const count = abTestConfig[section.id].filter(v => v.trim()).length;

                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSubStep(section.id)}
                                className={`
                  flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all
                  ${isActive
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                                        : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400'
                                    }
                `}
                            >
                                <span>{section.title}</span>
                                {count > 0 && (
                                    <span className={`
                    flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                    ${isActive
                                            ? 'bg-white/20 text-white dark:text-gray-900'
                                            : 'bg-gray-200 dark:bg-white/[0.1] text-gray-500 dark:text-gray-500'
                                        }
                  `}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Section Info */}
                <div className="mb-4">
                    <h3 className="text-[18px] font-bold text-gray-900 dark:text-white mb-1">
                        {activeSectionConfig.title}
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-white/60">
                        {activeSectionConfig.subtitle}
                    </p>
                </div>

                {/* Variants List */}
                <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-20 space-y-3">
                    {activeVariants.filter(v => v.trim()).map((variant, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-4 active:scale-[0.99] transition-transform"
                            onClick={() => handleEditVariant(index)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-white dark:bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-gray-400 flex-shrink-0 mt-0.5">
                                    {index + 1}
                                </div>
                                <p className="flex-1 text-[14px] leading-relaxed text-gray-700 dark:text-white/80 line-clamp-3">
                                    {variant}
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={(e) => handleRemoveVariant(index, e)}
                                        className="p-2 -mr-2 -mt-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Empty State */}
                    {activeVariants.filter(v => v.trim()).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center mb-4">
                                <activeSectionConfig.icon className="w-8 h-8 text-gray-300 dark:text-white/20" />
                            </div>
                            <p className="text-[14px] font-medium text-gray-900 dark:text-white mb-1">
                                No variants yet
                            </p>
                            <p className="text-[12px] text-gray-500 dark:text-white/40 max-w-[200px]">
                                Add at least one {activeSectionConfig.title.toLowerCase().slice(0, -1)} to continue
                            </p>
                        </div>
                    )}
                </div>

                {/* Add Button (Floating) */}
                <div className="absolute bottom-6 right-6 z-10">
                    <button
                        onClick={handleAddVariant}
                        disabled={activeVariants.length >= activeSectionConfig.maxVariants}
                        className="w-14 h-14 rounded-full bg-[#b7e219] text-black shadow-lg shadow-black/10 
              flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 disabled:scale-100"
                    >
                        <Plus className="w-7 h-7" />
                    </button>
                </div>

                {/* Editor Overlay */}
                <AnimatePresence>
                    {editingVariant && (
                        <MobileVariantEditor
                            initialValue={editingVariant.value}
                            type={editingVariant.section === 'hooks' ? 'hook' : editingVariant.section === 'bodies' ? 'body' : 'cta'}
                            title={`Edit ${activeSectionConfig.title.slice(0, -1)}`}
                            subtitle={activeSectionConfig.subtitle}
                            placeholder={activeSectionConfig.placeholder}
                            onSave={handleSaveVariant}
                            onCancel={() => setEditingVariant(null)}
                            onGenerate={handleGenerateVariant}
                            isGenerating={isGenerating}
                        />
                    )}
                </AnimatePresence>
            </div>
        </MobileStepWrapper>
    );
}

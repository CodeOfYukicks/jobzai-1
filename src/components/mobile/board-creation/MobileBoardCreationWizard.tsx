import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft } from 'lucide-react';
import { KanbanBoard, BoardType, CustomColumn, BOARD_COLORS } from '../../../types/job';
import BoardTypeStep from './steps/BoardTypeStep';
import BoardBasicsStep from './steps/BoardBasicsStep';
import BoardColumnsStep from './steps/BoardColumnsStep';
import BoardAppearanceStep from './steps/BoardAppearanceStep';

interface MobileBoardCreationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (board: Partial<KanbanBoard>) => Promise<void>;
}

type WizardStep = 'type' | 'basics' | 'columns' | 'appearance';

export default function MobileBoardCreationWizard({ isOpen, onClose, onSave }: MobileBoardCreationWizardProps) {
    const [step, setStep] = useState<WizardStep>('type');
    const [direction, setDirection] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState<{
        boardType: BoardType;
        name: string;
        description: string;
        icon: string;
        color: string;
        coverPhoto?: string;
        customColumns: CustomColumn[];
    }>({
        boardType: 'jobs',
        name: '',
        description: '',
        icon: '',
        color: BOARD_COLORS[0],
        customColumns: []
    });

    const handleNext = (nextStep: WizardStep) => {
        setDirection(1);
        setStep(nextStep);
    };

    const handleBack = () => {
        setDirection(-1);
        switch (step) {
            case 'basics': setStep('type'); break;
            case 'columns': setStep('basics'); break;
            case 'appearance': setStep('columns'); break;
            default: onClose();
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSave({
                name: formData.name,
                description: formData.description,
                icon: formData.icon,
                color: formData.color,
                coverPhoto: formData.coverPhoto,
                boardType: formData.boardType,
                customColumns: formData.customColumns
            });
            onClose();
        } catch (error) {
            console.error('Error creating board:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Animation variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#1a191b] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-[#3d3c3e] bg-white dark:bg-[#1a191b] safe-area-top">
                <button
                    onClick={handleBack}
                    className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    {step === 'type' ? <X className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
                </button>

                {/* Progress Dots */}
                {step !== 'type' && (
                    <div className="flex gap-1.5">
                        {['basics', 'columns', 'appearance'].map((s) => (
                            <div
                                key={s}
                                className={`w-2 h-2 rounded-full transition-colors ${s === step
                                        ? 'bg-[#635BFF]'
                                        : ['basics', 'columns', 'appearance'].indexOf(s) < ['basics', 'columns', 'appearance'].indexOf(step)
                                            ? 'bg-[#635BFF]/40'
                                            : 'bg-gray-200 dark:bg-[#3d3c3e]'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute inset-0 w-full h-full bg-white dark:bg-[#1a191b]"
                    >
                        {step === 'type' && (
                            <BoardTypeStep
                                selectedType={formData.boardType}
                                onSelect={(type) => {
                                    updateField('boardType', type);
                                    updateField('icon', type === 'jobs' ? '💼' : '📨');
                                    updateField('color', type === 'jobs' ? BOARD_COLORS[0] : BOARD_COLORS[4]);
                                }}
                                onNext={() => handleNext('basics')}
                            />
                        )}

                        {step === 'basics' && (
                            <BoardBasicsStep
                                name={formData.name}
                                description={formData.description}
                                icon={formData.icon}
                                onChange={updateField}
                                onNext={() => handleNext('columns')}
                            />
                        )}

                        {step === 'columns' && (
                            <BoardColumnsStep
                                boardType={formData.boardType}
                                customColumns={formData.customColumns}
                                onAddColumn={(name) => {
                                    const newCol = {
                                        id: crypto.randomUUID(),
                                        name,
                                        color: BOARD_COLORS[formData.customColumns.length % BOARD_COLORS.length],
                                        order: formData.customColumns.length
                                    };
                                    updateField('customColumns', [...formData.customColumns, newCol]);
                                }}
                                onRemoveColumn={(id) => {
                                    updateField('customColumns', formData.customColumns.filter(c => c.id !== id));
                                }}
                                onNext={() => handleNext('appearance')}
                            />
                        )}

                        {step === 'appearance' && (
                            <BoardAppearanceStep
                                color={formData.color}
                                coverPhoto={formData.coverPhoto}
                                onChange={updateField}
                                onSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

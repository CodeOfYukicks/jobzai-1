import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { CVData, CVSection, CVLayoutSettings, CVTemplate } from '../../../types/cvEditor';
import MobileSectionList from './MobileSectionList';
import MobileSectionEditor from './MobileSectionEditor';
import MobileItemEditor from './MobileItemEditor';
import MobileAchievementEditor from './MobileAchievementEditor';

export type MobileView = 'sections' | 'section-editor' | 'item-editor' | 'achievement-editor';

interface MobileCVEditorProps {
    cvData: CVData;
    onUpdate: (sectionId: string, updates: any) => void;
    onReorder: (sections: CVSection[]) => void;
    onToggleSection: (sectionId: string) => void;
    isSaving: boolean;
    onSave: () => void;
    onBack: () => void; // Back to dashboard/previous page
    jobContext?: any;
}

export default function MobileCVEditor({
    cvData,
    onUpdate,
    onReorder,
    onToggleSection,
    isSaving,
    onSave,
    onBack,
    jobContext
}: MobileCVEditorProps) {
    // Navigation State
    const [currentView, setCurrentView] = useState<MobileView>('sections');
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [activeBulletIndex, setActiveBulletIndex] = useState<number | null>(null);

    // Helper to get current section
    const activeSection = activeSectionId ? cvData.sections.find(s => s.id === activeSectionId) : null;

    // Navigation Handlers
    const handleSectionSelect = (sectionId: string) => {
        setActiveSectionId(sectionId);
        setCurrentView('section-editor');
    };

    const handleItemSelect = (itemId: string) => {
        setActiveItemId(itemId);
        setCurrentView('item-editor');
    };

    const handleBulletSelect = (index: number) => {
        setActiveBulletIndex(index);
        setCurrentView('achievement-editor');
    };

    const handleBack = () => {
        if (currentView === 'achievement-editor') {
            setCurrentView('item-editor');
            setActiveBulletIndex(null);
        } else if (currentView === 'item-editor') {
            setCurrentView('section-editor');
            setActiveItemId(null);
        } else if (currentView === 'section-editor') {
            setCurrentView('sections');
            setActiveSectionId(null);
        } else {
            onBack();
        }
    };

    // Get title for top bar
    const getTitle = () => {
        if (currentView === 'achievement-editor') return 'Edit Achievement';
        if (currentView === 'item-editor') return 'Edit Item';
        if (currentView === 'section-editor') return activeSection?.title || 'Edit Section';
        return 'CV Editor';
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-[#1c1c1e]">
            {/* Sticky Top Bar */}
            <div className="flex-shrink-0 h-14 bg-white dark:bg-[#2c2c2e] border-b border-gray-200 dark:border-[#3a3a3c] flex items-center justify-between px-4 z-20 safe-area-top">
                <button
                    onClick={handleBack}
                    className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3a3a3c] rounded-full transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                    {getTitle()}
                </h1>

                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="p-2 -mr-2 text-[#635BFF] font-medium text-sm disabled:opacity-50"
                >
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        'Save'
                    )}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence initial={false} mode="wait">
                    {currentView === 'sections' && (
                        <MobileSectionList
                            key="sections"
                            sections={cvData.sections}
                            onSelect={handleSectionSelect}
                            onReorder={onReorder}
                            onToggle={onToggleSection}
                        />
                    )}

                    {currentView === 'section-editor' && activeSection && (
                        <MobileSectionEditor
                            key="section-editor"
                            section={activeSection}
                            cvData={cvData}
                            onUpdate={onUpdate}
                            onItemSelect={handleItemSelect}
                            jobContext={jobContext}
                        />
                    )}

                    {currentView === 'item-editor' && activeSection && activeItemId && (
                        <MobileItemEditor
                            key="item-editor"
                            section={activeSection}
                            itemId={activeItemId}
                            cvData={cvData}
                            onUpdate={onUpdate}
                            onBulletSelect={handleBulletSelect}
                            jobContext={jobContext}
                        />
                    )}

                    {currentView === 'achievement-editor' && activeSection && activeItemId && activeBulletIndex !== null && (
                        <MobileAchievementEditor
                            key="achievement-editor"
                            section={activeSection}
                            itemId={activeItemId}
                            bulletIndex={activeBulletIndex}
                            cvData={cvData}
                            onUpdate={onUpdate}
                            jobContext={jobContext}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

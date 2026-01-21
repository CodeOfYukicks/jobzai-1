import { memo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar, Trash2, Edit2, Download, Copy, Target, MoreVertical, FileText
} from 'lucide-react';
import { CVData, CVLayoutSettings } from '../../types/cvEditor';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '../../lib/cvEditorUtils';
import ModernProfessional from '../cv-editor/templates/ModernProfessional';
import ExecutiveClassic from '../cv-editor/templates/ExecutiveClassic';
import TechMinimalist from '../cv-editor/templates/TechMinimalist';
import CreativeBalance from '../cv-editor/templates/CreativeBalance';
import HarvardClassic from '../cv-editor/templates/HarvardClassic';
import SwissPhoto from '../cv-editor/templates/SwissPhoto';
import CorporatePhoto from '../cv-editor/templates/CorporatePhoto';
import ElegantSimple from '../cv-editor/templates/ElegantSimple';
import { Resume } from '../../pages/ResumeBuilderPage';

interface HuntrCVCardProps {
    resume: Resume;
    onDelete: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onEdit: (id: string) => void;
    onDuplicate?: (resume: Resume) => void;
    onDownload?: (resume: Resume) => void;
}

// Default layout settings
const defaultLayoutSettings: CVLayoutSettings = {
    fontSize: 10,
    dateFormat: 'jan-24',
    lineHeight: 1.3,
    fontFamily: 'Inter',
    accentColor: 'blue',
    showSkillLevel: true
};

// Check if CV has content
const hasContent = (cvData: CVData): boolean => {
    return !!(
        cvData.personalInfo.firstName ||
        cvData.personalInfo.lastName ||
        cvData.personalInfo.email ||
        cvData.summary ||
        cvData.experiences.length > 0 ||
        cvData.education.length > 0 ||
        cvData.skills.length > 0
    );
};

// Get template component
const getTemplateComponent = (template?: string) => {
    switch (template) {
        case 'executive-classic':
            return ExecutiveClassic;
        case 'tech-minimalist':
            return TechMinimalist;
        case 'creative-balance':
            return CreativeBalance;
        case 'harvard-classic':
            return HarvardClassic;
        case 'swiss-photo':
            return SwissPhoto;
        case 'corporate-photo':
            return CorporatePhoto;
        case 'elegant-simple':
            return ElegantSimple;
        case 'modern-professional':
        default:
            return ModernProfessional;
    }
};

function formatDateString(dateInput: any): string {
    if (!dateInput) return 'Unknown date';

    try {
        let date: Date;

        if (dateInput.toDate && typeof dateInput.toDate === 'function') {
            date = dateInput.toDate();
        } else if (dateInput instanceof Date) {
            date = dateInput;
        } else if (typeof dateInput === 'string') {
            date = new Date(dateInput);
        } else {
            return 'Unknown date';
        }

        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }

        // Calculate relative time if less than 24 hours
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Unknown date';
    }
}

const HuntrCVCard = memo(({
    resume,
    onDelete,
    onRename,
    onEdit,
    onDuplicate,
    onDownload
}: HuntrCVCardProps) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(resume.name);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Calculate scale factor for preview
    // Fixed height for the card is around 220px, so preview should fit within that
    const targetHeight = 200;
    const scale = targetHeight / A4_HEIGHT_PX;
    const scaledWidth = A4_WIDTH_PX * scale;

    const TemplateComponent = getTemplateComponent(resume.template);
    const layoutSettings = resume.layoutSettings || defaultLayoutSettings;
    const hasCVContent = hasContent(resume.cvData);

    const handleNameClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditingName(true);
        setEditedName(resume.name);
    };

    const handleNameBlur = () => {
        if (editedName.trim() && editedName !== resume.name) {
            onRename(resume.id, editedName.trim());
        } else {
            setEditedName(resume.name);
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            nameInputRef.current?.blur();
        } else if (e.key === 'Escape') {
            setEditedName(resume.name);
            setIsEditingName(false);
        }
    };

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-200 dark:border-[#3d3c3e] overflow-hidden hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] hover:border-[#004b23] dark:hover:border-[#004b23] hover:border-2 transition-all duration-300 flex h-[220px] relative"
        >
            {/* Left Side - Preview */}
            <div
                className="h-full bg-[#F9FAFB] dark:bg-[#333234]/50 border-r border-gray-100 dark:border-[#3d3c3e] relative overflow-hidden cursor-pointer flex-shrink-0"
                style={{ width: scaledWidth + 30 }}
                onClick={() => onEdit(resume.id)}
            >
                <div className="absolute inset-0 flex items-center justify-center p-3">
                    <div
                        className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] rounded-[2px] ring-1 ring-black/[0.03]"
                        style={{
                            width: scaledWidth,
                            height: targetHeight,
                            overflow: 'hidden'
                        }}
                    >
                        <div
                            style={{
                                width: A4_WIDTH_PX,
                                height: A4_HEIGHT_PX,
                                transform: `scale(${scale})`,
                                transformOrigin: 'top left',
                            }}
                        >
                            {hasCVContent ? (
                                <div className="w-full h-full bg-white p-[40px]">
                                    <TemplateComponent
                                        cvData={resume.cvData}
                                        layoutSettings={layoutSettings}
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white">
                                    <span className="text-gray-300 text-4xl font-bold">Empty</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Template Badge - Bottom Left Pill */}
                <div className="absolute bottom-3 left-3 px-2.5 py-0.5 bg-white dark:bg-[#2b2a2c] shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-md border border-gray-100 dark:border-[#3d3c3e] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#70E000]" />
                    <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {resume.template ? resume.template.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Modern'}
                    </span>
                </div>
            </div>

            {/* Right Side - Details & Actions */}
            <div className="flex-1 flex flex-col px-3 py-2 min-w-0">
                {/* Header */}
                <div className="mb-1.5">
                    {isEditingName ? (
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={handleNameBlur}
                            onKeyDown={handleNameKeyDown}
                            className="text-sm font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-[#70E000] focus:outline-none w-full pb-0.5"
                        />
                    ) : (
                        <div className="group/title">
                            <h3
                                className="text-sm font-bold text-gray-900 dark:text-white truncate cursor-pointer hover:text-[#007200] dark:hover:text-[#70E000] transition-colors flex items-center gap-2"
                                onClick={handleNameClick}
                                title={resume.name}
                            >
                                {resume.name}
                                <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                            </h3>
                        </div>
                    )}
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate font-medium">
                        {resume.targetJobTitle || 'No target title set'}
                    </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 dark:bg-[#3d3c3e] mb-1.5" />

                {/* Actions List */}
                <div className="flex-1 flex flex-col justify-center space-y-0.5">
                    <button
                        onClick={() => onEdit(resume.id)}
                        className="w-full flex items-center gap-2 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:text-[#007200] dark:hover:text-[#70E000] transition-colors group/btn text-left rounded-md hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50"
                    >
                        <Edit2 className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-[#007200] dark:group-hover/btn:text-[#70E000] transition-colors" />
                        Edit Resume
                    </button>

                    <button
                        onClick={() => onEdit(resume.id)}
                        className="w-full flex items-center gap-2 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:text-[#007200] dark:hover:text-[#70E000] transition-colors group/btn text-left rounded-md hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50"
                    >
                        <Target className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-[#007200] dark:group-hover/btn:text-[#70E000] transition-colors" />
                        Tailor to Job
                    </button>

                    {onDownload && (
                        <button
                            onClick={() => onDownload(resume)}
                            className="w-full flex items-center gap-2 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:text-[#007200] dark:hover:text-[#70E000] transition-colors group/btn text-left rounded-md hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50"
                        >
                            <Download className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-[#007200] dark:group-hover/btn:text-[#70E000] transition-colors" />
                            Download
                        </button>
                    )}

                    {onDuplicate && (
                        <button
                            onClick={() => onDuplicate(resume)}
                            className="w-full flex items-center gap-2 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:text-[#007200] dark:hover:text-[#70E000] transition-colors group/btn text-left rounded-md hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50"
                        >
                            <Copy className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-[#007200] dark:group-hover/btn:text-[#70E000] transition-colors" />
                            Duplicate
                        </button>
                    )}

                    <button
                        onClick={() => onDelete(resume.id)}
                        className="w-full flex items-center gap-2 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors group/btn text-left rounded-md hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-red-600 dark:group-hover/btn:text-red-400 transition-colors" />
                        Delete
                    </button>
                </div>

                {/* Footer */}
                <div className="pt-1.5 mt-0.5">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        Last Edited: {formatDateString(resume.updatedAt || resume.createdAt)}
                    </p>
                </div>
            </div>
        </motion.div>
    );
});

HuntrCVCard.displayName = 'HuntrCVCard';

export default HuntrCVCard;

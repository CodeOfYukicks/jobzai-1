import { motion } from 'framer-motion';
import {
    User, FileText, Briefcase, GraduationCap, Code, Award,
    FolderOpen, Globe, ChevronRight, Eye, EyeOff, GripVertical
} from 'lucide-react';
import { CVSection } from '../../../types/cvEditor';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface MobileSectionListProps {
    sections: CVSection[];
    onSelect: (sectionId: string) => void;
    onReorder: (sections: CVSection[]) => void;
    onToggle: (sectionId: string) => void;
}

const sectionIcons: Record<string, React.ReactNode> = {
    personal: <User className="w-5 h-5" />,
    summary: <FileText className="w-5 h-5" />,
    experience: <Briefcase className="w-5 h-5" />,
    education: <GraduationCap className="w-5 h-5" />,
    skills: <Code className="w-5 h-5" />,
    certifications: <Award className="w-5 h-5" />,
    projects: <FolderOpen className="w-5 h-5" />,
    languages: <Globe className="w-5 h-5" />
};

export default function MobileSectionList({
    sections,
    onSelect,
    onReorder,
    onToggle
}: MobileSectionListProps) {

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const newSections = Array.from(sections);
        const [reorderedItem] = newSections.splice(result.source.index, 1);
        newSections.splice(result.destination.index, 0, reorderedItem);

        // Update order property
        const updatedSections = newSections.map((section, index) => ({
            ...section,
            order: index
        }));

        onReorder(updatedSections);
    };

    // Sort sections by order
    const sortedSections = [...sections].sort((a, b) => a.order - b.order);

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-[#1c1c1e] pb-20">
            <div className="px-4 py-4">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
                    Sections
                </h2>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="mobile-sections">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-3"
                            >
                                {sortedSections.map((section, index) => (
                                    <Draggable
                                        key={section.id}
                                        draggableId={section.id}
                                        index={index}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                style={provided.draggableProps.style}
                                                className={`
                          bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#3a3a3c] shadow-sm
                          ${snapshot.isDragging ? 'shadow-lg ring-2 ring-[#635BFF] z-50' : ''}
                        `}
                                            >
                                                <div className="flex items-center p-3">
                                                    {/* Drag Handle */}
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                                    >
                                                        <GripVertical className="w-5 h-5" />
                                                    </div>

                                                    {/* Content - Clickable */}
                                                    <div
                                                        className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer"
                                                        onClick={() => onSelect(section.id)}
                                                    >
                                                        <div className={`
                              p-2 rounded-lg
                              ${section.enabled
                                                                ? 'bg-[#635BFF]/10 text-[#635BFF]'
                                                                : 'bg-gray-100 dark:bg-[#3a3a3c] text-gray-400 dark:text-gray-500'
                                                            }
                            `}>
                                                            {sectionIcons[section.type] || <FileText className="w-5 h-5" />}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <h3 className={`
                                text-base font-medium truncate
                                ${section.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}
                              `}>
                                                                {section.title}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onToggle(section.id);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                                        >
                                                            {section.enabled ? (
                                                                <Eye className="w-5 h-5" />
                                                            ) : (
                                                                <EyeOff className="w-5 h-5" />
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => onSelect(section.id)}
                                                            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                                        >
                                                            <ChevronRight className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </div>
    );
}

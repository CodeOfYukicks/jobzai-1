import { Plus, ChevronRight, Trash2 } from 'lucide-react';
import { CVSection, CVData } from '../../../types/cvEditor';

interface MobileItemEditorProps {
    section: CVSection;
    itemId: string;
    cvData: CVData;
    onUpdate: (sectionId: string, updates: any) => void;
    onBulletSelect: (index: number) => void;
    jobContext?: any;
}

export default function MobileItemEditor({
    section,
    itemId,
    cvData,
    onUpdate,
    onBulletSelect,
    jobContext
}: MobileItemEditorProps) {

    // Helper to find the current item
    const getListKey = (type: string) => {
        switch (type) {
            case 'experience': return 'experiences';
            case 'education': return 'education';
            case 'projects': return 'projects';
            case 'certifications': return 'certifications';
            case 'languages': return 'languages';
            case 'skills': return 'skills';
            default: return null;
        }
    };

    const listKey = getListKey(section.type);
    if (!listKey) return <div>Error: Invalid section type</div>;

    const items = (cvData as any)[listKey] || [];
    const item = items.find((i: any) => i.id === itemId);

    if (!item) return <div>Error: Item not found</div>;

    // Generic update handler
    const updateItem = (updates: any) => {
        const updatedItems = items.map((i: any) =>
            i.id === itemId ? { ...i, ...updates } : i
        );
        onUpdate(section.type, { [listKey]: updatedItems });
    };

    // Handler for adding a new bullet point
    const handleAddBullet = () => {
        const currentBullets = item.bullets || [];
        updateItem({ bullets: [...currentBullets, ''] });
        onBulletSelect(currentBullets.length); // Select the new bullet
    };

    // Handler for deleting a bullet point
    const handleDeleteBullet = (index: number) => {
        const currentBullets = item.bullets || [];
        const newBullets = currentBullets.filter((_: any, i: number) => i !== index);
        updateItem({ bullets: newBullets });
    };

    // Render form based on section type
    const renderForm = () => {
        switch (section.type) {
            case 'experience':
                return (
                    <>
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Job Title</label>
                                <input
                                    type="text"
                                    value={item.title || ''}
                                    onChange={(e) => updateItem({ title: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                    placeholder="Software Engineer"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Company</label>
                                <input
                                    type="text"
                                    value={item.company || ''}
                                    onChange={(e) => updateItem({ company: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                    placeholder="Google"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Start Date</label>
                                    <input
                                        type="text"
                                        value={item.startDate || ''}
                                        onChange={(e) => updateItem({ startDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                        placeholder="Jan 2020"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">End Date</label>
                                    <input
                                        type="text"
                                        value={item.endDate || ''}
                                        onChange={(e) => updateItem({ endDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                        placeholder="Present"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Location</label>
                                <input
                                    type="text"
                                    value={item.location || ''}
                                    onChange={(e) => updateItem({ location: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                    placeholder="San Francisco, CA"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Description</label>
                                <textarea
                                    value={item.description || ''}
                                    onChange={(e) => updateItem({ description: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none h-24 resize-none"
                                    placeholder="Brief description of your role..."
                                />
                            </div>
                        </div>

                        {/* Achievements List */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Achievements</label>
                                <button
                                    onClick={handleAddBullet}
                                    className="text-xs font-medium text-[#635BFF] flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Achievement
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(item.bullets || []).map((bullet: string, index: number) => (
                                    <div
                                        key={index}
                                        onClick={() => onBulletSelect(index)}
                                        className="bg-white dark:bg-[#2c2c2e] p-3 rounded-xl border border-gray-200 dark:border-[#3a3a3c] flex items-start gap-3 active:bg-gray-50 dark:active:bg-[#3a3a3c] transition-colors cursor-pointer"
                                    >
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#635BFF] flex-shrink-0" />
                                        <p className="flex-1 text-sm text-gray-900 dark:text-white line-clamp-2">
                                            {bullet || <span className="text-gray-400 italic">Empty achievement...</span>}
                                        </p>
                                        <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5" />
                                    </div>
                                ))}

                                {(item.bullets || []).length === 0 && (
                                    <div className="text-center py-6 bg-white dark:bg-[#2c2c2e] rounded-xl border border-dashed border-gray-300 dark:border-[#3a3a3c]">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No achievements added yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                );

            case 'education':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Institution</label>
                            <input
                                type="text"
                                value={item.institution || ''}
                                onChange={(e) => updateItem({ institution: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="Harvard University"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Degree</label>
                            <input
                                type="text"
                                value={item.degree || ''}
                                onChange={(e) => updateItem({ degree: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="Bachelor of Science"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Field of Study</label>
                            <input
                                type="text"
                                value={item.field || ''}
                                onChange={(e) => updateItem({ field: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="Computer Science"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Graduation Date</label>
                            <input
                                type="text"
                                value={item.graduationDate || ''}
                                onChange={(e) => updateItem({ graduationDate: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="May 2020"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">GPA (Optional)</label>
                            <input
                                type="text"
                                value={item.gpa || ''}
                                onChange={(e) => updateItem({ gpa: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="3.8"
                            />
                        </div>
                    </div>
                );

            case 'projects':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Project Name</label>
                            <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) => updateItem({ name: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="Project Alpha"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Description</label>
                            <textarea
                                value={item.description || ''}
                                onChange={(e) => updateItem({ description: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none h-32 resize-none"
                                placeholder="Describe the project..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Technologies</label>
                            <input
                                type="text"
                                value={item.technologies?.join(', ') || ''}
                                onChange={(e) => updateItem({ technologies: e.target.value.split(',').map((t: string) => t.trim()) })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="React, TypeScript, Node.js"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">URL (Optional)</label>
                            <input
                                type="url"
                                value={item.url || ''}
                                onChange={(e) => updateItem({ url: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="https://example.com"
                            />
                        </div>
                    </div>
                );

            case 'skills':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Skill Name</label>
                            <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) => updateItem({ name: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="React"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Level</label>
                            <select
                                value={item.level || 'Intermediate'}
                                onChange={(e) => updateItem({ level: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none appearance-none"
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Expert">Expert</option>
                            </select>
                        </div>
                    </div>
                );

            case 'languages':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Language</label>
                            <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) => updateItem({ name: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="English"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Proficiency</label>
                            <select
                                value={item.proficiency || 'Native'}
                                onChange={(e) => updateItem({ proficiency: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none appearance-none"
                            >
                                <option value="Native">Native</option>
                                <option value="Fluent">Fluent</option>
                                <option value="Proficient">Proficient</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Basic">Basic</option>
                            </select>
                        </div>
                    </div>
                );

            case 'certifications':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Certification Name</label>
                            <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) => updateItem({ name: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="AWS Certified Solutions Architect"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Issuer</label>
                            <input
                                type="text"
                                value={item.issuer || ''}
                                onChange={(e) => updateItem({ issuer: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="Amazon Web Services"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Date</label>
                            <input
                                type="text"
                                value={item.date || ''}
                                onChange={(e) => updateItem({ date: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="2023"
                            />
                        </div>
                    </div>
                );

            default:
                return <div>Unsupported item type</div>;
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-[#1c1c1e] p-4 pb-20">
            {renderForm()}
        </div>
    );
}

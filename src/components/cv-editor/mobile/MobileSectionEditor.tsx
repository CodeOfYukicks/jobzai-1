import { CVSection, CVData } from '../../../types/cvEditor';
import MobileItemList from './MobileItemList';
import { generateId } from '../../../lib/cvEditorUtils';

interface MobileSectionEditorProps {
    section: CVSection;
    cvData: CVData;
    onUpdate: (sectionId: string, updates: any) => void;
    onItemSelect: (itemId: string) => void;
    jobContext?: any;
}

export default function MobileSectionEditor({
    section,
    cvData,
    onUpdate,
    onItemSelect,
    jobContext
}: MobileSectionEditorProps) {

    // Generic handler for adding new items
    const handleAddItem = () => {
        const newId = generateId();
        let newItem: any = { id: newId };

        switch (section.type) {
            case 'experience':
                newItem = { ...newItem, title: '', company: '', bullets: [] };
                onUpdate('experience', { experiences: [...(cvData.experiences || []), newItem] });
                break;
            case 'education':
                newItem = { ...newItem, institution: '', degree: '' };
                onUpdate('education', { education: [...(cvData.education || []), newItem] });
                break;
            case 'projects':
                newItem = { ...newItem, name: '', description: '' };
                onUpdate('projects', { projects: [...(cvData.projects || []), newItem] });
                break;
            case 'certifications':
                newItem = { ...newItem, name: '', issuer: '' };
                onUpdate('certifications', { certifications: [...(cvData.certifications || []), newItem] });
                break;
            case 'languages':
                newItem = { ...newItem, name: '', proficiency: 'Native' };
                onUpdate('languages', { languages: [...(cvData.languages || []), newItem] });
                break;
            case 'skills':
                newItem = { ...newItem, name: '', level: 'Expert' };
                onUpdate('skills', { skills: [...(cvData.skills || []), newItem] });
                break;
        }

        // Auto-select the new item
        onItemSelect(newId);
    };

    // Generic handler for deleting items
    const handleDeleteItem = (itemId: string) => {
        const listKey = getListKey(section.type);
        if (!listKey) return;

        const currentList = (cvData as any)[listKey] || [];
        const updatedList = currentList.filter((item: any) => item.id !== itemId);
        onUpdate(section.type, { [listKey]: updatedList });
    };

    // Generic handler for reordering
    const handleReorderItems = (newItems: any[]) => {
        const listKey = getListKey(section.type);
        if (!listKey) return;
        onUpdate(section.type, { [listKey]: newItems });
    };

    // Helper to map section type to data key
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

    // Render based on section type
    switch (section.type) {
        case 'personal':
            return (
                <div className="p-4 space-y-4 bg-gray-50 dark:bg-[#1c1c1e] min-h-full">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">First Name</label>
                            <input
                                type="text"
                                value={cvData.personalInfo.firstName || ''}
                                onChange={(e) => onUpdate('personal', { firstName: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Last Name</label>
                            <input
                                type="text"
                                value={cvData.personalInfo.lastName || ''}
                                onChange={(e) => onUpdate('personal', { lastName: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Title</label>
                            <input
                                type="text"
                                value={cvData.personalInfo.title || ''}
                                onChange={(e) => onUpdate('personal', { title: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="Software Engineer"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Email</label>
                            <input
                                type="email"
                                value={cvData.personalInfo.email || ''}
                                onChange={(e) => onUpdate('personal', { email: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="john@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Phone</label>
                            <input
                                type="tel"
                                value={cvData.personalInfo.phone || ''}
                                onChange={(e) => onUpdate('personal', { phone: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="+1 234 567 890"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Location</label>
                            <input
                                type="text"
                                value={cvData.personalInfo.location || ''}
                                onChange={(e) => onUpdate('personal', { location: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none"
                                placeholder="New York, NY"
                            />
                        </div>
                    </div>
                </div>
            );

        case 'summary':
            return (
                <div className="p-4 bg-gray-50 dark:bg-[#1c1c1e] min-h-full flex flex-col">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">Professional Summary</label>
                    <textarea
                        value={cvData.summary || ''}
                        onChange={(e) => onUpdate('summary', { summary: e.target.value })}
                        className="flex-1 w-full px-4 py-3 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#3a3a3c] rounded-xl text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-[#635BFF] focus:border-transparent outline-none resize-none"
                        placeholder="Write a short professional summary..."
                    />
                </div>
            );

        case 'experience':
            return (
                <MobileItemList
                    items={cvData.experiences || []}
                    onSelect={onItemSelect}
                    onAdd={handleAddItem}
                    onDelete={handleDeleteItem}
                    onReorder={handleReorderItems}
                    titleKey="title"
                    subtitleKey="company"
                    dateKey="startDate"
                />
            );

        case 'education':
            return (
                <MobileItemList
                    items={cvData.education || []}
                    onSelect={onItemSelect}
                    onAdd={handleAddItem}
                    onDelete={handleDeleteItem}
                    onReorder={handleReorderItems}
                    titleKey="institution"
                    subtitleKey="degree"
                    dateKey="graduationDate"
                />
            );

        case 'projects':
            return (
                <MobileItemList
                    items={cvData.projects || []}
                    onSelect={onItemSelect}
                    onAdd={handleAddItem}
                    onDelete={handleDeleteItem}
                    onReorder={handleReorderItems}
                    titleKey="name"
                    subtitleKey="description"
                />
            );

        case 'certifications':
            return (
                <MobileItemList
                    items={cvData.certifications || []}
                    onSelect={onItemSelect}
                    onAdd={handleAddItem}
                    onDelete={handleDeleteItem}
                    onReorder={handleReorderItems}
                    titleKey="name"
                    subtitleKey="issuer"
                    dateKey="date"
                />
            );

        case 'languages':
            return (
                <MobileItemList
                    items={cvData.languages || []}
                    onSelect={onItemSelect}
                    onAdd={handleAddItem}
                    onDelete={handleDeleteItem}
                    onReorder={handleReorderItems}
                    titleKey="name"
                    subtitleKey="proficiency"
                />
            );

        case 'skills':
            return (
                <MobileItemList
                    items={cvData.skills || []}
                    onSelect={onItemSelect}
                    onAdd={handleAddItem}
                    onDelete={handleDeleteItem}
                    onReorder={handleReorderItems}
                    titleKey="name"
                    subtitleKey="level"
                />
            );

        default:
            return (
                <div className="p-8 text-center text-gray-500">
                    Section type not supported on mobile yet.
                </div>
            );
    }
}

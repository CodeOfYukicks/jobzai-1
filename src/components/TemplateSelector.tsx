// src/components/TemplateSelector.tsx

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2 } from 'lucide-react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import CreateTemplateDialog from './CreateTemplateDialog';
import TemplateEditModal from './TemplateEditModal';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  folder?: string;
  liked: boolean;
  aiGenerated: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateSelectorProps {
  onSelect: (template: EmailTemplate) => void;
  selectedTemplateId?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelect,
  selectedTemplateId,
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<EmailTemplate | null>(null);
  const { currentUser } = useAuth();

  const loadTemplates = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
      const templatesSnapshot = await getDocs(query(templatesRef));

      const loadedTemplates = templatesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as EmailTemplate[];

      setTemplates(loadedTemplates);

      // Set initially selected template if selectedTemplateId is provided
      if (selectedTemplateId) {
        const template = loadedTemplates.find((t) => t.id === selectedTemplateId);
        if (template) {
          onSelect(template);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [currentUser, selectedTemplateId]);

  const handleCreateTemplate = async (templateId: string) => {
    // First, refresh the templates list to include the newly created template
    await loadTemplates();
    
    // Now find the newly created template in the refreshed list
    const templatesRef = collection(db, 'users', currentUser?.uid as string, 'emailTemplates');
    const templatesSnapshot = await getDocs(query(templatesRef));
    
    const newTemplate = templatesSnapshot.docs
      .find(doc => doc.id === templateId);
      
    if (newTemplate) {
      const template = {
        id: newTemplate.id,
        ...newTemplate.data(),
        createdAt: newTemplate.data().createdAt?.toDate(),
        updatedAt: newTemplate.data().updatedAt?.toDate(),
      } as EmailTemplate;
      
      // Update the templates state with the new list that includes the created template
      setTemplates(prev => {
        const exists = prev.some(t => t.id === template.id);
        return exists ? prev : [...prev, template];
      });
      
      // Select the newly created template
      onSelect(template);
    }
    
    setShowCreateDialog(false);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setTemplateToEdit(template);
  };

  const handleSaveEdit = async (templateId: string) => {
    await loadTemplates(); // Refresh templates after edit
    
    const updatedTemplate = templates.find((t) => t.id === templateId);
    if (updatedTemplate) {
      onSelect(updatedTemplate);
    }
    setTemplateToEdit(null);
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    onSelect(template);
    console.log("Selected template:", template);
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D75E6]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Create New */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-[#8D75E6] focus:border-[#8D75E6]"
          />
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center px-4 py-2 text-[#8D75E6] dark:text-purple-400 hover:bg-[#8D75E6]/5 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New
        </button>
      </div>

      {/* Templates List */}
      {filteredTemplates.length > 0 ? (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 border rounded-lg transition-all cursor-pointer ${
                selectedTemplateId === template.id
                  ? 'border-[#8D75E6] dark:border-purple-500 bg-[#8D75E6]/5 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-[#8D75E6]/50 dark:hover:border-purple-500/50 bg-white dark:bg-gray-800'
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow pr-8">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{template.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.subject}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {template.aiGenerated && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                        AI Generated
                      </span>
                    )}
                    {template.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTemplate(template);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Edit2 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first template'}
          </p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="mt-4 inline-flex items-center px-4 py-2 text-[#8D75E6] dark:text-purple-400 hover:bg-[#8D75E6]/5 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Template
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateDialog && (
          <CreateTemplateDialog
            onClose={() => setShowCreateDialog(false)}
            onTemplateCreated={handleCreateTemplate}
          />
        )}
        {templateToEdit && (
          <TemplateEditModal
            template={templateToEdit}
            onClose={() => setTemplateToEdit(null)}
            onSave={handleSaveEdit}
            inCampaignFlow={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

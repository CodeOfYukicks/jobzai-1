import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Folder, Heart, Plus, Wand2, Trash2, ArrowLeft } from 'lucide-react';
import { collection, query, onSnapshot, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import GenerateTemplateModal from '../components/GenerateTemplateModal';
import DeleteTemplateDialog from '../components/DeleteTemplateDialog';
import TemplateEditModal from '../components/TemplateEditModal';
import { toast } from 'sonner';
import TemplateCard from '../components/TemplateCard';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  tone: string;
  language: string;
  aiGenerated: boolean;
  liked: boolean;
  tags: string[];
  createdAt: any;
  updatedAt: any;
}

export default function EmailTemplatesPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const [templateToEdit, setTemplateToEdit] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'ai'>('all');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
    const unsubscribe = onSnapshot(
      query(templatesRef),
      (snapshot) => {
        const loadedTemplates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EmailTemplate[];
        setTemplates(loadedTemplates);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading templates:', error);
        toast.error('Failed to load templates');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'emailTemplates', template.id));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const filteredTemplates = useMemo(() => {
    switch (filter) {
      case 'favorites':
        return templates.filter(t => t.liked);
      case 'ai':
        return templates.filter(t => t.aiGenerated);
      default:
        return templates;
    }
  }, [templates, filter]);

  const loadTemplates = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
      const snapshot = await getDocs(templatesRef);
      const loadedTemplates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailTemplate[];
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Email Templates</h1>
              <p className="text-sm text-gray-500">
                Manage your message templates
              </p>
            </div>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and customize your follow-up message templates
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#8D75E6] bg-[#8D75E6]/10 rounded-lg hover:bg-[#8D75E6]/20 transition-colors"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate with AI
              </button>
              <button
                onClick={() => navigate('/email-templates/new')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#8D75E6] rounded-lg hover:bg-[#8D75E6]/90 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Manually
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6] text-base"
          />
        </div>

        {/* Mobile Action Buttons */}
        {isMobile && (
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex-1 py-3 px-4 bg-[#8D75E6]/10 text-[#8D75E6] rounded-lg font-medium text-sm"
            >
              <Wand2 className="h-4 w-4 mx-auto mb-1" />
              <span>Generate</span>
            </button>
            <button
              onClick={() => navigate('/email-templates/new')}
              className="flex-1 py-3 px-4 bg-[#8D75E6] text-white rounded-lg font-medium text-sm"
            >
              <Plus className="h-4 w-4 mx-auto mb-1" />
              <span>Create</span>
            </button>
          </div>
        )}

        {/* Folder Navigation */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`${filter === 'all' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'} px-4 py-2 rounded-lg`}
          >
            All Templates
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`${filter === 'favorites' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'} px-4 py-2 rounded-lg`}
          >
            Favorites
          </button>
          <button
            onClick={() => setFilter('ai')}
            className={`${filter === 'ai' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'} px-4 py-2 rounded-lg`}
          >
            AI Generated
          </button>
        </div>

        {/* Templates List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8D75E6] mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading templates...</p>
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onUpdate={loadTemplates}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No templates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by creating your first template'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showGenerateModal && (
          <GenerateTemplateModal onClose={() => setShowGenerateModal(false)} />
        )}
        {templateToDelete && (
          <DeleteTemplateDialog
            templateName={templateToDelete.name}
            onConfirm={() => handleDeleteTemplate(templateToDelete)}
            onClose={() => setTemplateToDelete(null)}
          />
        )}
        {templateToEdit && (
          <TemplateEditModal
            template={templateToEdit}
            onClose={() => setTemplateToEdit(null)}
          />
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
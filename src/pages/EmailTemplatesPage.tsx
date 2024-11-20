import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { Search, Folder, Heart, Plus, Wand2, Trash2, ArrowLeft, X, Pencil, Mail } from 'lucide-react';
import { collection, query, onSnapshot, doc, deleteDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import GenerateTemplateModal from '../components/GenerateTemplateModal';
import DeleteTemplateDialog from '../components/DeleteTemplateDialog';
import TemplateEditModal from '../components/TemplateEditModal';
import { toast } from 'sonner';
import TemplateCard from '../components/TemplateCard';
import { useSwipeable } from 'react-swipeable';

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

interface SwipeableTemplateCardProps {
  template: EmailTemplate;
  onDelete: (template: EmailTemplate) => void;
  onFavorite: (template: EmailTemplate) => void;
}

const SwipeableTemplateCard: React.FC<SwipeableTemplateCardProps> = ({
  template,
  onDelete,
  onFavorite,
}) => {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onDelete(template),
    onSwipedRight: () => onFavorite(template),
    trackMouse: true,
    delta: 50, // distance minimum pour déclencher le swipe
    preventDefaultTouchmoveEvent: true,
    trackTouch: true,
  });

  return (
    <div className="relative overflow-hidden rounded-lg bg-white mb-3">
      {/* Arrière-plans de swipe */}
      <div className="absolute inset-0 flex">
        <div className="flex-1 bg-red-500 flex items-center justify-start pl-4">
          <Trash2 className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 bg-emerald-500 flex items-center justify-end pr-4">
          <Heart className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Contenu de la carte */}
      <div
        {...swipeHandlers}
        className="relative bg-white p-4 transition-transform"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-medium text-gray-900">
              {template.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {template.content}
            </p>
          </div>
          {template.aiGenerated && (
            <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
              AI
            </span>
          )}
        </div>
        
        <div className="mt-2 flex flex-wrap gap-2">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

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

  const refreshTemplates = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
      const q = query(templatesRef);
      const querySnapshot = await getDocs(q);
      const templatesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailTemplate[];
      
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to refresh templates');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
      const q = query(templatesRef);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const templatesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EmailTemplate[];
        
        setTemplates(templatesData);
        setIsLoading(false);
      });

      return () => unsubscribe();
    }
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

  const handleFavorite = async (template) => {
    if (!currentUser) return;
    try {
      const templateRef = doc(db, 'users', currentUser.uid, 'emailTemplates', template.id);
      await updateDoc(templateRef, {
        liked: !template.liked
      });
      toast.success(template.liked ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Filtre de recherche
      const matchesSearch = searchQuery
        ? template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      // Filtre par catégorie
      const matchesFilter = 
        filter === 'all' ? true :
        filter === 'favorites' ? template.liked :
        filter === 'ai generated' ? template.aiGenerated === true :
        true;

      return matchesSearch && matchesFilter;
    });
  }, [templates, filter, searchQuery]);

  return (
    <AuthLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header amélioré */}
        <div className="max-w-7xl mx-auto">
          <div className="mb-12"> {/* Espacement augmenté */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#8D75E6] to-[#A990FF] text-transparent bg-clip-text mb-3">
                  Email Templates
                </h1>
                <p className="text-lg text-gray-400"> {/* Taille augmentée */}
                  {templates.length} templates available
                </p>
              </div>

              {/* Boutons d'action desktop améliorés */}
              {!isMobile && (
                <div className="flex items-center gap-4"> {/* Gap augmenté */}
                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="group px-5 py-2.5 rounded-xl 
                      bg-[#8D75E6]/10 hover:bg-[#8D75E6]/15 
                      border border-[#8D75E6]/20 hover:border-[#8D75E6]/30
                      transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Wand2 className="h-4 w-4 text-[#8D75E6] group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-[#8D75E6]">AI Generate</span>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/email-templates/new')}
                    className="group px-5 py-2.5 rounded-xl 
                      bg-gradient-to-r from-[#8D75E6] to-[#A990FF]
                      hover:opacity-90
                      border border-[#8D75E6]/20
                      shadow-lg shadow-[#8D75E6]/20
                      transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-white">New Template</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 
                bg-white dark:bg-[#353040] 
                text-gray-900 dark:text-gray-100
                border border-gray-200 dark:border-gray-700/30 
                rounded-xl
                placeholder:text-gray-500
                focus:ring-2 focus:ring-[#8D75E6]/20 focus:border-[#8D75E6]/50
                transition-all duration-200"
              placeholder="Search by template name, content or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 p-1 bg-gray-100 dark:bg-[#353040] rounded-lg">
            {['All', 'Favorites', 'AI Generated'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption === 'AI Generated' ? 'ai generated' : filterOption.toLowerCase())}
                className={`
                  flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${(filter === filterOption.toLowerCase() || (filter === 'ai generated' && filterOption === 'AI Generated'))
                    ? 'bg-[#8D75E6] text-white' 
                    : 'text-gray-400 hover:text-gray-200'}
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  {filterOption === 'Favorites' && <Heart className="h-4 w-4" />}
                  {filterOption === 'AI Generated' && <Wand2 className="h-4 w-4" />}
                  <span>{filterOption}</span>
                </div>
              </button>
            ))}
          </div>
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

        {/* Templates List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8D75E6] mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading templates...</p>
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="space-y-2">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUpdate={refreshTemplates}
                onDelete={(template) => setTemplateToDelete(template)}
                isMobile={true}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#8D75E6]/10 mb-4">
              <Mail className="h-8 w-8 text-[#8D75E6]" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No templates yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery 
                ? "No templates match your search criteria" 
                : "Get started by creating your first email template"}
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#8D75E6] rounded-lg hover:bg-[#8D75E6]/90"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate with AI
            </button>
          </motion.div>
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

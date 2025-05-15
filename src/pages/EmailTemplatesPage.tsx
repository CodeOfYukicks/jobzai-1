import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { Search, Folder, Heart, Plus, Wand2, Trash2, ArrowLeft, X, Pencil, Mail, LayoutGrid, List as ListIcon } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lastGeneratedTemplateId, setLastGeneratedTemplateId] = useState<string | null>(null);
  
  // Timer to clear the highlight effect
  useEffect(() => {
    if (lastGeneratedTemplateId) {
      const timer = setTimeout(() => {
        setLastGeneratedTemplateId(null);
      }, 5000); // Animation disappears after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [lastGeneratedTemplateId]);

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
      
      // Sort templates by creation date (newest first)
      templatesData.sort((a, b) => {
        // Convert Firebase timestamps to milliseconds if necessary
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : a.createdAt;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : b.createdAt;
        return dateB - dateA; // Descending order
      });
      
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
        
        // Sort templates by creation date (newest first)
        templatesData.sort((a, b) => {
          // Convert Firebase timestamps to milliseconds if necessary
          const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : a.createdAt;
          const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : b.createdAt;
          return dateB - dateA; // Descending order
        });
        
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

  const handleFavorite = async (template: EmailTemplate) => {
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
    return templates
      .filter(template => {
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
          filter === 'ai' ? template.aiGenerated :
          true;

        return matchesSearch && matchesFilter;
      })
      // Sort by creation date (newest first)
      .sort((a, b) => {
        // Convert Firebase timestamps to milliseconds if necessary
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : a.createdAt;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : b.createdAt;
        return dateB - dateA; // Descending order
      });
  }, [templates, filter, searchQuery]);

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Template Studio
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Create, customize and manage your professional email templates.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="group px-4 py-2.5 rounded-xl 
                  bg-purple-100 dark:bg-purple-900/30 
                  hover:bg-purple-200 dark:hover:bg-purple-900/50 
                  transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    AI Generate
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate('/email-templates/new')}
                className="group px-4 py-2.5 rounded-xl 
                  bg-gradient-to-r from-purple-600 to-indigo-600
                  hover:opacity-90 transition-all duration-200
                  shadow-lg shadow-purple-500/20"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">New Template</span>
                </div>
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {templates.length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Templates</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Wand2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {templates.filter(t => t.aiGenerated).length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">AI Generated</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Heart className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {templates.filter(t => t.liked).length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Favorites</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by template name, content or tags..."
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700 rounded-xl
                  focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            {/* View Toggle Buttons */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg flex items-center justify-center ${
                  viewMode === 'grid' 
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label="Grid View"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg flex items-center justify-center ${
                  viewMode === 'list' 
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label="List View"
              >
                <ListIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {['All', 'Favorites', 'AI Generated'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(
                  filterOption === 'AI Generated' 
                    ? 'ai' 
                    : filterOption.toLowerCase() as 'all' | 'favorites' | 'ai'
                )}
                className={`
                  flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${(filter === filterOption.toLowerCase() || (filter === 'ai' && filterOption === 'AI Generated'))
                    ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
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

        {/* Templates (Grid or List) */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 
              rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <Mail className="h-8 w-8 text-purple-600 dark:text-purple-400" />
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
              className="inline-flex items-center px-4 py-2 text-sm font-medium 
                text-white bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate with AI
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                className={`group bg-white dark:bg-gray-800 rounded-xl p-6 
                  border border-gray-200 dark:border-gray-700
                  hover:shadow-lg hover:border-purple-500 dark:hover:border-purple-500
                  transition-all duration-200 relative
                  ${template.id === lastGeneratedTemplateId ? 'z-10' : ''}`}
                animate={template.id === lastGeneratedTemplateId ? {
                  boxShadow: [
                    '0 0 0 0 rgba(147, 51, 234, 0)',
                    '0 0 0 10px rgba(147, 51, 234, 0.3)',
                    '0 0 0 0 rgba(147, 51, 234, 0)'
                  ],
                  scale: [1, 1.03, 1],
                  borderColor: [
                    'rgba(147, 51, 234, 0.5)',
                    'rgba(147, 51, 234, 1)',
                    'rgba(147, 51, 234, 0.5)'
                  ]
                } : {}}
                transition={template.id === lastGeneratedTemplateId ? {
                  duration: 1.8,
                  ease: "easeInOut",
                  times: [0, 0.5, 1],
                  repeat: 2,
                  repeatType: 'loop'
                } : {}}
              >
                {template.id === lastGeneratedTemplateId && (
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    initial={{ opacity: 0.5 }}
                    animate={{ 
                      opacity: [0.5, 1, 0.5],
                      borderColor: ['rgba(147, 51, 234, 0.3)', 'rgba(147, 51, 234, 0.8)', 'rgba(147, 51, 234, 0.3)'],
                      borderWidth: [2, 3, 2],
                      boxShadow: [
                        'inset 0 0 0 0 rgba(147, 51, 234, 0.1)',
                        'inset 0 0 0 3px rgba(147, 51, 234, 0.2)',
                        'inset 0 0 0 0 rgba(147, 51, 234, 0.1)'
                      ]
                    }}
                    transition={{ 
                      duration: 1.8, 
                      ease: "easeInOut",
                      times: [0, 0.5, 1],
                      repeat: 2, 
                      repeatType: 'loop' 
                    }}
                  />
                )}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 truncate max-w-[70%]">
                    {template.name}
                  </h3>
                  {template.aiGenerated && (
                    <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 
                      text-purple-600 dark:text-purple-400 rounded-full">
                      AI
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 break-words pr-2">
                  {template.content}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 
                        text-gray-600 dark:text-gray-400 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFavorite(template)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Heart 
                        className={`h-4 w-4 ${template.liked 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-gray-400 hover:text-red-500'}`} 
                      />
                    </button>
                    <button
                      onClick={() => setTemplateToEdit(template)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Pencil className="h-4 w-4 text-gray-400 hover:text-purple-500" />
                    </button>
                  </div>
                  <button
                    onClick={() => setTemplateToDelete(template)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-2/5">
                      Template
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-2/5">
                      Tags
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/10">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTemplates.map((template) => (
                    <motion.tr 
                      key={template.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 relative"
                      animate={template.id === lastGeneratedTemplateId ? {
                        backgroundColor: [
                          'rgba(147, 51, 234, 0.02)',
                          'rgba(147, 51, 234, 0.12)',
                          'rgba(147, 51, 234, 0.02)'
                        ],
                        boxShadow: [
                          'inset 0 0 0 0 rgba(147, 51, 234, 0)',
                          'inset 0 0 0 1px rgba(147, 51, 234, 0.3)',
                          'inset 0 0 0 0 rgba(147, 51, 234, 0)'
                        ]
                      } : {}}
                      transition={template.id === lastGeneratedTemplateId ? {
                        duration: 1.8,
                        ease: "easeInOut",
                        times: [0, 0.5, 1],
                        repeat: 2,
                        repeatType: 'loop'
                      } : {}}
                    >
                      {template.id === lastGeneratedTemplateId && (
                        <motion.td 
                          className="absolute inset-0 pointer-events-none" 
                          initial={{ opacity: 0 }}
                          animate={{ 
                            opacity: [0.3, 0.6, 0.3]
                          }}
                          transition={{ 
                            duration: 1.8, 
                            ease: "easeInOut",
                            times: [0, 0.5, 1],
                            repeat: 2, 
                            repeatType: 'loop' 
                          }}
                        />
                      )}
                      <td className="px-6 py-4">
                        <div className="flex flex-col cursor-pointer" onClick={() => setTemplateToEdit(template)}>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {template.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[300px]">
                            {template.content}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {template.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 
                                text-gray-600 dark:text-gray-400 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {template.aiGenerated && (
                          <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 
                            text-purple-600 dark:text-purple-400 rounded-full">
                            AI
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFavorite(template);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Heart 
                              className={`h-4 w-4 ${template.liked 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-gray-400 hover:text-red-500'}`} 
                            />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplateToDelete(template);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </button>
                          <button
                            onClick={() => setTemplateToEdit(template)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Pencil className="h-4 w-4 text-gray-400 hover:text-purple-500" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {showGenerateModal && (
            <GenerateTemplateModal 
              onClose={() => setShowGenerateModal(false)} 
              onTemplateCreated={(templateId) => setLastGeneratedTemplateId(templateId)}
            />
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
      </div>
    </AuthLayout>
  );
}

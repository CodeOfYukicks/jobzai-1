import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Heart, FolderOpen, Edit, Trash2 } from 'lucide-react';
import { doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import EditTemplateModal from './EditTemplateModal';

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

interface TemplateCardProps {
  template: EmailTemplate;
  onToggleLike: (id: string, liked: boolean) => Promise<void>;
  onMoveToFolder: (id: string, folder: string) => Promise<void>;
  folders: Array<{ id: string; name: string; }>;
}

export default function TemplateCard({ template, onToggleLike, onMoveToFolder, folders }: TemplateCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { currentUser } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowFolderMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
    setShowFolderMenu(false);
  };

  const handleMoveToFolder = async (folder: string) => {
    try {
      await onMoveToFolder(template.id, folder);
      setShowMenu(false);
      setShowFolderMenu(false);
      toast.success(`Moved to ${folder}`);
    } catch (error) {
      console.error('Error moving template:', error);
      toast.error('Failed to move template');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
            <div className="flex items-center space-x-2">
              {template.aiGenerated && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                  AI Generated
                </span>
              )}
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuClick}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                <div className="py-1">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Template
                  </button>
                  <button
                    onClick={() => onToggleLike(template.id, !template.liked)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Heart
                      className={`h-4 w-4 mr-2 ${template.liked ? 'fill-red-500 text-red-500' : ''}`}
                    />
                    {template.liked ? 'Unlike' : 'Like'}
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowFolderMenu(true)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Move to Folder
                    </button>
                    {showFolderMenu && (
                      <div className="absolute left-full top-0 w-48 ml-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="py-1">
                          {folders.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => handleMoveToFolder(folder.name)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {folder.name}
                              {template.folder === folder.name && (
                                <span className="ml-2 text-[#8D75E6]">•</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Subject:</h4>
          <p className="text-sm text-gray-600">{template.subject}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Content:</h4>
          <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <span>Updated {formatDate(template.updatedAt)}</span>
          <button
            onClick={() => onToggleLike(template.id, !template.liked)}
            className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
          >
            <Heart className={`h-4 w-4 ${template.liked ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditTemplateModal
          template={template}
          onClose={() => setShowEditModal(false)}
          onSave={async (updatedTemplate) => {
            try {
              if (!currentUser) return;
              const templateRef = doc(db, 'users', currentUser.uid, 'emailTemplates', template.id);
              await updateDoc(templateRef, {
                ...updatedTemplate,
                updatedAt: serverTimestamp()
              });
              toast.success('Template updated successfully');
              setShowEditModal(false);
            } catch (error) {
              console.error('Error updating template:', error);
              toast.error('Failed to update template');
            }
          }}
        />
      )}
    </motion.div>
  );
}
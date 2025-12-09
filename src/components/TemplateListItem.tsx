import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Heart, FolderOpen, Edit, Trash2 } from 'lucide-react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
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

interface TemplateListItemProps {
  template: EmailTemplate;
  onToggleLike: (id: string, liked: boolean) => Promise<void>;
  onMoveToFolder: (id: string, folder: string) => Promise<void>;
  folders: Array<{ id: string; name: string; }>;
}

export default function TemplateListItem({ template, onToggleLike, onMoveToFolder, folders }: TemplateListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { currentUser } = useAuth();

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
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

          <div className="flex items-center space-x-4">
            <button
              onClick={() => onToggleLike(template.id, !template.liked)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Heart
                className={`h-5 w-5 ${template.liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
              />
            </button>
            <div className="relative">
              <button
                onClick={handleMenuClick}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="h-5 w-5 text-gray-400" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Template
                    </button>
                    <div className="relative group">
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Move to Folder
                      </button>
                      <div className="absolute left-full top-0 ml-2 hidden group-hover:block">
                        <div className="bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1">
                          {folders.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => onMoveToFolder(template.id, folder.name)}
                              className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {folder.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Updated {formatDate(template.updatedAt)}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditTemplateModal
          template={template}
          onClose={() => setShowEditModal(false)}
          onSubmit={async (updatedTemplate: EmailTemplate) => {
            try {
              if (!currentUser) return;
              const templateRef = doc(db, 'users', currentUser.uid, 'emailTemplates', template.id);
              await updateDoc(templateRef, {
                ...updatedTemplate,
                updatedAt: serverTimestamp()
              });
              notify.success('Template updated successfully');
              setShowEditModal(false);
            } catch (error) {
              console.error('Error updating template:', error);
              notify.error('Failed to update template');
            }
          }}
        />
      )}
    </motion.div>
  );
}

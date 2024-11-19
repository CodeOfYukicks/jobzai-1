import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Edit, Trash2, ChevronLeft, ChevronRight, Undo2, Mail, Sparkles, Clock, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import EditTemplateModal from './EditTemplateModal';
import { toggleTemplateFavorite } from '../lib/templates';

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
  onUpdate: () => void;
  onDelete?: (template: EmailTemplate) => void;
  isMobile: boolean;
}

export default function TemplateCard({ template, onUpdate, onDelete, isMobile }: TemplateCardProps) {
  const { currentUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggleFavorite = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUser) return;
    
    setIsUpdating(true);
    try {
      await toggleTemplateFavorite(currentUser.uid, template.id, template.liked);
      onUpdate();
      toast.success(template.liked ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Version Desktop uniquement
  if (!isMobile) {
    return (
      <motion.div 
        className="group relative 
          bg-white dark:bg-[#353040] 
          rounded-xl 
          border border-gray-200 dark:border-gray-700/30 
          p-6 mb-4 
          hover:bg-gray-50 dark:hover:bg-[#3A3547] 
          transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
      >
        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-full transition-colors ${
              template.liked 
                ? 'text-red-400 bg-red-400/20' 
                : 'text-gray-400 hover:text-red-400 hover:bg-red-400/20'
            }`}
          >
            <Heart className={`h-5 w-5 ${template.liked ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 rounded-full text-gray-400 hover:text-[#8D75E6] hover:bg-[#8D75E6]/20 transition-colors"
          >
            <Edit className="h-5 w-5" />
          </button>

          <button
            onClick={() => onDelete?.(template)}
            className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-400/20 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {template.name}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">
            {template.content}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {template.aiGenerated && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
              bg-purple-100 dark:bg-[#8D75E6]/20 
              text-purple-800 dark:text-[#8D75E6]">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Generated
            </span>
          )}
          {template.tags.map(tag => (
            <span 
              key={tag}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                bg-gray-100 dark:bg-gray-700/50 
                text-gray-600 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    );
  }

  // Version mobile uniquement
  if (isMobile) {
    return (
      <div className="relative mb-4">
        <motion.div
          className="relative bg-white dark:bg-[#353040] rounded-lg shadow-sm
            border border-gray-200 dark:border-gray-700/30"
          initial={false}
          animate={{
            x: 0,
            opacity: 1
          }}
        >
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {template.content}
                </p>
              </div>
              
              {/* Actions mobiles */}
              <div className="flex gap-2">
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-full transition-colors ${
                    template.liked 
                      ? 'text-red-400 bg-red-400/20' 
                      : 'text-gray-400 hover:text-red-400 hover:bg-red-400/20'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${template.liked ? 'fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 rounded-full text-gray-400 hover:text-[#8D75E6] hover:bg-[#8D75E6]/20 transition-colors"
                >
                  <Edit className="h-5 w-5" />
                </button>

                <button
                  onClick={() => onDelete?.(template)}
                  className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-400/20 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {template.tags.map(tag => (
                <span 
                  key={tag}
                  className="px-2 py-1 text-xs rounded-full 
                    bg-gray-100 dark:bg-gray-700/50 
                    text-gray-600 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {showEditModal && (
          <EditTemplateModal
            template={template}
            onClose={() => setShowEditModal(false)}
            onUpdate={onUpdate}
          />
        )}
      </div>
    );
  }
}

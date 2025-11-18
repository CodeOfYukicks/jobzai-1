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
            className="p-2 rounded-full text-gray-400 hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/20 transition-colors"
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
              bg-purple-100 dark:bg-[hsl(var(--primary))]/20 
              text-purple-800 dark:text-[hsl(var(--primary))]">
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
      <div className="relative mb-3.5">
        <motion.div
          className="relative overflow-hidden
            bg-white/95 dark:bg-[#353040]/95 
            backdrop-blur-sm
            rounded-2xl
            border border-gray-100/50 dark:border-gray-700/30
            shadow-sm"
        >
          {/* Header plus compact */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex-1 min-w-0"> {/* Évite le débordement */}
                <div className="flex items-center gap-2 mb-2">
                  {template.aiGenerated && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium 
                      bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI
                    </span>
                  )}
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                  {template.name}
                </h3>
              </div>

              {/* Actions plus accessibles */}
              <div className="flex items-center gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-xl ${
                    template.liked 
                      ? 'text-red-400 bg-red-400/10' 
                      : 'text-gray-400'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${template.liked ? 'fill-current' : ''}`} />
                </motion.button>
              </div>
            </div>

            {/* Contenu plus lisible */}
            <div className="mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                {template.content}
              </p>
            </div>

            {/* Actions et tags en bas */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/30">
              <div className="flex gap-1.5">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEditModal(true)}
                  className="p-2 rounded-lg text-gray-400 
                    hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 
                    active:bg-[hsl(var(--primary))]/20
                    transition-all duration-200"
                >
                  <Edit className="h-4.5 w-4.5" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDelete?.(template)}
                  className="p-2 rounded-lg text-gray-400 
                    hover:text-red-400 hover:bg-red-400/10
                    active:bg-red-400/20
                    transition-all duration-200"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </motion.button>
              </div>
              
              <div className="flex gap-1.5">
                {template.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-xs rounded-md 
                    bg-gray-100/80 dark:bg-gray-700/50 
                    text-gray-600 dark:text-gray-300">
                    {tag}
                  </span>
                ))}
                {template.tags.length > 2 && (
                  <span className="text-xs text-gray-400">
                    +{template.tags.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Modal d'édition */}
        <AnimatePresence>
          {showEditModal && (
            <EditTemplateModal
              template={template}
              onClose={() => setShowEditModal(false)}
              onUpdate={onUpdate}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }
}

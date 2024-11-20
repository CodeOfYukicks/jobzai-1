import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { Heart, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import EditTemplateModal from './EditTemplateModal';
import { toggleTemplateFavorite } from '../lib/templates';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  liked: boolean;
  tags: string[];
}

interface MobileTemplateCardProps {
  template: EmailTemplate;
  onUpdate: () => void;
  onDelete?: (template: EmailTemplate) => void;
}

export default function MobileTemplateCard({ template, onUpdate, onDelete }: MobileTemplateCardProps) {
  const { currentUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleToggleFavorite = async () => {
    if (!currentUser) return;
    try {
      await toggleTemplateFavorite(currentUser.uid, template.id, template.liked);
      onUpdate();
      toast.success(template.liked ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => onDelete?.(template),
    onSwipedRight: handleToggleFavorite,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  return (
    <div {...handlers} className="relative mb-4">
      <motion.div
        className="relative bg-white dark:bg-[#353040] rounded-lg shadow-sm
          border border-gray-200 dark:border-gray-700/30"
        initial={false}
        animate={{
          x: 0,
          opacity: 1
        }}
        onClick={() => setShowEditModal(true)}
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

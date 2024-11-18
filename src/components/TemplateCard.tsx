import { useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Heart, FolderOpen, Edit, Trash2 } from 'lucide-react';
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
  const controls = useAnimation();
  const swipeThreshold = 100;
  const [isSwipedLeftEnough, setIsSwipedLeftEnough] = useState(false);
  const [isSwipedRightEnough, setIsSwipedRightEnough] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleClick = () => {
    if (!isDragging) {
      setShowEditModal(true);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    if (offset < -swipeThreshold) {
      await controls.start({ x: -100 });
      setIsSwipedLeftEnough(true);
      setIsSwipedRightEnough(false);
    } else if (offset > swipeThreshold) {
      await controls.start({ x: 100 });
      setIsSwipedRightEnough(true);
      setIsSwipedLeftEnough(false);
    } else {
      await controls.start({ x: 0 });
      setIsSwipedLeftEnough(false);
      setIsSwipedRightEnough(false);
    }
    
    // Reset drag state after a small delay
    setTimeout(() => {
      setIsDragging(false);
    }, 100);
  };

  if (isMobile) {
    return (
      <div className="relative">
        {/* Delete background (gauche) */}
        <div 
          className="absolute top-0 bottom-0 right-0 w-[100px] flex items-center justify-center bg-red-500 rounded-r-lg"
          onClick={() => {
            if (isSwipedLeftEnough) {
              onDelete?.(template);
            }
          }}
        >
          <Trash2 className="h-6 w-6 text-white" />
        </div>

        {/* Favorite background (droite) */}
        <div 
          className="absolute top-0 bottom-0 left-0 w-[100px] flex items-center justify-center bg-green-500 rounded-l-lg"
          onClick={() => {
            if (isSwipedRightEnough) {
              handleToggleFavorite();
            }
          }}
        >
          <Heart className={`h-6 w-6 ${template.liked ? 'fill-white' : ''} text-white`} />
        </div>

        {/* Swipeable card - Now clickable for edit */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -100, right: 100 }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          animate={controls}
          onClick={handleClick}
          className="relative bg-white rounded-lg shadow-sm border p-4 active:bg-gray-50"
          style={{ zIndex: 1, touchAction: 'pan-x' }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {template.folder && (
              <span className="flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                <FolderOpen className="h-3 w-3 mr-1" />
                {template.folder}
              </span>
            )}
            {template.aiGenerated && (
              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                AI Generated
              </span>
            )}
            {template.tags.map(tag => (
              <span 
                key={tag}
                className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
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

  return (
    <div className="relative bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleFavorite}
            disabled={isUpdating}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Heart 
              className={`h-5 w-5 ${
                template.liked 
                  ? 'fill-current text-red-500' 
                  : 'text-gray-400 hover:text-red-500'
              }`}
            />
          </button>
          
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Edit className="h-5 w-5 text-gray-400" />
          </button>

          {/* Desktop delete button */}
          <button
            onClick={() => onDelete?.(template)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Trash2 className="h-5 w-5 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {template.folder && (
          <span className="flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            <FolderOpen className="h-3 w-3 mr-1" />
            {template.folder}
          </span>
        )}
        {template.aiGenerated && (
          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
            AI Generated
          </span>
        )}
        {template.tags.map(tag => (
          <span 
            key={tag}
            className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
          >
            {tag}
          </span>
        ))}
      </div>

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

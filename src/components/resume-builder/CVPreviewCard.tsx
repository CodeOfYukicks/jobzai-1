import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { flushSync, createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Calendar, Trash2, Edit2, Eye, Check, Tag
} from 'lucide-react';
import { CVData, CVLayoutSettings } from '../../types/cvEditor';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '../../lib/cvEditorUtils';
import ModernProfessional from '../cv-editor/templates/ModernProfessional';
import ExecutiveClassic from '../cv-editor/templates/ExecutiveClassic';
import TechMinimalist from '../cv-editor/templates/TechMinimalist';
import CreativeBalance from '../cv-editor/templates/CreativeBalance';
import { Resume } from '../../pages/ResumeBuilderPage';

interface CVPreviewCardProps {
  resume: Resume;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onEdit: (id: string) => void;
  onUpdateTags?: (id: string, tags: string[]) => void;
  compact?: boolean;
  draggable?: boolean;
}

const TAG_COLORS = [
  { id: 'red', color: '#EF4444', label: 'Red' },
  { id: 'orange', color: '#F97316', label: 'Orange' },
  { id: 'yellow', color: '#EAB308', label: 'Yellow' },
  { id: 'green', color: '#22C55E', label: 'Green' },
  { id: 'blue', color: '#3B82F6', label: 'Blue' },
  { id: 'purple', color: '#A855F7', label: 'Purple' },
  { id: 'gray', color: '#6B7280', label: 'Gray' },
];

// Default layout settings
const defaultLayoutSettings: CVLayoutSettings = {
  fontSize: 10,
  dateFormat: 'jan-24',
  lineHeight: 1.3,
  fontFamily: 'Inter',
  accentColor: 'blue'
};

// Check if CV has content
const hasContent = (cvData: CVData): boolean => {
  return !!(
    cvData.personalInfo.firstName ||
    cvData.personalInfo.lastName ||
    cvData.personalInfo.email ||
    cvData.summary ||
    cvData.experiences.length > 0 ||
    cvData.education.length > 0 ||
    cvData.skills.length > 0
  );
};

// Get template component
const getTemplateComponent = (template?: string) => {
  switch (template) {
    case 'executive-classic':
      return ExecutiveClassic;
    case 'tech-minimalist':
      return TechMinimalist;
    case 'creative-balance':
      return CreativeBalance;
    case 'modern-professional':
    default:
      return ModernProfessional;
  }
};

function formatDateString(dateInput: any): string {
  if (!dateInput) return 'Unknown date';
  
  try {
    let date: Date;
    
    if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      return 'Unknown date';
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
}

// Skeleton Loader Component
const SkeletonPreview = memo(() => (
  <div className="w-full h-full flex flex-col p-8 bg-white">
    {/* Header area */}
    <div className="flex gap-4 mb-8">
      <div className="w-16 h-16 rounded-full bg-gray-100" />
      <div className="flex-1 space-y-3 py-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-50 rounded w-1/2" />
      </div>
    </div>
    
    {/* Content blocks */}
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-3 bg-gray-100 rounded w-1/4 mb-4" />
          <div className="space-y-2">
            <div className="h-2 bg-gray-50 rounded w-full" />
            <div className="h-2 bg-gray-50 rounded w-5/6" />
            <div className="h-2 bg-gray-50 rounded w-4/6" />
          </div>
        </div>
      ))}
    </div>

    {/* Empty State Overlay */}
    <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
       <div className="bg-white/90 backdrop-blur-sm px-10 py-8 rounded-2xl shadow-lg border-2 border-gray-200 flex items-center gap-6">
         <Sparkles className="w-16 h-16 text-purple-500" />
         <span className="text-8xl font-bold text-gray-900">Empty Template</span>
       </div>
    </div>
  </div>
));

SkeletonPreview.displayName = 'SkeletonPreview';

const CVPreviewCard = memo(({
  resume,
  onDelete,
  onRename,
  onEdit,
  onUpdateTags,
  compact = false,
  draggable = true
}: CVPreviewCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(resume.name);
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 });
  const nameInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Calculate scale factor - A4 page preview
  const targetWidth = compact ? 140 : 220; 
  const scale = targetWidth / A4_WIDTH_PX; 
  const scaledHeight = A4_HEIGHT_PX * scale;
  const scaledWidth = A4_WIDTH_PX * scale;
  
  const TemplateComponent = getTemplateComponent(resume.template);
  const layoutSettings = resume.layoutSettings || defaultLayoutSettings;
  const hasCVContent = hasContent(resume.cvData);

  const handleEdit = () => {
    onEdit(resume.id);
  };

  const confirmDelete = () => {
    onDelete(resume.id);
    setIsDeleteDialogOpen(false);
  };

  const handleToggleTag = (colorId: string) => {
    if (!onUpdateTags) return;
    
    const currentTags = resume.tags || [];
    const newTags = currentTags.includes(colorId)
      ? currentTags.filter(t => t !== colorId)
      : [...currentTags, colorId];
      
    onUpdateTags(resume.id, newTags);
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingName(true);
    setEditedName(resume.name);
  };

  const handleNameBlur = () => {
    if (editedName.trim() && editedName !== resume.name) {
      onRename(resume.id, editedName.trim());
    } else {
      setEditedName(resume.name);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      nameInputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setEditedName(resume.name);
      setIsEditingName(false);
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position ensuring menu stays on screen
    const x = e.clientX;
    const y = e.clientY;
    
    // Adjust if menu would go off-screen (assuming menu is ~160px wide and ~200px tall)
    const menuWidth = 160;
    const menuHeight = 200;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);
    
    flushSync(() => {
      setContextMenu({ open: true, x: adjustedX, y: adjustedY });
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, open: false }));
  }, []);

  const handleDeleteFromContext = useCallback(() => {
    closeContextMenu();
    setIsDeleteDialogOpen(true);
  }, [closeContextMenu]);

  // Handle click outside to close context menu
  useEffect(() => {
    if (!contextMenu.open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    window.document.addEventListener('mousedown', handleClickOutside, true);
    window.document.addEventListener('contextmenu', closeContextMenu, true);
    
    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside, true);
      window.document.removeEventListener('contextmenu', closeContextMenu, true);
    };
  }, [contextMenu.open, closeContextMenu]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', resume.id);
    e.dataTransfer.setData('application/x-resume-id', resume.id);
    e.dataTransfer.effectAllowed = 'move';
    
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      width: 80px;
      height: 100px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #666;
      position: absolute;
      top: -1000px;
      left: -1000px;
    `;
    dragImage.textContent = resume.name.slice(0, 15) + (resume.name.length > 15 ? '...' : '');
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 40, 50);
    
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 100);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      className={`group relative flex flex-col items-center p-4 rounded-xl transition-all duration-300 cursor-pointer`}
      onClick={handleEdit}
      onContextMenu={handleContextMenu}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
    >
      {/* Document Preview */}
      <div 
        className={`relative mb-4`}
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
        }}
      >
        {/* Colored Glow Effect */}
        <div 
          className="absolute -inset-4 rounded-lg opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500 -z-30"
          style={{
            background: `radial-gradient(circle at center, ${layoutSettings.accentColor === 'blue' ? 'rgba(59, 130, 246, 0.3)' : layoutSettings.accentColor === 'purple' ? 'rgba(168, 85, 247, 0.3)' : layoutSettings.accentColor === 'green' ? 'rgba(34, 197, 94, 0.3)' : layoutSettings.accentColor === 'orange' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(139, 92, 246, 0.3)'}, transparent 70%)`
          }}
        />

        {/* Enhanced Stack effect layers */}
        <div className="absolute top-0 left-0 w-full h-full bg-white/80 dark:bg-gray-700/80 rounded-[3px] transform translate-y-1.5 translate-x-1.5 opacity-0 group-hover:opacity-60 transition-all duration-300 -z-10 shadow-sm" />
        <div className="absolute top-0 left-0 w-full h-full bg-white/60 dark:bg-gray-600/60 rounded-[3px] transform translate-y-3 translate-x-3 opacity-0 group-hover:opacity-40 transition-all duration-300 -z-20 shadow-sm" />

        <div
          className="relative w-full h-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)] transition-all duration-300 overflow-hidden rounded-[3px] ring-1 ring-black/5 group-hover:ring-black/10"
        >
           {/* Glass Action Bar - Appears at bottom on hover */}
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 0, y: 10 }}
             whileHover={{ opacity: 1, y: 0 }}
             className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300"
           >
             <div className="flex items-center gap-1 px-2 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-full shadow-xl border border-black/5 dark:border-white/10">
               <motion.button
                 onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                 whileHover={{ scale: 1.1 }}
                 whileTap={{ scale: 0.9 }}
                 className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-all"
                 title="Edit"
               >
                 <Edit2 className="w-3.5 h-3.5" />
               </motion.button>
               <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
               <motion.button
                 onClick={(e) => { e.stopPropagation(); handleNameClick(e); }}
                 whileHover={{ scale: 1.1 }}
                 whileTap={{ scale: 0.9 }}
                 className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                 title="Rename"
               >
                 <Sparkles className="w-3.5 h-3.5" />
               </motion.button>
               <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
               <motion.button
                 onClick={(e) => { e.stopPropagation(); confirmDelete(); }}
                 whileHover={{ scale: 1.1 }}
                 whileTap={{ scale: 0.9 }}
                 className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                 title="Delete"
               >
                 <Trash2 className="w-3.5 h-3.5" />
               </motion.button>
             </div>
           </motion.div>

          <div
            style={{
              width: `${A4_WIDTH_PX}px`,
              height: `${A4_HEIGHT_PX}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {hasCVContent ? (
                <div className="w-full h-full bg-white p-[40px]">
                    <TemplateComponent
                        cvData={resume.cvData}
                        layoutSettings={layoutSettings}
                    />
                </div>
            ) : (
                <SkeletonPreview />
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full flex flex-col items-center gap-1">
        {/* Tags Display */}
        {resume.tags && resume.tags.length > 0 && (
          <div className="flex items-center gap-1 mb-1">
            {resume.tags.map(tagId => {
              const tagColor = TAG_COLORS.find(t => t.id === tagId)?.color;
              if (!tagColor) return null;
              return (
                <div
                  key={tagId}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tagColor }}
                  title={TAG_COLORS.find(t => t.id === tagId)?.label}
                />
              );
            })}
          </div>
        )}

        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-b border-purple-500 focus:outline-none text-center w-full px-1"
          />
        ) : (
          <h3 
            className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px] cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            onClick={handleNameClick}
            title={resume.name}
          >
            {resume.name}
          </h3>
        )}
        
        {!compact && (
            <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateString(resume.updatedAt || resume.createdAt)}
                </span>
                {resume.template && (
                    <>
                        <span>•</span>
                        <span className="capitalize">{resume.template.replace('-', ' ')}</span>
                    </>
                )}
            </div>
        )}
      </div>

      {/* Context Menu - Using Portal to escape transform hierarchy */}
      {contextMenu.open && typeof window !== 'undefined' && window.document?.body && createPortal(
        <div
          ref={contextMenuRef}
          className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-xl
            border border-gray-200 dark:border-gray-700 py-1 min-w-[140px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {onUpdateTags && (
            <>
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between gap-1">
                  {TAG_COLORS.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleToggleTag(tag.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`w-4 h-4 rounded-full transition-transform hover:scale-110 flex items-center justify-center
                        ${resume.tags?.includes(tag.id) ? 'ring-1 ring-offset-1 ring-gray-400 dark:ring-gray-500' : ''}`}
                      style={{ backgroundColor: tag.color }}
                      title={tag.label}
                    >
                      {resume.tags?.includes(tag.id) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

           <button
            onMouseDown={(e) => {
              e.stopPropagation();
              closeContextMenu();
              handleEdit();
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200
              hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              handleDeleteFromContext();
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>,
        window.document.body
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsDeleteDialogOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Resume?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete "{resume.name}"? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                    hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 
                    rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

CVPreviewCard.displayName = 'CVPreviewCard';

export default CVPreviewCard;

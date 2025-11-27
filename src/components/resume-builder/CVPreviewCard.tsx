import { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Calendar, Trash2
} from 'lucide-react';
import { CVData, CVLayoutSettings, CVTemplate } from '../../types/cvEditor';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '../../lib/cvEditorUtils';
import ModernProfessional from '../cv-editor/templates/ModernProfessional';
import ExecutiveClassic from '../cv-editor/templates/ExecutiveClassic';
import TechMinimalist from '../cv-editor/templates/TechMinimalist';
import CreativeBalance from '../cv-editor/templates/CreativeBalance';

interface Resume {
  id: string;
  name: string;
  cvData: CVData;
  createdAt: any;
  updatedAt: any;
  template?: string;
  layoutSettings?: CVLayoutSettings;
}

interface CVPreviewCardProps {
  resume: Resume;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onEdit: (id: string) => void;
}

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

const CVPreviewCard = memo(({
  resume,
  onDelete,
  onRename,
  onEdit
}: CVPreviewCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(resume.name);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const nameInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate scale factor - A4 page preview
  // Use a fixed scale that ensures good visibility
  const targetWidth = 220; // Target preview width for grid (reduced from 260)
  const scale = targetWidth / A4_WIDTH_PX; // Scale based on target width
  const scaledHeight = A4_HEIGHT_PX * scale;
  const scaledWidth = A4_WIDTH_PX * scale;
  
  // Get template component
  const TemplateComponent = getTemplateComponent(resume.template);
  
  // Get layout settings
  const layoutSettings = resume.layoutSettings || defaultLayoutSettings;
  
  // Check if CV has content
  const hasCVContent = hasContent(resume.cvData);

  const handleEdit = () => {
    onEdit(resume.id);
  };

  const confirmDelete = () => {
    onDelete(resume.id);
    setIsDeleteDialogOpen(false);
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  };

  const handleDeleteFromContext = () => {
    setContextMenuOpen(false);
    setIsDeleteDialogOpen(true);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuOpen(false);
    };

    if (contextMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenuOpen]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="group relative bg-transparent dark:bg-transparent rounded-lg p-3
        cursor-pointer transition-all duration-150
        flex flex-col items-center"
      onClick={handleEdit}
      onContextMenu={handleContextMenu}
    >
      {/* A4 Page Preview - Direct, no box */}
      <div 
        className="relative flex items-start justify-center mb-3 w-full"
      >
        <div
          className="relative"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
          }}
        >
          {hasCVContent ? (
            <div
              className="bg-white shadow-lg overflow-hidden"
              style={{
                width: `${A4_WIDTH_PX}px`,
                minHeight: `${A4_HEIGHT_PX}px`,
                padding: '40px',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                pointerEvents: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '2px'
              }}
            >
              <TemplateComponent
                cvData={resume.cvData}
                layoutSettings={layoutSettings}
              />
            </div>
          ) : (
            <div 
              className="bg-white shadow-lg flex flex-col items-center justify-center overflow-hidden"
              style={{
                width: `${A4_WIDTH_PX}px`,
                height: `${A4_HEIGHT_PX}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '2px'
              }}
            >
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700/50 
                flex items-center justify-center mb-2">
                <Sparkles className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Empty Resume
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Click to start editing
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resume Name and Metadata - Minimal, centered */}
      <div className="w-full flex flex-col items-center">
        <div className="w-full mb-1.5 flex justify-center">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-gray-900 dark:text-white 
                bg-transparent border-b-2 border-blue-500 dark:border-blue-400
                focus:outline-none text-center w-full max-w-[200px] px-1"
            />
          ) : (
            <h3 
              className="text-sm font-medium text-gray-900 dark:text-white truncate 
                cursor-text hover:text-blue-600 dark:hover:text-blue-400 transition-colors
                px-2 py-1 rounded"
              onClick={handleNameClick}
              title="Click to rename"
            >
              {resume.name}
            </h3>
          )}
        </div>

        {/* Minimal metadata - centered */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {resume.template && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700/50 
              text-gray-600 dark:text-gray-400 font-medium">
              {resume.template.replace('-', ' ')}
            </span>
          )}
          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDateString(resume.updatedAt || resume.createdAt)}
          </span>
        </div>
      </div>

      {/* Context Menu for Delete */}
      <AnimatePresence>
        {contextMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl
              border border-gray-200 dark:border-gray-700 py-1 min-w-[140px]"
            style={{
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFromContext();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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


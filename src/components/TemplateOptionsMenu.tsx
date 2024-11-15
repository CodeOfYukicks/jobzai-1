import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TemplateOptionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onMove: () => void;
  folders: string[];
}

export default function TemplateOptionsMenu({ onEdit, onDelete, onMove, folders }: TemplateOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowFolderMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20"
          >
            <div className="py-1">
              <button
                onClick={onEdit}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowFolderMenu(true)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Move to Folder
                </button>
                {showFolderMenu && folders.length > 0 && (
                  <div className="absolute left-full top-0 w-48 ml-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      {folders.map((folder) => (
                        <button
                          key={folder}
                          onClick={() => {
                            onMove();
                            setIsOpen(false);
                            setShowFolderMenu(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {folder}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={onDelete}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Template
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
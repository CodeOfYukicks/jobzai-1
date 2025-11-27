import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, Folder, Briefcase, Target, Star, Heart, Zap, Rocket, BookOpen, Code, Palette } from 'lucide-react';
import { toast } from 'sonner';

export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  coverPhoto?: string;
  order: number;
  createdAt: any;
  updatedAt: any;
}

interface FolderManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingFolder?: Folder | null;
  isSaving?: boolean;
}

// Emoji options for folders
const EMOJI_OPTIONS = ['📁', '💼', '🎯', '⭐', '🚀', '💡', '📚', '🎨', '💻', '🔥', '✨', '🎪'];

// Lucide icon options
const ICON_OPTIONS = [
  { name: 'Folder', component: Folder },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Target', component: Target },
  { name: 'Star', component: Star },
  { name: 'Heart', component: Heart },
  { name: 'Zap', component: Zap },
  { name: 'Rocket', component: Rocket },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Code', component: Code },
  { name: 'Palette', component: Palette },
];

// Premium color palette
const COLOR_PALETTE = [
  { name: 'Purple', value: '#8B5CF6', light: '#F3E8FF', dark: '#6D28D9' },
  { name: 'Blue', value: '#3B82F6', light: '#DBEAFE', dark: '#2563EB' },
  { name: 'Green', value: '#10B981', light: '#D1FAE5', dark: '#059669' },
  { name: 'Orange', value: '#F59E0B', light: '#FEF3C7', dark: '#D97706' },
  { name: 'Pink', value: '#EC4899', light: '#FCE7F3', dark: '#DB2777' },
  { name: 'Indigo', value: '#6366F1', light: '#E0E7FF', dark: '#4F46E5' },
  { name: 'Teal', value: '#14B8A6', light: '#CCFBF1', dark: '#0D9488' },
  { name: 'Red', value: '#EF4444', light: '#FEE2E2', dark: '#DC2626' },
];

export default function FolderManagementModal({
  isOpen,
  onClose,
  onSave,
  editingFolder,
  isSaving = false
}: FolderManagementModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState(COLOR_PALETTE[0].value);
  const [iconType, setIconType] = useState<'emoji' | 'lucide'>('emoji');
  const [selectedLucideIcon, setSelectedLucideIcon] = useState('Folder');

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      // Check if icon is emoji or lucide
      if (EMOJI_OPTIONS.includes(editingFolder.icon)) {
        setIconType('emoji');
        setIcon(editingFolder.icon);
      } else {
        setIconType('lucide');
        setSelectedLucideIcon(editingFolder.icon);
        setIcon(editingFolder.icon);
      }
      setColor(editingFolder.color);
    } else {
      setName('');
      setIcon('📁');
      setColor(COLOR_PALETTE[0].value);
      setIconType('emoji');
      setSelectedLucideIcon('Folder');
    }
  }, [editingFolder, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    const finalIcon = iconType === 'emoji' ? icon : selectedLucideIcon;
    
    await onSave({
      name: name.trim(),
      icon: finalIcon,
      color,
      order: editingFolder?.order || 0
    });
  };

  const selectedColorData = COLOR_PALETTE.find(c => c.value === color) || COLOR_PALETTE[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: "100%" }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: "100%" }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#121212] w-full sm:rounded-2xl rounded-t-2xl max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl z-10 sticky top-0">
            <div>
              <h2 className="font-semibold text-xl text-gray-900 dark:text-white tracking-tight">
                {editingFolder ? 'Edit Folder' : 'Create New Folder'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Organize your resumes with custom folders
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 space-y-6">
            {/* Folder Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim() && !isSaving) {
                    handleSave();
                  }
                }}
                placeholder="e.g., Software Engineering, Marketing, etc."
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 
                  rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                  transition-all shadow-sm"
                autoFocus
              />
            </div>

            {/* Icon Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Choose Icon Type
              </label>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setIconType('emoji')}
                  className={`flex-1 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium
                    ${
                      iconType === 'emoji'
                        ? 'border-purple-500/50 dark:border-purple-400/50 bg-purple-50/50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                >
                  Emoji
                </button>
                <button
                  onClick={() => setIconType('lucide')}
                  className={`flex-1 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium
                    ${
                      iconType === 'lucide'
                        ? 'border-purple-500/50 dark:border-purple-400/50 bg-purple-50/50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                >
                  Icon
                </button>
              </div>

              {/* Emoji Picker */}
              {iconType === 'emoji' && (
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setIcon(emoji)}
                      className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center text-2xl
                        ${
                          icon === emoji
                            ? 'border-purple-500/50 dark:border-purple-400/50 bg-purple-50/50 dark:bg-purple-900/10 scale-110'
                            : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] hover:border-gray-300 dark:hover:border-gray-700 hover:scale-105'
                        }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Lucide Icon Picker */}
              {iconType === 'lucide' && (
                <div className="grid grid-cols-5 gap-2">
                  {ICON_OPTIONS.map((iconOption) => {
                    const IconComponent = iconOption.component;
                    const isSelected = selectedLucideIcon === iconOption.name;
                    return (
                      <button
                        key={iconOption.name}
                        onClick={() => setSelectedLucideIcon(iconOption.name)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center
                          ${
                            isSelected
                              ? 'border-purple-500/50 dark:border-purple-400/50 bg-purple-50/50 dark:bg-purple-900/10'
                              : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                        style={isSelected ? { color: color } : {}}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Choose Color
              </label>
              <div className="grid grid-cols-4 gap-3">
                {COLOR_PALETTE.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    onClick={() => setColor(colorOption.value)}
                    className={`relative h-14 rounded-xl border-2 transition-all overflow-hidden group
                      ${
                        color === colorOption.value
                          ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-purple-500 dark:ring-purple-400 shadow-md scale-105'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:scale-105'
                      }`}
                    style={{ backgroundColor: colorOption.value }}
                    title={colorOption.name}
                  >
                    {color === colorOption.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/20"
                      >
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Preview
              </label>
              <div
                className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-800"
                style={{
                  background: `linear-gradient(135deg, ${selectedColorData.light}20 0%, ${selectedColorData.dark}10 100%)`,
                  borderColor: color + '40'
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: color + '20', color: color }}
                  >
                    {iconType === 'emoji' ? icon : (() => {
                      const IconComponent = ICON_OPTIONS.find(i => i.name === selectedLucideIcon)?.component || Folder;
                      return <IconComponent className="w-5 h-5" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {name || 'Folder Name'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      0 resumes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl sticky bottom-0">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors
                disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700
                rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {editingFolder ? 'Save Changes' : 'Create Folder'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



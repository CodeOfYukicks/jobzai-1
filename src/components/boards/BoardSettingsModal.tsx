import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  Check,
  Palette,
  Type,
  Image as ImageIcon,
  Columns,
  AlertTriangle,
  Briefcase,
  Send,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { KanbanBoard, CustomColumn, BOARD_COLORS, BoardType, BOARD_TYPE_COLUMNS, CAMPAIGN_COLUMN_LABELS, JOB_COLUMN_LABELS } from '../../types/job';

// Popular emoji suggestions for boards
const EMOJI_SUGGESTIONS_JOBS = ['📋', '💼', '🎯', '🚀', '⭐', '💡', '📊', '🏆', '💪', '📈', '✨', '🔥'];
const EMOJI_SUGGESTIONS_CAMPAIGNS = ['📨', '✉️', '🎯', '🚀', '💬', '🤝', '📬', '💡', '🔔', '📣', '🎪', '🌟'];

// Premium Unsplash cover photos - curated collection
const COVER_PHOTOS = [
  // Abstract & Gradients
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=800&h=400&fit=crop',
  // Nature & Landscapes
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=400&fit=crop',
  // Workspace & Professional
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
  // Minimal & Clean
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&h=400&fit=crop',
];

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (board: Partial<KanbanBoard>) => Promise<void>;
  onDelete?: () => Promise<void>;
  board?: KanbanBoard | null;
  mode: 'create' | 'edit';
}

export default function BoardSettingsModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  board,
  mode,
}: BoardSettingsModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState(BOARD_COLORS[0]);
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>(undefined);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [boardType, setBoardType] = useState<BoardType>('jobs');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [activeSection, setActiveSection] = useState<'basics' | 'appearance' | 'columns'>('basics');

  // Reset form when modal opens or board changes
  useEffect(() => {
    if (isOpen) {
      if (board && mode === 'edit') {
        setName(board.name);
        setDescription(board.description || '');
        setIcon(board.icon || '');
        setColor(board.color || BOARD_COLORS[0]);
        setCoverPhoto(board.coverPhoto);
        setCustomColumns(board.customColumns || []);
        setBoardType(board.boardType || 'jobs');
        setStep('details'); // Skip type selection in edit mode
      } else {
        setName('');
        setDescription('');
        setIcon('');
        setColor(BOARD_COLORS[0]);
        setCoverPhoto(undefined);
        setCustomColumns([]);
        setBoardType('jobs');
        setStep('type'); // Start with type selection in create mode
      }
      setShowDeleteConfirm(false);
      setNewColumnName('');
      setActiveSection('basics');
    }
  }, [isOpen, board, mode]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const boardData: Partial<KanbanBoard> = {
        name: name.trim(),
        color,
        boardType,
      };
      
      if (description.trim()) {
        boardData.description = description.trim();
      }
      if (icon) {
        boardData.icon = icon;
      }
      if (coverPhoto) {
        boardData.coverPhoto = coverPhoto;
      }
      if (customColumns.length > 0) {
        boardData.customColumns = customColumns;
      }
      
      await onSave(boardData);
      onClose();
    } catch (error) {
      console.error('Error saving board:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting board:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const addCustomColumn = () => {
    if (!newColumnName.trim()) return;

    const newColumn: CustomColumn = {
      id: crypto.randomUUID(),
      name: newColumnName.trim(),
      color: BOARD_COLORS[customColumns.length % BOARD_COLORS.length],
      order: customColumns.length,
    };

    setCustomColumns([...customColumns, newColumn]);
    setNewColumnName('');
  };

  const removeCustomColumn = (id: string) => {
    setCustomColumns(customColumns.filter(c => c.id !== id));
  };

  const updateColumnColor = (id: string, newColor: string) => {
    setCustomColumns(customColumns.map(c => 
      c.id === id ? { ...c, color: newColor } : c
    ));
  };

  const handleSelectType = (type: BoardType) => {
    setBoardType(type);
    // Set default icon based on type
    setIcon(type === 'jobs' ? '💼' : '📨');
    // Set default color based on type
    setColor(type === 'jobs' ? BOARD_COLORS[0] : BOARD_COLORS[4]); // Indigo for jobs, Purple for campaigns
    setStep('details');
  };

  if (!isOpen) return null;

  const sections = [
    { id: 'basics', label: 'Basics', icon: Type },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'columns', label: 'Columns', icon: Columns },
  ] as const;

  const emojiSuggestions = boardType === 'jobs' ? EMOJI_SUGGESTIONS_JOBS : EMOJI_SUGGESTIONS_CAMPAIGNS;
  const columnLabels = boardType === 'jobs' ? JOB_COLUMN_LABELS : CAMPAIGN_COLUMN_LABELS;
  const standardColumns = BOARD_TYPE_COLUMNS[boardType];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Type Selection (only in create mode) */}
            {step === 'type' && mode === 'create' && (
              <motion.div
                key="type-selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <div className="relative px-6 py-6 border-b border-gray-100 dark:border-gray-800">
                  <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Create New Board
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    What type of board do you want to create?
                  </p>
                </div>

                {/* Type Cards */}
                <div className="p-6 space-y-4">
                  {/* Jobs Board Type */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectType('jobs')}
                    className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#635BFF] dark:hover:border-[#635BFF] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 transition-all group text-left"
                  >
                    <div className="flex items-start gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#635BFF] to-[#8B5CF6] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#635BFF]/20">
                        <Briefcase className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Job Applications
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-[#635BFF]/10 text-[#635BFF] text-xs font-medium">
                            Classic
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Track applications to job postings with a traditional workflow
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.values(JOB_COLUMN_LABELS).map((label) => (
                            <span
                              key={label}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#635BFF] group-hover:translate-x-1 transition-all flex-shrink-0 mt-5" />
                    </div>
                  </motion.button>

                  {/* Campaigns Board Type */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectType('campaigns')}
                    className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#8B5CF6] dark:hover:border-[#8B5CF6] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 transition-all group text-left"
                  >
                    <div className="flex items-start gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#8B5CF6]/20">
                        <Send className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Outreach Campaigns
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs font-medium">
                            Prospecting
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Manage spontaneous applications and outreach campaigns
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.values(CAMPAIGN_COLUMN_LABELS).map((label) => (
                            <span
                              key={label}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#8B5CF6] group-hover:translate-x-1 transition-all flex-shrink-0 mt-5" />
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Board Details */}
            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Premium Header with Preview */}
                <div className="relative">
                  {/* Cover Preview */}
                  <div 
                    className="h-28 w-full overflow-hidden"
                    style={{ 
                      background: coverPhoto 
                        ? `url(${coverPhoto}) center/cover`
                        : `linear-gradient(135deg, ${color}40 0%, ${color}20 50%, transparent 100%)`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-gray-900" />
                  </div>
                  
                  {/* Floating Icon */}
                  <div className="absolute left-6 bottom-0 translate-y-1/2">
                    <motion.div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl ring-4 ring-white dark:ring-gray-900"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      {icon || <Sparkles className="w-7 h-7 text-white" />}
                    </motion.div>
                  </div>

                  {/* Back Button (only in create mode) */}
                  {mode === 'create' && (
                    <button
                      onClick={() => setStep('type')}
                      className="absolute top-4 left-4 p-2 rounded-xl bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-sm">Back</span>
                    </button>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Board Type Badge */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                      boardType === 'jobs' 
                        ? 'bg-[#635BFF]/80 text-white' 
                        : 'bg-[#8B5CF6]/80 text-white'
                    }`}>
                      {boardType === 'jobs' ? 'Job Applications' : 'Outreach Campaign'}
                    </span>
                  </div>
                </div>

                {/* Title Section */}
                <div className="px-6 pt-12 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mode === 'create' ? 'Configure Your Board' : 'Edit Board'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {mode === 'create' 
                      ? `Set up your new ${boardType === 'jobs' ? 'job tracking' : 'outreach'} board` 
                      : 'Update your board settings'
                    }
                  </p>
                </div>

                {/* Section Tabs */}
                <div className="px-6 pb-4">
                  <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                          activeSection === section.id
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <section.icon className="w-4 h-4" />
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-380px)]">
                  <AnimatePresence mode="wait">
                    {/* Basics Section */}
                    {activeSection === 'basics' && (
                      <motion.div
                        key="basics"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-5"
                      >
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Board Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={boardType === 'jobs' 
                              ? "e.g., Tech Jobs 2025, Remote Positions..." 
                              : "e.g., Startup Outreach, Q1 Campaign..."
                            }
                            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#635BFF] focus:bg-white dark:focus:bg-gray-800 transition-all outline-none"
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Description
                            <span className="font-normal text-gray-400 ml-1">(optional)</span>
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={boardType === 'jobs'
                              ? "What kind of jobs will you track here?"
                              : "Describe your outreach campaign..."
                            }
                            rows={3}
                            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#635BFF] focus:bg-white dark:focus:bg-gray-800 transition-all outline-none resize-none"
                          />
                        </div>

                        {/* Icon */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Board Icon
                          </label>
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value.slice(-2))}
                                className="w-16 h-16 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center text-2xl focus:border-[#635BFF] transition-all outline-none"
                                placeholder={boardType === 'jobs' ? '💼' : '📨'}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick picks:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {emojiSuggestions.map((emoji) => (
                                  <motion.button
                                    key={emoji}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIcon(emoji)}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                                      icon === emoji 
                                        ? 'bg-[#635BFF] ring-2 ring-[#635BFF]/30 shadow-lg' 
                                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    {emoji}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Appearance Section */}
                    {activeSection === 'appearance' && (
                      <motion.div
                        key="appearance"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {/* Color */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Accent Color
                          </label>
                          <div className="flex gap-3">
                            {BOARD_COLORS.map((c) => (
                              <motion.button
                                key={c}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setColor(c)}
                                className={`w-10 h-10 rounded-xl transition-all ${
                                  color === c 
                                    ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-gray-900 dark:ring-white shadow-lg' 
                                    : 'hover:shadow-md'
                                }`}
                                style={{ backgroundColor: c }}
                              >
                                {color === c && (
                                  <Check className="w-5 h-5 text-white mx-auto" />
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* Cover Photo */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-gray-900 dark:text-white">
                              Cover Photo
                            </label>
                            {coverPhoto && (
                              <button
                                onClick={() => setCoverPhoto(undefined)}
                                className="text-xs text-red-500 hover:text-red-600 font-medium"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          {/* Cover photo gallery */}
                          <div className="grid grid-cols-4 gap-2">
                            {COVER_PHOTOS.map((photo, index) => (
                              <motion.button
                                key={index}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setCoverPhoto(photo)}
                                className={`relative aspect-[2/1] rounded-xl overflow-hidden transition-all ${
                                  coverPhoto === photo 
                                    ? 'ring-2 ring-[#635BFF] ring-offset-2 ring-offset-white dark:ring-offset-gray-900' 
                                    : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
                                }`}
                              >
                                <img 
                                  src={photo} 
                                  alt={`Cover ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                {coverPhoto === photo && (
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-[#635BFF]/30 flex items-center justify-center"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                      <Check className="w-4 h-4 text-[#635BFF]" />
                                    </div>
                                  </motion.div>
                                )}
                              </motion.button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Photos from Unsplash
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Columns Section */}
                    {activeSection === 'columns' && (
                      <motion.div
                        key="columns"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-5"
                      >
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">
                              {boardType === 'jobs' ? 'Job Application' : 'Campaign'} columns
                            </span> are included by default:
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {standardColumns.map((col) => (
                              <span 
                                key={col}
                                className="px-3 py-1 rounded-lg bg-white dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                              >
                                {columnLabels[col]}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Custom Columns */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Custom Columns
                            <span className="font-normal text-gray-400 ml-1">(optional)</span>
                          </label>
                          
                          {/* Existing custom columns */}
                          {customColumns.length > 0 && (
                            <div className="space-y-2 mb-4">
                              {customColumns.map((column, index) => (
                                <motion.div 
                                  key={column.id}
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group"
                                >
                                  <div className="flex gap-1">
                                    {BOARD_COLORS.slice(0, 5).map((c) => (
                                      <button
                                        key={c}
                                        onClick={() => updateColumnColor(column.id, c)}
                                        className={`w-5 h-5 rounded-md transition-all ${
                                          column.color === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                                        }`}
                                        style={{ backgroundColor: c }}
                                      />
                                    ))}
                                  </div>
                                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                                    {column.name}
                                  </span>
                                  <button
                                    onClick={() => removeCustomColumn(column.id)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          )}

                          {/* Add new column */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newColumnName}
                              onChange={(e) => setNewColumnName(e.target.value)}
                              placeholder="New column name..."
                              onKeyDown={(e) => e.key === 'Enter' && addCustomColumn()}
                              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#635BFF] transition-all outline-none"
                            />
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={addCustomColumn}
                              disabled={!newColumnName.trim()}
                              className="px-4 py-3 rounded-xl bg-[#635BFF] text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                              <Plus className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Delete Board */}
                        {mode === 'edit' && onDelete && !board?.isDefault && (
                          <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                            {!showDeleteConfirm ? (
                              <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete this board
                              </button>
                            ) : (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50"
                              >
                                <div className="flex items-start gap-3">
                                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                      Delete this board?
                                    </p>
                                    <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">
                                      Applications will be moved to the default board.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                  <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="text-xs text-gray-400">
                    {name.trim() ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500" />
                        Ready to save
                      </span>
                    ) : (
                      <span>Enter a board name to continue</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={!name.trim() || isSaving}
                      className={`px-6 py-2.5 rounded-xl text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2 ${
                        boardType === 'jobs'
                          ? 'bg-gradient-to-r from-[#635BFF] to-[#8B5CF6] hover:shadow-[#635BFF]/25'
                          : 'bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:shadow-[#8B5CF6]/25'
                      }`}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {mode === 'create' ? 'Create Board' : 'Save Changes'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

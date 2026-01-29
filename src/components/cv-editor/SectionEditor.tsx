import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Plus, Trash2, Calendar, Edit3,
  Wand2, TrendingUp, Target, Hash, FileText, Zap,
  X, Check, Loader2, Sparkles, GripVertical, Star, Upload, User, Image, ZoomIn, ZoomOut,
  Linkedin, Github, Globe, Twitter, Dribbble
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { CVSection, CVExperience, CVEducation, CVSkill, CVCertification, CVProject, CVLanguage, CVLayoutSettings, CVTemplate } from '../../types/cvEditor';
import { generateId } from '../../lib/cvEditorUtils';
import { rewriteSection } from '../../lib/cvSectionAI';
import { notify } from '@/lib/notify';
import DiffView from './DiffView';
import {
  ExperienceInlineForm,
  EducationInlineForm,
  ProjectInlineForm,
  CertificationInlineForm,
  LanguageInlineForm
} from './inline-editors';
import AIEnhancePanel from './inline-editors/AIEnhancePanel';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

// Helper function to create cropped image blob
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = document.createElement('img');
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
}

interface SectionEditorProps {
  section: CVSection;
  data: any;
  onChange: (updates: any) => void;
  jobContext?: {
    jobTitle: string;
    company: string;
    jobDescription?: string;
    keywords: string[];
    strengths: string[];
    gaps: string[];
  };
  fullCV?: string;
  // External control for click-to-edit from preview
  externalEditItemId?: string | null;
  onExternalEditProcessed?: () => void;
  // Layout settings for controlling skill level display
  layoutSettings?: CVLayoutSettings;
  onLayoutSettingsChange?: (settings: Partial<CVLayoutSettings>) => void;
  // Current template to show/hide photo option
  template?: CVTemplate;
}

// Templates that support profile photos
const PHOTO_TEMPLATES: CVTemplate[] = ['swiss-photo', 'corporate-photo'];

// AI action buttons for each section
const AI_ACTIONS = [
  { id: 'improve', label: 'Improve with AI', icon: <Wand2 className="w-3.5 h-3.5" /> },
  { id: 'rewrite', label: 'Rewrite', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'suggest', label: 'Suggest', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'metrics', label: 'Add Metrics', icon: <Hash className="w-3.5 h-3.5" /> },
  { id: 'keywords', label: 'Keywords', icon: <Target className="w-3.5 h-3.5" /> },
  { id: 'shorten', label: 'Shorten', icon: <Zap className="w-3.5 h-3.5" /> }
];

export default function SectionEditor({
  section,
  data,
  onChange,
  jobContext,
  fullCV,
  externalEditItemId,
  onExternalEditProcessed,
  layoutSettings,
  onLayoutSettingsChange,
  template
}: SectionEditorProps) {
  const { currentUser } = useAuth();
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [showDiff, setShowDiff] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Photo crop modal states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize summary textarea
  useEffect(() => {
    if (section.type === 'summary' && summaryTextareaRef.current) {
      const textarea = summaryTextareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [data.summary, section.type]);

  // Inline editing state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Conversation history for AI interactions (per section type)
  const [conversationHistory, setConversationHistory] = useState<Record<string, string[]>>({});

  // Check if current template supports photos
  const supportsPhoto = template && PHOTO_TEMPLATES.includes(template);

  // Handle photo file selection - opens crop modal
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      notify.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notify.error('Image must be less than 5MB');
      return;
    }

    // Read file and open crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // Handle crop complete callback
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    setCroppedAreaPixels(null);
  };

  // Handle crop save - upload cropped image
  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels || !currentUser?.uid) return;

    setIsUploadingPhoto(true);
    try {
      // Create cropped blob
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);

      // Upload to Firebase
      const fileName = `cv-photo-${Date.now()}.jpg`;
      const photoRef = ref(storage, `profile-photos/${currentUser.uid}/${fileName}`);
      await uploadBytes(photoRef, croppedBlob, { contentType: 'image/jpeg' });
      const photoUrl = await getDownloadURL(photoRef);

      onChange({ photoUrl });
      notify.success('Photo uploaded successfully');

      // Close modal and reset
      setShowCropModal(false);
      setImageToCrop(null);
      setCroppedAreaPixels(null);
    } catch (error) {
      console.error('Error uploading photo:', error);
      notify.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle external edit request from preview click
  useEffect(() => {
    if (externalEditItemId) {
      setInlineEditingId(externalEditItemId);
      setIsAddingNew(false);
      onExternalEditProcessed?.();
    }
  }, [externalEditItemId, onExternalEditProcessed]);

  const handleAIAction = async (action: string) => {
    if (!jobContext) {
      notify.error('Job context not available. Please load from ATS analysis.');
      return;
    }

    setIsProcessingAI(true);
    setCurrentAction(action);

    try {
      // Get current content based on section type
      let currentContent = '';
      switch (section.type) {
        case 'summary':
          currentContent = data.summary || '';
          break;
        case 'experience':
          currentContent = data.experiences?.map((exp: CVExperience) =>
            `${exp.title} at ${exp.company}\n${exp.description}\n${exp.bullets.join('\n')}`
          ).join('\n\n') || '';
          break;
        case 'education':
          currentContent = data.education?.map((edu: CVEducation) =>
            `${edu.degree} ${edu.field ? `in ${edu.field}` : ''} at ${edu.institution}`
          ).join('\n') || '';
          break;
        case 'skills':
          currentContent = data.skills?.map((s: CVSkill) => s.name).join(', ') || '';
          break;
        case 'certifications':
          currentContent = data.certifications?.map((c: CVCertification) =>
            `${c.name} by ${c.issuer}`
          ).join('\n') || '';
          break;
        case 'projects':
          currentContent = data.projects?.map((p: CVProject) =>
            `${p.name}: ${p.description}`
          ).join('\n') || '';
          break;
        case 'languages':
          currentContent = data.languages?.map((l: CVLanguage) =>
            `${l.name} (${l.proficiency})`
          ).join(', ') || '';
          break;
        default:
          currentContent = '';
      }

      // Store original content for diff view
      setOriginalContent(currentContent);

      // Call the AI rewrite service
      const improvedContent = await rewriteSection({
        action: action as any,
        sectionType: section.type,
        currentContent,
        fullCV: fullCV || '',
        jobContext: {
          jobTitle: jobContext.jobTitle,
          company: jobContext.company,
          jobDescription: jobContext.jobDescription || '',
          keywords: jobContext.keywords,
          strengths: jobContext.strengths,
          gaps: jobContext.gaps
        }
      });

      setAiSuggestion(improvedContent);
      setShowDiff(true);
      notify.success('AI suggestion generated! Review and apply changes.');
    } catch (error) {
      console.error('AI action error:', error);
      notify.error('Failed to generate AI suggestion. Please try again.');
    } finally {
      setIsProcessingAI(false);
      setCurrentAction('');
    }
  };

  const renderAIActions = () => (
    <div className="flex flex-wrap gap-2 mt-4">
      {AI_ACTIONS.map(action => (
        <button
          key={action.id}
          onClick={() => handleAIAction(action.id)}
          disabled={isProcessingAI}
          className="group flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-[#2b2a2c]/60 border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-lg hover:bg-gray-50 dark:hover:bg-[#3d3c3e] hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-200 hover:shadow-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isProcessingAI && currentAction === action.id ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <span className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
              {action.icon}
            </span>
          )}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );

  const renderAISuggestion = () => {
    if (!aiSuggestion) return null;

    const acceptSuggestion = () => {
      switch (section.type) {
        case 'summary':
          onChange({ summary: aiSuggestion });
          break;
        case 'experience':
          if (data.experiences?.length > 0) {
            const updatedExperiences = [...data.experiences];
            const lines = aiSuggestion.split('\n').filter(line => line.trim());
            updatedExperiences[0] = {
              ...updatedExperiences[0],
              description: lines[0] || updatedExperiences[0].description,
              bullets: lines.slice(1).map(line => line.replace(/^[•\-]\s*/, ''))
            };
            onChange({ experiences: updatedExperiences });
          }
          break;
        case 'skills':
          const skills = aiSuggestion.split(/[,\n]/)
            .map(s => s.trim())
            .filter(s => s)
            .map(name => ({ id: generateId(), name, category: 'technical' }));
          onChange({ skills });
          break;
        default:
          onChange({ [section.type]: aiSuggestion });
      }

      setAiSuggestion(null);
      setShowDiff(false);
      notify.success('AI suggestion applied!');
    };

    if (showDiff && originalContent && aiSuggestion) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3"
        >
          <DiffView
            original={originalContent}
            modified={aiSuggestion}
            sectionName={section.title}
            onAccept={acceptSuggestion}
            onReject={() => {
              setAiSuggestion(null);
              setShowDiff(false);
              setOriginalContent('');
            }}
          />
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/40 dark:to-gray-900/20 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-xl shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                AI Suggestion
              </span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {aiSuggestion}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={acceptSuggestion}
              className="p-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-[#4a494b] text-white dark:text-gray-900 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
              title="Accept suggestion"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setAiSuggestion(null);
                setShowDiff(false);
                setOriginalContent('');
              }}
              className="p-2.5 bg-white dark:bg-[#2b2a2c] hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-600 dark:text-gray-400 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg transition-all duration-200"
              title="Reject suggestion"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Close inline form helper
  const closeInlineForm = () => {
    setInlineEditingId(null);
    setIsAddingNew(false);
  };

  // Render different editors based on section type
  switch (section.type) {
    case 'personal':
      return (
        <>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  First Name
                </label>
                <input
                  type="text"
                  value={data.firstName || ''}
                  onChange={(e) => onChange({ firstName: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  value={data.lastName || ''}
                  onChange={(e) => onChange({ lastName: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Professional Title
              </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => onChange({ title: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
                placeholder="Software Engineer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={data.email || ''}
                  onChange={(e) => onChange({ email: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Phone
                </label>
                <input
                  type="tel"
                  value={data.phone || ''}
                  onChange={(e) => onChange({ phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Location
              </label>
              <input
                type="text"
                value={data.location || ''}
                onChange={(e) => onChange({ location: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
                placeholder="New York, NY"
              />
            </div>

            {/* Profile Photo Section - Only for photo templates */}
            {supportsPhoto && (
              <div className="p-4 bg-gradient-to-r from-[#635BFF]/5 to-[#635BFF]/10 dark:from-[#635BFF]/10 dark:to-[#635BFF]/20 rounded-xl border border-[#635BFF]/20 dark:border-[#635BFF]/30">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 tracking-wide uppercase flex items-center gap-2">
                  <Image className="w-4 h-4 text-[#635BFF] dark:text-[#a5a0ff]" />
                  Profile Photo
                </label>
                <div className="flex items-start gap-4">
                  {/* Photo Preview */}
                  <div className="relative flex-shrink-0">
                    {data.photoUrl ? (
                      <div className="relative group">
                        <img
                          src={data.photoUrl}
                          alt="Profile"
                          className="w-20 h-20 rounded-xl object-cover border-2 border-white dark:border-gray-700 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => onChange({ photoUrl: '' })}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors shadow-md opacity-0 group-hover:opacity-100"
                          title="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shadow-sm">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      id="cv-photo-upload"
                    />
                    <label
                      htmlFor="cv-photo-upload"
                      className={`
                      inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm cursor-pointer transition-all
                      ${isUploadingPhoto
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                          : 'bg-[#635BFF] hover:bg-[#5249e6] text-white shadow-sm hover:shadow-md'
                        }
                    `}
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Photo
                        </>
                      )}
                    </label>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Social Media Section */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                Social Media
              </label>
              <div className="space-y-3">
                {/* LinkedIn */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Linkedin className="w-4 h-4 text-gray-400 group-focus-within:text-[#0077b5] transition-colors" />
                  </div>
                  <input
                    type="url"
                    value={data.linkedin || ''}
                    onChange={(e) => onChange({ linkedin: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-[#0077b5] dark:focus:border-[#0077b5] focus:ring-1 focus:ring-[#0077b5] transition-all duration-200"
                    placeholder="linkedin.com/in/username"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-400 font-medium">LinkedIn</span>
                  </div>
                </div>

                {/* GitHub */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Github className="w-4 h-4 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type="url"
                    value={data.github || ''}
                    onChange={(e) => onChange({ github: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900 dark:focus:ring-white transition-all duration-200"
                    placeholder="github.com/username"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-400 font-medium">GitHub</span>
                  </div>
                </div>

                {/* Twitter */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Twitter className="w-4 h-4 text-gray-400 group-focus-within:text-[#1DA1F2] transition-colors" />
                  </div>
                  <input
                    type="url"
                    value={data.twitter || ''}
                    onChange={(e) => onChange({ twitter: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-[#1DA1F2] dark:focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2] transition-all duration-200"
                    placeholder="twitter.com/username"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-400 font-medium">Twitter</span>
                  </div>
                </div>

                {/* Dribbble */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Dribbble className="w-4 h-4 text-gray-400 group-focus-within:text-[#EA4C89] transition-colors" />
                  </div>
                  <input
                    type="url"
                    value={data.dribbble || ''}
                    onChange={(e) => onChange({ dribbble: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-[#EA4C89] dark:focus:border-[#EA4C89] focus:ring-1 focus:ring-[#EA4C89] transition-all duration-200"
                    placeholder="dribbble.com/username"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-400 font-medium">Dribbble</span>
                  </div>
                </div>

                {/* Portfolio / Website */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="w-4 h-4 text-gray-400 group-focus-within:text-[#635BFF] transition-colors" />
                  </div>
                  <input
                    type="url"
                    value={data.portfolio || ''}
                    onChange={(e) => onChange({ portfolio: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-[#635BFF] dark:focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] transition-all duration-200"
                    placeholder="yourwebsite.com"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-400 font-medium">Website</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Crop Modal */}
          <AnimatePresence>
            {showCropModal && imageToCrop && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                onClick={handleCropCancel}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative w-full max-w-lg mx-4 bg-white dark:bg-[#2b2a2c] rounded-2xl shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#3d3c3e]">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Crop Your Photo
                    </h3>
                    <button
                      onClick={handleCropCancel}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Crop Area */}
                  <div className="relative h-80 bg-gray-900">
                    <Cropper
                      image={imageToCrop}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      cropShape="round"
                      showGrid={false}
                      style={{
                        containerStyle: {
                          backgroundColor: '#1a1a1a',
                        },
                      }}
                    />
                  </div>

                  {/* Zoom Control */}
                  <div className="px-5 py-4 border-t border-gray-200 dark:border-[#3d3c3e]">
                    <div className="flex items-center gap-3">
                      <ZoomOut className="w-4 h-4 text-gray-400" />
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 dark:bg-[#3d3c3e] rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-[#635BFF]
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-moz-range-thumb]:w-4
                        [&::-moz-range-thumb]:h-4
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-[#635BFF]
                        [&::-moz-range-thumb]:border-0
                        [&::-moz-range-thumb]:cursor-pointer"
                      />
                      <ZoomIn className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#242325]">
                    <button
                      onClick={handleCropCancel}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCropSave}
                      disabled={isUploadingPhoto}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#635BFF] hover:bg-[#5249e6] disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Photo
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      );

    case 'summary':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide uppercase">
              Professional Summary
            </label>
            <textarea
              ref={summaryTextareaRef}
              value={data.summary || ''}
              onChange={(e) => onChange({ summary: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-normal focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200 resize-none leading-relaxed overflow-hidden"
              placeholder="Write a compelling summary that highlights your key strengths and career objectives..."
            />
            <div className="flex justify-end mt-1.5">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {data.summary?.length || 0} characters
              </p>
            </div>
          </div>

          {/* AI Enhancement Panel - Moved to bottom */}
          <AIEnhancePanel
            sectionType="summary"
            currentContent={data.summary || ''}
            onApply={(enhancedContent) => {
              onChange({ summary: enhancedContent });
              // Don't reset history - keep it for iterative refinement
            }}
            jobContext={jobContext}
            fullCV={fullCV}
            conversationHistory={conversationHistory['summary'] || []}
            onAddToHistory={(message) => {
              setConversationHistory(prev => ({
                ...prev,
                summary: [...(prev.summary || []).slice(-3), message] // Keep last 3-4 messages
              }));
            }}
            onResetHistory={() => {
              setConversationHistory(prev => ({ ...prev, summary: [] }));
            }}
          />
        </div>
      );

    case 'experience':
      const handleExperienceDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const experiences = [...(data.experiences || [])];
        const [reorderedExperience] = experiences.splice(result.source.index, 1);
        experiences.splice(result.destination.index, 0, reorderedExperience);

        onChange({ experiences });
      };

      return (
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {/* Show inline form for adding new experience */}
            {isAddingNew && (
              <motion.div
                key="add-new-experience"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ExperienceInlineForm
                  onSave={(experience) => {
                    onChange({ experiences: [...(data.experiences || []), experience] });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  jobContext={jobContext}
                  fullCV={fullCV}
                  conversationHistory={conversationHistory['new-experience'] || []}
                  onAddToHistory={(message) => {
                    setConversationHistory(prev => ({
                      ...prev,
                      'new-experience': [...(prev['new-experience'] || []).slice(-3), message]
                    }));
                  }}
                  onResetHistory={() => {
                    setConversationHistory(prev => ({ ...prev, 'new-experience': [] }));
                  }}
                />
              </motion.div>
            )}

            {/* Show inline form for editing existing experience */}
            {inlineEditingId && !isAddingNew && (
              <motion.div
                key={`edit-${inlineEditingId}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ExperienceInlineForm
                  initialData={data.experiences?.find((e: CVExperience) => e.id === inlineEditingId)}
                  onSave={(experience) => {
                    onChange({
                      experiences: data.experiences.map((e: CVExperience) =>
                        e.id === inlineEditingId ? experience : e
                      )
                    });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  onDelete={() => {
                    onChange({
                      experiences: data.experiences.filter((e: CVExperience) => e.id !== inlineEditingId)
                    });
                    closeInlineForm();
                    notify.success('Experience deleted');
                  }}
                  jobContext={jobContext}
                  fullCV={fullCV}
                  conversationHistory={conversationHistory[`experience-${inlineEditingId}`] || []}
                  onAddToHistory={(message) => {
                    setConversationHistory(prev => ({
                      ...prev,
                      [`experience-${inlineEditingId}`]: [...(prev[`experience-${inlineEditingId}`] || []).slice(-3), message]
                    }));
                  }}
                  onResetHistory={() => {
                    setConversationHistory(prev => ({ ...prev, [`experience-${inlineEditingId}`]: [] }));
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Experience list - hide when editing */}
          {!isAddingNew && !inlineEditingId && (
            <>
              <DragDropContext onDragEnd={handleExperienceDragEnd}>
                <Droppable droppableId="experiences">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {(data.experiences || []).map((exp: CVExperience, index: number) => (
                        <Draggable key={exp.id} draggableId={exp.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`
                                group p-4 bg-white dark:bg-[#2b2a2c]/40 rounded-lg 
                                transition-all duration-200 cursor-pointer 
                                border border-gray-200/60 dark:border-[#3d3c3e]/60 
                                shadow-sm
                                ${snapshot.isDragging
                                  ? 'shadow-lg border-[#635BFF] dark:border-[#5249e6] bg-[#635BFF]/5 dark:bg-[#5249e6]/10 rotate-[0.5deg] scale-[1.01]'
                                  : 'hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/60 hover:border-gray-300/80 dark:hover:border-gray-600/80 hover:shadow-md'
                                }
                              `}
                              style={{
                                ...provided.draggableProps.style,
                                zIndex: snapshot.isDragging ? 1000 : 'auto',
                              }}
                              onClick={() => setInlineEditingId(exp.id)}
                            >
                              <div className="flex items-start gap-3">
                                {/* Drag handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {exp.title || 'Untitled Position'}
                                  </h4>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">
                                    {exp.company} {exp.location && `• ${exp.location}`}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {exp.startDate || 'Start'} - {exp.current ? 'Present' : exp.endDate || 'End'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInlineEditingId(exp.id);
                                    }}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#3d3c3e] rounded transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onChange({ experiences: data.experiences.filter((e: CVExperience) => e.id !== exp.id) });
                                    }}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 bg-white dark:bg-[#2b2a2c] text-[#5249e6] dark:text-[#a5a0ff] border-2 border-dashed border-[#635BFF]/30 dark:border-[#a5a0ff]/50 rounded-xl hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Add Experience</span>
              </button>
            </>
          )}
        </div>
      );

    case 'education':
      const handleEducationDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const education = [...(data.education || [])];
        const [reorderedEducation] = education.splice(result.source.index, 1);
        education.splice(result.destination.index, 0, reorderedEducation);

        onChange({ education });
      };

      return (
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isAddingNew && (
              <motion.div
                key="add-new-education"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EducationInlineForm
                  onSave={(education) => {
                    onChange({ education: [...(data.education || []), education] });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                />
              </motion.div>
            )}

            {inlineEditingId && !isAddingNew && (
              <motion.div
                key={`edit-${inlineEditingId}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EducationInlineForm
                  initialData={data.education?.find((e: CVEducation) => e.id === inlineEditingId)}
                  onSave={(education) => {
                    onChange({
                      education: data.education.map((e: CVEducation) =>
                        e.id === inlineEditingId ? education : e
                      )
                    });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  onDelete={() => {
                    onChange({
                      education: data.education.filter((e: CVEducation) => e.id !== inlineEditingId)
                    });
                    closeInlineForm();
                    notify.success('Education deleted');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!isAddingNew && !inlineEditingId && (
            <>
              <DragDropContext onDragEnd={handleEducationDragEnd}>
                <Droppable droppableId="education">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {(data.education || []).map((edu: CVEducation, index: number) => (
                        <Draggable key={edu.id} draggableId={edu.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`
                                group p-3 bg-white dark:bg-[#2b2a2c] rounded-lg 
                                transition-all cursor-pointer 
                                border border-gray-300 dark:border-[#4a494b] 
                                shadow-sm
                                ${snapshot.isDragging
                                  ? 'shadow-lg border-[#635BFF] dark:border-[#5249e6] bg-[#635BFF]/5 dark:bg-[#5249e6]/10 rotate-[0.5deg] scale-[1.01]'
                                  : 'hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] hover:shadow-md'
                                }
                              `}
                              style={{
                                ...provided.draggableProps.style,
                                zIndex: snapshot.isDragging ? 1000 : 'auto',
                              }}
                              onClick={() => setInlineEditingId(edu.id)}
                            >
                              <div className="flex items-start gap-3">
                                {/* Drag handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {edu.degree || 'Untitled Degree'}
                                  </h4>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">
                                    {edu.institution} {edu.field && `• ${edu.field}`}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {edu.endDate || 'Graduation date'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInlineEditingId(edu.id);
                                    }}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#3d3c3e] rounded transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onChange({ education: data.education.filter((e: CVEducation) => e.id !== edu.id) });
                                    }}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 bg-white dark:bg-[#2b2a2c] text-[#5249e6] dark:text-[#a5a0ff] border-2 border-dashed border-[#635BFF]/30 dark:border-[#a5a0ff]/50 rounded-xl hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Add Education</span>
              </button>
            </>
          )}
        </div>
      );

    case 'skills':
      const handleSkillDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const skills = [...(data.skills || [])];
        const [reorderedSkill] = skills.splice(result.source.index, 1);
        skills.splice(result.destination.index, 0, reorderedSkill);

        onChange({ skills });
      };

      const updateSkill = (skillId: string, updates: Partial<CVSkill>) => {
        const updatedSkills = (data.skills || []).map((skill: CVSkill) =>
          skill.id === skillId ? { ...skill, ...updates } : skill
        );
        onChange({ skills: updatedSkills });
      };

      const deleteSkill = (skillId: string) => {
        const newSkills = (data.skills || []).filter((s: CVSkill) => s.id !== skillId);
        onChange({ skills: newSkills });
      };

      const addSkill = (skillName: string) => {
        const newSkill: CVSkill = {
          id: generateId(),
          name: skillName.trim(),
          category: 'technical',
          level: 'intermediate'
        };
        onChange({ skills: [...(data.skills || []), newSkill] });
      };

      return (
        <div className="space-y-4">
          {/* Show Skill Levels Toggle */}
          {layoutSettings && onLayoutSettingsChange && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#2b2a2c]/40 rounded-xl border border-gray-200 dark:border-[#3d3c3e]/60">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20">
                  <Star className="w-4 h-4 text-[#635BFF] dark:text-[#a5a0ff]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Show Skill Levels on CV
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Display proficiency levels on your CV
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={layoutSettings.showSkillLevel !== false}
                  onChange={(e) => onLayoutSettingsChange({ showSkillLevel: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#635BFF]/30 dark:peer-focus:ring-[#635BFF]/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#635BFF] dark:peer-checked:bg-[#635BFF]"></div>
              </label>
            </div>
          )}

          <DragDropContext onDragEnd={handleSkillDragEnd}>
            <Droppable droppableId="skills">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {(data.skills || []).map((skill: CVSkill, index: number) => (
                    <Draggable key={skill.id} draggableId={skill.id} index={index}>
                      {(provided, snapshot) => (
                        <SkillRow
                          skill={skill}
                          provided={provided}
                          snapshot={snapshot}
                          onUpdate={(updates) => updateSkill(skill.id, updates)}
                          onDelete={() => deleteSkill(skill.id)}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a skill..."
              className="flex-1 px-3 py-2 bg-white dark:bg-[#2b2a2c] border border-gray-300 dark:border-[#4a494b] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-[#635BFF] focus:border-[#635BFF]"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  if (input.value.trim()) {
                    addSkill(input.value);
                    input.value = '';
                  }
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                if (input && input.value.trim()) {
                  addSkill(input.value);
                  input.value = '';
                }
              }}
              className="px-3 py-2 bg-[#635BFF] text-white rounded-lg hover:bg-[#5249e6] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      );

    case 'certifications':
      const handleCertificationsDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const certifications = [...(data.certifications || [])];
        const [reorderedCertification] = certifications.splice(result.source.index, 1);
        certifications.splice(result.destination.index, 0, reorderedCertification);

        onChange({ certifications });
      };

      return (
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isAddingNew && (
              <motion.div
                key="add-new-certification"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CertificationInlineForm
                  onSave={(certification) => {
                    onChange({ certifications: [...(data.certifications || []), certification] });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                />
              </motion.div>
            )}

            {inlineEditingId && !isAddingNew && (
              <motion.div
                key={`edit-${inlineEditingId}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CertificationInlineForm
                  initialData={data.certifications?.find((c: CVCertification) => c.id === inlineEditingId)}
                  onSave={(certification) => {
                    onChange({
                      certifications: data.certifications.map((c: CVCertification) =>
                        c.id === inlineEditingId ? certification : c
                      )
                    });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  onDelete={() => {
                    onChange({
                      certifications: data.certifications.filter((c: CVCertification) => c.id !== inlineEditingId)
                    });
                    closeInlineForm();
                    notify.success('Certification deleted');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!isAddingNew && !inlineEditingId && (
            <>
              <DragDropContext onDragEnd={handleCertificationsDragEnd}>
                <Droppable droppableId="certifications">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {(data.certifications || []).map((cert: CVCertification, index: number) => (
                        <Draggable key={cert.id} draggableId={cert.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`
                                group p-3 bg-white dark:bg-[#2b2a2c] rounded-lg 
                                transition-all cursor-pointer 
                                border border-gray-300 dark:border-[#4a494b] 
                                shadow-sm
                                ${snapshot.isDragging
                                  ? 'shadow-lg border-[#635BFF] dark:border-[#5249e6] bg-[#635BFF]/5 dark:bg-[#5249e6]/10 rotate-[0.5deg] scale-[1.01]'
                                  : 'hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] hover:shadow-md'
                                }
                              `}
                              style={{
                                ...provided.draggableProps.style,
                                zIndex: snapshot.isDragging ? 1000 : 'auto',
                              }}
                              onClick={() => setInlineEditingId(cert.id)}
                            >
                              <div className="flex items-start gap-3">
                                {/* Drag handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {cert.name || 'Untitled Certification'}
                                  </h4>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">
                                    {cert.issuer || 'Issuer'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {cert.date || 'Issue date'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInlineEditingId(cert.id);
                                    }}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#3d3c3e] rounded transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onChange({ certifications: data.certifications.filter((c: CVCertification) => c.id !== cert.id) });
                                    }}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 bg-white dark:bg-[#2b2a2c] text-[#5249e6] dark:text-[#a5a0ff] border-2 border-dashed border-[#635BFF]/30 dark:border-[#a5a0ff]/50 rounded-xl hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Add Certification</span>
              </button>
            </>
          )}
        </div>
      );

    case 'projects':
      const handleProjectsDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const projects = [...(data.projects || [])];
        const [reorderedProject] = projects.splice(result.source.index, 1);
        projects.splice(result.destination.index, 0, reorderedProject);

        onChange({ projects });
      };

      return (
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isAddingNew && (
              <motion.div
                key="add-new-project"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ProjectInlineForm
                  onSave={(project) => {
                    onChange({ projects: [...(data.projects || []), project] });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  jobContext={jobContext}
                  fullCV={fullCV}
                  conversationHistory={conversationHistory['new-project'] || []}
                  onAddToHistory={(message) => {
                    setConversationHistory(prev => ({
                      ...prev,
                      'new-project': [...(prev['new-project'] || []).slice(-3), message]
                    }));
                  }}
                  onResetHistory={() => {
                    setConversationHistory(prev => ({ ...prev, 'new-project': [] }));
                  }}
                />
              </motion.div>
            )}

            {inlineEditingId && !isAddingNew && (
              <motion.div
                key={`edit-${inlineEditingId}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ProjectInlineForm
                  initialData={data.projects?.find((p: CVProject) => p.id === inlineEditingId)}
                  onSave={(project) => {
                    onChange({
                      projects: data.projects.map((p: CVProject) =>
                        p.id === inlineEditingId ? project : p
                      )
                    });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  onDelete={() => {
                    onChange({
                      projects: data.projects.filter((p: CVProject) => p.id !== inlineEditingId)
                    });
                    closeInlineForm();
                    notify.success('Project deleted');
                  }}
                  jobContext={jobContext}
                  fullCV={fullCV}
                  conversationHistory={conversationHistory[`project-${inlineEditingId}`] || []}
                  onAddToHistory={(message) => {
                    setConversationHistory(prev => ({
                      ...prev,
                      [`project-${inlineEditingId}`]: [...(prev[`project-${inlineEditingId}`] || []).slice(-3), message]
                    }));
                  }}
                  onResetHistory={() => {
                    setConversationHistory(prev => ({ ...prev, [`project-${inlineEditingId}`]: [] }));
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!isAddingNew && !inlineEditingId && (
            <>
              <DragDropContext onDragEnd={handleProjectsDragEnd}>
                <Droppable droppableId="projects">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {(data.projects || []).map((project: CVProject, index: number) => (
                        <Draggable key={project.id} draggableId={project.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`
                                group p-3 bg-white dark:bg-[#2b2a2c] rounded-lg 
                                transition-all cursor-pointer 
                                border border-gray-300 dark:border-[#4a494b] 
                                shadow-sm
                                ${snapshot.isDragging
                                  ? 'shadow-lg border-[#635BFF] dark:border-[#5249e6] bg-[#635BFF]/5 dark:bg-[#5249e6]/10 rotate-[0.5deg] scale-[1.01]'
                                  : 'hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] hover:shadow-md'
                                }
                              `}
                              style={{
                                ...provided.draggableProps.style,
                                zIndex: snapshot.isDragging ? 1000 : 'auto',
                              }}
                              onClick={() => setInlineEditingId(project.id)}
                            >
                              <div className="flex items-start gap-3">
                                {/* Drag handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {project.name || 'Untitled Project'}
                                  </h4>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2 font-medium">
                                    {project.description || 'No description'}
                                  </p>
                                  {project.technologies.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {project.technologies.slice(0, 3).map((tech, idx) => (
                                        <span key={idx} className="text-xs px-2 py-0.5 bg-[#635BFF]/10 dark:bg-[#5249e6]/30 text-[#635BFF] dark:text-[#a5a0ff] rounded">
                                          {tech}
                                        </span>
                                      ))}
                                      {project.technologies.length > 3 && (
                                        <span className="text-xs px-2 py-0.5 text-gray-500">
                                          +{project.technologies.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInlineEditingId(project.id);
                                    }}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#3d3c3e] rounded transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onChange({ projects: data.projects.filter((p: CVProject) => p.id !== project.id) });
                                    }}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 bg-white dark:bg-[#2b2a2c] text-[#5249e6] dark:text-[#a5a0ff] border-2 border-dashed border-[#635BFF]/30 dark:border-[#a5a0ff]/50 rounded-xl hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Add Project</span>
              </button>
            </>
          )}
        </div>
      );

    case 'languages':
      const handleLanguagesDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const languages = [...(data.languages || [])];
        const [reorderedLanguage] = languages.splice(result.source.index, 1);
        languages.splice(result.destination.index, 0, reorderedLanguage);

        onChange({ languages });
      };

      return (
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isAddingNew && (
              <motion.div
                key="add-new-language"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LanguageInlineForm
                  onSave={(language) => {
                    onChange({ languages: [...(data.languages || []), language] });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                />
              </motion.div>
            )}

            {inlineEditingId && !isAddingNew && (
              <motion.div
                key={`edit-${inlineEditingId}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LanguageInlineForm
                  initialData={data.languages?.find((l: CVLanguage) => l.id === inlineEditingId)}
                  onSave={(language) => {
                    onChange({
                      languages: data.languages.map((l: CVLanguage) =>
                        l.id === inlineEditingId ? language : l
                      )
                    });
                    closeInlineForm();
                  }}
                  onCancel={closeInlineForm}
                  onDelete={() => {
                    onChange({
                      languages: data.languages.filter((l: CVLanguage) => l.id !== inlineEditingId)
                    });
                    closeInlineForm();
                    notify.success('Language deleted');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!isAddingNew && !inlineEditingId && (
            <>
              <DragDropContext onDragEnd={handleLanguagesDragEnd}>
                <Droppable droppableId="languages">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {(data.languages || []).map((language: CVLanguage, index: number) => (
                        <Draggable key={language.id} draggableId={language.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`
                                group p-3 bg-white dark:bg-[#2b2a2c] rounded-lg 
                                transition-all cursor-pointer 
                                border border-gray-300 dark:border-[#4a494b] 
                                shadow-sm
                                ${snapshot.isDragging
                                  ? 'shadow-lg border-[#635BFF] dark:border-[#5249e6] bg-[#635BFF]/5 dark:bg-[#5249e6]/10 rotate-[0.5deg] scale-[1.01]'
                                  : 'hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] hover:shadow-md'
                                }
                              `}
                              style={{
                                ...provided.draggableProps.style,
                                zIndex: snapshot.isDragging ? 1000 : 'auto',
                              }}
                              onClick={() => setInlineEditingId(language.id)}
                            >
                              <div className="flex items-center gap-3">
                                {/* Drag handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                <div className="flex-1">
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                    {language.name || 'Untitled Language'}
                                  </h4>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 capitalize font-medium">
                                    {language.proficiency}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInlineEditingId(language.id);
                                    }}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#3d3c3e] rounded transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onChange({ languages: data.languages.filter((l: CVLanguage) => l.id !== language.id) });
                                    }}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 bg-white dark:bg-[#2b2a2c] text-[#5249e6] dark:text-[#a5a0ff] border-2 border-dashed border-[#635BFF]/30 dark:border-[#a5a0ff]/50 rounded-xl hover:bg-[#635BFF]/5 dark:hover:bg-[#5249e6]/10 hover:border-[#7c75ff] dark:hover:border-[#a5a0ff] transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Add Language</span>
              </button>
            </>
          )}
        </div>
      );

    default:
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Section editor for "{section.type}" coming soon</p>
        </div>
      );
  }
}

// SkillRow component - Line-by-line skill editor with level selection and drag & drop
interface SkillRowProps {
  skill: CVSkill;
  provided: any;
  snapshot: any;
  onUpdate: (updates: Partial<CVSkill>) => void;
  onDelete: () => void;
}

function SkillRow({ skill, provided, snapshot, onUpdate, onDelete }: SkillRowProps) {
  const [skillName, setSkillName] = useState(skill.name);

  // Sync with external changes
  useEffect(() => {
    setSkillName(skill.name);
  }, [skill.name]);

  const handleNameBlur = () => {
    if (skillName.trim() && skillName !== skill.name) {
      onUpdate({ name: skillName.trim() });
    } else if (!skillName.trim()) {
      setSkillName(skill.name); // Revert if empty
    }
  };

  const handleNameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const levelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ] as const;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={`
        flex items-center gap-2 p-2.5 
        bg-white dark:bg-[#2b2a2c] 
        border border-gray-200 dark:border-[#3d3c3e] 
        rounded-lg 
        transition-all duration-200
        ${snapshot.isDragging
          ? 'shadow-lg border-[#635BFF] dark:border-[#5249e6] bg-[#635BFF]/5 dark:bg-[#5249e6]/10'
          : 'hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
        }
      `}
    >
      {/* Drag handle */}
      <div
        {...provided.dragHandleProps}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Skill name input */}
      <input
        type="text"
        value={skillName}
        onChange={(e) => setSkillName(e.target.value)}
        onBlur={handleNameBlur}
        onKeyPress={handleNameKeyPress}
        className="flex-1 px-2.5 py-1.5 
          bg-transparent 
          border border-transparent 
          rounded 
          text-sm text-gray-900 dark:text-white 
          font-medium
          focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF]/50
          hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50
          transition-colors"
        placeholder="Skill name"
      />

      {/* Level selector */}
      <select
        value={skill.level || 'intermediate'}
        onChange={(e) => onUpdate({ level: e.target.value as CVSkill['level'] })}
        className="px-2.5 py-1.5 
          bg-white dark:bg-[#2b2a2c] 
          border border-gray-200 dark:border-[#3d3c3e] 
          rounded 
          text-xs text-gray-700 dark:text-gray-300 
          font-medium
          focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF]/50
          hover:border-gray-300 dark:hover:border-gray-600
          transition-colors
          cursor-pointer"
      >
        {levelOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Delete button */}
      <button
        onClick={onDelete}
        className="p-1.5 
          text-gray-400 hover:text-red-600 dark:hover:text-red-400 
          hover:bg-red-50 dark:hover:bg-red-900/20 
          rounded 
          transition-colors"
        title="Delete skill"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

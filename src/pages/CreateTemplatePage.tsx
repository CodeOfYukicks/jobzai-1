import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Mail, MessageSquare, Globe2, Tags, Eye, EyeOff, Save, 
  Target, Sparkles, X, Tag as TagIcon, FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { toast } from '@/contexts/ToastContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EMAIL_GOALS, type EmailGoal } from '../lib/constants/emailGoals';
import { MobileCreateTemplate } from '../components/mobile/MobileCreateTemplate';
import TemplatePreview from '../components/TemplatePreview';

type Step = 'config' | 'compose';
type LanguageType = 'en' | 'fr';

export default function CreateTemplatePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [template, setTemplate] = useState({
    name: '',
    subject: '',
    content: '',
    language: 'en' as LanguageType,
    goal: 'network' as EmailGoal,
    tags: ''
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [progress, setProgress] = useState(0);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Update progress when template changes
    setProgress(calculateProgress());
  }, [template]);

  const handleChange = (field: string, value: string) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to save templates');
      return;
    }

    if (!template.name || !template.subject || !template.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const templateData = {
        name: template.name,
        subject: template.subject,
        content: template.content,
        language: template.language,
        goal: template.goal,
        tags: template.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        aiGenerated: false,
        liked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
      await addDoc(templatesRef, templateData);

      toast.success('Template saved successfully!');
      navigate('/email-templates');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const insertMergeField = (field: string) => {
    if (!contentRef.current) return;

    const start = contentRef.current.selectionStart;
    const end = contentRef.current.selectionEnd;
    const newContent = template.content.substring(0, start) + field + template.content.substring(end);
    
    handleChange('content', newContent);
    
    setTimeout(() => {
      if (contentRef.current) {
        const newPosition = start + field.length;
        contentRef.current.focus();
        contentRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // Calculate progress based on filled fields
  const calculateProgress = () => {
    const requiredFields = [
      template.name.trim(),
      template.subject.trim(),
      template.content.trim()
    ];
    
    const completedFields = requiredFields.filter(Boolean).length;
    return Math.round((completedFields / 3) * 100);
  };

  if (isMobile) {
    return (
      <MobileCreateTemplate
        template={template}
        setTemplate={setTemplate}
        handleSave={handleSave}
        insertMergeField={insertMergeField}
        navigate={navigate}
      />
    );
  }

  const MERGE_FIELDS = [
    { id: 'salutationField', label: 'Salutation', value: 'salutationField', example: 'Mr/Ms' },
    { id: 'firstNameField', label: 'First name', value: 'firstNameField', example: 'John' },
    { id: 'lastNameField', label: 'Last name', value: 'lastNameField', example: 'Doe' },
    { id: 'companyField', label: 'Company', value: 'companyField', example: 'Acme Corp' },
    { id: 'positionField', label: 'Position', value: 'positionField', example: 'Software Engineer' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto backdrop-blur-sm bg-black/30 p-0"
      onClick={() => navigate('/email-templates')}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-4xl h-[90vh] my-4 bg-white dark:bg-gray-900 
          rounded-xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/email-templates')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Template
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {progress === 100 ? 'Ready to save' : `${progress}% complete`}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'editor'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Preview
              </button>
            </div>
            
            <button
              onClick={handleSave}
              disabled={!template.name || !template.subject || !template.content || isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg
                bg-gradient-to-r from-purple-600 to-indigo-600
                text-white font-medium text-sm
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${progress === 100 ? 'opacity-100 hover:opacity-90' : 'opacity-70'}`}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Template
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'editor' ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={template.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 
                      border border-gray-200 dark:border-gray-700 
                      rounded-lg text-gray-900 dark:text-white 
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    placeholder="e.g., Professional Introduction"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={template.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 
                      border border-gray-200 dark:border-gray-700 
                      rounded-lg text-gray-900 dark:text-white 
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    placeholder="e.g., Follow-up: positionField opportunity at companyField"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Content
                  </label>
                  <div className="flex items-center text-xs text-purple-600 dark:text-purple-400">
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    <span>Add merge fields to personalize your email</span>
                  </div>
                </div>
                
                <div className="mb-4 overflow-x-auto whitespace-nowrap pb-2">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {MERGE_FIELDS.map((field) => (
                      <button
                        key={field.id}
                        onClick={() => insertMergeField(field.value)}
                        className="flex-none inline-flex items-center px-4 py-2 rounded-lg 
                          bg-purple-50 dark:bg-purple-900/10 
                          text-purple-600 dark:text-purple-400 
                          text-sm font-medium 
                          hover:bg-purple-100 dark:hover:bg-purple-900/20 
                          transition-colors"
                      >
                        <TagIcon className="w-4 h-4 mr-2" />
                        {field.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <textarea
                  ref={contentRef}
                  value={template.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 
                    border border-gray-200 dark:border-gray-700 
                    rounded-lg text-gray-900 dark:text-white 
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500
                    font-mono text-sm"
                  placeholder="Dear salutationField lastNameField,

I hope this message finds you well..."
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TagIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tags (comma-separated)
                  </label>
                </div>
                <input
                  type="text"
                  value={template.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 
                    border border-gray-200 dark:border-gray-700 
                    rounded-lg text-gray-900 dark:text-white 
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="e.g., professional, follow-up, introduction"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    Email Goal
                  </label>
                  <select
                    value={template.goal}
                    onChange={(e) => handleChange('goal', e.target.value as EmailGoal)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 
                      border border-gray-200 dark:border-gray-700 
                      rounded-lg text-gray-900 dark:text-white 
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    {Object.entries(EMAIL_GOALS).map(([key, goal]) => (
                      <option key={key} value={key}>{goal.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-purple-500" />
                    Language
                  </label>
                  <select
                    value={template.language}
                    onChange={(e) => handleChange('language', e.target.value as LanguageType)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 
                      border border-gray-200 dark:border-gray-700 
                      rounded-lg text-gray-900 dark:text-white 
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <TemplatePreview 
                content={template.content} 
                className="max-w-2xl mx-auto bg-white dark:bg-gray-800 
                  p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
              />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

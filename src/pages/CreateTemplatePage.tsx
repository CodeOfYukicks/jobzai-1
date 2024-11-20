import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, MessageSquare, Globe2, Tags, Eye, Save, Target, InfoCircle, ChevronLeft, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EMAIL_GOALS, type EmailGoal } from '../lib/constants/emailGoals';
import { MobileCreateTemplate } from '../components/mobile/MobileCreateTemplate';

type Step = 'config' | 'compose';

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

  const [currentStep, setCurrentStep] = useState<Step>('config');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    }
  };

  const insertMergeField = (field: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    const subject = document.getElementById('template-subject') as HTMLInputElement;
    const activeElement = document.activeElement;
    
    if (activeElement === subject) {
      const start = subject.selectionStart;
      const end = subject.selectionEnd;
      const newSubject = template.subject.substring(0, start) + field + template.subject.substring(end);
      handleChange('subject', newSubject);
      setTimeout(() => {
        subject.selectionStart = subject.selectionEnd = start + field.length;
        subject.focus();
      }, 0);
    } else {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = template.content.substring(0, start) + field + template.content.substring(end);
      handleChange('content', newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + field.length;
        textarea.focus();
      }, 0);
    }
  };

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

  return (
    <div className="relative h-screen overflow-auto">
      {/* Layout principal avec flou amélioré */}
      <AuthLayout>
        <div className="filter blur-md opacity-50">
          {/* Contenu existant de la page */}
          <div className="container mx-auto px-4">
            {/* ... contenu normal ... */}
          </div>
        </div>
      </AuthLayout>

      {/* Modal overlay avec fond plus foncé */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        {/* Background overlay plus foncé et plus flou */}
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />

        {/* Modal */}
        <div className="relative w-full max-w-3xl bg-white dark:bg-[#0B1120] rounded-3xl shadow-xl overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#9333EA]/10 flex items-center justify-center relative">
                {/* Cercle de progression */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-[#9333EA]/20"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-[#9333EA]"
                    strokeDasharray={`${(calculateProgress() / 100) * (2 * Math.PI * 20)} ${2 * Math.PI * 20}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[#9333EA] font-medium relative">
                  {calculateProgress()}%
                </span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Template Studio</h1>
                <p className="text-gray-500 dark:text-gray-400">Create your perfect email</p>
              </div>
            </div>
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Inputs et champs */}
          <div className="p-6 space-y-6">
            {/* Template Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Template Name</label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Professional Introduction"
                className="w-full px-3 py-2 rounded-lg 
                  bg-white dark:bg-[#0B1120]
                  border border-gray-200 dark:border-gray-800
                  text-gray-900 dark:text-gray-100
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  focus:border-[#9333EA] focus:ring-1 focus:ring-[#9333EA]"
              />
            </div>

            {/* Merge Fields */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Mail className="w-4 h-4" />
                <span>Available merge fields</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">Recipient's information that will be automatically replaced</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { field: '{{salutation}}', example: 'Mr/Ms', note: 'Formal title' },
                  { field: '{{firstName}}', example: 'John' },
                  { field: '{{lastName}}', example: 'Doe' },
                  { field: '{{company}}', example: 'Acme Corp' },
                  { field: '{{position}}', example: 'Software Engineer' }
                ].map(({ field, example, note }) => (
                  <button
                    key={field}
                    onClick={() => insertMergeField(field)}
                    className="flex flex-col items-start p-3 rounded-lg 
                      bg-white dark:bg-[#0B1120]
                      border border-gray-200 dark:border-gray-800
                      hover:border-[#9333EA]
                      transition-colors text-left"
                  >
                    <span className="font-mono text-sm text-[#9333EA]">{field}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Example: {example}</span>
                    {note && <span className="text-xs text-purple-500 dark:text-purple-400 mt-1">{note}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Line */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Line</label>
              <input
                id="template-subject"
                type="text"
                value={template.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="e.g., Follow-up: {{position}} opportunity at {{company}}"
                className="w-full px-3 py-2 rounded-lg 
                  bg-white dark:bg-gray-900
                  border border-gray-200 dark:border-gray-700
                  text-gray-900 dark:text-gray-100
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  focus:border-purple-500 dark:focus:border-purple-400 focus:ring-0"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <textarea
                id="template-content"
                value={template.content}
                onChange={(e) => handleChange('content', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 rounded-lg 
                  bg-white dark:bg-gray-900
                  border border-gray-200 dark:border-gray-700
                  text-gray-900 dark:text-gray-100
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  focus:border-purple-500 dark:focus:border-purple-400 focus:ring-0
                  font-mono text-sm"
                placeholder={`Dear {{salutation}} {{lastName}},\n\nI hope this message finds you well...\n\nBest regards,\n[Your name]`}
              />
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Goal */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Target className="w-4 h-4" />
                  Email Goal
                </label>
                <div className="space-y-2">
                  {['Build Connection', 'Explore Opportunities', 'Make Introduction'].map((goal) => (
                    <button
                      key={goal}
                      onClick={() => handleChange('goal', goal.toLowerCase())}
                      className={`w-full p-3 text-left rounded-lg border transition-colors
                        ${template.goal === goal.toLowerCase()
                          ? 'bg-[#9333EA]/10 border-[#9333EA] text-white'
                          : 'bg-white dark:bg-[#0B1120] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#9333EA]'
                        }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language & Tags */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Globe2 className="w-4 h-4" />
                    Language
                  </label>
                  <select
                    value={template.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg 
                      bg-white dark:bg-gray-900
                      border border-gray-200 dark:border-gray-700
                      text-gray-900 dark:text-gray-100
                      focus:border-purple-500 dark:focus:border-purple-400 focus:ring-0"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Tags className="w-4 h-4" />
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={template.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    placeholder="e.g., professional, introduction, job-application"
                    className="w-full px-3 py-2 rounded-lg 
                      bg-white dark:bg-gray-900
                      border border-gray-200 dark:border-gray-700
                      text-gray-900 dark:text-gray-100
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      focus:border-purple-500 dark:focus:border-purple-400 focus:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Generate Template Button */}
            <div className="pt-4">
              <button
                onClick={handleSave}
                className="w-full py-3 px-4 bg-[#9333EA] hover:bg-[#9333EA]/90
                  text-white font-medium rounded-xl transition-colors
                  flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4V20M20 12L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Generate Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

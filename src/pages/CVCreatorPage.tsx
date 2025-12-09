import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  FileText, Briefcase, Building2, Sparkles, Upload, Check, X,
  ChevronRight, ChevronDown, ChevronUp, Trash2, Loader2, Link2,
  Copy, Download, Eye, Wand2, Calendar, Info, AlignLeft, Save,
  Palette, Type, Layout, Languages, Copy as CopyIcon, ArrowLeft,
  Plus, Minus, GripVertical, Edit2, Zap, Target, TrendingUp
} from 'lucide-react';
import { Dialog, Disclosure } from '@headlessui/react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import {
  doc, collection, addDoc, updateDoc, getDoc, deleteDoc,
  serverTimestamp, onSnapshot, query, orderBy
} from 'firebase/firestore';
import { notify } from '@/lib/notify';
import { db } from '../lib/firebase';

// CV Data Structure
interface CVSection {
  id: string;
  type: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'languages' | 'custom';
  title: string;
  content: string;
  order: number;
  visible: boolean;
}

interface CVData {
  id?: string;
  title: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
    jobTitle: string;
  };
  sections: CVSection[];
  styling: {
    color: string;
    font: string;
    template: 'harvard' | 'modern' | 'classic' | 'minimal';
  };
  score?: number;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

const defaultSections: CVSection[] = [
  { id: 'summary', type: 'summary', title: 'Professional Summary', content: '', order: 0, visible: true },
  { id: 'experience', type: 'experience', title: 'Experience', content: '', order: 1, visible: true },
  { id: 'education', type: 'education', title: 'Education', content: '', order: 2, visible: true },
  { id: 'skills', type: 'skills', title: 'Skills', content: '', order: 3, visible: true },
];

const colorOptions = [
  { name: 'Purple', value: '#8B5CF6', class: 'bg-purple-600' },
  { name: 'Indigo', value: '#6366F1', class: 'bg-indigo-600' },
  { name: 'Blue', value: '#3B82F6', class: 'bg-blue-600' },
  { name: 'Teal', value: '#14B8A6', class: 'bg-teal-600' },
  { name: 'Green', value: '#22C55E', class: 'bg-green-600' },
  { name: 'Gray', value: '#6B7280', class: 'bg-gray-600' },
];

const fontOptions = [
  { name: 'Merriweather', value: 'Merriweather' },
  { name: 'Inter', value: 'Inter' },
  { name: 'Roboto', value: 'Roboto' },
  { name: 'Open Sans', value: 'Open Sans' },
  { name: 'Lato', value: 'Lato' },
];

const templateOptions = [
  { name: 'Harvard', value: 'harvard' },
  { name: 'Modern', value: 'modern' },
  { name: 'Classic', value: 'classic' },
  { name: 'Minimal', value: 'minimal' },
];

export default function CVCreatorPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [cvData, setCvData] = useState<CVData>({
    title: 'My Resume',
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: '',
      jobTitle: '',
    },
    sections: [...defaultSections],
    styling: {
      color: '#8B5CF6',
      font: 'Inter',
      template: 'modern',
    },
    userId: currentUser?.uid || '',
  });
  const [activeTab, setActiveTab] = useState<'edit' | 'adapt'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['personalize']));
  const [isPreviewBlurred, setIsPreviewBlurred] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiEditingSection, setAiEditingSection] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // Calculate CV Score
  const calculateCVScore = (): number => {
    let score = 0;
    const maxScore = 100;

    // Personal info (20 points)
    if (cvData.personalInfo.firstName) score += 3;
    if (cvData.personalInfo.lastName) score += 3;
    if (cvData.personalInfo.email) score += 4;
    if (cvData.personalInfo.phone) score += 3;
    if (cvData.personalInfo.location) score += 2;
    if (cvData.personalInfo.linkedin) score += 2;
    if (cvData.personalInfo.jobTitle) score += 3;

    // Summary (15 points)
    const summarySection = cvData.sections.find(s => s.type === 'summary');
    if (summarySection && summarySection.content.trim().length > 50) {
      score += 15;
    }

    // Experience (30 points)
    const experienceSection = cvData.sections.find(s => s.type === 'experience');
    if (experienceSection && experienceSection.content.trim().length > 100) {
      score += 30;
    }

    // Education (15 points)
    const educationSection = cvData.sections.find(s => s.type === 'education');
    if (educationSection && educationSection.content.trim().length > 50) {
      score += 15;
    }

    // Skills (15 points)
    const skillsSection = cvData.sections.find(s => s.type === 'skills');
    if (skillsSection && skillsSection.content.trim().length > 30) {
      score += 15;
    }

    // Additional sections (5 points)
    const additionalSections = cvData.sections.filter(s => 
      !['summary', 'experience', 'education', 'skills'].includes(s.type)
    );
    if (additionalSections.length > 0) {
      score += Math.min(5, additionalSections.length);
    }

    return Math.min(maxScore, score);
  };

  // Save CV to Firestore
  const saveCV = async () => {
    if (!currentUser) {
      notify.error('Please log in to save your CV');
      return;
    }

    setIsSaving(true);
    try {
      const score = calculateCVScore();
      const cvToSave = {
        ...cvData,
        userId: currentUser.uid,
        score,
        updatedAt: serverTimestamp(),
      };

      if (cvData.id) {
        // Update existing CV
        await updateDoc(doc(db, 'users', currentUser.uid, 'cvs', cvData.id), cvToSave);
        notify.success('CV saved successfully!');
      } else {
        // Create new CV
        const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'cvs'), {
          ...cvToSave,
          createdAt: serverTimestamp(),
        });
        setCvData({ ...cvData, id: docRef.id });
        notify.success('CV created and saved!');
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving CV:', error);
      notify.error('Failed to save CV');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!currentUser || !cvData.id) return;

    const autoSaveInterval = setInterval(() => {
      saveCV();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [cvData, currentUser]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Add new section
  const addSection = () => {
    const newSection: CVSection = {
      id: `section-${Date.now()}`,
      type: 'custom',
      title: 'New Section',
      content: '',
      order: cvData.sections.length,
      visible: true,
    };
    setCvData({
      ...cvData,
      sections: [...cvData.sections, newSection],
    });
  };

  // Delete section
  const deleteSection = (sectionId: string) => {
    setCvData({
      ...cvData,
      sections: cvData.sections.filter(s => s.id !== sectionId),
    });
  };

  // Update section
  const updateSection = (sectionId: string, updates: Partial<CVSection>) => {
    setCvData({
      ...cvData,
      sections: cvData.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    });
  };

  // Handle drag end for section reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(cvData.sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const reorderedSections = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setCvData({
      ...cvData,
      sections: reorderedSections,
    });
  };

  // AI Edit function
  const handleAIEdit = async () => {
    if (!aiPrompt.trim() || !aiEditingSection) return;

    setIsAIGenerating(true);
    try {
      const section = cvData.sections.find(s => s.id === aiEditingSection);
      if (!section) return;

      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cv-edit',
          prompt: `Edit this CV section content: "${section.content}". Instruction: ${aiPrompt}. Return only the edited content, keeping the same format and structure.`,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        updateSection(aiEditingSection, { content: data.content });
        notify.success('Content edited with AI!');
        setIsAIModalOpen(false);
        setAiPrompt('');
      } else {
        throw new Error(data.message || 'AI editing failed');
      }
    } catch (error: any) {
      console.error('Error editing with AI:', error);
      notify.error(error.message || 'Failed to edit with AI');
    } finally {
      setIsAIGenerating(false);
    }
  };

  // Generate PDF
  const generatePDF = async () => {
    notify.info('PDF generation coming soon...');
    // TODO: Implement PDF generation using jsPDF or similar
  };

  // Duplicate CV
  const duplicateCV = () => {
    const newCV: CVData = {
      ...cvData,
      id: undefined,
      title: `${cvData.title} (Copy)`,
      sections: cvData.sections.map(s => ({ ...s, id: `${s.id}-copy-${Date.now()}` })),
    };
    setCvData(newCV);
    notify.success('CV duplicated!');
  };

  // Translate CV
  const translateCV = async (targetLanguage: string) => {
    notify.info(`Translation to ${targetLanguage} coming soon...`);
    // TODO: Implement translation using OpenAI or DeepL API
  };

  const cvScore = calculateCVScore();

  return (
    <AuthLayout>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={async () => {
              await saveCV();
              navigate(-1);
            }}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Save and exit</span>
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">CV Creator</h1>
            {isSaved && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-xs font-medium">Saved in the cloud</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={generatePDF}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={() => setIsPreviewBlurred(!isPreviewBlurred)}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              Open link
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Control Panel */}
          <div className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* CV Title */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <input
                    type="text"
                    value={cvData.title}
                    onChange={(e) => setCvData({ ...cvData, title: e.target.value })}
                    className="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                  />
                </div>
                <button
                  onClick={() => {}}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                >
                  Use as base
                </button>
              </div>

              {/* Collapsible Sections */}
              <div className="space-y-2">
                {/* Duplicate & Translate */}
                <Disclosure>
                  {({ open }) => (
                    <>
                      <Disclosure.Button className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-2">
                          <CopyIcon className="w-4 h-4" />
                          <span>Duplicate and translate</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'transform rotate-180' : ''}`} />
                      </Disclosure.Button>
                      <Disclosure.Panel className="px-4 py-3 space-y-2">
                        <button
                          onClick={duplicateCV}
                          className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Duplicate CV
                        </button>
                        <button
                          onClick={() => translateCV('French')}
                          className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Translate to French
                        </button>
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>

                {/* Harvard Model */}
                <Disclosure>
                  {({ open }) => (
                    <>
                      <Disclosure.Button className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>Harvard Model</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'transform rotate-180' : ''}`} />
                      </Disclosure.Button>
                      <Disclosure.Panel className="px-4 py-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Apply the Harvard CV template format
                        </p>
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>

                {/* Organize Sections */}
                <Disclosure>
                  {({ open }) => (
                    <>
                      <Disclosure.Button className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-2">
                          <Layout className="w-4 h-4" />
                          <span>Organize sections</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'transform rotate-180' : ''}`} />
                      </Disclosure.Button>
                      <Disclosure.Panel className="px-4 py-3">
                        <DragDropContext onDragEnd={handleDragEnd}>
                          <Droppable droppableId="sections">
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                {cvData.sections
                                  .sort((a, b) => a.order - b.order)
                                  .map((section, index) => (
                                    <Draggable key={section.id} draggableId={section.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg ${
                                            snapshot.isDragging ? 'shadow-lg ring-2 ring-purple-500' : ''
                                          }`}
                                        >
                                          <div {...provided.dragHandleProps}>
                                            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                          </div>
                                          <input
                                            type="text"
                                            value={section.title}
                                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                            className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-transparent border-none focus:outline-none focus:ring-0"
                                          />
                                          <button
                                            onClick={() => deleteSection(section.id)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                {provided.placeholder}
                                <button
                                  onClick={addSection}
                                  className="w-full px-3 py-2 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Section
                                </button>
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              </div>

              {/* Customize Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <button
                  onClick={() => toggleSection('personalize')}
                  className="flex items-center justify-between w-full mb-4"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Customize</h3>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.has('personalize') ? 'transform rotate-180' : ''}`} />
                </button>

                {expandedSections.has('personalize') && (
                  <div className="space-y-4">
                    {/* Color */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 text-purple-600" />
                        Color
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setCvData({
                              ...cvData,
                              styling: { ...cvData.styling, color: color.value },
                            })}
                            className={`w-10 h-10 rounded-lg ${color.class} border-2 ${
                              cvData.styling.color === color.value
                                ? 'border-purple-600 ring-2 ring-purple-200'
                                : 'border-gray-200 dark:border-gray-600'
                            } transition-all`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Font */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Type className="w-3.5 h-3.5 text-purple-600" />
                        Font
                      </label>
                      <select
                        value={cvData.styling.font}
                        onChange={(e) => setCvData({
                          ...cvData,
                          styling: { ...cvData.styling, font: e.target.value },
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {fontOptions.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Template */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Layout className="w-3.5 h-3.5 text-purple-600" />
                        Template
                      </label>
                      <select
                        value={cvData.styling.template}
                        onChange={(e) => setCvData({
                          ...cvData,
                          styling: { ...cvData.styling, template: e.target.value as any },
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {templateOptions.map((template) => (
                          <option key={template.value} value={template.value}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* CV Score */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">CV Score</h3>
                  <a href="#" className="text-xs text-purple-600 dark:text-purple-400 hover:underline">
                    Tips
                  </a>
                </div>
                <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${cvScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{cvScore}% complete</p>
              </div>

              {/* Content Tabs */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'edit'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Edit content
                  </button>
                  <button
                    onClick={() => setActiveTab('adapt')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'adapt'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Adapt to offer
                  </button>
                </div>

                {/* Edit Content Form */}
                {activeTab === 'edit' && (
                  <div className="space-y-4">
                    {/* Personal Information */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Personal Information</h4>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={cvData.personalInfo.firstName}
                        onChange={(e) => setCvData({
                          ...cvData,
                          personalInfo: { ...cvData.personalInfo, firstName: e.target.value },
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={cvData.personalInfo.lastName}
                        onChange={(e) => setCvData({
                          ...cvData,
                          personalInfo: { ...cvData.personalInfo, lastName: e.target.value },
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <input
                        type="text"
                        placeholder="Job Title"
                        value={cvData.personalInfo.jobTitle}
                        onChange={(e) => setCvData({
                          ...cvData,
                          personalInfo: { ...cvData.personalInfo, jobTitle: e.target.value },
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={cvData.personalInfo.email}
                        onChange={(e) => setCvData({
                          ...cvData,
                          personalInfo: { ...cvData.personalInfo, email: e.target.value },
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={cvData.personalInfo.phone}
                        onChange={(e) => setCvData({
                          ...cvData,
                          personalInfo: { ...cvData.personalInfo, phone: e.target.value },
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={cvData.personalInfo.location}
                        onChange={(e) => setCvData({
                          ...cvData,
                          personalInfo: { ...cvData.personalInfo, location: e.target.value },
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <input
                        type="url"
                        placeholder="LinkedIn URL"
                        value={cvData.personalInfo.linkedin}
                        onChange={(e) => setCvData({
                          ...cvData,
                          personalInfo: { ...cvData.personalInfo, linkedin: e.target.value },
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    {/* CV Sections */}
                    {cvData.sections
                      .sort((a, b) => a.order - b.order)
                      .map((section) => (
                        <div key={section.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-gray-900 dark:text-white">{section.title}</h4>
                            <button
                              onClick={() => {
                                setAiEditingSection(section.id);
                                setIsAIModalOpen(true);
                              }}
                              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3" />
                              Edit with AI
                            </button>
                          </div>
                          <textarea
                            value={section.content}
                            onChange={(e) => updateSection(section.id, { content: e.target.value })}
                            placeholder={`Enter ${section.title.toLowerCase()}...`}
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                            rows={4}
                          />
                        </div>
                      ))}
                  </div>
                )}

                {/* Adapt to Offer */}
                {activeTab === 'adapt' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Paste a job description to automatically adapt your CV to match the requirements.
                    </p>
                    <textarea
                      placeholder="Paste job description here..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      rows={6}
                    />
                    <button
                      onClick={() => notify.info('Adaptation feature coming soon...')}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Adapt CV
                    </button>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={saveCV}
                disabled={isSaving}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save CV
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Preview Area */}
          <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
            {isPreviewBlurred ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center space-y-4 p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Eye className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Upgrade to unlock your CV</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                    Unlock the full preview and all premium features
                  </p>
                  <button
                    onClick={() => setIsPreviewBlurred(false)}
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto p-8 bg-white">
                {/* CV Preview */}
                <div
                  className="max-w-4xl mx-auto bg-white shadow-lg p-8 rounded-lg"
                  style={{
                    fontFamily: cvData.styling.font,
                    color: cvData.styling.color,
                  }}
                >
                  {/* Header */}
                  <div className="border-b-2 pb-4 mb-6" style={{ borderColor: cvData.styling.color }}>
                    <h1 className="text-3xl font-bold mb-2">
                      {cvData.personalInfo.firstName} {cvData.personalInfo.lastName}
                    </h1>
                    <p className="text-lg font-medium mb-2">{cvData.personalInfo.jobTitle}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {cvData.personalInfo.email && <span>{cvData.personalInfo.email}</span>}
                      {cvData.personalInfo.phone && <span>{cvData.personalInfo.phone}</span>}
                      {cvData.personalInfo.location && <span>{cvData.personalInfo.location}</span>}
                      {cvData.personalInfo.linkedin && <span>{cvData.personalInfo.linkedin}</span>}
                    </div>
                  </div>

                  {/* Sections */}
                  {cvData.sections
                    .filter(s => s.visible)
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div key={section.id} className="mb-6">
                        <h2
                          className="text-xl font-semibold mb-3 uppercase tracking-wide"
                          style={{ color: cvData.styling.color }}
                        >
                          {section.title}
                        </h2>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {section.content || `Add your ${section.title.toLowerCase()} here...`}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* AI Edit Button (floating) */}
            {!isPreviewBlurred && (
              <button
                onClick={() => {
                  setAiEditingSection('summary');
                  setIsAIModalOpen(true);
                }}
                className="absolute bottom-6 right-6 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Edit with AI
              </button>
            )}
          </div>
        </div>

        {/* AI Edit Modal */}
        <AnimatePresence>
          {isAIModalOpen && (
            <Dialog open={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} className="relative z-50">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Edit with AI
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Instruction
                      </label>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., Make it more formal, Add more technical details, Translate to French..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsAIModalOpen(false)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAIEdit}
                        disabled={isAIGenerating || !aiPrompt.trim()}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isAIGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Apply
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </div>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}


import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Search, Filter, Trash2, Copy, Eye, Plus,
  Loader2, Calendar, Edit, MoreVertical, Sparkles, Wand2, ChevronDown, X, Check, Info
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs, deleteDoc, doc, orderBy, addDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { CVData, CVTemplate } from '../types/cvEditor';
import { generateId } from '../lib/cvEditorUtils';
import CVPreviewCard from '../components/resume-builder/CVPreviewCard';

interface Resume {
  id: string;
  name: string;
  cvData: CVData;
  createdAt: any;
  updatedAt: any;
  template?: string;
  layoutSettings?: any;
}

// Initial empty CV data structure
const initialCVData: CVData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    github: '',
    title: ''
  },
  summary: '',
  experiences: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],
  languages: [],
  sections: [
    { id: 'personal', type: 'personal', title: 'Personal Information', enabled: true, order: 0 },
    { id: 'summary', type: 'summary', title: 'Professional Summary', enabled: true, order: 1 },
    { id: 'experience', type: 'experience', title: 'Work Experience', enabled: true, order: 2 },
    { id: 'education', type: 'education', title: 'Education', enabled: true, order: 3 },
    { id: 'skills', type: 'skills', title: 'Skills', enabled: true, order: 4 },
    { id: 'certifications', type: 'certifications', title: 'Certifications', enabled: false, order: 5 },
    { id: 'projects', type: 'projects', title: 'Projects', enabled: false, order: 6 },
    { id: 'languages', type: 'languages', title: 'Languages', enabled: false, order: 7 }
  ]
};

export default function ResumeBuilderPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newResumeName, setNewResumeName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplate>('modern-professional');

  // Fetch resumes from Firestore
  const fetchResumes = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      const resumesRef = collection(db, 'users', currentUser.uid, 'cvs');
      const q = query(resumesRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const resumesList: Resume[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Skip the 'default' document if it exists
        if (doc.id !== 'default' && data.cvData) {
          resumesList.push({
            id: doc.id,
            name: data.name || 'Untitled Resume',
            cvData: data.cvData || initialCVData,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            template: data.template,
            layoutSettings: data.layoutSettings
          });
        }
      });

      setResumes(resumesList);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  // Templates available
  const templates: { value: CVTemplate; label: string; description: string }[] = [
    { value: 'modern-professional', label: 'Modern Professional', description: 'Clean and ATS-optimized' },
    { value: 'executive-classic', label: 'Executive Classic', description: 'Traditional and elegant' },
    { value: 'tech-minimalist', label: 'Tech Minimalist', description: 'Google/Linear inspired' },
    { value: 'creative-balance', label: 'Creative Balance', description: 'Modern with personality' }
  ];

  // Open create modal
  const openCreateModal = () => {
    setNewResumeName('');
    setSelectedTemplate('modern-professional');
    setIsCreateModalOpen(true);
  };

  // Create new resume
  const createNewResume = async (name: string, template: CVTemplate) => {
    if (!currentUser) {
      toast.error('Please log in to create a resume');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter a resume name');
      return;
    }

    setIsCreating(true);
    try {
      const resumeId = generateId();
      const newResume: Resume = {
        id: resumeId,
        name: name.trim(),
        cvData: initialCVData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        template: template
      };

      // Save to Firestore
      const docRef = doc(db, 'users', currentUser.uid, 'cvs', resumeId);
      await setDoc(docRef, {
        ...newResume,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Resume created!');
      setIsCreateModalOpen(false);
      navigate(`/resume-builder/${resumeId}/cv-editor`);
    } catch (error) {
      console.error('Error creating resume:', error);
      toast.error('Failed to create resume');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle create button click in modal
  const handleCreate = () => {
    createNewResume(newResumeName, selectedTemplate);
  };

  // Delete resume
  const deleteResume = async (resumeId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'cvs', resumeId));
      setResumes(prev => prev.filter(r => r.id !== resumeId));
      toast.success('Resume deleted');
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
    }
  };

  // Duplicate resume
  const duplicateResume = async (resume: Resume) => {
    if (!currentUser) return;

    try {
      const newResumeId = generateId();
      const duplicatedResume: Resume = {
        ...resume,
        id: newResumeId,
        name: `${resume.name} (Copy)`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = doc(db, 'users', currentUser.uid, 'cvs', newResumeId);
      await setDoc(docRef, {
        ...duplicatedResume,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setResumes(prev => [duplicatedResume, ...prev]);
      toast.success('Resume duplicated');
    } catch (error) {
      console.error('Error duplicating resume:', error);
      toast.error('Failed to duplicate resume');
    }
  };

  // Enhance resume with AI - navigate to editor where AI features are available
  const enhanceResumeWithAI = (resumeId: string) => {
    navigate(`/resume-builder/${resumeId}/cv-editor`);
    toast.info('AI enhancement features are available in the editor');
  };

  // Handle edit navigation
  const handleEditResume = (resumeId: string) => {
    navigate(`/resume-builder/${resumeId}/cv-editor`);
  };

  // Rename resume
  const renameResume = async (resumeId: string, newName: string) => {
    if (!currentUser) return;

    try {
      const resumeRef = doc(db, 'users', currentUser.uid, 'cvs', resumeId);
      await updateDoc(resumeRef, {
        name: newName,
        updatedAt: serverTimestamp()
      });
      
      setResumes(prev => prev.map(r => 
        r.id === resumeId ? { ...r, name: newName } : r
      ));
      toast.success('Resume renamed');
    } catch (error) {
      console.error('Error renaming resume:', error);
      toast.error('Failed to rename resume');
    }
  };

  // Filter and sort resumes
  const filteredAndSortedResumes = () => {
    let filtered = [...resumes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) => r.name.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0);
        const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0);
        return dateB.getTime() - dateA.getTime();
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return filtered;
  };

  const filteredResumes = filteredAndSortedResumes();

  return (
    <AuthLayout>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          {/* Minimal Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Resume Builder
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Create and manage your professional resumes
              </p>
            </div>
            <button
              onClick={openCreateModal}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                text-gray-700 dark:text-gray-200 
                bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                border border-gray-200 dark:border-gray-700 rounded-lg
                hover:bg-gray-50 dark:hover:bg-gray-700/80 
                hover:border-gray-300 dark:hover:border-gray-600
                shadow-sm hover:shadow transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Resume</span>
            </button>
          </div>

          {/* Minimal Search and Filters - Notion Style */}
          {resumes.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              {/* Search Input */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2 
                    bg-transparent
                    border border-gray-200 dark:border-gray-700 rounded-lg
                    focus:border-gray-300 dark:focus:border-gray-600
                    focus:ring-0 focus:outline-none
                    text-sm text-gray-900 dark:text-white placeholder-gray-400
                    transition-colors duration-200"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Sort By */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                    className="appearance-none bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm text-gray-600 dark:text-gray-300 focus:border-gray-300 dark:focus:border-gray-600 focus:ring-0 focus:outline-none cursor-pointer transition-colors duration-200"
                  >
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>

              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && resumes.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 
                flex items-center justify-center mx-auto mb-4">
                <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1.5">
                No resumes yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
                Create your first professional resume to get started.
              </p>

              <button
                onClick={createNewResume}
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                  text-gray-700 dark:text-gray-200 
                  bg-white dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700 rounded-lg
                  hover:bg-gray-50 dark:hover:bg-gray-700 
                  hover:border-gray-300 dark:hover:border-gray-600
                  shadow-sm transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>New Resume</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Resumes Grid */}
          {!isLoading && filteredResumes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <AnimatePresence>
                {filteredResumes.map((resume) => (
                  <CVPreviewCard
                    key={resume.id}
                    resume={resume}
                    onDelete={deleteResume}
                    onRename={renameResume}
                    onEdit={handleEditResume}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* No Results */}
          {!isLoading && resumes.length > 0 && filteredResumes.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 
                flex items-center justify-center mx-auto mb-3">
                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                No results
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Try adjusting your filters
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                }}
                className="text-sm text-gray-600 dark:text-gray-400 
                  hover:text-gray-900 dark:hover:text-white 
                  underline underline-offset-2 transition-colors"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Create Resume Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isCreating && setIsCreateModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#121212] w-full sm:rounded-2xl rounded-t-2xl max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl z-10 sticky top-0">
                <div>
                  <h2 className="font-semibold text-xl text-gray-900 dark:text-white tracking-tight">
                    Create New Resume
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Choose a name and template for your resume
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreating}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
                <div className="space-y-6">
                  {/* Resume Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Resume Name
                    </label>
                    <input
                      type="text"
                      value={newResumeName}
                      onChange={(e) => setNewResumeName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newResumeName.trim() && !isCreating) {
                          handleCreate();
                        }
                      }}
                      placeholder="e.g., Software Engineer Resume"
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 
                        rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                        text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                        transition-all shadow-sm"
                      autoFocus
                    />
                  </div>

                  {/* Template Selection */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Choose Template
                      </label>
                      <div className="group relative">
                        <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20">
                          <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-nowrap">
                            You can change the template anytime during editing
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {templates.map((template) => (
                        <motion.button
                          key={template.value}
                          onClick={() => setSelectedTemplate(template.value)}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`group relative p-4 rounded-2xl border transition-all text-left
                            ${
                              selectedTemplate === template.value
                                ? 'border-purple-500/50 dark:border-purple-400/50 bg-purple-50/50 dark:bg-purple-900/10 shadow-lg shadow-purple-200/30 dark:shadow-purple-900/20'
                                : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-white dark:hover:bg-[#202020] hover:shadow-lg hover:border-transparent'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                {template.label}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {template.description}
                              </p>
                            </div>
                            {selectedTemplate === template.value && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 rounded-full bg-purple-500 dark:bg-purple-600 flex items-center justify-center flex-shrink-0 ml-2"
                              >
                                <Check className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors
                    disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newResumeName.trim() || isCreating}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700
                    rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Resume
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}


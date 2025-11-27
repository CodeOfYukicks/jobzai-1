import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Search, Loader2, Sparkles, ChevronDown, X, Check, Info
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs, deleteDoc, doc, orderBy, addDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from 'sonner';
import { CVData, CVTemplate } from '../types/cvEditor';
import { generateId } from '../lib/cvEditorUtils';
import CVPreviewCard from '../components/resume-builder/CVPreviewCard';
import { Folder } from '../components/resume-builder/FolderCard';
import FolderManagementModal from '../components/resume-builder/FolderManagementModal';
import FolderSidebar, { SelectedFolderType } from '../components/resume-builder/FolderSidebar';
import FolderHeader from '../components/resume-builder/FolderHeader';

export interface Resume {
  id: string;
  name: string;
  cvData: CVData;
  createdAt: any;
  updatedAt: any;
  template?: string;
  layoutSettings?: any;
  folderId?: string;
  tags?: string[];
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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newResumeName, setNewResumeName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplate>('modern-professional');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isSavingFolder, setIsSavingFolder] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<SelectedFolderType>('all');
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);

  // Fetch folders from Firestore
  const fetchFolders = useCallback(async () => {
    if (!currentUser) return;

    try {
      const foldersRef = collection(db, 'users', currentUser.uid, 'folders');
      const q = query(foldersRef, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);

      const foldersList: Folder[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        foldersList.push({
          id: doc.id,
          name: data.name,
          icon: data.icon || '📁',
          color: data.color || '#8B5CF6',
          coverPhoto: data.coverPhoto,
          order: data.order || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      setFolders(foldersList);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    }
  }, [currentUser]);

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
            layoutSettings: data.layoutSettings,
            folderId: data.folderId,
            tags: data.tags || []
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
    if (currentUser) {
      fetchFolders();
      fetchResumes();
    }
  }, [currentUser, fetchFolders, fetchResumes]);

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

  // Update resume tags
  const updateResumeTags = async (resumeId: string, tags: string[]) => {
    if (!currentUser) return;

    try {
      const resumeRef = doc(db, 'users', currentUser.uid, 'cvs', resumeId);
      await updateDoc(resumeRef, {
        tags,
        updatedAt: serverTimestamp()
      });
      
      setResumes(prev => prev.map(r => 
        r.id === resumeId ? { ...r, tags } : r
      ));
    } catch (error) {
      console.error('Error updating resume tags:', error);
      toast.error('Failed to update tags');
    }
  };

  // Folder management functions
  const createFolder = async (folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;

    setIsSavingFolder(true);
    try {
      const foldersRef = collection(db, 'users', currentUser.uid, 'folders');
      const newFolder = {
        ...folderData,
        order: folders.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(foldersRef, newFolder);
      
      const createdFolder: Folder = {
        id: docRef.id,
        ...folderData,
        order: folders.length,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setFolders(prev => [...prev, createdFolder]);
      setIsFolderModalOpen(false);
      setEditingFolder(null);
      toast.success('Folder created');
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    } finally {
      setIsSavingFolder(false);
    }
  };

  const updateFolder = async (folderId: string, updates: Partial<Folder>) => {
    if (!currentUser) return;

    setIsSavingFolder(true);
    try {
      const folderRef = doc(db, 'users', currentUser.uid, 'folders', folderId);
      await updateDoc(folderRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      setFolders(prev => prev.map(f => 
        f.id === folderId ? { ...f, ...updates } : f
      ));
      setIsFolderModalOpen(false);
      setEditingFolder(null);
      toast.success('Folder updated');
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('Failed to update folder');
    } finally {
      setIsSavingFolder(false);
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!currentUser) return;

    try {
      // Move all CVs in this folder to uncategorized (remove folderId)
      const folderResumes = resumes.filter(r => r.folderId === folderId);
      for (const resume of folderResumes) {
        const resumeRef = doc(db, 'users', currentUser.uid, 'cvs', resume.id);
        await updateDoc(resumeRef, {
          folderId: null,
          updatedAt: serverTimestamp()
        });
      }

      // Update local state
      setResumes(prev => prev.map(r => 
        r.folderId === folderId ? { ...r, folderId: undefined } : r
      ));

      // Delete folder
      await deleteDoc(doc(db, 'users', currentUser.uid, 'folders', folderId));
      setFolders(prev => prev.filter(f => f.id !== folderId));
      toast.success('Folder deleted');
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  // Move CV to folder - called from FolderSidebar on drop
  const handleDropResume = async (resumeId: string, folderId: string | null) => {
    if (!currentUser || !resumeId) return;

    // Find current folder of the resume
    const resume = resumes.find(r => r.id === resumeId);
    if (!resume) return;

    // Don't do anything if dropping to same folder
    const currentFolder = resume.folderId || null;
    if (currentFolder === folderId) return;

    try {
      const resumeRef = doc(db, 'users', currentUser.uid, 'cvs', resumeId);
      await updateDoc(resumeRef, {
        folderId: folderId || null,
        updatedAt: serverTimestamp()
      });
      
      setResumes(prev => prev.map(r => 
        r.id === resumeId ? { ...r, folderId: folderId || undefined } : r
      ));

      const folderName = folderId 
        ? folders.find(f => f.id === folderId)?.name || 'folder'
        : 'Uncategorized';
      toast.success(`Moved "${resume.name}" to ${folderName}`);
    } catch (error) {
      console.error('Error moving CV:', error);
      toast.error('Failed to move resume');
    }
  };

  const handleSelectFolder = (folderId: SelectedFolderType) => {
    setSelectedFolderId(folderId);
  };

  const openFolderModal = (folder?: Folder) => {
    setEditingFolder(folder || null);
    setIsFolderModalOpen(true);
  };

  const handleFolderSave = async (folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingFolder) {
      await updateFolder(editingFolder.id, folderData);
    } else {
      await createFolder(folderData);
    }
  };

  const handleUpdateCover = async (blob: Blob) => {
    if (!currentUser || !selectedFolderId || typeof selectedFolderId !== 'string' || selectedFolderId === 'all') return;
    
    setIsUpdatingCover(true);
    try {
      const timestamp = Date.now();
      // Use cover-photos collection which is already allowed in storage.rules
      // Naming convention: folder_{folderId}_cover_{timestamp}.jpg
      const fileName = `folder_${selectedFolderId}_cover_${timestamp}.jpg`;
      const folderCoverRef = ref(storage, `cover-photos/${currentUser.uid}/${fileName}`);
      
      await uploadBytes(folderCoverRef, blob, { contentType: 'image/jpeg' });
      const coverUrl = await getDownloadURL(folderCoverRef);
      
      await updateFolder(selectedFolderId, { coverPhoto: coverUrl });
      toast.success('Folder cover updated');
    } catch (error) {
      console.error('Error updating folder cover:', error);
      toast.error('Failed to update cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!currentUser || !selectedFolderId || typeof selectedFolderId !== 'string' || selectedFolderId === 'all') return;
    
    const folder = folders.find(f => f.id === selectedFolderId);
    if (!folder || !folder.coverPhoto) return;

    setIsUpdatingCover(true);
    try {
      await updateFolder(selectedFolderId, { coverPhoto: undefined }); // FieldValue.delete() in update would be cleaner but simple update works if logic handles it
      
      try {
        const coverRef = ref(storage, folder.coverPhoto);
        await deleteObject(coverRef);
      } catch (e) {
        console.warn('Could not delete old cover photo from storage', e);
      }
      
      toast.success('Folder cover removed');
    } catch (error) {
      console.error('Error removing folder cover:', error);
      toast.error('Failed to remove cover');
    } finally {
      setIsUpdatingCover(false);
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

  // Group resumes by folder and calculate counts
  const groupedResumes = () => {
    const grouped: Record<string, Resume[]> = {};
    const uncategorized: Resume[] = [];
    const folderCounts: Record<string, number> = {};

    // Initialize counts for all folders
    folders.forEach(f => {
      folderCounts[f.id] = 0;
      grouped[f.id] = [];
    });

    filteredResumes.forEach(resume => {
      if (resume.folderId && grouped[resume.folderId] !== undefined) {
        grouped[resume.folderId].push(resume);
        folderCounts[resume.folderId]++;
      } else {
        uncategorized.push(resume);
      }
    });

    return { grouped, uncategorized, folderCounts };
  };

  const { grouped, uncategorized, folderCounts } = groupedResumes();

  // Get resumes to display based on selected folder
  const getDisplayedResumes = (): Resume[] => {
    if (selectedFolderId === 'all') {
      return filteredResumes;
    } else if (selectedFolderId === null) {
      return uncategorized;
    } else {
      return grouped[selectedFolderId] || [];
    }
  };

  const displayedResumes = getDisplayedResumes();

  // Determine current folder object for header
  const currentFolder = typeof selectedFolderId === 'string' && selectedFolderId !== 'all' 
    ? folders.find(f => f.id === selectedFolderId) 
    : null;

  const getHeaderProps = () => {
    if (selectedFolderId === 'all') {
      return {
        title: 'All Resumes',
        subtitle: `${displayedResumes.length} ${displayedResumes.length === 1 ? 'resume' : 'resumes'}`,
        icon: <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
      };
    } else if (selectedFolderId === null) {
      return {
        title: 'Uncategorized',
        subtitle: `${displayedResumes.length} ${displayedResumes.length === 1 ? 'resume' : 'resumes'}`,
        icon: <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
      };
    } else {
      // Custom folder
      const folder = folders.find(f => f.id === selectedFolderId);
      return {
        folder,
        title: folder?.name || 'Folder',
        subtitle: `${displayedResumes.length} ${displayedResumes.length === 1 ? 'resume' : 'resumes'}`,
        icon: null // Icon is handled inside FolderHeader via folder prop
      };
    }
  };

  const headerProps = getHeaderProps();

  return (
    <AuthLayout>
      <div className="flex h-full">
        {/* Sidebar */}
        <FolderSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={handleSelectFolder}
          onEditFolder={openFolderModal}
          onDeleteFolder={deleteFolder}
          onNewFolder={() => openFolderModal()}
          onDropResume={handleDropResume}
          folderCounts={folderCounts}
          uncategorizedCount={uncategorized.length}
          totalCount={filteredResumes.length}
        />

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Replaced Header with FolderHeader */}
          <FolderHeader
            folder={currentFolder}
            title={headerProps.title}
            subtitle={headerProps.subtitle}
            icon={headerProps.icon}
            onUpdateCover={currentFolder ? handleUpdateCover : undefined}
            onRemoveCover={currentFolder ? handleRemoveCover : undefined}
            isUpdating={isUpdatingCover}
          >
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
          </FolderHeader>

          <div className="p-6 pt-4">
            {/* Search */}
            {resumes.length > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search resumes..."
                    className="w-full pl-9 pr-4 py-2 
                      bg-transparent
                      border border-gray-200 dark:border-gray-700 rounded-lg
                      focus:border-gray-300 dark:focus:border-gray-600
                      focus:ring-0 focus:outline-none
                      text-sm text-gray-900 dark:text-white placeholder-gray-400
                      transition-colors duration-200"
                  />
                </div>
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
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            )}

            {/* Empty State - No resumes at all */}
            {!isLoading && resumes.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
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
                  onClick={openCreateModal}
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
                  <Sparkles className="w-4 h-4" />
                  <span>New Resume</span>
                </button>
              </motion.div>
            )}

            {/* Resumes Grid */}
            {!isLoading && resumes.length > 0 && (
              <>
                {displayedResumes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {displayedResumes.map((resume) => (
                      <CVPreviewCard
                        key={resume.id}
                        resume={resume}
                        onDelete={deleteResume}
                        onRename={renameResume}
                        onEdit={handleEditResume}
                        onUpdateTags={updateResumeTags}
                        compact
                        draggable
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 
                      flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                      {searchQuery ? 'No results found' : 'No resumes in this folder'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {searchQuery 
                        ? 'Try adjusting your search' 
                        : 'Drag resumes here or create a new one'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
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

      {/* Folder Management Modal */}
      <FolderManagementModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={handleFolderSave}
        editingFolder={editingFolder}
        isSaving={isSavingFolder}
      />

    </AuthLayout>
  );
}

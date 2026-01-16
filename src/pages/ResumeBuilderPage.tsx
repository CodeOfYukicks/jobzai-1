import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Search, Loader2, Sparkles, ChevronDown, X, Check, Info, Upload, StickyNote, Palette, Plus, FolderOpen
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { OnboardingSpotlight } from '../components/onboarding';
import MobileTopBar from '../components/mobile/MobileTopBar';
import MobileDocumentRow, { MobileDocumentContextMenu } from '../components/mobile/MobileDocumentRow';
import MobileCreateSheet from '../components/mobile/MobileCreateSheet';
import MobileLibrarySheet from '../components/mobile/MobileLibrarySheet';
import { useAuth } from '../contexts/AuthContext';
import { useAssistant } from '../contexts/AssistantContext';
import { collection, query, getDocs, deleteDoc, doc, orderBy, addDoc, serverTimestamp, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { notify } from '@/lib/notify';
import { CVData, CVTemplate } from '../types/cvEditor';
import { generateId } from '../lib/cvEditorUtils';
import CVPreviewCard from '../components/resume-builder/CVPreviewCard';
import { Folder } from '../components/resume-builder/FolderCard';
import FolderManagementModal from '../components/resume-builder/FolderManagementModal';
import FolderSidebar, { SelectedFolderType } from '../components/resume-builder/FolderSidebar';
import FolderHeader from '../components/resume-builder/FolderHeader';
import PDFPreviewCard, { ImportedDocument } from '../components/resume-builder/PDFPreviewCard';
import PremiumPDFViewer from '../components/resume-builder/PremiumPDFViewer';
import DropZone from '../components/resume-builder/DropZone';
import NotionPreviewCard from '../components/notion-editor/NotionPreviewCard';
import {
  NotionDocument,
  getNotes,
  createNote,
  deleteNote as deleteNoteService,
  updateNote,
  moveNoteToFolder
} from '../lib/notionDocService';
import {
  WhiteboardDocument,
  getWhiteboards,
  createWhiteboard,
  deleteWhiteboard as deleteWhiteboardService,
  updateWhiteboard,
  moveWhiteboardToFolder
} from '../lib/whiteboardDocService';
import WhiteboardPreviewCard from '../components/whiteboard/WhiteboardPreviewCard';

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

const TAG_COLORS = [
  { id: 'red', color: '#EF4444', label: 'Red' },
  { id: 'orange', color: '#F97316', label: 'Orange' },
  { id: 'yellow', color: '#EAB308', label: 'Yellow' },
  { id: 'green', color: '#22C55E', label: 'Green' },
  { id: 'blue', color: '#3B82F6', label: 'Blue' },
  { id: 'purple', color: '#A855F7', label: 'Purple' },
  { id: 'gray', color: '#6B7280', label: 'Gray' },
];

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
    title: '',
    photoUrl: ''
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
  const { isOpen: isAssistantOpen } = useAssistant();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newResumeName, setNewResumeName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplate>('modern-professional');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isSavingFolder, setIsSavingFolder] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<SelectedFolderType>('all');
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // PDF Documents state
  const [documents, setDocuments] = useState<ImportedDocument[]>([]);
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ImportedDocument | null>(null);

  // Notes state
  const [notes, setNotes] = useState<NotionDocument[]>([]);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Whiteboards state
  const [whiteboards, setWhiteboards] = useState<WhiteboardDocument[]>([]);
  const [isCreatingWhiteboard, setIsCreatingWhiteboard] = useState(false);

  // View preferences state (for 'all' and 'uncategorized')
  interface ViewPreferences {
    coverPhoto?: string;
    icon?: string;
  }
  const [viewPreferences, setViewPreferences] = useState<{
    all: ViewPreferences;
    uncategorized: ViewPreferences;
  }>({
    all: {},
    uncategorized: {}
  });

  // Mobile-specific state
  const [isMobileCreateSheetOpen, setIsMobileCreateSheetOpen] = useState(false);
  const [isMobileLibrarySheetOpen, setIsMobileLibrarySheetOpen] = useState(false);
  const [mobileContextMenuDoc, setMobileContextMenuDoc] = useState<{
    id: string;
    title: string;
    type: 'note' | 'resume' | 'whiteboard' | 'pdf';
  } | null>(null);

  // Mobile delete confirmation modal state (for swipe-to-delete)
  const [mobileDeleteModal, setMobileDeleteModal] = useState<{
    isOpen: boolean;
    id: string | null;
    title: string;
    type: 'note' | 'resume' | 'whiteboard' | 'pdf' | null;
  }>({ isOpen: false, id: null, title: '', type: null });


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
      notify.error('Failed to load folders');
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
      notify.error('Failed to load resumes');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Fetch documents (PDFs) from Firestore
  const fetchDocuments = useCallback(async () => {
    if (!currentUser) return;

    try {
      const documentsRef = collection(db, 'users', currentUser.uid, 'documents');
      const q = query(documentsRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const documentsList: ImportedDocument[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        documentsList.push({
          id: docSnapshot.id,
          name: data.name || 'Untitled Document',
          fileUrl: data.fileUrl,
          fileSize: data.fileSize || 0,
          pageCount: data.pageCount,
          folderId: data.folderId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      setDocuments(documentsList);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }, [currentUser]);

  // Fetch notes from Firestore
  const fetchNotes = useCallback(async () => {
    if (!currentUser) return;

    try {
      const notesList = await getNotes(currentUser.uid);
      setNotes(notesList);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  }, [currentUser]);

  // Fetch whiteboards from Firestore
  const fetchWhiteboards = useCallback(async () => {
    if (!currentUser) return;

    try {
      const whiteboardsList = await getWhiteboards(currentUser.uid);
      setWhiteboards(whiteboardsList);
    } catch (error) {
      console.error('Error fetching whiteboards:', error);
    }
  }, [currentUser]);

  // Fetch view preferences from Firestore
  const fetchViewPreferences = useCallback(async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const preferences = userData.viewPreferences || {};
        setViewPreferences({
          all: preferences.all || {},
          uncategorized: preferences.uncategorized || {}
        });
      }
    } catch (error) {
      console.error('Error fetching view preferences:', error);
    }
  }, [currentUser]);

  // Save view preferences to Firestore
  const saveViewPreferences = useCallback(async (viewType: 'all' | 'uncategorized', preferences: ViewPreferences) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      const currentPreferences = currentData.viewPreferences || {};

      await updateDoc(userRef, {
        viewPreferences: {
          ...currentPreferences,
          [viewType]: preferences
        }
      });

      setViewPreferences(prev => {
        const updated = {
          ...prev,
          [viewType]: preferences
        };
        console.log('Updated viewPreferences:', updated);
        console.log('Cover photo for', viewType, ':', preferences.coverPhoto);
        return updated;
      });
    } catch (error) {
      console.error('Error saving view preferences:', error);
      notify.error('Failed to save preferences');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchFolders();
      fetchResumes();
      fetchDocuments();
      fetchNotes();
      fetchWhiteboards();
      fetchViewPreferences();
    }
  }, [currentUser, fetchFolders, fetchResumes, fetchDocuments, fetchNotes, fetchWhiteboards, fetchViewPreferences]);

  // Handle ?action=create URL parameter to open create sheet
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setIsMobileCreateSheetOpen(true);
      // Remove the param from URL to avoid reopening on refresh
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Auto-collapse sidebar when assistant opens to make more space (only once)
  const prevAssistantOpenRef = useRef(isAssistantOpen);
  useEffect(() => {
    // Only collapse when assistant transitions from closed to open
    if (isAssistantOpen && !prevAssistantOpenRef.current && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
    }
    prevAssistantOpenRef.current = isAssistantOpen;
  }, [isAssistantOpen]);

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
  const createNewResume = async (name: string, template: CVTemplate, folderId?: string) => {
    if (!currentUser) {
      notify.error('Please log in to create a resume');
      return;
    }

    if (!name.trim()) {
      notify.error('Please enter a resume name');
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
        template: template,
        ...(folderId && { folderId })
      };

      // Save to Firestore
      const docRef = doc(db, 'users', currentUser.uid, 'cvs', resumeId);
      await setDoc(docRef, {
        ...newResume,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      notify.success('Resume created!');
      setIsCreateModalOpen(false);
      navigate(`/resume-builder/${resumeId}/cv-editor`);
    } catch (error) {
      console.error('Error creating resume:', error);
      notify.error('Failed to create resume');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle create button click in modal
  const handleCreate = () => {
    // Pass folderId only if a specific folder is selected (not 'all' or null)
    const folderId = typeof selectedFolderId === 'string' && selectedFolderId !== 'all'
      ? selectedFolderId
      : undefined;
    createNewResume(newResumeName, selectedTemplate, folderId);
  };

  // Delete resume
  const deleteResume = async (resumeId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'cvs', resumeId));
      setResumes(prev => prev.filter(r => r.id !== resumeId));
      notify.success('Resume deleted');
    } catch (error) {
      console.error('Error deleting resume:', error);
      notify.error('Failed to delete resume');
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
      notify.success('Resume renamed');
    } catch (error) {
      console.error('Error renaming resume:', error);
      notify.error('Failed to rename resume');
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
      notify.error('Failed to update tags');
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
      notify.success('Folder created');
    } catch (error) {
      console.error('Error creating folder:', error);
      notify.error('Failed to create folder');
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
      notify.success('Folder updated');
    } catch (error) {
      console.error('Error updating folder:', error);
      notify.error('Failed to update folder');
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
      notify.success('Folder deleted');
    } catch (error) {
      console.error('Error deleting folder:', error);
      notify.error('Failed to delete folder');
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
      notify.success(`Moved "${resume.name}" to ${folderName}`);
    } catch (error) {
      console.error('Error moving CV:', error);
      notify.error('Failed to move resume');
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

  // PDF Document management functions
  const uploadPDFFiles = async (files: File[], targetFolderId?: string | null) => {
    if (!currentUser || files.length === 0) return;

    setIsUploadingPDF(true);
    const uploadPromises = files.map(async (file) => {
      try {
        const documentId = generateId();
        const fileName = `${documentId}_${file.name}`;
        const fileRef = ref(storage, `cvs/${currentUser.uid}/${fileName}`);

        await uploadBytes(fileRef, file, { contentType: 'application/pdf' });
        const downloadUrl = await getDownloadURL(fileRef);

        const newDocument: Omit<ImportedDocument, 'id'> = {
          name: file.name,
          fileUrl: downloadUrl,
          fileSize: file.size,
          ...(targetFolderId ? { folderId: targetFolderId } : {}),
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any
        };

        const docRef = doc(db, 'users', currentUser.uid, 'documents', documentId);
        await setDoc(docRef, newDocument);

        return {
          id: documentId,
          ...newDocument,
          createdAt: new Date(),
          updatedAt: new Date()
        } as ImportedDocument;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        notify.error(`Failed to upload ${file.name}`);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((r): r is ImportedDocument => r !== null);

    if (successfulUploads.length > 0) {
      setDocuments(prev => [...successfulUploads, ...prev]);
      notify.success(`${successfulUploads.length} PDF${successfulUploads.length > 1 ? 's' : ''} uploaded successfully`);
    }

    setIsUploadingPDF(false);
  };

  const handleFileDrop = useCallback((files: File[]) => {
    const folderId = typeof selectedFolderId === 'string' && selectedFolderId !== 'all'
      ? selectedFolderId
      : null;
    uploadPDFFiles(files, folderId);
  }, [selectedFolderId, currentUser]);

  const deleteDocument = async (documentId: string) => {
    if (!currentUser) return;

    const document = documents.find(d => d.id === documentId);
    if (!document) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid, 'documents', documentId));

      // Try to delete from Storage (might fail if URL format changed)
      try {
        const fileRef = ref(storage, document.fileUrl);
        await deleteObject(fileRef);
      } catch (e) {
        console.warn('Could not delete file from storage', e);
      }

      setDocuments(prev => prev.filter(d => d.id !== documentId));
      notify.success('Document deleted');
    } catch (error) {
      console.error('Error deleting document:', error);
      notify.error('Failed to delete document');
    }
  };

  const handleViewDocument = useCallback((document: ImportedDocument) => {
    setSelectedDocument(document);
    setPdfViewerOpen(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setPdfViewerOpen(false);
    setSelectedDocument(null);
  }, []);

  // Note management functions
  const handleCreateNote = useCallback(async () => {
    if (!currentUser) {
      notify.error('Please log in to create a note');
      return;
    }

    setIsCreatingNote(true);
    try {
      const folderId = typeof selectedFolderId === 'string' && selectedFolderId !== 'all'
        ? selectedFolderId
        : undefined;

      const newNote = await createNote({
        userId: currentUser.uid,
        title: 'Untitled',
        folderId,
      });

      setNotes(prev => [newNote, ...prev]);
      notify.success('Note created!');
      // Scroll to top before navigating to ensure note opens at top of page
      window.scrollTo({ top: 0, behavior: 'instant' });
      navigate(`/notes/${newNote.id}`);
    } catch (error) {
      console.error('Error creating note:', error);
      notify.error('Failed to create note');
    } finally {
      setIsCreatingNote(false);
    }
  }, [currentUser, selectedFolderId, navigate]);

  const handleEditNote = useCallback((noteId: string) => {
    // Scroll to top before navigating to ensure note opens at top of page
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/notes/${noteId}`);
  }, [navigate]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (!currentUser) return;

    try {
      await deleteNoteService(currentUser.uid, noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      notify.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      notify.error('Failed to delete note');
    }
  }, [currentUser]);

  const handleRenameNote = useCallback(async (noteId: string, newTitle: string) => {
    if (!currentUser) return;

    try {
      await updateNote({
        userId: currentUser.uid,
        noteId,
        updates: { title: newTitle },
      });

      setNotes(prev => prev.map(n =>
        n.id === noteId ? { ...n, title: newTitle } : n
      ));
      notify.success('Note renamed');
    } catch (error) {
      console.error('Error renaming note:', error);
      notify.error('Failed to rename note');
    }
  }, [currentUser]);

  // Update note tags
  const handleUpdateNoteTags = useCallback(async (noteId: string, tags: string[]) => {
    if (!currentUser) return;

    try {
      await updateNote({
        userId: currentUser.uid,
        noteId,
        updates: { tags },
      });

      setNotes(prev => prev.map(n =>
        n.id === noteId ? { ...n, tags } : n
      ));
    } catch (error) {
      console.error('Error updating note tags:', error);
      notify.error('Failed to update tags');
    }
  }, [currentUser]);

  // Move note to folder
  const handleDropNote = useCallback(async (noteId: string, folderId: string | null) => {
    if (!currentUser || !noteId) return;

    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const currentFolder = note.folderId || null;
    if (currentFolder === folderId) return;

    try {
      await moveNoteToFolder(currentUser.uid, noteId, folderId);

      setNotes(prev => prev.map(n =>
        n.id === noteId ? { ...n, folderId: folderId || undefined } : n
      ));

      const folderName = folderId
        ? folders.find(f => f.id === folderId)?.name || 'folder'
        : 'Uncategorized';
      notify.success(`Moved "${note.title}" to ${folderName}`);
    } catch (error) {
      console.error('Error moving note:', error);
      notify.error('Failed to move note');
    }
  }, [currentUser, notes, folders]);

  // Update note cover photo
  const handleUpdateNoteCover = useCallback(async (noteId: string, blob: Blob) => {
    if (!currentUser || !noteId) return;

    try {
      const timestamp = Date.now();
      const fileName = `note_${noteId}_cover_${timestamp}.jpg`;
      const noteCoverRef = ref(storage, `note-covers/${currentUser.uid}/${fileName}`);

      await uploadBytes(noteCoverRef, blob, { contentType: 'image/jpeg' });
      const coverUrl = await getDownloadURL(noteCoverRef);

      await updateNote({
        userId: currentUser.uid,
        noteId,
        updates: { coverImage: coverUrl },
      });

      setNotes(prev => prev.map(n =>
        n.id === noteId ? { ...n, coverImage: coverUrl } : n
      ));

      notify.success('Note cover updated');
    } catch (error) {
      console.error('Error updating note cover:', error);
      notify.error('Failed to update cover');
    }
  }, [currentUser]);

  // Remove note cover photo
  const handleRemoveNoteCover = useCallback(async (noteId: string) => {
    if (!currentUser || !noteId) return;

    const note = notes.find(n => n.id === noteId);
    if (!note || !note.coverImage) return;

    try {
      await updateNote({
        userId: currentUser.uid,
        noteId,
        updates: { coverImage: null },
      });

      // Try to delete from Storage
      try {
        const coverRef = ref(storage, note.coverImage);
        await deleteObject(coverRef);
      } catch (e) {
        console.warn('Could not delete old cover photo from storage', e);
      }

      setNotes(prev => prev.map(n =>
        n.id === noteId ? { ...n, coverImage: undefined } : n
      ));

      notify.success('Note cover removed');
    } catch (error) {
      console.error('Error removing note cover:', error);
      notify.error('Failed to remove cover');
    }
  }, [currentUser, notes]);

  // Whiteboard management functions
  const handleCreateWhiteboard = useCallback(async () => {
    if (!currentUser) {
      notify.error('Please log in to create a whiteboard');
      return;
    }

    setIsCreatingWhiteboard(true);
    try {
      const folderId = typeof selectedFolderId === 'string' && selectedFolderId !== 'all'
        ? selectedFolderId
        : undefined;

      const newWhiteboard = await createWhiteboard({
        userId: currentUser.uid,
        title: 'Untitled Whiteboard',
        folderId,
      });

      setWhiteboards(prev => [newWhiteboard, ...prev]);
      notify.success('Whiteboard created!');
      window.scrollTo({ top: 0, behavior: 'instant' });
      navigate(`/whiteboard/${newWhiteboard.id}`);
    } catch (error) {
      console.error('Error creating whiteboard:', error);
      notify.error('Failed to create whiteboard');
    } finally {
      setIsCreatingWhiteboard(false);
    }
  }, [currentUser, selectedFolderId, navigate]);

  const handleEditWhiteboard = useCallback((whiteboardId: string) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/whiteboard/${whiteboardId}`);
  }, [navigate]);

  const handleDeleteWhiteboard = useCallback(async (whiteboardId: string) => {
    if (!currentUser) return;

    try {
      await deleteWhiteboardService(currentUser.uid, whiteboardId);
      setWhiteboards(prev => prev.filter(w => w.id !== whiteboardId));
      notify.success('Whiteboard deleted');
    } catch (error) {
      console.error('Error deleting whiteboard:', error);
      notify.error('Failed to delete whiteboard');
    }
  }, [currentUser]);

  // Mobile delete confirmation modal helpers
  const openMobileDeleteModal = useCallback((id: string, title: string, type: 'note' | 'resume' | 'whiteboard' | 'pdf') => {
    console.log('🎯 openMobileDeleteModal called!', { id, title, type });
    setMobileDeleteModal({ isOpen: true, id, title, type });
  }, []);


  const cancelMobileDelete = useCallback(() => {
    setMobileDeleteModal({ isOpen: false, id: null, title: '', type: null });
  }, []);

  const confirmMobileDelete = useCallback(async () => {
    if (!mobileDeleteModal.id || !mobileDeleteModal.type) return;

    const { id, type } = mobileDeleteModal;

    // Close modal first
    setMobileDeleteModal({ isOpen: false, id: null, title: '', type: null });

    // Perform the actual delete based on type
    switch (type) {
      case 'note':
        await handleDeleteNote(id);
        break;
      case 'resume':
        await deleteResume(id);
        break;
      case 'whiteboard':
        await handleDeleteWhiteboard(id);
        break;
      case 'pdf':
        await deleteDocument(id);
        break;
    }
  }, [mobileDeleteModal, handleDeleteNote, deleteResume, handleDeleteWhiteboard, deleteDocument]);


  const handleRenameWhiteboard = useCallback(async (whiteboardId: string, newTitle: string) => {
    if (!currentUser) return;

    try {
      await updateWhiteboard({
        userId: currentUser.uid,
        whiteboardId,
        updates: { title: newTitle },
      });

      setWhiteboards(prev => prev.map(w =>
        w.id === whiteboardId ? { ...w, title: newTitle } : w
      ));
      notify.success('Whiteboard renamed');
    } catch (error) {
      console.error('Error renaming whiteboard:', error);
      notify.error('Failed to rename whiteboard');
    }
  }, [currentUser]);

  // Update whiteboard tags
  const handleUpdateWhiteboardTags = useCallback(async (whiteboardId: string, tags: string[]) => {
    if (!currentUser) return;

    try {
      await updateWhiteboard({
        userId: currentUser.uid,
        whiteboardId,
        updates: { tags },
      });

      setWhiteboards(prev => prev.map(w =>
        w.id === whiteboardId ? { ...w, tags } : w
      ));
    } catch (error) {
      console.error('Error updating whiteboard tags:', error);
      notify.error('Failed to update tags');
    }
  }, [currentUser]);

  // Move whiteboard to folder
  const handleDropWhiteboard = useCallback(async (whiteboardId: string, folderId: string | null) => {
    if (!currentUser || !whiteboardId) return;

    const whiteboard = whiteboards.find(w => w.id === whiteboardId);
    if (!whiteboard) return;

    const currentFolder = whiteboard.folderId || null;
    if (currentFolder === folderId) return;

    try {
      await moveWhiteboardToFolder(currentUser.uid, whiteboardId, folderId);

      setWhiteboards(prev => prev.map(w =>
        w.id === whiteboardId ? { ...w, folderId: folderId || undefined } : w
      ));

      const folderName = folderId
        ? folders.find(f => f.id === folderId)?.name || 'folder'
        : 'Uncategorized';
      notify.success(`Moved "${whiteboard.title}" to ${folderName}`);
    } catch (error) {
      console.error('Error moving whiteboard:', error);
      notify.error('Failed to move whiteboard');
    }
  }, [currentUser, whiteboards, folders]);

  // Move document to folder
  const handleDropDocument = async (documentId: string, folderId: string | null) => {
    if (!currentUser || !documentId) return;

    const document = documents.find(d => d.id === documentId);
    if (!document) return;

    const currentFolder = document.folderId || null;
    if (currentFolder === folderId) return;

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'documents', documentId);
      await updateDoc(docRef, {
        folderId: folderId || null,
        updatedAt: serverTimestamp()
      });

      setDocuments(prev => prev.map(d =>
        d.id === documentId ? { ...d, folderId: folderId || undefined } : d
      ));

      const folderName = folderId
        ? folders.find(f => f.id === folderId)?.name || 'folder'
        : 'Uncategorized';
      notify.success(`Moved "${document.name}" to ${folderName}`);
    } catch (error) {
      console.error('Error moving document:', error);
      notify.error('Failed to move document');
    }
  };

  const handleUpdateCover = async (blob: Blob) => {
    if (!currentUser) return;

    setIsUpdatingCover(true);
    try {
      const timestamp = Date.now();

      // Handle special views (all, uncategorized)
      if (selectedFolderId === 'all' || selectedFolderId === null) {
        const viewType = selectedFolderId === 'all' ? 'all' : 'uncategorized';
        const fileName = `view_${viewType}_cover_${timestamp}.jpg`;
        const viewCoverRef = ref(storage, `cover-photos/${currentUser.uid}/${fileName}`);

        await uploadBytes(viewCoverRef, blob, { contentType: 'image/jpeg' });
        const coverUrl = await getDownloadURL(viewCoverRef);
        console.log('Cover URL generated:', coverUrl);

        // Delete old cover if exists
        const currentPrefs = viewPreferences[viewType] || {};
        if (currentPrefs?.coverPhoto) {
          try {
            const oldCoverRef = ref(storage, currentPrefs.coverPhoto);
            await deleteObject(oldCoverRef);
          } catch (e) {
            console.warn('Could not delete old cover photo from storage', e);
          }
        }

        const newPrefs = { ...currentPrefs, coverPhoto: coverUrl };
        console.log('Saving preferences for', viewType, ':', newPrefs);
        await saveViewPreferences(viewType, newPrefs);
        console.log('Cover saved for', viewType, ':', coverUrl);
        notify.success('Cover updated');
      } else if (typeof selectedFolderId === 'string') {
        // Handle regular folder
        const fileName = `folder_${selectedFolderId}_cover_${timestamp}.jpg`;
        const folderCoverRef = ref(storage, `cover-photos/${currentUser.uid}/${fileName}`);

        await uploadBytes(folderCoverRef, blob, { contentType: 'image/jpeg' });
        const coverUrl = await getDownloadURL(folderCoverRef);

        await updateFolder(selectedFolderId, { coverPhoto: coverUrl });
        notify.success('Folder cover updated');
      }
    } catch (error) {
      console.error('Error updating cover:', error);
      notify.error('Failed to update cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!currentUser) return;

    setIsUpdatingCover(true);
    try {
      // Handle special views (all, uncategorized)
      if (selectedFolderId === 'all' || selectedFolderId === null) {
        const viewType = selectedFolderId === 'all' ? 'all' : 'uncategorized';
        const currentPrefs = viewPreferences[viewType];

        if (currentPrefs?.coverPhoto) {
          try {
            const coverRef = ref(storage, currentPrefs.coverPhoto);
            await deleteObject(coverRef);
          } catch (e) {
            console.warn('Could not delete old cover photo from storage', e);
          }
        }

        await saveViewPreferences(viewType, { ...currentPrefs, coverPhoto: undefined });
        notify.success('Cover removed');
      } else if (typeof selectedFolderId === 'string') {
        // Handle regular folder
        const folder = folders.find(f => f.id === selectedFolderId);
        if (!folder || !folder.coverPhoto) return;

        await updateFolder(selectedFolderId, { coverPhoto: undefined });

        try {
          const coverRef = ref(storage, folder.coverPhoto);
          await deleteObject(coverRef);
        } catch (e) {
          console.warn('Could not delete old cover photo from storage', e);
        }

        notify.success('Folder cover removed');
      }
    } catch (error) {
      console.error('Error removing cover:', error);
      notify.error('Failed to remove cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  // Handle emoji update for special views
  const handleUpdateEmoji = async (emoji: string) => {
    if (!currentUser || (selectedFolderId !== 'all' && selectedFolderId !== null)) return;

    const viewType = selectedFolderId === 'all' ? 'all' : 'uncategorized';
    const currentPrefs = viewPreferences[viewType];

    await saveViewPreferences(viewType, { ...currentPrefs, icon: emoji });
    notify.success('Emoji updated');
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

    // Tag filter
    if (selectedTagFilters.length > 0) {
      filtered = filtered.filter((r) =>
        selectedTagFilters.some(tag => r.tags?.includes(tag))
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

  // Filter documents by search
  const filteredDocuments = searchQuery
    ? documents.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : documents;

  // Filter notes by search and tags
  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (searchQuery) {
      filtered = filtered.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (selectedTagFilters.length > 0) {
      filtered = filtered.filter(n =>
        selectedTagFilters.some(tag => n.tags?.includes(tag))
      );
    }
    return filtered;
  }, [notes, searchQuery, selectedTagFilters]);

  // Filter whiteboards by search and tags
  const filteredWhiteboards = useMemo(() => {
    let filtered = whiteboards;
    if (searchQuery) {
      filtered = filtered.filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (selectedTagFilters.length > 0) {
      filtered = filtered.filter(w =>
        selectedTagFilters.some(tag => w.tags?.includes(tag))
      );
    }
    return filtered;
  }, [whiteboards, searchQuery, selectedTagFilters]);

  // Group resumes, documents, notes, and whiteboards by folder and calculate counts
  const groupedItems = () => {
    const groupedResumes: Record<string, Resume[]> = {};
    const groupedDocs: Record<string, ImportedDocument[]> = {};
    const groupedNotes: Record<string, NotionDocument[]> = {};
    const groupedWhiteboards: Record<string, WhiteboardDocument[]> = {};
    const uncategorizedResumes: Resume[] = [];
    const uncategorizedDocs: ImportedDocument[] = [];
    const uncategorizedNotes: NotionDocument[] = [];
    const uncategorizedWhiteboards: WhiteboardDocument[] = [];
    const folderCounts: Record<string, number> = {};

    // Initialize counts for all folders
    folders.forEach(f => {
      folderCounts[f.id] = 0;
      groupedResumes[f.id] = [];
      groupedDocs[f.id] = [];
      groupedNotes[f.id] = [];
      groupedWhiteboards[f.id] = [];
    });

    // Group resumes
    filteredResumes.forEach(resume => {
      if (resume.folderId && groupedResumes[resume.folderId] !== undefined) {
        groupedResumes[resume.folderId].push(resume);
        folderCounts[resume.folderId]++;
      } else {
        uncategorizedResumes.push(resume);
      }
    });

    // Group documents
    filteredDocuments.forEach(doc => {
      if (doc.folderId && groupedDocs[doc.folderId] !== undefined) {
        groupedDocs[doc.folderId].push(doc);
        folderCounts[doc.folderId]++;
      } else {
        uncategorizedDocs.push(doc);
      }
    });

    // Group notes
    filteredNotes.forEach(note => {
      if (note.folderId && groupedNotes[note.folderId] !== undefined) {
        groupedNotes[note.folderId].push(note);
        folderCounts[note.folderId]++;
      } else {
        uncategorizedNotes.push(note);
      }
    });

    // Group whiteboards
    filteredWhiteboards.forEach(whiteboard => {
      if (whiteboard.folderId && groupedWhiteboards[whiteboard.folderId] !== undefined) {
        groupedWhiteboards[whiteboard.folderId].push(whiteboard);
        folderCounts[whiteboard.folderId]++;
      } else {
        uncategorizedWhiteboards.push(whiteboard);
      }
    });

    return {
      groupedResumes,
      groupedDocs,
      groupedNotes,
      groupedWhiteboards,
      uncategorizedResumes,
      uncategorizedDocs,
      uncategorizedNotes,
      uncategorizedWhiteboards,
      folderCounts
    };
  };

  const {
    groupedResumes: grouped,
    groupedDocs,
    groupedNotes,
    groupedWhiteboards,
    uncategorizedResumes: uncategorized,
    uncategorizedDocs,
    uncategorizedNotes,
    uncategorizedWhiteboards,
    folderCounts
  } = groupedItems();

  // Get items to display based on selected folder
  const getDisplayedItems = (): { resumes: Resume[]; documents: ImportedDocument[]; notes: NotionDocument[]; whiteboards: WhiteboardDocument[] } => {
    if (selectedFolderId === 'all') {
      return { resumes: filteredResumes, documents: filteredDocuments, notes: filteredNotes, whiteboards: filteredWhiteboards };
    } else if (selectedFolderId === null) {
      return { resumes: uncategorized, documents: uncategorizedDocs, notes: uncategorizedNotes, whiteboards: uncategorizedWhiteboards };
    } else {
      return {
        resumes: grouped[selectedFolderId] || [],
        documents: groupedDocs[selectedFolderId] || [],
        notes: groupedNotes[selectedFolderId] || [],
        whiteboards: groupedWhiteboards[selectedFolderId] || []
      };
    }
  };

  const { resumes: displayedResumes, documents: displayedDocuments, notes: displayedNotes, whiteboards: displayedWhiteboards } = getDisplayedItems();
  const totalDisplayedItems = displayedResumes.length + displayedDocuments.length + displayedNotes.length + displayedWhiteboards.length;

  // Determine current folder object for header
  const currentFolder = typeof selectedFolderId === 'string' && selectedFolderId !== 'all'
    ? folders.find(f => f.id === selectedFolderId)
    : null;

  const getHeaderProps = () => {
    const itemLabel = totalDisplayedItems === 1 ? 'item' : 'items';

    if (selectedFolderId === 'all') {
      const prefs = viewPreferences.all;
      return {
        title: 'All Documents',
        subtitle: `${totalDisplayedItems} ${itemLabel}`,
        icon: prefs.icon || '📁',
        coverPhoto: prefs.coverPhoto,
        isSpecialView: true as const,
        viewType: 'all' as const
      };
    } else if (selectedFolderId === null) {
      const prefs = viewPreferences.uncategorized;
      console.log('getHeaderProps - uncategorized prefs:', prefs);
      return {
        title: 'Uncategorized',
        subtitle: `${totalDisplayedItems} ${itemLabel}`,
        icon: prefs.icon || '📄',
        coverPhoto: prefs?.coverPhoto,
        isSpecialView: true as const,
        viewType: 'uncategorized' as const
      };
    } else {
      // Custom folder
      const folder = folders.find(f => f.id === selectedFolderId);
      return {
        folder,
        title: folder?.name || 'Folder',
        subtitle: `${totalDisplayedItems} ${itemLabel}`,
        icon: null, // Icon is handled inside FolderHeader via folder prop
        isSpecialView: false as const
      };
    }
  };

  const headerProps = useMemo(() => getHeaderProps(), [selectedFolderId, viewPreferences, totalDisplayedItems, folders]);

  // Total counts for sidebar
  const totalUncategorized = uncategorized.length + uncategorizedDocs.length + uncategorizedNotes.length + uncategorizedWhiteboards.length;
  const totalItems = filteredResumes.length + filteredDocuments.length + filteredNotes.length + filteredWhiteboards.length;

  return (
    <AuthLayout>
      {/* ========================================= */}
      {/* MOBILE LAYOUT (md:hidden) */}
      {/* ========================================= */}
      <div className="md:hidden flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1b]">
        {/* Mobile Top Bar */}
        <MobileTopBar
          title="Documents"
          subtitle={`${totalDisplayedItems} items`}
          rightAction={{
            icon: Plus,
            onClick: () => setIsMobileCreateSheetOpen(true),
            ariaLabel: 'Create new document'
          }}
        />

        {/* Mobile Search & Library Button */}
        <div className="px-4 py-3 space-y-3 border-b border-gray-100 dark:border-[#2d2c2e] bg-white dark:bg-[#242325]">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2.5 
                bg-gray-100 dark:bg-[#2d2c2e]
                border-0 rounded-xl
                text-[15px] text-gray-900 dark:text-white 
                placeholder-gray-400 dark:placeholder-gray-500
                focus:ring-2 focus:ring-[#635BFF]/30 focus:outline-none
                transition-all"
            />
          </div>

          {/* Library Button */}
          <button
            onClick={() => setIsMobileLibrarySheetOpen(true)}
            className="flex items-center gap-2 text-[13px] text-[#635BFF] dark:text-[#a5a0ff]"
          >
            <FolderOpen className="w-4 h-4" />
            <span>
              {selectedFolderId === 'all'
                ? 'All Documents'
                : selectedFolderId === null
                  ? 'Uncategorized'
                  : folders.find(f => f.id === selectedFolderId)?.name || 'Library'}
            </span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Document List */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#242325]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-[#635BFF] animate-spin" />
            </div>
          ) : totalDisplayedItems === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#2d2c2e] flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-[15px] font-medium text-gray-900 dark:text-white mb-1">
                {searchQuery ? 'No results found' : 'No documents yet'}
              </h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search' : 'Tap + to create your first document'}
              </p>
            </div>
          ) : (
            <>
              {/* Notes */}
              {displayedNotes.map(note => (
                <MobileDocumentRow
                  key={`note-${note.id}`}
                  id={note.id}
                  title={note.title}
                  type="note"
                  date={note.updatedAt?.toDate ? note.updatedAt.toDate() : note.updatedAt ? new Date(note.updatedAt) : null}
                  onClick={() => handleEditNote(note.id)}
                  onDelete={() => handleDeleteNote(note.id)}
                  onDeleteRequest={() => openMobileDeleteModal(note.id, note.title, 'note')}
                  onLongPress={() => setMobileContextMenuDoc({
                    id: note.id,
                    title: note.title,
                    type: 'note'
                  })}
                />
              ))}

              {/* Whiteboards */}
              {displayedWhiteboards.map(whiteboard => (
                <MobileDocumentRow
                  key={`whiteboard-${whiteboard.id}`}
                  id={whiteboard.id}
                  title={whiteboard.title}
                  type="whiteboard"
                  date={whiteboard.updatedAt?.toDate ? whiteboard.updatedAt.toDate() : whiteboard.updatedAt ? new Date(whiteboard.updatedAt) : null}
                  onClick={() => handleEditWhiteboard(whiteboard.id)}
                  onDelete={() => handleDeleteWhiteboard(whiteboard.id)}
                  onDeleteRequest={() => openMobileDeleteModal(whiteboard.id, whiteboard.title, 'whiteboard')}
                  onLongPress={() => setMobileContextMenuDoc({
                    id: whiteboard.id,
                    title: whiteboard.title,
                    type: 'whiteboard'
                  })}
                />
              ))}

              {/* Resumes */}
              {displayedResumes.map(resume => (
                <MobileDocumentRow
                  key={`resume-${resume.id}`}
                  id={resume.id}
                  title={resume.name}
                  type="resume"
                  date={resume.updatedAt?.toDate ? resume.updatedAt.toDate() : resume.updatedAt ? new Date(resume.updatedAt) : null}
                  onClick={() => handleEditResume(resume.id)}
                  onDelete={() => deleteResume(resume.id)}
                  onDeleteRequest={() => openMobileDeleteModal(resume.id, resume.name, 'resume')}
                  onLongPress={() => setMobileContextMenuDoc({
                    id: resume.id,
                    title: resume.name,
                    type: 'resume'
                  })}
                />
              ))}

              {/* PDFs */}
              {displayedDocuments.map(document => (
                <MobileDocumentRow
                  key={`doc-${document.id}`}
                  id={document.id}
                  title={document.name}
                  type="pdf"
                  date={document.updatedAt?.toDate ? document.updatedAt.toDate() : document.updatedAt ? new Date(document.updatedAt) : null}
                  onClick={() => handleViewDocument(document)}
                  onDelete={() => deleteDocument(document.id)}
                  onDeleteRequest={() => openMobileDeleteModal(document.id, document.name, 'pdf')}
                  onLongPress={() => setMobileContextMenuDoc({
                    id: document.id,
                    title: document.name,
                    type: 'pdf'

                  })}
                />
              ))}
            </>
          )}
        </div>

        {/* Mobile Bottom Sheets */}
        <MobileCreateSheet
          isOpen={isMobileCreateSheetOpen}
          onClose={() => setIsMobileCreateSheetOpen(false)}
          onCreateNote={handleCreateNote}
          onCreateResume={() => {
            setIsMobileCreateSheetOpen(false);
            openCreateModal();
          }}
          onCreateBoard={handleCreateWhiteboard}
          isCreatingNote={isCreatingNote}
          isCreatingBoard={isCreatingWhiteboard}
        />

        <MobileLibrarySheet
          isOpen={isMobileLibrarySheetOpen}
          onClose={() => setIsMobileLibrarySheetOpen(false)}
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={handleSelectFolder}
          onCreateFolder={() => openFolderModal()}
          totalCount={totalItems}
          uncategorizedCount={totalUncategorized}
          folderCounts={folderCounts}
        />

        <MobileDocumentContextMenu
          isOpen={mobileContextMenuDoc !== null}
          onClose={() => setMobileContextMenuDoc(null)}
          documentTitle={mobileContextMenuDoc?.title || ''}
          onRename={() => {
            if (mobileContextMenuDoc) {
              const newName = prompt('Rename document:', mobileContextMenuDoc.title);
              if (newName && newName.trim()) {
                switch (mobileContextMenuDoc.type) {
                  case 'note':
                    handleRenameNote(mobileContextMenuDoc.id, newName.trim());
                    break;
                  case 'resume':
                    renameResume(mobileContextMenuDoc.id, newName.trim());
                    break;
                  case 'whiteboard':
                    handleRenameWhiteboard(mobileContextMenuDoc.id, newName.trim());
                    break;
                }
              }
            }
          }}
          onMove={() => {
            notify.info('Move to folder coming soon');
          }}
          onTag={() => {
            notify.info('Tag management coming soon');
          }}
          onDelete={() => {
            if (mobileContextMenuDoc) {
              switch (mobileContextMenuDoc.type) {
                case 'note':
                  handleDeleteNote(mobileContextMenuDoc.id);
                  break;
                case 'resume':
                  deleteResume(mobileContextMenuDoc.id);
                  break;
                case 'whiteboard':
                  handleDeleteWhiteboard(mobileContextMenuDoc.id);
                  break;
                case 'pdf':
                  deleteDocument(mobileContextMenuDoc.id);
                  break;
              }
            }
          }}
        />
      </div>

      {/* ========================================= */}
      {/* DESKTOP LAYOUT (hidden md:block) */}
      {/* ========================================= */}
      <div className="hidden md:block h-full">
        {/* Animated Gradient Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300/20 dark:bg-purple-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300/20 dark:bg-pink-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        <div className={`flex h-full transition-all duration-300 ${isAssistantOpen ? 'mr-[440px]' : 'mr-0'}`}>
          {/* Sidebar */}
          <FolderSidebar
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={handleSelectFolder}
            onEditFolder={openFolderModal}
            onDeleteFolder={deleteFolder}
            onNewFolder={() => openFolderModal()}
            onDropResume={handleDropResume}
            onDropDocument={handleDropDocument}
            onDropNote={handleDropNote}
            onDropWhiteboard={handleDropWhiteboard}
            folderCounts={folderCounts}
            uncategorizedCount={totalUncategorized}
            totalCount={totalItems}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            groupedResumes={grouped}
            groupedDocuments={groupedDocs}
            groupedNotes={groupedNotes}
            onEditResume={handleEditResume}
            onViewDocument={handleViewDocument}
            onEditNote={handleEditNote}
          />

          {/* Main Content */}
          <DropZone
            onFileDrop={handleFileDrop}
            acceptedTypes={['application/pdf']}
            maxFileSize={10 * 1024 * 1024}
            className="flex-1 min-h-0 overflow-y-auto bg-white/30 dark:bg-black/20 backdrop-blur-sm"
          >
            {/* Replaced Header with FolderHeader */}
            <FolderHeader
              folder={currentFolder}
              title={headerProps.title}
              subtitle={headerProps.subtitle}
              icon={headerProps.isSpecialView ? headerProps.icon : headerProps.icon}
              coverPhoto={headerProps.isSpecialView ? headerProps.coverPhoto : undefined}
              isSpecialView={headerProps.isSpecialView}
              viewType={headerProps.isSpecialView ? headerProps.viewType : undefined}
              onUpdateCover={handleUpdateCover}
              onRemoveCover={handleRemoveCover}
              onUpdateEmoji={headerProps.isSpecialView ? handleUpdateEmoji : undefined}
              isUpdating={isUpdatingCover}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateNote}
                  disabled={isCreatingNote}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                  text-gray-700 dark:text-gray-200 
                  bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm
                  border border-gray-200 dark:border-[#3d3c3e] rounded-lg
                  hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/80 
                  hover:border-gray-300 dark:hover:border-gray-600
                  shadow-sm hover:shadow transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingNote ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <StickyNote className="w-4 h-4" />
                  )}
                  <span>New Note</span>
                </button>
                <button
                  onClick={handleCreateWhiteboard}
                  disabled={isCreatingWhiteboard}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                  text-gray-700 dark:text-gray-200 
                  bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm
                  border border-gray-200 dark:border-[#3d3c3e] rounded-lg
                  hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/80 
                  hover:border-gray-300 dark:hover:border-gray-600
                  shadow-sm hover:shadow transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingWhiteboard ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Palette className="w-4 h-4" />
                  )}
                  <span>New Board</span>
                </button>
                <button
                  data-tour="new-resume-button"
                  onClick={openCreateModal}
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                    text-gray-700 dark:text-gray-200 
                    bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm
                    border border-gray-200 dark:border-[#3d3c3e] rounded-lg
                    hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/80 
                    hover:border-gray-300 dark:hover:border-gray-600
                    shadow-sm hover:shadow transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>New Resume</span>
                </button>
              </div>
            </FolderHeader>

            <div className="p-6 pt-4">
              {/* Search and Filters */}
              {(resumes.length > 0 || notes.length > 0 || whiteboards.length > 0) && (
                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search documents..."
                        className="w-full pl-9 pr-4 py-2 
                        bg-transparent
                        border border-gray-200 dark:border-[#3d3c3e] rounded-lg
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
                        className="appearance-none bg-transparent border border-gray-200 dark:border-[#3d3c3e] rounded-lg px-3 py-2 pr-8 text-sm text-gray-600 dark:text-gray-300 focus:border-gray-300 dark:focus:border-gray-600 focus:ring-0 focus:outline-none cursor-pointer transition-colors duration-200"
                      >
                        <option value="date">Date</option>
                        <option value="name">Name</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Tag Filters */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Filter by tag:</span>
                    <div className="flex items-center gap-1.5">
                      {TAG_COLORS.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => {
                            setSelectedTagFilters(prev =>
                              prev.includes(tag.id)
                                ? prev.filter(t => t !== tag.id)
                                : [...prev, tag.id]
                            );
                          }}
                          className={`w-5 h-5 rounded-full transition-all hover:scale-110 flex items-center justify-center
                          ${selectedTagFilters.includes(tag.id)
                              ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 dark:ring-offset-gray-900'
                              : 'opacity-50 hover:opacity-100'}`}
                          style={{ backgroundColor: tag.color }}
                          title={tag.label}
                        >
                          {selectedTagFilters.includes(tag.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </button>
                      ))}
                      {selectedTagFilters.length > 0 && (
                        <button
                          onClick={() => setSelectedTagFilters([])}
                          className="ml-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                        >
                          Clear
                        </button>
                      )}
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

              {/* Uploading indicator */}
              {isUploadingPDF && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center gap-3"
                >
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  <span className="text-sm text-purple-700 dark:text-purple-300">Uploading PDF files...</span>
                </motion.div>
              )}

              {/* Empty State - No items at all */}
              {!isLoading && resumes.length === 0 && documents.length === 0 && notes.length === 0 && whiteboards.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 
                  flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-7 h-7 text-purple-500 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1.5">
                    No documents yet
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                    Create notes, whiteboards, resumes, or drag and drop PDF files to get started.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleCreateNote}
                      disabled={isCreatingNote}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                      text-gray-700 dark:text-gray-200 
                      bg-white dark:bg-[#2b2a2c] 
                      border border-gray-200 dark:border-[#3d3c3e] rounded-lg
                      hover:bg-gray-50 dark:hover:bg-[#3d3c3e] 
                      hover:border-gray-300 dark:hover:border-gray-600
                      shadow-sm transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingNote ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <StickyNote className="w-4 h-4" />
                      )}
                      <span>New Note</span>
                    </button>
                    <button
                      onClick={handleCreateWhiteboard}
                      disabled={isCreatingWhiteboard}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                      text-gray-700 dark:text-gray-200 
                      bg-white dark:bg-[#2b2a2c] 
                      border border-gray-200 dark:border-[#3d3c3e] rounded-lg
                      hover:bg-gray-50 dark:hover:bg-[#3d3c3e] 
                      hover:border-gray-300 dark:hover:border-gray-600
                      shadow-sm transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingWhiteboard ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Palette className="w-4 h-4" />
                      )}
                      <span>New Board</span>
                    </button>
                    <button
                      onClick={openCreateModal}
                      disabled={isCreating}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                      text-gray-700 dark:text-gray-200 
                      bg-white dark:bg-[#2b2a2c] 
                      border border-gray-200 dark:border-[#3d3c3e] rounded-lg
                      hover:bg-gray-50 dark:hover:bg-[#3d3c3e] 
                      hover:border-gray-300 dark:hover:border-gray-600
                      shadow-sm transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>New Resume</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Items Grid */}
              {!isLoading && (resumes.length > 0 || documents.length > 0 || notes.length > 0 || whiteboards.length > 0) && (
                <>
                  {totalDisplayedItems > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {/* Notes */}
                      {displayedNotes.map((note) => (
                        <NotionPreviewCard
                          key={`note-${note.id}`}
                          note={note}
                          onDelete={handleDeleteNote}
                          onEdit={handleEditNote}
                          onRename={handleRenameNote}
                          onUpdateTags={handleUpdateNoteTags}
                          compact
                          draggable
                        />
                      ))}
                      {/* Whiteboards */}
                      {displayedWhiteboards.map((whiteboard) => (
                        <WhiteboardPreviewCard
                          key={`whiteboard-${whiteboard.id}`}
                          whiteboard={whiteboard}
                          onDelete={handleDeleteWhiteboard}
                          onEdit={handleEditWhiteboard}
                          onRename={handleRenameWhiteboard}
                          onUpdateTags={handleUpdateWhiteboardTags}
                          compact
                          draggable
                        />
                      ))}
                      {/* Resumes */}
                      {displayedResumes.map((resume) => (
                        <CVPreviewCard
                          key={`resume-${resume.id}`}
                          resume={resume}
                          onDelete={deleteResume}
                          onRename={renameResume}
                          onEdit={handleEditResume}
                          onUpdateTags={updateResumeTags}
                          compact
                          draggable
                        />
                      ))}
                      {/* PDFs */}
                      {displayedDocuments.map((document) => (
                        <PDFPreviewCard
                          key={`doc-${document.id}`}
                          document={document}
                          onDelete={deleteDocument}
                          onView={handleViewDocument}
                          compact
                          draggable
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#2b2a2c] 
                      flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                        {searchQuery ? 'No results found' : 'This folder is empty'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery
                          ? 'Try adjusting your search'
                          : 'Drag documents here or create notes, boards, or resumes'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </DropZone>
        </div>

        {/* Premium PDF Viewer Modal */}
        <PremiumPDFViewer
          pdfDocument={selectedDocument}
          isOpen={pdfViewerOpen}
          onClose={handleCloseViewer}
        />

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
                className="bg-white dark:bg-[#2b2a2c] w-full sm:rounded-2xl rounded-t-2xl max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-[#3d3c3e] flex items-center justify-between bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-xl z-10 sticky top-0">
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
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
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
                        data-tour="resume-name-input"
                        type="text"
                        value={newResumeName}
                        onChange={(e) => setNewResumeName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newResumeName.trim() && !isCreating) {
                            handleCreate();
                          }
                        }}
                        placeholder="e.g., Software Engineer Resume"
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e] 
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
                            <div className="bg-gray-900 dark:bg-[#2b2a2c] text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-nowrap">
                              You can change the template anytime during editing
                              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div data-tour="template-selection" className="grid grid-cols-2 gap-3">
                        {templates.map((template) => (
                          <motion.button
                            key={template.value}
                            onClick={() => setSelectedTemplate(template.value)}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`group relative p-4 rounded-2xl border transition-all text-left
                            ${selectedTemplate === template.value
                                ? 'border-purple-500/50 dark:border-purple-400/50 bg-purple-50/50 dark:bg-purple-900/10 shadow-lg shadow-purple-200/30 dark:shadow-purple-900/20'
                                : 'border-gray-200 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#242325] hover:bg-white dark:hover:bg-[#3d3c3e] hover:shadow-lg hover:border-transparent'
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
                <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100 dark:border-[#3d3c3e] bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-xl">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors
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

        {/* Mobile Delete Confirmation Modal (for swipe-to-delete) */}
        <AnimatePresence>
          {mobileDeleteModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={cancelMobileDelete}
            >

              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white dark:bg-[#2b2a2c] rounded-xl w-full max-w-sm mx-4 shadow-xl border border-gray-200/50 dark:border-[#3d3c3e]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#3d3c3e]">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Delete {mobileDeleteModal.type === 'pdf' ? 'Document' :
                      mobileDeleteModal.type === 'resume' ? 'Resume' :
                        mobileDeleteModal.type === 'whiteboard' ? 'Board' : 'Note'}?
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelMobileDelete}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Body */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Are you sure you want to delete this {mobileDeleteModal.type}? This action cannot be undone.
                  </p>

                  {/* Document Info */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#242325] mb-4">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {mobileDeleteModal.title || 'Untitled'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-4 pt-0">
                  <button
                    onClick={cancelMobileDelete}
                    className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-[#3d3c3e] hover:bg-gray-200 dark:hover:bg-[#4d4c4e] text-gray-900 dark:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmMobileDelete}
                    className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Onboarding Spotlight */}
      <OnboardingSpotlight
        pageKey="resume-builder"
        icon={<FileText className="w-6 h-6 text-violet-600 dark:text-violet-400" />}
        title="Your professional documents"
        description="Create tailored resumes for each application. Notes, whiteboards, and imported PDFs — all in one place."
        secondaryDescription="Organize by folders and use AI to enhance your job descriptions."
        position="center"
      />
    </AuthLayout>
  );
}

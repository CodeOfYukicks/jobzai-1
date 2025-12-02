import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Cloud,
  CloudOff,
  Loader2,
  MoreHorizontal,
  Download,
  FileText,
  Code,
  Trash2,
  Image,
  Camera,
  X,
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import NotionEditor from '../components/notion-editor/NotionEditor';
import FolderSidebar, { SelectedFolderType } from '../components/resume-builder/FolderSidebar';
import { Folder } from '../components/resume-builder/FolderCard';
import { ImportedDocument } from '../components/resume-builder/PDFPreviewCard';
import { Resume } from './ResumeBuilderPage';
import CoverPhotoCropper from '../components/profile/CoverPhotoCropper';
import CoverPhotoGallery from '../components/profile/CoverPhotoGallery';
import {
  getNote,
  getNotes,
  updateNote,
  deleteNote,
  createAutoSaver,
  NotionDocument,
} from '../lib/notionDocService';
import { toast } from 'sonner';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Common emojis for quick selection
const commonEmojis = [
  '📝', '📄', '📋', '📌', '🎯', '💡', '🚀', '⭐',
  '📚', '💼', '🎨', '🔧', '📊', '🗂️', '✅', '❤️',
];

export default function NotionEditorPage() {
  const { noteId: urlNoteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Active note ID - can differ from URL during soft navigation
  const [activeNoteId, setActiveNoteId] = useState<string | undefined>(urlNoteId);
  // Loading state specifically for note content (soft navigation)
  const [isLoadingNote, setIsLoadingNote] = useState(false);

  const [note, setNote] = useState<NotionDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [title, setTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sidebar state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<SelectedFolderType>('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Default open to show file list

  // Items for folder counts
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [documents, setDocuments] = useState<ImportedDocument[]>([]);
  const [notes, setNotes] = useState<NotionDocument[]>([]);

  // Cover image state
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isCoverHovering, setIsCoverHovering] = useState(false);
  const [isCoverCropperOpen, setIsCoverCropperOpen] = useState(false);
  const [isCoverGalleryOpen, setIsCoverGalleryOpen] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<Blob | File | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const autoSaverRef = useRef<ReturnType<typeof createAutoSaver> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const editorScrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-resize title textarea on mount and when title changes
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  // Fetch folders
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
    }
  }, [currentUser]);

  // Fetch resumes for folder counts
  const fetchResumes = useCallback(async () => {
    if (!currentUser) return;

    try {
      const resumesRef = collection(db, 'users', currentUser.uid, 'cvs');
      const q = query(resumesRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const resumesList: Resume[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (docSnapshot.id !== 'default' && data.cvData) {
          resumesList.push({
            id: docSnapshot.id,
            name: data.name || 'Untitled Resume',
            cvData: data.cvData,
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
    }
  }, [currentUser]);

  // Fetch documents for folder counts
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

  // Fetch all notes for folder counts
  const fetchAllNotes = useCallback(async () => {
    if (!currentUser) return;

    try {
      const notesList = await getNotes(currentUser.uid);
      setNotes(notesList);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  }, [currentUser]);

  // Calculate folder counts and grouped items
  const { folderCounts, uncategorizedCount, totalCount, groupedResumes, groupedDocuments, groupedNotes } = useMemo(() => {
    const counts: Record<string, number> = {};
    const resumesByFolder: Record<string, Resume[]> = {};
    const documentsByFolder: Record<string, ImportedDocument[]> = {};
    const notesByFolder: Record<string, NotionDocument[]> = {};
    let uncategorized = 0;

    // Initialize counts for all folders
    folders.forEach(f => {
      counts[f.id] = 0;
      resumesByFolder[f.id] = [];
      documentsByFolder[f.id] = [];
      notesByFolder[f.id] = [];
    });

    // Count and group resumes
    resumes.forEach(resume => {
      if (resume.folderId && counts[resume.folderId] !== undefined) {
        counts[resume.folderId]++;
        resumesByFolder[resume.folderId].push(resume);
      } else {
        uncategorized++;
      }
    });

    // Count and group documents
    documents.forEach(doc => {
      if (doc.folderId && counts[doc.folderId] !== undefined) {
        counts[doc.folderId]++;
        documentsByFolder[doc.folderId].push(doc);
      } else {
        uncategorized++;
      }
    });

    // Count and group notes
    notes.forEach(n => {
      if (n.folderId && counts[n.folderId] !== undefined) {
        counts[n.folderId]++;
        notesByFolder[n.folderId].push(n);
      } else {
        uncategorized++;
      }
    });

    const total = resumes.length + documents.length + notes.length;

    return { 
      folderCounts: counts, 
      uncategorizedCount: uncategorized, 
      totalCount: total,
      groupedResumes: resumesByFolder,
      groupedDocuments: documentsByFolder,
      groupedNotes: notesByFolder
    };
  }, [folders, resumes, documents, notes]);

  // Handlers for opening items from sidebar
  const handleEditResume = useCallback((resumeId: string) => {
    navigate(`/resume-builder/${resumeId}/cv-editor`);
  }, [navigate]);

  const handleViewDocument = useCallback((document: ImportedDocument) => {
    // Navigate to resume builder with document selected (or could open PDF viewer)
    navigate('/resume-builder');
  }, [navigate]);

  // Soft navigation to another note - keeps sidebar fixed, only reloads content
  const loadNote = useCallback(async (noteIdToLoad: string) => {
    if (!currentUser) return;
    
    setIsLoadingNote(true);
    
    // Scroll to top immediately when switching notes
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (editorScrollContainerRef.current) {
        editorScrollContainerRef.current.scrollTop = 0;
      }
    };
    scrollToTop();
    
    try {
      // Cancel any pending auto-save from previous note
      autoSaverRef.current?.cancel();
      
      const fetchedNote = await getNote(currentUser.uid, noteIdToLoad);
      if (fetchedNote) {
        setNote(fetchedNote);
        setTitle(fetchedNote.title || '');
        setActiveNoteId(noteIdToLoad);
        setHasUnsavedChanges(false);
        setLastSaved(null);
        if (fetchedNote.folderId) {
          setSelectedFolderId(fetchedNote.folderId);
        }
        // Create new auto-saver for this note
        autoSaverRef.current = createAutoSaver(currentUser.uid, noteIdToLoad, 2000);
        
        // Scroll to top again after content is set (wait for cards to render)
        setTimeout(() => {
          scrollToTop();
          requestAnimationFrame(() => {
            scrollToTop();
          });
        }, 250);
      } else {
        toast.error('Note not found');
        navigate('/resume-builder');
      }
    } catch (error) {
      console.error('Error loading note:', error);
      toast.error('Failed to load note');
    } finally {
      setIsLoadingNote(false);
    }
  }, [currentUser, navigate]);

  const handleEditNote = useCallback((noteIdToEdit: string) => {
    if (noteIdToEdit !== activeNoteId) {
      // Update URL without triggering full React Router navigation
      window.history.pushState({ noteId: noteIdToEdit }, '', `/notes/${noteIdToEdit}`);
      // Load the new note with soft navigation
      loadNote(noteIdToEdit);
    }
  }, [activeNoteId, loadNote]);

  // Initialize auto-saver
  useEffect(() => {
    if (currentUser && activeNoteId) {
      autoSaverRef.current = createAutoSaver(currentUser.uid, activeNoteId, 2000);
    }

    return () => {
      autoSaverRef.current?.cancel();
    };
  }, [currentUser, activeNoteId]);

  // Sync activeNoteId from URL on initial mount
  useEffect(() => {
    if (urlNoteId && urlNoteId !== activeNoteId) {
      setActiveNoteId(urlNoteId);
    }
  }, [urlNoteId]);

  // Scroll to top on initial mount and whenever activeNoteId changes (when opening/switching notes)
  useEffect(() => {
    const scrollToTop = () => {
      // Scroll window to top
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Scroll the main editor container to top
      if (editorScrollContainerRef.current) {
        editorScrollContainerRef.current.scrollTop = 0;
      }
    };
    
    // Immediate scroll
    scrollToTop();
    
    // Also scroll after a delay to ensure cards are rendered
    setTimeout(() => {
      scrollToTop();
      requestAnimationFrame(() => {
        scrollToTop();
      });
    }, 250);
  }, [activeNoteId]);

  // Also scroll to top on initial page load
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (editorScrollContainerRef.current) {
        editorScrollContainerRef.current.scrollTop = 0;
      }
    };
    scrollToTop();
    setTimeout(() => scrollToTop(), 100);
  }, []);

  // Fetch note and folders on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !activeNoteId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all data in parallel
        await Promise.all([
          fetchFolders(),
          fetchResumes(),
          fetchDocuments(),
          fetchAllNotes(),
        ]);
        
        const fetchedNote = await getNote(currentUser.uid, activeNoteId);
        if (fetchedNote) {
          setNote(fetchedNote);
          setTitle(fetchedNote.title || '');
          if (fetchedNote.folderId) {
            setSelectedFolderId(fetchedNote.folderId);
          }
        } else {
          toast.error('Note not found');
          navigate('/resume-builder');
        }
      } catch (error) {
        console.error('Error fetching note:', error);
        toast.error('Failed to load note');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, activeNoteId, navigate, fetchFolders, fetchResumes, fetchDocuments, fetchAllNotes]);

  // Helper to check if content contains mention embeds
  const hasMentionEmbeds = (content: any): boolean => {
    if (!content || !content.content) return false;
    
    const checkNode = (node: any): boolean => {
      if (node.type === 'mentionEmbed') return true;
      if (node.content && Array.isArray(node.content)) {
        return node.content.some(checkNode);
      }
      return false;
    };
    
    return content.content.some(checkNode);
  };

  // Handle content changes with auto-save
  const handleContentChange = useCallback(
    async (content: any) => {
      setHasUnsavedChanges(true);
      
      // Debug: Log content with mention embeds
      if (hasMentionEmbeds(content)) {
        console.log('Content with mention embeds detected:', JSON.stringify(content, null, 2));
      }
      
      // If content contains mention embeds, save immediately
      // Otherwise use debounced save
      if (hasMentionEmbeds(content)) {
        // Force immediate save for mention embeds with the current content
        try {
          await autoSaverRef.current?.saveNow(content);
          console.log('Mention embed saved immediately');
        } catch (error) {
          console.error('Error saving mention embed:', error);
          toast.error('Failed to save mention embed');
        }
      } else {
        // Use debounced save for regular content
        autoSaverRef.current?.queueSave(content);
      }

      setNote((prev) =>
        prev ? { ...prev, content } : null
      );

      setTimeout(() => {
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
      }, 2100);
    },
    []
  );

  // Handle title change
  const handleTitleChange = useCallback(
    async (newTitle: string) => {
      setTitle(newTitle);

      if (!currentUser || !activeNoteId) return;

      try {
        await updateNote({
          userId: currentUser.uid,
          noteId: activeNoteId,
          updates: { title: newTitle },
        });
        setNote((prev) =>
          prev ? { ...prev, title: newTitle } : null
        );
      } catch (error) {
        console.error('Error updating title:', error);
      }
    },
    [currentUser, activeNoteId]
  );

  // Handle emoji change
  const handleEmojiChange = useCallback(
    async (emoji: string) => {
      if (!currentUser || !activeNoteId) return;

      try {
        await updateNote({
          userId: currentUser.uid,
          noteId: activeNoteId,
          updates: { emoji },
        });
        setNote((prev) =>
          prev ? { ...prev, emoji } : null
        );
        setShowEmojiPicker(false);
      } catch (error) {
        console.error('Error updating emoji:', error);
      }
    },
    [currentUser, activeNoteId]
  );

  // Handle file selection for cover
  const handleCoverFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCoverFile(file);
      setIsCoverCropperOpen(true);
    }
    // Reset input
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  }, []);

  // Handle gallery selection
  const handleGallerySelect = useCallback((blob: Blob) => {
    setSelectedCoverFile(blob);
    setIsCoverGalleryOpen(false);
    setIsCoverCropperOpen(true);
  }, []);

  // Handle cropped cover upload
  const handleCroppedCover = useCallback(async (blob: Blob) => {
    if (!currentUser || !activeNoteId) return;

    setIsUpdatingCover(true);
    try {
      const timestamp = Date.now();
      const fileName = `note_${activeNoteId}_cover_${timestamp}.jpg`;
      const coverRef = ref(storage, `note-covers/${currentUser.uid}/${fileName}`);
      
      await uploadBytes(coverRef, blob, { contentType: 'image/jpeg' });
      const coverUrl = await getDownloadURL(coverRef);
      
      await updateNote({
        userId: currentUser.uid,
        noteId: activeNoteId,
        updates: { coverImage: coverUrl },
      });
      
      setNote((prev) => prev ? { ...prev, coverImage: coverUrl } : null);
      toast.success('Cover image updated');
    } catch (error) {
      console.error('Error updating cover:', error);
      toast.error('Failed to update cover image');
    } finally {
      setIsUpdatingCover(false);
      setIsCoverCropperOpen(false);
      setSelectedCoverFile(null);
    }
  }, [currentUser, activeNoteId]);

  // Handle cover image remove
  const handleRemoveCover = useCallback(async () => {
    if (!currentUser || !activeNoteId || !note?.coverImage) return;

    setIsUpdatingCover(true);
    try {
      // Update note to remove cover
      await updateNote({
        userId: currentUser.uid,
        noteId: activeNoteId,
        updates: { coverImage: '' },
      });
      
      // Try to delete from storage
      try {
        const coverRef = ref(storage, note.coverImage);
        await deleteObject(coverRef);
      } catch (e) {
        console.warn('Could not delete old cover from storage', e);
      }
      
      setNote((prev) => prev ? { ...prev, coverImage: undefined } : null);
      toast.success('Cover image removed');
    } catch (error) {
      console.error('Error removing cover:', error);
      toast.error('Failed to remove cover image');
    } finally {
      setIsUpdatingCover(false);
    }
  }, [currentUser, activeNoteId, note?.coverImage]);

  // Manual save
  const handleManualSave = useCallback(async () => {
    if (!autoSaverRef.current) return;

    setIsSaving(true);
    try {
      await autoSaverRef.current.saveNow();
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success('Saved');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Export as Markdown
  const handleExportMarkdown = useCallback(() => {
    if (!note) return;

    const content = note.content;
    let markdown = `# ${note.title || 'Untitled'}\n\n`;

    const nodeToMarkdown = (node: any): string => {
      switch (node.type) {
        case 'paragraph':
          return (node.content?.map(nodeToMarkdown).join('') || '') + '\n\n';
        case 'heading':
          const level = '#'.repeat(node.attrs?.level || 1);
          return `${level} ${node.content?.map(nodeToMarkdown).join('') || ''}\n\n`;
        case 'bulletList':
          return (node.content?.map((item: any) => `- ${nodeToMarkdown(item)}`).join('') || '') + '\n';
        case 'orderedList':
          return (node.content?.map((item: any, i: number) => `${i + 1}. ${nodeToMarkdown(item)}`).join('') || '') + '\n';
        case 'listItem':
          return node.content?.map(nodeToMarkdown).join('').trim() + '\n';
        case 'blockquote':
          return `> ${node.content?.map(nodeToMarkdown).join('') || ''}\n`;
        case 'codeBlock':
          return `\`\`\`\n${node.content?.map(nodeToMarkdown).join('') || ''}\`\`\`\n\n`;
        case 'horizontalRule':
          return '---\n\n';
        case 'text':
          let text = node.text || '';
          if (node.marks) {
            node.marks.forEach((mark: any) => {
              switch (mark.type) {
                case 'bold': text = `**${text}**`; break;
                case 'italic': text = `*${text}*`; break;
                case 'code': text = `\`${text}\``; break;
                case 'link': text = `[${text}](${mark.attrs?.href || ''})`; break;
              }
            });
          }
          return text;
        default:
          return node.content?.map(nodeToMarkdown).join('') || '';
      }
    };

    if (content?.content) {
      content.content.forEach((node: any) => {
        markdown += nodeToMarkdown(node);
      });
    }

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'untitled'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Exported as Markdown');
    setShowMenu(false);
  }, [note]);

  // Export as JSON
  const handleExportJSON = useCallback(() => {
    if (!note) return;

    const blob = new Blob([JSON.stringify(note.content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'untitled'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Exported as JSON');
    setShowMenu(false);
  }, [note]);

  // Delete note
  const handleDelete = useCallback(async () => {
    if (!currentUser || !activeNoteId) return;

    setIsDeleting(true);
    try {
      await deleteNote(currentUser.uid, activeNoteId);
      toast.success('Note deleted');
      navigate('/resume-builder');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [currentUser, activeNoteId, navigate]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      // Extract noteId from current URL
      const match = window.location.pathname.match(/^\/notes\/([^/]+)/);
      const newNoteId = match?.[1];
      
      if (newNoteId && newNoteId !== activeNoteId) {
        loadNote(newNoteId);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeNoteId, loadNote]);

  const handleSelectFolder = (folderId: SelectedFolderType) => {
    setSelectedFolderId(folderId);
    navigate('/resume-builder');
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  if (!note) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Note not found</p>
          <button
            onClick={() => navigate('/resume-builder')}
            className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
          >
            Go back
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex h-full">
        {/* Sidebar */}
        <FolderSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={handleSelectFolder}
          onEditFolder={() => {}}
          onDeleteFolder={() => {}}
          onNewFolder={() => navigate('/resume-builder')}
          onDropResume={() => {}}
          onDropDocument={() => {}}
          onDropNote={() => {}}
          folderCounts={folderCounts}
          uncategorizedCount={uncategorizedCount}
          totalCount={totalCount}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          groupedResumes={groupedResumes}
          groupedDocuments={groupedDocuments}
          groupedNotes={groupedNotes}
          onEditResume={handleEditResume}
          onViewDocument={handleViewDocument}
          onEditNote={handleEditNote}
        />

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950">
          {/* Minimal Header - Notion style */}
          <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              {/* Save status */}
              {hasUnsavedChanges ? (
                <div className="flex items-center gap-1.5 text-amber-500 text-xs">
                  <CloudOff className="w-3.5 h-3.5" />
                  <span>Editing...</span>
                </div>
              ) : lastSaved ? (
                <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleManualSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>

              {/* More menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1 z-50"
                    >
                      <button
                        onClick={handleExportMarkdown}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export Markdown
                      </button>
                      <button
                        onClick={handleExportJSON}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Code className="w-4 h-4" />
                        Export JSON
                      </button>
                      <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Note
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Editor Content - Notion style with emoji and title in content */}
          <div ref={editorScrollContainerRef} className="flex-1 overflow-y-auto relative">
            {/* Loading overlay for soft navigation between notes */}
            <AnimatePresence>
              {isLoadingNote && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading note...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cover Image Section - FolderHeader style */}
            <div 
              className="relative w-full group/cover"
              onMouseEnter={() => setIsCoverHovering(true)}
              onMouseLeave={() => setIsCoverHovering(false)}
            >
              <div className={`relative w-full transition-all duration-300 ease-in-out ${note.coverImage ? 'h-48 sm:h-64' : 'h-24 sm:h-32'}`}>
                {note.coverImage ? (
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <img 
                      src={note.coverImage} 
                      alt="Note cover" 
                      className="w-full h-full object-cover animate-in fade-in duration-500"
                    />
                    <div className="absolute inset-0 bg-black/5 dark:bg-black/20 transition-colors duration-300 group-hover/cover:bg-black/10 dark:group-hover/cover:bg-black/30" />
                  </div>
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-purple-900/20 border-b border-white/20 dark:border-gray-700/20">
                    <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" 
                       style={{ backgroundImage: 'radial-gradient(#8B5CF6 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
                    />
                    {/* Subtle animated gradient orbs */}
                    <div className="absolute top-10 right-20 w-64 h-64 bg-purple-200/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob" />
                    <div className="absolute bottom-10 left-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
                  </div>
                )}

                {/* Cover Controls - Visible on hover */}
                <AnimatePresence>
                  {(isCoverHovering || !note.coverImage) && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute ${note.coverImage ? 'top-4 right-4' : 'bottom-4 right-4'} flex items-center gap-2 z-20`}
                    >
                      {!note.coverImage ? (
                        // "Add Cover" button when no cover exists
                        <button
                          onClick={() => setIsCoverGalleryOpen(true)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 
                            bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800
                            border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200
                            hover:shadow-md group"
                        >
                          <Image className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                          <span>Add cover</span>
                        </button>
                      ) : (
                        // Controls when cover exists
                        <div className="flex items-center gap-1 p-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg border border-black/5 dark:border-white/10 shadow-lg">
                          <button
                            onClick={() => setIsCoverGalleryOpen(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                              hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                          >
                            <Image className="w-3.5 h-3.5" />
                            Change cover
                          </button>
                          
                          <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                          
                          <button
                            onClick={() => coverInputRef.current?.click()}
                            disabled={isUpdatingCover}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                              hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                          >
                            {isUpdatingCover ? (
                              <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Camera className="w-3.5 h-3.5" />
                            )}
                            Upload
                          </button>
                          
                          <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                          
                          <button
                            onClick={handleRemoveCover}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 
                              hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                            title="Remove cover"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={coverInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverFileSelect}
                />
              </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 pb-48">
              {/* Large Emoji - Notion style, straddling the cover */}
              <div className={`relative ${note.coverImage ? '-mt-12' : 'mt-6'}`} ref={emojiPickerRef}>
                <motion.button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-7xl hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl p-2 -ml-2 transition-colors cursor-pointer"
                >
                  {note.emoji || '📝'}
                </motion.button>

                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute mt-2 p-3 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50"
                    >
                      <div className="grid grid-cols-8 gap-1">
                        {commonEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleEmojiChange(emoji)}
                            className={`p-2 text-2xl rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                              note.emoji === emoji ? 'bg-purple-100 dark:bg-purple-900/30' : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Large Title Input - Notion style */}
              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  // Prevent Enter from creating new lines - move focus to editor instead
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                placeholder="Untitled"
                rows={1}
                className="w-full text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 mt-2 mb-6 resize-none overflow-hidden leading-tight"
              />

              {/* Editor - key forces remount when activeNoteId changes to ensure isolated content */}
              <NotionEditor
                key={activeNoteId}
                content={note.content}
                onChange={handleContentChange}
                placeholder="Type '/' for commands..."
                autofocus
              />
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Note?</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  "{note.title || 'Untitled'}" will be permanently deleted.
                </p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-600/25 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cover Photo Modals */}
        <CoverPhotoCropper
          isOpen={isCoverCropperOpen}
          file={selectedCoverFile}
          onClose={() => {
            setIsCoverCropperOpen(false);
            setSelectedCoverFile(null);
          }}
          onCropped={handleCroppedCover}
          exportWidth={1584}
          exportHeight={396}
        />
        
        <CoverPhotoGallery
          isOpen={isCoverGalleryOpen}
          onClose={() => setIsCoverGalleryOpen(false)}
          onSelectBlob={handleGallerySelect}
          onRemove={handleRemoveCover}
          currentCover={note?.coverImage}
        />
      </div>
    </AuthLayout>
  );
}

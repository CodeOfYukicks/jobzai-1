import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  StickyNote,
  Search,
  X,
  Link2,
  Unlink,
  Loader2,
  Plus,
  ExternalLink,
  File,
  LayoutDashboard,
} from 'lucide-react';
import { JobApplication } from '../../types/job';
import { Resume } from '../../pages/ResumeBuilderPage';
import { NotionDocument, getNotes } from '../../lib/notionDocService';
import { WhiteboardDocument, getWhiteboards } from '../../lib/whiteboardDocService';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import CVPreviewCard from '../resume-builder/CVPreviewCard';
import NotionPreviewCard from '../notion-editor/NotionPreviewCard';
import PDFPreviewCard, { ImportedDocument } from '../resume-builder/PDFPreviewCard';
import WhiteboardPreviewCard from '../whiteboard/WhiteboardPreviewCard';
import { CVData } from '../../types/cvEditor';

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

interface LinkedDocumentsTabProps {
  job: JobApplication;
  onUpdate?: (updatedJob: Partial<JobApplication>) => Promise<void>;
}

export const LinkedDocumentsTab = ({ job, onUpdate }: LinkedDocumentsTabProps) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [notes, setNotes] = useState<NotionDocument[]>([]);
  const [documents, setDocuments] = useState<ImportedDocument[]>([]);
  const [whiteboards, setWhiteboards] = useState<WhiteboardDocument[]>([]);
  const [activeSection, setActiveSection] = useState<'linked' | 'available'>('linked');

  // Fetch CVs and Notes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      try {
        // Fetch CVs
        const resumesRef = collection(db, 'users', currentUser.uid, 'cvs');
        const resumesQuery = query(resumesRef, orderBy('updatedAt', 'desc'));
        const resumesSnapshot = await getDocs(resumesQuery);

        const resumesList: Resume[] = [];
        resumesSnapshot.forEach((doc) => {
          const data = doc.data();
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
              tags: data.tags || [],
            });
          }
        });

        setResumes(resumesList);

        // Fetch Notes
        const notesList = await getNotes(currentUser.uid);
        setNotes(notesList);

        // Fetch PDF Documents
        const documentsRef = collection(db, 'users', currentUser.uid, 'documents');
        const documentsQuery = query(documentsRef, orderBy('updatedAt', 'desc'));
        const documentsSnapshot = await getDocs(documentsQuery);

        const documentsList: ImportedDocument[] = [];
        documentsSnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          documentsList.push({
            id: docSnapshot.id,
            name: data.name || 'Untitled Document',
            fileUrl: data.fileUrl,
            fileSize: data.fileSize || 0,
            pageCount: data.pageCount,
            folderId: data.folderId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });

        setDocuments(documentsList);

        // Fetch Whiteboards
        const whiteboardsList = await getWhiteboards(currentUser.uid);
        setWhiteboards(whiteboardsList);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Get linked items
  const linkedResumeIds = job.linkedResumeIds || [];
  const linkedNoteIds = job.linkedNoteIds || [];
  const linkedDocumentIds = job.linkedDocumentIds || [];
  const linkedWhiteboardIds = job.linkedWhiteboardIds || [];

  const linkedResumes = resumes.filter((r) => linkedResumeIds.includes(r.id));
  const linkedNotes = notes.filter((n) => linkedNoteIds.includes(n.id));
  const linkedDocuments = documents.filter((d) => linkedDocumentIds.includes(d.id));
  const linkedWhiteboards = whiteboards.filter((w) => linkedWhiteboardIds.includes(w.id));

  // Get available (unlinked) items
  const availableResumes = resumes.filter((r) => !linkedResumeIds.includes(r.id));
  const availableNotes = notes.filter((n) => !linkedNoteIds.includes(n.id));
  const availableDocuments = documents.filter((d) => !linkedDocumentIds.includes(d.id));
  const availableWhiteboards = whiteboards.filter((w) => !linkedWhiteboardIds.includes(w.id));

  // Filter by search query
  const filterItems = <T extends { name?: string; title?: string }>(
    items: T[],
    query: string
  ): T[] => {
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(lowerQuery) ||
        item.title?.toLowerCase().includes(lowerQuery)
    );
  };

  const filteredLinkedResumes = filterItems(linkedResumes, searchQuery);
  const filteredLinkedNotes = filterItems(linkedNotes, searchQuery);
  const filteredLinkedDocuments = filterItems(linkedDocuments, searchQuery);
  const filteredLinkedWhiteboards = filterItems(linkedWhiteboards, searchQuery);
  const filteredAvailableResumes = filterItems(availableResumes, searchQuery);
  const filteredAvailableNotes = filterItems(availableNotes, searchQuery);
  const filteredAvailableDocuments = filterItems(availableDocuments, searchQuery);
  const filteredAvailableWhiteboards = filterItems(availableWhiteboards, searchQuery);

  // Link handlers
  const handleLinkResume = useCallback(
    async (resumeId: string) => {
      if (!onUpdate) return;

      const currentLinked = job.linkedResumeIds || [];
      if (currentLinked.includes(resumeId)) return;

      try {
        await onUpdate({
          linkedResumeIds: [...currentLinked, resumeId],
        });
        toast.success('Resume linked successfully');
      } catch (error) {
        console.error('Error linking resume:', error);
        toast.error('Failed to link resume');
      }
    },
    [job.linkedResumeIds, onUpdate]
  );

  const handleUnlinkResume = useCallback(
    async (resumeId: string) => {
      if (!onUpdate) return;

      const currentLinked = job.linkedResumeIds || [];
      if (!currentLinked.includes(resumeId)) return;

      try {
        await onUpdate({
          linkedResumeIds: currentLinked.filter((id) => id !== resumeId),
        });
        toast.success('Resume unlinked successfully');
      } catch (error) {
        console.error('Error unlinking resume:', error);
        toast.error('Failed to unlink resume');
      }
    },
    [job.linkedResumeIds, onUpdate]
  );

  const handleLinkNote = useCallback(
    async (noteId: string) => {
      if (!onUpdate) return;

      const currentLinked = job.linkedNoteIds || [];
      if (currentLinked.includes(noteId)) return;

      try {
        await onUpdate({
          linkedNoteIds: [...currentLinked, noteId],
        });
        toast.success('Note linked successfully');
      } catch (error) {
        console.error('Error linking note:', error);
        toast.error('Failed to link note');
      }
    },
    [job.linkedNoteIds, onUpdate]
  );

  const handleUnlinkNote = useCallback(
    async (noteId: string) => {
      if (!onUpdate) return;

      const currentLinked = job.linkedNoteIds || [];
      if (!currentLinked.includes(noteId)) return;

      try {
        await onUpdate({
          linkedNoteIds: currentLinked.filter((id) => id !== noteId),
        });
        toast.success('Note unlinked successfully');
      } catch (error) {
        console.error('Error unlinking note:', error);
        toast.error('Failed to unlink note');
      }
    },
    [job.linkedNoteIds, onUpdate]
  );

  const handleLinkDocument = useCallback(
    async (documentId: string) => {
      if (!onUpdate) return;

      const currentLinked = job.linkedDocumentIds || [];
      if (currentLinked.includes(documentId)) return;

      try {
        await onUpdate({
          linkedDocumentIds: [...currentLinked, documentId],
        });
        toast.success('PDF document linked successfully');
      } catch (error) {
        console.error('Error linking document:', error);
        toast.error('Failed to link PDF document');
      }
    },
    [job.linkedDocumentIds, onUpdate]
  );

  const handleUnlinkDocument = useCallback(
    async (documentId: string) => {
      if (!onUpdate) return;

      const currentLinked = job.linkedDocumentIds || [];
      if (!currentLinked.includes(documentId)) return;

      try {
        await onUpdate({
          linkedDocumentIds: currentLinked.filter((id) => id !== documentId),
        });
        toast.success('PDF document unlinked successfully');
      } catch (error) {
        console.error('Error unlinking document:', error);
        toast.error('Failed to unlink PDF document');
      }
    },
    [job.linkedDocumentIds, onUpdate]
  );

  const handleLinkWhiteboard = useCallback(
    async (whiteboardId: string) => {
      if (!onUpdate) return;

      const currentLinked = job.linkedWhiteboardIds || [];
      if (currentLinked.includes(whiteboardId)) return;

      try {
        await onUpdate({
          linkedWhiteboardIds: [...currentLinked, whiteboardId],
        });
        toast.success('Whiteboard linked successfully');
      } catch (error) {
        console.error('Error linking whiteboard:', error);
        toast.error('Failed to link whiteboard');
      }
    },
    [job.linkedWhiteboardIds, onUpdate]
  );

  const handleUnlinkWhiteboard = useCallback(
    async (whiteboardId: string) => {
      if (!onUpdate) return;

      const currentLinked = job.linkedWhiteboardIds || [];
      if (!currentLinked.includes(whiteboardId)) return;

      try {
        await onUpdate({
          linkedWhiteboardIds: currentLinked.filter((id) => id !== whiteboardId),
        });
        toast.success('Whiteboard unlinked successfully');
      } catch (error) {
        console.error('Error unlinking whiteboard:', error);
        toast.error('Failed to unlink whiteboard');
      }
    },
    [job.linkedWhiteboardIds, onUpdate]
  );

  // Navigation handlers
  const handleResumeClick = useCallback(
    (resumeId: string) => {
      navigate(`/resume-builder/${resumeId}/cv-editor`);
    },
    [navigate]
  );

  const handleNoteClick = useCallback(
    (noteId: string) => {
      navigate(`/notes/${noteId}`);
    },
    [navigate]
  );

  const handleWhiteboardClick = useCallback(
    (whiteboardId: string) => {
      navigate(`/whiteboard/${whiteboardId}`);
    },
    [navigate]
  );

  const handleDocumentView = useCallback(
    (document: ImportedDocument) => {
      // Open PDF in new tab
      window.open(document.fileUrl, '_blank');
    },
    []
  );

  // Placeholder handlers for CVPreviewCard, NotionPreviewCard, and PDFPreviewCard
  const handleResumeDelete = () => {
    // Not used in this context
  };

  const handleResumeRename = () => {
    // Not used in this context
  };

  const handleNoteDelete = () => {
    // Not used in this context
  };

  const handleNoteRename = () => {
    // Not used in this context
  };

  const handleDocumentDelete = () => {
    // Not used in this context
  };

  const handleWhiteboardDelete = () => {
    // Not used in this context
  };

  const handleWhiteboardRename = () => {
    // Not used in this context
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  const totalLinked = linkedResumes.length + linkedNotes.length + linkedDocuments.length + linkedWhiteboards.length;
  const totalAvailable = availableResumes.length + availableNotes.length + availableDocuments.length + availableWhiteboards.length;

  return (
    <div className="space-y-6">
      {/* Section Toggle */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-[#3d3c3e] pb-4">
        <button
          onClick={() => setActiveSection('linked')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeSection === 'linked'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Linked ({totalLinked})
        </button>
        <button
          onClick={() => setActiveSection('available')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeSection === 'available'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Available ({totalAvailable})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search CVs, Notes, Documents, and Whiteboards..."
          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm text-gray-900 dark:text-white placeholder-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Linked Section */}
      {activeSection === 'linked' && (
        <div className="space-y-6">
          {/* Linked Resumes */}
          {filteredLinkedResumes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Linked Resumes ({filteredLinkedResumes.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredLinkedResumes.map((resume) => (
                  <div key={resume.id} className="relative group">
                    <div
                      onClick={() => handleResumeClick(resume.id)}
                      className="cursor-pointer"
                    >
                      <CVPreviewCard
                        resume={resume}
                        onDelete={handleResumeDelete}
                        onRename={handleResumeRename}
                        onEdit={handleResumeClick}
                        compact
                        draggable={false}
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlinkResume(resume.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      title="Unlink"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked Notes */}
          {filteredLinkedNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <StickyNote className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Linked Notes ({filteredLinkedNotes.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredLinkedNotes.map((note) => (
                  <div key={note.id} className="relative group">
                    <div
                      onClick={() => handleNoteClick(note.id)}
                      className="cursor-pointer"
                    >
                      <NotionPreviewCard
                        note={note}
                        onDelete={handleNoteDelete}
                        onEdit={handleNoteClick}
                        compact
                        draggable={false}
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlinkNote(note.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      title="Unlink"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked PDF Documents */}
          {filteredLinkedDocuments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <File className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Linked PDF Documents ({filteredLinkedDocuments.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredLinkedDocuments.map((document) => (
                  <div key={document.id} className="relative group">
                    <div
                      onClick={() => handleDocumentView(document)}
                      className="cursor-pointer"
                    >
                      <PDFPreviewCard
                        document={document}
                        onDelete={handleDocumentDelete}
                        onView={handleDocumentView}
                        compact
                        draggable={false}
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlinkDocument(document.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      title="Unlink"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked Whiteboards */}
          {filteredLinkedWhiteboards.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <LayoutDashboard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Linked Whiteboards ({filteredLinkedWhiteboards.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredLinkedWhiteboards.map((whiteboard) => (
                  <div key={whiteboard.id} className="relative group">
                    <div
                      onClick={() => handleWhiteboardClick(whiteboard.id)}
                      className="cursor-pointer"
                    >
                      <WhiteboardPreviewCard
                        whiteboard={whiteboard}
                        onDelete={handleWhiteboardDelete}
                        onEdit={handleWhiteboardClick}
                        onRename={handleWhiteboardRename}
                        compact
                        draggable={false}
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlinkWhiteboard(whiteboard.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      title="Unlink"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State - Linked */}
          {filteredLinkedResumes.length === 0 && filteredLinkedNotes.length === 0 && filteredLinkedDocuments.length === 0 && filteredLinkedWhiteboards.length === 0 && (
            <div className="text-center py-16 bg-gray-50 dark:bg-[#2b2a2c]/50 rounded-2xl border border-dashed border-gray-200 dark:border-[#3d3c3e]">
              <div className="w-16 h-16 bg-white dark:bg-[#2b2a2c] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-[#3d3c3e]">
                <Link2 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                No linked documents
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
                {searchQuery
                  ? 'No linked documents match your search'
                  : 'Link CVs and Notes from the Available section to keep them organized with this application.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setActiveSection('available')}
                  className="px-5 py-2.5 bg-white dark:bg-[#2b2a2c] text-gray-900 dark:text-white border border-gray-200 dark:border-[#3d3c3e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-all font-medium text-sm inline-flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Browse Available Documents
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Available Section */}
      {activeSection === 'available' && (
        <div className="space-y-6">
          {/* Available Resumes */}
          {filteredAvailableResumes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Available Resumes ({filteredAvailableResumes.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAvailableResumes.map((resume) => (
                  <div key={resume.id} className="relative group">
                    <div
                      onClick={() => handleResumeClick(resume.id)}
                      className="cursor-pointer"
                    >
                      <CVPreviewCard
                        resume={resume}
                        onDelete={handleResumeDelete}
                        onRename={handleResumeRename}
                        onEdit={handleResumeClick}
                        compact
                        draggable={false}
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLinkResume(resume.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-purple-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-purple-600"
                      title="Link to this application"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Notes */}
          {filteredAvailableNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <StickyNote className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Available Notes ({filteredAvailableNotes.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAvailableNotes.map((note) => (
                  <div key={note.id} className="relative group">
                    <div
                      onClick={() => handleNoteClick(note.id)}
                      className="cursor-pointer"
                    >
                      <NotionPreviewCard
                        note={note}
                        onDelete={handleNoteDelete}
                        onEdit={handleNoteClick}
                        compact
                        draggable={false}
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLinkNote(note.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-purple-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-purple-600"
                      title="Link to this application"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available PDF Documents */}
          {filteredAvailableDocuments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <File className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Available PDF Documents ({filteredAvailableDocuments.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAvailableDocuments.map((document) => (
                  <div key={document.id} className="relative group">
                    <div
                      onClick={() => handleDocumentView(document)}
                      className="cursor-pointer"
                    >
                      <PDFPreviewCard
                        document={document}
                        onDelete={handleDocumentDelete}
                        onView={handleDocumentView}
                        compact
                        draggable={false}
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLinkDocument(document.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-purple-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-purple-600"
                      title="Link to this application"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Whiteboards */}
          {filteredAvailableWhiteboards.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <LayoutDashboard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Available Whiteboards ({filteredAvailableWhiteboards.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAvailableWhiteboards.map((whiteboard) => (
                  <div key={whiteboard.id} className="relative group">
                    <div
                      onClick={() => handleWhiteboardClick(whiteboard.id)}
                      className="cursor-pointer"
                    >
                      <WhiteboardPreviewCard
                        whiteboard={whiteboard}
                        onDelete={handleWhiteboardDelete}
                        onEdit={handleWhiteboardClick}
                        onRename={handleWhiteboardRename}
                        compact
                        draggable={false}
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLinkWhiteboard(whiteboard.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-purple-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-purple-600"
                      title="Link to this application"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State - Available */}
          {filteredAvailableResumes.length === 0 && filteredAvailableNotes.length === 0 && filteredAvailableDocuments.length === 0 && filteredAvailableWhiteboards.length === 0 && (
            <div className="text-center py-16 bg-gray-50 dark:bg-[#2b2a2c]/50 rounded-2xl border border-dashed border-gray-200 dark:border-[#3d3c3e]">
              <div className="w-16 h-16 bg-white dark:bg-[#2b2a2c] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-[#3d3c3e]">
                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {searchQuery ? 'No documents found' : 'No available documents'}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Create CVs and Notes in the Resume Builder to link them here.'}
              </p>
              {!searchQuery && (
                <a
                  href="/resume-builder"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#2b2a2c] text-gray-900 dark:text-white border border-gray-200 dark:border-[#3d3c3e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-all font-medium text-sm shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Go to Resume Builder
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


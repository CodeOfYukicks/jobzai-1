import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, StickyNote, Layout, File, Plus, Loader2, Search, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Resume } from '../../pages/ResumeBuilderPage';
import { NotionDocument, getNotes } from '../../lib/notionDocService';
import { WhiteboardDocument, getWhiteboards } from '../../lib/whiteboardDocService';
import { ImportedDocument } from '../../components/resume-builder/PDFPreviewCard';
import { toast } from 'sonner';
import CVPreviewCard from '../resume-builder/CVPreviewCard';
import PDFPreviewCard from '../resume-builder/PDFPreviewCard';
import NotionPreviewCard from '../notion-editor/NotionPreviewCard';
import WhiteboardPreviewCard from '../whiteboard/WhiteboardPreviewCard';

export interface ContextDocument {
  id: string;
  type: 'resume' | 'note' | 'whiteboard' | 'pdf';
  documentId: string;
  title: string;
  textContent?: string;
}

interface ContextDocumentSelectorProps {
  selectedDocuments: ContextDocument[];
  onDocumentsChange: (documents: ContextDocument[]) => void;
  userId: string;
}

export default function ContextDocumentSelector({
  selectedDocuments,
  onDocumentsChange,
  userId,
}: ContextDocumentSelectorProps) {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'resume' | 'note' | 'whiteboard' | 'pdf'>('resume');
  const [isLoading, setIsLoading] = useState(false);

  // Available documents
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [notes, setNotes] = useState<NotionDocument[]>([]);
  const [whiteboards, setWhiteboards] = useState<WhiteboardDocument[]>([]);
  const [pdfs, setPdfs] = useState<ImportedDocument[]>([]);

  // Fetch all available documents
  const fetchAvailableDocuments = useCallback(async () => {
    if (!currentUser || !userId) return;

    setIsLoading(true);
    try {
      // Fetch Resumes
      const resumesRef = collection(db, 'users', userId, 'cvs');
      const resumesQuery = query(resumesRef, orderBy('updatedAt', 'desc'));
      const resumesSnapshot = await getDocs(resumesQuery);

      const resumesList: Resume[] = [];
      resumesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== 'default' && data.cvData) {
          resumesList.push({
            id: doc.id,
            name: data.name || 'Untitled Resume',
            cvData: data.cvData,
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
      const notesList = await getNotes(userId);
      setNotes(notesList);

      // Fetch Whiteboards
      const whiteboardsList = await getWhiteboards(userId);
      setWhiteboards(whiteboardsList);

      // Fetch PDF Documents
      const documentsRef = collection(db, 'users', userId, 'documents');
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
      setPdfs(documentsList);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, userId]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableDocuments();
    }
  }, [isOpen, fetchAvailableDocuments]);

  const handleToggleDocument = (type: 'resume' | 'note' | 'whiteboard' | 'pdf', documentId: string, title: string) => {
    // Check if already selected
    const existingDocIndex = selectedDocuments.findIndex(
      (doc) => doc.type === type && doc.documentId === documentId
    );

    if (existingDocIndex !== -1) {
      // Remove document (deselect)
      const updatedDocuments = selectedDocuments.filter((_, index) => index !== existingDocIndex);
      onDocumentsChange(updatedDocuments);
    } else {
      // Add document (select)
      const newDocument: ContextDocument = {
        id: `${type}-${documentId}-${Date.now()}`,
        type,
        documentId,
        title,
      };
      onDocumentsChange([...selectedDocuments, newDocument]);
    }
  };

  const handleRemoveDocument = (documentId: string) => {
    onDocumentsChange(selectedDocuments.filter((doc) => doc.id !== documentId));
  };

  const getFilteredDocuments = () => {
    const query = searchQuery.toLowerCase();
    let filtered: any[] = [];

    switch (activeTab) {
      case 'resume':
        filtered = resumes.filter((r) => r.name.toLowerCase().includes(query));
        break;
      case 'note':
        filtered = notes.filter((n) => n.title.toLowerCase().includes(query));
        break;
      case 'whiteboard':
        filtered = whiteboards.filter((w) => w.title.toLowerCase().includes(query));
        break;
      case 'pdf':
        filtered = pdfs.filter((p) => p.name.toLowerCase().includes(query));
        break;
    }

    return filtered;
  };

  const isDocumentSelected = (type: 'resume' | 'note' | 'whiteboard' | 'pdf', documentId: string) => {
    return selectedDocuments.some((doc) => doc.type === type && doc.documentId === documentId);
  };

  const getIcon = (type: 'resume' | 'note' | 'whiteboard' | 'pdf') => {
    switch (type) {
      case 'resume':
        return FileText;
      case 'note':
        return StickyNote;
      case 'whiteboard':
        return Layout;
      case 'pdf':
        return File;
    }
  };

  return (
    <div className="relative">
      {/* Selected Documents Display */}
      {selectedDocuments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedDocuments.map((doc) => {
            const Icon = getIcon(doc.type);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-jobzai-50 dark:bg-jobzai-950/30 ring-1 ring-jobzai-200/50 dark:ring-jobzai-800/30 text-xs"
              >
                <Icon className="w-3 h-3 text-jobzai-600 dark:text-jobzai-400" />
                <span className="text-jobzai-700 dark:text-jobzai-300 font-medium max-w-[120px] truncate">
                  {doc.title}
                </span>
                <button
                  onClick={() => handleRemoveDocument(doc.id)}
                  className="ml-0.5 p-0.5 hover:bg-jobzai-200/50 dark:hover:bg-jobzai-800/50 rounded transition-colors"
                >
                  <X className="w-3 h-3 text-jobzai-600 dark:text-jobzai-400" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 ring-1 ring-slate-200/60 dark:ring-slate-700/60 hover:ring-jobzai-300/50 dark:hover:ring-jobzai-600/30 transition-all text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        <Plus className="w-4 h-4" />
        <span>Add Context</span>
      </button>

      {/* Modal - Using Portal to render outside sidebar */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => setIsOpen(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-xl pointer-events-auto flex flex-col"
                >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200/60 dark:border-slate-800/60">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Add Documents to Context
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-6 pt-4 border-b border-slate-200/60 dark:border-slate-800/60">
                {[
                  { id: 'resume' as const, label: 'Resumes', icon: FileText },
                  { id: 'note' as const, label: 'Notes', icon: StickyNote },
                  { id: 'whiteboard' as const, label: 'Whiteboards', icon: Layout },
                  { id: 'pdf' as const, label: 'PDFs', icon: File },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all
                        ${
                          activeTab === tab.id
                            ? 'text-jobzai-600 dark:text-jobzai-400 bg-jobzai-50 dark:bg-jobzai-950/30 border-b-2 border-jobzai-500'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-jobzai-500/50 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Document Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-jobzai-500" />
                  </div>
                ) : (
                  <>
                    {getFilteredDocuments().length === 0 ? (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">No {activeTab}s found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {getFilteredDocuments().map((doc) => {
                          const isSelected = isDocumentSelected(activeTab, doc.id);
                          const title = doc.name || doc.title || 'Untitled';

                          return (
                            <motion.div
                              key={doc.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative group"
                            >
                              {/* Overlay for selection */}
                              {isSelected && (
                                <div className="absolute inset-0 z-10 bg-emerald-500/20 dark:bg-emerald-500/30 rounded-xl border-2 border-emerald-500 dark:border-emerald-400 pointer-events-none flex items-center justify-center">
                                  <div className="bg-emerald-500 dark:bg-emerald-400 rounded-full p-1.5 shadow-lg">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}
                              
                              {/* Card Component */}
                              <div
                                onClick={() => {
                                  handleToggleDocument(activeTab, doc.id, title);
                                }}
                                className={`
                                  cursor-pointer transition-all
                                  ${isSelected ? 'opacity-75' : 'hover:scale-105'}
                                `}
                              >
                                {activeTab === 'resume' && (
                                  <CVPreviewCard
                                    resume={doc as Resume}
                                    compact
                                    onDelete={() => {}}
                                    onRename={() => {}}
                                    onEdit={() => {}}
                                    onUpdateTags={() => {}}
                                  />
                                )}
                                {activeTab === 'note' && (
                                  <NotionPreviewCard
                                    note={doc as NotionDocument}
                                    compact
                                    onDelete={() => {}}
                                    onEdit={() => {}}
                                    onRename={() => {}}
                                    onUpdateCover={() => {}}
                                    onRemoveCover={() => {}}
                                  />
                                )}
                                {activeTab === 'whiteboard' && (
                                  <WhiteboardPreviewCard
                                    whiteboard={doc as WhiteboardDocument}
                                    compact
                                    onDelete={() => {}}
                                    onEdit={() => {}}
                                    onRename={() => {}}
                                  />
                                )}
                                {activeTab === 'pdf' && (
                                  <PDFPreviewCard
                                    document={doc as ImportedDocument}
                                    compact
                                    onDelete={() => {}}
                                    onView={() => {}}
                                  />
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
}


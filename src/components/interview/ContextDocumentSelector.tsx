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
import { notify } from '@/lib/notify';
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
      notify.error('Failed to load documents');
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
      {/* Selected Documents Display - Premium Notion Style */}
      {selectedDocuments.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {selectedDocuments.map((doc, index) => {
            const Icon = getIcon(doc.type);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ delay: index * 0.03, duration: 0.15 }}
                className="group flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50/80 dark:bg-white/[0.03] hover:bg-gray-100/80 dark:hover:bg-white/[0.05] transition-all duration-150 cursor-default"
              >
                {/* Icon container */}
                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-white dark:bg-gray-800/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none flex items-center justify-center ring-1 ring-gray-200/60 dark:ring-gray-700/40">
                  <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                </div>
                
                {/* Document title */}
                <span className="flex-1 text-[13px] text-gray-700 dark:text-gray-300 font-medium truncate tracking-[-0.01em]">
                  {doc.title}
                </span>
                
                {/* Remove button - appears on hover */}
                <button
                  onClick={() => handleRemoveDocument(doc.id)}
                  className="flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-200/80 dark:hover:bg-gray-700/50 transition-all duration-150"
                >
                  <X className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Button - Premium Minimal Style */}
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2 px-3 py-2 w-full rounded-lg text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-white/[0.03] transition-all duration-150"
      >
        <div className="flex-shrink-0 w-6 h-6 rounded-md border border-dashed border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500 flex items-center justify-center transition-colors duration-150">
          <Plus className="w-3.5 h-3.5" />
        </div>
        <span>Add document</span>
      </button>

      {/* Modal - Using Portal to render outside sidebar */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50"
                onClick={() => setIsOpen(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 10 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl max-h-[80vh] bg-white dark:bg-[#1C1C1E] rounded-xl shadow-2xl shadow-black/20 dark:shadow-black/50 pointer-events-auto flex flex-col overflow-hidden border border-gray-200/50 dark:border-gray-700/30"
                >
              {/* Header - Minimal */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800/60">
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-[-0.01em]">
                  Add to context
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 -mr-1 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-lg transition-colors duration-150"
                >
                  <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
              </div>

              {/* Tabs - Clean Notion Style */}
              <div className="relative flex items-center gap-1 px-5 border-b border-gray-100 dark:border-gray-800/60">
                {[
                  { id: 'resume' as const, label: 'Resumes', icon: FileText },
                  { id: 'note' as const, label: 'Notes', icon: StickyNote },
                  { id: 'whiteboard' as const, label: 'Whiteboards', icon: Layout },
                  { id: 'pdf' as const, label: 'PDFs', icon: File },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        relative flex items-center gap-2 px-3 py-3 text-[13px] font-medium transition-colors duration-150
                        ${isActive
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Search - Refined */}
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-black/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-300 dark:focus:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-150"
                  />
                </div>
              </div>

              {/* Document Grid - Clean Layout */}
              <div className="flex-1 overflow-y-auto p-5">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-gray-400" />
                    </div>
                    <span className="text-[13px] text-gray-500 dark:text-gray-400">Loading documents...</span>
                  </div>
                ) : (
                  <>
                    {getFilteredDocuments().length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800/40 flex items-center justify-center">
                          {activeTab === 'resume' && <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
                          {activeTab === 'note' && <StickyNote className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
                          {activeTab === 'whiteboard' && <Layout className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
                          {activeTab === 'pdf' && <File className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
                        </div>
                        <div className="text-center">
                          <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300">No {activeTab}s found</p>
                          <p className="text-[12px] text-gray-500 dark:text-gray-500 mt-0.5">Try a different search or create a new one</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {getFilteredDocuments().map((doc, index) => {
                          const isSelected = isDocumentSelected(activeTab, doc.id);
                          const title = doc.name || doc.title || 'Untitled';

                          return (
                            <motion.div
                              key={doc.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03, duration: 0.2 }}
                              className="relative group"
                            >
                              {/* Selection overlay - Refined */}
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute inset-0 z-10 rounded-xl ring-2 ring-gray-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-[#1C1C1E] pointer-events-none"
                                  >
                                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center shadow-lg">
                                      <Check className="w-3 h-3 text-white dark:text-gray-900" strokeWidth={3} />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              
                              {/* Card Component */}
                              <div
                                onClick={() => {
                                  handleToggleDocument(activeTab, doc.id, title);
                                }}
                                className="cursor-pointer transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
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
              
              {/* Footer with selection count */}
              {selectedDocuments.length > 0 && (
                <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-black/20 flex items-center justify-between">
                  <span className="text-[13px] text-gray-600 dark:text-gray-400">
                    {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-150"
                  >
                    Done
                  </button>
                </div>
              )}
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


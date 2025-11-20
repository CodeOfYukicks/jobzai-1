import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DocumentsLibrary, { NoteDocument } from './DocumentsLibrary';
import DocumentEditor from './DocumentEditor';

interface NotesDocumentManagerProps {
  documents: NoteDocument[];
  activeDocumentId: string | null;
  onDocumentsChange: (documents: NoteDocument[], activeDocumentId: string | null) => void;
}

export default function NotesDocumentManager({
  documents,
  activeDocumentId,
  onDocumentsChange,
}: NotesDocumentManagerProps) {
  const [localDocuments, setLocalDocuments] = useState<NoteDocument[]>(documents);
  const [localActiveId, setLocalActiveId] = useState<string | null>(activeDocumentId);
  const isInitialized = useRef(false);

  // Sync local state with props only on initial mount or when coming from external changes
  useEffect(() => {
    if (!isInitialized.current) {
      setLocalDocuments(documents);
      setLocalActiveId(activeDocumentId);
      isInitialized.current = true;
    }
  }, [documents, activeDocumentId]);

  // Notify parent of changes
  const notifyChange = useCallback((docs: NoteDocument[], activeId: string | null) => {
    onDocumentsChange(docs, activeId);
  }, [onDocumentsChange]);

  const createDocument = () => {
    const newDoc: NoteDocument = {
      id: uuidv4(),
      title: 'Untitled Document',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      preview: '',
    };
    const updatedDocs = [...localDocuments, newDoc];
    setLocalDocuments(updatedDocs);
    setLocalActiveId(newDoc.id);
    notifyChange(updatedDocs, newDoc.id);
  };

  const openDocument = (id: string) => {
    setLocalActiveId(id);
    notifyChange(localDocuments, id);
  };

  const goBackToLibrary = () => {
    setLocalActiveId(null);
    notifyChange(localDocuments, null);
  };

  const deleteDocument = (id: string) => {
    const updatedDocs = localDocuments.filter(d => d.id !== id);
    setLocalDocuments(updatedDocs);
    
    // If deleting the active document, go back to library
    if (localActiveId === id) {
      setLocalActiveId(null);
      notifyChange(updatedDocs, null);
    } else {
      notifyChange(updatedDocs, localActiveId);
    }
  };

  const updateDocumentTitle = (id: string, title: string) => {
    const updatedDocs = localDocuments.map(d =>
      d.id === id
        ? { ...d, title, updatedAt: Date.now() }
        : d
    );
    setLocalDocuments(updatedDocs);
    notifyChange(updatedDocs, localActiveId);
  };

  const updateDocumentContent = (id: string, content: string) => {
    // Extract preview from HTML
    const div = window.document.createElement('div');
    div.innerHTML = content;
    const text = div.textContent || div.innerText || '';
    const preview = text.substring(0, 100);

    const updatedDocs = localDocuments.map(d =>
      d.id === id
        ? { ...d, content, preview, updatedAt: Date.now() }
        : d
    );
    setLocalDocuments(updatedDocs);
    notifyChange(updatedDocs, localActiveId);
  };

  // Find active document
  const activeDocument = localActiveId
    ? localDocuments.find(d => d.id === localActiveId)
    : null;

  return (
    <div className="h-full">
      {!localActiveId || !activeDocument ? (
        // Show library view
        <DocumentsLibrary
          documents={localDocuments}
          onCreateDocument={createDocument}
          onOpenDocument={openDocument}
          onDeleteDocument={deleteDocument}
        />
      ) : (
        // Show editor view
        <DocumentEditor
          document={activeDocument}
          onBack={goBackToLibrary}
          onUpdateTitle={updateDocumentTitle}
          onUpdateContent={updateDocumentContent}
        />
      )}
    </div>
  );
}


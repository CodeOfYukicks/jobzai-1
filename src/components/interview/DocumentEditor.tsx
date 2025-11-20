import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import RichTextNotesEditor from './RichTextNotesEditor';

export interface NoteDocument {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  preview?: string;
}

interface DocumentEditorProps {
  document: NoteDocument;
  onBack: () => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateContent: (id: string, content: string) => void;
}

export default function DocumentEditor({
  document,
  onBack,
  onUpdateTitle,
  onUpdateContent,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update title when document changes
  useEffect(() => {
    setTitle(document.title);
  }, [document.id, document.title]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    const trimmedTitle = title.trim();
    if (trimmedTitle && trimmedTitle !== document.title) {
      onUpdateTitle(document.id, trimmedTitle);
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    } else if (!trimmedTitle) {
      setTitle(document.title); // Reset to original if empty
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setTitle(document.title);
      setIsEditingTitle(false);
    }
  };

  const handleContentChange = (content: string) => {
    onUpdateContent(document.id, content);
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000);
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'today';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="flex-shrink-0 border-b border-[#E6B84D] dark:border-[#B8903D] bg-[#FFCC66] dark:bg-[#D4A947]">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-[#8B7332] dark:text-[#5A4A1F] hover:text-[#6B5828] dark:hover:text-[#4A3A18] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Center: Editable Title */}
          <div className="flex-1 max-w-2xl mx-auto px-4">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="w-full text-lg font-semibold text-center text-gray-900 dark:text-gray-900 bg-transparent border-b-2 border-[#8B7332] focus:outline-none px-2 py-1"
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-lg font-semibold text-center text-gray-900 dark:text-gray-900 cursor-pointer hover:text-[#8B7332] dark:hover:text-[#6B5828] transition-colors px-2 py-1"
                title="Click to edit title"
              >
                {title}
              </h1>
            )}
          </div>

          {/* Right: Save Indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-800 min-w-[120px] justify-end">
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-700 dark:text-green-800" />
                <span>Saved {getTimeAgo(lastSaved)}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden">
        <RichTextNotesEditor
          content={document.content}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}


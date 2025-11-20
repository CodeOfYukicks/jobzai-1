import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import DOMPurify from 'dompurify';
import NotesToolbar from './NotesToolbar';
import NotesAIPopover from './NotesAIPopover';

interface RichTextNotesEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function RichTextNotesEditor({ content, onChange }: RichTextNotesEditorProps) {
  const [showAIPopover, setShowAIPopover] = React.useState(false);
  const [popoverPosition, setPopoverPosition] = React.useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = React.useState('');
  const [selectionTimeout, setSelectionTimeout] = React.useState<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-purple-600 dark:text-purple-400 underline hover:text-purple-700 dark:hover:text-purple-300',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing your notes here...\n\n• Key points to remember\n• Questions to ask\n• Personal reflections\n• Action items',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Sanitize HTML before saving
      const sanitized = DOMPurify.sanitize(html);
      onChange(sanitized);
    },
    onSelectionUpdate: ({ editor }) => {
      // Clear any existing timeout
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }

      // Wait for selection to stabilize (after mouseup)
      const timeout = setTimeout(() => {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, ' ');
        
        // Only show if text is selected and has minimum length
        if (text.trim().length > 5) {
          setSelectedText(text);
          
          // Get selection coordinates
          const { view } = editor;
          const start = view.coordsAtPos(from);
          const end = view.coordsAtPos(to);
          
          // Position popover above selection
          setPopoverPosition({
            x: (start.left + end.right) / 2,
            y: start.top - 10,
          });
          
          setShowAIPopover(true);
        } else {
          setShowAIPopover(false);
          setSelectedText('');
        }
      }, 150); // Delay ensures user finished selecting
      
      setSelectionTimeout(timeout);
    },
  });

  // Update editor content when prop changes (e.g., on initial load from Firebase)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  const handleAIRewrite = (rewrittenText: string) => {
    if (!editor) return;
    
    // Replace selected text with AI-rewritten version
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContent(rewrittenText).run();
    
    setShowAIPopover(false);
    setSelectedText('');
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Toolbar */}
      <NotesToolbar editor={editor} />
      
      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <EditorContent editor={editor} />
      </div>
      
      {/* AI Popover */}
      {showAIPopover && selectedText && (
        <NotesAIPopover
          position={popoverPosition}
          selectedText={selectedText}
          onClose={() => {
            setShowAIPopover(false);
            setSelectedText('');
          }}
          onRewrite={handleAIRewrite}
        />
      )}
      
      {/* Custom Styles */}
      <style>{`
        .ProseMirror {
          outline: none;
          color: #374151;
          line-height: 1.7;
        }
        
        .dark .ProseMirror {
          color: #e5e7eb;
        }
        
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          white-space: pre-wrap;
        }
        
        .dark .ProseMirror p.is-editor-empty:first-child::before {
          color: #6b7280;
        }
        
        .ProseMirror p {
          margin: 0.5rem 0;
        }
        
        .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #111827;
          line-height: 1.3;
        }
        
        .dark .ProseMirror h1 {
          color: #f9fafb;
        }
        
        .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.625rem;
          color: #1f2937;
          line-height: 1.4;
        }
        
        .dark .ProseMirror h2 {
          color: #f3f4f6;
        }
        
        .ProseMirror h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #374151;
          line-height: 1.5;
        }
        
        .dark .ProseMirror h3 {
          color: #e5e7eb;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.75rem;
          margin: 0.75rem 0;
        }
        
        .ProseMirror ul li,
        .ProseMirror ol li {
          margin: 0.375rem 0;
          color: #374151;
        }
        
        .dark .ProseMirror ul li,
        .dark .ProseMirror ol li {
          color: #d1d5db;
        }
        
        .ProseMirror ul {
          list-style-type: disc;
        }
        
        .ProseMirror ol {
          list-style-type: decimal;
        }
        
        .ProseMirror strong {
          font-weight: 600;
          color: #111827;
        }
        
        .dark .ProseMirror strong {
          color: #f9fafb;
        }
        
        .ProseMirror em {
          font-style: italic;
          color: #4b5563;
        }
        
        .dark .ProseMirror em {
          color: #d1d5db;
        }
        
        .ProseMirror u {
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        .ProseMirror code {
          background-color: #f3f4f6;
          color: #be185d;
          padding: 0.15rem 0.35rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
        }
        
        .dark .ProseMirror code {
          background-color: #374151;
          color: #f9a8d4;
        }
        
        .ProseMirror a {
          color: #9333ea;
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
        }
        
        .dark .ProseMirror a {
          color: #c084fc;
        }
        
        .ProseMirror a:hover {
          color: #7e22ce;
        }
        
        .dark .ProseMirror a:hover {
          color: #a855f7;
        }
        
        /* Selection style */
        .ProseMirror ::selection {
          background-color: rgba(147, 51, 234, 0.2);
        }
        
        .dark .ProseMirror ::selection {
          background-color: rgba(192, 132, 252, 0.3);
        }
      `}</style>
    </div>
  );
}


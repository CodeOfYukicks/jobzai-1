import { useEditor, EditorContent } from '@tiptap/react';
import { useState, useEffect, useCallback } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Type,
} from 'lucide-react';

import BubbleMenuBar from './menus/BubbleMenuBar';

import './notion-editor.css';

export interface NotionEditorProps {
  content?: any;
  onChange?: (content: any) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  autofocus?: boolean;
}

interface SlashMenuItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: () => void;
}

const NotionEditor = ({
  content,
  onChange,
  placeholder = "Type '/' for commands...",
  editable = true,
  className = '',
  autofocus = false,
}: NotionEditorProps) => {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashQuery, setSlashQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`;
          }
          return placeholder;
        },
        emptyEditorClass: 'is-editor-empty',
        emptyNodeClass: 'is-empty',
      }),
    ],
    content: content || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    },
    editable,
    autofocus: autofocus ? 'end' : false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
      
      // Check for slash command
      const { selection } = editor.state;
      const { $anchor } = selection;
      const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset);
      
      const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/);
      
      if (slashMatch) {
        const coords = editor.view.coordsAtPos(selection.from);
        setSlashMenuPosition({ top: coords.bottom + 5, left: coords.left });
        setSlashQuery(slashMatch[1].toLowerCase());
        setShowSlashMenu(true);
        setSelectedIndex(0);
      } else {
        setShowSlashMenu(false);
        setSlashQuery('');
      }
    },
    editorProps: {
      attributes: {
        class: `notion-editor-content prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[200px] ${className}`.trim(),
      },
      handleKeyDown: (view, event) => {
        if (!showSlashMenu) return false;
        
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
          return true;
        }
        
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          return true;
        }
        
        if (event.key === 'Enter') {
          event.preventDefault();
          if (filteredItems[selectedIndex]) {
            executeCommand(filteredItems[selectedIndex]);
          }
          return true;
        }
        
        if (event.key === 'Escape') {
          setShowSlashMenu(false);
          return true;
        }
        
        return false;
      },
    },
  });

  const slashMenuItems: SlashMenuItem[] = editor ? [
    {
      title: 'Text',
      description: 'Just start typing with plain text',
      icon: <Type className="w-5 h-5" />,
      command: () => editor.chain().focus().setParagraph().run(),
    },
    {
      title: 'Heading 1',
      description: 'Large section heading',
      icon: <Heading1 className="w-5 h-5" />,
      command: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: <Heading2 className="w-5 h-5" />,
      command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: <Heading3 className="w-5 h-5" />,
      command: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bullet list',
      icon: <List className="w-5 h-5" />,
      command: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      title: 'Numbered List',
      description: 'Create a numbered list',
      icon: <ListOrdered className="w-5 h-5" />,
      command: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      title: 'Quote',
      description: 'Capture a quote',
      icon: <Quote className="w-5 h-5" />,
      command: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: 'Code Block',
      description: 'Capture a code snippet',
      icon: <Code className="w-5 h-5" />,
      command: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: 'Divider',
      description: 'Visually divide sections',
      icon: <Minus className="w-5 h-5" />,
      command: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ] : [];

  const filteredItems = slashMenuItems.filter(
    item =>
      item.title.toLowerCase().includes(slashQuery) ||
      item.description.toLowerCase().includes(slashQuery)
  );

  const executeCommand = useCallback((item: SlashMenuItem) => {
    if (!editor) return;
    
    // Delete the slash and query
    const { selection } = editor.state;
    const { $anchor } = selection;
    const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset);
    const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/);
    
    if (slashMatch) {
      const from = selection.from - slashMatch[0].length;
      const to = selection.from;
      editor.chain().focus().deleteRange({ from, to }).run();
    }
    
    // Execute the command
    item.command();
    setShowSlashMenu(false);
  }, [editor]);

  // Sync content when prop changes (important for note isolation)
  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getJSON();
      // Only update if content is actually different to avoid cursor jumping
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => setShowSlashMenu(false);
    if (showSlashMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showSlashMenu]);

  if (!editor) {
    return null;
  }

  return (
    <div className="notion-editor relative">
      <BubbleMenuBar editor={editor} />
      <EditorContent editor={editor} />
      
      {/* Slash Command Menu */}
      {showSlashMenu && filteredItems.length > 0 && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[300px] max-h-[400px] overflow-y-auto"
          style={{
            top: `${slashMenuPosition.top}px`,
            left: `${slashMenuPosition.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-1.5">
            <div className="px-3 py-2">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                Basic blocks
              </span>
            </div>
            <div className="space-y-0.5">
              {filteredItems.map((item, index) => (
                <button
                  key={item.title}
                  onClick={() => executeCommand(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                    ${index === selectedIndex
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg 
                      ${index === selectedIndex
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotionEditor;
export { NotionEditor };

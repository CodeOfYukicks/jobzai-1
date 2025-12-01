import { useEditor, EditorContent } from '@tiptap/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
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
import MentionEmbed, { MentionEmbedData } from './extensions/MentionEmbed';
import MentionMenu from './MentionMenu';
import MentionDetailModal from './MentionDetailModal';
import { MentionSearchResult, searchResultToEmbedData } from '../../lib/mentionSearchService';

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
  placeholder = "Type '/' for commands or '@' to mention...",
  editable = true,
  className = '',
  autofocus = false,
}: NotionEditorProps) => {
  // Slash menu state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashSelectionPos, setSlashSelectionPos] = useState<number | null>(null);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  // Mention menu state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionMenuPosition, setMentionMenuPosition] = useState({ top: 0, left: 0 });
  const [mentionSelectionPos, setMentionSelectionPos] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailModalData, setDetailModalData] = useState<MentionEmbedData | null>(null);

  // Ref for tracking active menu for keyboard handling
  const activeMenuRef = useRef<'slash' | 'mention' | null>(null);

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
      MentionEmbed,
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
      
      const { selection } = editor.state;
      const { $anchor } = selection;
      const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset);
      
      // Check for slash command
      const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/);
      // Check for @ mention (but not after other text on the same word)
      const mentionMatch = textBefore.match(/@([a-zA-Z0-9\s]*)$/);
      
      if (slashMatch) {
        const coords = editor.view.coordsAtPos(selection.from);
        setSlashMenuPosition({ top: coords.bottom + 5, left: coords.left });
        setSlashSelectionPos(selection.from); // Store position for scroll updates
        setSlashQuery(slashMatch[1].toLowerCase());
        setShowSlashMenu(true);
        setSlashSelectedIndex(0);
        setShowMentionMenu(false);
        activeMenuRef.current = 'slash';
      } else if (mentionMatch) {
        const coords = editor.view.coordsAtPos(selection.from);
        setMentionMenuPosition({ top: coords.bottom + 5, left: coords.left });
        setMentionSelectionPos(selection.from); // Store position for scroll updates
        setMentionQuery(mentionMatch[1].trim());
        setShowMentionMenu(true);
        setMentionSelectedIndex(0);
        setShowSlashMenu(false);
        activeMenuRef.current = 'mention';
      } else {
        setShowSlashMenu(false);
        setSlashQuery('');
        setSlashSelectionPos(null);
        setShowMentionMenu(false);
        setMentionQuery('');
        setMentionSelectionPos(null);
        activeMenuRef.current = null;
      }
    },
    editorProps: {
      attributes: {
        class: `notion-editor-content prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[200px] ${className}`.trim(),
      },
      handleKeyDown: (view, event) => {
        // Handle slash menu keyboard navigation
        if (showSlashMenu && activeMenuRef.current === 'slash') {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSlashSelectedIndex(prev => Math.min(prev + 1, filteredSlashItems.length - 1));
            return true;
          }
          
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSlashSelectedIndex(prev => Math.max(prev - 1, 0));
            return true;
          }
          
          if (event.key === 'Enter') {
            event.preventDefault();
            if (filteredSlashItems[slashSelectedIndex]) {
              executeSlashCommand(filteredSlashItems[slashSelectedIndex]);
            }
            return true;
          }
          
          if (event.key === 'Escape') {
            setShowSlashMenu(false);
            activeMenuRef.current = null;
            return true;
          }
        }

        // Handle mention menu keyboard navigation
        if (showMentionMenu && activeMenuRef.current === 'mention') {
          if (event.key === 'Escape') {
            setShowMentionMenu(false);
            activeMenuRef.current = null;
            return true;
          }
          // Arrow keys and Enter are handled within MentionMenu component
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

  const filteredSlashItems = slashMenuItems.filter(
    item =>
      item.title.toLowerCase().includes(slashQuery) ||
      item.description.toLowerCase().includes(slashQuery)
  );

  const executeSlashCommand = useCallback((item: SlashMenuItem) => {
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
    activeMenuRef.current = null;
  }, [editor]);

  // Handle mention selection
  const handleMentionSelect = useCallback((result: MentionSearchResult) => {
    if (!editor) return;

    // Delete the @ and query
    const { selection } = editor.state;
    const { $anchor } = selection;
    const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset);
    const mentionMatch = textBefore.match(/@([a-zA-Z0-9\s]*)$/);
    
    if (mentionMatch) {
      const from = selection.from - mentionMatch[0].length;
      const to = selection.from;
      editor.chain().focus().deleteRange({ from, to }).run();
    }

    // Insert the mention embed node
    const embedData = searchResultToEmbedData(result);
    editor.chain().focus().insertContent({
      type: 'mentionEmbed',
      attrs: embedData,
    }).run();

    // CRITICAL: Trigger onChange immediately after inserting mention embed
    // This ensures the content with the mention embed is saved
    setTimeout(() => {
      if (editor) {
        const jsonContent = editor.getJSON();
        onChange?.(jsonContent);
      }
    }, 100);

    setShowMentionMenu(false);
    activeMenuRef.current = null;
  }, [editor, onChange]);

  // Handle mention menu close
  const handleMentionMenuClose = useCallback(() => {
    setShowMentionMenu(false);
    activeMenuRef.current = null;
    editor?.chain().focus().run();
  }, [editor]);

  // Listen for mention embed click events (from the embedded cards)
  useEffect(() => {
    const handleMentionClick = (event: CustomEvent<{ type: string; id: string; data: MentionEmbedData }>) => {
      setDetailModalData(event.detail.data);
      setShowDetailModal(true);
    };

    window.addEventListener('mention-embed-click' as any, handleMentionClick);
    return () => window.removeEventListener('mention-embed-click' as any, handleMentionClick);
  }, []);

  // Track if initial content has been set
  const hasInitialContentRef = useRef(false);

  // Only sync content on initial load, not on every change
  // The editor is the source of truth after initial load
  // Note: key={noteId} on the component handles note switching by remounting
  useEffect(() => {
    if (editor && content && !hasInitialContentRef.current) {
      // Only set content on initial mount
      editor.commands.setContent(content);
      hasInitialContentRef.current = true;
    }
  }, [editor, content]);

  // Reset the flag when editor changes (new mount)
  useEffect(() => {
    hasInitialContentRef.current = false;
  }, [editor]);

  // Update slash menu position on scroll to keep it visible
  useEffect(() => {
    if (!showSlashMenu || !editor || slashSelectionPos === null) return;

    const updatePosition = () => {
      try {
        const coords = editor.view.coordsAtPos(slashSelectionPos);
        const viewportHeight = window.innerHeight;
        const menuHeight = 400; // Approximate menu height
        const spaceBelow = viewportHeight - coords.bottom;
        const spaceAbove = coords.top;
        
        // Determine if we should show above or below
        const shouldShowAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;
        
        if (shouldShowAbove) {
          setSlashMenuPosition({
            top: coords.top - menuHeight - 5,
            left: Math.max(10, Math.min(coords.left, window.innerWidth - 320)),
          });
        } else {
          setSlashMenuPosition({
            top: coords.bottom + 5,
            left: Math.max(10, Math.min(coords.left, window.innerWidth - 320)),
          });
        }
      } catch (e) {
        // Position might be invalid if content changed
        console.warn('Could not update slash menu position:', e);
      }
    };

    // Initial position
    updatePosition();

    // Update on scroll
    const handleScroll = () => {
      updatePosition();
    };

    // Update on window resize
    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    editor.view.dom.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      editor.view.dom.removeEventListener('scroll', handleScroll, true);
    };
  }, [showSlashMenu, editor, slashSelectionPos]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setShowSlashMenu(false);
      // Note: MentionMenu handles its own click outside
    };
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
      
      {/* Slash Command Menu - Using Portal for better positioning */}
      {showSlashMenu && filteredSlashItems.length > 0 && typeof window !== 'undefined' && document?.body && createPortal(
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[9999] bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden min-w-[300px] max-w-[320px] max-h-[400px] overflow-y-auto"
          style={{
            top: `${Math.max(10, Math.min(slashMenuPosition.top, window.innerHeight - 410))}px`,
            left: `${slashMenuPosition.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2">
            <div className="px-3 py-2 mb-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Basic blocks
              </span>
            </div>
            <div className="space-y-1">
              {filteredSlashItems.map((item, index) => (
                <button
                  key={item.title}
                  onClick={() => executeSlashCommand(item)}
                  onMouseEnter={() => setSlashSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150
                    ${index === slashSelectedIndex
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 transition-colors
                      ${index === slashSelectedIndex
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate
                      ${index === slashSelectedIndex
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-800 dark:text-gray-200'
                      }`}>
                      {item.title}
                    </p>
                    <p className={`text-xs truncate mt-0.5
                      ${index === slashSelectedIndex
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-gray-500 dark:text-gray-500'
                      }`}>
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>,
        document.body
      )}

      {/* Mention Menu */}
      <MentionMenu
        isOpen={showMentionMenu}
        position={mentionMenuPosition}
        query={mentionQuery}
        onSelect={handleMentionSelect}
        onClose={handleMentionMenuClose}
        selectedIndex={mentionSelectedIndex}
        onSelectedIndexChange={setMentionSelectedIndex}
        editorView={editor.view}
        selectionPos={mentionSelectionPos}
      />

      {/* Detail Modal */}
      <MentionDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        data={detailModalData}
      />
    </div>
  );
};

export default NotionEditor;
export { NotionEditor };

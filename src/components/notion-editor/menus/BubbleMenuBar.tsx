import { useEffect, useState, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Link, 
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface BubbleMenuBarProps {
  editor: Editor;
}

const BubbleMenuBar = ({ editor }: BubbleMenuBarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const { selection } = editor.state;
    const { from, to, empty } = selection;

    if (empty) {
      setIsVisible(false);
      return;
    }

    // Get the coordinates of the selection
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);

    // Calculate the center position
    const left = (start.left + end.left) / 2;
    const top = start.top - 50; // Position above the selection

    setPosition({ top, left });
    setIsVisible(true);
  }, [editor]);

  useEffect(() => {
    const handleSelectionChange = () => {
      updatePosition();
    };

    editor.on('selectionUpdate', handleSelectionChange);
    editor.on('transaction', handleSelectionChange);

    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
      editor.off('transaction', handleSelectionChange);
    };
  }, [editor, updatePosition]);

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor]);

  const toggleLink = useCallback(() => {
    if (editor.isActive('link')) {
      removeLink();
    } else {
      const previousUrl = editor.getAttributes('link').href;
      setLinkUrl(previousUrl || '');
      setShowLinkInput(true);
    }
  }, [editor, removeLink]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 transition-opacity duration-150"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-0.5 p-1 bg-white dark:bg-gray-900 rounded-xl 
        shadow-2xl border border-gray-200 dark:border-gray-700">
        {showLinkInput ? (
          <div className="flex items-center gap-2 px-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setLink();
                }
                if (e.key === 'Escape') {
                  setShowLinkInput(false);
                  setLinkUrl('');
                }
              }}
              placeholder="Enter URL..."
              autoFocus
              className="w-48 px-2 py-1 text-sm bg-transparent border-none outline-none 
                text-gray-900 dark:text-white placeholder-gray-400"
            />
            <button
              onClick={setLink}
              className="px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded 
                hover:bg-purple-700 transition-colors"
            >
              Apply
            </button>
            {editor.isActive('link') && (
              <button
                onClick={removeLink}
                className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 
                  transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        ) : (
          <>
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              icon={<Bold className="w-4 h-4" />}
              tooltip="Bold"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              icon={<Italic className="w-4 h-4" />}
              tooltip="Italic"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              icon={<Underline className="w-4 h-4" />}
              tooltip="Underline"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              icon={<Strikethrough className="w-4 h-4" />}
              tooltip="Strikethrough"
            />
            
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
            
            <MenuButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              icon={<Code className="w-4 h-4" />}
              tooltip="Inline Code"
            />
            <MenuButton
              onClick={toggleLink}
              isActive={editor.isActive('link')}
              icon={<Link className="w-4 h-4" />}
              tooltip="Link"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              icon={<Highlighter className="w-4 h-4" />}
              tooltip="Highlight"
            />

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              icon={<AlignLeft className="w-4 h-4" />}
              tooltip="Align Left"
            />
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              icon={<AlignCenter className="w-4 h-4" />}
              tooltip="Align Center"
            />
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              icon={<AlignRight className="w-4 h-4" />}
              tooltip="Align Right"
            />
          </>
        )}
      </div>
    </div>
  );
};

interface MenuButtonProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  tooltip: string;
}

const MenuButton = ({ onClick, isActive, icon, tooltip }: MenuButtonProps) => (
  <button
    onClick={onClick}
    title={tooltip}
    className={`p-2 rounded-lg transition-colors
      ${isActive 
        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
  >
    {icon}
  </button>
);

export default BubbleMenuBar;

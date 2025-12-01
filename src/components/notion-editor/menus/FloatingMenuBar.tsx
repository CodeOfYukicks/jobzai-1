import { useEffect, useState, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Plus,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Table,
  Minus,
  Image,
} from 'lucide-react';

interface FloatingMenuBarProps {
  editor: Editor;
}

const FloatingMenuBar = ({ editor }: FloatingMenuBarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateVisibility = useCallback(() => {
    const { selection } = editor.state;
    const { $anchor, empty } = selection;

    // Only show on empty paragraphs
    if (!empty) {
      setIsVisible(false);
      return;
    }

    const isEmptyParagraph =
      $anchor.parent.type.name === 'paragraph' &&
      $anchor.parent.content.size === 0;

    if (!isEmptyParagraph) {
      setIsVisible(false);
      return;
    }

    // Get the position of the cursor
    const coords = editor.view.coordsAtPos(selection.from);
    
    setPosition({
      top: coords.top,
      left: coords.left - 40, // Position to the left of the cursor
    });
    setIsVisible(true);
  }, [editor]);

  useEffect(() => {
    const handleUpdate = () => {
      updateVisibility();
    };

    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);
    editor.on('focus', handleUpdate);

    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
      editor.off('focus', handleUpdate);
    };
  }, [editor, updateVisibility]);

  const menuItems = [
    {
      icon: <Heading1 className="w-4 h-4" />,
      label: 'Heading 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      icon: <Heading2 className="w-4 h-4" />,
      label: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: <Heading3 className="w-4 h-4" />,
      label: 'Heading 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      icon: <List className="w-4 h-4" />,
      label: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: <ListOrdered className="w-4 h-4" />,
      label: 'Numbered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: <CheckSquare className="w-4 h-4" />,
      label: 'Task List',
      action: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      icon: <Quote className="w-4 h-4" />,
      label: 'Quote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      icon: <Code className="w-4 h-4" />,
      label: 'Code Block',
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      icon: <Table className="w-4 h-4" />,
      label: 'Table',
      action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      icon: <Minus className="w-4 h-4" />,
      label: 'Divider',
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      icon: <Image className="w-4 h-4" />,
      label: 'Image',
      action: () => {
        const url = window.prompt('Enter image URL');
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      },
    },
  ];

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Plus button trigger */}
      <button
        className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all
          ${isExpanded 
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Expanded menu */}
      {isExpanded && (
        <div className="absolute left-0 top-0 ml-9 bg-white dark:bg-gray-900 rounded-xl 
          shadow-2xl border border-gray-200 dark:border-gray-700 p-1.5 min-w-[200px]">
          <div className="grid grid-cols-3 gap-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.action();
                  setIsExpanded(false);
                }}
                title={item.label}
                className="flex items-center justify-center p-2 rounded-lg
                  text-gray-600 dark:text-gray-400 
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  hover:text-purple-600 dark:hover:text-purple-400
                  transition-colors"
              >
                {item.icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingMenuBar;

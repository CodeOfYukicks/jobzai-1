import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Editor, Range } from '@tiptap/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  ChevronRight,
  Quote,
  AlertCircle,
  Minus,
  Code,
  Table,
  Image,
  Columns,
} from 'lucide-react';

export interface CommandItem {
  title: string;
  description: string;
  icon: string;
  command: (props: { editor: Editor; range: Range }) => void;
}

interface SlashCommandMenuProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
  editor: Editor;
  range: Range;
}

const iconMap: Record<string, React.ReactNode> = {
  text: <Type className="w-5 h-5" />,
  heading1: <Heading1 className="w-5 h-5" />,
  heading2: <Heading2 className="w-5 h-5" />,
  heading3: <Heading3 className="w-5 h-5" />,
  bulletList: <List className="w-5 h-5" />,
  numberedList: <ListOrdered className="w-5 h-5" />,
  taskList: <CheckSquare className="w-5 h-5" />,
  toggle: <ChevronRight className="w-5 h-5" />,
  quote: <Quote className="w-5 h-5" />,
  callout: <AlertCircle className="w-5 h-5" />,
  divider: <Minus className="w-5 h-5" />,
  code: <Code className="w-5 h-5" />,
  table: <Table className="w-5 h-5" />,
  image: <Image className="w-5 h-5" />,
  columns: <Columns className="w-5 h-5" />,
};

const SlashCommandMenu = forwardRef<any, SlashCommandMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) {
          command(item);
        }
      },
      [command, items]
    );

    const upHandler = useCallback(() => {
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    }, [items.length]);

    const downHandler = useCallback(() => {
      setSelectedIndex((prev) => (prev + 1) % items.length);
    }, [items.length]);

    const enterHandler = useCallback(() => {
      selectItem(selectedIndex);
    }, [selectItem, selectedIndex]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          upHandler();
          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();
          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-[280px]">
          <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 
          overflow-hidden min-w-[300px] max-h-[400px] overflow-y-auto"
      >
        <div className="p-1.5">
          <div className="px-3 py-2">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Basic blocks
            </span>
          </div>
          <div className="space-y-0.5">
            {items.map((item, index) => (
              <button
                key={item.title}
                onClick={() => selectItem(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                  ${
                    index === selectedIndex
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg 
                    ${
                      index === selectedIndex
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                >
                  {iconMap[item.icon] || <Type className="w-5 h-5" />}
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
      </motion.div>
    );
  }
);

SlashCommandMenu.displayName = 'SlashCommandMenu';

export default SlashCommandMenu;





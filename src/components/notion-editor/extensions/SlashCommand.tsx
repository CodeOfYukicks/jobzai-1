import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import SlashCommandMenu, { CommandItem } from '../menus/SlashCommandMenu';

// Command items for the slash menu
export const slashCommandItems: CommandItem[] = [
  {
    title: 'Text',
    description: 'Just start typing with plain text',
    icon: 'text',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'heading1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: 'heading2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: 'heading3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: 'bulletList',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: 'numberedList',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Task List',
    description: 'Track tasks with a to-do list',
    icon: 'taskList',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Toggle',
    description: 'Collapsible content block',
    icon: 'toggle',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setToggle().run();
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote',
    icon: 'quote',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Callout',
    description: 'Highlight important information',
    icon: 'callout',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout({ type: 'info' }).run();
    },
  },
  {
    title: 'Divider',
    description: 'Visually divide sections',
    icon: 'divider',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Capture a code snippet',
    icon: 'code',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Table',
    description: 'Add a table',
    icon: 'table',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    title: 'Image',
    description: 'Upload or embed an image',
    icon: 'image',
    command: ({ editor, range }) => {
      const url = window.prompt('Enter image URL');
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      }
    },
  },
  {
    title: 'Columns',
    description: 'Create a 2-column layout',
    icon: 'columns',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setColumns({ count: 2 }).run();
    },
  },
];

// Suggestion configuration
const suggestionConfig: Omit<SuggestionOptions<CommandItem>, 'editor'> = {
  char: '/',
  items: ({ query }) => {
    return slashCommandItems.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );
  },
  render: () => {
    let component: ReactRenderer<any> | null = null;
    let popup: TippyInstance[] | null = null;

    return {
      onStart: (props: SuggestionProps<CommandItem>) => {
        component = new ReactRenderer(SlashCommandMenu, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          animation: 'shift-away',
          theme: 'notion-slash',
        });
      },
      onUpdate: (props: SuggestionProps<CommandItem>) => {
        component?.updateProps(props);

        if (!props.clientRect) return;

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        });
      },
      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide();
          return true;
        }

        return (component?.ref as any)?.onKeyDown?.(props) ?? false;
      },
      onExit: () => {
        popup?.[0]?.destroy();
        component?.destroy();
      },
    };
  },
};

// SlashCommand Extension
const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: suggestionConfig,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default SlashCommand;


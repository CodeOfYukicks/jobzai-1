import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

// React component for Toggle node view
const ToggleComponent = ({ node, updateAttributes }: any) => {
  const [isOpen, setIsOpen] = useState(node.attrs.isOpen);

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    updateAttributes({ isOpen: newState });
  };

  return (
    <NodeViewWrapper className="toggle-block my-2">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={toggleOpen}
          contentEditable={false}
          className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 
            hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        >
          <span className="text-gray-400 dark:text-gray-500 transition-transform duration-200">
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
          <div
            className="toggle-summary flex-1 font-medium text-gray-900 dark:text-white"
            data-placeholder="Toggle title..."
          >
            <NodeViewContent className="toggle-title inline" />
          </div>
        </button>
        {isOpen && (
          <div className="toggle-content px-4 py-3 pl-9 bg-white dark:bg-gray-900">
            <NodeViewContent className="toggle-body" />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// Toggle Extension
const Toggle = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      isOpen: {
        default: true,
        parseHTML: (element) => element.getAttribute('data-open') === 'true',
        renderHTML: (attributes) => ({
          'data-open': attributes.isOpen,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="toggle"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleComponent);
  },

  addCommands() {
    return {
      setToggle:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [{ type: 'text', text: 'Toggle' }],
          });
        },
    };
  },
});

export default Toggle;






import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';

// Column Component (single column)
const ColumnComponent = () => {
  return (
    <NodeViewWrapper className="column flex-1 min-w-0">
      <div className="p-3 min-h-[100px] border border-dashed border-gray-200 dark:border-gray-700 
        rounded-lg focus-within:border-purple-400 dark:focus-within:border-purple-500 transition-colors">
        <NodeViewContent className="column-content" />
      </div>
    </NodeViewWrapper>
  );
};

// Columns Container Component
const ColumnsComponent = ({ node }: any) => {
  const columnCount = node.attrs.count || 2;
  
  return (
    <NodeViewWrapper className="columns-block my-4">
      <div 
        className="flex gap-4"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          gap: '1rem'
        }}
      >
        <NodeViewContent className="columns-content contents" />
      </div>
    </NodeViewWrapper>
  );
};

// Column Node
const Column = Node.create({
  name: 'column',
  group: 'block',
  content: 'block+',
  isolating: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnComponent);
  },
});

// Columns Container Node
const Columns = Node.create({
  name: 'columns',
  group: 'block',
  content: 'column+',
  isolating: true,

  addAttributes() {
    return {
      count: {
        default: 2,
        parseHTML: (element) => parseInt(element.getAttribute('data-count') || '2', 10),
        renderHTML: (attributes) => ({
          'data-count': attributes.count,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="columns"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'columns' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnsComponent);
  },

  addCommands() {
    return {
      setColumns:
        (attributes?: { count?: number }) =>
        ({ commands }) => {
          const count = attributes?.count || 2;
          const columns = Array.from({ length: count }, () => ({
            type: 'column',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '' }],
              },
            ],
          }));

          return commands.insertContent({
            type: this.name,
            attrs: { count },
            content: columns,
          });
        },
    };
  },
});

export { Columns, Column };
export default Columns;











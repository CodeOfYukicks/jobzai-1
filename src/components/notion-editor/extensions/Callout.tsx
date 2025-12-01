import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { AlertCircle, Info, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

type CalloutType = 'info' | 'warning' | 'success' | 'error' | 'tip';

const calloutConfig: Record<CalloutType, { icon: React.ReactNode; bg: string; border: string; iconColor: string }> = {
  info: {
    icon: <Info className="w-5 h-5" />,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  success: {
    icon: <CheckCircle className="w-5 h-5" />,
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
  },
  error: {
    icon: <AlertCircle className="w-5 h-5" />,
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  tip: {
    icon: <Lightbulb className="w-5 h-5" />,
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-500 dark:text-purple-400',
  },
};

// React component for Callout node view
const CalloutComponent = ({ node, updateAttributes }: any) => {
  const type = (node.attrs.type as CalloutType) || 'info';
  const config = calloutConfig[type];

  const cycleType = () => {
    const types: CalloutType[] = ['info', 'warning', 'success', 'error', 'tip'];
    const currentIndex = types.indexOf(type);
    const nextIndex = (currentIndex + 1) % types.length;
    updateAttributes({ type: types[nextIndex] });
  };

  return (
    <NodeViewWrapper className="callout-block my-3">
      <div className={`flex items-start gap-3 p-4 rounded-lg border ${config.bg} ${config.border}`}>
        <button
          onClick={cycleType}
          contentEditable={false}
          className={`flex-shrink-0 mt-0.5 cursor-pointer hover:scale-110 transition-transform ${config.iconColor}`}
          title="Click to change callout type"
        >
          {config.icon}
        </button>
        <div className="flex-1 min-w-0">
          <NodeViewContent className="callout-content text-gray-900 dark:text-white" />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

// Callout Extension
const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-callout-type') || 'info',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },

  addCommands() {
    return {
      setCallout:
        (attributes?: { type?: CalloutType }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { type: attributes?.type || 'info' },
            content: [{ type: 'text', text: 'Type your callout text here...' }],
          });
        },
    };
  },
});

export default Callout;


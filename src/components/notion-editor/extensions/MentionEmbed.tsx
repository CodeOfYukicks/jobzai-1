import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { X } from 'lucide-react';
import { 
  MentionCardJobApplication, 
  MentionCardResume, 
  MentionCardCVAnalysis, 
  MentionCardInterview 
} from '../mention-cards';

// Types for mention embeds
export type MentionEmbedType = 'job-application' | 'resume' | 'cv-analysis' | 'interview';

export interface MentionEmbedData {
  type: MentionEmbedType;
  id: string;
  // Snapshot data for display (stored at insert time)
  title: string;
  subtitle?: string;
  status?: string;
  score?: number;
  date?: string;
  extra?: Record<string, any>;
}

interface MentionEmbedComponentProps {
  node: {
    attrs: MentionEmbedData;
  };
  deleteNode: () => void;
  selected: boolean;
}

// React component for MentionEmbed node view
const MentionEmbedComponent = ({ node, deleteNode, selected }: MentionEmbedComponentProps) => {
  const data = node.attrs;

  const handleClick = (e: React.MouseEvent) => {
    // Allow default behavior for interactive elements inside the card
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('mention-embed-click', { 
      detail: { type: data.type, id: data.id, data } 
    }));
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode();
  };

  const renderCard = () => {
    switch (data.type) {
      case 'job-application':
        return (
          <MentionCardJobApplication
            data={{
              id: data.id,
              companyName: data.title,
              position: data.subtitle || 'Position', // Fallback
              status: data.status || 'applied',
              appliedDate: data.date || new Date().toISOString(),
              location: data.extra?.location,
              salary: data.extra?.salary,
              workType: data.extra?.workType,
              url: data.extra?.url,
              platform: data.extra?.platform
            }}
            selected={selected}
            onClick={() => {}} // Handled by wrapper
          />
        );
      case 'resume':
        return (
          <MentionCardResume
            data={{
              id: data.id,
              name: data.title,
              template: data.extra?.template,
              updatedAt: data.date,
              tags: data.extra?.tags,
              personalInfo: data.extra?.personalInfo
            }}
            selected={selected}
            onClick={() => {}}
          />
        );
      case 'cv-analysis':
        return (
          <MentionCardCVAnalysis
            data={{
              id: data.id,
              jobTitle: data.title,
              company: data.subtitle || 'Company',
              matchScore: data.score || 0,
              date: data.date,
              keyFindings: data.extra?.keyFindings,
              skillsMatch: data.extra?.skillsMatch,
              categoryScores: data.extra?.categoryScores
            }}
            selected={selected}
            onClick={() => {}}
          />
        );
      case 'interview':
        return (
          <MentionCardInterview
            data={{
              id: data.id,
              applicationId: data.extra?.applicationId || '',
              companyName: data.subtitle || 'Company',
              position: data.title,
              date: data.date || new Date().toISOString(),
              time: data.extra?.time || '00:00',
              type: data.extra?.interviewType || 'other',
              status: (data.status as any) || 'scheduled',
              location: data.extra?.location,
              interviewers: data.extra?.interviewers
            }}
            selected={selected}
            onClick={() => {}}
          />
        );
      default:
        return null;
    }
  };

  return (
    <NodeViewWrapper className="mention-embed-block my-2" data-type="mention-embed">
      <div 
        className="relative group" 
        onClick={handleClick}
      >
        {renderCard()}
        
        {/* Delete Button (Absolute positioned over the card) */}
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={handleDelete}
            className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 shadow-sm border border-white dark:border-gray-600 transition-colors"
            title="Remove mention"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

// MentionEmbed Extension
const MentionEmbed = Node.create({
  name: 'mentionEmbed',
  group: 'block',
  atom: true, // Not editable, treated as a single unit
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      type: {
        default: 'job-application',
        parseHTML: (element) => element.getAttribute('data-mention-type') || 'job-application',
        renderHTML: (attributes) => ({
          'data-mention-type': attributes.type,
        }),
      },
      id: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-mention-id') || '',
        renderHTML: (attributes) => ({
          'data-mention-id': attributes.id,
        }),
      },
      title: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-title') || '',
        renderHTML: (attributes) => ({
          'data-title': attributes.title,
        }),
      },
      subtitle: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-subtitle') || '',
        renderHTML: (attributes) => ({
          'data-subtitle': attributes.subtitle,
        }),
      },
      status: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-status') || null,
        renderHTML: (attributes) => {
          if (!attributes.status) return {};
          return { 'data-status': attributes.status };
        },
      },
      score: {
        default: null,
        parseHTML: (element) => {
          const val = element.getAttribute('data-score');
          return val ? parseInt(val, 10) : null;
        },
        renderHTML: (attributes) => {
          if (attributes.score === null || attributes.score === undefined) return {};
          return { 'data-score': attributes.score.toString() };
        },
      },
      date: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-date') || '',
        renderHTML: (attributes) => {
          if (!attributes.date) return {};
          return { 'data-date': attributes.date };
        },
      },
      extra: {
        default: {},
        parseHTML: (element) => {
          try {
            return JSON.parse(element.getAttribute('data-extra') || '{}');
          } catch {
            return {};
          }
        },
        renderHTML: (attributes) => {
          if (!attributes.extra || Object.keys(attributes.extra).length === 0) return {};
          return { 'data-extra': JSON.stringify(attributes.extra) };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mention-embed"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // No content hole (0) for atomic nodes - they are self-contained
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mention-embed', class: 'mention-embed-node' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionEmbedComponent);
  },

  addCommands() {
    return {
      insertMentionEmbed:
        (attrs: MentionEmbedData) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },

  // Handle keyboard events to prevent accidental deletion
  addKeyboardShortcuts() {
    return {
      // When Enter is pressed with node selected, create a new paragraph after it
      Enter: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        
        // Check if we're at a mention embed node
        if ($from.parent.type.name === 'mentionEmbed' || 
            (selection.node && selection.node.type.name === 'mentionEmbed')) {
          // Insert a paragraph after the current node
          return editor.chain()
            .insertContentAt($from.after(), { type: 'paragraph' })
            .focus()
            .run();
        }
        
        return false;
      },
      // Prevent backspace from deleting the node when cursor is at start of next paragraph
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        const { $from, empty } = selection;
        
        // Only handle when cursor is at the start of a paragraph
        if (!empty || $from.parentOffset !== 0) {
          return false;
        }
        
        // Check if the previous node is a mention embed
        const nodeBefore = $from.nodeBefore;
        if (nodeBefore && nodeBefore.type.name === 'mentionEmbed') {
          // Don't delete the mention embed, just select it
          return true;
        }
        
        return false;
      },
    };
  },
});

export default MentionEmbed;

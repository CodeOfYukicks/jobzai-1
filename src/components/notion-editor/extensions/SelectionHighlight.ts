import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface SelectionHighlightOptions {
  highlightClass: string;
}

export interface SelectionHighlightStorage {
  range: { from: number; to: number } | null;
}

export const SelectionHighlightPluginKey = new PluginKey('selectionHighlight');

export const SelectionHighlight = Extension.create<SelectionHighlightOptions, SelectionHighlightStorage>({
  name: 'selectionHighlight',

  addOptions() {
    return {
      highlightClass: 'ai-selection-highlight',
    };
  },

  addStorage() {
    return {
      range: null,
    };
  },

  addCommands() {
    return {
      setHighlightRange: (range: { from: number; to: number } | null) => ({ editor }) => {
        this.storage.range = range;
        // Trigger a state update to re-render decorations
        editor.view.dispatch(editor.state.tr);
        return true;
      },
      clearHighlightRange: () => ({ editor }) => {
        this.storage.range = null;
        editor.view.dispatch(editor.state.tr);
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    
    return [
      new Plugin({
        key: SelectionHighlightPluginKey,
        props: {
          decorations: (state) => {
            const range = extension.storage.range;
            
            if (!range || range.from === range.to) {
              return DecorationSet.empty;
            }

            // Clamp range to document bounds
            const from = Math.max(0, Math.min(range.from, state.doc.content.size));
            const to = Math.max(0, Math.min(range.to, state.doc.content.size));

            if (from >= to) {
              return DecorationSet.empty;
            }

            const decoration = Decoration.inline(from, to, {
              class: extension.options.highlightClass,
            });

            return DecorationSet.create(state.doc, [decoration]);
          },
        },
      }),
    ];
  },
});

export default SelectionHighlight;


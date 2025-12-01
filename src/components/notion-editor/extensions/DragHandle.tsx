import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface DragHandleOptions {
  className?: string;
}

const dragHandlePluginKey = new PluginKey('dragHandle');

const DragHandle = Extension.create<DragHandleOptions>({
  name: 'dragHandle',

  addOptions() {
    return {
      className: 'drag-handle',
    };
  },

  addProseMirrorPlugins() {
    let dragHandleElement: HTMLDivElement | null = null;
    let currentBlockPos: number | null = null;
    const editor = this.editor;

    const createDragHandle = () => {
      const handle = document.createElement('div');
      handle.className = `
        drag-handle-wrapper fixed z-50 opacity-0 pointer-events-none
        transition-opacity duration-150 cursor-grab active:cursor-grabbing
      `;
      handle.innerHTML = `
        <div class="drag-handle flex flex-col items-center justify-center w-6 h-6 rounded 
          bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
          text-gray-400 dark:text-gray-500 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="5" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="5" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="19" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="19" r="1.5" fill="currentColor"/>
          </svg>
        </div>
      `;
      handle.setAttribute('draggable', 'true');
      
      handle.addEventListener('dragstart', (e) => {
        if (currentBlockPos !== null) {
          const node = editor.state.doc.nodeAt(currentBlockPos);
          if (node) {
            e.dataTransfer?.setData('text/plain', '');
            handle.classList.add('dragging');
            
            // Store the position for drop handling
            (e.dataTransfer as any).effectAllowed = 'move';
            (window as any).__tiptapDragPos = currentBlockPos;
          }
        }
      });

      handle.addEventListener('dragend', () => {
        handle.classList.remove('dragging');
        (window as any).__tiptapDragPos = null;
      });

      document.body.appendChild(handle);
      return handle;
    };

    const showHandleAt = (view: any, pos: number) => {
      if (!dragHandleElement) {
        dragHandleElement = createDragHandle();
      }

      const coords = view.coordsAtPos(pos);
      const editorRect = view.dom.getBoundingClientRect();
      
      dragHandleElement.style.left = `${editorRect.left - 32}px`;
      dragHandleElement.style.top = `${coords.top}px`;
      dragHandleElement.style.opacity = '1';
      dragHandleElement.style.pointerEvents = 'auto';
      currentBlockPos = pos;
    };

    const hideHandle = () => {
      if (dragHandleElement) {
        dragHandleElement.style.opacity = '0';
        dragHandleElement.style.pointerEvents = 'none';
      }
      currentBlockPos = null;
    };

    return [
      new Plugin({
        key: dragHandlePluginKey,
        props: {
          handleDOMEvents: {
            mousemove: (view, event) => {
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
              
              if (!pos) {
                hideHandle();
                return false;
              }

              // Find the block-level node at this position
              const $pos = view.state.doc.resolve(pos.pos);
              let depth = $pos.depth;
              
              while (depth > 0) {
                const node = $pos.node(depth);
                if (node.isBlock && !node.isTextblock) {
                  break;
                }
                depth--;
              }

              if (depth === 0) {
                // We're at the doc level, get the direct child
                const blockPos = $pos.before(1);
                if (blockPos >= 0) {
                  showHandleAt(view, blockPos);
                }
              } else {
                const blockPos = $pos.before(depth);
                if (blockPos >= 0) {
                  showHandleAt(view, blockPos);
                }
              }

              return false;
            },
            mouseleave: () => {
              // Delay hiding to allow clicking the handle
              setTimeout(() => {
                if (!dragHandleElement?.matches(':hover')) {
                  hideHandle();
                }
              }, 100);
              return false;
            },
            drop: (view, event) => {
              const dragPos = (window as any).__tiptapDragPos;
              if (dragPos === null || dragPos === undefined) {
                return false;
              }

              const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (!dropPos) {
                return false;
              }

              const tr = view.state.tr;
              const node = view.state.doc.nodeAt(dragPos);
              
              if (!node) {
                return false;
              }

              // Delete from original position and insert at new position
              const $dropPos = view.state.doc.resolve(dropPos.pos);
              const insertPos = $dropPos.before($dropPos.depth || 1);

              // Simple move: delete and insert
              if (dragPos !== insertPos) {
                const nodeSize = node.nodeSize;
                
                if (insertPos < dragPos) {
                  tr.delete(dragPos, dragPos + nodeSize);
                  tr.insert(insertPos, node);
                } else {
                  tr.insert(insertPos, node);
                  tr.delete(dragPos, dragPos + nodeSize);
                }
                
                view.dispatch(tr);
              }

              (window as any).__tiptapDragPos = null;
              return true;
            },
          },
        },
        view: () => ({
          destroy: () => {
            if (dragHandleElement && dragHandleElement.parentNode) {
              dragHandleElement.parentNode.removeChild(dragHandleElement);
            }
          },
        }),
      }),
    ];
  },
});

export default DragHandle;


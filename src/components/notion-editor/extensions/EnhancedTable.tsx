import { Table } from '@tiptap/extension-table';
import { mergeAttributes } from '@tiptap/core';

export interface ColumnMetadata {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multi-select' | 'date' | 'checkbox' | 'url';
  width?: number;
  options?: string[]; // For select/multi-select
  format?: string; // For number/date
}

export interface SortConfig {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  columnId: string;
  operator: string;
  value: any;
}

export interface TableMetadata {
  columns: ColumnMetadata[];
  sorts: SortConfig[];
  filters: FilterConfig[];
}

const EnhancedTable = Table.extend({
  name: 'table',

  addOptions() {
    return {
      ...this.parent?.(),
      resizable: true,
      handleWidth: 5,
      cellMinWidth: 100,
      lastColumnResizable: true,
      allowTableNodeSelection: false,
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      metadata: {
        default: null,
        parseHTML: (element) => {
          const metadataStr = element.getAttribute('data-metadata');
          if (!metadataStr) return null;
          try {
            return JSON.parse(metadataStr);
          } catch {
            return null;
          }
        },
        renderHTML: (attributes) => {
          if (!attributes.metadata) return {};
          return {
            'data-metadata': JSON.stringify(attributes.metadata),
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      
      insertTable: (options) => ({ commands }) => {
        const { rows = 3, cols = 3, withHeaderRow = true } = options || {};
        
        // Initialize column metadata
        const columns: ColumnMetadata[] = [];
        for (let i = 0; i < cols; i++) {
          columns.push({
            id: `col-${Date.now()}-${i}`,
            name: `Column ${i + 1}`,
            type: 'text',
          });
        }

        const metadata: TableMetadata = {
          columns,
          sorts: [],
          filters: [],
        };

        return commands.insertContent({
          type: this.name,
          attrs: { metadata },
          content: Array.from({ length: rows }, (_, rowIndex) => ({
            type: 'tableRow',
            content: Array.from({ length: cols }, (_, colIndex) => ({
              type: withHeaderRow && rowIndex === 0 ? 'tableHeader' : 'tableCell',
              attrs: {
                columnType: 'text',
                cellValue: null,
                colwidth: null,
              },
              content: [
                {
                  type: 'paragraph',
                  content: withHeaderRow && rowIndex === 0 
                    ? [{ type: 'text', text: columns[colIndex].name }]
                    : [],
                },
              ],
            })),
          })),
        });
      },

      setColumnWidth: (columnIndex: number, width: number) => ({ state, tr, dispatch }) => {
        const { selection } = state;
        let tablePos: number | null = null;
        let tableNode: any = null;

        // Find the table node
        state.doc.descendants((node, pos) => {
          if (node.type.name === 'table' && pos < selection.from && pos + node.nodeSize > selection.from) {
            tablePos = pos;
            tableNode = node;
            return false;
          }
        });

        if (tablePos === null || !tableNode) return false;

        const metadata = tableNode.attrs.metadata || { columns: [], sorts: [], filters: [] };
        const columns = [...metadata.columns];
        
        if (columns[columnIndex]) {
          columns[columnIndex] = { ...columns[columnIndex], width };
        }

        if (dispatch) {
          tr.setNodeMarkup(tablePos, null, {
            ...tableNode.attrs,
            metadata: { ...metadata, columns },
          });
        }

        return true;
      },

      updateTableMetadata: (metadata: Partial<TableMetadata>) => ({ state, tr, dispatch }) => {
        const { selection } = state;
        const table = this.editor.isActive('table');
        
        if (!table) return false;

        // Find the table node
        let tablePos: number | null = null;
        let tableNode: any = null;

        state.doc.descendants((node, pos) => {
          if (node.type.name === 'table' && pos < selection.from && pos + node.nodeSize > selection.from) {
            tablePos = pos;
            tableNode = node;
            return false;
          }
        });

        if (tablePos === null || !tableNode) return false;

        const currentMetadata = tableNode.attrs.metadata || { columns: [], sorts: [], filters: [] };
        const newMetadata = { ...currentMetadata, ...metadata };

        if (dispatch) {
          tr.setNodeMarkup(tablePos, null, {
            ...tableNode.attrs,
            metadata: newMetadata,
          });
        }

        return true;
      },

      setColumnType: (columnIndex: number, columnType: ColumnMetadata['type']) => ({ state, tr, dispatch }) => {
        const { selection } = state;
        let tablePos: number | null = null;
        let tableNode: any = null;

        // Find the table node
        state.doc.descendants((node, pos) => {
          if (node.type.name === 'table' && pos < selection.from && pos + node.nodeSize > selection.from) {
            tablePos = pos;
            tableNode = node;
            return false;
          }
        });

        if (tablePos === null || !tableNode) return false;

        const metadata = tableNode.attrs.metadata || { columns: [], sorts: [], filters: [] };
        const columns = [...metadata.columns];
        
        if (columns[columnIndex]) {
          columns[columnIndex] = { ...columns[columnIndex], type: columnType };
        }

        // Update all cells in this column
        let cellIndex = 0;
        tableNode.descendants((node: any, pos: number) => {
          if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
            const colIndex = cellIndex % tableNode.firstChild.childCount;
            if (colIndex === columnIndex && dispatch) {
              tr.setNodeMarkup(tablePos! + pos + 1, null, {
                ...node.attrs,
                columnType,
              });
            }
            cellIndex++;
          }
        });

        if (dispatch) {
          tr.setNodeMarkup(tablePos, null, {
            ...tableNode.attrs,
            metadata: { ...metadata, columns },
          });
        }

        return true;
      },

      addColumnBefore: () => ({ commands, state }) => {
        // Get table metadata inline
        const { selection } = state;
        let tableNode: any = null;

        state.doc.descendants((node: any, pos: number) => {
          if (node.type.name === 'table' && pos < selection.from && pos + node.nodeSize > selection.from) {
            tableNode = node;
            return false;
          }
        });

        const metadata = tableNode?.attrs.metadata || null;
        
        if (metadata) {
          const newColumn: ColumnMetadata = {
            id: `col-${Date.now()}`,
            name: `Column ${metadata.columns.length + 1}`,
            type: 'text',
          };
          
          // Get current column index
          let columnIndex = 0;
          let found = false;
          state.doc.descendants((node: any, pos: number) => {
            if (found) return false;
            if (node.type.name === 'table') {
              let cellCount = 0;
              node.descendants((cellNode: any, cellPos: number) => {
                if (cellNode.type.name === 'tableCell' || cellNode.type.name === 'tableHeader') {
                  if (pos + cellPos + 1 <= selection.from && pos + cellPos + cellNode.nodeSize >= selection.from) {
                    const row = node.firstChild;
                    if (row) {
                      columnIndex = cellCount % row.childCount;
                      found = true;
                      return false;
                    }
                  }
                  cellCount++;
                }
              });
              return false;
            }
          });
          
          commands.updateTableMetadata({
            columns: [...metadata.columns.slice(0, columnIndex), newColumn, ...metadata.columns.slice(columnIndex)],
          });
        }
        return commands.addColumnBefore();
      },

      addColumnAfter: () => ({ commands, state }) => {
        // Get table metadata inline
        const { selection } = state;
        let tableNode: any = null;

        state.doc.descendants((node: any, pos: number) => {
          if (node.type.name === 'table' && pos < selection.from && pos + node.nodeSize > selection.from) {
            tableNode = node;
            return false;
          }
        });

        const metadata = tableNode?.attrs.metadata || null;
        
        if (metadata) {
          const newColumn: ColumnMetadata = {
            id: `col-${Date.now()}`,
            name: `Column ${metadata.columns.length + 1}`,
            type: 'text',
          };
          
          // Get current column index
          let columnIndex = 0;
          let found = false;
          state.doc.descendants((node: any, pos: number) => {
            if (found) return false;
            if (node.type.name === 'table') {
              let cellCount = 0;
              node.descendants((cellNode: any, cellPos: number) => {
                if (cellNode.type.name === 'tableCell' || cellNode.type.name === 'tableHeader') {
                  if (pos + cellPos + 1 <= selection.from && pos + cellPos + cellNode.nodeSize >= selection.from) {
                    const row = node.firstChild;
                    if (row) {
                      columnIndex = cellCount % row.childCount;
                      found = true;
                      return false;
                    }
                  }
                  cellCount++;
                }
              });
              return false;
            }
          });
          
          commands.updateTableMetadata({
            columns: [...metadata.columns.slice(0, columnIndex + 1), newColumn, ...metadata.columns.slice(columnIndex + 1)],
          });
        }
        return commands.addColumnAfter();
      },

      deleteColumn: () => ({ commands, state }) => {
        // Get table metadata inline
        const { selection } = state;
        let tableNode: any = null;

        state.doc.descendants((node: any, pos: number) => {
          if (node.type.name === 'table' && pos < selection.from && pos + node.nodeSize > selection.from) {
            tableNode = node;
            return false;
          }
        });

        const metadata = tableNode?.attrs.metadata || null;
        
        if (metadata) {
          // Get current column index
          let columnIndex = 0;
          let found = false;
          state.doc.descendants((node: any, pos: number) => {
            if (found) return false;
            if (node.type.name === 'table') {
              let cellCount = 0;
              node.descendants((cellNode: any, cellPos: number) => {
                if (cellNode.type.name === 'tableCell' || cellNode.type.name === 'tableHeader') {
                  if (pos + cellPos + 1 <= selection.from && pos + cellPos + cellNode.nodeSize >= selection.from) {
                    const row = node.firstChild;
                    if (row) {
                      columnIndex = cellCount % row.childCount;
                      found = true;
                      return false;
                    }
                  }
                  cellCount++;
                }
              });
              return false;
            }
          });
          
          commands.updateTableMetadata({
            columns: metadata.columns.filter((_, index) => index !== columnIndex),
          });
        }
        return commands.deleteColumn();
      },
    };
  },
});

export default EnhancedTable;


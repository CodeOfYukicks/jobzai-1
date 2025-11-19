import { create } from 'zustand';
import { BoardObject, CanvasState, ToolType, HistoryState, WhiteboardState } from '../types/whiteboard';
import { v4 as uuidv4 } from 'uuid';

const MAX_HISTORY = 50;

const defaultCanvasState: CanvasState = {
  panX: 0,
  panY: 0,
  zoom: 1,
};

const defaultHistory: HistoryState = {
  past: [],
  present: [],
  future: [],
};

interface WhiteboardStore extends WhiteboardState {
  // Object actions
  addObject: (object: Partial<BoardObject>) => string;
  updateObject: (id: string, updates: Partial<BoardObject>) => void;
  deleteObject: (id: string) => void;
  deleteSelected: () => void;
  duplicateObject: (id: string) => void;
  
  // Selection actions
  selectObject: (id: string, multiSelect?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Tool actions
  setTool: (tool: ToolType) => void;
  
  // Canvas actions
  setCanvasState: (state: Partial<CanvasState>) => void;
  resetZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // UI state
  setShowGrid: (show: boolean) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setEditingObjectId: (id: string | null) => void;
  setConnectorStartId: (id: string | null) => void;
  setSelectedStickyColor: (color: string) => void;
  
  // Clipboard
  copySelected: () => void;
  paste: () => void;
  
  // Layer management
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  
  // Bulk operations
  loadObjects: (objects: BoardObject[]) => void;
  clearAll: () => void;
}

const saveToHistoryHelper = (
  history: HistoryState,
  newState: BoardObject[]
): HistoryState => {
  const newPast = [...history.past, history.present].slice(-MAX_HISTORY);
  return {
    past: newPast,
    present: newState,
    future: [], // Clear future when new action is performed
  };
};

export const useWhiteboardStore = create<WhiteboardStore>((set, get) => ({
  objects: [],
  selectedIds: [],
  tool: 'pointer',
  canvasState: defaultCanvasState,
  history: defaultHistory,
  showGrid: true,
  isDrawing: false,
  clipboard: null,
  editingObjectId: null,
  connectorStartId: null,
  selectedStickyColor: '#ffeb3b', // Default yellow

  addObject: (object) => {
    // Use selectedStickyColor for sticky notes if no color is provided
    const defaultStyle = object.type === 'sticky' && !object.style?.backgroundColor
      ? { backgroundColor: get().selectedStickyColor }
      : {};
    
    const newObject: BoardObject = {
      id: uuidv4(),
      type: object.type || 'sticky',
      x: object.x || 0,
      y: object.y || 0,
      width: object.width || 200,
      height: object.height || 150,
      rotation: object.rotation || 0,
      zIndex: object.zIndex ?? get().objects.length,
      style: { ...defaultStyle, ...(object.style || {}) },
      data: object.data || {},
      locked: object.locked || false,
    };

    set((state) => {
      const newObjects = [...state.objects, newObject];
      const newHistory = saveToHistoryHelper(state.history, newObjects);
      
      // Auto-edit for sticky and text objects
      const shouldAutoEdit = (object.type === 'sticky' || object.type === 'text');
      
      return {
        objects: newObjects,
        history: newHistory,
        selectedIds: [newObject.id],
        editingObjectId: shouldAutoEdit ? newObject.id : null,
        // Return to pointer tool after creation
        tool: 'pointer',
      };
    });

    return newObject.id;
  },

  updateObject: (id, updates) => {
    set((state) => {
      const newObjects = state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      );
      // Don't save to history automatically - history will be saved manually after discrete actions
      return {
        objects: newObjects,
      };
    });
  },

  deleteObject: (id) => {
    set((state) => {
      const newObjects = state.objects.filter((obj) => obj.id !== id);
      const newSelectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);
      return {
        objects: newObjects,
        selectedIds: newSelectedIds,
        history: saveToHistoryHelper(state.history, newObjects),
      };
    });
  },

  deleteSelected: () => {
    const { selectedIds, objects } = get();
    if (selectedIds.length === 0) return;

    set((state) => {
      const newObjects = state.objects.filter((obj) => !selectedIds.includes(obj.id));
      return {
        objects: newObjects,
        selectedIds: [],
        history: saveToHistoryHelper(state.history, newObjects),
      };
    });
  },

  duplicateObject: (id) => {
    const object = get().objects.find((obj) => obj.id === id);
    if (!object) return;

    const newId = get().addObject({
      ...object,
      x: object.x + 20,
      y: object.y + 20,
      zIndex: get().objects.length,
    });

    get().selectObject(newId, false);
  },

  selectObject: (id, multiSelect = false) => {
    set((state) => {
      if (multiSelect) {
        const isSelected = state.selectedIds.includes(id);
        return {
          selectedIds: isSelected
            ? state.selectedIds.filter((selectedId) => selectedId !== id)
            : [...state.selectedIds, id],
        };
      } else {
        return {
          selectedIds: state.selectedIds.includes(id) ? [] : [id],
        };
      }
    });
  },

  selectMultiple: (ids) => {
    set({ selectedIds: ids });
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },

  selectAll: () => {
    set((state) => ({
      selectedIds: state.objects.map((obj) => obj.id),
    }));
  },

  setTool: (tool) => {
    set({ tool, selectedIds: [] });
  },

  setCanvasState: (state) => {
    set((current) => ({
      canvasState: { ...current.canvasState, ...state },
    }));
  },

  resetZoom: () => {
    set({
      canvasState: { ...defaultCanvasState, panX: get().canvasState.panX, panY: get().canvasState.panY },
    });
  },

  zoomIn: () => {
    set((state) => ({
      canvasState: {
        ...state.canvasState,
        zoom: Math.min(state.canvasState.zoom * 1.1, 3),
      },
    }));
  },

  zoomOut: () => {
    set((state) => ({
      canvasState: {
        ...state.canvasState,
        zoom: Math.max(state.canvasState.zoom / 1.1, 0.25),
      },
    }));
  },

  undo: () => {
    set((state) => {
      console.log('[UNDO] Current state:', {
        pastLength: state.history.past.length,
        presentLength: state.history.present.length,
        futureLength: state.history.future.length,
        currentObjectsLength: state.objects.length,
      });
      
      if (state.history.past.length === 0) {
        console.log('[UNDO] Nothing to undo - past is empty');
        return state;
      }

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);

      console.log('[UNDO] Applying undo:', {
        previousLength: previous.length,
        newPastLength: newPast.length,
      });

      return {
        objects: previous,
        history: {
          past: newPast,
          present: previous,
          future: [state.history.present, ...state.history.future],
        },
        editingObjectId: null, // Clear editing state on undo
      };
    });
  },

  redo: () => {
    set((state) => {
      console.log('[REDO] Current state:', {
        pastLength: state.history.past.length,
        presentLength: state.history.present.length,
        futureLength: state.history.future.length,
        currentObjectsLength: state.objects.length,
      });
      
      if (state.history.future.length === 0) {
        console.log('[REDO] Nothing to redo - future is empty');
        return state;
      }

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);

      console.log('[REDO] Applying redo:', {
        nextLength: next.length,
        newFutureLength: newFuture.length,
      });

      return {
        objects: next,
        history: {
          past: [...state.history.past, state.history.present],
          present: next,
          future: newFuture,
        },
        editingObjectId: null, // Clear editing state on redo
      };
    });
  },

  saveToHistory: () => {
    set((state) => {
      const newHistory = saveToHistoryHelper(state.history, state.objects);
      console.log('[HISTORY] Saving to history:', {
        pastLength: newHistory.past.length,
        presentLength: newHistory.present.length,
        futureLength: newHistory.future.length,
        objectsLength: state.objects.length,
      });
      return {
        history: newHistory,
      };
    });
  },

  setShowGrid: (show) => {
    set({ showGrid: show });
  },

  setIsDrawing: (isDrawing) => {
    set({ isDrawing });
  },

  setEditingObjectId: (id) => {
    set({ editingObjectId: id });
  },

  setConnectorStartId: (id) => {
    set({ connectorStartId: id });
  },

  setSelectedStickyColor: (color) => {
    set({ selectedStickyColor: color });
  },

  copySelected: () => {
    const { selectedIds, objects } = get();
    const selectedObjects = objects.filter((obj) => selectedIds.includes(obj.id));
    set({ clipboard: selectedObjects });
  },

  paste: () => {
    set((state) => {
      const { clipboard, canvasState } = state;
      if (!clipboard || clipboard.length === 0) return state;

      const pastedIds: string[] = [];
      let newObjects = [...state.objects];
      
      clipboard.forEach((obj) => {
        const newObject: BoardObject = {
          ...obj,
          id: uuidv4(), // Generate new ID
          x: obj.x + 50 + canvasState.panX,
          y: obj.y + 50 + canvasState.panY,
          zIndex: newObjects.length,
        };
        newObjects.push(newObject);
        pastedIds.push(newObject.id);
      });

      return {
        objects: newObjects,
        selectedIds: pastedIds,
        history: saveToHistoryHelper(state.history, newObjects),
      };
    });
  },

  bringToFront: (id) => {
    set((state) => {
      const objects = state.objects;
      const maxZIndex = Math.max(...objects.map((obj) => obj.zIndex), 0);
      const newObjects = objects.map((obj) =>
        obj.id === id ? { ...obj, zIndex: maxZIndex + 1 } : obj
      );
      return {
        objects: newObjects,
        history: saveToHistoryHelper(state.history, newObjects),
      };
    });
  },

  sendToBack: (id) => {
    set((state) => {
      const objects = state.objects;
      const minZIndex = Math.min(...objects.map((obj) => obj.zIndex), 0);
      const newObjects = objects.map((obj) =>
        obj.id === id ? { ...obj, zIndex: minZIndex - 1 } : obj
      );
      return {
        objects: newObjects,
        history: saveToHistoryHelper(state.history, newObjects),
      };
    });
  },

  loadObjects: (objects) => {
    console.log('[LOAD] Loading objects:', objects.length);
    set({
      objects,
      history: {
        past: [],
        present: objects, // Initialize present with loaded objects
        future: [],
      },
      editingObjectId: null,
      selectedIds: [],
    });
    console.log('[LOAD] History initialized:', {
      pastLength: 0,
      presentLength: objects.length,
      futureLength: 0,
    });
  },

  clearAll: () => {
    set({
      objects: [],
      selectedIds: [],
      history: {
        past: [],
        present: [],
        future: [],
      },
      editingObjectId: null,
      connectorStartId: null,
      tool: 'pointer',
      canvasState: defaultCanvasState,
      clipboard: null,
    });
  },
}));


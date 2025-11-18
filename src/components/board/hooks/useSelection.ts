import { useCallback, useRef } from 'react';
import { useWhiteboardStore } from '../../../stores/whiteboardStore';
import { screenToWorld, isPointInRect } from '../utils/canvasUtils';
import { BoardObject } from '../../../types/whiteboard';

export function useSelection(canvasRef: React.RefObject<HTMLDivElement>) {
  const {
    objects,
    selectedIds,
    selectObject,
    selectMultiple,
    clearSelection,
    tool,
    canvasState,
  } = useWhiteboardStore();

  const selectionBoxRef = useRef<{ startX: number; startY: number } | null>(null);
  const isSelectingRef = useRef(false);

  const getObjectAtPoint = useCallback(
    (x: number, y: number): BoardObject | null => {
      const worldPos = screenToWorld(x, y, canvasState);
      
      // Check objects in reverse order (top to bottom)
      const sortedObjects = [...objects].sort((a, b) => b.zIndex - a.zIndex);
      
      for (const obj of sortedObjects) {
        if (
          worldPos.x >= obj.x &&
          worldPos.x <= obj.x + obj.width &&
          worldPos.y >= obj.y &&
          worldPos.y <= obj.y + obj.height
        ) {
          return obj;
        }
      }
      
      return null;
    },
    [objects, canvasState]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool !== 'pointer') return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const clickedObject = getObjectAtPoint(x, y);

      if (clickedObject) {
        selectObject(clickedObject.id, e.shiftKey);
      } else {
        if (!e.shiftKey) {
          clearSelection();
        }
      }
    },
    [tool, canvasRef, getObjectAtPoint, selectObject, clearSelection]
  );

  const startSelectionBox = useCallback((x: number, y: number) => {
    if (tool !== 'pointer') return;
    selectionBoxRef.current = { startX: x, startY: y };
    isSelectingRef.current = true;
  }, [tool]);

  const updateSelectionBox = useCallback(
    (x: number, y: number) => {
      if (!isSelectingRef.current || !selectionBoxRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const startX = selectionBoxRef.current.startX - rect.left;
      const startY = selectionBoxRef.current.startY - rect.top;
      const endX = x - rect.left;
      const endY = y - rect.top;

      const box = {
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
      };

      // Find objects within selection box
      const selected: string[] = [];
      objects.forEach((obj) => {
        const objScreenPos = {
          x: obj.x * canvasState.zoom + canvasState.panX,
          y: obj.y * canvasState.zoom + canvasState.panY,
          width: obj.width * canvasState.zoom,
          height: obj.height * canvasState.zoom,
        };

        // Check if object overlaps with selection box
        if (
          objScreenPos.x < box.x + box.width &&
          objScreenPos.x + objScreenPos.width > box.x &&
          objScreenPos.y < box.y + box.height &&
          objScreenPos.y + objScreenPos.height > box.y
        ) {
          selected.push(obj.id);
        }
      });

      if (selected.length > 0) {
        selectMultiple(selected);
      }
    },
    [canvasRef, objects, canvasState, selectMultiple]
  );

  const endSelectionBox = useCallback(() => {
    isSelectingRef.current = false;
    selectionBoxRef.current = null;
  }, []);

  return {
    selectedIds,
    handleCanvasClick,
    startSelectionBox,
    updateSelectionBox,
    endSelectionBox,
    getObjectAtPoint,
  };
}


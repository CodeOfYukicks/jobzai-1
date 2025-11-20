import { BoardObject } from '../../../types/whiteboard';
import { CanvasState } from '../../../types/whiteboard';
import { worldToScreen } from './canvasUtils';

/**
 * Calculate viewport bounds in world coordinates
 */
export function getViewportBounds(
  canvasWidth: number,
  canvasHeight: number,
  canvasState: CanvasState
): { minX: number; minY: number; maxX: number; maxY: number } {
  // Convert screen corners to world coordinates
  const topLeft = {
    x: -canvasState.panX / canvasState.zoom,
    y: -canvasState.panY / canvasState.zoom,
  };
  
  const bottomRight = {
    x: (canvasWidth - canvasState.panX) / canvasState.zoom,
    y: (canvasHeight - canvasState.panY) / canvasState.zoom,
  };

  return {
    minX: Math.min(topLeft.x, bottomRight.x),
    minY: Math.min(topLeft.y, bottomRight.y),
    maxX: Math.max(topLeft.x, bottomRight.x),
    maxY: Math.max(topLeft.y, bottomRight.y),
  };
}

/**
 * Check if an object is visible in the viewport
 * Uses a padding to render objects slightly outside viewport for smoother scrolling
 */
export function isObjectVisible(
  obj: BoardObject,
  viewportBounds: { minX: number; minY: number; maxX: number; maxY: number },
  padding: number = 200 // Padding in world coordinates
): boolean {
  const objRight = obj.x + obj.width;
  const objBottom = obj.y + obj.height;

  return (
    objRight >= viewportBounds.minX - padding &&
    obj.x <= viewportBounds.maxX + padding &&
    objBottom >= viewportBounds.minY - padding &&
    obj.y <= viewportBounds.maxY + padding
  );
}

/**
 * Filter objects to only those visible in the viewport
 */
export function getVisibleObjects(
  objects: BoardObject[],
  canvasWidth: number,
  canvasHeight: number,
  canvasState: CanvasState,
  padding: number = 200
): BoardObject[] {
  const viewportBounds = getViewportBounds(canvasWidth, canvasHeight, canvasState);
  
  return objects.filter(obj => isObjectVisible(obj, viewportBounds, padding));
}



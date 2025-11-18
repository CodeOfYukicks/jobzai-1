import { CanvasState } from '../../../types/whiteboard';

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  canvasState: CanvasState
): { x: number; y: number } {
  return {
    x: (screenX - canvasState.panX) / canvasState.zoom,
    y: (screenY - canvasState.panY) / canvasState.zoom,
  };
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  canvasState: CanvasState
): { x: number; y: number } {
  return {
    x: worldX * canvasState.zoom + canvasState.panX,
    y: worldY * canvasState.zoom + canvasState.panY,
  };
}

/**
 * Get bounding box for multiple objects
 */
export function getBoundingBox(
  objects: Array<{ x: number; y: number; width: number; height: number }>
): { x: number; y: number; width: number; height: number } | null {
  if (objects.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  objects.forEach((obj) => {
    minX = Math.min(minX, obj.x);
    minY = Math.min(minY, obj.y);
    maxX = Math.max(maxX, obj.x + obj.width);
    maxY = Math.max(maxY, obj.y + obj.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Check if point is inside rectangle
 */
export function isPointInRect(
  x: number,
  y: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

/**
 * Check if point is inside rotated rectangle
 */
export function isPointInRotatedRect(
  x: number,
  y: number,
  rect: { x: number; y: number; width: number; height: number; rotation?: number }
): boolean {
  if (!rect.rotation || rect.rotation === 0) {
    return isPointInRect(x, y, rect);
  }

  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const angle = -rect.rotation * (Math.PI / 180);

  const dx = x - centerX;
  const dy = y - centerY;

  const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
  const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);

  return (
    rotatedX >= -rect.width / 2 &&
    rotatedX <= rect.width / 2 &&
    rotatedY >= -rect.height / 2 &&
    rotatedY <= rect.height / 2
  );
}

/**
 * Snap value to grid
 */
export function snapToGrid(value: number, gridSize: number = 20): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}


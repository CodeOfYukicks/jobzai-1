import { BoardObject } from '../../../types/whiteboard';

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Calculate angle between two points in degrees
 */
export function angle(x1: number, y1: number, x2: number, y2: number): number {
  return (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
}

/**
 * Rotate point around center
 */
export function rotatePoint(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  angleDegrees: number
): { x: number; y: number } {
  const angleRad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = x - centerX;
  const dy = y - centerY;

  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos,
  };
}

/**
 * Get object center point
 */
export function getObjectCenter(obj: BoardObject): { x: number; y: number } {
  return {
    x: obj.x + obj.width / 2,
    y: obj.y + obj.height / 2,
  };
}

/**
 * Get object corners (accounting for rotation)
 */
export function getObjectCorners(obj: BoardObject): Array<{ x: number; y: number }> {
  const center = getObjectCenter(obj);
  const corners = [
    { x: obj.x, y: obj.y },
    { x: obj.x + obj.width, y: obj.y },
    { x: obj.x + obj.width, y: obj.y + obj.height },
    { x: obj.x, y: obj.y + obj.height },
  ];

  if (obj.rotation && obj.rotation !== 0) {
    return corners.map((corner) =>
      rotatePoint(corner.x, corner.y, center.x, center.y, obj.rotation || 0)
    );
  }

  return corners;
}

/**
 * Check if two objects overlap
 */
/**
 * Check if a point (relative to rectangle) is near the edges
 */
export function isPointNearEdges(
  x: number, // Position relative au rectangle (0 à width)
  y: number, // Position relative au rectangle (0 à height)
  width: number,
  height: number,
  threshold: number = 30 // Distance en pixels depuis les bords
): boolean {
  return (
    x < threshold || 
    x > width - threshold || 
    y < threshold || 
    y > height - threshold
  );
}

export function objectsOverlap(obj1: BoardObject, obj2: BoardObject): boolean {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

/**
 * Get intersection point of two lines
 */
export function lineIntersection(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): { x: number; y: number } | null {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (denom === 0) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }

  return null;
}

/**
 * Snap rotation to increments (e.g., 15 degrees)
 */
export function snapRotation(angle: number, increment: number = 15): number {
  return Math.round(angle / increment) * increment;
}


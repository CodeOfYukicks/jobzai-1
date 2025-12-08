import { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { flushSync, createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Trash2,
  Edit3,
  Type,
  Palette,
} from 'lucide-react';
import { WhiteboardDocument } from '../../types/whiteboardDoc';

const TAG_COLORS = [
  { id: 'red', color: '#EF4444', label: 'Red' },
  { id: 'orange', color: '#F97316', label: 'Orange' },
  { id: 'yellow', color: '#EAB308', label: 'Yellow' },
  { id: 'green', color: '#22C55E', label: 'Green' },
  { id: 'blue', color: '#3B82F6', label: 'Blue' },
  { id: 'purple', color: '#A855F7', label: 'Purple' },
  { id: 'gray', color: '#6B7280', label: 'Gray' },
];

interface WhiteboardPreviewCardProps {
  whiteboard: WhiteboardDocument;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onUpdateTags?: (id: string, tags: string[]) => void;
  compact?: boolean;
  draggable?: boolean;
}

function formatDateString(dateInput: any): string {
  if (!dateInput) return 'Unknown date';

  try {
    let date: Date;

    if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      return 'Unknown date';
    }

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
}

/**
 * Checks if a whiteboard has content by examining thumbnailUrl and snapshot
 * @param whiteboard - The whiteboard document to check
 * @returns true if the whiteboard has content (thumbnail or shapes in snapshot), false otherwise
 */
/**
 * Extracts shapes from tldraw snapshot for preview rendering
 */
function extractShapesFromSnapshot(snapshot: any): Array<{
  id: string;
  typeName: string;
  x: number;
  y: number;
  props: any;
}> {
  try {
    let records: Record<string, any> | null = null;
    
    if (snapshot?.store && typeof snapshot.store === 'object') {
      records = snapshot.store;
    } else if (snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)) {
      records = snapshot;
    }

    if (!records) {
      return [];
    }

    const shapes: Array<{
      id: string;
      typeName: string;
      x: number;
      y: number;
      props: any;
    }> = [];

    Object.keys(records).forEach(key => {
      const record = records![key];
      if (!record || typeof record !== 'object') return;
      
      // Skip system records
      if (key.startsWith('instance:') || 
          key.startsWith('document:') ||
          key.startsWith('page_state:') ||
          key.startsWith('camera:') ||
          key.startsWith('pointer:') ||
          key.startsWith('presence:') ||
          key === 'version' ||
          key === 'schema') {
        return;
      }

      // Check if it's a shape record - tldraw shapes have typeName property
      const typeName = record.typeName || record.type;
      
      // Accept any record that starts with 'shape:' or has a typeName that indicates it's a shape
      const isShape = key.startsWith('shape:') || 
                      (typeName && typeof typeName === 'string' && 
                       ['geo', 'arrow', 'draw', 'text', 'note', 'frame', 'group', 'image', 'video', 'embed', 'bookmark', 'highlight', 'line'].includes(typeName));
      
      if (isShape) {
        const props = record.props || {};
        
        // Extract position - tldraw shapes store position in props.x and props.y
        // But they might also be in the record directly or in a different format
        let x = props.x ?? record.x ?? 0;
        let y = props.y ?? record.y ?? 0;
        
        // Some shapes might have position in a point object
        if (props.point && typeof props.point === 'object') {
          x = props.point.x ?? x;
          y = props.point.y ?? y;
        }
        
        // Extract dimensions - tldraw shapes store dimensions in props.w and props.h
        let w = props.w ?? props.width ?? record.width ?? 100;
        let h = props.h ?? props.height ?? record.height ?? 100;
        
        // Some shapes might have size in a size object
        if (props.size && typeof props.size === 'object') {
          w = props.size.w ?? props.size.width ?? w;
          h = props.size.h ?? props.size.height ?? h;
        }
        
        // Ensure minimum dimensions
        w = Math.max(20, w);
        h = Math.max(20, h);
        
        // Only add if we have valid coordinates (even if 0,0 is valid)
        if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
          shapes.push({
            id: key,
            typeName: typeName || 'geo',
            x,
            y,
            props: {
              ...props,
              w,
              h,
            }
          });
        }
      }
    });

    // Debug: log all record keys to understand structure
    if (process.env.NODE_ENV === 'development' && shapes.length === 0) {
      const allKeys = Object.keys(records);
      const nonSystemKeys = allKeys.filter(key => 
        !key.startsWith('instance:') && 
        !key.startsWith('document:') &&
        !key.startsWith('page_state:') &&
        !key.startsWith('camera:') &&
        !key.startsWith('pointer:') &&
        !key.startsWith('presence:') &&
        key !== 'version' &&
        key !== 'schema'
      );
      console.log('[WhiteboardPreview] No shapes found. Record keys:', nonSystemKeys.slice(0, 10));
      if (nonSystemKeys.length > 0) {
        console.log('[WhiteboardPreview] Sample record:', nonSystemKeys[0], records[nonSystemKeys[0]]);
      }
    }

    // Debug log
    if (process.env.NODE_ENV === 'development' && shapes.length > 0) {
      console.log('[WhiteboardPreview] Extracted shapes:', shapes.length, shapes.slice(0, 3));
    }

    return shapes;
  } catch (error) {
    console.warn('Error extracting shapes from snapshot:', error);
    return [];
  }
}

/**
 * Renders a preview of whiteboard content as SVG
 * Returns the SVG as a string for dangerouslySetInnerHTML
 */
function renderWhiteboardPreview(
  shapes: Array<{ id: string; typeName: string; x: number; y: number; props: any }>,
  width: number,
  height: number
): string | null {
  if (shapes.length === 0) {
    return '';
  }

  // Calculate bounds to center the preview
  const validShapes = shapes.filter(s => typeof s.x === 'number' && typeof s.y === 'number');
  if (validShapes.length === 0) {
    return '';
  }

  const minX = Math.min(...validShapes.map(s => s.x), 0);
  const minY = Math.min(...validShapes.map(s => s.y), 0);
  const maxX = Math.max(...validShapes.map(s => s.x + (s.props.w || 100)), width);
  const maxY = Math.max(...validShapes.map(s => s.y + (s.props.h || 100)), height);
  
  const contentWidth = maxX - minX || width;
  const contentHeight = maxY - minY || height;
  const scale = Math.min(width / Math.max(contentWidth, 100), height / Math.max(contentHeight, 100), 0.7);
  const offsetX = (width - contentWidth * scale) / 2 - minX * scale;
  const offsetY = (height - contentHeight * scale) / 2 - minY * scale;

  const svgElements: string[] = [];
  const uniqueId = `arrowhead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  validShapes.slice(0, 15).forEach((shape, index) => { // Limit to 15 shapes for performance
    const x = (shape.x * scale) + offsetX;
    const y = (shape.y * scale) + offsetY;
    const w = Math.max(10, (shape.props.w || 100) * scale);
    const h = Math.max(10, (shape.props.h || 100) * scale);
    
    // Use colors from props or default amber colors
    const fill = shape.props.fill || shape.props.color || '#fef3c7';
    const stroke = shape.props.stroke || shape.props.color || '#f59e0b';
    const strokeWidth = Math.max(1, (shape.props.strokeWidth || 2) * scale);

    switch (shape.typeName) {
      case 'geo':
        // Check if it's a rectangle or circle based on props
        if (shape.props.geo === 'ellipse' || shape.props.geo === 'circle') {
          const radius = Math.min(w, h) / 2;
          svgElements.push(
            `<circle cx="${x + w/2}" cy="${y + h/2}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
          );
        } else {
          svgElements.push(
            `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="4"/>`
          );
        }
        break;
      case 'rectangle':
        svgElements.push(
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="4"/>`
        );
        break;
      case 'circle':
      case 'ellipse':
        const radius = Math.min(w, h) / 2;
        svgElements.push(
          `<circle cx="${x + w/2}" cy="${y + h/2}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
        );
        break;
      case 'arrow':
        svgElements.push(
          `<line x1="${x}" y1="${y + h/2}" x2="${x + w}" y2="${y + h/2}" stroke="${stroke}" stroke-width="${strokeWidth}" marker-end="url(#${uniqueId})"/>`
        );
        break;
      case 'draw':
        // Simple curved line representation for draw shapes
        const midX = x + w / 2;
        const midY = y + h / 2;
        svgElements.push(
          `<path d="M ${x} ${y} Q ${midX} ${midY} ${x + w} ${y + h}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none"/>`
        );
        break;
      case 'text':
        const text = (shape.props.text || 'Text').substring(0, 15);
        svgElements.push(
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="2"/>`,
          `<text x="${x + w/2}" y="${y + h/2}" font-size="${Math.max(8, Math.min(h * 0.4, 12))}" fill="${stroke}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif">${text}</text>`
        );
        break;
      case 'note':
      case 'frame':
        svgElements.push(
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="4"/>`
        );
        break;
      default:
        // Default rectangle for unknown shapes
        svgElements.push(
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="2"/>`
        );
    }
  });

  if (svgElements.length === 0) {
    return null;
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="display: block;">
      <defs>
        <marker id="${uniqueId}" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="${stroke || '#f59e0b'}"/>
        </marker>
      </defs>
      ${svgElements.join('')}
    </svg>
  `;
}

function hasWhiteboardContent(whiteboard: WhiteboardDocument): boolean {
  // If thumbnail exists, whiteboard definitely has content
  if (whiteboard.thumbnailUrl) {
    return true;
  }

  // If no snapshot, whiteboard is empty
  if (!whiteboard.snapshot) {
    return false;
  }

  // If snapshot is a string, check if it's not empty
  if (typeof whiteboard.snapshot === 'string') {
    const trimmed = whiteboard.snapshot.trim();
    // Empty string, empty object, or just whitespace
    if (!trimmed || trimmed === '{}' || trimmed === 'null' || trimmed === '') {
      return false;
    }
  }

  // Try to parse snapshot and check for shapes
  try {
    const snapshot = typeof whiteboard.snapshot === 'string' 
      ? JSON.parse(whiteboard.snapshot) 
      : whiteboard.snapshot;
    
    // If parsed snapshot is null or empty object, it's empty
    if (!snapshot || (typeof snapshot === 'object' && Object.keys(snapshot).length === 0)) {
      return false;
    }

    // tldraw snapshot structure: { store: { [recordId]: record, ... } }
    // Or direct store: { [recordId]: record, ... }
    
    let records: Record<string, any> | null = null;
    
    // Check if snapshot has a store property (most common structure)
    if (snapshot?.store && typeof snapshot.store === 'object') {
      records = snapshot.store;
    } 
    // Check if snapshot itself is a store (direct structure)
    else if (snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)) {
      records = snapshot;
    }

    if (!records) {
      return false;
    }

    const recordKeys = Object.keys(records);
    
    // A completely empty tldraw whiteboard typically has only:
    // - page:page:page (the default page)
    // - instance:instance:instance (the instance state)
    // So if we have more than 2 records, there's likely content
    
    // Filter out system/metadata records
    const systemRecordPrefixes = [
      'instance:',
      'document:',
      'page_state:',
      'camera:',
      'pointer:',
      'presence:',
    ];
    
    const contentKeys = recordKeys.filter(key => {
      // Skip system records
      if (systemRecordPrefixes.some(prefix => key.startsWith(prefix))) {
        return false;
      }
      // Skip version and other metadata
      if (key === 'version' || key === 'schema') {
        return false;
      }
      return true;
    });

    // If we have any content keys beyond system records, there's content
    if (contentKeys.length > 0) {
      return true;
    }

    // Fallback: if we have more records than just the basic system ones, likely has content
    // This handles edge cases where content might be stored differently
    if (recordKeys.length > 2) {
      // Check if any record looks like a shape
      return recordKeys.some(key => {
        const record = records[key];
        if (!record || typeof record !== 'object') return false;
        
        // Check for shape indicators
        const typeName = record.typeName || record.type;
        if (typeName && typeof typeName === 'string') {
          // Known tldraw shape types
          const shapeTypes = ['geo', 'arrow', 'draw', 'text', 'note', 'frame', 'group', 'image', 'video', 'embed', 'bookmark', 'highlight', 'line'];
          if (shapeTypes.includes(typeName)) {
            return true;
          }
        }
        
        // Check if key starts with 'shape:' (tldraw shape ID format)
        if (key.startsWith('shape:')) {
          return true;
        }
        
        // Check if record has shape-like properties
        if (record.props && typeof record.props === 'object' && Object.keys(record.props).length > 0) {
          return true;
        }
        
        return false;
      });
    }

    return false;
  } catch (error) {
    // If parsing fails, assume empty (graceful degradation)
    console.warn('Error parsing whiteboard snapshot:', error, whiteboard.id);
    return false;
  }
}

const WhiteboardPreviewCard = memo(
  ({
    whiteboard,
    onDelete,
    onEdit,
    onRename,
    onUpdateTags,
    compact = false,
    draggable = true,
  }: WhiteboardPreviewCardProps) => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newTitle, setNewTitle] = useState(whiteboard.title);
    const [contextMenu, setContextMenu] = useState<{
      open: boolean;
      x: number;
      y: number;
    }>({ open: false, x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Card dimensions
    const targetWidth = compact ? 140 : 220;
    const scaledHeight = compact ? 180 : 280;

    // Extract shapes from snapshot for preview
    const previewShapes = useMemo(() => {
      if (!whiteboard.snapshot) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[WhiteboardPreview] No snapshot for:', whiteboard.id);
        }
        return [];
      }
      try {
        const snapshot = typeof whiteboard.snapshot === 'string' 
          ? JSON.parse(whiteboard.snapshot) 
          : whiteboard.snapshot;
        const shapes = extractShapesFromSnapshot(snapshot);
        if (process.env.NODE_ENV === 'development') {
          console.log('[WhiteboardPreview] Extracted shapes for', whiteboard.id, ':', shapes.length);
        }
        return shapes;
      } catch (error) {
        console.warn('[WhiteboardPreview] Error parsing snapshot:', error, whiteboard.id);
        return [];
      }
    }, [whiteboard.snapshot, whiteboard.id]);

    // Generate preview SVG
    const previewSvg = useMemo(() => {
      if (previewShapes.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[WhiteboardPreview] No shapes to render for:', whiteboard.id);
        }
        return null;
      }
      const svg = renderWhiteboardPreview(previewShapes, targetWidth, scaledHeight);
      if (process.env.NODE_ENV === 'development') {
        console.log('[WhiteboardPreview] Generated SVG for:', whiteboard.id, 'length:', svg?.length);
      }
      return svg;
    }, [previewShapes, targetWidth, scaledHeight, whiteboard.id]);

    const handleEdit = useCallback(() => {
      onEdit(whiteboard.id);
    }, [whiteboard.id, onEdit]);

    const confirmDelete = useCallback(() => {
      onDelete(whiteboard.id);
      setIsDeleteDialogOpen(false);
    }, [whiteboard.id, onDelete]);

    const handleRename = useCallback(() => {
      if (onRename && newTitle.trim() && newTitle !== whiteboard.title) {
        onRename(whiteboard.id, newTitle.trim());
      }
      setIsRenaming(false);
    }, [whiteboard.id, whiteboard.title, newTitle, onRename]);

    const handleToggleTag = useCallback((colorId: string) => {
      if (!onUpdateTags) return;
      
      const currentTags = whiteboard.tags || [];
      const newTags = currentTags.includes(colorId)
        ? currentTags.filter(t => t !== colorId)
        : [...currentTags, colorId];
        
      onUpdateTags(whiteboard.id, newTags);
    }, [whiteboard.id, whiteboard.tags, onUpdateTags]);

    const handleTitleClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (onRename) {
        setIsRenaming(true);
        setNewTitle(whiteboard.title);
      }
    }, [onRename, whiteboard.title]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const x = e.clientX;
      const y = e.clientY;

      const menuWidth = 160;
      const menuHeight = 120;
      const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
      const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

      setContextMenu({ open: true, x: adjustedX, y: adjustedY });
    }, []);

    const closeContextMenu = useCallback(() => {
      setContextMenu((prev) => ({ ...prev, open: false }));
    }, []);

    useEffect(() => {
      if (!contextMenu.open) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          contextMenuRef.current &&
          !contextMenuRef.current.contains(e.target as Node)
        ) {
          closeContextMenu();
        }
      };

      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('contextmenu', closeContextMenu, true);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
        document.removeEventListener('contextmenu', closeContextMenu, true);
      };
    }, [contextMenu.open, closeContextMenu]);

    useEffect(() => {
      if (isRenaming && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isRenaming]);

    const handleDragStart = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('text/plain', whiteboard.id);
        e.dataTransfer.setData('application/x-whiteboard-id', whiteboard.id);
        e.dataTransfer.effectAllowed = 'move';

        const dragImage = document.createElement('div');
        dragImage.style.cssText = `
        width: 80px;
        height: 100px;
        background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        position: absolute;
        top: -1000px;
        left: -1000px;
      `;
        dragImage.textContent = whiteboard.emoji || '🎨';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 40, 50);

        setTimeout(() => {
          if (document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
          }
        }, 100);
      },
      [whiteboard.id, whiteboard.emoji]
    );

    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          y: -8,
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        }}
        className="group relative flex flex-col items-center p-4 rounded-xl transition-all duration-300 cursor-pointer"
        onClick={handleEdit}
        onContextMenu={handleContextMenu}
        draggable={draggable}
        onDragStart={draggable ? handleDragStart : undefined}
      >
        {/* Whiteboard Preview Card */}
        <div
          className="relative mb-4"
          style={{
            width: `${targetWidth}px`,
            height: `${scaledHeight}px`,
          }}
        >
          {/* Amber Glow Effect */}
          <div
            className="absolute -inset-4 rounded-lg opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500 -z-30"
            style={{
              background:
                'radial-gradient(circle at center, rgba(245, 158, 11, 0.25), transparent 70%)',
            }}
          />

          {/* Stack effect layers */}
          <div className="absolute top-0 left-0 w-full h-full bg-white/80 dark:bg-[#3d3c3e]/80 rounded-lg transform translate-y-1.5 translate-x-1.5 opacity-0 group-hover:opacity-60 transition-all duration-300 -z-10 shadow-sm" />
          <div className="absolute top-0 left-0 w-full h-full bg-white/60 dark:bg-[#4a494b]/60 rounded-lg transform translate-y-3 translate-x-3 opacity-0 group-hover:opacity-40 transition-all duration-300 -z-20 shadow-sm" />

          <div className="relative w-full h-full bg-white dark:bg-[#242325] shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)] transition-all duration-300 overflow-hidden rounded-lg ring-1 ring-black/5 group-hover:ring-amber-500/20 flex flex-col">
            {/* Thumbnail or Placeholder */}
            {hasWhiteboardContent(whiteboard) ? (
              whiteboard.thumbnailUrl ? (
                <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#2b2a2c]">
                  <img
                    src={whiteboard.thumbnailUrl}
                    alt="Whiteboard preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : previewSvg ? (
                <div className="flex-1 overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-yellow-900/10 relative">
                  {/* Grid pattern */}
                  <div 
                    className="absolute inset-0 opacity-30 dark:opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgb(203 213 225 / 0.5) 1px, transparent 1px),
                        linear-gradient(to bottom, rgb(203 213 225 / 0.5) 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px',
                    }}
                  />
                  {/* SVG Preview */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: previewSvg }}
                    style={{ zIndex: 10 }}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-yellow-900/10">
                  {/* Grid pattern */}
                  <div 
                    className="absolute inset-0 opacity-30 dark:opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgb(203 213 225 / 0.5) 1px, transparent 1px),
                        linear-gradient(to bottom, rgb(203 213 225 / 0.5) 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px',
                    }}
                  />
                  <span className="text-5xl mb-2 relative z-10">{whiteboard.emoji || '🎨'}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium relative z-10">
                    Whiteboard with content
                  </span>
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-yellow-900/10">
                {/* Grid pattern */}
                <div 
                  className="absolute inset-0 opacity-30 dark:opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgb(203 213 225 / 0.5) 1px, transparent 1px),
                      linear-gradient(to bottom, rgb(203 213 225 / 0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                  }}
                />
                <span className="text-5xl mb-2 relative z-10">{whiteboard.emoji || '🎨'}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium relative z-10">
                  Empty whiteboard
                </span>
              </div>
            )}

            {/* Whiteboard badge */}
            <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-bold rounded shadow-lg">
              BOARD
            </div>

            {/* Emoji badge */}
            {hasWhiteboardContent(whiteboard) && !whiteboard.thumbnailUrl && (
              <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-white/90 dark:bg-[#242325]/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <span className="text-lg">{whiteboard.emoji || '🎨'}</span>
              </div>
            )}

            {/* Glass Action Bar - Appears on hover */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <div className="flex items-center gap-1 px-2 py-1.5 bg-white/95 dark:bg-[#242325]/95 backdrop-blur-xl rounded-full shadow-xl border border-black/5 dark:border-white/10">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full transition-all"
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </motion.button>
                <div className="w-px h-3 bg-gray-200 dark:bg-[#3d3c3e]" />
                {onRename && (
                  <>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsRenaming(true);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                      title="Rename"
                    >
                      <Type className="w-3.5 h-3.5" />
                    </motion.button>
                    <div className="w-px h-3 bg-gray-200 dark:bg-[#3d3c3e]" />
                  </>
                )}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="w-full flex flex-col items-center gap-1">
          {/* Tags Display */}
          {whiteboard.tags && whiteboard.tags.length > 0 && (
            <div className="flex items-center gap-1 mb-1">
              {whiteboard.tags.map(tagId => {
                const tagColor = TAG_COLORS.find(t => t.id === tagId)?.color;
                if (!tagColor) return null;
                return (
                  <div
                    key={tagId}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tagColor }}
                    title={TAG_COLORS.find(t => t.id === tagId)?.label}
                  />
                );
              })}
            </div>
          )}

          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
                if (e.key === 'Escape') {
                  setNewTitle(whiteboard.title);
                  setIsRenaming(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-gray-900 dark:text-white text-center 
                bg-transparent border-b-2 border-amber-500 outline-none w-full max-w-[180px]"
            />
          ) : (
            <h3
              className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px] text-center cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              title={whiteboard.title}
              onClick={handleTitleClick}
            >
              {whiteboard.title || 'Untitled Whiteboard'}
            </h3>
          )}

          {!compact && (
            <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDateString(whiteboard.updatedAt || whiteboard.createdAt)}
              </span>
            </div>
          )}
        </div>

        {/* Context Menu */}
        {contextMenu.open &&
          typeof window !== 'undefined' &&
          document?.body &&
          createPortal(
            <div
              ref={contextMenuRef}
              className="fixed z-[9999] bg-white dark:bg-[#2b2a2c] rounded-xl shadow-2xl
              border border-gray-200 dark:border-[#3d3c3e] py-1.5 min-w-[160px]"
              style={{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {onUpdateTags && (
                <>
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-[#3d3c3e]">
                    <div className="flex items-center justify-between gap-1">
                      {TAG_COLORS.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleToggleTag(tag.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className={`w-4 h-4 rounded-full transition-transform hover:scale-110 flex items-center justify-center
                            ${whiteboard.tags?.includes(tag.id) ? 'ring-1 ring-offset-1 ring-gray-400 dark:ring-gray-500' : ''}`}
                          style={{ backgroundColor: tag.color }}
                          title={tag.label}
                        >
                          {whiteboard.tags?.includes(tag.id) && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  closeContextMenu();
                  handleEdit();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200
                hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 flex items-center gap-3 transition-colors"
              >
                <Palette className="w-4 h-4 text-amber-500" />
                Open Whiteboard
              </button>
              {onRename && (
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    closeContextMenu();
                    setIsRenaming(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200
                  hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 flex items-center gap-3 transition-colors"
                >
                  <Type className="w-4 h-4 text-blue-500" />
                  Rename
                </button>
              )}
              <div className="my-1 border-t border-gray-100 dark:border-[#3d3c3e]" />
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  closeContextMenu();
                  setIsDeleteDialogOpen(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>,
            document.body
          )}

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {isDeleteDialogOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsDeleteDialogOpen(false);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-[#2b2a2c] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-[#3d3c3e]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Delete Whiteboard?
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 bg-gray-50 dark:bg-[#242325]/50 rounded-lg p-3">
                  "{whiteboard.title || 'Untitled Whiteboard'}" will be permanently deleted.
                </p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                    hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 
                    rounded-lg transition-colors shadow-lg shadow-red-600/25"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

WhiteboardPreviewCard.displayName = 'WhiteboardPreviewCard';

export default WhiteboardPreviewCard;
export type { WhiteboardPreviewCardProps };


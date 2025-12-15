/**
 * Helper functions for creating tldraw shapes programmatically
 * Used by the AI assistant to add content to whiteboards
 */

import { createShapeId, toRichText, Editor, TLShapeId } from 'tldraw';
import { 
  MindMapStructure, 
  MindMapBranch, 
  FlowDiagramNode, 
  FlowDiagramConnection,
  WhiteboardPosition 
} from '../contexts/AssistantContext';
import { 
  calculateMindMapLayout, 
  calculateStickyNotesLayout, 
  calculateFlowDiagramLayout,
  GeneratedStickyNote 
} from './whiteboardAI';

// Color mapping for tldraw
type TldrawColor = 'black' | 'grey' | 'light-violet' | 'violet' | 'blue' | 'light-blue' | 'yellow' | 'orange' | 'green' | 'light-green' | 'light-red' | 'red';

const colorMap: Record<string, TldrawColor> = {
  yellow: 'yellow',
  blue: 'blue',
  green: 'green',
  orange: 'orange',
  red: 'red',
  violet: 'violet',
  purple: 'violet',
  grey: 'grey',
  gray: 'grey',
  black: 'black',
};

/**
 * Get viewport center from editor
 */
export function getViewportCenter(editor: Editor): WhiteboardPosition {
  const viewport = editor.getViewportPageBounds();
  return {
    x: viewport.x + viewport.width / 2,
    y: viewport.y + viewport.height / 2
  };
}

/**
 * Create a single sticky note
 */
export function createStickyNote(
  editor: Editor,
  text: string,
  color: string = 'yellow',
  position?: WhiteboardPosition
): TLShapeId {
  const center = position || getViewportCenter(editor);
  const noteId = createShapeId();
  
  editor.createShapes([{
    id: noteId,
    type: 'note',
    x: center.x - 100, // Center the note
    y: center.y - 100,
    props: {
      richText: toRichText(text),
      color: colorMap[color] || 'yellow',
      size: 'm',
    },
  }]);
  
  return noteId;
}

/**
 * Create a text box
 */
export function createTextBox(
  editor: Editor,
  text: string,
  position?: WhiteboardPosition
): TLShapeId {
  const center = position || getViewportCenter(editor);
  const textId = createShapeId();
  
  editor.createShapes([{
    id: textId,
    type: 'text',
    x: center.x - 100,
    y: center.y - 20,
    props: {
      text: text,
      size: 'm',
      color: 'black',
    },
  }]);
  
  return textId;
}

/**
 * Create a frame
 */
export function createFrame(
  editor: Editor,
  title: string,
  bounds?: { x: number; y: number; width: number; height: number }
): TLShapeId {
  const center = getViewportCenter(editor);
  const frameId = createShapeId();
  
  const x = bounds?.x ?? center.x - 200;
  const y = bounds?.y ?? center.y - 150;
  const w = bounds?.width ?? 400;
  const h = bounds?.height ?? 300;
  
  editor.createShapes([{
    id: frameId,
    type: 'frame',
    x,
    y,
    props: {
      w,
      h,
      name: title,
    },
  }]);
  
  return frameId;
}

/**
 * Create an arrow between two points
 */
export function createArrow(
  editor: Editor,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string = 'grey'
): TLShapeId {
  const arrowId = createShapeId();
  
  editor.createShapes([{
    id: arrowId,
    type: 'arrow',
    x: startX,
    y: startY,
    props: {
      start: { x: 0, y: 0 },
      end: { x: endX - startX, y: endY - startY },
      arrowheadEnd: 'arrow',
      color: colorMap[color] || 'grey',
      size: 'm',
      fill: 'none',
    },
  }]);
  
  return arrowId;
}

/**
 * Create multiple sticky notes in a grid layout
 */
export function createStickyNotes(
  editor: Editor,
  notes: GeneratedStickyNote[],
  center?: WhiteboardPosition
): TLShapeId[] {
  const viewportCenter = center || getViewportCenter(editor);
  const positions = calculateStickyNotesLayout(notes.length, viewportCenter);
  
  const shapes = notes.map((note, index) => {
    const noteId = createShapeId();
    return {
      id: noteId,
      type: 'note' as const,
      x: positions[index].x,
      y: positions[index].y,
      props: {
        richText: toRichText(note.text),
        color: colorMap[note.color] || 'yellow',
        size: 'm' as const,
      },
    };
  });
  
  editor.createShapes(shapes);
  
  return shapes.map(s => s.id);
}

/**
 * Create a mind map from a structure
 */
export function createMindMap(
  editor: Editor,
  structure: MindMapStructure,
  center?: WhiteboardPosition
): TLShapeId[] {
  const viewportCenter = center || getViewportCenter(editor);
  const noteWidth = 200;
  const noteHeight = 100;
  const childNoteWidth = 180;
  const childNoteHeight = 80;
  
  const layout = calculateMindMapLayout(structure, viewportCenter, noteWidth, noteHeight);
  const createdIds: TLShapeId[] = [];
  const shapes: any[] = [];
  
  // Create frame for the entire mind map
  const frameId = createShapeId();
  const framePadding = 100;
  const frameRadius = 450; // A bit larger than the branch radius
  shapes.push({
    id: frameId,
    type: 'frame',
    x: viewportCenter.x - frameRadius - framePadding,
    y: viewportCenter.y - frameRadius - framePadding,
    props: {
      w: (frameRadius + framePadding) * 2,
      h: (frameRadius + framePadding) * 2,
      name: structure.centerTopic,
    },
  });
  createdIds.push(frameId);
  
  // Create center topic note
  const centerId = createShapeId();
  shapes.push({
    id: centerId,
    type: 'note',
    x: layout.centerPosition.x,
    y: layout.centerPosition.y,
    props: {
      richText: toRichText(`🎯 ${structure.centerTopic}`),
      color: 'yellow',
      size: 'l',
    },
  });
  createdIds.push(centerId);
  
  // Create branches and their children
  structure.branches.forEach((branch, branchIndex) => {
    const branchPosition = layout.branchPositions[branchIndex];
    const branchId = createShapeId();
    
    // Create branch note
    shapes.push({
      id: branchId,
      type: 'note',
      x: branchPosition.x,
      y: branchPosition.y,
      props: {
        richText: toRichText(branch.text),
        color: colorMap[branch.color || 'blue'] || 'blue',
        size: 'm',
      },
    });
    createdIds.push(branchId);
    
    // Create arrow from center to branch
    const arrowId = createShapeId();
    const centerNoteCenter = {
      x: layout.centerPosition.x + noteWidth / 2,
      y: layout.centerPosition.y + noteHeight / 2,
    };
    const branchNoteCenter = {
      x: branchPosition.x + noteWidth / 2,
      y: branchPosition.y + noteHeight / 2,
    };
    
    shapes.push({
      id: arrowId,
      type: 'arrow',
      x: centerNoteCenter.x,
      y: centerNoteCenter.y,
      props: {
        start: { x: 0, y: 0 },
        end: { 
          x: branchNoteCenter.x - centerNoteCenter.x, 
          y: branchNoteCenter.y - centerNoteCenter.y 
        },
        arrowheadEnd: 'arrow',
        color: 'grey',
        size: 'm',
        fill: 'none',
      },
    });
    createdIds.push(arrowId);
    
    // Create children notes for this branch
    if (branch.children && branch.children.length > 0) {
      const childRadius = 150;
      const childAngleSpread = Math.PI / 3; // 60 degrees spread for children
      const baseAngle = branchPosition.angle;
      const childAngleStep = childAngleSpread / Math.max(branch.children.length - 1, 1);
      const childStartAngle = baseAngle - childAngleSpread / 2;
      
      branch.children.forEach((child, childIndex) => {
        const childAngle = branch.children!.length === 1 
          ? baseAngle 
          : childStartAngle + childIndex * childAngleStep;
        
        const childX = branchPosition.x + noteWidth / 2 + Math.cos(childAngle) * childRadius - childNoteWidth / 2;
        const childY = branchPosition.y + noteHeight / 2 + Math.sin(childAngle) * childRadius - childNoteHeight / 2;
        
        const childId = createShapeId();
        shapes.push({
          id: childId,
          type: 'note',
          x: childX,
          y: childY,
          props: {
            richText: toRichText(child.text),
            color: colorMap[branch.color || 'blue'] || 'blue',
            size: 's',
          },
        });
        createdIds.push(childId);
        
        // Arrow from branch to child
        const childArrowId = createShapeId();
        const branchCenter = {
          x: branchPosition.x + noteWidth / 2,
          y: branchPosition.y + noteHeight / 2,
        };
        const childCenter = {
          x: childX + childNoteWidth / 2,
          y: childY + childNoteHeight / 2,
        };
        
        shapes.push({
          id: childArrowId,
          type: 'arrow',
          x: branchCenter.x,
          y: branchCenter.y,
          props: {
            start: { x: 0, y: 0 },
            end: { 
              x: childCenter.x - branchCenter.x, 
              y: childCenter.y - branchCenter.y 
            },
            arrowheadEnd: 'arrow',
            color: 'light-blue',
            size: 's',
            fill: 'none',
          },
        });
        createdIds.push(childArrowId);
      });
    }
  });
  
  // Create all shapes at once
  editor.createShapes(shapes);
  
  // Try to reparent all shapes to frame
  try {
    const shapesToReparent = createdIds.filter(id => id !== frameId);
    editor.reparentShapes(shapesToReparent, frameId);
  } catch (e) {
    console.warn('[TLDRAW] Could not reparent mind map shapes to frame:', e);
  }
  
  // Select and zoom to fit
  editor.setSelectedShapes(createdIds);
  editor.zoomToFit();
  
  return createdIds;
}

/**
 * Create a flow diagram from nodes and connections
 */
export function createFlowDiagram(
  editor: Editor,
  nodes: FlowDiagramNode[],
  connections: FlowDiagramConnection[],
  center?: WhiteboardPosition
): TLShapeId[] {
  const viewportCenter = center || getViewportCenter(editor);
  const nodeWidth = 200;
  const nodeHeight = 80;
  
  const positions = calculateFlowDiagramLayout(nodes, viewportCenter, nodeWidth, nodeHeight);
  const createdIds: TLShapeId[] = [];
  const shapes: any[] = [];
  const nodeIdMap = new Map<string, TLShapeId>();
  
  // Calculate frame bounds
  const allY = nodes.map((_, i) => positions.get(nodes[i].id)?.y || 0);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY) + nodeHeight;
  const framePadding = 50;
  
  // Create frame
  const frameId = createShapeId();
  shapes.push({
    id: frameId,
    type: 'frame',
    x: viewportCenter.x - nodeWidth / 2 - framePadding,
    y: minY - framePadding,
    props: {
      w: nodeWidth + framePadding * 2,
      h: maxY - minY + framePadding * 2,
      name: 'Flow Diagram',
    },
  });
  createdIds.push(frameId);
  
  // Create nodes
  nodes.forEach((node) => {
    const pos = positions.get(node.id);
    if (!pos) return;
    
    const shapeId = createShapeId();
    nodeIdMap.set(node.id, shapeId);
    
    // Choose shape type and color based on node type
    let color: TldrawColor = 'blue';
    let emoji = '';
    
    switch (node.type) {
      case 'start':
        color = 'green';
        emoji = '▶️ ';
        break;
      case 'end':
        color = 'red';
        emoji = '🏁 ';
        break;
      case 'decision':
        color = 'orange';
        emoji = '❓ ';
        break;
      case 'process':
      default:
        color = 'blue';
        emoji = '⚙️ ';
        break;
    }
    
    shapes.push({
      id: shapeId,
      type: 'note',
      x: pos.x,
      y: pos.y,
      props: {
        richText: toRichText(`${emoji}${node.text}`),
        color,
        size: 'm',
      },
    });
    createdIds.push(shapeId);
  });
  
  // Create all node shapes first
  editor.createShapes(shapes);
  
  // Create connections (arrows)
  const arrowShapes: any[] = [];
  connections.forEach((conn) => {
    const fromPos = positions.get(conn.from);
    const toPos = positions.get(conn.to);
    if (!fromPos || !toPos) return;
    
    const arrowId = createShapeId();
    const startX = fromPos.x + nodeWidth / 2;
    const startY = fromPos.y + nodeHeight;
    const endX = toPos.x + nodeWidth / 2;
    const endY = toPos.y;
    
    arrowShapes.push({
      id: arrowId,
      type: 'arrow',
      x: startX,
      y: startY,
      props: {
        start: { x: 0, y: 0 },
        end: { x: endX - startX, y: endY - startY },
        arrowheadEnd: 'arrow',
        color: 'grey',
        size: 'm',
        fill: 'none',
      },
    });
    createdIds.push(arrowId);
  });
  
  editor.createShapes(arrowShapes);
  
  // Add labels for connections if specified
  connections.forEach((conn) => {
    if (conn.label) {
      const fromPos = positions.get(conn.from);
      const toPos = positions.get(conn.to);
      if (!fromPos || !toPos) return;
      
      const labelId = createShapeId();
      const labelX = (fromPos.x + toPos.x) / 2 + nodeWidth / 2 + 10;
      const labelY = (fromPos.y + nodeHeight + toPos.y) / 2 - 10;
      
      editor.createShapes([{
        id: labelId,
        type: 'text',
        x: labelX,
        y: labelY,
        props: {
          text: conn.label,
          size: 's',
          color: 'grey',
        },
      }]);
      createdIds.push(labelId);
    }
  });
  
  // Try to reparent all shapes to frame
  try {
    const shapesToReparent = createdIds.filter(id => id !== frameId);
    editor.reparentShapes(shapesToReparent, frameId);
  } catch (e) {
    console.warn('[TLDRAW] Could not reparent flow diagram shapes to frame:', e);
  }
  
  // Select and zoom to fit
  editor.setSelectedShapes(createdIds);
  editor.zoomToFit();
  
  return createdIds;
}

/**
 * Get all shape IDs on the current page
 */
export function getShapeIds(editor: Editor): string[] {
  const shapeIds = editor.getCurrentPageShapeIds();
  return [...shapeIds].map(id => id.toString());
}

/**
 * Zoom to fit all content
 */
export function zoomToFit(editor: Editor): void {
  editor.zoomToFit();
}



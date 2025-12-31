/**
 * Helper functions for creating tldraw shapes programmatically
 * Used by the AI assistant to add content to whiteboards
 */

import { createShapeId, Editor, TLShapeId } from 'tldraw';
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
      text: text,
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
 * Create multiple sticky notes in a well-spaced grid layout
 */
export function createStickyNotes(
  editor: Editor,
  notes: GeneratedStickyNote[],
  center?: WhiteboardPosition
): TLShapeId[] {
  const viewportCenter = center || getViewportCenter(editor);
  const positions = calculateStickyNotesLayout(notes.length, viewportCenter);
  const createdIds: TLShapeId[] = [];

  // Create a frame to group all sticky notes
  const frameId = createShapeId();
  const framePadding = 50;

  // Calculate frame bounds from positions
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x)) + 220; // note width
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y)) + 220; // note height

  editor.createShapes([{
    id: frameId,
    type: 'frame',
    x: minX - framePadding,
    y: minY - framePadding,
    props: {
      w: maxX - minX + framePadding * 2,
      h: maxY - minY + framePadding * 2,
      name: 'Notes',
    },
  }]);
  createdIds.push(frameId);

  const noteShapes = notes.map((note, index) => {
    const noteId = createShapeId();
    createdIds.push(noteId);
    return {
      id: noteId,
      type: 'note' as const,
      x: positions[index].x,
      y: positions[index].y,
      props: {
        text: note.text,
        color: colorMap[note.color] || 'yellow',
        size: 'l' as const,
      },
    };
  });

  editor.createShapes(noteShapes);

  // Try to reparent notes to frame
  try {
    const shapesToReparent = createdIds.filter(id => id !== frameId);
    editor.reparentShapes(shapesToReparent, frameId);
  } catch (e) {
    console.warn('[TLDRAW] Could not reparent sticky notes to frame:', e);
  }

  // Select and zoom
  editor.setSelectedShapes(createdIds);
  setTimeout(() => {
    editor.zoomToFit();
  }, 100);

  return createdIds;
}

/**
 * Create a mind map from a structure
 * Uses bound arrows for clean connections between shapes
 */
export function createMindMap(
  editor: Editor,
  structure: MindMapStructure,
  center?: WhiteboardPosition
): TLShapeId[] {
  const viewportCenter = center || getViewportCenter(editor);
  const noteWidth = 220;
  const noteHeight = 120;
  const childNoteWidth = 180;
  const childNoteHeight = 90;

  const layout = calculateMindMapLayout(structure, viewportCenter, noteWidth, noteHeight);
  const createdIds: TLShapeId[] = [];
  const noteShapes: any[] = [];
  const arrowShapes: any[] = [];

  // Create frame for the entire mind map
  const frameId = createShapeId();
  const framePadding = 150;
  const frameRadius = layout.branchRadius + layout.childRadius + 100;
  noteShapes.push({
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
  noteShapes.push({
    id: centerId,
    type: 'note',
    x: layout.centerPosition.x,
    y: layout.centerPosition.y,
    props: {
      text: `🎯 ${structure.centerTopic}`,
      color: 'yellow',
      size: 'xl',
    },
  });
  createdIds.push(centerId);

  // Create branch notes
  structure.branches.forEach((branch, branchIndex) => {
    const branchPosition = layout.branchPositions[branchIndex];
    const branchId = createShapeId();

    noteShapes.push({
      id: branchId,
      type: 'note',
      x: branchPosition.x,
      y: branchPosition.y,
      props: {
        text: branch.text,
        color: colorMap[branch.color || 'blue'] || 'blue',
        size: 'l',
      },
    });
    createdIds.push(branchId);

    // Create children notes for this branch
    if (branch.children && branch.children.length > 0) {
      const childPositions = layout.childPositions.get(branchIndex) || [];

      branch.children.forEach((child, childIndex) => {
        const childPos = childPositions[childIndex];
        if (!childPos) return;

        const childId = createShapeId();

        noteShapes.push({
          id: childId,
          type: 'note',
          x: childPos.x,
          y: childPos.y,
          props: {
            text: child.text,
            color: colorMap[branch.color || 'blue'] || 'blue',
            size: 'm',
          },
        });
        createdIds.push(childId);
      });
    }
  });

  // Create all note shapes first
  editor.createShapes(noteShapes);

  // Now create arrows connecting shapes (point-to-point)
  // Arrows from center to branches
  structure.branches.forEach((branch, branchIndex) => {
    const branchPosition = layout.branchPositions[branchIndex];
    const arrowId = createShapeId();

    // Calculate center points of the notes
    const centerX = layout.centerPosition.x + noteWidth / 2;
    const centerY = layout.centerPosition.y + noteHeight / 2;
    const branchCenterX = branchPosition.x + noteWidth / 2;
    const branchCenterY = branchPosition.y + noteHeight / 2;

    // Calculate direction vector
    const dx = branchCenterX - centerX;
    const dy = branchCenterY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / distance;
    const ny = dy / distance;

    // Offset start and end to be at the edge of the notes (not center)
    const startOffset = noteWidth / 2 + 10; // Start just outside center note
    const endOffset = noteWidth / 2 + 10; // End just outside branch note

    const startX = centerX + nx * startOffset;
    const startY = centerY + ny * startOffset;
    const endX = branchCenterX - nx * endOffset;
    const endY = branchCenterY - ny * endOffset;

    arrowShapes.push({
      id: arrowId,
      type: 'arrow',
      x: startX,
      y: startY,
      props: {
        start: { x: 0, y: 0 },
        end: { x: endX - startX, y: endY - startY },
        arrowheadStart: 'none',
        arrowheadEnd: 'arrow',
        color: colorMap[branch.color || 'grey'] || 'grey',
        size: 'm',
        fill: 'none',
      },
    });
    createdIds.push(arrowId);

    // Arrows from branch to children
    const childPositions = layout.childPositions.get(branchIndex) || [];

    childPositions.forEach((childPos) => {
      const childArrowId = createShapeId();

      const childCenterX = childPos.x + childNoteWidth / 2;
      const childCenterY = childPos.y + childNoteHeight / 2;

      // Calculate direction for child arrow
      const cdx = childCenterX - branchCenterX;
      const cdy = childCenterY - branchCenterY;
      const cDistance = Math.sqrt(cdx * cdx + cdy * cdy);
      const cnx = cdx / cDistance;
      const cny = cdy / cDistance;

      const cStartOffset = noteWidth / 2 + 5;
      const cEndOffset = childNoteWidth / 2 + 5;

      const cStartX = branchCenterX + cnx * cStartOffset;
      const cStartY = branchCenterY + cny * cStartOffset;
      const cEndX = childCenterX - cnx * cEndOffset;
      const cEndY = childCenterY - cny * cEndOffset;

      arrowShapes.push({
        id: childArrowId,
        type: 'arrow',
        x: cStartX,
        y: cStartY,
        props: {
          start: { x: 0, y: 0 },
          end: { x: cEndX - cStartX, y: cEndY - cStartY },
          arrowheadStart: 'none',
          arrowheadEnd: 'arrow',
          color: 'light-blue',
          size: 's',
          fill: 'none',
        },
      });
      createdIds.push(childArrowId);
    });
  });

  // Create all arrow shapes
  editor.createShapes(arrowShapes);

  // Try to reparent all shapes to frame
  try {
    const shapesToReparent = createdIds.filter(id => id !== frameId);
    editor.reparentShapes(shapesToReparent, frameId);
  } catch (e) {
    console.warn('[TLDRAW] Could not reparent mind map shapes to frame:', e);
  }

  // Select and zoom to fit with some padding
  editor.setSelectedShapes(createdIds);
  setTimeout(() => {
    editor.zoomToFit();
    editor.zoomOut(); // Add a bit more space
  }, 100);

  return createdIds;
}

/**
 * Create a flow diagram from nodes and connections
 * Uses bound arrows for clean connections
 */
export function createFlowDiagram(
  editor: Editor,
  nodes: FlowDiagramNode[],
  connections: FlowDiagramConnection[],
  center?: WhiteboardPosition
): TLShapeId[] {
  const viewportCenter = center || getViewportCenter(editor);
  const nodeWidth = 240;
  const nodeHeight = 100;

  const positions = calculateFlowDiagramLayout(nodes, viewportCenter, nodeWidth, nodeHeight);
  const createdIds: TLShapeId[] = [];
  const nodeShapes: any[] = [];

  // Calculate frame bounds
  const allY = nodes.map((_, i) => positions.get(nodes[i].id)?.y || 0);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY) + nodeHeight;
  const framePadding = 80;

  // Create frame
  const frameId = createShapeId();
  nodeShapes.push({
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

    nodeShapes.push({
      id: shapeId,
      type: 'note',
      x: pos.x,
      y: pos.y,
      props: {
        text: `${emoji}${node.text}`,
        color,
        size: 'l',
      },
    });
    createdIds.push(shapeId);
  });

  // Create all node shapes first
  editor.createShapes(nodeShapes);

  // Create connections (arrows) with point-to-point coordinates
  const arrowShapes: any[] = [];
  connections.forEach((conn) => {
    const fromPos = positions.get(conn.from);
    const toPos = positions.get(conn.to);
    if (!fromPos || !toPos) return;

    const arrowId = createShapeId();

    // Arrow from bottom of source to top of target
    const startX = fromPos.x + nodeWidth / 2;
    const startY = fromPos.y + nodeHeight + 5; // Just below the source
    const endX = toPos.x + nodeWidth / 2;
    const endY = toPos.y - 5; // Just above the target

    arrowShapes.push({
      id: arrowId,
      type: 'arrow',
      x: startX,
      y: startY,
      props: {
        start: { x: 0, y: 0 },
        end: { x: endX - startX, y: endY - startY },
        arrowheadStart: 'none',
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
      const labelX = (fromPos.x + toPos.x) / 2 + nodeWidth / 2 + 15;
      const labelY = (fromPos.y + nodeHeight + toPos.y) / 2 - 10;

      editor.createShapes([{
        id: labelId,
        type: 'text',
        x: labelX,
        y: labelY,
        props: {
          text: conn.label,
          size: 'm',
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

  // Select and zoom to fit with padding
  editor.setSelectedShapes(createdIds);
  setTimeout(() => {
    editor.zoomToFit();
    editor.zoomOut();
  }, 100);

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



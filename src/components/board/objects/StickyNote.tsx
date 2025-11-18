import { Group, Rect, Text } from 'react-konva';
import { BoardObject } from '../../../types/whiteboard';
import { useWhiteboardStore } from '../../../stores/whiteboardStore';
import { worldToScreen } from '../utils/canvasUtils';

interface StickyNoteProps {
  object: BoardObject;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (x: number, y: number) => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: () => void;
  onResize: (width: number, height: number) => void;
  nodeRef?: (node: any) => void;
  shouldDisableDrag?: boolean;
}

export function StickyNote({ object, isSelected, onSelect, onDrag, onDragMove, onDragEnd, onResize, nodeRef, shouldDisableDrag }: StickyNoteProps) {
  const { canvasState, editingObjectId, setEditingObjectId, tool, connectorStartId } = useWhiteboardStore();
  const isEditing = editingObjectId === object.id;
  const isConnectorStart = connectorStartId === object.id && tool === 'connector';

  const screenPos = worldToScreen(object.x, object.y, canvasState);
  const screenWidth = object.width * canvasState.zoom;
  const screenHeight = object.height * canvasState.zoom;

  const handleDoubleClick = () => {
    setEditingObjectId(object.id);
  };

  const backgroundColor = object.style.backgroundColor || '#ffeb3b';
  // Detect dark mode and adjust text color for better contrast
  const isDarkMode = document.documentElement.classList.contains('dark');
  const defaultTextColor = isDarkMode ? '#1f2937' : '#000';
  const textColor = object.style.color || defaultTextColor;

  return (
    <Group
      ref={nodeRef}
      x={screenPos.x}
      y={screenPos.y}
      rotation={object.rotation || 0}
      onClick={(e) => {
        e.cancelBubble = true;
        if (e.evt) e.evt.stopPropagation();
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        if (e.evt) e.evt.stopPropagation();
        onSelect();
      }}
      draggable={!isEditing && !shouldDisableDrag}
      dragDistance={20}
      onDragStart={() => {
        // Prevent text selection while dragging
        document.body.style.userSelect = 'none';
      }}
      onDragMove={(e) => {
        const worldPos = {
          x: (e.target.x() - canvasState.panX) / canvasState.zoom,
          y: (e.target.y() - canvasState.panY) / canvasState.zoom,
        };
        if (onDragMove) {
          onDragMove(worldPos.x, worldPos.y);
        }
      }}
      onDragEnd={(e) => {
        document.body.style.userSelect = '';
        const worldPos = {
          x: (e.target.x() - canvasState.panX) / canvasState.zoom,
          y: (e.target.y() - canvasState.panY) / canvasState.zoom,
        };
        onDrag(worldPos.x, worldPos.y);
        // Call onDragEnd callback if provided
        if (onDragEnd) {
          onDragEnd();
        }
      }}
    >
      {/* Note background */}
      <Rect
        width={screenWidth}
        height={screenHeight}
        fill={backgroundColor}
        stroke={isConnectorStart ? '#10b981' : isSelected ? '#6366f1' : 'rgba(0,0,0,0.1)'}
        strokeWidth={isConnectorStart ? 3 : isSelected ? 2 : 1}
        shadowBlur={isConnectorStart ? 15 : isSelected ? 10 : 5}
        shadowColor={isConnectorStart ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0,0,0,0.2)'}
        cornerRadius={4}
      />

      {/* Title text */}
      {!isEditing && (
        <Text
          x={10}
          y={10}
          width={screenWidth - 20}
          height={screenHeight - 20}
          text={object.data.title || 'Untitled Note'}
          fontSize={14 * canvasState.zoom}
          fontFamily="Arial"
          fill={textColor}
          align="left"
          verticalAlign="top"
          onDblClick={(e) => {
            e.cancelBubble = true;
            if (e.evt) e.evt.stopPropagation();
            handleDoubleClick();
          }}
          onDblTap={(e) => {
            e.cancelBubble = true;
            if (e.evt) e.evt.stopPropagation();
            handleDoubleClick();
          }}
        />
      )}

      {/* Content text */}
      {object.data.content && !isEditing && (
        <Text
          x={10}
          y={30}
          width={screenWidth - 20}
          height={screenHeight - 40}
          text={object.data.content}
          fontSize={12 * canvasState.zoom}
          fontFamily="Arial"
          fill={textColor}
          align="left"
          verticalAlign="top"
          wrap="word"
        />
      )}
    </Group>
  );
}


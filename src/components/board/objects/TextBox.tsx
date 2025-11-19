import { Group, Rect, Text } from 'react-konva';
import { BoardObject } from '../../../types/whiteboard';
import { useWhiteboardStore } from '../../../stores/whiteboardStore';
import { worldToScreen } from '../utils/canvasUtils';

interface TextBoxProps {
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

export function TextBox({ object, isSelected, onSelect, onDrag, onDragMove, onDragEnd, onResize, nodeRef, shouldDisableDrag }: TextBoxProps) {
  const { canvasState, editingObjectId, setEditingObjectId, tool, connectorStartId } = useWhiteboardStore();
  const isEditing = editingObjectId === object.id;
  const isConnectorStart = connectorStartId === object.id && tool === 'connector';

  const screenPos = worldToScreen(object.x, object.y, canvasState);
  const screenWidth = object.width * canvasState.zoom;
  const screenHeight = object.height * canvasState.zoom;

  const handleDoubleClick = () => {
    setEditingObjectId(object.id);
  };

  // Calculer fontSize proportionnellement au redimensionnement
  const initialWidth = object.data.initialWidth || object.width;
  const initialHeight = object.data.initialHeight || object.height;
  const initialFontSize = object.data.initialFontSize || (object.style.fontSize || 16);
  
  // Calculer le ratio moyen (largeur et hauteur)
  const widthRatio = object.width / initialWidth;
  const heightRatio = object.height / initialHeight;
  const averageRatio = (widthRatio + heightRatio) / 2;
  
  const fontSize = initialFontSize * averageRatio * canvasState.zoom;
  const fontFamily = object.style.fontFamily || 'Arial';
  // Detect dark mode and adjust text color for better contrast
  const isDarkMode = document.documentElement.classList.contains('dark');
  const defaultTextColor = isDarkMode ? '#f3f4f6' : '#000'; // gray-100 for dark, black for light
  const textColor = object.style.color || defaultTextColor;
  const backgroundColor = object.style.backgroundColor || 'transparent';

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
      {/* Rect invisible pour définir les dimensions du Group pour le Transformer */}
      <Rect
        width={screenWidth}
        height={screenHeight}
        fill="transparent"
        listening={false}
      />
      
      {/* Background visible (si backgroundColor !== 'transparent') */}
      {backgroundColor !== 'transparent' && (
        <Rect
          width={screenWidth}
          height={screenHeight}
          fill={backgroundColor}
          stroke={isConnectorStart ? '#10b981' : isSelected ? '#6366f1' : 'transparent'}
          strokeWidth={isConnectorStart ? 3 : isSelected ? 2 : 0}
        />
      )}

      {/* Text */}
      {!isEditing && (
        <Text
          x={5}
          y={5}
          width={screenWidth - 10}
          height={screenHeight - 10}
          text={object.data.text || 'Double click to edit'}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle={object.style.fontWeight || 'normal'}
          fill={textColor}
          align="left"
          verticalAlign="top"
          wrap="word"
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
    </Group>
  );
}


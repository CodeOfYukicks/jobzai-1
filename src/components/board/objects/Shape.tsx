import { useRef, useState } from 'react';
import { Group, Rect, Circle, Line, Arrow } from 'react-konva';
import { BoardObject } from '../../../types/whiteboard';
import { useWhiteboardStore } from '../../../stores/whiteboardStore';
import { worldToScreen } from '../utils/canvasUtils';
import { isPointNearEdges } from '../utils/geometryUtils';

interface ShapeProps {
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

export function Shape({ object, isSelected, onSelect, onDrag, onDragMove, onDragEnd, nodeRef, shouldDisableDrag }: ShapeProps) {
  const { canvasState, tool, connectorStartId } = useWhiteboardStore();
  const isConnectorStart = connectorStartId === object.id && tool === 'connector';
  const [allowDrag, setAllowDrag] = useState(true);
  const groupRef = useRef<any>(null);

  const screenPos = worldToScreen(object.x, object.y, canvasState);
  const screenWidth = object.width * canvasState.zoom;
  const screenHeight = object.height * canvasState.zoom;

  // Detect dark mode and adjust colors for better contrast
  const isDarkMode = document.documentElement.classList.contains('dark');
  const defaultStrokeColor = isDarkMode ? '#f3f4f6' : '#000'; // gray-100 for dark, black for light
  const strokeColor = object.style.color || defaultStrokeColor;
  const fillColor = object.style.backgroundColor || 'transparent';
  const strokeWidth = (object.style.strokeWidth || 2) * canvasState.zoom;

  const renderShape = () => {
    switch (object.type) {
      case 'rectangle':
        return (
          <Rect
            x={0}
            y={0}
            width={screenWidth}
            height={screenHeight}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );

      case 'circle':
        const radius = Math.min(screenWidth, screenHeight) / 2;
        return (
          <Circle
            x={screenWidth / 2}
            y={screenHeight / 2}
            radius={radius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );

      case 'line':
        return (
          <Line
            points={[0, 0, screenWidth, screenHeight]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            lineCap="round"
          />
        );

      case 'arrow':
        return (
          <Arrow
            points={[0, screenHeight / 2, screenWidth, screenHeight / 2]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill={strokeColor}
            pointerLength={10 * canvasState.zoom}
            pointerWidth={10 * canvasState.zoom}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Group
      ref={(node) => {
        if (nodeRef) nodeRef(node);
        groupRef.current = node;
      }}
      x={screenPos.x}
      y={screenPos.y}
      rotation={object.rotation || 0}
      onClick={(e) => {
        e.cancelBubble = true;
        if (e.evt) e.evt.stopPropagation();
        
        // Pour les rectangles uniquement, vérifier si le clic est près des bords
        if (object.type === 'rectangle' && groupRef.current) {
          const stage = e.target.getStage();
          if (stage) {
            const pointerPos = stage.getPointerPosition();
            if (pointerPos) {
              const group = groupRef.current;
              const groupPos = group.getAbsolutePosition();
              
              // Calculer la position relative au rectangle
              const relativeX = pointerPos.x - groupPos.x;
              const relativeY = pointerPos.y - groupPos.y;
              
              // Seuil de 30 pixels depuis les bords (en coordonnées écran)
              const threshold = 30;
              const isNearEdge = isPointNearEdges(
                relativeX,
                relativeY,
                screenWidth,
                screenHeight,
                threshold
              );
              
              // Autoriser le drag seulement si on est près des bords
              setAllowDrag(isNearEdge);
              
              // Réinitialiser après un court délai
              setTimeout(() => {
                setAllowDrag(true);
              }, 200);
            }
          }
        }
        
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        if (e.evt) e.evt.stopPropagation();
        onSelect();
      }}
      draggable={!shouldDisableDrag && allowDrag}
      dragDistance={20}
      onDragStart={() => {
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
      {renderShape()}
      {(isSelected || isConnectorStart) && (
        <Rect
          x={-2}
          y={-2}
          width={screenWidth + 4}
          height={screenHeight + 4}
          stroke={isConnectorStart ? '#10b981' : '#6366f1'}
          strokeWidth={isConnectorStart ? 3 : 2}
          fill="transparent"
          dash={[5, 5]}
        />
      )}
    </Group>
  );
}


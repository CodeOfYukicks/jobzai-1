import { useState } from 'react';
import { Group, Rect, Image as KonvaImage } from 'react-konva';
import { BoardObject } from '../../../types/whiteboard';
import { useWhiteboardStore } from '../../../stores/whiteboardStore';
import { worldToScreen } from '../utils/canvasUtils';
import useImage from 'use-image';

interface ImageObjectProps {
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

export function ImageObject({ object, isSelected, onSelect, onDrag, onDragMove, onDragEnd, nodeRef, shouldDisableDrag }: ImageObjectProps) {
  const { canvasState, tool, connectorStartId } = useWhiteboardStore();
  const isConnectorStart = connectorStartId === object.id && tool === 'connector';
  const [image] = useImage(object.data.imageUrl || '');

  const screenPos = worldToScreen(object.x, object.y, canvasState);
  const screenWidth = object.width * canvasState.zoom;
  const screenHeight = object.height * canvasState.zoom;

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
      draggable={!shouldDisableDrag}
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
      {image ? (
        <KonvaImage
          image={image}
          width={screenWidth}
          height={screenHeight}
          opacity={object.style.opacity || 1}
        />
      ) : (
        <Rect
          width={screenWidth}
          height={screenHeight}
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth={1}
        />
      )}
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


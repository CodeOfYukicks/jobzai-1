import { Arrow } from 'react-konva';
import { BoardObject } from '../../../types/whiteboard';
import { useWhiteboardStore } from '../../../stores/whiteboardStore';
import { worldToScreen } from '../utils/canvasUtils';
import { getObjectCenter } from '../utils/geometryUtils';

interface ConnectorProps {
  object: BoardObject;
  isSelected: boolean;
  onSelect: () => void;
}

export function Connector({ object, isSelected, onSelect }: ConnectorProps) {
  const { objects, canvasState } = useWhiteboardStore();

  if (!object.data.startId || !object.data.endId) return null;

  const startObj = objects.find((o) => o.id === object.data.startId);
  const endObj = objects.find((o) => o.id === object.data.endId);

  if (!startObj || !endObj) return null;

  const startCenter = getObjectCenter(startObj);
  const endCenter = getObjectCenter(endObj);

  const startScreen = worldToScreen(startCenter.x, startCenter.y, canvasState);
  const endScreen = worldToScreen(endCenter.x, endCenter.y, canvasState);

  const strokeColor = object.style.color || '#6366f1';
  const strokeWidth = (object.style.strokeWidth || 2) * canvasState.zoom;

  return (
    <Arrow
      points={[startScreen.x, startScreen.y, endScreen.x, endScreen.y]}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill={strokeColor}
      pointerLength={10 * canvasState.zoom}
      pointerWidth={10 * canvasState.zoom}
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
      dash={isSelected ? [] : [5, 5]}
    />
  );
}


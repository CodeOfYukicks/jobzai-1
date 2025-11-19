import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Stage, Layer, Line as KonvaLine, Rect, Circle, Arrow, Transformer } from 'react-konva';
import { useWhiteboardStore } from '../../stores/whiteboardStore';
import { usePanZoom } from './hooks/usePanZoom';
import { useSelection } from './hooks/useSelection';
import { StickyNote } from './objects/StickyNote';
import { TextBox } from './objects/TextBox';
import { Shape } from './objects/Shape';
import { ImageObject } from './objects/ImageObject';
import { Connector } from './objects/Connector';
import { WhiteboardOverlays } from './WhiteboardOverlays';
import { BoardObject } from '../../types/whiteboard';
import { screenToWorld, worldToScreen } from './utils/canvasUtils';
import { ColorCirclePicker } from './ColorCirclePicker';
import { getVisibleObjects } from './utils/viewportCulling';

interface WhiteboardCanvasProps {
  width: number;
  height: number;
}

export function WhiteboardCanvas({ width, height }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const {
    objects,
    selectedIds,
    tool,
    canvasState,
    showGrid,
    addObject,
    updateObject,
    selectObject,
    clearSelection,
    setIsDrawing,
    saveToHistory,
    connectorStartId,
    setConnectorStartId,
    setSelectedStickyColor,
  } = useWhiteboardStore();

  usePanZoom(canvasRef);
  const { handleCanvasClick, startSelectionBox, updateSelectionBox, endSelectionBox } = useSelection(canvasRef);

  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [colorPickerPosition, setColorPickerPosition] = useState<{ x: number; y: number; worldX: number; worldY: number } | null>(null);
  const isDraggingRef = useRef(false);
  const transformerRef = useRef<any>(null);
  const selectedNodeRef = useRef<any>(null);
  const justSelectedRef = useRef<Map<string, number>>(new Map());

  // Create overlay container for HTML inputs
  useEffect(() => {
    if (!overlayRef.current && canvasRef.current) {
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '1000';
      overlay.id = 'whiteboard-overlay';
      canvasRef.current.appendChild(overlay);
      overlayRef.current = overlay;
    }
    return () => {
      if (overlayRef.current && overlayRef.current.parentNode) {
        overlayRef.current.parentNode.removeChild(overlayRef.current);
        overlayRef.current = null;
      }
    };
  }, []);

  // Handle object click for connectors
  const handleObjectClick = (objId: string, e: any) => {
    if (tool === 'connector') {
      if (e && e.cancelBubble !== undefined) {
        e.cancelBubble = true;
      }
      if (!connectorStartId) {
        // First object selected
        setConnectorStartId(objId);
        selectObject(objId, false);
      } else if (connectorStartId !== objId) {
        // Second object selected - create connector
        addObject({
          type: 'connector',
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          zIndex: -1,
          style: {
            color: '#6366f1',
            strokeWidth: 2,
          },
          data: {
            startId: connectorStartId,
            endId: objId,
          },
        });
        setConnectorStartId(null);
        useWhiteboardStore.getState().setTool('pointer');
      }
    }
  };

  // Handle canvas click for creating objects
  const handleStageClick = (e: any) => {
    const stage = e.target.getStage();
    // Check if we clicked directly on the stage (not on any object)
    // In Konva, if target is the stage itself or a Layer, it means we clicked on empty space
    const targetType = e.target.getType ? e.target.getType() : '';
    const clickedOnStage = e.target === stage || targetType === 'Stage' || targetType === 'Layer';
    
    // Handle connector tool on canvas click (cancel connector mode)
    if (tool === 'connector' && connectorStartId) {
      if (clickedOnStage) {
        setConnectorStartId(null);
        clearSelection();
      }
      return;
    }

    // Don't create objects if clicking on an existing object (not the stage itself)
    if (!clickedOnStage) {
      // If pointer tool, let the object handle the click
      if (tool === 'pointer') {
        // Object click will be handled by the object's onClick handler
        // But we also need to handle deselection if clicking on empty space
        // This is handled by the object's onClick which stops propagation
        return;
      }
      // For other tools, don't create if clicking on an object
      return;
    }

    if (tool === 'pointer') {
      // Convert Konva event to regular mouse event for handleCanvasClick
      const pointerPos = stage.getPointerPosition();
      if (pointerPos && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const syntheticEvent = {
          clientX: rect.left + pointerPos.x,
          clientY: rect.top + pointerPos.y,
          shiftKey: e.evt?.shiftKey || false,
        } as React.MouseEvent;
        handleCanvasClick(syntheticEvent);
      }
      return;
    }

    // Don't create if we're editing
    const { editingObjectId } = useWhiteboardStore.getState();
    if (editingObjectId) {
      return;
    }

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    const worldPos = screenToWorld(pointerPos.x, pointerPos.y, canvasState);

    if (tool === 'sticky') {
      // Show color picker at click position
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = rect.left + pointerPos.x;
        const screenY = rect.top + pointerPos.y;
        setColorPickerPosition({ 
          x: screenX, 
          y: screenY,
          worldX: worldPos.x,
          worldY: worldPos.y
        });
      }
      return;
    } else if (tool === 'text') {
      addObject({
        type: 'text',
        x: worldPos.x,
        y: worldPos.y,
        width: 200,
        height: 50,
        style: {
          fontSize: 16,
          color: '#000',
        },
        data: {
          text: '',
          initialWidth: 200,
          initialHeight: 50,
          initialFontSize: 16,
        },
      });
      // Tool will be reset to pointer in addObject
    } else if (['rectangle', 'circle', 'line', 'arrow'].includes(tool)) {
      setIsDrawingShape(true);
      setDrawStart(worldPos);
      setDrawCurrent(worldPos);
      setIsDrawing(true);
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (!isDrawingShape || !drawStart) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const worldPos = screenToWorld(pointerPos.x, pointerPos.y, canvasState);
    setDrawCurrent(worldPos);
  };

  const handleStageMouseUp = () => {
    if (isDrawingShape && drawStart && drawCurrent) {
      const width = Math.abs(drawCurrent.x - drawStart.x);
      const height = Math.abs(drawCurrent.y - drawStart.y);

      if (width > 5 || height > 5) {
        addObject({
          type: tool as any,
          x: Math.min(drawStart.x, drawCurrent.x),
          y: Math.min(drawStart.y, drawCurrent.y),
          width: Math.max(width, 50),
          height: Math.max(height, 50),
          style: {
            color: '#000',
            strokeWidth: 2,
          },
        });
        // Tool will be reset to pointer in addObject
        // History is saved automatically in addObject
      }

      setIsDrawingShape(false);
      setDrawStart(null);
      setDrawCurrent(null);
      setIsDrawing(false);
    } else if (isDraggingRef.current) {
      // Save history after drag/resize ends (only if something was actually dragged/resized)
      saveToHistory();
      isDraggingRef.current = false;
    }
  };

  // Memoize grid rendering to avoid recalculating on every render
  const gridLines = useMemo(() => {
    if (!showGrid) return [];

    const gridSize = 20;
    const startX = -canvasState.panX % (gridSize * canvasState.zoom);
    const startY = -canvasState.panY % (gridSize * canvasState.zoom);
    const scaledGridSize = gridSize * canvasState.zoom;

    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb'; // gray-700 for dark, gray-200 for light

    const lines = [];
    for (let x = startX; x < width; x += scaledGridSize) {
      lines.push(
        <KonvaLine
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke={gridColor}
          strokeWidth={0.5}
        />
      );
    }
    for (let y = startY; y < height; y += scaledGridSize) {
      lines.push(
        <KonvaLine
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke={gridColor}
          strokeWidth={0.5}
        />
      );
    }

    return lines;
  }, [showGrid, canvasState.panX, canvasState.panY, canvasState.zoom, width, height]);

  // Memoize visible objects to avoid recalculating on every render
  const visibleObjects = useMemo(() => {
    // Only apply viewport culling if we have many objects (performance optimization)
    if (objects.length < 50) {
      return objects;
    }
    return getVisibleObjects(objects, width, height, canvasState, 200);
  }, [objects, width, height, canvasState]);

  // Render preview shape while drawing
  const renderPreviewShape = () => {
    if (!isDrawingShape || !drawStart || !drawCurrent) return null;

    const startScreen = worldToScreen(drawStart.x, drawStart.y, canvasState);
    const currentScreen = worldToScreen(drawCurrent.x, drawCurrent.y, canvasState);
    
    const screenWidth = Math.abs(currentScreen.x - startScreen.x);
    const screenHeight = Math.abs(currentScreen.y - startScreen.y);
    const minX = Math.min(startScreen.x, currentScreen.x);
    const minY = Math.min(startScreen.y, currentScreen.y);

    const strokeColor = '#6366f1';
    const strokeWidth = 2;

    switch (tool) {
      case 'rectangle':
        return (
          <Rect
            x={minX}
            y={minY}
            width={screenWidth}
            height={screenHeight}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            dash={[5, 5]}
          />
        );
      
      case 'circle':
        const radius = Math.min(screenWidth, screenHeight) / 2;
        return (
          <Circle
            x={minX + screenWidth / 2}
            y={minY + screenHeight / 2}
            radius={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            dash={[5, 5]}
          />
        );
      
      case 'line':
        return (
          <KonvaLine
            points={[startScreen.x, startScreen.y, currentScreen.x, currentScreen.y]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            lineCap="round"
            dash={[5, 5]}
          />
        );
      
      case 'arrow':
        return (
          <Arrow
            points={[startScreen.x, startScreen.y, currentScreen.x, currentScreen.y]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill={strokeColor}
            pointerLength={10}
            pointerWidth={10}
            dash={[5, 5]}
          />
        );
      
      default:
        return null;
    }
  };

  // Map to store node refs for each object
  const nodeRefsMap = useRef<Map<string, any>>(new Map());

  // State to force re-render when drag should be re-enabled
  const [dragEnabledTime, setDragEnabledTime] = useState(Date.now());

  // Clean up justSelectedRef entries after delay and force re-render
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      let hasChanges = false;
      justSelectedRef.current.forEach((timestamp, id) => {
        if (now - timestamp >= 300) {
          justSelectedRef.current.delete(id);
          hasChanges = true;
        }
      });
      if (hasChanges) {
        setDragEnabledTime(now);
      }
    }, 100); // Check every 100ms

    return () => clearInterval(cleanup);
  }, []);

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedIds.length === 1) {
      const node = nodeRefsMap.current.get(selectedIds[0]);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedIds]);

  // Debounced update function for drag operations
  const dragUpdateTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const debouncedUpdateObject = useCallback((id: string, updates: Partial<BoardObject>) => {
    // Clear existing timeout for this object
    const existingTimeout = dragUpdateTimeoutRef.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Update immediately for visual feedback
    updateObject(id, updates);
    
    // Set a new timeout to batch rapid updates
    const timeout = setTimeout(() => {
      dragUpdateTimeoutRef.current.delete(id);
    }, 16); // ~60fps
    
    dragUpdateTimeoutRef.current.set(id, timeout);
  }, [updateObject]);

  const renderObject = (obj: BoardObject) => {
    const isSelected = selectedIds.includes(obj.id);

    const commonProps = {
      object: obj,
      isSelected: isSelected || connectorStartId === obj.id,
      nodeRef: (node: any) => {
        if (node) {
          nodeRefsMap.current.set(obj.id, node);
        } else {
          nodeRefsMap.current.delete(obj.id);
        }
      },
      onSelect: () => {
        if (tool === 'connector') {
          handleObjectClick(obj.id, { cancelBubble: true });
        } else {
          // Enregistrer le moment de la sélection pour empêcher le drag immédiat
          justSelectedRef.current.set(obj.id, Date.now());
          setDragEnabledTime(Date.now()); // Force re-render pour désactiver le drag
          selectObject(obj.id, false);
        }
      },
      // Passer une prop pour indiquer si le drag doit être désactivé
      shouldDisableDrag: (() => {
        const selectionTime = justSelectedRef.current.get(obj.id);
        if (selectionTime) {
          const timeSinceSelection = Date.now() - selectionTime;
          // Désactiver le drag pendant 300ms après la sélection
          return timeSinceSelection < 300;
        }
        return false;
      })(),
      onDrag: (x: number, y: number) => {
        isDraggingRef.current = true;
        // Use immediate update for final position
        updateObject(obj.id, { x, y });
        // History will be saved in onDragEnd callback
      },
      onDragMove: (x: number, y: number) => {
        isDraggingRef.current = true;
        // Use debounced update during drag for better performance
        debouncedUpdateObject(obj.id, { x, y });
      },
      onDragEnd: () => {
        // Clear any pending debounced updates
        const timeout = dragUpdateTimeoutRef.current.get(obj.id);
        if (timeout) {
          clearTimeout(timeout);
          dragUpdateTimeoutRef.current.delete(obj.id);
        }
        // Save history after drag ends
        if (isDraggingRef.current) {
          saveToHistory();
          isDraggingRef.current = false;
        }
      },
      onResize: (width: number, height: number) => {
        isDraggingRef.current = true;
        updateObject(obj.id, { width, height });
        // History will be saved in handleStageMouseUp after resize ends
      },
    };

    switch (obj.type) {
      case 'sticky':
        return <StickyNote key={obj.id} {...commonProps} />;
      case 'text':
        return <TextBox key={obj.id} {...commonProps} />;
      case 'rectangle':
      case 'circle':
      case 'line':
      case 'arrow':
        return <Shape key={obj.id} {...commonProps} />;
      case 'image':
        return <ImageObject key={obj.id} {...commonProps} />;
      case 'connector':
        return <Connector key={obj.id} object={obj} isSelected={isSelected} onSelect={() => selectObject(obj.id, false)} />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900"
      style={{ 
        cursor: tool === 'pointer' 
          ? 'default' 
          : tool === 'connector' 
            ? 'crosshair' 
            : 'crosshair' 
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onClick={handleStageClick}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onMouseLeave={handleStageMouseUp}
      >
        <Layer>
          {/* Render grid first so it appears behind all objects */}
          {gridLines}
          
          {/* Render connectors so they appear behind other objects */}
          {visibleObjects
            .filter((obj) => obj.type === 'connector')
            .map((obj) => renderObject(obj))}
          
          {/* Render other objects */}
          {visibleObjects
            .filter((obj) => obj.type !== 'connector')
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((obj) => renderObject(obj))}
          
          {/* Render preview shape while drawing */}
          {renderPreviewShape()}
          
          {/* Transformer for resizing selected objects */}
          {selectedIds.length === 1 && tool === 'pointer' && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit minimum size
                if (Math.abs(newBox.width) < 50 || Math.abs(newBox.height) < 50) {
                  return oldBox;
                }
                return newBox;
              }}
              onTransformEnd={() => {
                if (!transformerRef.current) return;
                
                const nodes = transformerRef.current.nodes();
                if (!nodes || nodes.length === 0) return;
                
                const node = nodes[0];
                if (!node) return;

                const selectedId = selectedIds[0];
                if (!selectedId) return;

                // Récupérer l'objet original depuis le store
                const currentObject = objects.find(obj => obj.id === selectedId);
                if (!currentObject) {
                  console.error('[TRANSFORMER] Object not found:', selectedId);
                  return;
                }

                try {
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  
                  // Reset scale
                  node.scaleX(1);
                  node.scaleY(1);
                  
                  // Convertir la position en coordonnées monde
                  const worldPos = {
                    x: (node.x() - canvasState.panX) / canvasState.zoom,
                    y: (node.y() - canvasState.panY) / canvasState.zoom,
                  };
                  
                  // Utiliser les dimensions originales de l'objet et les multiplier par le scale
                  const worldWidth = currentObject.width * scaleX;
                  const worldHeight = currentObject.height * scaleY;
                  
                  // Valider que les dimensions sont valides
                  if (worldWidth <= 0 || worldHeight <= 0 || !isFinite(worldWidth) || !isFinite(worldHeight)) {
                    console.error('[TRANSFORMER] Invalid dimensions:', { worldWidth, worldHeight, scaleX, scaleY });
                    return;
                  }
                  
                  // Pour les TextBox, mettre à jour fontSize proportionnellement
                  let updatedStyle = currentObject.style;
                  if (currentObject.type === 'text') {
                    const initialWidth = currentObject.data.initialWidth || currentObject.width;
                    const initialHeight = currentObject.data.initialHeight || currentObject.height;
                    const initialFontSize = currentObject.data.initialFontSize || (currentObject.style.fontSize || 16);
                    
                    const widthRatio = worldWidth / initialWidth;
                    const heightRatio = worldHeight / initialHeight;
                    const averageRatio = (widthRatio + heightRatio) / 2;
                    const newFontSize = initialFontSize * averageRatio;
                    
                    updatedStyle = {
                      ...currentObject.style,
                      fontSize: newFontSize,
                    };
                    
                    // S'assurer que les dimensions initiales sont stockées
                    const updatedData = {
                      ...currentObject.data,
                      initialWidth: currentObject.data.initialWidth || currentObject.width,
                      initialHeight: currentObject.data.initialHeight || currentObject.height,
                      initialFontSize: currentObject.data.initialFontSize || initialFontSize,
                    };
                    
                    updateObject(selectedId, {
                      x: worldPos.x,
                      y: worldPos.y,
                      width: worldWidth,
                      height: worldHeight,
                      style: updatedStyle,
                      data: updatedData,
                    });
                  } else {
                    updateObject(selectedId, {
                      x: worldPos.x,
                      y: worldPos.y,
                      width: worldWidth,
                      height: worldHeight,
                    });
                  }
                  
                  // Save history after resize
                  saveToHistory();
                } catch (error) {
                  console.error('[TRANSFORMER] Error in onTransformEnd:', error);
                }
              }}
            />
          )}
        </Layer>
      </Stage>
      {/* Render HTML overlays outside of Konva Stage */}
      <WhiteboardOverlays container={overlayRef.current} />
      {/* Color Circle Picker for sticky notes */}
      {colorPickerPosition && (
        <ColorCirclePicker
          x={colorPickerPosition.x}
          y={colorPickerPosition.y}
          onColorSelect={(color) => {
            // Update selected color in store
            setSelectedStickyColor(color);
            // Create sticky note at the world position
            addObject({
              type: 'sticky',
              x: colorPickerPosition.worldX,
              y: colorPickerPosition.worldY,
              width: 250,
              height: 200,
              style: {
                backgroundColor: color,
              },
              data: {
                title: '',
                content: '',
              },
            });
            // Close color picker
            setColorPickerPosition(null);
          }}
          onClose={() => {
            setColorPickerPosition(null);
          }}
        />
      )}
    </div>
  );
}

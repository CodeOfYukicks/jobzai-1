import { useEffect, useRef, useCallback } from 'react';
import { useWhiteboardStore } from '../../../stores/whiteboardStore';

export function usePanZoom(canvasRef: React.RefObject<HTMLDivElement>) {
  const { canvasState, setCanvasState } = useWhiteboardStore();
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!canvasRef.current) return;

      // Zoom with Ctrl+Wheel or pinch gesture
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(5, canvasState.zoom * zoomFactor));

        // Zoom towards mouse position
        const zoomChange = newZoom / canvasState.zoom;
        const newPanX = mouseX - (mouseX - canvasState.panX) * zoomChange;
        const newPanY = mouseY - (mouseY - canvasState.panY) * zoomChange;

        setCanvasState({
          zoom: newZoom,
          panX: newPanX,
          panY: newPanY,
        });
      } else {
        // Pan with wheel (shift+wheel for horizontal)
        e.preventDefault();
        const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
        const deltaY = e.shiftKey ? 0 : e.deltaY;

        setCanvasState({
          panX: canvasState.panX - deltaX,
          panY: canvasState.panY - deltaY,
        });
      }
    },
    [canvasRef, canvasState, setCanvasState]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      // Start panning with middle button
      if (e.button === 1) {
        e.preventDefault();
        isPanningRef.current = true;
        lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanningRef.current) {
        const deltaX = e.clientX - lastPanPointRef.current.x;
        const deltaY = e.clientY - lastPanPointRef.current.y;

        setCanvasState({
          panX: canvasState.panX + deltaX,
          panY: canvasState.panY + deltaY,
        });

        lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [canvasState, setCanvasState]
  );

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Prevent context menu on middle click
    canvas.addEventListener('contextmenu', (e) => {
      if (e.button === 1) e.preventDefault();
    });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvasRef, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    panX: canvasState.panX,
    panY: canvasState.panY,
    zoom: canvasState.zoom,
  };
}


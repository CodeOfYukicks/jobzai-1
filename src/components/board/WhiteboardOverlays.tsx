import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWhiteboardStore } from '../../stores/whiteboardStore';
import { worldToScreen } from './utils/canvasUtils';

interface OverlayData {
  id: string;
  type: 'sticky' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
  };
  onSave: (text: string) => void;
  onCancel: () => void;
}

export function WhiteboardOverlays({ container }: { container: HTMLElement | null }) {
  const { objects, editingObjectId, canvasState, setEditingObjectId, updateObject, saveToHistory } = useWhiteboardStore();
  
  const editingObject = objects.find(obj => obj.id === editingObjectId);
  
  // Wait for container to be available
  if (!editingObject) return null;
  if (!container) {
    // Try to find container in DOM if ref is not ready
    const foundContainer = document.getElementById('whiteboard-overlay');
    if (!foundContainer) return null;
    // Use found container for this render
  }
  
  const actualContainer = container || document.getElementById('whiteboard-overlay');
  if (!actualContainer) return null;
  
  const isSticky = editingObject.type === 'sticky';
  const isText = editingObject.type === 'text';
  
  if (!isSticky && !isText) return null;
  
  const screenPos = worldToScreen(editingObject.x, editingObject.y, canvasState);
  const screenWidth = editingObject.width * canvasState.zoom;
  const screenHeight = editingObject.height * canvasState.zoom;
  
  const text = isSticky 
    ? (editingObject.data.title || '')
    : (editingObject.data.text || '');
  
  const handleSave = (newText: string) => {
    if (isSticky) {
      updateObject(editingObjectId, {
        data: { ...editingObject.data, title: newText },
      });
    } else {
      updateObject(editingObjectId, {
        data: { ...editingObject.data, text: newText },
      });
    }
    setEditingObjectId(null);
    // Save history after text edit is complete
    saveToHistory();
  };
  
  const handleCancel = () => {
    setEditingObjectId(null);
  };
  
  const backgroundColor = editingObject.style.backgroundColor || (isSticky ? '#ffeb3b' : 'transparent');
  const textColor = editingObject.style.color || '#000';
  const fontSize = editingObject.style.fontSize || (isSticky ? 14 : 16);
  const fontFamily = editingObject.style.fontFamily || 'Arial';
  const fontWeight = editingObject.style.fontWeight || 'normal';
  
  const padding = isSticky ? 10 : 5;
  const inputStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${screenPos.x + padding}px`,
    top: `${screenPos.y + padding}px`,
    width: `${screenWidth - padding * 2}px`,
    height: `${screenHeight - padding * 2}px`,
    border: '2px solid #6366f1',
    borderRadius: '4px',
    padding: '8px',
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    fontWeight: fontWeight,
    resize: 'none',
    outline: 'none',
    backgroundColor: backgroundColor === 'transparent' ? 'white' : backgroundColor,
    color: textColor,
    pointerEvents: 'auto',
    zIndex: 1000,
  };
  
  return createPortal(
    <TextAreaOverlay
      initialValue={text}
      style={inputStyle}
      onSave={handleSave}
      onCancel={handleCancel}
      isSticky={isSticky}
    />,
    actualContainer
  );
}

function TextAreaOverlay({
  initialValue,
  style,
  onSave,
  onCancel,
  isSticky,
}: {
  initialValue: string;
  style: React.CSSProperties;
  onSave: (text: string) => void;
  onCancel: () => void;
  isSticky: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localText, setLocalText] = useState(initialValue);
  
  useEffect(() => {
    // Focus and select text when component mounts
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, 10);
    return () => clearTimeout(timer);
  }, []);
  
  const handleBlur = () => {
    onSave(localText);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isSticky && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(localText);
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  return (
    <textarea
      ref={textareaRef}
      value={localText}
      onChange={(e) => setLocalText(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={style}
    />
  );
}


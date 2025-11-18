import { useRef, useEffect, useState } from 'react';
import {
  MousePointer,
  StickyNote,
  Type,
  Square,
  Circle,
  Minus,
  ArrowUp,
  Image as ImageIcon,
  Link2,
  Undo2,
  Redo2,
  Grid,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { useWhiteboardStore } from '../../stores/whiteboardStore';
import { ToolType } from '../../types/whiteboard';
import { ColorPicker } from './ColorPicker';

const tools: Array<{ type: ToolType; icon: React.ReactNode; label: string; shortcut?: string }> = [
  { type: 'pointer', icon: <MousePointer className="w-5 h-5" />, label: 'Select', shortcut: 'V' },
  { type: 'sticky', icon: <StickyNote className="w-5 h-5" />, label: 'Sticky Note', shortcut: 'N' },
  { type: 'text', icon: <Type className="w-5 h-5" />, label: 'Text', shortcut: 'T' },
  { type: 'rectangle', icon: <Square className="w-5 h-5" />, label: 'Rectangle', shortcut: 'R' },
  { type: 'circle', icon: <Circle className="w-5 h-5" />, label: 'Circle', shortcut: 'C' },
  { type: 'line', icon: <Minus className="w-5 h-5 rotate-45" />, label: 'Line', shortcut: 'L' },
  { type: 'arrow', icon: <ArrowUp className="w-5 h-5 rotate-45" />, label: 'Arrow', shortcut: 'A' },
  { type: 'image', icon: <ImageIcon className="w-5 h-5" />, label: 'Image', shortcut: 'I' },
  { type: 'connector', icon: <Link2 className="w-5 h-5" />, label: 'Connector' },
];

export function WhiteboardToolbar() {
  const {
    tool,
    setTool,
    undo,
    redo,
    resetZoom,
    zoomIn,
    zoomOut,
    showGrid,
    setShowGrid,
    history,
    connectorStartId,
    setConnectorStartId,
    selectedStickyColor,
    setSelectedStickyColor,
  } = useWhiteboardStore();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const stickyButtonRef = useRef<HTMLButtonElement>(null);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Auto-trigger file picker when image tool is selected
  useEffect(() => {
    if (tool === 'image' && imageInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        imageInputRef.current?.click();
      }, 100);
    }
  }, [tool]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      // If no file selected, return to pointer tool
      setTool('pointer');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      useWhiteboardStore.getState().addObject({
        type: 'image',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        data: {
          imageUrl,
        },
      });
      // Return to pointer tool after adding image
      setTool('pointer');
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto max-h-screen">
      {/* Tools */}
      <div className="flex flex-col gap-1 relative">
        {tools.map((toolOption) => (
          <div key={toolOption.type} className="relative">
            <button
              ref={toolOption.type === 'sticky' ? stickyButtonRef : undefined}
              onClick={() => {
                if (toolOption.type === 'connector' && connectorStartId) {
                  // Cancel connector mode if already started
                  setConnectorStartId(null);
                }
                if (toolOption.type === 'sticky') {
                  setIsColorPickerOpen(!isColorPickerOpen);
                } else {
                  setIsColorPickerOpen(false);
                }
                setTool(toolOption.type);
              }}
              className={`p-2 rounded-lg transition-colors ${
                tool === toolOption.type
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              } ${toolOption.type === 'connector' && connectorStartId ? 'ring-2 ring-purple-500' : ''}`}
              title={`${toolOption.label}${toolOption.shortcut ? ` (${toolOption.shortcut})` : ''}${toolOption.type === 'connector' && connectorStartId ? ' - Click second object' : ''}`}
            >
              {toolOption.icon}
            </button>
            {toolOption.type === 'sticky' && (
              <ColorPicker
                selectedColor={selectedStickyColor}
                onColorChange={setSelectedStickyColor}
                isOpen={isColorPickerOpen && tool === 'sticky'}
                onClose={() => setIsColorPickerOpen(false)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-gray-200 dark:bg-gray-700 my-2" />

      {/* History */}
      <div className="flex flex-col gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-2 rounded-lg transition-colors ${
            canUndo
              ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              : 'opacity-50 cursor-not-allowed text-gray-400'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-2 rounded-lg transition-colors ${
            canRedo
              ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              : 'opacity-50 cursor-not-allowed text-gray-400'
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-5 h-5" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-gray-200 dark:bg-gray-700 my-2" />

      {/* Zoom */}
      <div className="flex flex-col gap-1">
        <button
          onClick={zoomIn}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title="Zoom In (Ctrl+Wheel)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title="Zoom Out (Ctrl+Wheel)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={resetZoom}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          title="Reset Zoom"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-gray-200 dark:bg-gray-700 my-2" />

      {/* Grid toggle */}
      <button
        onClick={() => setShowGrid(!showGrid)}
        className={`p-2 rounded-lg transition-colors ${
          showGrid
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}
        title="Toggle Grid"
      >
        <Grid className="w-5 h-5" />
      </button>

      {/* Image upload (hidden input) */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        id="image-upload"
      />
    </div>
  );
}


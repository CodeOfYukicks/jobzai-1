import { useRef, useEffect } from 'react';
import {
  MousePointer,
  StickyNote,
  Type,
  Square,
  Link2,
  Undo2,
  Redo2,
  Grid,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useWhiteboardStore } from '../../stores/whiteboardStore';
import { ToolType } from '../../types/whiteboard';

const tools: Array<{ type: ToolType; icon: React.ReactNode; label: string; shortcut?: string }> = [
  { type: 'pointer', icon: <MousePointer className="w-5 h-5" />, label: 'Select', shortcut: 'V' },
  { type: 'sticky', icon: <StickyNote className="w-5 h-5" />, label: 'Sticky Note', shortcut: 'N' },
  { type: 'text', icon: <Type className="w-5 h-5" />, label: 'Text', shortcut: 'T' },
  { type: 'rectangle', icon: <Square className="w-5 h-5" />, label: 'Rectangle', shortcut: 'R' },
  { type: 'connector', icon: <Link2 className="w-5 h-5" />, label: 'Connector' },
];

export function WhiteboardToolbar() {
  const tool = useWhiteboardStore((state) => state.tool);
  const setTool = useWhiteboardStore((state) => state.setTool);
  const undo = useWhiteboardStore((state) => state.undo);
  const redo = useWhiteboardStore((state) => state.redo);
  const zoomIn = useWhiteboardStore((state) => state.zoomIn);
  const zoomOut = useWhiteboardStore((state) => state.zoomOut);
  const showGrid = useWhiteboardStore((state) => state.showGrid);
  const setShowGrid = useWhiteboardStore((state) => state.setShowGrid);
  const connectorStartId = useWhiteboardStore((state) => state.connectorStartId);
  const setConnectorStartId = useWhiteboardStore((state) => state.setConnectorStartId);

  // Subscribe to history lengths directly for better reactivity
  const canUndo = useWhiteboardStore((state) => state.history.past.length > 0);
  const canRedo = useWhiteboardStore((state) => state.history.future.length > 0);

  const imageInputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex flex-col gap-3 bg-white p-4 shadow-sm ring-1 ring-black/[0.03] dark:bg-neutral-900/50 dark:ring-white/[0.05] overflow-y-auto max-h-screen w-[200px]">
      {/* Tools Section */}
      <div className="space-y-1">
        <div className="mb-2 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Tools
          </span>
        </div>
        {tools.map((toolOption) => (
          <div key={toolOption.type} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (toolOption.type === 'connector' && connectorStartId) {
                  setConnectorStartId(null);
                }
                setTool(toolOption.type);
              }}
              className={`group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${tool === toolOption.type
                ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/60 dark:bg-purple-950/30 dark:text-purple-300 dark:ring-purple-800/40'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]'
                } ${toolOption.type === 'connector' && connectorStartId ? 'ring-2 ring-purple-500' : ''}`}
              title={`${toolOption.label}${toolOption.shortcut ? ` (${toolOption.shortcut})` : ''}${toolOption.type === 'connector' && connectorStartId ? ' - Click second object' : ''}`}
            >
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-all ${tool === toolOption.type
                ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'
                : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:group-hover:bg-white/[0.08]'
                }`}>
                {toolOption.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">
                  {toolOption.label}
                </div>
                {toolOption.shortcut && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {toolOption.shortcut}
                  </div>
                )}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-gray-700" />

      {/* History Section */}
      <div className="space-y-1">
        <div className="mb-2 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            History
          </span>
        </div>
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${canUndo
            ? 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]'
            : 'cursor-not-allowed opacity-50 text-gray-400'
            }`}
          title="Undo (Ctrl+Z)"
        >
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-all ${canUndo
            ? 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:group-hover:bg-white/[0.08]'
            : 'bg-gray-50 text-gray-400 dark:bg-white/[0.02]'
            }`}>
            <Undo2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Undo</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Ctrl+Z</div>
          </div>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${canRedo
            ? 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]'
            : 'cursor-not-allowed opacity-50 text-gray-400'
            }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-all ${canRedo
            ? 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:group-hover:bg-white/[0.08]'
            : 'bg-gray-50 text-gray-400 dark:bg-white/[0.02]'
            }`}>
            <Redo2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Redo</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Ctrl+⇧+Z</div>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-gray-700" />

      {/* View Section */}
      <div className="space-y-1">
        <div className="mb-2 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            View
          </span>
        </div>
        <button
          onClick={zoomIn}
          className="group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          title="Zoom In (Ctrl+Wheel)"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600 transition-all group-hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:group-hover:bg-white/[0.08]">
            <ZoomIn className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Zoom In</div>
          </div>
        </button>
        <button
          onClick={zoomOut}
          className="group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          title="Zoom Out (Ctrl+Wheel)"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600 transition-all group-hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:group-hover:bg-white/[0.08]">
            <ZoomOut className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Zoom Out</div>
          </div>
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${showGrid
            ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/60 dark:bg-purple-950/30 dark:text-purple-300 dark:ring-purple-800/40'
            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]'
            }`}
          title="Toggle Grid"
        >
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-all ${showGrid
            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'
            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:group-hover:bg-white/[0.08]'
            }`}>
            <Grid className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Show Grid</div>
          </div>
        </button>
      </div>

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


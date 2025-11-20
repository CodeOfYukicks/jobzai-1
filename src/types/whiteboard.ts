export type BoardObjectType =
  | 'sticky'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'image'
  | 'connector';

export type ToolType =
  | 'pointer'
  | 'sticky'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'image'
  | 'connector';

export interface BoardObjectStyle {
  color?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  opacity?: number;
}

export interface BoardObjectData {
  text?: string;
  imageUrl?: string;
  startId?: string;  // For connectors
  endId?: string;    // For connectors
  title?: string;     // For sticky notes
  content?: string;  // For sticky notes
}

export interface BoardObject {
  id: string;
  type: BoardObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  style: BoardObjectStyle;
  data: BoardObjectData;
  locked?: boolean;
}

export interface CanvasState {
  panX: number;
  panY: number;
  zoom: number;
}

export interface HistoryState {
  past: BoardObject[][];
  present: BoardObject[];
  future: BoardObject[][];
}

export interface WhiteboardState {
  objects: BoardObject[];
  selectedIds: string[];
  tool: ToolType;
  canvasState: CanvasState;
  history: HistoryState;
  showGrid: boolean;
  isDrawing: boolean;
  clipboard: BoardObject[] | null;
  editingObjectId: string | null;
  connectorStartId: string | null;
  selectedStickyColor: string;
}


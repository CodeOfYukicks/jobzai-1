import { ZoomIn, ZoomOut, Maximize2, Minimize2, Download } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitToWidth?: () => void;
  onFitToPage?: () => void;
  onFullscreen?: () => void;
  onDownload?: () => void;
  minZoom?: number;
  maxZoom?: number;
}

export default function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToWidth,
  onFitToPage,
  onFullscreen,
  onDownload,
  minZoom = 50,
  maxZoom = 150
}: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Zoom Level */}
      <div className="flex items-center gap-2 px-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[45px] text-center">
          {zoom}%
        </span>
        
        {/* Zoom Slider */}
        <input
          type="range"
          min={minZoom}
          max={maxZoom}
          value={zoom}
          onChange={(e) => {
            const newZoom = parseInt(e.target.value);
            if (newZoom > zoom) {
              for (let i = zoom; i < newZoom; i += 10) {
                onZoomIn();
              }
            } else {
              for (let i = zoom; i > newZoom; i -= 10) {
                onZoomOut();
              }
            }
          }}
          className="w-24 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, rgb(147 51 234) 0%, rgb(147 51 234) ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, rgb(229 231 235) ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, rgb(229 231 235) 100%)`
          }}
        />
      </div>

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Reset Zoom */}
      <button
        onClick={onZoomReset}
        className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="Reset zoom (100%)"
      >
        Reset
      </button>

      {/* Fit to Width */}
      {onFitToWidth && (
        <button
          onClick={onFitToWidth}
          className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Fit to width"
        >
          Fit Width
        </button>
      )}

      {/* Fit to Page */}
      {onFitToPage && (
        <button
          onClick={onFitToPage}
          className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Fit to page"
        >
          Fit Page
        </button>
      )}

      {/* Divider */}
      {(onFullscreen || onDownload) && (
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
      )}

      {/* Fullscreen */}
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Download */}
      {onDownload && (
        <button
          onClick={onDownload}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Download PDF"
        >
          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      )}
    </div>
  );
}

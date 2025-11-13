import { useEffect, useRef, useState } from 'react';

interface CoverPhotoCropperProps {
  isOpen: boolean;
  file: Blob | File | null;
  onClose: () => void;
  onCropped: (blob: Blob) => void;
  // Default LinkedIn recommended size 1584x396 (4:1)
  exportWidth?: number;
  exportHeight?: number;
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const CoverPhotoCropper = ({
  isOpen,
  file,
  onClose,
  onCropped,
  exportWidth = 1584,
  exportHeight = 396
}: CoverPhotoCropperProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgNatural, setImgNatural] = useState<{ width: number; height: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [maxScale, setMaxScale] = useState(3);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const offsetStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Display crop area (scaled down but same aspect ratio 4:1)
  const cropWidth = 640;
  const cropHeight = 160;

  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      setImgNatural(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      setImgNatural({ width, height });
      const scaleNeeded = Math.max(cropWidth / width, cropHeight / height);
      const minS = scaleNeeded;
      const maxS = Math.max(minS * 3, minS + 1);
      setMinScale(minS);
      setMaxScale(maxS);
      setScale(scaleNeeded);
      const initialW = width * scaleNeeded;
      const initialH = height * scaleNeeded;
      setOffset({
        x: (cropWidth - initialW) / 2,
        y: (cropHeight - initialH) / 2
      });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const clampOffset = (x: number, y: number, s: number) => {
    if (!imgNatural) return { x, y };
    const imgW = imgNatural.width * s;
    const imgH = imgNatural.height * s;
    const minX = Math.min(0, cropWidth - imgW);
    const minY = Math.min(0, cropHeight - imgH);
    const maxX = 0;
    const maxY = 0;
    return {
      x: clamp(x, minX, maxX),
      y: clamp(y, minY, maxY),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset(clampOffset(offsetStart.current.x + dx, offsetStart.current.y + dy, scale));
  };
  const handleMouseUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: t.clientX, y: t.clientY };
    offsetStart.current = { ...offset };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragStart.current || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.x;
    const dy = t.clientY - dragStart.current.y;
    setOffset(clampOffset(offsetStart.current.x + dx, offsetStart.current.y + dy, scale));
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  const handleZoomChange = (value: number) => {
    if (!imgNatural) return;
    const prevScale = scale;
    const nextScale = clamp(value, minScale, maxScale);
    if (nextScale === prevScale) return;

    const centerX = cropWidth / 2;
    const centerY = cropHeight / 2;
    const ratio = nextScale / prevScale;
    const dxPrev = centerX - offset.x;
    const dyPrev = centerY - offset.y;
    const dxNext = dxPrev * ratio;
    const dyNext = dyPrev * ratio;
    const newOffsetX = centerX - dxNext;
    const newOffsetY = centerY - dyNext;
    const clamped = clampOffset(newOffsetX, newOffsetY, nextScale);
    setScale(nextScale);
    setOffset(clamped);
  };

  const handleConfirm = async () => {
    if (!imgNatural || !imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const factorX = exportWidth / cropWidth;
      const factorY = exportHeight / cropHeight;
      const drawX = offset.x * factorX;
      const drawY = offset.y * factorY;
      const drawW = imgNatural.width * scale * factorX;
      const drawH = imgNatural.height * scale * factorY;
      ctx.clearRect(0, 0, exportWidth, exportHeight);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, drawX, drawY, drawW, drawH);
      canvas.toBlob((blob) => {
        if (blob) {
          onCropped(blob);
        }
      }, 'image/jpeg', 0.92);
    };
    img.src = imageUrl;
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Adjust your cover</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Drag to reposition and use the slider to zoom</p>
        </div>
        <div className="px-6 py-6">
          <div
            className="relative mx-auto"
            style={{ width: `${cropWidth}px`, height: `${cropHeight}px` }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
              style={{ width: `${cropWidth}px`, height: `${cropHeight}px` }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Crop cover"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: `${offset.x}px`,
                    top: `${offset.y}px`,
                    width: imgNatural ? `${imgNatural.width * scale}px` : '100%',
                    height: imgNatural ? `${imgNatural.height * scale}px` : '100%',
                    userSelect: 'none',
                    touchAction: 'none',
                  }}
                />
              )}
            </div>
          </div>
          <div className="mt-5">
            <input
              type="range"
              min={minScale}
              max={maxScale}
              step={0.01}
              value={scale}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverPhotoCropper;



'use client';

import { useState, useRef, useEffect } from 'react';

export default function ImageCropperModal({ isOpen, onClose, onConfirm, imageSrc, placeholderDimensions }) {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Use provided dimensions or fall back to Email Header defaults (1200x495)
  const actualPlaceholderWidth = placeholderDimensions?.width || 1200;
  const actualPlaceholderHeight = placeholderDimensions?.height || 495;
  
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = Math.round(400 * (actualPlaceholderHeight / actualPlaceholderWidth));

  // Draw the preview
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !imageSrc) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Fill background
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw borders
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw image
      ctx.save();
      ctx.scale(scale, scale);
      ctx.drawImage(img, offsetX / scale, offsetY / scale);
      ctx.restore();

      // Draw center guides
      ctx.strokeStyle = '#a3a3a3';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT / 2);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    img.src = imageSrc;
  }, [isOpen, imageSrc, scale, offsetX, offsetY, CANVAS_WIDTH, CANVAS_HEIGHT]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const newScale = Math.max(0.5, Math.min(3, scale - e.deltaY * 0.001));
    setScale(newScale);
  };

  const handleReset = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleConfirm = () => {
    if (!canvasRef.current || !imageSrc) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Create output canvas with exact dimensions
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = actualPlaceholderWidth;
      outputCanvas.height = actualPlaceholderHeight;
      const outputCtx = outputCanvas.getContext('2d');

      outputCtx.fillStyle = '#f3f4f6';
      outputCtx.fillRect(0, 0, actualPlaceholderWidth, actualPlaceholderHeight);

      // Scale from preview to output
      const scaleX = actualPlaceholderWidth / CANVAS_WIDTH;
      const scaleY = actualPlaceholderHeight / CANVAS_HEIGHT;

      outputCtx.drawImage(
        img,
        (offsetX / scale) * scaleX,
        (offsetY / scale) * scaleY,
        (CANVAS_WIDTH / scale) * scaleX,
        (CANVAS_HEIGHT / scale) * scaleY
      );

      onConfirm({
        src: outputCanvas.toDataURL('image/png'),
        width: actualPlaceholderWidth,
        height: actualPlaceholderHeight
      });
    };

    img.src = imageSrc;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1001
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>
          Crop & Resize Image
        </h2>

        {/* Canvas preview */}
        <div style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: isDragging ? 'grabbing' : 'grab',
              maxWidth: '100%'
            }}
          />
        </div>

        {/* Instructions */}
        <div style={{
          padding: '12px',
          backgroundColor: '#eff6ff',
          color: '#1e40af',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '13px'
        }}>
          <strong>Drag</strong> to move the image • <strong>Scroll</strong> to zoom • <strong>Preview</strong> size: {CANVAS_WIDTH} × {CANVAS_HEIGHT}px
        </div>

        {/* Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Zoom: {(scale * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={handleReset}
              style={{
                padding: '10px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                width: '100%'
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4700a3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Apply & Insert
          </button>
        </div>
      </div>
    </div>
  );
}

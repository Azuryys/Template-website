'use client';

import { useEffect, useRef } from 'react';
import useCanvasEditor from '@/hooks/useCanvasEditor';

export default function CanvasEditor({ template, onCanvasReady, onSelectionChange }) {
  const canvasContainerRef = useRef(null);
  const canvasId = 'editor-canvas';
  
  const canvas = useCanvasEditor(canvasId, template, onSelectionChange);

  useEffect(() => {
    if (canvas && onCanvasReady) {
      onCanvasReady(canvas);
    }
  }, [canvas, onCanvasReady]);

  return (
    <div
      ref={canvasContainerRef}
      className="bg-white shadow-2xl rounded-lg overflow-hidden"
      style={{
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    >
      <canvas id={canvasId} />
    </div>
  );
}

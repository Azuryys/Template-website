'use client';

import { useEffect, useRef } from 'react';
import useCanvasEditor from '@/hooks/useCanvasEditor';

export default function CanvasEditor({ template, onCanvasReady, onSelectionChange, hotkeys }) {
  const canvasContainerRef = useRef(null);
  const canvasId = 'editor-canvas';
  
  const { canvas, undo, redo, copy, paste, delete: performDelete, bringForward, sendBackward } = useCanvasEditor(canvasId, template, onSelectionChange, hotkeys);

  useEffect(() => {
    if (canvas && onCanvasReady) {
      onCanvasReady(canvas, { undo, redo, copy, paste, delete: performDelete, bringForward, sendBackward });
    }
  }, [canvas, undo, redo, copy, paste, performDelete, bringForward, sendBackward, onCanvasReady]);

  return (
    <div
      ref={canvasContainerRef}
      className="bg-white shadow-2xl rounded-lg"
      style={{
        width: template.width,
        height: template.height,
        maxWidth: '100%',
        margin: '0 auto',
      }}
    >
      <canvas id={canvasId} width={template.width} height={template.height} />
    </div>
  );
}

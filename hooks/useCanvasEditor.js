import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

export default function useCanvasEditor(canvasId, template, onSelectionChange) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!template) return;

    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasId, {
      width: template.width,
      height: template.height,
      backgroundColor: '#ffffff'
    });

    canvasRef.current = canvas;

    // Selection event handlers
    canvas.on('selection:created', (e) => {
      if (onSelectionChange) {
        onSelectionChange(e.selected[0]);
      }
    });

    canvas.on('selection:updated', (e) => {
      if (onSelectionChange) {
        onSelectionChange(e.selected[0]);
      }
    });

    canvas.on('selection:cleared', () => {
      if (onSelectionChange) {
        onSelectionChange(null);
      }
    });

    // Delete key handler
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          canvas.remove(activeObject);
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
    };
  }, [canvasId, template, onSelectionChange]);

  return canvasRef.current;
}

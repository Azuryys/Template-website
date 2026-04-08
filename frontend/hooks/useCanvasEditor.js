import { useEffect, useState } from 'react';
import { Canvas } from 'fabric';

export default function useCanvasEditor(canvasId, template, onSelectionChange) {
  const [canvas, setCanvas] = useState(null);

  useEffect(() => {
    if (!template) return;

    // Initialize Fabric.js canvas
    const fabricCanvas = new Canvas(canvasId, {
      width: template.width,
      height: template.height,
      backgroundColor: '#ffffff'
    });

    setCanvas(fabricCanvas);

    // Selection event handlers
    fabricCanvas.on('selection:created', (e) => {
      if (onSelectionChange) {
        onSelectionChange(e.selected[0]);
      }
    });

    fabricCanvas.on('selection:updated', (e) => {
      if (onSelectionChange) {
        onSelectionChange(e.selected[0]);
      }
    });

    fabricCanvas.on('selection:cleared', () => {
      if (onSelectionChange) {
        onSelectionChange(null);
      }
    });

    // Delete key handler
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = fabricCanvas.getActiveObject();
        if (activeObject) {
          fabricCanvas.remove(activeObject);
          fabricCanvas.discardActiveObject();
          fabricCanvas.renderAll();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      fabricCanvas.dispose();
      setCanvas(null);
    };
  }, [canvasId, template, onSelectionChange]);

  return canvas;
}

import { useEffect, useRef, useState } from 'react';
import { Canvas } from 'fabric';

export default function useCanvasEditor(canvasId, template, onSelectionChange) {
  const [canvas, setCanvas] = useState(null);
  const onSelectionChangeRef = useRef(onSelectionChange);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

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
      onSelectionChangeRef.current?.(e.selected[0]);
    });

    fabricCanvas.on('selection:updated', (e) => {
      onSelectionChangeRef.current?.(e.selected[0]);
    });

    fabricCanvas.on('selection:cleared', () => {
      onSelectionChangeRef.current?.(null);
    });

    // Delete key handler – ignore when focus is inside an input or textarea
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
        return;
      }
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
  }, [canvasId, template]);

  return canvas;
}

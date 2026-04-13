import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas } from 'fabric';

export default function useCanvasEditor(canvasId, template, onSelectionChange, hotkeys = null) {
  const [canvas, setCanvas] = useState(null);
  const canvasRef = useRef(null);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const hotkeysRef = useRef(hotkeys);
  const historyRef = useRef([]);
  const historyStepRef = useRef(-1);
  const clipboardRef = useRef(null);
  const isUndoRedoRef = useRef(false);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    hotkeysRef.current = hotkeys;
  }, [hotkeys]);

  // Save state to history - use useCallback to maintain stable reference
  const saveState = useCallback(() => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas || isUndoRedoRef.current) return;

    // Use toJSON() instead of JSON.stringify for proper serialization
    const json = fabricCanvas.toJSON();

    // Remove any states after current step (if user made changes after undo)
    historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    historyRef.current.push(json);
    historyStepRef.current = historyRef.current.length - 1;
  }, []);

  // Undo action
  const performUndo = useCallback(async () => {
    if (isUndoRedoRef.current) return;
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas || historyStepRef.current <= 0) return;

    isUndoRedoRef.current = true;
    try {
      historyStepRef.current--;
      const state = historyRef.current[historyStepRef.current];

      await fabricCanvas.loadFromJSON(state);
      fabricCanvas.renderAll();

      // Restore selection callback after load
      onSelectionChangeRef.current?.(fabricCanvas.getActiveObject());
    } finally {
      isUndoRedoRef.current = false;
    }
  }, []);

  // Redo action
  const performRedo = useCallback(async () => {
    if (isUndoRedoRef.current) return;
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas || historyStepRef.current >= historyRef.current.length - 1) return;

    isUndoRedoRef.current = true;
    try {
      historyStepRef.current++;
      const state = historyRef.current[historyStepRef.current];

      await fabricCanvas.loadFromJSON(state);
      fabricCanvas.renderAll();

      onSelectionChangeRef.current?.(fabricCanvas.getActiveObject());
    } finally {
      isUndoRedoRef.current = false;
    }
  }, []);

  // Copy selected object
  const performCopy = useCallback(async () => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas) return;

    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      const cloned = await activeObject.clone();
      clipboardRef.current = cloned;
    }
  }, []);

  // Paste clipped object
  const performPaste = useCallback(async () => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas || !clipboardRef.current) return;

    const clonedObj = await clipboardRef.current.clone();
    fabricCanvas.discardActiveObject();

    // Slightly offset the pasted object
    clonedObj.set({
      left: (clonedObj.left || 0) + 10,
      top: (clonedObj.top || 0) + 10,
      evented: true
    });

    fabricCanvas.add(clonedObj);
    fabricCanvas.setActiveObject(clonedObj);
    fabricCanvas.renderAll();
    saveState();
    onSelectionChangeRef.current?.(clonedObj);
  }, [saveState]);

  // Bring object forward in layer
  const performBringForward = useCallback(() => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas) return;

    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.bringObjectForward(activeObject);
      fabricCanvas.renderAll();
      saveState();
    }
  }, [saveState]);

  // Send object backward in layer
  const performSendBackward = useCallback(() => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas) return;

    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.sendObjectBackwards(activeObject);
      fabricCanvas.renderAll();
      saveState();
    }
  }, [saveState]);

  // Delete action
  const performDelete = useCallback(() => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas) return;

    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.remove(activeObject);
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      saveState();
    }
  }, [saveState]);

  useEffect(() => {
    if (!template) return;

    // Initialize Fabric.js canvas
    const fabricCanvas = new Canvas(canvasId, {
      width: template.width,
      height: template.height,
      backgroundColor: '#ffffff'
    });

    setCanvas(fabricCanvas);
    canvasRef.current = fabricCanvas;

    // Initialize history with empty canvas state
    const initialState = fabricCanvas.toJSON();
    historyRef.current = [initialState];
    historyStepRef.current = 0;

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

    // Save state on object modifications (but not during undo/redo)
    fabricCanvas.on('object:added', saveState);
    fabricCanvas.on('object:modified', saveState);
    fabricCanvas.on('object:removed', saveState);

    // Hotkey handler
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
        return;
      }

      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const pressedKeys = {
        ctrl: isMac ? e.metaKey : e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        key: e.key === ' ' ? 'Space' : e.key,
      };

      // Helper function to check if pressed keys match a hotkey config
      const matchesHotkey = (hotkeyConfig) => {
        if (!hotkeyConfig) return false;
        
        // Normalize the key for comparison
        const configKey = hotkeyConfig.key?.toLowerCase?.() || hotkeyConfig.key;
        const pressedKey = pressedKeys.key?.toLowerCase?.() || pressedKeys.key;

        // Check if all required modifiers match
        if ((hotkeyConfig.ctrl || false) !== (pressedKeys.ctrl || false)) return false;
        if ((hotkeyConfig.shift || false) !== (pressedKeys.shift || false)) return false;
        if ((hotkeyConfig.alt || false) !== (pressedKeys.alt || false)) return false;

        // Check if the key matches
        return configKey === pressedKey;
      };

      const currentHotkeys = hotkeysRef.current || {
        undo: { ctrl: true, key: 'z' },
        redo: { ctrl: true, key: 'y' },
        copy: { ctrl: true, key: 'c' },
        paste: { ctrl: true, key: 'v' },
        delete: { key: 'Delete' },
        bringForward: { ctrl: true, key: ']' },
        sendBackward: { ctrl: true, key: '[' },
      };

      // Check all hotkey actions
      if (matchesHotkey(currentHotkeys.undo)) {
        e.preventDefault();
        performUndo();
        return;
      }

      if (matchesHotkey(currentHotkeys.redo)) {
        e.preventDefault();
        performRedo();
        return;
      }

      if (matchesHotkey(currentHotkeys.copy)) {
        e.preventDefault();
        performCopy();
        return;
      }

      if (matchesHotkey(currentHotkeys.paste)) {
        e.preventDefault();
        performPaste();
        return;
      }

      if (matchesHotkey(currentHotkeys.delete)) {
        e.preventDefault();
        performDelete();
        return;
      }

      if (matchesHotkey(currentHotkeys.bringForward)) {
        e.preventDefault();
        performBringForward();
        return;
      }

      if (matchesHotkey(currentHotkeys.sendBackward)) {
        e.preventDefault();
        performSendBackward();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      fabricCanvas.dispose();
      canvasRef.current = null;
      setCanvas(null);
    };
  }, [canvasId, template, saveState, performUndo, performRedo, performCopy, performPaste, performDelete, performBringForward, performSendBackward]);

  return {
    canvas,
    undo: performUndo,
    redo: performRedo,
    copy: performCopy,
    paste: performPaste,
    delete: performDelete,
    bringForward: performBringForward,
    sendBackward: performSendBackward,
  };
}
import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, ActiveSelection } from 'fabric';

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

  const saveState = useCallback(() => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas || isUndoRedoRef.current) return;

    const json = fabricCanvas.toJSON();
    historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    historyRef.current.push(json);
    historyStepRef.current = historyRef.current.length - 1;
  }, []);

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
      onSelectionChangeRef.current?.(fabricCanvas.getActiveObject());
    } finally {
      isUndoRedoRef.current = false;
    }
  }, []);

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

  // ✅ Updated performCopy — uses getBoundingRect() for true position
  const performCopy = useCallback(async () => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas) return;

    const selectedObjects = fabricCanvas.getActiveObjects();
    if (selectedObjects.length > 0) {
      clipboardRef.current = {
        objects: selectedObjects.map((obj) => {
          const bounds = obj.getBoundingRect();
          return {
            object: obj,
            originalLeft: bounds.left,
            originalTop: bounds.top,
          };
        }),
        pasteCount: 0,
      };
    }
  }, []);

  // ✅ Updated performPaste — clamps to canvas bounds and forces top-left origin
  const performPaste = useCallback(async () => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas || !clipboardRef.current) return;

    fabricCanvas.discardActiveObject();

    const { objects } = clipboardRef.current;
    clipboardRef.current.pasteCount += 1;

    const STEP = 20;
    const offset = STEP * clipboardRef.current.pasteCount;

    const pastedObjects = [];

    for (const item of objects) {
      const clonedObj = await item.object.clone();

      const objWidth = clonedObj.getScaledWidth();
      const objHeight = clonedObj.getScaledHeight();

      const newLeft = Math.max(0, Math.min(
        item.originalLeft + offset,
        fabricCanvas.width - objWidth
      ));
      const newTop = Math.max(0, Math.min(
        item.originalTop + offset,
        fabricCanvas.height - objHeight
      ));

      clonedObj.set({
        left: newLeft,
        top: newTop,
        originX: 'left',
        originY: 'top',
        evented: true,
      });

      fabricCanvas.add(clonedObj);
      pastedObjects.push(clonedObj);
    }

    if (pastedObjects.length > 1) {
      const selection = new ActiveSelection(pastedObjects, { canvas: fabricCanvas });
      fabricCanvas.setActiveObject(selection);
    } else if (pastedObjects.length === 1) {
      fabricCanvas.setActiveObject(pastedObjects[0]);
    }

    fabricCanvas.renderAll();
    saveState();
    onSelectionChangeRef.current?.(fabricCanvas.getActiveObject());
  }, [saveState]);

  const performBringForward = useCallback(() => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas) return;

    const selectedObjects = fabricCanvas.getActiveObjects();
    if (selectedObjects.length > 0) {
      selectedObjects.forEach(obj => fabricCanvas.bringObjectForward(obj));
      fabricCanvas.renderAll();
      saveState();
    }
  }, [saveState]);

  const performSendBackward = useCallback(() => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas) return;

    const selectedObjects = fabricCanvas.getActiveObjects();
    if (selectedObjects.length > 0) {
      selectedObjects.forEach(obj => fabricCanvas.sendObjectBackwards(obj));
      fabricCanvas.renderAll();
      saveState();
    }
  }, [saveState]);

  const performDelete = useCallback(() => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas) return;

    const selectedObjects = fabricCanvas.getActiveObjects();
    if (selectedObjects.length > 0) {
      selectedObjects.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      saveState();
    }
  }, [saveState]);

  useEffect(() => {
    if (!template) return;

    const fabricCanvas = new Canvas(canvasId, {
      width: template.width,
      height: template.height,
      backgroundColor: '#ffffff'
    });

    setCanvas(fabricCanvas);
    canvasRef.current = fabricCanvas;

    const initialState = fabricCanvas.toJSON();
    historyRef.current = [initialState];
    historyStepRef.current = 0;

    fabricCanvas.on('selection:created', (e) => {
      onSelectionChangeRef.current?.(e.selected[0]);
    });

    fabricCanvas.on('selection:updated', (e) => {
      onSelectionChangeRef.current?.(e.selected[0]);
    });

    fabricCanvas.on('selection:cleared', () => {
      onSelectionChangeRef.current?.(null);
    });

    fabricCanvas.on('object:added', saveState);
    fabricCanvas.on('object:modified', saveState);
    fabricCanvas.on('object:removed', saveState);

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

      const matchesHotkey = (hotkeyConfig) => {
        if (!hotkeyConfig) return false;
        const configKey = hotkeyConfig.key?.toLowerCase?.() || hotkeyConfig.key;
        const pressedKey = pressedKeys.key?.toLowerCase?.() || pressedKeys.key;
        if ((hotkeyConfig.ctrl || false) !== (pressedKeys.ctrl || false)) return false;
        if ((hotkeyConfig.shift || false) !== (pressedKeys.shift || false)) return false;
        if ((hotkeyConfig.alt || false) !== (pressedKeys.alt || false)) return false;
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

      if (matchesHotkey(currentHotkeys.undo)) { e.preventDefault(); performUndo(); return; }
      if (matchesHotkey(currentHotkeys.redo)) { e.preventDefault(); performRedo(); return; }
      if (matchesHotkey(currentHotkeys.copy)) { e.preventDefault(); performCopy(); return; }
      if (matchesHotkey(currentHotkeys.paste)) { e.preventDefault(); performPaste(); return; }
      if (matchesHotkey(currentHotkeys.delete)) { e.preventDefault(); performDelete(); return; }
      if (matchesHotkey(currentHotkeys.bringForward)) { e.preventDefault(); performBringForward(); return; }
      if (matchesHotkey(currentHotkeys.sendBackward)) { e.preventDefault(); performSendBackward(); return; }
    };

    document.addEventListener('keydown', handleKeyDown);

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
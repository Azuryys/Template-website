import { useState, useEffect } from 'react';

export function useHotkeys() {
  const [hotkeys, setHotkeys] = useState({
    undo: { ctrl: true, key: 'z' },
    redo: { ctrl: true, key: 'y' },
    copy: { ctrl: true, key: 'c' },
    paste: { ctrl: true, key: 'v' },
    delete: { key: 'Delete' },
    bringForward: { ctrl: true, key: ']' },
    sendBackward: { ctrl: true, key: '[' },
    mirror: { ctrl: true, key: 'm' },
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [recordingAction, setRecordingAction] = useState(null);
  const [recordedKeys, setRecordedKeys] = useState({});
  const [hotkeyError, setHotkeyError] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('canvasHotkeys') || '{}');
      if (Object.keys(saved).length > 0) setHotkeys(saved);
    } catch (e) {}
  }, []);

  const handleSaveHotkey = () => {
    if (!recordingAction || Object.keys(recordedKeys).length === 0) {
      setHotkeyError('Please record a hotkey');
      return;
    }

    const hotkeyToString = (h) => JSON.stringify({ ctrl: !!h.ctrl, shift: !!h.shift, alt: !!h.alt, key: (h.key || '').toLowerCase() });
    const newHotkeyString = hotkeyToString(recordedKeys);
    let conflictingAction = null;

    for (const [action, h] of Object.entries(hotkeys)) {
      if (action === recordingAction) continue;
      if (hotkeyToString(h) === newHotkeyString) {
        conflictingAction = action;
        break;
      }
    }

    if (conflictingAction) {
      setHotkeyError(`This hotkey is already used. Please choose a different hotkey.`);
      return;
    }

    const updated = { ...hotkeys, [recordingAction]: recordedKeys };
    setHotkeys(updated);
    localStorage.setItem('canvasHotkeys', JSON.stringify(updated));
    setRecordingAction(null);
    setRecordedKeys({});
    setHotkeyError(null);
  };

  const handleResetHotkeys = () => {
    const defaultHotkeys = {
      undo: { ctrl: true, key: 'z' }, redo: { ctrl: true, key: 'y' },
      copy: { ctrl: true, key: 'c' }, paste: { ctrl: true, key: 'v' },
      delete: { key: 'Delete' }, bringForward: { ctrl: true, key: ']' },
      sendBackward: { ctrl: true, key: '[' }, mirror: { ctrl: true, key: 'm' },
    };
    setHotkeys(defaultHotkeys);
    localStorage.setItem('canvasHotkeys', JSON.stringify(defaultHotkeys));
    setRecordingAction(null);
    setRecordedKeys({});
  };

  return {
    hotkeys, setHotkeys,
    showSettingsModal, setShowSettingsModal,
    recordingAction, setRecordingAction,
    recordedKeys, setRecordedKeys,
    hotkeyError, setHotkeyError,
    handleSaveHotkey, handleResetHotkeys
  };
}
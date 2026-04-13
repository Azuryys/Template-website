'use client';

import { getTemplate } from '@/lib/templates';
import { getTemplateInitializer } from '@/lib/templateInitializers';
import CanvasEditor from '@/components/CanvasEditor';
import Sidebar from '@/components/Sidebar';
import { useState, use, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { FabricImage } from 'fabric';
import { FaUndo, FaRedo, FaCopy, FaPaste, FaTrash, FaCog, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const logoImages = [
  { name: 'Default', file: 'Logo_default.png' },
  { name: 'Black', file: 'Logo_black.png' },
  { name: 'White', file: 'Logo_white.png' },
  { name: 'Aqua', file: 'Logo_aqua.png' },
  { name: 'Lavender', file: 'Logo_lavender.png' },
  { name: 'Lemon', file: 'Logo_lemon.png' },
  { name: 'Mint', file: 'Logo_mint.png' },
  { name: 'Taffy', file: 'Logo_taffy.png' },
];
const AudiologoImages = [
  { name: 'Mint', file: 'Mint.png' },
  { name: 'Light Mint', file: 'Light_Mint.png' },
  { name: 'Dark Mint', file: 'Dark_Mint.png' },
  { name: 'Lavender', file: 'Lavender.png' },
  { name: 'Light Lavender', file: 'Light_Lavender.png' },
  { name: 'Dark Lavender', file: 'Dark_Lavender.png' },
  { name: 'Peach', file: 'Peach.png' },
  { name: 'Light Peach', file: 'Light_Peach.png' },
  { name: 'Dark Peach', file: 'Dark_Peach.png' },
  { name: 'Lemon', file: 'Lemon.png' },
  { name: 'Light Lemon', file: 'Light_Lemon.png' },
  { name: 'Dark Lemon', file: 'Dark_Lemon.png' },
  { name: 'Aqua', file: 'Aqua.png' },
  { name: 'Light Aqua', file: 'Light_Aqua.png' },
  { name: 'Dark Aqua', file: 'Dark_Aqua.png' },
  { name: 'Taffy', file: 'Taffy.png' },
  { name: 'Light Taffy', file: 'Light_Taffy.png' },
  { name: 'Dark Taffy', file: 'Dark_Taffy.png' },
];

const colorGroups = {
  Mint:     ['Mint', 'Light Mint', 'Dark Mint'],
  Lavender: ['Lavender', 'Light Lavender', 'Dark Lavender'],
  Peach:    ['Peach', 'Light Peach', 'Dark Peach'],
  Lemon:    ['Lemon', 'Light Lemon', 'Dark Lemon'],
  Aqua:     ['Aqua', 'Light Aqua', 'Dark Aqua'],
  Taffy:    ['Taffy', 'Light Taffy', 'Dark Taffy'],
};

function AudioLogoMenu({ handleAddAudioLogo }) {
  const [openColor, setOpenColor] = useState(null);

  const findLogo = (name) => AudiologoImages.find((l) => l.name === name);

  return (
    <div className="relative">
      {/* Main dropdown trigger */}
      <div className="relative group">
        <button className="text-black hover:text-black font-medium px-3 py-1 rounded hover:bg-gray-100 transition-colors">
          Audio Logo ▾
        </button>

        {/* Color list */}
        <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 py-1">
          {Object.entries(colorGroups).map(([color, variants]) => (
            <div
              key={color}
              className="relative"
              onMouseEnter={() => setOpenColor(color)}
              onMouseLeave={() => setOpenColor(null)}
            >
              {/* Color row */}
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between transition-colors">
                <span>{color}</span>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Variants submenu */}
              {openColor === color && (
                <div className="absolute left-full top-0 ml-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2">
                  <div className="grid grid-cols-1 gap-1">
                    {variants.map((variantName) => {
                      const logo = findLogo(variantName);
                      if (!logo) return null;
                      return (
                        <button
                          key={logo.file}
                          onClick={() => handleAddAudioLogo(logo.file)}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        >
                          <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded border border-gray-100">
                            <img
                              src={`/BauerImages/Logo_Audio/${logo.file}`}
                              alt={logo.name}
                              className="max-h-8 max-w-full object-contain"
                            />
                          </div>
                          <span className="text-xs text-gray-600">{logo.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EditorPage({ params }) {
  const { templateId } = use(params);
  const searchParams = useSearchParams();

  const template = useMemo(() => {
    if (templateId === 'custom') {
      return {
        id: 'custom',
        name: 'Custom',
        width: parseInt(searchParams.get('width'), 10) || 800,
        height: parseInt(searchParams.get('height'), 10) || 600,
        description: 'Custom resolution',
        logo: { widthRatio: 0.20, leftRatio: 0.06, topRatio: 0.05 },
      };
    }
    return getTemplate(templateId);
  // searchParams identity is stable; primitive values from get() are compared by value via deps below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, searchParams.get('width'), searchParams.get('height')]);
  const [canvas, setCanvas] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [selectedLoadTemplate, setSelectedLoadTemplate] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [canvasActions, setCanvasActions] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [hotkeys, setHotkeys] = useState({
    undo: { ctrl: true, key: 'z' },
    redo: { ctrl: true, key: 'y' },
    copy: { ctrl: true, key: 'c' },
    paste: { ctrl: true, key: 'v' },
    delete: { key: 'Delete' },
    bringForward: { ctrl: true, key: ']' },
    sendBackward: { ctrl: true, key: '[' },
  });
  const [recordingAction, setRecordingAction] = useState(null);
  const [recordedKeys, setRecordedKeys] = useState({});
  const pendingPlaceholderRef = useRef(null);

  // Load saved templates and hotkeys from localStorage
  useEffect(() => {
    try {
      const templates = JSON.parse(localStorage.getItem('savedTemplates') || '[]');
      setSavedTemplates(templates);
      
      const savedHotkeys = JSON.parse(localStorage.getItem('canvasHotkeys') || '{}');
      if (Object.keys(savedHotkeys).length > 0) {
        setHotkeys(savedHotkeys);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Helper function to format hotkey for display
  const formatHotkey = (hotkeyObj) => {
    if (!hotkeyObj) return '';
    const parts = [];
    if (hotkeyObj.ctrl) parts.push('Ctrl');
    if (hotkeyObj.shift) parts.push('Shift');
    if (hotkeyObj.alt) parts.push('Alt');
    if (hotkeyObj.key) {
      const keyDisplay = hotkeyObj.key.length === 1 ? hotkeyObj.key.toUpperCase() : hotkeyObj.key;
      parts.push(keyDisplay);
    }
    return parts.join('+');
  };

  // Handle hotkey recording
  const handleStartRecording = (action) => {
    setRecordingAction(action);
    setRecordedKeys({});
  };

  const handleKeyRecord = (e) => {
    if (!recordingAction) return;
    e.preventDefault();

    const newKeys = {
      ctrl: e.ctrlKey || e.metaKey,
      shift: e.shiftKey,
      alt: e.altKey,
      key: e.key === ' ' ? 'Space' : e.key,
    };

    // Remove empty properties
    Object.keys(newKeys).forEach(k => !newKeys[k] && delete newKeys[k]);

    setRecordedKeys(newKeys);
  };

  const handleSaveHotkey = () => {
    if (!recordingAction || Object.keys(recordedKeys).length === 0) {
      alert('Please record a hotkey');
      return;
    }

    const updatedHotkeys = { ...hotkeys, [recordingAction]: recordedKeys };
    setHotkeys(updatedHotkeys);
    localStorage.setItem('canvasHotkeys', JSON.stringify(updatedHotkeys));
    setRecordingAction(null);
    setRecordedKeys({});
  };

  const handleResetHotkeys = () => {
    const defaultHotkeys = {
      undo: { ctrl: true, key: 'z' },
      redo: { ctrl: true, key: 'y' },
      copy: { ctrl: true, key: 'c' },
      paste: { ctrl: true, key: 'v' },
      delete: { key: 'Delete' },
      bringForward: { ctrl: true, key: ']' },
      sendBackward: { ctrl: true, key: '[' },
    };
    setHotkeys(defaultHotkeys);
    localStorage.setItem('canvasHotkeys', JSON.stringify(defaultHotkeys));
    setRecordingAction(null);
    setRecordedKeys({});
  };

  const handleCanvasReady = useCallback((canvasInstance, actions) => {
    setCanvas(canvasInstance);
    setCanvasActions(actions);
    
    // Initialize template-specific preloaded elements
    const initializer = getTemplateInitializer(templateId);
    if (initializer) {
      const elements = initializer(template);
      elements.forEach((element) => {
        canvasInstance.add(element);
      });
      canvasInstance.renderAll();
    }

    // Handle placeholder click events
    canvasInstance.on('mouse:dblclick', (options) => {
  if (options.target && options.target.isPlaceholder) {
    handlePlaceholderClick(options.target);
  }
});
  }, [templateId, template]);

  const handleSelectionChange = useCallback((obj) => {
    setSelectedObject(obj);
  }, []);

  const handleClearCanvas = () => {
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      setSelectedObject(null);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (!canvas) {
      alert('Canvas not ready');
      return;
    }

    try {
      // Get canvas data as JSON
      const canvasData = canvas.toJSON();
      
      // Create template object with sourceTemplateId for categorization
      const newTemplate = {
        id: `custom-${Date.now()}`,
        name: templateName,
        width: template.width,
        height: template.height,
        description: `Custom template created from ${template.name}`,
        canvasData: canvasData,
        createdAt: new Date().toISOString(),
        sourceTemplateId: templateId, // Store the original template category
      };

      // Save to localStorage
      const currentSavedTemplates = JSON.parse(localStorage.getItem('savedTemplates') || '[]');
      currentSavedTemplates.push(newTemplate);
      localStorage.setItem('savedTemplates', JSON.stringify(currentSavedTemplates));
      setSavedTemplates(currentSavedTemplates);

      // Reset modal
      setShowSaveModal(false);
      setTemplateName('');
      
      alert(`Template "${templateName}" saved successfully!`);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleLoadTemplate = () => {
    if (!selectedLoadTemplate || !canvas) {
      alert('Please select a template to load');
      return;
    }

    try {
      const templateName = selectedLoadTemplate.name;
      
      // Close modal and reset state first
      setShowLoadModal(false);
      setSelectedLoadTemplate(null);
      
      // Clear current canvas
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      
      // Load the saved template data
      canvas.loadFromJSON(selectedLoadTemplate.canvasData, () => {
        // Ensure all objects are visible
        canvas.forEachObject((obj) => {
          obj.visible = true;
        });
        
        // Force re-render and recalculate
        canvas.calcOffset();
        canvas.renderAll();
        setSelectedObject(null);
        
        // Force another render after a tick to ensure visibility
        setTimeout(() => {
          canvas.renderAll();
        }, 0);
      });
      
      // Show success message after a short delay
      setTimeout(() => {
        alert(`Template "${templateName}" loaded successfully!`);
      }, 300);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template');
    }
  };

  const handlePlaceholderClick = (placeholder) => {
    if (canvas) {
      canvas.discardActiveObject();
      canvas.renderAll();
    }
    pendingPlaceholderRef.current = placeholder;
    setShowImageModal(true);
  };

  const handleImageFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 200MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      insertImageIntoPlaceholder(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlSubmit = () => {
    const url = imageUrlInput.trim();
    if (!url) {
      alert('Please enter a valid image URL');
      return;
    }
    insertImageIntoPlaceholder(url);
    setImageUrlInput('');
  };

  const insertImageIntoPlaceholder = (imageSource) => {
  const placeholder = pendingPlaceholderRef.current;
  if (!canvas || !placeholder) return;

  // Use bounding rect to get the true rendered position and size
  const boundingRect = placeholder.getBoundingRect();
  const placeholderLeft = boundingRect.left;
  const placeholderTop = boundingRect.top;
  const placeholderWidth = boundingRect.width;
  const placeholderHeight = boundingRect.height;

  FabricImage.fromURL(imageSource, { crossOrigin: 'anonymous' }).then((img) => {
    const scaleX = placeholderWidth / img.width;
    const scaleY = placeholderHeight / img.height;  
    const scale = Math.min(scaleX, scaleY);

    img.scale(scale);
    img.set({
      left: placeholderLeft + placeholderWidth / 2,
      top: placeholderTop + placeholderHeight / 2,
      originX: 'center',
      originY: 'center',
      name: 'headerImage',
    });

    canvas.remove(placeholder);
    canvas.add(img);
    canvas.renderAll();
    pendingPlaceholderRef.current = null;
    setShowImageModal(false);
  }).catch((error) => {
    console.error('Error loading image:', error);
    alert('Failed to load image. Please check the URL or try a different image.');
  });
};

  const handleAddLogo = (file) => {
    if (!canvas) return;
    const url = `/BauerImages/Logo/${file}`;
    FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      const placement = template.logo ?? { widthRatio: 0.20, leftRatio: 0.06, topRatio: 0.05 };
      const logoWidth = canvas.width * placement.widthRatio;
      const scale = logoWidth / img.width;
      img.scale(scale);
      img.set({
        left: canvas.width * placement.leftRatio,
        top: canvas.height * placement.topRatio,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  };

  const handleAddAudioLogo = (file) => {
    if (!canvas) return;
    const url = `/BauerImages/Logo_Audio/${file}`;
    FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      const placement = template.audioLogo ?? { 
        widthRatio: 0.20,        // base reference size
        leftRatio: 0.06, 
        topRatio: 0.05,
        horizontalStretch: 1.0,  // 1.0 = normal width
        verticalStretch: 1.0     // 1.0 = normal height
      };
      
      // Calculate base scale from widthRatio (used as reference)
      const baseSize = canvas.width * placement.widthRatio;
      const baseScale = baseSize / img.width;
      
      // Apply independent stretch factors
      const hStretch = placement.horizontalStretch ?? 1.0;
      const vStretch = placement.verticalStretch ?? 1.0;
      
      img.set({
        left: canvas.width * placement.leftRatio,
        top: canvas.height * placement.topRatio,
        scaleX: -baseScale * hStretch,   // negative for flip
        scaleY: baseScale * vStretch,    // vertical stretch independent
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  };



  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back
            </a>
            <div className="border-l border-gray-300 h-6"></div>
            <h1 className="text-xl font-semibold text-black">
              {template.name}
            </h1>
            <span className="text-sm text-black font-mono">
              {template.width} × {template.height}
            </span>
            <div className="border-l border-gray-300 h-6"></div>
            
            {/* Logo Dropdown */}
            <div className="relative group">
              <button className="text-black hover:text-black font-medium px-3 py-1 rounded hover:bg-gray-100 transition-colors">
                Logo ▾
              </button>
              <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <div className="p-2 grid grid-cols-2 gap-2">
                  {logoImages.map((logo) => (
                    <button
                      key={logo.file}
                      onClick={() => handleAddLogo(logo.file)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                    >
                      <div className="w-full h-16 flex items-center justify-center bg-gray-50 rounded">
                        <img
                          src={`/BauerImages/Logo/${logo.file}`}
                          alt={logo.name}
                          className="max-h-14 max-w-full object-contain"
                        />
                      </div>
                      <span className="text-xs text-gray-600">{logo.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Audio Logo Menu */}
            <AudioLogoMenu handleAddAudioLogo={handleAddAudioLogo} />
            
            {/* Canvas Action Toolbar */}
            <div className="border-l border-gray-300 h-6"></div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => canvasActions?.undo()}
                title="Undo (Ctrl+Z)"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                <FaUndo className="w-4 h-4" />
              </button>
              <button
                onClick={() => canvasActions?.redo()}
                title="Redo (Ctrl+Y)"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                <FaRedo className="w-4 h-4" />
              </button>
              <div className="border-l border-gray-300 h-5 mx-1"></div>
              <button
                onClick={() => canvasActions?.copy()}
                title="Copy (Ctrl+C)"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                <FaCopy className="w-4 h-4" />
              </button>
              <button
                onClick={() => canvasActions?.paste()}
                title="Paste (Ctrl+V)"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                <FaPaste className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (selectedObject && canvas) {
                    canvas.remove(selectedObject);
                    canvas.discardActiveObject();
                    canvas.renderAll();
                  }
                }}
                title="Delete (Delete/Backspace)"
                className="p-2 text-black hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <FaTrash className="w-4 h-4" />
              </button>
              <div className="border-l border-gray-300 h-5 mx-1"></div>
              <button
                onClick={() => canvasActions?.bringForward()}
                title="Bring Forward (Ctrl+])"
                className="p-2 text-black hover:text-black hover:bg-gray-100 rounded transition-colors"
              >
                <FaArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => canvasActions?.sendBackward()}
                title="Send Backward (Ctrl+[)"
                className="p-2 text-black hover:text-black hover:bg-gray-100 rounded transition-colors"
              >
                <FaArrowDown className="w-4 h-4" />
              </button>
            </div>
            
            <div className="border-l border-gray-300 h-6"></div>
            <button
              onClick={() => setShowSaveModal(true)}
              className="text-black hover:text-black font-medium px-4 py-2 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              Save as Template
            </button>

            {/* Load Template Dropdown */}
            {savedTemplates.filter(t => t.sourceTemplateId === templateId).length > 0 && (
              <div className="relative group">
                <button className="text-black hover:text-black font-medium px-4 py-2 rounded bg-green-50 hover:bg-green-100 border border-green-200 transition-colors">
                  Load Template ▾
                </button>
                <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {savedTemplates
                      .filter(tmpl => tmpl.sourceTemplateId === templateId)
                      .map((tmpl) => (
                      <button
                        key={tmpl.id}
                        onClick={() => {
                          setSelectedLoadTemplate(tmpl);
                          setShowLoadModal(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                      >
                        <div className="font-medium text-gray-900">{tmpl.name}</div>
                        <div className="text-xs text-gray-500">
                          {tmpl.width} × {tmpl.height}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(tmpl.createdAt).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            title="Settings"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <FaCog className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
<div className="flex-1 overflow-auto bg-gray-100">
  <div className="min-h-full flex items-center justify-center p-8">
    <CanvasEditor
      template={template}
      onCanvasReady={handleCanvasReady}
      onSelectionChange={handleSelectionChange}
      hotkeys={hotkeys}
    />
  </div>
</div>

        {/* Right Sidebar */}
        <Sidebar
          canvas={canvas}
          selectedObject={selectedObject}
          template={template}
          onClearCanvas={handleClearCanvas}
        />
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h2 className="text-xl font-bold text-black mb-4">Save as Template</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveTemplate()}
                placeholder="Enter template name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setTemplateName('');
                }}
                className="flex-1 px-4 py-2 text-black font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Template Modal */}
      {showLoadModal && selectedLoadTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h2 className="text-xl font-bold text-black mb-4">Load Template</h2>
            <p className="text-black mb-6">
              Loading this template will replace the current canvas. This action cannot be undone.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <div className="font-medium text-black">{selectedLoadTemplate.name}</div>
              <div className="text-sm text-black">
                {selectedLoadTemplate.width} × {selectedLoadTemplate.height}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(selectedLoadTemplate.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLoadModal(false);
                  setSelectedLoadTemplate(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLoadTemplate}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Selection Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[480px]">
            <h2 className="text-xl font-bold text-black mb-4">Add Header Image</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                Upload from computer
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                className="w-full text-sm text-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">Max 200MB • JPG, PNG, GIF, WebP</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                Or enter an image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleImageUrlSubmit()}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleImageUrlSubmit}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  pendingPlaceholderRef.current = null;
                  setImageUrlInput('');
                }}
                className="px-4 py-2 text-black font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[600px] overflow-y-auto">
            <h2 className="text-2xl font-bold text-black mb-6">Hotkey Settings</h2>
            
            <div className="space-y-4 mb-6">
              {[
                { action: 'undo', label: 'Undo' },
                { action: 'redo', label: 'Redo' },
                { action: 'copy', label: 'Copy' },
                { action: 'paste', label: 'Paste' },
                { action: 'delete', label: 'Delete' },
                { action: 'bringForward', label: 'Bring Forward' },
                { action: 'sendBackward', label: 'Send Backward' },
              ].map(({ action, label }) => (
                <div key={action} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-black">{label}</label>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-black">
                      {formatHotkey(hotkeys[action])}
                    </span>
                  </div>
                  {recordingAction === action ? (
                    <div className="space-y-2">
                      <input
                        autoFocus
                        onKeyDown={handleKeyRecord}
                        type="text"
                        readOnly
                        value={Object.keys(recordedKeys).length > 0 ? formatHotkey(recordedKeys) : 'Press any key...'}
                        className="w-full px-3 py-2 border-2 border-blue-500 rounded bg-blue-50 text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveHotkey}
                          className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setRecordingAction(null);
                            setRecordedKeys({});
                          }}
                          className="flex-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartRecording(action)}
                      className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResetHotkeys}
                className="flex-1 px-4 py-2 text-black font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

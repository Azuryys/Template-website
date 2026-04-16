'use client';

import { getTemplate } from '@/lib/templates';
import { getTemplateInitializer } from '@/lib/templateInitializers';
import CanvasEditor from '@/components/CanvasEditor';
import Sidebar from '@/components/Sidebar';
import { useState, use, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { FabricImage } from 'fabric';
import { FaUndo, FaRedo, FaCopy, FaPaste, FaTrash, FaCog, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { MdFlip } from 'react-icons/md';

import AudioLogoMenu from '@/components/editor/AudioLogoMenu';
import ContentMenu from '@/components/editor/ContentMenu';

import { useTemplates } from '@/hooks/useTemplates';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useLogos } from '@/hooks/useLogos';
import { useRecentImages } from '@/hooks/useRecentImages';

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, searchParams.get('width'), searchParams.get('height')]);

  const [canvas, setCanvas] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [canvasActions, setCanvasActions] = useState(null);
  const pendingPlaceholderRef = useRef(null);

  const { logoImages, audioLogoImages } = useLogos();
  const { recentImages, saveRecentImage } = useRecentImages();
  const { savedTemplates, showSaveModal, setShowSaveModal, templateName, setTemplateName, showLoadModal, setShowLoadModal, selectedLoadTemplate, setSelectedLoadTemplate, fetchSavedTemplates } = useTemplates(templateId);
  const { hotkeys, setHotkeys, showSettingsModal, setShowSettingsModal, recordingAction, setRecordingAction, recordedKeys, setRecordedKeys, hotkeyError, setHotkeyError, handleSaveHotkey, handleResetHotkeys } = useHotkeys();

  // Helper function for display
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

  const handleKeyRecord = (e) => {
    if (!recordingAction) return;
    e.preventDefault();

    const modifierKeys = ['Control', 'Shift', 'Alt', 'Meta'];
    let keyChar = e.key === ' ' ? 'Space' : e.key;

    if (modifierKeys.includes(keyChar)) {
      keyChar = undefined;
    }

    const newKeys = {
      ctrl: e.ctrlKey || e.metaKey,
      shift: e.shiftKey,
      alt: e.altKey,
      key: keyChar,
    };

    Object.keys(newKeys).forEach(k => !newKeys[k] && delete newKeys[k]);

    if (!newKeys.key) {
      return;
    }

    setRecordedKeys(newKeys);
  };

  const handleCanvasReady = useCallback((canvasInstance, actions) => {
    setCanvas(canvasInstance);
    setCanvasActions(actions);
    
    const initializer = getTemplateInitializer(templateId);
    if (initializer) {
      const elements = initializer(template);
      elements.forEach((element) => {
        canvasInstance.add(element);
      });
      canvasInstance.renderAll();
    }

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

  const handleMirrorImage = () => {
    if (selectedObject && selectedObject.type === 'image') {
      selectedObject.set('flipX', !selectedObject.flipX);
      canvas.renderAll();
    }
  };

  useEffect(() => {
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

      if (matchesHotkey(hotkeys.mirror)) {
        e.preventDefault();
        handleMirrorImage();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hotkeys, selectedObject, canvas]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (!canvas) {
      alert('Canvas not ready');
      return;
    }

    try {
      const canvasData = canvas.toJSON();

      const response = await fetch('http://localhost:3001/api/templates', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          description: `Custom template created from ${template.name}`,
          width: template.width,
          height: template.height,
          canvasData,
          sourceTemplateId: templateId,
          templateType: 'canvas',
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save template');
      }

      await fetchSavedTemplates();

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
      const loadTemplateName = selectedLoadTemplate.name;
      
      setShowLoadModal(false);
      setSelectedLoadTemplate(null);
      
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      
      canvas.loadFromJSON(selectedLoadTemplate.canvasData, () => {
        try {
          canvas.forEachObject((obj) => {
            obj.visible = true;
            if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
              obj.set({
                originX: 'left',
                originY: 'top',
              });
            }
          });

          canvas.calcOffset();
          canvas.renderAll();
          setSelectedObject(null);

          setTimeout(() => {
            try {
              canvas.renderAll();
            } catch (err) {
              console.error('Error in setTimeout callback:', err);
            }
          }, 0);
        } catch (callbackError) {
          console.error('Error in loadFromJSON callback:', callbackError);
          setSelectedObject(null);
          alert('Error processing template data');
        }
      });
      
      setTimeout(() => {
        alert(`Template "${loadTemplateName}" loaded successfully!`);
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

      saveRecentImage(imageSource);
    }).catch((error) => {
      console.error('Error loading image:', error);
      alert('Failed to load image. Please check the URL or try a different image.');
    });
  };

  const handleAddLogo = (file) => {
    if (!canvas) return;
    FabricImage.fromURL(file, { crossOrigin: 'anonymous' }).then((img) => {
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
    FabricImage.fromURL(file, { crossOrigin: 'anonymous' }).then((img) => {
      const placement = template.audioLogo ?? { 
        widthRatio: 0.20,
        leftRatio: 0.06, 
        topRatio: 0.05,
        horizontalStretch: 1.0,
        verticalStretch: 1.0
      };
      
      const baseSize = canvas.width * placement.widthRatio;
      const baseScale = baseSize / img.width;
      
      const hStretch = placement.horizontalStretch ?? 1.0;
      const vStretch = placement.verticalStretch ?? 1.0;
      
      img.set({
        left: canvas.width * placement.leftRatio,
        top: canvas.height * placement.topRatio,
        scaleX: -baseScale * hStretch,
        scaleY: baseScale * vStretch,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  };

  const handleAddContentImage = (imageSource) => {
    if (!canvas) return;
    FabricImage.fromURL(imageSource, { crossOrigin: 'anonymous' }).then((img) => {
      const maxWidth = canvas.width * 0.5;
      const maxHeight = canvas.height * 0.5;
      
      const scale = Math.min(
        maxWidth / img.width,
        maxHeight / img.height
      );
      
      img.scale(scale);
      img.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
      });
      
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    }).catch((error) => {
      console.error('Error loading image:', error);
      alert('Failed to load image. Please try again.');
    });
  };

  const hotkeyToString = (hotkey) => {
    if (!hotkey) return '';
    return JSON.stringify({
      ctrl: hotkey.ctrl || false,
      shift: hotkey.shift || false,
      alt: hotkey.alt || false,
      key: (hotkey.key || '').toLowerCase(),
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
                      key={logo.id}
                      onClick={() => handleAddLogo(logo.filePath)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                    >
                      <div className="w-full h-16 flex items-center justify-center bg-gray-50 rounded">
                        <img
                          src={logo.filePath}
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
            <AudioLogoMenu audioLogos={audioLogoImages} handleAddAudioLogo={handleAddAudioLogo} />
            
            {/* Content Menu */}
            <ContentMenu 
              recentImages={recentImages} 
              onSelectImage={handleAddContentImage}
            />
            
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
                onClick={() => canvasActions?.delete()}
                title="Delete (Delete/Backspace)"
                className="p-2 text-black hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <FaTrash className="w-4 h-4" />
              </button>
              <div className="border-l border-gray-300 h-5 mx-1"></div>
              <button
                onClick={() => canvasActions?.bringForward()}
                disabled={!selectedObject}
                title="Bring Forward (Ctrl+])"
                className={`p-2 rounded transition-colors ${
                  selectedObject
                    ? 'text-black hover:text-black hover:bg-gray-100 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <FaArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => canvasActions?.sendBackward()}
                disabled={!selectedObject}
                title="Send Backward (Ctrl+[)"
                className={`p-2 rounded transition-colors ${
                  selectedObject
                    ? 'text-black hover:text-black hover:bg-gray-100 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <FaArrowDown className="w-4 h-4" />
              </button>
              <div className="border-l border-gray-300 h-5 mx-1"></div>
              <button
                onClick={handleMirrorImage}
                disabled={!selectedObject || selectedObject.type !== 'image'}
                title="Mirror Image"
                className={`p-2 rounded transition-colors ${
                  selectedObject && selectedObject.type === 'image'
                    ? 'text-black hover:text-black hover:bg-gray-100 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <MdFlip className="w-4 h-4" />
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
          onImageUpload={saveRecentImage}
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
            
            {hotkeyError && (
              <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
                <p className="text-sm text-red-700 font-medium">{hotkeyError}</p>
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              {[
                { action: 'undo', label: 'Undo' },
                { action: 'redo', label: 'Redo' },
                { action: 'copy', label: 'Copy' },
                { action: 'paste', label: 'Paste' },
                { action: 'delete', label: 'Delete' },
                { action: 'bringForward', label: 'Bring Forward' },
                { action: 'sendBackward', label: 'Send Backward' },
                { action: 'mirror', label: 'Mirror Image' },
              ].map(({ action, label }) => {
                const isConflictingAction = hotkeyError && recordedKeys.key && hotkeyToString(hotkeys[action]) === hotkeyToString(recordedKeys) && action !== recordingAction;
                return (
                  <div key={action} className={`border rounded-lg p-3 transition-colors ${
                    isConflictingAction 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-black">{label}</label>
                      <span className={`text-sm font-mono px-2 py-1 rounded ${
                        isConflictingAction
                          ? 'bg-red-200 text-red-700 font-semibold'
                          : 'bg-gray-100 text-black'
                      }`}>
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
                              setHotkeyError(null);
                            }}
                            className="flex-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setRecordingAction(action);
                          setHotkeyError(null);
                        }}
                        className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleResetHotkeys();
                  setHotkeyError(null);
                }}
                className="flex-1 px-4 py-2 text-black font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
              >
                Reset to Default
              </button>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setHotkeyError(null);
                  setRecordingAction(null);
                  setRecordedKeys({});
                }}
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

'use client';

import { getTemplate } from '@/lib/templates';
import { getTemplateInitializer } from '@/lib/templateInitializers';
import CanvasEditor from '@/components/CanvasEditor';
import Sidebar from '@/components/Sidebar';
import ImageUploadModal from '@/components/ImageUploadModal';
import ImageCropperModal from '@/components/ImageCropperModal';
import { useState, use, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { FabricImage } from 'fabric';

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
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [showImageCropperModal, setShowImageCropperModal] = useState(false);
  const [selectedImageData, setSelectedImageData] = useState(null);
  const [placeholderDimensions, setPlaceholderDimensions] = useState(null);
  const pendingPlaceholderRef = useRef(null);

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const templates = JSON.parse(localStorage.getItem('savedTemplates') || '[]');
      setSavedTemplates(templates);
    } catch (error) {
      console.error('Error loading saved templates:', error);
    }
  }, []);

  const handleCanvasReady = useCallback((canvasInstance) => {
    setCanvas(canvasInstance);
    
    // Initialize template-specific preloaded elements
    const initializer = getTemplateInitializer(templateId);
    if (initializer) {
      const elements = initializer();
      elements.forEach((element) => {
        canvasInstance.add(element);
      });
      canvasInstance.renderAll();
    }

    // Handle placeholder click events
    canvasInstance.on('mouse:down', (options) => {
      if (options.target && options.target.isPlaceholder) {
        handlePlaceholderClick(options.target);
      }
    });
  }, [templateId]);

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
      
      // Create template object
      const newTemplate = {
        id: `custom-${Date.now()}`,
        name: templateName,
        width: template.width,
        height: template.height,
        description: `Custom template created from ${template.name}`,
        canvasData: canvasData,
        createdAt: new Date().toISOString(),
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
    setPlaceholderDimensions({
      width: placeholder.width,
      height: placeholder.height
    });
    setShowImageUploadModal(true);
  };

  const handleImageSelected = (imageData) => {
    // Store the image data and show the cropper modal
    setSelectedImageData(imageData);
    setShowImageUploadModal(false);
    setShowImageCropperModal(true);
  };

  const handleImageCropConfirm = (croppedImageData) => {
    // Insert the cropped image into the canvas
    insertImageIntoPlaceholder(croppedImageData.src);
    setShowImageCropperModal(false);
    setSelectedImageData(null);
    setPlaceholderDimensions(null);
  };

  const handleImageUploadClose = () => {
    setShowImageUploadModal(false);
    pendingPlaceholderRef.current = null;
    setPlaceholderDimensions(null);
  };

  const handleImageCropperClose = () => {
    setShowImageCropperModal(false);
    setSelectedImageData(null);
  };

  const insertImageIntoPlaceholder = (imageSource) => {
    const placeholder = pendingPlaceholderRef.current;
    if (!canvas || !placeholder) return;

    const placeholderWidth = placeholder.width;
    const placeholderHeight = placeholder.height;
    const placeholderLeft = placeholder.left;
    const placeholderTop = placeholder.top;

    FabricImage.fromURL(imageSource, { crossOrigin: 'anonymous' }).then((img) => {
      // Image is already sized by the cropper, so just center it
      img.set({
        left: placeholderLeft + placeholderWidth / 2,
        top: placeholderTop + placeholderHeight / 2,
        originX: 'center',
        originY: 'center',
        name: 'headerImage',
        selectable: true,
        hasControls: true,
      });

      canvas.remove(placeholder);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      pendingPlaceholderRef.current = null;
    }).catch((error) => {
      console.error('Error loading image:', error);
      alert('Failed to load image. Please try again.');
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
            <h1 className="text-xl font-semibold text-gray-900">
              {template.name}
            </h1>
            <span className="text-sm text-gray-500 font-mono">
              {template.width} × {template.height}
            </span>
            <div className="border-l border-gray-300 h-6"></div>
            {/* Logo Dropdown */}
            <div className="relative group">
              <button className="text-gray-700 hover:text-gray-900 font-medium px-3 py-1 rounded hover:bg-gray-100 transition-colors">
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

            {/* Save as Template Button */}
            <button
              onClick={() => setShowSaveModal(true)}
              className="text-gray-700 hover:text-gray-900 font-medium px-4 py-2 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              Save as Template
            </button>

            {/* Load Template Dropdown */}
            {savedTemplates.length > 0 && (
              <div className="relative group">
                <button className="text-gray-700 hover:text-gray-900 font-medium px-4 py-2 rounded bg-green-50 hover:bg-green-100 border border-green-200 transition-colors">
                  Load Template ▾
                </button>
                <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {savedTemplates.map((tmpl) => (
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <CanvasEditor
            template={template}
            onCanvasReady={handleCanvasReady}
            onSelectionChange={handleSelectionChange}
          />
        </div>

        {/* Right Sidebar */}
        <Sidebar
          canvas={canvas}
          selectedObject={selectedObject}
          template={template}
        />
      </div>

      {/* Clear Button - Bottom Right */}
      <button
        onClick={handleClearCanvas}
        className="fixed bottom-8 right-80 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold transition-all hover:shadow-xl"
      >
        Clear
      </button>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Save as Template</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="flex-1 px-4 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Load Template</h2>
            <p className="text-gray-700 mb-6">
              Loading this template will replace the current canvas. This action cannot be undone.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <div className="font-medium text-gray-900">{selectedLoadTemplate.name}</div>
              <div className="text-sm text-gray-600">
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

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={showImageUploadModal}
        onClose={handleImageUploadClose}
        onImageSelect={handleImageSelected}
        placeholderDimensions={placeholderDimensions}
      />

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={showImageCropperModal}
        onClose={handleImageCropperClose}
        onConfirm={handleImageCropConfirm}
        imageSrc={selectedImageData?.src}
        placeholderDimensions={placeholderDimensions}
      />
    </div>
  );
}

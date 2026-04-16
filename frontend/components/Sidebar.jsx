'use client';

import { useState, useEffect, useRef } from 'react';
import { Textbox, FabricImage } from 'fabric';
import styles from './Sidebar.module.css';
import autoAnimate from '@formkit/auto-animate';
import { generateOutlookEML } from '../lib/outlook-eml';

export default function Sidebar({ canvas, selectedObject, template, onClearCanvas, onImageUpload }) {
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [fontSizeInputValue, setFontSizeInputValue] = useState('24');
  const [fontWeight, setFontWeight] = useState('400');
  const [showFontDialog, setShowFontDialog] = useState(false);
  const [tempSelectedFont, setTempSelectedFont] = useState('BauerMediaSans-Regular');
  const [showColorCombos, setShowColorCombos] = useState(false);
  const [hasBackgroundImage, setHasBackgroundImage] = useState(false);
  const [layers, setLayers] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const layersListRef = useRef(null);

  useEffect(() => {
    if (layersListRef.current) {
      autoAnimate(layersListRef.current);
    }
  }, [layersListRef]);

  useEffect(() => {
    if (!canvas) return;

    const updateBgImageState = () => {
      setHasBackgroundImage(!!canvas.backgroundImage);
    };

    const updateLayers = () => {
      // make sure every layer has a consistent id for animating smoothly
      const objs = canvas.getObjects();
      objs.forEach((obj, idx) => {
        if (!obj.id) obj.id = `layer-${Date.now()}-${idx}-${Math.random()}`;
      });
      setLayers([...objs].reverse());
    };

    updateBgImageState();
    updateLayers();
    
    canvas.on('after:render', updateBgImageState);
    canvas.on('after:render', updateLayers);
    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('object:modified', updateLayers);
    canvas.on('selection:updated', updateLayers);
    canvas.on('selection:created', updateLayers);
    canvas.on('selection:cleared', updateLayers);

    return () => {
      canvas.off('after:render', updateBgImageState);
      canvas.off('after:render', updateLayers);
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
      canvas.off('object:modified', updateLayers);
      canvas.off('selection:updated', updateLayers);
      canvas.off('selection:created', updateLayers);
      canvas.off('selection:cleared', updateLayers);
    };
  }, [canvas]);

  const handleDragStart = (e, index) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create an empty drag image so the default ghost image is hidden
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === dropIndex) return;

    const draggedLayer = layers[draggingIndex];
    if (!draggedLayer || !canvas) return;

    // Convert visual array map to logical canvas
    // visual index 0 is top (last element in fabric)
    const objsCount = canvas.getObjects().length;
    const currentFabricIndex = objsCount - 1 - draggingIndex;
    const targetFabricIndex = objsCount - 1 - dropIndex;

    // Fabric method to move object to an absolute layer index
    canvas.moveObjectTo(draggedLayer, targetFabricIndex);
    canvas.renderAll();
    setDraggingIndex(null);
  };

  const colorCombos = [
    { label: 'Lavender and Mint',            colors: [{ name: 'Lavender',       hex: '#a096ff' }, { name: 'Mint',         hex: '#1fd1bd' }] },
    { label: 'Taffy and Aqua',               colors: [{ name: 'Taffy',          hex: '#ff78c8' }, { name: 'Aqua',         hex: '#5af0ff' }] },
    { label: 'Lavender and Lemon',           colors: [{ name: 'Lavender',       hex: '#a096ff' }, { name: 'Lemon',        hex: '#fff050' }] },
    { label: 'Lemon and Aqua',               colors: [{ name: 'Lemon',          hex: '#fff050' }, { name: 'Aqua',         hex: '#5af0ff' }] },
    { label: 'Mint and Light Taffy',         colors: [{ name: 'Mint',           hex: '#1fd1bd' }, { name: 'Light Taffy',  hex: '#ffd2eb' }] },
    { label: 'Taffy and Dark Mint',          colors: [{ name: 'Taffy',          hex: '#ff78c8' }, { name: 'Dark Mint',    hex: '#009392' }] },
    { label: 'Light Lavender and Dark Aqua', colors: [{ name: 'Light Lavender', hex: '#e1dcff' }, { name: 'Dark Aqua',    hex: '#349cdc' }] },
    { label: 'Light Lavender and Dark Taffy',colors: [{ name: 'Light Lavender', hex: '#e1dcff' }, { name: 'Dark Taffy',   hex: '#d54380' }] },
    { label: 'Dark Lemon and Dark Aqua',     colors: [{ name: 'Dark Lemon',     hex: '#f0a800' }, { name: 'Dark Aqua',    hex: '#349cdc' }] },
    { label: 'Dark Lemon and Dark Taffy',    colors: [{ name: 'Dark Lemon',     hex: '#f0a800' }, { name: 'Dark Taffy',   hex: '#d54380' }] },
    { label: 'Light Lavender and Light Mint',colors: [{ name: 'Light Lavender', hex: '#e1dcff' }, { name: 'Light Mint',   hex: '#befaeb' }] },
    { label: 'Light Lemon and Light Taffy',  colors: [{ name: 'Light Lemon',    hex: '#ffffc8' }, { name: 'Light Taffy',  hex: '#ffd2eb' }] },
  ];

  const fontsOptions = [
    { key: 'BauerMediaSans-Light', label: 'BauerMediaSans Light', family: 'BauerMediaSans', weight: '300' },
    { key: 'BauerMediaSans-Regular', label: 'BauerMediaSans Regular', family: 'BauerMediaSans', weight: '400' },
    { key: 'BauerMediaSans-Bold', label: 'BauerMediaSans Bold', family: 'BauerMediaSans', weight: '700' },
  ];

  const handleConfirmFont = () => {
    const opt = fontsOptions.find((o) => o.key === tempSelectedFont);
    if (!opt) return;

    setFontWeight(opt.weight);

    if (canvas) {
      // Always add a new textbox when "Add Text" is clicked
      const text = new Textbox('Click to edit', {
        left: 100,
        top: 100,
        width: 200,
        fontSize: fontSize,
        fill: textColor,
        fontFamily: opt.family,
        fontWeight: opt.weight,
        editable: true
      });

      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
    }

    setShowFontDialog(false);
  };

  // Update selected text properties
  const handleTextColorChange = (color) => {
    setTextColor(color);
    if (selectedObject && selectedObject.type === 'textbox') {
      selectedObject.set('fill', color);
      canvas.renderAll();
    }
  };

  const applyFontSize = (value) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.min(120, Math.max(12, parsed));
    setFontSize(clamped);
    setFontSizeInputValue(String(clamped));
    if (selectedObject && selectedObject.type === 'textbox') {
      selectedObject.set('fontSize', clamped);
      canvas.renderAll();
    }
  };

  const handleFontSizeSliderChange = (size) => {
    applyFontSize(size);
  };

  const handleFontSizeInputChange = (e) => {
    setFontSizeInputValue(e.target.value);
  };

  const handleFontSizeKeyDown = (e) => {
    if (e.key === 'Enter') {
      applyFontSize(fontSizeInputValue);
    }
  };

  const handleFontWeightChange = (weight) => {
    setFontWeight(weight);
    if (selectedObject && selectedObject.type === 'textbox') {
      selectedObject.set('fontWeight', weight);
      canvas.renderAll();
    }
  };

  // Background color change
  const handleBackgroundColorChange = (color) => {
    setBackgroundColor(color);
    if (canvas) {
      canvas.backgroundColor = color;
      canvas.renderAll();
    }
  };

  // Background image upload
  const handleBackgroundImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;

    // Check file size (200MB = 200 * 1024 * 1024 bytes)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 200MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      FabricImage.fromURL(event.target.result).then((img) => {
        // Scale image to fit canvas
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        const scale = Math.max(scaleX, scaleY);

        img.set({
          scaleX: scale,
          scaleY: scale,
          originX: 'left',
          originY: 'top'
        });

        canvas.backgroundImage = img;
        setHasBackgroundImage(true);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  // Clear background image
  const handleClearBackgroundImage = () => {
    if (canvas) {
      canvas.backgroundImage = null;
      setHasBackgroundImage(false);
      canvas.renderAll();
    }
  };

  // Logo/image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;

    // Check file size (200MB limit)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 200MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageSource = event.target.result;
      FabricImage.fromURL(imageSource).then((img) => {
        // Scale down if image is too large
        const maxWidth = canvas.width * 0.5;
        const maxHeight = canvas.height * 0.5;
        
        if (img.width > maxWidth || img.height > maxHeight) {
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
          img.scale(scale);
        }

        img.set({
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: 'center',
          originY: 'center'
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();

        // Notify parent component about the uploaded image
        if (onImageUpload) {
          onImageUpload(imageSource);
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlUpload = (e) => {
    const url = imageUrlInput.trim();
    if (!url || !canvas) {
      alert('Please enter a valid image URL');
      return;
    }

    FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      // Scale down if image is too large
      const maxWidth = canvas.width * 0.5;
      const maxHeight = canvas.height * 0.5;
      
      if (img.width > maxWidth || img.height > maxHeight) {
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        img.scale(scale);
      }

      img.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center'
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();

      // Notify parent component about the uploaded image
      if (onImageUpload) {
        onImageUpload(url);
      }

      // Clear the input and close modal
      setImageUrlInput('');
      setShowImageUrlModal(false);
    }).catch((error) => {
      console.error('Error loading image from URL:', error);
      alert('Failed to load image from URL. Please check the URL and try again.');
    });
  };

  // Layer controls
  const handleBringForward = () => {
    if (selectedObject) {
      canvas.bringObjectForward(selectedObject);
      canvas.renderAll();
    }
  };

  const handleSendBackward = () => {
    if (selectedObject) {
      canvas.sendObjectBackwards(selectedObject);
      canvas.renderAll();
    }
  };

  // Mirror image
  const handleMirrorImage = () => {
    if (selectedObject && selectedObject.type === 'image') {
      selectedObject.set('flipX', !selectedObject.flipX);
      canvas.renderAll();
    }
  };

  // Download PNG
  const handleDownload = () => {
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1
    });

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `banner-${template.width}x${template.height}-${Date.now()}.png`;
    link.click();
  };

  // Open Outlook Draft
  const handleOutlookDraft = () => {
    let objectUrl = null;
    let timeoutId = null;
    try {
      if (!canvas) return;

      // Validate template exists before accessing properties
      if (!template) {
        console.error('Template is not defined');
        return;
      }

      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1
      });

      const blob = generateOutlookEML(dataURL);
      objectUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `OutlookDraft-${template.width}x${template.height}-${Date.now()}.eml`;
      link.click();
      
      // Defer revocation to allow browser to initiate download
      timeoutId = setTimeout(() => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }, 300);
    } catch (error) {
      console.error('Error generating Outlook draft:', error);
      // Clean up blob URL to prevent memory leak on error
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  };

  return (
    <>
      {/* Font Selection Dialog */}
      {showFontDialog && (
        <div className={styles.modalOverlay} onClick={() => setShowFontDialog(false)}>
          <div className={styles.dialogBox} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Which font?</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select a font:</label>
              <select
                value={tempSelectedFont}
                onChange={(e) => setTempSelectedFont(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {fontsOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFontDialog(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFont}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image URL Modal */}
      {showImageUrlModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImageUrlModal(false)}>
          <div className={styles.dialogBox} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Image from URL</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleImageUrlUpload()}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowImageUrlModal(false);
                  setImageUrlInput('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImageUrlUpload}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-lg overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Definições</h2>
        </div>

        {/* Fonts Section */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fonts</h3>
          
          <div className="mb-4">
            <button
              onClick={() => setShowFontDialog(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg mb-2 font-semibold transition-colors"
            >
              + Add Text
            </button>
          </div>

          <div className="space-y-4">
            {/* Font Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Weight
              </label>
              <select
                value={fontWeight}
                onChange={(e) => handleFontWeightChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="300">Light (300)</option>
                <option value="400">Regular (400)</option>
                <option value="700">Bold (700)</option>
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="12"
                  max="120"
                  value={fontSize}
                  onChange={(e) => handleFontSizeSliderChange(e.target.value)}
                  className="flex-1"
                />
                <input
                  type="number"
                  value={fontSizeInputValue}
                  onChange={handleFontSizeInputChange}
                  onKeyDown={handleFontSizeKeyDown}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm text-gray-900"
                />
              </div>
            </div>

            {/* Text Color */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Colors</h3>

              <div className="space-y-3 mb-3">
                {/* Black / White */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Black & White</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Black', hex: '#000000' },
                      { name: 'White', hex: '#FFFFFF' },
                    ].map(({ name, hex }) => (
                      <button
                        key={hex}
                        title={`${name} ${hex}`}
                        onClick={() => handleTextColorChange(hex)}
                        className="w-8 h-8 rounded-full border-2 border-black hover:scale-110 transition-transform"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Brand + Primary + Light + Dark (re-used palette) */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Brand</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[{ name: 'Brand Color', hex: '#4700a3' }].map(({ name, hex }) => (
                      <button
                        key={hex}
                        title={`${name} ${hex}`}
                        onClick={() => handleTextColorChange(hex)}
                        className="w-8 h-8 rounded-full border-2 border-black hover:scale-110 transition-transform"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>

                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Primary</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      { name: 'Mint',     hex: '#1fd1bd' },
                      { name: 'Lavender', hex: '#a096ff' },
                      { name: 'Peach',    hex: '#ff7d6a' },
                      { name: 'Lemon',    hex: '#fff050' },
                      { name: 'Aqua',     hex: '#5af0ff' },
                      { name: 'Taffy',    hex: '#ff78c8' },
                    ].map(({ name, hex }) => (
                      <button
                        key={hex}
                        title={`${name} ${hex}`}
                        onClick={() => handleTextColorChange(hex)}
                        className="w-8 h-8 rounded-full border-2 border-black hover:scale-110 transition-transform"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>

                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Light Shades</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[  
                      { name: 'Light Mint',     hex: '#befaeb' },
                      { name: 'Light Lavender', hex: '#e1dcff' },
                      { name: 'Light Peach',    hex: '#ffd2d2' },
                      { name: 'Light Lemon',    hex: '#ffffc8' },
                      { name: 'Light Aqua',     hex: '#c8faff' },
                      { name: 'Light Taffy',    hex: '#ffd2eb' },
                    ].map(({ name, hex }) => (
                      <button
                        key={hex}
                        title={`${name} ${hex}`}
                        onClick={() => handleTextColorChange(hex)}
                        className="w-8 h-8 rounded-full border-2 border-black hover:scale-110 transition-transform"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>

                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Dark Shades</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Dark Mint',     hex: '#009392' },
                      { name: 'Dark Lavender', hex: '#7d78e8' },
                      { name: 'Dark Peach',    hex: '#d05c5d' },
                      { name: 'Dark Lemon',    hex: '#f0a800' },
                      { name: 'Dark Aqua',     hex: '#349cdc' },
                      { name: 'Dark Taffy',    hex: '#d54380' },
                    ].map(({ name, hex }) => (
                      <button
                        key={hex}
                        title={`${name} ${hex}`}
                        onClick={() => handleTextColorChange(hex)}
                        className="w-8 h-8 rounded-full border-2 border-black hover:scale-110 transition-transform"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => handleTextColorChange(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => handleTextColorChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm text-gray-900"
                />
              </div>

              {/* Color Combos */}
              <div>
                <button
                  onClick={() => setShowColorCombos(!showColorCombos)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors"
                >
                  <span>Color Combos</span>
                  <span>{showColorCombos ? '▲' : '▼'}</span>
                </button>
                {showColorCombos && (
                  <div className="mt-2 space-y-1">
                    {colorCombos.map((combo, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50">
                        <span className="flex-1 text-xs text-gray-600">{combo.label}</span>
                        <div className="flex gap-1">
                          {combo.colors.map(({ name, hex }) => (
                            <button
                              key={hex}
                              title={`${name} ${hex}`}
                              onClick={() => handleTextColorChange(hex)}
                              className="w-6 h-6 rounded-full border-2 border-black hover:scale-110 transition-transform"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>  
          </div>
        </div>

      {/* Colors Section (Background) */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4"> Background Colors</h3>

        {/* Default Colors */}
        <div className="mb-5 space-y-3">
          {/* Brand */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Brand</p>
            <div className="flex flex-wrap gap-2">
              {[{ name: 'Brand Color', hex: '#4700a3' }].map(({ name, hex }) => (
                <button
                  key={hex}
                  title={`${name} ${hex}`}
                  onClick={() => handleBackgroundColorChange(hex)}
                  className="w-8 h-8 rounded-full border-2 border-black hover:scale-110 transition-transform"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Primary */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Primary</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Mint',     hex: '#1fd1bd' },
                { name: 'Lavender', hex: '#a096ff' },
                { name: 'Peach',    hex: '#ff7d6a' },
                { name: 'Lemon',    hex: '#fff050' },
                { name: 'Aqua',     hex: '#5af0ff' },
                { name: 'Taffy',    hex: '#ff78c8' },
              ].map(({ name, hex }) => (
                <button
                  key={hex}
                  title={`${name} ${hex}`}
                  onClick={() => handleBackgroundColorChange(hex)}
                  className="w-8 h-8 rounded-full border-2 border-black hover:scale-110 transition-transform"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Light Shades */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Light Shades</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Light Mint',     hex: '#befaeb' },
                { name: 'Light Lavender', hex: '#e1dcff' },
                { name: 'Light Peach',    hex: '#ffd2d2' },
                { name: 'Light Lemon',    hex: '#ffffc8' },
                { name: 'Light Aqua',     hex: '#c8faff' },
                { name: 'Light Taffy',    hex: '#ffd2eb' },
              ].map(({ name, hex }) => (
                <button
                  key={hex}
                  title={`${name} ${hex}`}
                  onClick={() => handleBackgroundColorChange(hex)}
                  className="w-8 h-8 rounded-full border-2 border-black hover:scale-110 transition-transform"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Dark Shades */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Dark Shades</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Dark Mint',     hex: '#009392' },
                { name: 'Dark Lavender', hex: '#7d78e8' },
                { name: 'Dark Peach',    hex: '#d05c5d' },
                { name: 'Dark Lemon',    hex: '#f0a800' },
                { name: 'Dark Aqua',     hex: '#349cdc' },
                { name: 'Dark Taffy',    hex: '#d54380' },
              ].map(({ name, hex }) => (
                <button
                  key={hex}
                  title={`${name} ${hex}`}
                  onClick={() => handleBackgroundColorChange(hex)}
                  className="w-8 h-8 rounded-full border-2 border-black hover:scale-110 transition-transform"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm text-gray-900"
              />
            </div>
          </div>

          {/* Background Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Image
            </label>
            <div className="flex gap-2 items-center">
              <div className={styles.fileInputWrapper}>
                <input
                  type="file"
                  id="bg-image-upload"
                  accept="image/*"
                  onChange={handleBackgroundImageUpload}
                  className={styles.hiddenFileInput}
                />
                <label htmlFor="bg-image-upload" className={`${styles.fileInputLabel} text-sm py-1 px-2 whitespace-nowrap`}>
                  Escolher Ficheiro
                </label>
              </div>
              {hasBackgroundImage && (
                <button
                  onClick={handleClearBackgroundImage}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Max 200MB</p>
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Images</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Logo/Image
          </label>
          <div className="flex gap-2 items-center">
            <div className={styles.fileInputWrapper}>
              <input
                type="file"
                id="logo-image-upload"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.hiddenFileInput}
              />
              <label htmlFor="logo-image-upload" className={`${styles.fileInputLabel} ${styles.fileInputLabelGreen} text-sm py-1 px-2 whitespace-nowrap`}>
                Escolher Ficheiro
              </label>
            </div>
            <button
              onClick={() => setShowImageUrlModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
            >
              URL
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Max 200MB</p>
        </div>

        {selectedObject && selectedObject.type === 'image' && (
          <div className="mt-4">
            <button
              onClick={handleMirrorImage}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              ↔ Mirror Image
            </button>
          </div>
        )}
      </div>

        {/* Layer Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Layers</h3>
          </div>
          
          <div ref={layersListRef} className={`space-y-2 mb-4 max-h-48 overflow-y-auto pr-1 ${styles.layersListContainer} ${draggingIndex !== null ? styles.layersListNoDragScroll : ''}`}>
            {layers.map((layer, index) => {
              const type = layer.type;
              let displayName = type;
              if (type === 'textbox' || type === 'text') {
                displayName = layer.text ? `Texto: ${layer.text.substring(0, 15)}...` : 'Texto';
              } else if (type === 'image') {
                displayName = layer.name || 'Imagem';
              } else if (layer.isPlaceholder) {
                displayName = 'Espaço em Branco (Imagem)';
              } else if (type === 'rect') {
                displayName = 'Forma (Retângulo)';
              } else if (type === 'circle') {
                displayName = 'Forma (Círculo)';
              }
              
              const isSelected = selectedObject === layer;

              return (
                <div 
                  key={layer.id || layer.name || index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e)}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => {
                    canvas.setActiveObject(layer);
                    canvas.renderAll();
                  }}
                  className={`relative flex items-center justify-between p-2 rounded cursor-grab border transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'} ${draggingIndex === index ? 'opacity-50 ring-2 ring-blue-400' : 'opacity-100'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="text-gray-400 mr-1 cursor-grab active:cursor-grabbing hover:text-gray-600">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 4h2v2H4V4zm4 0h2v2H8V4zm4 0h2v2h-2V4zM4 8h2v2H4V8zm4 0h2v2H8V8zm4 0h2v2h-2V8zM4 12h2v2H4v-2zm4 0h2v2H8v-2zm4 0h2v2h-2v-2z" />
                      </svg>
                    </div>
                    <div className={`w-3 h-3 rounded-full shrink-0 ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <span className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                      {displayName}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {layers.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded border border-dashed border-gray-200">
                Nenhuma camada adicionada.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleBringForward}
              disabled={!selectedObject}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${selectedObject ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
            >
              ↑ Forward
            </button>
            <button
              onClick={handleSendBackward}
              disabled={!selectedObject}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${selectedObject ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
            >
              ↓ Backward
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 mt-auto space-y-3">
          <button
            onClick={() => onClearCanvas && onClearCanvas()}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors shadow-md"
          >
            Clear Canvas
          </button>
          <button
            onClick={handleOutlookDraft}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors shadow-md"
          >
            Open Outlook Draft
          </button>
          <button
            onClick={handleDownload}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors shadow-md"
          >
            Download PNG
          </button>
        </div>
      </div>
    </>
  );
}

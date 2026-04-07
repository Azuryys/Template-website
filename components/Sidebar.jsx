'use client';

import { useState } from 'react';
import { Textbox, FabricImage } from 'fabric';

export default function Sidebar({ canvas, selectedObject, template }) {
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState('400');

  // Add text to canvas
  const handleAddText = () => {
    if (!canvas) return;

    const text = new Textbox('Click to edit', {
      left: 100,
      top: 100,
      width: 200,
      fontSize: fontSize,
      fill: textColor,
      fontFamily: 'BauerMediaSans',
      fontWeight: fontWeight,
      editable: true
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  // Update selected text properties
  const handleTextColorChange = (color) => {
    setTextColor(color);
    if (selectedObject && selectedObject.type === 'textbox') {
      selectedObject.set('fill', color);
      canvas.renderAll();
    }
  };

  const handleFontSizeChange = (size) => {
    setFontSize(parseInt(size));
    if (selectedObject && selectedObject.type === 'textbox') {
      selectedObject.set('fontSize', parseInt(size));
      canvas.renderAll();
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
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
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
      FabricImage.fromURL(event.target.result).then((img) => {
        // Scale down if image is too large
        const maxWidth = canvas.width * 0.5;
        const maxHeight = canvas.height * 0.5;
        
        if (img.width > maxWidth || img.height > maxHeight) {
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
          img.scale(scale);
        }

        img.set({
          left: 50,
          top: 50
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  // Layer controls
  const handleBringForward = () => {
    if (selectedObject) {
      canvas.bringForward(selectedObject);
      canvas.renderAll();
    }
  };

  const handleSendBackward = () => {
    if (selectedObject) {
      canvas.sendBackwards(selectedObject);
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

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-lg overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Definições</h2>
      </div>

      {/* Fonts Section */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fonts</h3>
        
        <button
          onClick={handleAddText}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg mb-4 font-semibold transition-colors"
        >
          + Add Text
        </button>

        <div className="space-y-4">
          {/* Font Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Weight
            </label>
            <select
              value={fontWeight}
              onChange={(e) => handleFontWeightChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="300">Light (300)</option>
              <option value="400">Regular (400)</option>
              <option value="700">Bold (700)</option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size: {fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="120"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Text Color */}
          <div>
            {/* (Text color swatches moved below into their own section) */}
                        <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Color
            </label>
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Colors Section (Background) */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Colors</h3>

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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>

          {/* Background Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundImageUpload}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
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
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <p className="text-xs text-gray-500 mt-1">Max 200MB</p>
        </div>
      </div>

      {/* Text Colors (moved here) */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Text colors</h3>

        <div className="space-y-3">
          {/* Black / White */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Text colors</p>
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
      </div>

      {/* Layer Controls */}
      {selectedObject && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Layers</h3>
          
          <div className="flex gap-2">
            <button
              onClick={handleBringForward}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              ↑ Forward
            </button>
            <button
              onClick={handleSendBackward}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              ↓ Backward
            </button>
          </div>
        </div>
      )}

      {/* Download Button */}
      <div className="p-6 mt-auto">
        <button
          onClick={handleDownload}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors shadow-md"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}

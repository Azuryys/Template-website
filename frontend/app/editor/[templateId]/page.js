'use client';

import { getTemplate } from '@/lib/templates';
import CanvasEditor from '@/components/CanvasEditor';
import Sidebar from '@/components/Sidebar';
import { useState, use, useCallback } from 'react';
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
  const template = getTemplate(templateId);
  const [canvas, setCanvas] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);

  const handleCanvasReady = useCallback((canvasInstance) => {
    setCanvas(canvasInstance);
  }, []);

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
    </div>
  );
}

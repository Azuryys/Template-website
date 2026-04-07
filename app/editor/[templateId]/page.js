'use client';

import { getTemplate } from '@/lib/templates';
import CanvasEditor from '@/components/CanvasEditor';
import Sidebar from '@/components/Sidebar';
import { useState, use, useCallback } from 'react';

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

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/"
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

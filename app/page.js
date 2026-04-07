'use client';

import Link from 'next/link';
import { getAllTemplates } from '@/lib/templates';

export default function Home() {
  const templates = getAllTemplates();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Banner Template Creator
          </h1>
          <p className="text-xl text-gray-600">
            Choose a template size to start creating your custom banner
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/editor/${template.id}`}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-200 hover:border-blue-500">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {template.name}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">
                    {template.description}
                  </p>
                </div>

                {/* Preview box showing aspect ratio */}
                <div className="bg-gray-100 rounded-lg p-4 mb-4 flex items-center justify-center min-h-32">
                  <div
                    className="bg-gradient-to-br from-blue-400 to-purple-500 rounded shadow-md"
                    style={{
                      width: `${Math.min(200, template.width / 10)}px`,
                      height: `${Math.min(120, template.height / 10)}px`,
                      maxWidth: '100%'
                    }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-lg font-mono text-gray-700">
                    {template.width} × {template.height}
                  </span>
                  <span className="text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                    Create →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllTemplates } from '@/lib/templates';
import Header from '@/components/Header';

const PRESETS = [
  { label: '1920 × 1080 (Full HD)', width: 1920, height: 1080 },
  { label: '1280 × 720 (HD)', width: 1280, height: 720 },
  { label: '1080 × 1080 (Square)', width: 1080, height: 1080 },
  { label: '800 × 600', width: 800, height: 600 },
  { label: '1200 × 628 (Social)', width: 1200, height: 628 },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Recuperar usuário do localStorage
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/Login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setIsAdmin(parsedUser.isAdmin === true);
    setTemplates(getAllTemplates());
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userPassword');
    router.push('/Login');
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    if (!w || !h || w < 1 || h < 1) return;
    router.push(`/editor/custom?width=${w}&height=${h}`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <Header isAdmin={isAdmin} handleLogout={handleLogout} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Selecione um Template
          </h2>
          <p className="text-gray-600">
            Escolha um tamanho de template para começar a criar seu banner
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
                    Criar →
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Custom resolution card */}
          <button
            onClick={() => setShowCustomModal(true)}
            className="group text-left"
          >
            <div className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-dashed border-gray-300 hover:border-blue-500 h-full flex flex-col">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Custom
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  Set a custom width and height for your canvas
                </p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 mb-4 flex items-center justify-center min-h-32 flex-1">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="text-sm">Choose resolution</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-mono text-gray-400">W × H</span>
                <span className="text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                  Criar →
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Custom resolution modal */}
        {showCustomModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCustomModal(false); }}
          >
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Custom Resolution</h3>
              <p className="text-gray-500 text-sm mb-6">Enter the dimensions for your canvas in pixels.</p>

              {/* Presets */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Quick presets</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => { setCustomWidth(String(p.width)); setCustomHeight(String(p.height)); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-900 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Width (px)</label>
                    <input
                      type="number"
                      min="1"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      placeholder="e.g. 1920"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Height (px)</label>
                    <input
                      type="number"
                      min="1"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      placeholder="e.g. 1080"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition"
                  >
                    Criar →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

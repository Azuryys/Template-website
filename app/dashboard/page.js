'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllTemplates } from '@/lib/templates';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bem-vindo, {user.name}!
            </h1>
            <p className="text-gray-600 text-sm mt-1">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/register"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                + Criar Usuário
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

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
        </div>
      </main>
    </div>
  );
}

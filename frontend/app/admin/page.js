'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar se o utilizador está autenticado e é admin
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/Login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    
    // Verificar se é admin
    if (!parsedUser.isAdmin) {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userPassword');
    router.push('/Login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isAdmin={user.isAdmin} handleLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Painel de Administração</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Bem-vindo, {user.name}!</p>
          <p className="text-gray-500 mt-2">Painel de administração em desenvolvimento...</p>
        </div>
      </main>
    </div>
  );
}

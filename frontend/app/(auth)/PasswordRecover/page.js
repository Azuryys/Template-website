'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordRecoverPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('http://localhost:5000/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // Ir para página de verificação do código
        router.push(`/PasswordVerify?email=${encodeURIComponent(email)}`);
      } else {
        setStatus('error');
        setMessage(data.error || 'Erro ao enviar código');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Falha na conexão com servidor');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Recuperar Senha</h1>
          <p className="text-gray-600">Digite seu email para receber o código</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/Login" className="text-sm text-blue-600 hover:text-blue-700">
              Voltar para Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
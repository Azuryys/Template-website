'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PasswordResetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PasswordResetContent />
    </Suspense>
  );
}

function PasswordResetContent() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const codeId = searchParams.get('codeId');

  useEffect(() => {
    if (!email || !codeId) router.push('/PasswordRecover');
  }, [email, codeId, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      setStatus('error');
      setMessage('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('http://localhost:3001/api/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codeId, newPassword }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.ok) {
        setStatus('success');
        setMessage('Senha alterada com sucesso!');
        setTimeout(() => router.push('/Login'), 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Erro ao alterar senha');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Erro de conexão');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Nova Senha</h1>
          <p className="text-gray-600">Digite sua nova senha para <strong>{email}</strong></p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          {status === 'success' ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg">
                <p className="font-medium">{message}</p>
                <p className="text-sm mt-1">Redirecionando para login...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
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
                {status === 'loading' ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
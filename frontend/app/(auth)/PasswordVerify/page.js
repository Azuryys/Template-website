'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PasswordVerifyPage() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) router.push('/PasswordRecover');
  }, [email, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/PasswordReset?email=${encodeURIComponent(email)}&codeId=${data.codeId}`);
      } else {
        setStatus('error');
        setMessage(data.error || 'Código inválido');
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Verificar Código</h1>
          <p className="text-gray-600">Digite o código de 6 dígitos enviado para<br/><strong>{email}</strong></p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest text-black focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || code.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {status === 'loading' ? 'Verificando...' : 'Verificar Código'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link href="/PasswordRecover" className="text-sm text-blue-600 hover:text-blue-700 block">
              Reenviar código
            </Link>
            <Link href="/Login" className="text-sm text-gray-500 hover:text-gray-700 block">
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
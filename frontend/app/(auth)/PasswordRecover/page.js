/**
 * PasswordRecoverPage - Página de recuperação de senha (Etapa 1)
 * 
 * Fluxo: Usuário digita email → Backend gera código → Envia para verificação
 * 
 * @route /PasswordRecover
 * @next /PasswordVerify?email={email}
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordRecoverPage() {
  // Estado do email digitado pelo usuário
  const [email, setEmail] = useState('');
  
  // Estado do processo: 'idle' | 'loading' | 'error'
  const [status, setStatus] = useState('idle');
  
  // Mensagem de erro exibida ao usuário
  const [message, setMessage] = useState('');
  
  const router = useRouter();

  /**
   * handleSubmit - Envia email para o backend gerar código de recuperação
   * 
   * POST /api/auth/recover
   * Body: { email: string }
   * 
   * Sucesso: Redireciona para PasswordVerify
   * Erro: Exibe mensagem na tela
   */
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
        // Redireciona para página de verificação com email na URL
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
        {/* Cabeçalho da página */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Recuperar Senha</h1>
          <p className="text-gray-600">Digite seu email para receber o código</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo de email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Mensagem de erro */}
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            {/* Botão de envio */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>

          {/* Link para voltar ao login */}
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
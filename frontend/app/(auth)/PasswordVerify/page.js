/**
 * PasswordVerifyPage - Página de verificação do código (Etapa 2)
 * 
 * Fluxo: Usuário digita código de 6 dígitos → Backend valida → Vai para reset
 * 
 * @route /PasswordVerify?email={email}
 * @param email - Email do usuário (vindo da URL)
 * @next /PasswordReset?email={email}&codeId={id}
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PasswordVerifyPage() {
  // Código de 6 dígitos digitado pelo usuário
  const [code, setCode] = useState('');
  
  // Estado do processo: 'idle' | 'loading' | 'error'
  const [status, setStatus] = useState('idle');
  
  // Mensagem de erro exibida
  const [message, setMessage] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Pega email da URL (query param)
  const email = searchParams.get('email');

  /**
   * useEffect - Proteção de rota
   * Se não tiver email na URL, redireciona para PasswordRecover
   */
  useEffect(() => {
    if (!email) router.push('/PasswordRecover');
  }, [email, router]);

  /**
   * handleSubmit - Verifica se o código é válido
   * 
   * POST /api/auth/verify-code
   * Body: { email: string, code: string }
   * 
   * Sucesso: Retorna codeId e redireciona para PasswordReset
   * Erro: Código inválido ou expirado
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('http://localhost:3001/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redireciona para reset com email e codeId
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

  /**
   * handleCodeChange - Formata o input do código
   * Remove caracteres não numéricos e limita a 6 dígitos
   */
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Cabeçalho mostrando o email */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Verificar Código</h1>
          <p className="text-gray-600">
            Digite o código de 6 dígitos enviado para<br/>
            <strong>{email}</strong>
          </p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo do código - centralizado e grande */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código
              </label>
              <input
                type="text"
                inputMode="numeric" // Mostra teclado numérico no mobile
                value={code}
                onChange={handleCodeChange}
                placeholder="123456"
                maxLength={6}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest text-black focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Mensagem de erro */}
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                {message}
              </div>
            )}

            {/* Botão - desabilitado se código não tiver 6 dígitos */}
            <button
              type="submit"
              disabled={status === 'loading' || code.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {status === 'loading' ? 'Verificando...' : 'Verificar Código'}
            </button>
          </form>

          {/* Links auxiliares */}
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
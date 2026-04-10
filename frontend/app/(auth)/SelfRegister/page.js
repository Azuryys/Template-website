'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * PÁGINA DE AUTO-REGISTO
 * ======================
 * Qualquer pessoa pode se registar aqui
 * O email será guardado na base de dados PostgreSQL
 * 
 * API: POST /api/auth/register
 */
export default function SelfRegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /**
   * handleSubmit - Envia dados de registo para o backend
   * 
   * POST /api/auth/register
   * Body: { email, password, name }
   * 
   * Sucesso: Redireciona para login
   * Erro: Exibe mensagem de erro
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validação: email é obrigatório
    if (!email || !email.includes('@')) {
      setError('Email válido é obrigatório');
      setLoading(false);
      return;
    }

    // Validação: senha deve estar preenchida
    if (!password || password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    // Validação: confirmação de senha deve ser igual à senha
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      // Faz chamada à API do backend para registar
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: email.split('@')[0] // Usa a parte do email como nome
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Falha ao registar');
        setLoading(false);
        return;
      }

      // ✅ Registo bem-sucedido
      setSuccess('Registo bem-sucedido! Redirecionando para login...');
      console.log('✅ Utilizador registado com sucesso:', email);
      
      // Limpa o formulário
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Redireciona para login depois de 2 segundos
      setTimeout(() => {
        router.push('/Login');
      }, 2000);

    } catch (err) {
      // ❌ Erro de conexão com o backend
      setError('Falha na conexão com servidor. Verifique se o backend está rodando.');
      setLoading(false);
      console.error('Erro no registo:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Criar Conta
          </h1>
          <p className="text-gray-600">Registra-te para começar</p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="
                  w-full px-4 py-3 border border-gray-300 rounded-lg 
                  text-black placeholder-gray-400
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  outline-none transition bg-white"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="
                  w-full px-4 py-3 border border-gray-300 rounded-lg 
                  text-black placeholder-gray-400
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  outline-none transition bg-white"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                required
                className="
                  w-full px-4 py-3 border border-gray-300 rounded-lg 
                  text-black placeholder-gray-400
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  outline-none transition bg-white"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Registando...' : 'Criar Conta'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Já tem conta?{' '}
              <Link href="/Login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

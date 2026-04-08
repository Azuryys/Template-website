'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateUser } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = authenticateUser(email, password);
      
      if (user) {
        // Armazenar user no localStorage
        localStorage.setItem('user', JSON.stringify(user));
        // Store password temporarily for admin verification (this is for demo)
        localStorage.setItem('userPassword', password);
        // Redirecionar para dashboard/home
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      } else {
        setError('Email ou senha inválidos');
        setLoading(false);
      }
    } catch (err) {
      setError('Falha ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bem-vindo
          </h1>
        </div>

        {/* Form Card */}
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
                placeholder="Email"
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
                placeholder="Password"
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

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span className="ml-2 text-gray-600">Lembrar-me</span>
              </label>
              
              {/* ============================================ */}
              {/* LINK PARA RECUPERAÇÃO DE SENHA */}
              {/* ============================================ */}
              <Link 
                href="/PasswordRecover" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Divider */}
          {/* <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou</span>
            </div>
          </div> */}

          {/* Register Link */}
          <div className="mt-6 text-center">
             {/* <p className="text-gray-600 text-sm">
              Não tem uma conta?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Criar conta
              </Link>
            </p>*/}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2026 Banner Creator. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
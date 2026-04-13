'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [currentRole, setCurrentRole] = useState('user');
  const router = useRouter();

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: session } = await authClient.getSession();
        const role = session?.user?.role || session?.user?.usertype || 'user';
        setCurrentRole(role);
      } catch {
        setCurrentRole('user');
      } finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, []);

  const canCreateAdmin = currentRole === 'admin' || currentRole === 'superadmin';
  const canCreateSuperAdmin = currentRole === 'superadmin';

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const selectedRole = canCreateSuperAdmin
        ? formData.role
        : canCreateAdmin
          ? (formData.role === 'admin' ? 'admin' : 'user')
          : 'user';

      let authError = null;

      if (selectedRole === 'user' && !canCreateAdmin) {
        const { error: signUpError } = await authClient.signUp.email({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          callbackURL: '/Login'
        });
        authError = signUpError;
      } else {
        const response = await fetch('http://localhost:3001/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: selectedRole,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          authError = { message: data?.error || 'Erro ao criar usuário' };
        }
      }

      if (authError) {
        setError(authError.message || 'Erro ao criar usuário');
      } else {
        setSuccess(`Usuário ${formData.name} criado com sucesso!`);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'user',
        });
        setTimeout(() => setSuccess(''), 3000);
        setTimeout(() => router.push('/Login'), 1800);
      }
    } catch {
      setError('Falha ao criar usuário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Criar Novo Usuário</h1>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
            </div>

            {(canCreateAdmin || canCreateSuperAdmin) && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">Perfil da Conta</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  {canCreateSuperAdmin && <option value="superadmin">Super Admin</option>}
                </select>
                {!canCreateSuperAdmin && (
                  <p className="text-xs text-gray-500 mt-1">Apenas superadmin pode criar super admin.</p>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              {loading ? 'Criando...' : 'Criar Usuário'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
              Voltar ao Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2026 Banner Creator. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
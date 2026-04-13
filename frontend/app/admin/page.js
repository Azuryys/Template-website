'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { authClient } from '@/lib/auth-client';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState(null);
  const router = useRouter();
  const currentRole = user?.role || user?.usertype || 'user';
  const currentUserIsSuperAdmin = currentRole === 'superadmin';

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setError('');
      const response = await fetch('http://localhost:3001/api/admin/users', {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Falha ao carregar utilizadores');
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar utilizadores');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const loadSessionAndUsers = async () => {
      try {
        const { data: session } = await authClient.getSession();
        if (!session?.user) {
          router.push('/Login');
          return;
        }

        const role = session.user.role || session.user.usertype;
        const isAdmin = role === 'admin' || role === 'superadmin';
        if (!isAdmin) {
          router.push('/dashboard');
          return;
        }

        setUser(session.user);
        await fetchUsers();
      } catch (err) {
        router.push('/Login');
      } finally {
        setLoadingSession(false);
      }
    };

    loadSessionAndUsers();
  }, [router]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/Login');
  };

  const handleDeleteUser = async (userToDelete) => {
    if (!window.confirm(`Tem a certeza que quer apagar a conta ${userToDelete.email}?`)) {
      return;
    }

    try {
      setDeletingUserId(userToDelete.id);
      setError('');

      const response = await fetch(`http://localhost:3001/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível apagar o utilizador');
      }

      setUsers((prev) => prev.filter((currentUser) => currentUser.id !== userToDelete.id));
    } catch (err) {
      setError(err.message || 'Erro ao apagar utilizador');
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loadingSession || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        isAdmin={true}
        handleLogout={handleLogout}
        userName={user?.name || user?.email || 'Admin'}
        userAvatar={user?.image || null}
        userRole={user?.role || user?.usertype || 'admin'}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Painel de Administração</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">Bem-vindo, {user?.name || user?.email}!</p>
            <button
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:bg-blue-400"
            >
              {loadingUsers ? 'Atualizando...' : 'Atualizar lista'}
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loadingUsers ? (
            <p className="text-gray-500">A carregar utilizadores...</p>
          ) : users.length === 0 ? (
            <p className="text-gray-500">Não há utilizadores para mostrar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="py-3 pr-4">Nome</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Perfil</th>
                    <th className="py-3 pr-4">Admin</th>
                    <th className="py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((listedUser) => {
                    const isCurrentUser = listedUser.id === user.id;
                    const isProtectedByRole = listedUser.isAdmin && !currentUserIsSuperAdmin;
                    const deleteBlocked = isCurrentUser || isProtectedByRole || deletingUserId === listedUser.id;
                    const roleLabel = listedUser.isSuperAdmin ? 'superadmin' : (listedUser.isAdmin ? 'admin' : 'user');
                    return (
                      <tr key={listedUser.id} className="border-b border-gray-100">
                        <td className="py-3 pr-4 text-gray-900">{listedUser.name || 'Sem nome'}</td>
                        <td className="py-3 pr-4 text-gray-700">{listedUser.email}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${listedUser.isSuperAdmin ? 'bg-purple-100 text-purple-700' : listedUser.isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {roleLabel}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${listedUser.isAdmin ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {listedUser.isAdmin ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleDeleteUser(listedUser)}
                            disabled={deleteBlocked}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-red-300"
                            title={
                              isCurrentUser
                                ? 'Não pode apagar a sua própria conta'
                                : (listedUser.isAdmin && !currentUserIsSuperAdmin)
                                    ? 'Apenas superadmin pode apagar contas admin'
                                    : 'Apagar conta'
                            }
                          >
                            {deletingUserId === listedUser.id ? 'A apagar...' : 'Apagar conta'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

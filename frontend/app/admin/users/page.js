"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Header from "@/components/Header";
import { FaArrowLeft, FaTimes } from "react-icons/fa";
import Link from "next/link";

export default function UsersPage() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [reportTargetUser, setReportTargetUser] = useState(null);
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");
  const router = useRouter();
  const currentRole = user?.role || user?.usertype || "user";
  const currentUserIsSuperAdmin = currentRole === "superadmin";

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setError("");

      const response = await fetch("http://localhost:3001/api/admin/users", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Falha ao carregar utilizadores");
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "Erro ao carregar utilizadores");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (!window.confirm(`Tem a certeza que quer apagar a conta ${userToDelete.email}?`)) {
      return;
    }

    try {
      setDeletingUserId(userToDelete.id);
      setError("");

      const response = await fetch(`http://localhost:3001/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível apagar o utilizador");
      }

      setUsers((prev) => prev.filter((currentUser) => currentUser.id !== userToDelete.id));
    } catch (err) {
      setError(err.message || "Erro ao apagar utilizador");
    } finally {
      setDeletingUserId(null);
    }
  };

  const openReportModal = (targetUser) => {
    setReportTargetUser(targetUser);
    setReportDescription("");
    setReportError("");
    setReportSuccess("");
  };

  const closeReportModal = () => {
    setReportTargetUser(null);
    setReportDescription("");
    setReportError("");
    setReportSuccess("");
  };

  const handleReportUser = async (event) => {
    event.preventDefault();

    if (!reportTargetUser) {
      return;
    }

    try {
      setReportSubmitting(true);
      setReportError("");
      setReportSuccess("");

      const response = await fetch("http://localhost:3001/api/admin/reports", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: reportTargetUser.id,
          description: reportDescription,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível reportar o utilizador");
      }

      setReportSuccess("Report submetido com sucesso.");
      setTimeout(() => {
        closeReportModal();
      }, 900);
    } catch (err) {
      setReportError(err.message || "Erro ao reportar utilizador");
    } finally {
      setReportSubmitting(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: session } = await authClient.getSession();
      if (!session?.user) {
        router.push("/Login");
        return;
      }

      const role = session.user?.role || session.user?.usertype || "user";
      const canAccess = role === "admin" || role === "superadmin";
      if (!canAccess) {
        router.push("/dashboard");
        return;
      }

      setUser(session.user);
      await fetchUsers();
      setLoading(false);
    };
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-500">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header
        isAdmin={user?.role === "admin" || user?.role === "superadmin" || user?.usertype === "admin" || user?.usertype === "superadmin"}
        handleLogout={async () => {
          await authClient.signOut();
          router.push("/Login");
        }}
        userName={user?.name || "User"}
        userAvatar={user?.image}
        userRole={user?.role || user?.usertype || "user"}
      />

      <main className="pt-20 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 w-fit">
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Ver Utilizadores</h1>
          <p className="text-gray-600 mt-2">Lista de todos os users</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">Total: {users.length} utilizadores</p>
            <button
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:bg-blue-400"
            >
              {loadingUsers ? "Atualizando..." : "Atualizar lista"}
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
                    <th className="py-3 pr-4">Criado em</th>
                    <th className="py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((listedUser) => {
                    const isCurrentUser = listedUser.id === user.id;
                    const isProtectedByRole = listedUser.isAdmin && !currentUserIsSuperAdmin;
                    const deleteBlocked = isCurrentUser || isProtectedByRole || deletingUserId === listedUser.id;
                    const roleLabel = listedUser.isSuperAdmin
                      ? "superadmin"
                      : listedUser.isAdmin
                        ? "admin"
                        : "user";

                    return (
                      <tr key={listedUser.id} className="border-b border-gray-100">
                        <td className="py-3 pr-4 text-gray-900">{listedUser.name || "Sem nome"}</td>
                        <td className="py-3 pr-4 text-gray-700">{listedUser.email}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${listedUser.isSuperAdmin ? "bg-purple-100 text-purple-700" : listedUser.isAdmin ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                            {roleLabel}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${listedUser.isAdmin ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {listedUser.isAdmin ? "Sim" : "Não"}
                          </span>
                        </td>
                        <td className="py-3 text-gray-700">
                          {listedUser.createdAt ? new Date(listedUser.createdAt).toLocaleDateString("pt-PT") : "-"}
                        </td>
                        <td className="py-3">
                          {listedUser.isAdmin && (
                            <button
                              onClick={() => openReportModal(listedUser)}
                              disabled={isCurrentUser}
                              className="mr-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                              title={
                                isCurrentUser
                                  ? "Não pode reportar a sua própria conta"
                                  : "Reportar admin"
                              }
                            >
                              Reportar
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(listedUser)}
                            disabled={deleteBlocked}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-red-300"
                            title={
                              isCurrentUser
                                ? "Não pode apagar a sua própria conta"
                                : isProtectedByRole
                                  ? "Apenas superadmin pode apagar contas admin e superadmin"
                                  : "Apagar conta"
                            }
                          >
                            {deletingUserId === listedUser.id ? "A apagar..." : "Apagar conta"}
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

      {reportTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Reportar admin</h2>
                <p className="text-sm text-gray-500">{reportTargetUser.name || "Sem nome"} · {reportTargetUser.email}</p>
              </div>
              <button onClick={closeReportModal} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
                <FaTimes className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleReportUser} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Descrição do report</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={5}
                  placeholder="Descreve o problema, comportamento ou motivo do report"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                />
              </div>

              {reportError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {reportError}
                </div>
              )}

              {reportSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {reportSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeReportModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting || reportDescription.trim().length < 5}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-orange-300"
                >
                  {reportSubmitting ? "A enviar..." : "Enviar report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

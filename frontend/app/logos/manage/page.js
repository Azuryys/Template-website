"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft,
  FaPlus,
  FaFolder,
  FaFolderOpen,
  FaPencilAlt,
  FaTrash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaImages,
} from "react-icons/fa";
import Header from "@/components/Header";
import { authClient } from "@/lib/auth-client";
import API from "@/lib/apiConfig";

// ---------- helpers ----------

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-full max-w-sm mx-4">
        <div className="flex items-start gap-3 mb-5">
          <FaExclamationTriangle className="text-amber-500 mt-0.5 shrink-0 w-5 h-5" />
          <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
          >
            Apagar
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type = "success" }) {
  const bg = type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700";
  const Icon = type === "success" ? FaCheckCircle : FaExclamationTriangle;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${bg}`}>
      <Icon className="w-4 h-4 shrink-0" />
      {message}
    </div>
  );
}

// ---------- página ----------

export default function LogoFoldersPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);

  // criação
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // renomear
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [renaming, setRenaming] = useState(false);

  // apagar
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // feedback
  const [toast, setToast] = useState(null); // { message, type }

  const router = useRouter();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadFolders = useCallback(async () => {
    try {
      setLoadingFolders(true);
      const res = await fetch(`${API}/api/logo-folders`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao carregar pastas");
      setFolders(data.folders || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: session } = await authClient.getSession();
        if (!session?.user) { router.push("/Login"); return; }
        const role = session.user?.role || session.user?.usertype || "user";
        if (role !== "admin" && role !== "superadmin") { router.push("/dashboard"); return; }
        setUser(session.user);
        await loadFolders();
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [router, loadFolders]);

  // ---- criar ----
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setCreating(true);
      const res = await fetch(`${API}/api/logo-folders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao criar pasta");
      setFolders((prev) => [...prev, data.folder]);
      setNewName("");
      showToast(`Pasta "${data.folder.name}" criada com sucesso`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCreating(false);
    }
  };

  // ---- renomear ----
  const startEdit = (folder) => {
    setEditingId(folder.id);
    setEditName(folder.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleRename = async (folderId) => {
    if (!editName.trim()) return;
    try {
      setRenaming(true);
      const res = await fetch(`${API}/api/logo-folders/${folderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao renomear pasta");
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, ...data.folder } : f))
      );
      cancelEdit();
      showToast("Pasta renomeada com sucesso");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRenaming(false);
    }
  };

  // ---- apagar ----
  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`${API}/api/logo-folders/${confirmDeleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao apagar pasta");
      setFolders((prev) => prev.filter((f) => f.id !== confirmDeleteId));
      setConfirmDeleteId(null);
      showToast("Pasta apagada com sucesso");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-500">A carregar...</div>
      </div>
    );
  }

  const folderToDelete = folders.find((f) => f.id === confirmDeleteId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header
        isAdmin={["admin", "superadmin"].includes(user?.role || user?.usertype)}
        handleLogout={async () => { await authClient.signOut(); router.push("/Login"); }}
        userName={user?.name || "User"}
        userAvatar={user?.image}
        userRole={user?.role || user?.usertype || "user"}
      />

      {confirmDeleteId && (
        <ConfirmModal
          message={
            folderToDelete?.logoCount > 0
              ? `Tens a certeza que queres apagar "${folderToDelete?.name}"? Esta pasta contém ${folderToDelete.logoCount} logo(s) que também serão apagados permanentemente.`
              : `Tens a certeza que queres apagar "${folderToDelete?.name}"?`
          }
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}

      <main className="pt-20 px-6 lg:px-8 max-w-4xl mx-auto pb-16">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/logos"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 w-fit transition-colors"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span className="text-sm">Voltar para logos</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Gerir Pastas</h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            Cria, renomeia ou apaga pastas dinâmicas para organizar os logos da aplicação.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* ---- lista de pastas ---- */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Pastas dinâmicas
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({folders.length})
                </span>
              </h2>
              <Link
                href="/logos/create"
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <FaImages className="w-3.5 h-3.5" />
                Ir para logos
              </Link>
            </div>

            {loadingFolders ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                A carregar pastas...
              </div>
            ) : folders.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <FaFolder className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Ainda não foram criadas pastas dinâmicas.</p>
                <p className="text-xs text-gray-300 mt-1">
                  Usa o formulário ao lado para criar a primeira.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {folders.map((folder) => (
                  <li key={folder.id} className="px-6 py-4 flex items-center gap-4 group">
                    <div className="shrink-0">
                      {editingId === folder.id ? (
                        <FaFolderOpen className="w-5 h-5 text-amber-400" />
                      ) : (
                        <FaFolder className="w-5 h-5 text-amber-300 group-hover:text-amber-400 transition-colors" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingId === folder.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(folder.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="flex-1 rounded-lg border border-blue-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                          <button
                            onClick={() => handleRename(folder.id)}
                            disabled={renaming}
                            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition"
                          >
                            {renaming ? "..." : "Guardar"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-gray-900 truncate">{folder.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">/BauerImages/Custom/{folder.slug}/</p>
                        </>
                      )}
                    </div>

                    {editingId !== folder.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-gray-400 mr-2">
                          {folder.logoCount} logo{folder.logoCount !== 1 ? "s" : ""}
                        </span>
                        <button
                          onClick={() => startEdit(folder)}
                          title="Renomear pasta"
                          className="rounded-lg p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                        >
                          <FaPencilAlt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(folder.id)}
                          title="Apagar pasta"
                          className="rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---- criar pasta ---- */}
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaPlus className="w-4 h-4 text-gray-500" />
                Nova Pasta
              </h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Nome da pasta
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Logos Verão 2025"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                  {newName.trim() && (
                    <p className="mt-1.5 text-xs text-gray-400 font-mono">
                      /BauerImages/Custom/{newName
                        .trim()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-zA-Z0-9\s-]/g, " ")
                        .trim()
                        .replace(/\s+/g, "_")
                        .toLowerCase()}/
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  {creating ? "A criar..." : "Criar Pasta"}
                </button>
              </form>
            </div>

            {/* info sobre pastas fixas */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <h3 className="text-xs font-semibold text-amber-800 mb-2 uppercase tracking-wide">
                Pastas do sistema
              </h3>
              <ul className="space-y-1.5">
                {[
                  { label: "Logo", path: "/BauerImages/Logo/" },
                  { label: "Logo_Audio", path: "/BauerImages/Logo_Audio/" },
                ].map((f) => (
                  <li key={f.label} className="flex items-center gap-2">
                    <FaFolder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-900">{f.label}</p>
                      <p className="text-xs font-mono text-amber-600">{f.path}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-amber-700 leading-relaxed">
                Estas pastas são geridas pelo sistema e não podem ser criadas, renomeadas ou apagadas aqui.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Header from "@/components/Header";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import Link from "next/link";

export default function TemplatesPage() {
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [error, setError] = useState("");
  const [deletingTemplateId, setDeletingTemplateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Lista os templates ja guardados na base de dados.
  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      setError("");

      const response = await fetch("http://localhost:3001/api/templates", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Falha ao carregar templates");
      }

      setTemplates(data.templates || []);
    } catch (err) {
      setError(err.message || "Erro ao carregar templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    // Valida sessao e permissao admin para aceder a pagina de templates.
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
      await fetchTemplates();
      setLoading(false);
    };
    checkSession();
  }, [router]);

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Tem a certeza que quer apagar o template ${template.name}?`)) {
      return;
    }

    try {
      setDeletingTemplateId(template.id);
      setError("");

      const response = await fetch(`http://localhost:3001/api/templates/${template.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível apagar o template");
      }

      setTemplates((prev) => prev.filter((item) => item.id !== template.id));
    } catch (err) {
      setError(err.message || "Erro ao apagar template");
    } finally {
      setDeletingTemplateId(null);
    }
  };

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
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 w-fit">
              <FaArrowLeft className="w-4 h-4" />
              <span className="text-sm">Voltar</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Criar Templates</h1>
            <p className="text-gray-600 mt-2">Gestão de templates guardados na base de dados</p>
          </div>
          <Link
            href="/templates/create"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <FaPlus className="h-3.5 w-3.5" />
            Criar template
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">Total: {templates.length} templates</p>
            <button
              onClick={fetchTemplates}
              disabled={loadingTemplates}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:bg-blue-400"
            >
              {loadingTemplates ? "Atualizando..." : "Atualizar lista"}
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loadingTemplates ? (
            <p className="text-gray-500">A carregar templates...</p>
          ) : templates.length === 0 ? (
            <p className="text-gray-500">Não há templates para mostrar.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {templates.map((template) => (
                <div key={template.id} className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition">
                  <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{template.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>{template.createdAt ? new Date(template.createdAt).toLocaleDateString("pt-PT") : "-"}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(template)}
                    disabled={deletingTemplateId === template.id}
                    className="mt-3 w-full rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-red-300"
                  >
                    {deletingTemplateId === template.id ? "A apagar..." : "Apagar template"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

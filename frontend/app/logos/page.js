"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Header from "@/components/Header";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import Link from "next/link";

export default function LogosPage() {
  const [user, setUser] = useState(null);
  const [logos, setLogos] = useState([]);
  const [loadingLogos, setLoadingLogos] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Lista os logos ja guardados na base de dados.
  const fetchLogos = async () => {
    try {
      setLoadingLogos(true);
      setError("");

      const response = await fetch("http://localhost:3001/api/logos", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Falha ao carregar logos");
      }

      setLogos(data.logos || []);
    } catch (err) {
      setError(err.message || "Erro ao carregar logos");
    } finally {
      setLoadingLogos(false);
    }
  };

  useEffect(() => {
    // Valida sessao e permissao admin para aceder a pagina de logos.
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
      await fetchLogos();
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
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 w-fit">
              <FaArrowLeft className="w-4 h-4" />
              <span className="text-sm">Voltar</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Adicionar Logos</h1>
            <p className="text-gray-600 mt-2">Gestao de logos guardados na base de dados</p>
          </div>
          <Link
            href="/logos/create"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <FaPlus className="h-3.5 w-3.5" />
            Criar logo
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-gray-600">Total guardado: {logos.length}</p>
            <button
              onClick={fetchLogos}
              disabled={loadingLogos}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-60"
            >
              {loadingLogos ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loadingLogos ? (
            <p className="text-gray-500">A carregar logos...</p>
          ) : logos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="text-gray-700 font-medium">Ainda nao existem logos guardados.</p>
              <p className="text-gray-500 text-sm mt-1">Clique em Criar logo para adicionar um dos ficheiros existentes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {logos.map((logo) => (
                <article key={logo.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="h-24 rounded-lg border border-gray-200 bg-white flex items-center justify-center mb-3 p-3">
                    <img src={logo.filePath} alt={logo.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{logo.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Categoria: {logo.category === "audio" ? "Audio" : "Logo"}</p>
                  <p className="text-xs text-gray-500">{logo.createdAt ? new Date(logo.createdAt).toLocaleString("pt-PT") : "-"}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

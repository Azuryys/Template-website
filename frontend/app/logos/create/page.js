"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import Header from "@/components/Header";
import { authClient } from "@/lib/auth-client";

export default function CreateLogoPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [library, setLibrary] = useState([]);
  const [category, setCategory] = useState("logo");
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Carrega os ficheiros reais das pastas Logo e Logo_Audio.
  const loadLibrary = async () => {
    try {
      setLoadingLibrary(true);
      setError("");

      const response = await fetch("http://localhost:3001/api/logos/library", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Falha ao carregar biblioteca de logos");
      }

      setLibrary(data.logos || []);
    } catch (err) {
      setError(err.message || "Erro ao carregar biblioteca de logos");
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    // Garante que apenas admin/superadmin entra na pagina de criar logos.
    const checkSession = async () => {
      try {
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
        await loadLibrary();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const filteredLogos = useMemo(
    () => library.filter((item) => item.category === category),
    [library, category]
  );

  useEffect(() => {
    // Se trocar de categoria, limpa a selecao antiga para evitar incoerencia.
    if (!selectedLogo || selectedLogo.category !== category) {
      setSelectedLogo(null);
      setName("");
    }
  }, [category, selectedLogo]);

  // Seleciona um ficheiro da biblioteca para guardar na base de dados.
  const handleSelectLogo = (logo) => {
    setSelectedLogo(logo);
    setError("");
    setSuccess("");
    if (!name) {
      setName(logo.name);
    }
  };

  // Cria/atualiza o registo do logo na base de dados.
  const handleSave = async (event) => {
    event.preventDefault();

    if (!selectedLogo) {
      setError("Selecione um logo antes de guardar.");
      return;
    }

    if (!name.trim()) {
      setError("Defina um nome para o logo.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("http://localhost:3001/api/logos", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          category: selectedLogo.category,
          filePath: selectedLogo.filePath,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Nao foi possivel guardar o logo");
      }

      setSuccess("Logo guardado com sucesso.");
      setTimeout(() => {
        router.push("/logos");
      }, 900);
    } catch (err) {
      setError(err.message || "Erro ao guardar logo");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
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
          <Link href="/logos" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 w-fit">
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar para logos</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Criar Logo</h1>
          <p className="text-gray-600 mt-2">Escolhe um ficheiro existente e guarda-o na base de dados.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                onClick={() => setCategory("logo")}
                className={`rounded-md px-3 py-2 text-sm font-medium ${category === "logo" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Pasta Logo
              </button>
              <button
                onClick={() => setCategory("audio")}
                className={`rounded-md px-3 py-2 text-sm font-medium ${category === "audio" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Pasta Logo_Audio
              </button>
            </div>

            {loadingLibrary ? (
              <p className="text-gray-500">A carregar biblioteca...</p>
            ) : filteredLogos.length === 0 ? (
              <p className="text-gray-500">Nao foram encontrados ficheiros nesta pasta.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredLogos.map((logo) => {
                  const isSelected = selectedLogo?.id === logo.id;
                  return (
                    <button
                      key={logo.id}
                      onClick={() => handleSelectLogo(logo)}
                      className={`rounded-lg border p-3 text-left transition ${isSelected ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                    >
                      <div className="h-16 rounded-md bg-white border border-gray-200 flex items-center justify-center p-2 mb-2">
                        <img src={logo.filePath} alt={logo.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <p className="text-xs font-medium text-gray-800 truncate">{logo.name}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
            <form onSubmit={handleSave} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Dados do logo</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Logo Mint Principal"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <p><strong>Categoria:</strong> {selectedLogo?.category || "-"}</p>
                <p className="mt-1 break-all"><strong>Ficheiro:</strong> {selectedLogo?.filePath || "-"}</p>
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
                  <FaCheckCircle className="h-4 w-4" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !selectedLogo}
                className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-gray-400"
              >
                {saving ? "A guardar..." : "Guardar logo"}
              </button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  );
}

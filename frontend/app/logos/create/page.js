"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaCheckCircle, FaFolder, FaCog } from "react-icons/fa";
import Header from "@/components/Header";
import { authClient } from "@/lib/auth-client";
import API from "@/lib/apiConfig";

// Pastas fixas do sistema (legacy). Sempre presentes.
const FIXED_CATEGORIES = [
  { id: "logo",  label: "Pasta Logo",       category: "logo"  },
  { id: "audio", label: "Pasta Logo_Audio", category: "audio" },
];

export default function CreateLogoPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // biblioteca de ficheiros (pastas fixas)
  const [library, setLibrary] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  // pastas dinâmicas
  const [dynamicFolders, setDynamicFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);

  // seleção de "onde guardar"
  // activeTab: "logo" | "audio" | <folderId>
  const [activeTab, setActiveTab] = useState("logo");

  const [selectedLogo, setSelectedLogo] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // upload
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");

  const router = useRouter();

  // ---- carregar biblioteca (ficheiros das pastas fixas) ----
  const loadLibrary = useCallback(async () => {
    try {
      setLoadingLibrary(true);
      const res = await fetch(`${API}/api/logos/library`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar biblioteca");
      setLibrary(data.logos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingLibrary(false);
    }
  }, []);

  // ---- carregar pastas dinâmicas ----
  const loadDynamicFolders = useCallback(async () => {
    try {
      setLoadingFolders(true);
      const res = await fetch(`${API}/api/logo-folders`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar pastas");
      setDynamicFolders(data.folders || []);
    } catch {
      // silencioso – não bloqueia o resto
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
        await Promise.all([loadLibrary(), loadDynamicFolders()]);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [router, loadLibrary, loadDynamicFolders]);

  // logos filtrados consoante a tab ativa (só para pastas fixas)
  const fixedCategory = FIXED_CATEGORIES.find((c) => c.id === activeTab);
  const filteredLogos = useMemo(() => {
    if (!fixedCategory) return [];
    return library.filter((item) => item.category === fixedCategory.category);
  }, [library, fixedCategory]);

  // ao mudar de tab, limpa seleção
  useEffect(() => {
    setSelectedLogo(null);
    setName("");
  }, [activeTab]);

  const handleSelectLogo = (logo) => {
    setSelectedLogo(logo);
    setError(""); setSuccess("");
    if (!name) setName(logo.name);
  };

  // ---- upload ----
  const handleUploadFile = async (event) => {
    event.preventDefault();
    if (!uploadFile) { setError("Selecione um ficheiro."); return; }
    if (!uploadName.trim()) { setError("Defina um nome."); return; }

    // Determina para onde vai o upload
    const isDynamic = !fixedCategory; // tab ativa é uma pasta dinâmica
    const activeDynFolder = isDynamic
      ? dynamicFolders.find((f) => f.id === activeTab)
      : null;

    try {
      setUploadingFile(true);
      setError(""); setSuccess("");

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", uploadName.trim());
      // Para pastas fixas mantemos o campo "category"; para dinâmicas passamos folderId
      if (activeDynFolder) {
        formData.append("category", "logo"); // valor neutro exigido pelo backend
        formData.append("folderId", activeDynFolder.id);
      } else {
        formData.append("category", fixedCategory.category);
      }

      const res = await fetch(`${API}/api/logos/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json")
        ? await res.json()
        : { error: "Resposta inválida do servidor" };

      if (!res.ok) throw new Error(data?.error || "Erro no upload");

      setSuccess("Logo enviado com sucesso!");
      if (data?.logo) {
        setSelectedLogo(data.logo);
        setName(data.logo.name || uploadName.trim());
      }
      setUploadFile(null);
      setUploadName("");
      await loadLibrary();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  // ---- guardar na BD ----
  const handleSave = async (event) => {
    event.preventDefault();
    if (!selectedLogo) { setError("Selecione um logo antes de guardar."); return; }
    if (!name.trim()) { setError("Defina um nome."); return; }

    const isDynamic = !fixedCategory;
    const activeDynFolder = isDynamic
      ? dynamicFolders.find((f) => f.id === activeTab)
      : null;

    try {
      setSaving(true);
      setError(""); setSuccess("");

      const body = {
        name: name.trim(),
        category: selectedLogo.category || "logo",
        filePath: selectedLogo.filePath,
        ...(activeDynFolder ? { folderId: activeDynFolder.id } : {}),
      };

      const res = await fetch(`${API}/api/logos`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível guardar o logo");

      setSuccess("Logo guardado com sucesso.");
      setTimeout(() => router.push("/logos"), 900);
    } catch (err) {
      setError(err.message);
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

  const isAdminUser = ["admin", "superadmin"].includes(user?.role || user?.usertype);
  const activeDynFolder = dynamicFolders.find((f) => f.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header
        isAdmin={isAdminUser}
        handleLogout={async () => { await authClient.signOut(); router.push("/Login"); }}
        userName={user?.name || "User"}
        userAvatar={user?.image}
        userRole={user?.role || user?.usertype || "user"}
      />

      <main className="pt-20 px-6 lg:px-8 max-w-7xl mx-auto pb-16">
        <div className="mb-8">
          <Link href="/logos" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 w-fit">
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar para logos</span>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Criar Logo</h1>
              <p className="text-gray-600 mt-2">Escolhe um ficheiro e guarda-o na base de dados.</p>
            </div>
            <Link
              href="/logos/manage"
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
            >
              <FaCog className="w-4 h-4" />
              Gerir Pastas
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

            {/* upload */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Fazer Upload de Novo Logo</h2>
              <form onSubmit={handleUploadFile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="Ex: Logo Novo"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pasta de destino</label>
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white"
                    >
                      <optgroup label="Pastas do sistema">
                        {FIXED_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </optgroup>
                      {dynamicFolders.length > 0 && (
                        <optgroup label="Pastas dinâmicas">
                          {dynamicFolders.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ficheiro de Imagem</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-sm file:text-white file:font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploadingFile || !uploadFile}
                  className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-blue-400 hover:bg-blue-700"
                >
                  {uploadingFile ? "A enviar..." : "Enviar Logo"}
                </button>
              </form>
            </div>

            {/* tabs de seleção */}
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ou Selecione da Biblioteca</h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {/* pastas fixas */}
              {FIXED_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveTab(c.id)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    activeTab === c.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}

              {/* pastas dinâmicas */}
              {!loadingFolders && dynamicFolders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveTab(f.id)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                    activeTab === f.id ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                  }`}
                >
                  <FaFolder className="w-3 h-3" />
                  {f.name}
                </button>
              ))}

              {/* link para gerir pastas */}
              <Link
                href="/logos/manage"
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-dashed border-gray-300 transition"
              >
                <FaCog className="w-3 h-3" />
                Gerir pastas
              </Link>
            </div>

            {/* grid de logos — só para pastas fixas */}
            {fixedCategory ? (
              loadingLibrary ? (
                <p className="text-gray-500">A carregar biblioteca...</p>
              ) : filteredLogos.length === 0 ? (
                <p className="text-gray-500">Não foram encontrados ficheiros nesta pasta.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredLogos.map((logo) => {
                    const isSelected = selectedLogo?.id === logo.id;
                    return (
                      <button
                        key={logo.id}
                        onClick={() => handleSelectLogo(logo)}
                        className={`rounded-lg border p-3 text-left transition ${
                          isSelected ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        <div className="h-16 rounded-md bg-white border border-gray-200 flex items-center justify-center p-2 mb-2">
                          <img src={logo.filePath} alt={logo.name} className="max-h-full max-w-full object-contain" />
                        </div>
                        <p className="text-xs font-medium text-gray-800 truncate">{logo.name}</p>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              /* pasta dinâmica selecionada */
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
                <FaFolder className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">{activeDynFolder?.name}</p>
                  <p className="text-xs text-amber-700 mt-0.5 font-mono">
                    /BauerImages/Custom/{activeDynFolder?.slug}/
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    Os logos enviados por upload serão guardados nesta pasta dinâmica.
                    A pré-visualização de ficheiros existentes em pastas dinâmicas estará disponível em breve.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* painel lateral */}
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
                <div className="mb-3 rounded-md border border-gray-200 bg-white p-2">
                  {selectedLogo?.filePath ? (
                    <img
                      src={selectedLogo.filePath}
                      alt={selectedLogo.name || "Logo selecionado"}
                      className="h-28 w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center text-sm text-gray-400">
                      Nenhuma logo selecionada
                    </div>
                  )}
                </div>
                <p><strong>Categoria:</strong> {selectedLogo?.category || "-"}</p>
                <p className="mt-1 break-all"><strong>Ficheiro:</strong> {selectedLogo?.filePath || "-"}</p>
                {activeDynFolder && (
                  <p className="mt-1 flex items-center gap-1">
                    <FaFolder className="w-3 h-3 text-amber-400" />
                    <strong>Pasta:</strong> {activeDynFolder.name}
                  </p>
                )}
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import Header from "@/components/Header";
import { authClient } from "@/lib/auth-client";

export default function CreateTemplatePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [library, setLibrary] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const router = useRouter();

  // Carrega os ficheiros reais da pasta Templates.
  const loadLibrary = async () => {
    try {
      setLoadingLibrary(true);
      setError("");

      const response = await fetch("http://localhost:3001/api/templates/library", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Falha ao carregar biblioteca de templates");
      }

      setLibrary(data.templates || []);
    } catch (err) {
      setError(err.message || "Erro ao carregar biblioteca de templates");
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    // Garante que apenas admin/superadmin entra na pagina de criar templates.
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

  // Seleciona um ficheiro da biblioteca para guardar na base de dados.
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setError("");
    setSuccess("");
    if (!name) {
      setName(template.name);
    }
    if (!description) {
      setDescription(template.description || "");
    }
  };

  // Faz upload de um novo ficheiro template para a biblioteca.
  const handleUploadFile = async (event) => {
    event.preventDefault();

    if (!uploadFile) {
      setError("Selecione um ficheiro para enviar.");
      return;
    }

    if (!uploadName.trim()) {
      setError("Defina um nome para o template.");
      return;
    }

    try {
      setUploadingFile(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", uploadName.trim());
      formData.append("description", uploadDescription.trim());

      const response = await fetch("http://localhost:3001/api/templates/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível fazer upload do template");
      }

      setSuccess("Template enviado com sucesso!");
      setUploadFile(null);
      setUploadName("");
      setUploadDescription("");
      await loadLibrary();
      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(err.message || "Erro ao fazer upload do template");
    } finally {
      setUploadingFile(false);
    }
  };

  // Cria/atualiza o registo do template na base de dados.
  const handleSave = async (event) => {
    event.preventDefault();

    if (!selectedTemplate) {
      setError("Selecione um template antes de guardar.");
      return;
    }

    if (!name.trim()) {
      setError("Defina um nome para o template.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("http://localhost:3001/api/templates", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          filePath: selectedTemplate.filePath,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível guardar o template");
      }

      setSuccess("Template guardado com sucesso.");
      setTimeout(() => {
        router.push("/templates");
      }, 900);
    } catch (err) {
      setError(err.message || "Erro ao guardar template");
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
          <Link href="/templates" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 w-fit">
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar para templates</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Criar Template</h1>
          <p className="text-gray-600 mt-2">Faça upload de um novo arquivo ou escolha um existente.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Fazer Upload de Novo Template</h2>
              <form onSubmit={handleUploadFile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="Ex: Template Banner 1920x1080"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição (Opcional)</label>
                  <textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Ex: Template para banners de 1920x1080"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ficheiro (JSON/SVG)</label>
                  <input
                    type="file"
                    accept=".json,.svg"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-sm file:text-white file:font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploadingFile || !uploadFile}
                  className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-blue-400 hover:bg-blue-700"
                >
                  {uploadingFile ? "A enviar..." : "Enviar Template"}
                </button>
              </form>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ou Selecione da Biblioteca</h2>

            {loadingLibrary ? (
              <p className="text-gray-500">A carregar biblioteca...</p>
            ) : library.length === 0 ? (
              <p className="text-gray-500">Não foram encontrados templates na biblioteca.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {library.map((template) => {
                  const isSelected = selectedTemplate?.id === template.id;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`rounded-lg border p-4 text-left transition ${isSelected ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                    >
                      <p className="font-medium text-gray-800 truncate">{template.name}</p>
                      {template.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
            <form onSubmit={handleSave} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Dados do Template</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Banner Principal"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (Opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o template"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <p className="break-all"><strong>Ficheiro:</strong> {selectedTemplate?.filePath || "-"}</p>
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
                disabled={saving || !selectedTemplate}
                className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-gray-400"
              >
                {saving ? "A guardar..." : "Guardar Template"}
              </button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  );
}

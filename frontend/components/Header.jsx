"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  FaUserPlus, 
  FaShieldAlt, 
  FaSignOutAlt, 
  FaChevronDown,
  FaCamera,
  FaLayerGroup,
  FaTimes,
  FaSpinner
} from "react-icons/fa";

export default function Header({ isAdmin, handleLogout, userName = "User", userAvatar = null, onAvatarUpdate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const getInitials = (name) => {
    return name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
  };

  const initials = getInitials(userName);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setUploadError(null);
    
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Imagem demasiado grande (máx 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!previewImage) return;
    
    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await fetch(`http://localhost:5000/api/user/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ image: previewImage }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao guardar");
      }

      if (onAvatarUpdate) {
        onAvatarUpdate(data.avatarUrl);
      }
      
      setShowUploadModal(false);
      setPreviewImage(null);
      
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setShowUploadModal(false);
    setPreviewImage(null);
    setUploadError(null);
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? "bg-white/95 border-b border-gray-200" : "bg-white border-b border-gray-100"
        }`}
        style={{
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
          boxShadow: isScrolled ? '0 4px 30px rgba(0, 0, 0, 0.05)' : 'none'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <FaLayerGroup className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 tracking-tight">
                Banner Creator
              </span>
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`flex items-center gap-3 pl-1 pr-2 py-1 rounded-full transition-all duration-200 ${
                  menuOpen ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <div 
                  className="relative w-9 h-9 rounded-full overflow-hidden cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUploadModal(true);
                    setMenuOpen(false);
                  }}
                >
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white font-medium text-sm">
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <FaCamera className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{isAdmin ? "Administrador" : "Utilizador"}</p>
                </div>

                <FaChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              <div className={`absolute right-0 top-full mt-2 w-72 transition-all duration-200 ${
                menuOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1 pointer-events-none"
              }`}>
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div 
                        className="relative w-11 h-11 rounded-full overflow-hidden cursor-pointer group flex-shrink-0"
                        onClick={() => { setShowUploadModal(true); setMenuOpen(false); }}
                      >
                        {userAvatar ? (
                          <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white font-semibold">
                            {initials}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaCamera className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{userName}</h3>
                        <p className="text-xs text-gray-500">{isAdmin ? "Administrador" : "Utilizador"}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Clique na foto para alterar</p>
                  </div>

                  <div className="p-2">
                    {isAdmin && (
                      <>
                        <Link href="/Register" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                          <FaUserPlus className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Criar Usuário</span>
                        </Link>
                        <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                          <FaShieldAlt className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">Painel Admin</span>
                        </Link>
                        <div className="h-px bg-gray-100 my-1 mx-2" />
                      </>
                    )}
                    <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200">
                      <FaSignOutAlt className="w-4 h-4" />
                      <span className="text-sm font-medium">Terminar Sessão</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Alterar Foto de Perfil</h3>
              <button onClick={handleCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <FaTimes className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : userAvatar ? (
                    <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white text-2xl font-semibold">
                      {initials}
                    </div>
                  )}
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {isUploading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaCamera className="w-4 h-4" />}
                  <span className="text-sm font-medium">{isUploading ? "A processar..." : "Escolher Foto"}</span>
                </button>

                {uploadError && <p className="text-xs text-red-500 text-center">{uploadError}</p>}
                <p className="text-xs text-gray-400 text-center">JPG, PNG. Máx 2MB.</p>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button onClick={handleCancel} disabled={isUploading} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                Cancelar
              </button>
              <button 
                onClick={handleSaveAvatar} 
                disabled={!previewImage || isUploading} 
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? <FaSpinner className="w-4 h-4 animate-spin mx-auto" /> : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
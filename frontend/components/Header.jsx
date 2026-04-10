import { useState } from "react";
import Link from "next/link";
import { FaUserPlus, FaShieldAlt, FaSignOutAlt } from "react-icons/fa";

export default function Header({ isAdmin, handleLogout, userName = "User" }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Gerar iniciais do nome
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(userName);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="text-xl font-bold text-gray-900">Banner Creator</div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {/* Avatar Circle */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {initials}
            </div>
          </button>

          {/* Dropdown menu */}
          <div
            className={`absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl transition-all duration-300 overflow-hidden z-50 ${
              menuOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95"
            }`}
          >
            {/* User Info Section */}
            <div className="px-6 py-6 border-b border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {initials}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{userName}</h3>
                  <p className="text-sm text-gray-500">Admin Account</p>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="px-4 py-4 space-y-2">
              {isAdmin && (
                <Link
                  href="/Register"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-3 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  <FaUserPlus className="w-5 h-5" />
                  <span>Criar Usuário</span>
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  <FaShieldAlt className="w-5 h-5" />
                  <span>Painel Admin</span>
                </Link>
              )}
            </div>

            {/* Logout Section */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                <FaSignOutAlt className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Close menu when clicking outside */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}

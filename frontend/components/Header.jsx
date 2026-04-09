import { useState } from "react";
import Link from "next/link";
import { FaRegUserCircle } from "react-icons/fa";

export default function Header({ isAdmin, handleLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div>{/* Logo here */}</div>

        {/* Burger button and dropdown menu */}
        <div className="relative flex items-center gap-3">
          <FaRegUserCircle className="w-6 h-6 text-gray-700" />
          <button
            className="flex flex-col justify-center items-center w-10 h-10 gap-1.5"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
          <span
            className={`block w-6 h-0.5 bg-gray-700 transition-transform duration-300 ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-gray-700 transition-opacity duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-gray-700 transition-transform duration-300 ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>

        {/* Dropdown menu */}
        <div
          className={`absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-300 ${
            menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        >
          <div className="flex flex-col gap-0 min-w-max">
            {isAdmin && (
                <Link
                    href="/Register"
                    onClick={() => setMenuOpen(false)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-t-lg transition text-center"
                >
                    + Criar Usuário
                </Link>
            )}
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className={`bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 transition ${
                isAdmin ? "rounded-b-lg" : "rounded-lg"
              }`}
            >
              Sair
            </button>
          </div>
        </div>
        </div>
      </div>
    </header>
  );
}
